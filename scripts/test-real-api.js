#!/usr/bin/env node

/**
 * Test Real DVSA API Connection
 * This script tests the real DVSA booking website connection and slot detection
 */

const scraperService = require('../src/services/scraperService');
const TestCenter = require('../src/models/TestCenter');
const logger = require('../src/utils/logger');

async function testRealApiConnection() {
  try {
    logger.info('Testing real DVSA API connection...');
    
    // Get a sample test center
    const testCenters = await TestCenter.findAll();
    if (testCenters.length === 0) {
      logger.error('No test centers found in database. Please run migrations and seeds first.');
      return;
    }

    const sampleCenter = testCenters[0];
    logger.info(`Testing with center: ${sampleCenter.name} (${sampleCenter.postcode})`);

    // Test scraping for this center
    const result = await scraperService.scrapeTestCenter(sampleCenter, 'practical');
    
    logger.info('Scraping test completed:', {
      success: result.success,
      slotsFound: result.slotsFound,
      errors: result.errors
    });

    if (result.success) {
      logger.info('✅ Successfully connected to real DVSA website');
      logger.info(`Found ${result.slotsFound} available slots`);
    } else {
      logger.warn('⚠️ Connection test failed:', result.errors);
    }

  } catch (error) {
    logger.error('❌ Test failed:', error);
  } finally {
    await scraperService.close();
    process.exit(0);
  }
}

// Run the test
if (require.main === module) {
  testRealApiConnection();
}

module.exports = { testRealApiConnection };