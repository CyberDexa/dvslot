#!/usr/bin/env node

/**
 * DVSlot Alert Scheduler
 * 
 * Automated scheduling service for processing user alerts
 * Integrates with the scraping and alert notification systems
 */

const cron = require('node-cron');
const DVSlotAlertSystem = require('./alert-system');

class DVSlotScheduler {
  constructor() {
    this.alertSystem = new DVSlotAlertSystem();
    this.isRunning = false;
    this.schedule = '*/15 * * * *'; // Every 15 minutes
    this.lastRun = null;
    this.totalRuns = 0;
    this.totalAlertsSent = 0;
  }

  async initialize() {
    console.log('📅 DVSlot Alert Scheduler');
    console.log('========================\n');

    // Initialize alert system
    const initialized = await this.alertSystem.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize alert system');
    }

    console.log(`⏰ Scheduler configured to run: ${this.schedule}`);
    console.log('   Every 15 minutes during business hours\n');
    
    return true;
  }

  async processScheduledAlerts() {
    if (this.isRunning) {
      console.log('⚠️ Alert processing already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    this.totalRuns++;

    try {
      console.log(`\n🔔 Scheduled Alert Processing #${this.totalRuns}`);
      console.log(`⏰ Started at: ${this.lastRun.toISOString()}`);
      
      const startTime = Date.now();
      await this.alertSystem.processAlerts();
      const duration = Math.round((Date.now() - startTime) / 1000);

      this.totalAlertsSent += this.alertSystem.alertsSent || 0;

      console.log(`✅ Scheduled run completed in ${duration} seconds`);
      console.log(`📊 Total runs: ${this.totalRuns}`);
      console.log(`📧 Total alerts sent: ${this.totalAlertsSent}\n`);

    } catch (error) {
      console.error('❌ Scheduled alert processing failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    console.log('🚀 Starting DVSlot Alert Scheduler...');
    
    // Schedule alert processing every 15 minutes
    // Only during business hours (8 AM - 8 PM UK time) on weekdays
    const task = cron.schedule(this.schedule, async () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Skip if outside business hours or on weekends
      if (day === 0 || day === 6 || hour < 8 || hour > 20) {
        console.log(`⏰ Skipping run - outside business hours (${now.toLocaleString()})`);
        return;
      }

      await this.processScheduledAlerts();
    }, {
      scheduled: false
    });

    // Start the cron task
    task.start();

    console.log('✅ Alert scheduler started successfully');
    console.log(`⏰ Next run will be at: ${this.getNextRunTime()}`);
    console.log('📍 Press Ctrl+C to stop\n');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n📴 Shutting down alert scheduler...');
      task.destroy();
      process.exit(0);
    });

    // Keep the process alive
    setInterval(() => {
      // Show alive status every hour
      const now = new Date();
      if (now.getMinutes() === 0) {
        console.log(`💚 Scheduler alive - ${now.toLocaleString()} (Runs: ${this.totalRuns}, Alerts: ${this.totalAlertsSent})`);
      }
    }, 60000);
  }

  getNextRunTime() {
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(Math.ceil(next.getMinutes() / 15) * 15);
    next.setSeconds(0);
    return next.toLocaleString();
  }

  async runOnce() {
    console.log('🔄 Running alert processing once...');
    await this.processScheduledAlerts();
  }

  async showStatus() {
    console.log('\n📊 DVSlot Scheduler Status');
    console.log('=========================');
    console.log(`Running: ${this.isRunning ? '✅ Yes' : '❌ No'}`);
    console.log(`Total Runs: ${this.totalRuns}`);
    console.log(`Total Alerts Sent: ${this.totalAlertsSent}`);
    console.log(`Last Run: ${this.lastRun ? this.lastRun.toLocaleString() : 'Never'}`);
    console.log(`Next Run: ${this.getNextRunTime()}`);
    
    // Show alert system stats
    await this.alertSystem.showSystemStats();
  }
}

// CLI Commands
async function main() {
  const scheduler = new DVSlotScheduler();
  const command = process.argv[2];

  switch (command) {
    case 'start':
      await scheduler.initialize();
      scheduler.start();
      break;

    case 'run':
      await scheduler.initialize();
      await scheduler.runOnce();
      break;

    case 'status':
      await scheduler.initialize();
      await scheduler.showStatus();
      break;

    default:
      console.log('DVSlot Alert Scheduler');
      console.log('=====================');
      console.log('Usage:');
      console.log('  node alert-scheduler.js start    - Start the alert scheduler (runs continuously)');
      console.log('  node alert-scheduler.js run      - Run alert processing once');
      console.log('  node alert-scheduler.js status   - Show scheduler status');
      console.log('');
      console.log('The scheduler runs every 15 minutes during UK business hours (8 AM - 8 PM, Mon-Fri)');
      break;
  }
}

// Export for use as module
module.exports = DVSlotScheduler;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
