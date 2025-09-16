const { consumeQueue } = require('../services/messageQueue');
const alertService = require('../services/alertService');
const pushNotificationService = require('../services/pushNotificationService');
const emailService = require('../services/emailService');
const User = require('../models/User');
const logger = require('../utils/logger');

class AlertWorker {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Alert worker already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting alert worker');

    try {
      // Start consuming the slot_alerts queue
      await consumeQueue('slot_alerts', this.processSlotAlert.bind(this), {
        prefetch: 10
      });

      // Start consuming the notifications queue
      await consumeQueue('notifications', this.processNotification.bind(this), {
        prefetch: 20
      });

      // Start consuming push notifications queue
      await consumeQueue('push_notifications', this.processPushNotification.bind(this), {
        prefetch: 50
      });

      // Start consuming email notifications queue
      await consumeQueue('email_notifications', this.processEmailNotification.bind(this), {
        prefetch: 10
      });

      logger.info('Alert worker started successfully');
    } catch (error) {
      logger.error('Failed to start alert worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async processSlotAlert(message) {
    try {
      logger.info('Processing slot alert message', {
        messageId: message.id,
        type: message.type
      });

      switch (message.type) {
        case 'new_slots':
          await alertService.processNewSlots(message);
          break;
        
        case 'slot_cancelled':
          await this.handleSlotCancellation(message);
          break;
        
        default:
          logger.warn('Unknown slot alert message type:', message.type);
          return false;
      }

      return true;
    } catch (error) {
      logger.error('Error processing slot alert:', error);
      return false;
    }
  }

  async processNotification(message) {
    try {
      logger.info('Processing notification message', {
        messageId: message.id,
        userId: message.userId,
        type: message.type
      });

      const user = await User.findById(message.userId);
      if (!user || !user.is_active) {
        logger.warn('User not found or inactive for notification:', message.userId);
        return true; // Acknowledge message to remove from queue
      }

      switch (message.type) {
        case 'welcome':
          await emailService.sendWelcomeEmail(user);
          break;
        
        case 'slot_alert':
          await this.sendSlotAlertNotification(message, user);
          break;
        
        default:
          logger.warn('Unknown notification message type:', message.type);
          return false;
      }

      return true;
    } catch (error) {
      logger.error('Error processing notification:', error);
      return false;
    }
  }

  async processPushNotification(message) {
    try {
      logger.info('Processing push notification', {
        messageId: message.id,
        userId: message.userId
      });

      if (!message.fcmToken) {
        logger.warn('No FCM token provided for push notification');
        return true; // Acknowledge to remove from queue
      }

      const result = await pushNotificationService.sendNotification(
        message.fcmToken,
        message.title,
        message.body,
        message.data
      );

      if (result.success) {
        logger.info('Push notification sent successfully', {
          messageId: message.id,
          userId: message.userId
        });
      } else {
        logger.warn('Push notification failed', {
          messageId: message.id,
          userId: message.userId,
          error: result.error
        });
      }

      return result.success;
    } catch (error) {
      logger.error('Error processing push notification:', error);
      return false;
    }
  }

  async processEmailNotification(message) {
    try {
      logger.info('Processing email notification', {
        messageId: message.id,
        to: message.to
      });

      const result = await emailService.sendEmail(
        message.to,
        message.subject,
        message.html,
        message.text
      );

      if (result.success) {
        logger.info('Email notification sent successfully', {
          messageId: message.id,
          to: message.to
        });
      } else {
        logger.warn('Email notification failed', {
          messageId: message.id,
          to: message.to,
          error: result.error
        });
      }

      return result.success;
    } catch (error) {
      logger.error('Error processing email notification:', error);
      return false;
    }
  }

  async sendSlotAlertNotification(message, user) {
    const { slot, centerName } = message;
    
    // Send push notification if enabled and token available
    if (user.fcm_token && message.pushEnabled) {
      const pushContent = pushNotificationService.formatSlotNotification(slot, centerName);
      await pushNotificationService.sendNotification(
        user.fcm_token,
        pushContent.title,
        pushContent.body,
        pushContent.data
      );
    }

    // Send email if enabled
    if (message.emailEnabled) {
      await emailService.sendSlotAlertEmail(user, slot, centerName);
    }
  }

  async handleSlotCancellation(message) {
    // Handle when a slot becomes unavailable/cancelled
    logger.info('Handling slot cancellation', {
      slotId: message.slotId,
      centerId: message.centerId,
      date: message.date,
      time: message.time,
      reason: message.reason
    });

    try {
      // Find users who might have been interested in this slot
      // and potentially notify them about the cancellation
      const alertService = require('../services/alertService');
      
      // Log the cancellation for analytics/monitoring
      logger.info(`Slot cancelled: ${message.date} ${message.time} at center ${message.centerId}`, {
        reason: message.reason,
        slotId: message.slotId
      });

      // Could implement notification to interested users here
      // For now, just track the event
      
    } catch (error) {
      logger.error('Error handling slot cancellation:', error);
    }
  }

  stop() {
    this.isRunning = false;
    logger.info('Alert worker stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      processedMessages: this.processedMessages || 0
    };
  }
}

// Create and export worker instance
const alertWorker = new AlertWorker();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down alert worker...');
  alertWorker.stop();
});

process.on('SIGINT', () => {
  logger.info('Shutting down alert worker...');
  alertWorker.stop();
});

module.exports = alertWorker;
