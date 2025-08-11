#!/usr/bin/env node

/**
 * Test the DVSA scraper functionality
 * Run with: node scripts/testScraper.js
 */

require('dotenv').config();
const dvsaScraper = require('../services/dvsaScraper');
const logger = require('../utils/logger');

async function testScraper() {
  logger.info('🧪 Starting DVSA Scraper Test...');
  
  try {
    // Test single center scraping
    logger.info('📍 Testing single test center scraping...');
    
    const testCenters = await dvsaScraper.getTestCenters();
    if (testCenters.length === 0) {
      logger.error('❌ No test centers found in database');
      return;
    }

    // Test first center
    const testCenter = testCenters[0];
    logger.info(`🎯 Testing scraper with: ${testCenter.name} (${testCenter.city})`);
    
    const result = await dvsaScraper.scrapeTestCenter(testCenter);
    
    if (result.success) {
      logger.info(`✅ Test successful: ${result.slotsFound} slots found`);
    } else {
      logger.error(`❌ Test failed: ${result.error}`);
    }

    // Test full scraping (first 5 centers only for testing)
    logger.info('🔄 Testing batch scraping (first 5 centers)...');
    
    const limitedCenters = testCenters.slice(0, 5);
    let totalSlots = 0;
    
    for (const center of limitedCenters) {
      const result = await dvsaScraper.scrapeTestCenter(center);
      totalSlots += result.slotsFound;
      
      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    logger.info(`🎉 Batch test completed: ${totalSlots} total slots found across ${limitedCenters.length} centers`);
    
  } catch (error) {
    logger.error('❌ Scraper test failed:', error);
  } finally {
    await dvsaScraper.close();
    process.exit(0);
  }
}

// Run test
testScraper();
