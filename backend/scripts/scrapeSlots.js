#!/usr/bin/env node

/**
 * Manual slot scraping script
 * Run with: node scripts/scrapeSlots.js
 */

require('dotenv').config();
const dvsaScraper = require('../services/dvsaScraper');
const logger = require('../utils/logger');

async function manualScrape() {
  logger.info('🚀 Starting manual DVSA slot scraping...');
  
  const startTime = Date.now();
  
  try {
    const results = await dvsaScraper.scrapeAllCenters();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    logger.info('📊 Manual Scraping Results:');
    logger.info(`  Duration: ${duration} seconds`);
    logger.info(`  Total Centers: ${results.totalCenters}`);
    logger.info(`  Successful Scrapes: ${results.successfulScrapes}`);
    logger.info(`  Total Slots Found: ${results.totalSlotsFound}`);
    logger.info(`  Success Rate: ${((results.successfulScrapes / results.totalCenters) * 100).toFixed(1)}%`);
    
    // Show detailed results
    const successfulResults = results.results.filter(r => r.success && r.slotsFound > 0);
    if (successfulResults.length > 0) {
      logger.info('🎯 Centers with available slots:');
      successfulResults.forEach(result => {
        logger.info(`  - ${result.center}: ${result.slotsFound} slots`);
      });
    }
    
    const failedResults = results.results.filter(r => !r.success);
    if (failedResults.length > 0) {
      logger.warn('⚠️  Centers with scraping errors:');
      failedResults.forEach(result => {
        logger.warn(`  - ${result.center}: ${result.error}`);
      });
    }
    
    logger.info('✅ Manual scraping completed successfully');
    
  } catch (error) {
    logger.error('❌ Manual scraping failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
DVSlot Manual Scraper

Usage: node scripts/scrapeSlots.js [options]

Options:
  --help, -h    Show this help message
  
Examples:
  node scripts/scrapeSlots.js          # Run full scraping
  `);
  process.exit(0);
}

// Run manual scraping
manualScrape();
