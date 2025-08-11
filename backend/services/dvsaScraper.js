const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class DVSAScraperService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    this.browser = null;
    this.isRunning = false;
    
    this.config = {
      headless: process.env.NODE_ENV === 'production',
      timeout: parseInt(process.env.SCRAPER_TIMEOUT) || 60000,
      delayMin: parseInt(process.env.SCRAPING_DELAY_MIN) || 5000,
      delayMax: parseInt(process.env.SCRAPING_DELAY_MAX) || 15000,
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SCRAPERS) || 3,
      retryAttempts: 3,
    };

    // Known DVSA test center IDs (these would need to be mapped to actual DVSA center IDs)
    this.testCenterMappings = new Map();
  }

  async initialize() {
    if (!this.browser) {
      logger.info('🚀 Starting DVSA Scraper Browser...');
      
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
        ],
        defaultViewport: {
          width: 1366,
          height: 768,
        },
      });

      logger.info('✅ DVSA Scraper Browser initialized');
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('🔒 DVSA Scraper Browser closed');
    }
  }

  async getTestCenters() {
    try {
      const { data: testCenters, error } = await this.supabase
        .from('test_centers')
        .select('*')
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch test centers: ${error.message}`);
      }

      return testCenters || [];
    } catch (error) {
      logger.error('❌ Failed to get test centers:', error);
      return [];
    }
  }

  async scrapeTestCenter(testCenter, retryCount = 0) {
    const page = await this.browser.newPage();
    
    try {
      // Set random user agent to avoid detection
      const userAgent = new UserAgent();
      await page.setUserAgent(userAgent.toString());
      
      // Set viewport
      await page.setViewport({
        width: 1366 + Math.floor(Math.random() * 200),
        height: 768 + Math.floor(Math.random() * 200),
      });

      // Block unnecessary resources to speed up scraping
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['stylesheet', 'image', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      logger.info(`🔍 Scraping ${testCenter.name} (${testCenter.city})`);

      // Navigate to DVSA booking page
      const searchUrl = this.buildSearchUrl(testCenter);
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      // Random delay to mimic human behavior
      await this.randomDelay(2000, 5000);

      // Check if we're on the right page and not blocked
      await this.handleAntiBot(page);

      // Extract available slots
      const slots = await this.extractSlots(page, testCenter);
      
      if (slots.length > 0) {
        await this.saveSlots(testCenter.id, slots);
        logger.info(`✅ Found ${slots.length} slots at ${testCenter.name}`);
      } else {
        logger.info(`ℹ️  No slots found at ${testCenter.name}`);
      }

      return {
        success: true,
        center: testCenter.name,
        slotsFound: slots.length,
      };

    } catch (error) {
      logger.error(`❌ Error scraping ${testCenter.name}:`, error.message);

      // Retry logic
      if (retryCount < this.config.retryAttempts) {
        logger.info(`🔄 Retrying ${testCenter.name} (attempt ${retryCount + 1})`);
        await this.randomDelay(5000, 10000);
        return this.scrapeTestCenter(testCenter, retryCount + 1);
      }

      return {
        success: false,
        center: testCenter.name,
        error: error.message,
        slotsFound: 0,
      };
    } finally {
      await page.close();
    }
  }

  buildSearchUrl(testCenter) {
    // This would build the actual DVSA URL for checking appointments
    // The exact URL structure depends on DVSA's current system
    const baseUrl = process.env.DVSA_BASE_URL;
    
    // For demonstration - real implementation would need actual DVSA URL structure
    return `${baseUrl}?postcode=${encodeURIComponent(testCenter.postcode)}&test-type=practical`;
  }

  async handleAntiBot(page) {
    try {
      // Check for common anti-bot measures
      const title = await page.title();
      const url = page.url();
      
      if (title.toLowerCase().includes('blocked') || 
          url.includes('captcha') || 
          title.toLowerCase().includes('access denied')) {
        throw new Error('Blocked by anti-bot measures');
      }

      // Look for CAPTCHA
      const captchaExists = await page.$('iframe[src*="recaptcha"]') !== null ||
                           await page.$('.captcha') !== null ||
                           await page.$('#captcha') !== null;

      if (captchaExists) {
        throw new Error('CAPTCHA detected');
      }

      // Check for rate limiting
      const rateLimited = await page.$('.rate-limit') !== null ||
                         title.toLowerCase().includes('too many requests');

      if (rateLimited) {
        throw new Error('Rate limited');
      }

    } catch (error) {
      logger.warn(`⚠️  Anti-bot check failed: ${error.message}`);
      throw error;
    }
  }

  async extractSlots(page, testCenter) {
    try {
      // Wait for the slots to load (adjust selector based on actual DVSA structure)
      await page.waitForTimeout(3000);

      // Extract slots - this needs to be adapted to actual DVSA HTML structure
      const slots = await page.evaluate((centerName) => {
        const slotElements = document.querySelectorAll(
          '.appointment-slot, .available-slot, .test-slot, [data-slot], .booking-slot'
        );
        
        const extractedSlots = [];
        
        slotElements.forEach(element => {
          try {
            // Extract date and time (adjust selectors based on actual DVSA HTML)
            const dateText = element.querySelector('.date, .slot-date, [data-date]')?.textContent?.trim();
            const timeText = element.querySelector('.time, .slot-time, [data-time]')?.textContent?.trim();
            const priceText = element.querySelector('.price, .cost, [data-price]')?.textContent?.trim();
            
            if (dateText && timeText) {
              extractedSlots.push({
                dateText,
                timeText,
                priceText: priceText || '£62.00', // Default practical test price
                centerName,
                extractedAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.warn('Error extracting slot:', error);
          }
        });
        
        return extractedSlots;
      }, testCenter.name);

      // Process and validate the extracted slots
      const processedSlots = [];
      
      for (const rawSlot of slots) {
        const processedSlot = this.processSlotData(rawSlot, testCenter);
        if (processedSlot) {
          processedSlots.push(processedSlot);
        }
      }

      return processedSlots;

    } catch (error) {
      logger.warn(`⚠️  Failed to extract slots: ${error.message}`);
      return [];
    }
  }

  processSlotData(rawSlot, testCenter) {
    try {
      // Parse date
      const date = this.parseDate(rawSlot.dateText);
      if (!date) return null;

      // Parse time  
      const time = this.parseTime(rawSlot.timeText);
      if (!time) return null;

      // Parse price
      const price = this.parsePrice(rawSlot.priceText);

      return {
        test_center_id: testCenter.id,
        date,
        time,
        test_type: 'practical',
        price,
        is_available: true,
        last_checked_at: new Date().toISOString(),
        source: 'dvsa_scraper'
      };

    } catch (error) {
      logger.warn('Failed to process slot data:', error);
      return null;
    }
  }

  parseDate(dateText) {
    try {
      // Handle various date formats DVSA might use
      const dateFormats = [
        /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/
      ];

      for (const format of dateFormats) {
        const match = dateText.match(format);
        if (match) {
          const date = new Date(dateText);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }

      return null;
    } catch (error) {
      logger.warn(`Failed to parse date: ${dateText}`);
      return null;
    }
  }

  parseTime(timeText) {
    try {
      // Handle time formats like "10:30 AM", "14:30", etc.
      const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];
        const period = timeMatch[3]?.toUpperCase();

        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }

      return null;
    } catch (error) {
      logger.warn(`Failed to parse time: ${timeText}`);
      return null;
    }
  }

  parsePrice(priceText) {
    try {
      const priceMatch = priceText?.match(/£?(\d+(?:\.\d{2})?)/);
      return priceMatch ? parseFloat(priceMatch[1]) : 62.00; // Default price
    } catch (error) {
      return 62.00;
    }
  }

  async saveSlots(testCenterId, slots) {
    try {
      // Clear old slots for this center
      await this.supabase
        .from('driving_test_slots')
        .delete()
        .eq('test_center_id', testCenterId);

      // Insert new slots
      if (slots.length > 0) {
        const { error } = await this.supabase
          .from('driving_test_slots')
          .insert(slots);

        if (error) {
          throw new Error(`Failed to save slots: ${error.message}`);
        }
      }

      logger.info(`💾 Saved ${slots.length} slots for center ${testCenterId}`);
    } catch (error) {
      logger.error('❌ Failed to save slots:', error);
      throw error;
    }
  }

  async randomDelay(min = 1000, max = 5000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async scrapeAllCenters() {
    if (this.isRunning) {
      logger.warn('⚠️  Scraping already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      await this.initialize();
      
      const testCenters = await this.getTestCenters();
      logger.info(`🎯 Starting COMPREHENSIVE DVSA scraping for ${testCenters.length} test centers`);
      logger.info(`🗺️  Coverage: ALL UK regions (England, Scotland, Wales, N. Ireland)`);

      const results = [];
      const regionStats = {};
      
      // Enhanced configuration for 350+ centers
      const batchSize = 2; // Smaller batches for stability with large dataset
      const maxConcurrentPerBatch = 1; // Sequential processing for reliability
      const delayBetweenCenters = 5000; // 5 second delay minimum
      const delayBetweenBatches = 15000; // 15 second pause between batches

      for (let i = 0; i < testCenters.length; i += batchSize) {
        const batch = testCenters.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(testCenters.length / batchSize);
        
        logger.info(`🔄 Processing batch ${batchNumber}/${totalBatches} (Centers: ${batch.map(c => c.name).join(', ')})`);
        
        // Process batch with enhanced error handling
        for (const center of batch) {
          try {
            const result = await this.scrapeTestCenter(center);
            results.push(result);
            
            // Track regional statistics
            if (!regionStats[center.region]) {
              regionStats[center.region] = { successful: 0, failed: 0, slots: 0 };
            }
            
            if (result.success) {
              regionStats[center.region].successful++;
              regionStats[center.region].slots += result.slotsFound;
              logger.info(`✅ ${center.name} (${center.region}): ${result.slotsFound} slots`);
            } else {
              regionStats[center.region].failed++;
              logger.warn(`❌ ${center.name} (${center.region}): Failed - ${result.error}`);
            }
            
            // Smart delay between centers
            await this.randomDelay(delayBetweenCenters, delayBetweenCenters + 3000);
            
          } catch (error) {
            logger.error(`💥 Critical error for ${center.name}:`, error.message);
            
            if (!regionStats[center.region]) {
              regionStats[center.region] = { successful: 0, failed: 0, slots: 0 };
            }
            regionStats[center.region].failed++;
            
            results.push({
              center: center.name,
              region: center.region,
              success: false,
              slotsFound: 0,
              error: error.message
            });
          }
        }

        // Progress update every 25 batches (roughly every 50 centers)
        if (batchNumber % 25 === 0) {
          const progress = Math.round((batchNumber / totalBatches) * 100);
          const successfulSoFar = results.filter(r => r.success).length;
          const totalSlotsSoFar = results.reduce((sum, r) => sum + r.slotsFound, 0);
          
          logger.info(`\n📊 PROGRESS UPDATE: ${progress}% Complete`);
          logger.info(`   ✅ Successful: ${successfulSoFar} centers`);
          logger.info(`   🎯 Slots found: ${totalSlotsSoFar}`);
          logger.info(`   ⏰ Estimated completion: ${Math.round(((Date.now() - startTime) / batchNumber) * (totalBatches - batchNumber) / 60000)} min\n`);
        }
        
        // Enhanced delay between batches (longer for large remaining work)
        if (i + batchSize < testCenters.length) {
          const remainingBatches = totalBatches - batchNumber;
          const pauseTime = remainingBatches > 100 ? 20000 : // 20s for lots of work remaining
                           remainingBatches > 50 ? 15000 :   // 15s for medium work
                           10000;                             // 10s for final stretch
          
          logger.debug(`⏱️  Batch pause: ${pauseTime/1000}s (${remainingBatches} batches remaining)`);
          await this.randomDelay(pauseTime, pauseTime + 5000);
        }
      }

      const totalSlots = results.reduce((sum, result) => sum + result.slotsFound, 0);
      const successfulScrapes = results.filter(r => r.success).length;
      const failedScrapes = results.filter(r => !r.success).length;
      const duration = Math.round((Date.now() - startTime) / 1000);
      const durationMinutes = Math.round(duration / 60);
      const avgSlotsPerCenter = successfulScrapes > 0 ? Math.round(totalSlots / successfulScrapes) : 0;

      // Final comprehensive report
      logger.info(`\n🎉 COMPREHENSIVE UK SCRAPING COMPLETED`);
      logger.info(`=====================================`);
      logger.info(`⏰ Total Duration: ${durationMinutes} minutes (${duration}s)`);
      logger.info(`🏢 Total Centers: ${testCenters.length}`);
      logger.info(`✅ Successful: ${successfulScrapes} centers`);
      logger.info(`❌ Failed: ${failedScrapes} centers`);
      logger.info(`📈 Success Rate: ${Math.round((successfulScrapes / testCenters.length) * 100)}%`);
      logger.info(`🎯 Total Slots Found: ${totalSlots}`);
      logger.info(`📊 Average Slots/Center: ${avgSlotsPerCenter}`);
      
      // Regional breakdown
      logger.info(`\n📍 REGIONAL PERFORMANCE:`);
      Object.entries(regionStats).forEach(([region, stats]) => {
        const total = stats.successful + stats.failed;
        const successRate = total > 0 ? Math.round((stats.successful / total) * 100) : 0;
        logger.info(`   ${region}: ${stats.successful}/${total} centers (${successRate}%), ${stats.slots} slots`);
      });

      return {
        success: true,
        totalCenters: testCenters.length,
        successfulScrapes,
        failedScrapes,
        successRate: Math.round((successfulScrapes / testCenters.length) * 100),
        totalSlotsFound: totalSlots,
        avgSlotsPerCenter,
        duration,
        durationMinutes,
        regionStats,
        results
      };

    } catch (error) {
      logger.error('❌ Critical scraping service error:', error);
      throw error;
    } finally {
      this.isRunning = false;
      await this.close();
    }
  }
}

module.exports = new DVSAScraperService();
