const cron = require('node-cron');
const scraperService = require('./scraperService');
const alertService = require('./alertService');
const DrivingTestSlot = require('../models/DrivingTestSlot');
const { publishMessage } = require('./messageQueue');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Scheduler service already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting scheduler service');

    // Scrape all centers every 5 minutes for practical tests
    this.scheduleJob('scrape-practical', '*/5 * * * *', async () => {
      logger.info('Starting scheduled practical test scraping');
      try {
        await scraperService.scrapeAllCenters('practical');
      } catch (error) {
        logger.error('Scheduled practical test scraping failed:', error);
      }
    });

    // Scrape all centers every 10 minutes for theory tests
    this.scheduleJob('scrape-theory', '*/10 * * * *', async () => {
      logger.info('Starting scheduled theory test scraping');
      try {
        await scraperService.scrapeAllCenters('theory');
      } catch (error) {
        logger.error('Scheduled theory test scraping failed:', error);
      }
    });

    // Process pending alerts every minute
    this.scheduleJob('process-alerts', '* * * * *', async () => {
      try {
        await alertService.processPendingAlerts();
      } catch (error) {
        logger.error('Failed to process pending alerts:', error);
      }
    });

    // Clean up old slots daily at 2 AM
    this.scheduleJob('cleanup-slots', '0 2 * * *', async () => {
      logger.info('Starting daily slot cleanup');
      try {
        const deletedCount = await DrivingTestSlot.cleanupOldSlots();
        logger.info(`Cleaned up ${deletedCount} old slots`);
      } catch (error) {
        logger.error('Daily slot cleanup failed:', error);
      }
    });

    // Clean up expired subscriptions daily at 3 AM
    this.scheduleJob('cleanup-subscriptions', '0 3 * * *', async () => {
      logger.info('Starting subscription cleanup');
      try {
        await alertService.cleanupExpiredSubscriptions();
      } catch (error) {
        logger.error('Subscription cleanup failed:', error);
      }
    });

    // Clean up old alerts weekly on Sunday at 4 AM
    this.scheduleJob('cleanup-alerts', '0 4 * * 0', async () => {
      logger.info('Starting weekly alert cleanup');
      try {
        const deletedCount = await require('../models/UserAlert').cleanupOldAlerts(90);
        logger.info(`Cleaned up ${deletedCount} old alerts`);
      } catch (error) {
        logger.error('Weekly alert cleanup failed:', error);
      }
    });

    // System health check every 30 minutes
    this.scheduleJob('health-check', '*/30 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    });

    // Generate system stats every hour
    this.scheduleJob('system-stats', '0 * * * *', async () => {
      try {
        const stats = await alertService.getAlertStats();
        logger.info('System statistics:', stats);
      } catch (error) {
        logger.error('Failed to generate system stats:', error);
      }
    });

    logger.info(`Scheduled ${this.jobs.size} cron jobs`);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    for (const [name, job] of this.jobs) {
      job.destroy();
      logger.info(`Stopped job: ${name}`);
    }
    
    this.jobs.clear();
    logger.info('Scheduler service stopped');
  }

  scheduleJob(name, cronExpression, taskFunction) {
    if (this.jobs.has(name)) {
      logger.warn(`Job ${name} already exists, replacing...`);
      this.jobs.get(name).destroy();
    }

    const job = cron.schedule(cronExpression, async () => {
      const startTime = Date.now();
      logger.info(`Starting scheduled job: ${name}`);

      try {
        await taskFunction();
        const duration = Date.now() - startTime;
        logger.info(`Completed scheduled job: ${name} (${duration}ms)`);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Failed scheduled job: ${name} (${duration}ms)`, error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/London'
    });

    this.jobs.set(name, job);
    logger.info(`Scheduled job: ${name} with cron expression: ${cronExpression}`);
  }

  async runJobNow(jobName) {
    if (!this.jobs.has(jobName)) {
      throw new Error(`Job ${jobName} not found`);
    }

    logger.info(`Manually triggering job: ${jobName}`);
    
    try {
      // Get the task function from the scheduled job
      // Note: This is a simplified approach - in production you'd want better job management
      switch (jobName) {
        case 'scrape-practical':
          await scraperService.scrapeAllCenters('practical');
          break;
        case 'scrape-theory':
          await scraperService.scrapeAllCenters('theory');
          break;
        case 'process-alerts':
          await alertService.processPendingAlerts();
          break;
        case 'cleanup-slots':
          await DrivingTestSlot.cleanupOldSlots();
          break;
        case 'cleanup-subscriptions':
          await alertService.cleanupExpiredSubscriptions();
          break;
        case 'health-check':
          await this.performHealthCheck();
          break;
        default:
          throw new Error(`Manual execution not supported for job: ${jobName}`);
      }

      logger.info(`Manually triggered job completed: ${jobName}`);
      return { success: true };
    } catch (error) {
      logger.error(`Manually triggered job failed: ${jobName}`, error);
      return { success: false, error: error.message };
    }
  }

  async performHealthCheck() {
    logger.info('Performing system health check');

    const healthStatus = {
      timestamp: new Date().toISOString(),
      database: false,
      messageQueue: false,
      scraper: false,
      notifications: false
    };

    try {
      // Check database connection
      const db = require('../config/database');
      await db.raw('SELECT 1');
      healthStatus.database = true;
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    try {
      // Check message queue
      const { messageQueue } = require('./messageQueue');
      healthStatus.messageQueue = messageQueue.isHealthy();
    } catch (error) {
      logger.error('Message queue health check failed:', error);
    }

    try {
      // Check scraper service
      healthStatus.scraper = !scraperService.isRunning; // Should not be running continuously
    } catch (error) {
      logger.error('Scraper health check failed:', error);
    }

    try {
      // Check notification services
      // This is a basic check - in production you'd want more comprehensive tests
      healthStatus.notifications = true;
    } catch (error) {
      logger.error('Notification health check failed:', error);
    }

    const overallHealth = Object.values(healthStatus).every(status => 
      typeof status === 'boolean' ? status : true
    );

    if (overallHealth) {
      logger.info('System health check passed', healthStatus);
    } else {
      logger.warn('System health check failed', healthStatus);
      
      // Send alert to administrators
      await publishMessage('admin_alerts', {
        type: 'health_check_failed',
        status: healthStatus,
        timestamp: healthStatus.timestamp
      });
    }

    return healthStatus;
  }

  getJobStatus() {
    const status = {
      isRunning: this.isRunning,
      totalJobs: this.jobs.size,
      jobs: {}
    };

    for (const [name, job] of this.jobs) {
      status.jobs[name] = {
        running: job.getStatus() === 'scheduled'
      };
    }

    return status;
  }

  pauseJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      logger.info(`Paused job: ${jobName}`);
      return true;
    }
    return false;
  }

  resumeJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      logger.info(`Resumed job: ${jobName}`);
      return true;
    }
    return false;
  }
}

// Singleton instance
const schedulerService = new SchedulerService();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down scheduler service...');
  schedulerService.stop();
});

process.on('SIGINT', () => {
  logger.info('Shutting down scheduler service...');
  schedulerService.stop();
});

module.exports = schedulerService;
