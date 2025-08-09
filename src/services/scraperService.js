const puppeteer = require('puppeteer');
const DrivingTestSlot = require('../models/DrivingTestSlot');
const TestCenter = require('../models/TestCenter');
const logger = require('../utils/logger');
const { publishMessage } = require('./messageQueue');

class ScraperService {
  constructor() {
    this.browser = null;
    this.isRunning = false;
    this.config = {
      headless: process.env.NODE_ENV === 'production',
      timeout: 30000,
      delayMin: parseInt(process.env.SCRAPING_DELAY_MIN) || 30000,
      delayMax: parseInt(process.env.SCRAPING_DELAY_MAX) || 60000,
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SCRAPERS) || 5,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    };
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      logger.info('Browser initialized for scraping');
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }

  generateRandomDelay() {
    return Math.floor(Math.random() * (this.config.delayMax - this.config.delayMin + 1)) + this.config.delayMin;
  }

  async scrapeTestCenter(center, testType = 'practical') {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent(this.config.userAgent);
      await page.setViewport({ width: 1366, height: 768 });

      // Set reasonable timeouts
      page.setDefaultTimeout(this.config.timeout);
      page.setDefaultNavigationTimeout(this.config.timeout);

      const foundSlots = [];
      let errors = [];

      // Navigate to DVSA booking page for this center
      const dvsaUrl = this.buildDVSAUrl(center, testType);
      
      logger.info(`Scraping ${center.name} for ${testType} tests`, {
        centerId: center.center_id,
        url: dvsaUrl
      });

      await page.goto(dvsaUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      // Wait for the page to load
      await this.randomDelay(2000, 5000);

      // Check if we're blocked or redirected
      const currentUrl = page.url();
      if (currentUrl.includes('blocked') || currentUrl.includes('captcha')) {
        throw new Error('Blocked by anti-bot measures');
      }

      // Look for available slots
      const slots = await this.extractSlots(page, center, testType);
      foundSlots.push(...slots);

      // Store found slots in database
      if (foundSlots.length > 0) {
        await this.storeSlots(foundSlots);
        
        // Publish message for alert processing
        await publishMessage('slot_alerts', {
          type: 'new_slots',
          testType,
          centerId: center.center_id,
          slots: foundSlots.length
        });
      }

      logger.logScraping(center, testType, foundSlots.length, errors);
      
      return {
        success: true,
        slotsFound: foundSlots.length,
        errors
      };

    } catch (error) {
      logger.error(`Scraping error for ${center.name}:`, error);
      
      return {
        success: false,
        slotsFound: 0,
        errors: [error.message]
      };
    } finally {
      await page.close();
    }
  }

  buildDVSAUrl(center, testType) {
    const baseUrl = process.env.DVSA_BASE_URL || 'https://driverpracticaltest.dvsa.gov.uk';
    
    // This would need to be adapted based on the actual DVSA URL structure
    // For now, returning a placeholder URL
    return `${baseUrl}/application?testType=${testType}&center=${center.center_id}`;
  }

  async extractSlots(page, center, testType) {
    try {
      // Wait for slots to load
      await page.waitForSelector('.appointment-slot, .available-slot, .slot-available', { 
        timeout: 10000 
      });

      // Extract slot information
      const slots = await page.evaluate((centerId, testType) => {
        const slotElements = document.querySelectorAll('.appointment-slot, .available-slot, .slot-available');
        const slots = [];

        slotElements.forEach(element => {
          const dateElement = element.querySelector('.date, .slot-date');
          const timeElement = element.querySelector('.time, .slot-time');
          
          if (dateElement && timeElement) {
            const dateText = dateElement.textContent.trim();
            const timeText = timeElement.textContent.trim();
            
            // Parse date and time
            const date = this.parseDate(dateText);
            const time = this.parseTime(timeText);
            
            if (date && time) {
              slots.push({
                center_id: centerId,
                test_type: testType,
                date: date,
                time: time,
                available: true
              });
            }
          }
        });

        return slots;
      }, center.center_id, testType);

      return slots || [];

    } catch (error) {
      logger.warn(`No slots found for ${center.name}: ${error.message}`);
      return [];
    }
  }

  parseDate(dateText) {
    // Implementation would depend on DVSA date format
    // Example: "Monday, 15 March 2024" -> "2024-03-15"
    try {
      const date = new Date(dateText);
      return date.toISOString().split('T')[0];
    } catch (error) {
      logger.warn(`Failed to parse date: ${dateText}`);
      return null;
    }
  }

  parseTime(timeText) {
    // Implementation would depend on DVSA time format
    // Example: "10:30 AM" -> "10:30"
    try {
      const time24 = this.convertTo24Hour(timeText);
      return time24;
    } catch (error) {
      logger.warn(`Failed to parse time: ${timeText}`);
      return null;
    }
  }

  convertTo24Hour(timeStr) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours}:${minutes}`;
  }

  async storeSlots(slots) {
    try {
      await DrivingTestSlot.bulkCreate(slots);
      logger.info(`Stored ${slots.length} slots in database`);
    } catch (error) {
      logger.error('Failed to store slots:', error);
      throw error;
    }
  }

  async randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async scrapeAllCenters(testType = 'practical') {
    if (this.isRunning) {
      logger.warn('Scraping already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      await this.initialize();
      
      const testCenters = await TestCenter.findAll();
      logger.info(`Starting scraping for ${testCenters.length} test centers`);

      const results = [];
      const batchSize = this.config.maxConcurrent;
      
      for (let i = 0; i < testCenters.length; i += batchSize) {
        const batch = testCenters.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (center) => {
          try {
            const result = await this.scrapeTestCenter(center, testType);
            
            // Random delay between requests to avoid being blocked
            await this.randomDelay(this.config.delayMin, this.config.delayMax);
            
            return { center: center.name, ...result };
          } catch (error) {
            logger.error(`Batch scraping error for ${center.name}:`, error);
            return { 
              center: center.name, 
              success: false, 
              slotsFound: 0, 
              errors: [error.message] 
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        logger.info(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(testCenters.length / batchSize)}`);
        
        // Delay between batches
        if (i + batchSize < testCenters.length) {
          await this.randomDelay(5000, 10000);
        }
      }

      const totalSlots = results.reduce((sum, result) => sum + result.slotsFound, 0);
      const successfulScrapes = results.filter(r => r.success).length;

      logger.info(`Scraping completed: ${successfulScrapes}/${testCenters.length} centers, ${totalSlots} slots found`);

      return {
        totalCenters: testCenters.length,
        successfulScrapes,
        totalSlotsFound: totalSlots,
        results
      };

    } catch (error) {
      logger.error('Scraping service error:', error);
      throw error;
    } finally {
      this.isRunning = false;
      await this.close();
    }
  }
}

// Singleton instance
const scraperService = new ScraperService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down scraper service...');
  await scraperService.close();
});

process.on('SIGINT', async () => {
  logger.info('Shutting down scraper service...');
  await scraperService.close();
});

module.exports = scraperService;
