#!/usr/bin/env node

const { messageQueue } = require('./services/messageQueue');
const schedulerService = require('./services/schedulerService');
const alertWorker = require('./workers/alertWorker');
const logger = require('./utils/logger');

async function startServices() {
  try {
    logger.info('Starting DVSlot services...');

    // Connect to message queue
    logger.info('Connecting to message queue...');
    const mqConnected = await messageQueue.connect();
    if (!mqConnected) {
      throw new Error('Failed to connect to message queue');
    }

    // Start alert worker
    logger.info('Starting alert worker...');
    await alertWorker.start();

    // Start scheduler service
    logger.info('Starting scheduler service...');
    schedulerService.start();

    logger.info('All DVSlot services started successfully');

    // Keep the process running
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start DVSlot services:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop scheduler service
    logger.info('Stopping scheduler service...');
    schedulerService.stop();

    // Stop alert worker
    logger.info('Stopping alert worker...');
    alertWorker.stop();

    // Close message queue connection
    logger.info('Closing message queue connection...');
    await messageQueue.close();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the services
if (require.main === module) {
  startServices();
}

module.exports = {
  startServices,
  gracefulShutdown
};
