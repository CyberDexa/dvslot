const AlertSubscription = require('../models/AlertSubscription');
const UserAlert = require('../models/UserAlert');
const User = require('../models/User');
const DrivingTestSlot = require('../models/DrivingTestSlot');
const TestCenter = require('../models/TestCenter');
const pushNotificationService = require('./pushNotificationService');
const emailService = require('./emailService');
const { publishMessage } = require('./messageQueue');
const logger = require('../utils/logger');

class AlertService {
  constructor() {
    this.isProcessing = false;
    this.processingQueue = [];
  }

  async processNewSlots(slotsData) {
    if (this.isProcessing) {
      this.processingQueue.push(slotsData);
      return;
    }

    this.isProcessing = true;

    try {
      const { testType, centerId, slots } = slotsData;

      logger.info(`Processing new slots for alert matching`, {
        testType,
        centerId,
        slotCount: slots
      });

      // Get the actual slots from the database
      const recentSlots = await DrivingTestSlot.getRecentlyAvailable(0.25); // Last 15 minutes
      const relevantSlots = recentSlots.filter(slot => 
        slot.center_id === centerId && slot.test_type === testType
      );

      if (relevantSlots.length === 0) {
        logger.info('No relevant slots found for alert processing');
        return;
      }

      // Find matching subscriptions
      const matchingSubscriptions = await AlertSubscription.findMatchingSubscriptions(
        testType, 
        [centerId]
      );

      logger.info(`Found ${matchingSubscriptions.length} matching subscriptions`);

      const alertsToCreate = [];
      const notificationsToSend = [];

      for (const slot of relevantSlots) {
        const slotSubscriptions = await this.filterSubscriptionsBySlot(matchingSubscriptions, slot);

        for (const subscription of slotSubscriptions) {
          // Check if we've already sent an alert for this slot to this user
          const existingAlert = await UserAlert.checkAlertExists(subscription.user_id, slot.slot_id);
          
          if (!existingAlert) {
            // Create alert record
            alertsToCreate.push({
              user_id: subscription.user_id,
              slot_id: slot.slot_id,
              notification_type: subscription.notification_method || 'push'
            });

            // Prepare notification
            notificationsToSend.push({
              userId: subscription.user_id,
              email: subscription.email,
              fcmToken: subscription.fcm_token,
              slot,
              centerName: slot.center_name,
              notificationMethod: subscription.notification_method || 'push',
              emailEnabled: subscription.email_notifications !== false,
              pushEnabled: subscription.push_notifications !== false
            });
          }
        }
      }

      // Bulk create alerts
      if (alertsToCreate.length > 0) {
        await UserAlert.bulkCreate(alertsToCreate);
        logger.info(`Created ${alertsToCreate.length} alert records`);
      }

      // Send notifications
      if (notificationsToSend.length > 0) {
        await this.sendNotifications(notificationsToSend);
      }

    } catch (error) {
      logger.error('Error processing new slots for alerts:', error);
      throw error;
    } finally {
      this.isProcessing = false;

      // Process queued items
      if (this.processingQueue.length > 0) {
        const nextItem = this.processingQueue.shift();
        setImmediate(() => this.processNewSlots(nextItem));
      }
    }
  }

