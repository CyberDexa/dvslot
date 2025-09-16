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
    
    // Updated to use real DVSA booking URL structure
    // The real DVSA system uses center IDs and test type parameters
    return `${baseUrl}/application?testType=${testType}&testCentreId=${center.center_id}&driving-licence-postcode=${center.postcode}`;
  }

  async extractSlots(page, center, testType) {
    try {
      // Wait for slots to load - using more realistic DVSA selectors
      await page.waitForSelector('.SlotPicker-day, .appointment-calendar, .available-appointments, .test-slots', { 
        timeout: 10000 
      });

      // Extract slot information using real DVSA page structure
      const slots = await page.evaluate((centerId, testType) => {
        // Look for various possible DVSA slot containers
        const slotSelectors = [
          '.SlotPicker-day .SlotPicker-time',
          '.appointment-calendar .available-slot',
          '.available-appointments .appointment-time',
          '.test-slots .slot-time',
          '.book-appointment .time-slot'
        ];
        
        let slotElements = [];
        for (const selector of slotSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            slotElements = Array.from(elements);
            break;
          }
        }

        const slots = [];
        const cancelledSlots = [];

        slotElements.forEach(element => {
          try {
            // Look for date information
            const dateElement = element.closest('[data-date]') || 
                               element.querySelector('[data-date]') ||
                               element.closest('.date-container') ||
                               element.previousElementSibling;
            
            const timeElement = element.querySelector('.time, .slot-time') || element;
            
            // Check if slot is cancelled or unavailable
            const isCancelled = element.classList.contains('cancelled') ||
                               element.classList.contains('unavailable') ||
                               element.textContent.toLowerCase().includes('cancelled') ||
                               element.textContent.toLowerCase().includes('not available');
            
            let dateText = '';
            if (dateElement) {
              dateText = dateElement.getAttribute('data-date') || 
                        dateElement.textContent.trim();
            }
            
            const timeText = timeElement.textContent.trim();
            
            if (dateText && timeText) {
              const date = this.parseDate(dateText);
              const time = this.parseTime(timeText);
              
              if (date && time) {
                const slotData = {
                  center_id: centerId,
                  test_type: testType,
                  date: date,
                  time: time,
                  available: !isCancelled
                };

                if (isCancelled) {
                  slotData.cancelled_date = new Date().toISOString();
                  slotData.cancellation_reason = 'Detected as cancelled during scraping';
                  cancelledSlots.push(slotData);
                } else {
                  slots.push(slotData);
                }
              }
            }
          } catch (err) {
            console.warn('Error processing slot element:', err);
          }
        });

        return { available: slots, cancelled: cancelledSlots };
      }, center.center_id, testType);

      // Process cancelled slots
      if (slots.cancelled && slots.cancelled.length > 0) {
        await this.processCancelledSlots(slots.cancelled);
      }

      return slots.available || [];

    } catch (error) {
      logger.warn(`No slots found for ${center.name}: ${error.message}`);
      return [];
    }
  }

  parseDate(dateText) {
    // Handle various DVSA date formats
    try {
      // Remove common prefixes and clean the text
      let cleanDate = dateText.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s*/i, '')
                              .replace(/^\w+day,?\s*/i, '')
                              .trim();
      
      // Handle formats like "15 March 2024", "15/03/2024", "2024-03-15"
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
        // UK format: DD/MM/YYYY
        const [day, month, year] = cleanDate.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        // Already in ISO format
        return cleanDate;
      }
      
      // Try parsing as natural date
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      logger.warn(`Could not parse date: ${dateText}`);
      return null;
    } catch (error) {
      logger.warn(`Failed to parse date: ${dateText}`, error);
      return null;
    }
  }

  parseTime(timeText) {
    // Handle various DVSA time formats
    try {
      let cleanTime = timeText.replace(/[^\d:APM\s]/g, '').trim();
      
      // Handle formats like "10:30", "10:30 AM", "1030"
      if (/^\d{4}$/.test(cleanTime)) {
        // Format like "1030" -> "10:30"
        return `${cleanTime.slice(0, 2)}:${cleanTime.slice(2, 4)}`;
      }
      
      if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
        // Already in HH:MM format
        return cleanTime;
      }
      
      if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(cleanTime)) {
        // Convert 12-hour to 24-hour format
        return this.convertTo24Hour(cleanTime);
      }
      
      logger.warn(`Could not parse time: ${timeText}`);
      return null;
    } catch (error) {
      logger.warn(`Failed to parse time: ${timeText}`, error);
      return null;
    }
  }

  convertTo24Hour(timeStr) {
    try {
      const cleanTime = timeStr.trim().toUpperCase();
      const [time, modifier] = cleanTime.split(/\s+(AM|PM)/);
      
      if (!modifier) {
        // No AM/PM modifier, assume it's already 24-hour
        return time;
      }
      
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      
      if (modifier === 'PM' && hours !== 12) {
        hours += 12;
      } else if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
      logger.warn(`Failed to convert time to 24-hour: ${timeStr}`, error);
      return timeStr; // Return original if conversion fails
    }
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

  async processCancelledSlots(cancelledSlots) {
    try {
      // Process cancelled slots by marking them as cancelled in the database
      for (const slot of cancelledSlots) {
        // Find existing slot and mark as cancelled
        const existingSlot = await DrivingTestSlot.findByCenter(slot.center_id, slot.test_type);
        const matchingSlot = existingSlot.find(s => 
          s.date === slot.date && s.time === slot.time
        );
        
        if (matchingSlot) {
          await DrivingTestSlot.markCancelled(matchingSlot.slot_id, slot.cancellation_reason);
          logger.info(`Marked slot ${matchingSlot.slot_id} as cancelled`);
          
          // Publish cancellation message
          await publishMessage('slot_alerts', {
            type: 'slot_cancelled',
            testType: slot.test_type,
            centerId: slot.center_id,
            slotId: matchingSlot.slot_id,
            date: slot.date,
            time: slot.time,
            reason: slot.cancellation_reason
          });
        }
      }
      
      logger.info(`Processed ${cancelledSlots.length} cancelled slots`);
    } catch (error) {
      logger.error('Failed to process cancelled slots:', error);
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
