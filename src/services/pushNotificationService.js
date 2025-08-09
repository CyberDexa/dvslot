const admin = require('firebase-admin');
const logger = require('../utils/logger');

class PushNotificationService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Firebase Admin SDK
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/oauth2/v1/certs?client_id=${process.env.FIREBASE_CLIENT_EMAIL}`
      };

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }

      this.messaging = admin.messaging();
      this.initialized = true;
      
      logger.info('Push notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize push notification service:', error);
      throw error;
    }
  }

  async sendNotification(fcmToken, title, body, data = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const message = {
        token: fcmToken,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          timestamp: Date.now().toString()
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'dvslot_alerts',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body
              },
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await this.messaging.send(message);
      
      logger.info('Push notification sent successfully', {
        fcmToken: fcmToken.substring(0, 20) + '...',
        messageId: response,
        title,
        body
      });

      return {
        success: true,
        messageId: response
      };

    } catch (error) {
      logger.error('Failed to send push notification:', {
        error: error.message,
        code: error.code,
        fcmToken: fcmToken ? fcmToken.substring(0, 20) + '...' : 'none'
      });

      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async sendBulkNotifications(notifications) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const messages = notifications.map(notification => ({
        token: notification.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          ...notification.data,
          timestamp: Date.now().toString()
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'dvslot_alerts',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body
              },
              badge: 1,
              sound: 'default'
            }
          }
        }
      }));

      const response = await this.messaging.sendAll(messages);
      
      logger.info('Bulk push notifications sent', {
        totalSent: messages.length,
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return {
        success: true,
        totalSent: messages.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };

    } catch (error) {
      logger.error('Failed to send bulk push notifications:', error);
      
      return {
        success: false,
        error: error.message,
        totalSent: notifications.length,
        successCount: 0,
        failureCount: notifications.length
      };
    }
  }

  async validateFCMToken(fcmToken) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Send a test message to validate the token
      const testMessage = {
        token: fcmToken,
        data: {
          test: 'true'
        }
      };

      await this.messaging.send(testMessage, true); // dryRun = true
      return true;
    } catch (error) {
      logger.warn('FCM token validation failed:', {
        error: error.message,
        code: error.code
      });
      return false;
    }
  }

  async subscribeToTopic(fcmToken, topic) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await this.messaging.subscribeToTopic([fcmToken], topic);
      
      logger.info('Subscribed to topic', {
        fcmToken: fcmToken.substring(0, 20) + '...',
        topic
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to subscribe to topic:', error);
      return { success: false, error: error.message };
    }
  }

  async unsubscribeFromTopic(fcmToken, topic) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await this.messaging.unsubscribeFromTopic([fcmToken], topic);
      
      logger.info('Unsubscribed from topic', {
        fcmToken: fcmToken.substring(0, 20) + '...',
        topic
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to unsubscribe from topic:', error);
      return { success: false, error: error.message };
    }
  }

  async sendToTopic(topic, title, body, data = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const message = {
        topic,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          timestamp: Date.now().toString()
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'dvslot_alerts',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body
              },
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await this.messaging.send(message);
      
      logger.info('Topic notification sent successfully', {
        topic,
        messageId: response,
        title,
        body
      });

      return {
        success: true,
        messageId: response
      };

    } catch (error) {
      logger.error('Failed to send topic notification:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatSlotNotification(slot, centerName) {
    return {
      title: '🚗 New Driving Test Slot Available!',
      body: `${slot.test_type} test at ${centerName} on ${slot.date} at ${slot.time}`,
      data: {
        type: 'slot_alert',
        slot_id: slot.slot_id.toString(),
        center_id: slot.center_id.toString(),
        test_type: slot.test_type,
        date: slot.date,
        time: slot.time,
        center_name: centerName
      }
    };
  }
}

// Singleton instance
const pushNotificationService = new PushNotificationService();

module.exports = pushNotificationService;