  async filterSubscriptionsBySlot(subscriptions, slot) {
    const filtered = [];

    for (const subscription of subscriptions) {
      try {
        // Check date range if specified
        if (subscription.date_from && new Date(slot.date) < new Date(subscription.date_from)) {
          continue;
        }

        if (subscription.date_to && new Date(slot.date) > new Date(subscription.date_to)) {
          continue;
        }

        // Check preferred times if specified
        if (subscription.preferred_times) {
          const preferredTimes = typeof subscription.preferred_times === 'string' 
            ? JSON.parse(subscription.preferred_times) 
            : subscription.preferred_times;

          if (preferredTimes && preferredTimes.length > 0) {
            const slotTime = slot.time;
            const timeMatches = preferredTimes.some(timeRange => {
              const [start, end] = timeRange.split('-');
              return slotTime >= start && slotTime <= end;
            });

            if (!timeMatches) {
              continue;
            }
          }
        }

        // Check location radius if specified
        if (subscription.latitude && subscription.longitude && subscription.radius) {
          const testCenter = await TestCenter.findById(slot.center_id);
          if (testCenter && testCenter.latitude && testCenter.longitude) {
            const distance = this.calculateDistance(
              subscription.latitude,
              subscription.longitude,
              testCenter.latitude,
              testCenter.longitude
            );

            if (distance > subscription.radius) {
              continue;
            }
          }
        }

        filtered.push(subscription);
      } catch (error) {
        logger.error('Error filtering subscription:', {
          subscriptionId: subscription.subscription_id,
          error: error.message
        });
      }
    }

    return filtered;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  async sendNotifications(notifications) {
    const pushNotifications = [];
    const emailNotifications = [];

    // Separate notifications by type
    for (const notification of notifications) {
      if (notification.pushEnabled && notification.fcmToken) {
        const pushContent = pushNotificationService.formatSlotNotification(
          notification.slot,
          notification.centerName
        );

        pushNotifications.push({
          fcmToken: notification.fcmToken,
          userId: notification.userId,
          ...pushContent
        });
      }

      if (notification.emailEnabled && notification.email) {
        emailNotifications.push({
          userId: notification.userId,
          email: notification.email,
          slot: notification.slot,
          centerName: notification.centerName
        });
      }
    }

    // Send push notifications in batch
    if (pushNotifications.length > 0) {
      try {
        const pushResult = await pushNotificationService.sendBulkNotifications(pushNotifications);
        logger.info(`Push notifications sent: ${pushResult.successCount}/${pushNotifications.length}`);
        
        // Update alert records for successful sends
        for (let i = 0; i < pushNotifications.length; i++) {
          const notification = pushNotifications[i];
          const response = pushResult.responses?.[i];
          
          if (response?.success) {
            // Find and update the alert record
            const alert = await UserAlert.findByUserId(notification.userId, 1, 1);
            if (alert.data.length > 0) {
              await UserAlert.markSent(alert.data[0].alert_id, notification.body);
            }
          }
        }
      } catch (error) {
        logger.error('Error sending push notifications:', error);
      }
    }

    // Send email notifications
    if (emailNotifications.length > 0) {
      try {
        const emailPromises = emailNotifications.map(async (notification) => {
          const user = await User.findById(notification.userId);
          if (user) {
            const result = await emailService.sendSlotAlertEmail(
              user,
              notification.slot,
              notification.centerName
            );
            
            if (result.success) {
              // Find and update the alert record
              const alert = await UserAlert.findByUserId(notification.userId, 1, 1);
              if (alert.data.length > 0) {
                await UserAlert.markSent(alert.data[0].alert_id, `Email sent to ${user.email}`);
              }
            }
            
            return result;
          }
          return { success: false, error: 'User not found' };
        });

        const emailResults = await Promise.all(emailPromises);
        const successCount = emailResults.filter(r => r.success).length;
        
        logger.info(`Email notifications sent: ${successCount}/${emailNotifications.length}`);
      } catch (error) {
        logger.error('Error sending email notifications:', error);
      }
    }

    // Log alert statistics
    logger.logAlert(
      null, // userId (multiple users)
      null, // slotId (multiple slots)
      'batch_alert',
      {
        totalNotifications: notifications.length,
        pushCount: pushNotifications.length,
        emailCount: emailNotifications.length
      }
    );
  }

  async processPendingAlerts() {
    try {
      const pendingAlerts = await UserAlert.getPendingAlerts();
      
      if (pendingAlerts.length === 0) {
        return;
      }

      logger.info(`Processing ${pendingAlerts.length} pending alerts`);

      const notifications = pendingAlerts.map(alert => ({
        userId: alert.user_id,
        email: alert.email,
        fcmToken: alert.fcm_token,
        slot: {
          slot_id: alert.slot_id,
          test_type: alert.test_type,
          date: alert.date,
          time: alert.time,
          center_id: alert.center_id
        },
        centerName: alert.center_name,
        notificationMethod: alert.notification_method || 'push',
        emailEnabled: alert.email_notifications !== false,
        pushEnabled: alert.push_notifications !== false
      }));

      await this.sendNotifications(notifications);

    } catch (error) {
      logger.error('Error processing pending alerts:', error);
      throw error;
    }
  }

  async cleanupExpiredSubscriptions() {
    try {
      const count = await AlertSubscription.cleanupExpiredSubscriptions();
      if (count > 0) {
        logger.info(`Cleaned up ${count} expired alert subscriptions`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired subscriptions:', error);
    }
  }

  async getAlertStats() {
    try {
      const stats = await UserAlert.getSystemStats();
      return stats;
    } catch (error) {
      logger.error('Error getting alert stats:', error);
      return null;
    }
  }
}

// Singleton instance
const alertService = new AlertService();

module.exports = alertService;
