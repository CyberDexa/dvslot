const cron = require('node-cron');
const dvsaScraper = require('../services/dvsaScraper');
const logger = require('../utils/logger');

class Scheduler {
  constructor() {
    this.tasks = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      logger.warn('⚠️  Scheduler already initialized');
      return;
    }

    logger.info('🕐 Initializing DVSA Scraping Scheduler...');
    
    // Main scraping task - every 30 minutes during business hours
    const scrapeInterval = process.env.SCRAPE_INTERVAL_MINUTES || 30;
    const scrapingSchedule = `*/${scrapeInterval} 8-18 * * 1-5`; // Every 30 min, 8AM-6PM, Mon-Fri
    
    this.tasks.set('mainScraping', cron.schedule(scrapingSchedule, async () => {
      logger.info('🚀 Starting scheduled DVSA scraping...');
      
      try {
        const results = await dvsaScraper.scrapeAllCenters();
        logger.logScrapingStats(results);
        
        // Trigger alerts if new slots found
        if (results.totalSlotsFound > 0) {
          await this.triggerSlotAlerts(results);
        }
        
      } catch (error) {
        logger.error('❌ Scheduled scraping failed:', error);
      }
    }, {
      scheduled: false // Start manually
    }));

    // Intensive scraping during peak times (morning and evening)
    this.tasks.set('peakScraping', cron.schedule('*/10 7-9,17-19 * * 1-5', async () => {
      logger.info('⚡ Starting peak-time intensive scraping...');
      
      try {
        await dvsaScraper.scrapeAllCenters();
      } catch (error) {
        logger.error('❌ Peak scraping failed:', error);
      }
    }, {
      scheduled: false
    }));

    // Weekend scraping (reduced frequency)
    this.tasks.set('weekendScraping', cron.schedule('0 */2 9-17 * * 0,6', async () => {
      logger.info('🏖️  Starting weekend scraping...');
      
      try {
        await dvsaScraper.scrapeAllCenters();
      } catch (error) {
        logger.error('❌ Weekend scraping failed:', error);
      }
    }, {
      scheduled: false
    }));

    // Cleanup old slots daily at 2 AM
    this.tasks.set('cleanup', cron.schedule('0 2 * * *', async () => {
      logger.info('🧹 Starting daily cleanup...');
      
      try {
        await this.cleanupOldSlots();
        logger.info('✅ Daily cleanup completed');
      } catch (error) {
        logger.error('❌ Daily cleanup failed:', error);
      }
    }, {
      scheduled: false
    }));

    // Health check every hour
    this.tasks.set('healthCheck', cron.schedule('0 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('❌ Health check failed:', error);
      }
    }, {
      scheduled: false
    }));

    this.isInitialized = true;
    logger.info('✅ Scheduler initialized with tasks:', Array.from(this.tasks.keys()));
  }

  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    logger.info('🚀 Starting scheduled tasks...');
    
    this.tasks.forEach((task, name) => {
      task.start();
      logger.info(`✅ Started task: ${name}`);
    });

    // Run initial scraping after 30 seconds
    setTimeout(async () => {
      logger.info('🏃 Running initial scraping...');
      try {
        await dvsaScraper.scrapeAllCenters();
      } catch (error) {
        logger.error('❌ Initial scraping failed:', error);
      }
    }, 30000);
  }

  async stop() {
    logger.info('🛑 Stopping scheduler...');
    
    this.tasks.forEach((task, name) => {
      task.stop();
      logger.info(`⏹️  Stopped task: ${name}`);
    });
  }

  async triggerSlotAlerts(scrapingResults) {
    try {
      logger.info('🔔 Triggering slot alerts...');
      
      // This would integrate with your alert/notification system
      // For now, just log the alert trigger
      const centersWithSlots = scrapingResults.results
        .filter(r => r.success && r.slotsFound > 0)
        .map(r => r.center);

      if (centersWithSlots.length > 0) {
        logger.info(`🎯 Alerts triggered for ${centersWithSlots.length} centers:`, centersWithSlots);
        
        // TODO: Implement actual alert sending
        // - Query user alerts from database
        // - Match slots with user preferences
        // - Send notifications (email, push, SMS)
      }
      
    } catch (error) {
      logger.error('❌ Failed to trigger slot alerts:', error);
    }
  }

  async cleanupOldSlots() {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Remove slots older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('driving_test_slots')
        .delete()
        .lt('last_checked_at', sevenDaysAgo);

      if (error) {
        throw error;
      }

      logger.info('🧹 Cleaned up slots older than 7 days');
      
    } catch (error) {
      logger.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  async performHealthCheck() {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Check database connectivity
      const { data, error } = await supabase
        .from('test_centers')
        .select('count(*)')
        .limit(1);

      if (error) {
        throw error;
      }

      // Check recent scraping activity
      const { data: recentSlots } = await supabase
        .from('driving_test_slots')
        .select('last_checked_at')
        .order('last_checked_at', { ascending: false })
        .limit(1);

      const lastUpdate = recentSlots?.[0]?.last_checked_at;
      const hoursOld = lastUpdate ? 
        (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60) : 
        999;

      if (hoursOld > 2) {
        logger.warn(`⚠️  Last slot update was ${hoursOld.toFixed(1)} hours ago`);
      }

      logger.info(`💚 Health check passed - Database connected, last update: ${hoursOld.toFixed(1)}h ago`);
      
    } catch (error) {
      logger.error('❌ Health check failed:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      tasks: Array.from(this.tasks.entries()).map(([name, task]) => ({
        name,
        running: task.getStatus() === 'scheduled'
      }))
    };
  }
}

module.exports = new Scheduler();
