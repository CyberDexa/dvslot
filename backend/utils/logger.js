const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Add scraping specific logging methods
logger.logScraping = (center, testType, slotsFound, errors = []) => {
  const message = `Scraping ${center.name}: ${slotsFound} ${testType} slots found`;
  
  if (errors.length > 0) {
    logger.warn(`${message} (with ${errors.length} errors)`);
    errors.forEach(error => logger.warn(`  - ${error}`));
  } else {
    logger.info(message);
  }
};

logger.logScrapingStats = (stats) => {
  logger.info('📊 Scraping Statistics:');
  logger.info(`  Total Centers: ${stats.totalCenters}`);
  logger.info(`  Successful: ${stats.successfulScrapes}`);
  logger.info(`  Total Slots Found: ${stats.totalSlotsFound}`);
  logger.info(`  Duration: ${stats.duration}s`);
  logger.info(`  Success Rate: ${((stats.successfulScrapes / stats.totalCenters) * 100).toFixed(1)}%`);
};

module.exports = logger;
