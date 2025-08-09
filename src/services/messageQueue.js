const amqp = require('amqplib');
const logger = require('../utils/logger');

class MessageQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
  }

  async connect() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      logger.info('Connected to RabbitMQ');

      // Handle connection events
      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));

      // Declare exchanges and queues
      await this.setupQueues();
      
      return true;
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      await this.handleReconnect();
      return false;
    }
  }

  async setupQueues() {
    if (!this.channel) return;

    try {
      // Declare exchanges
      await this.channel.assertExchange('dvslot.direct', 'direct', { durable: true });
      await this.channel.assertExchange('dvslot.topic', 'topic', { durable: true });
      await this.channel.assertExchange('dvslot.dlx', 'direct', { durable: true });

      // Declare queues with dead letter exchange
      const queueOptions = {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'dvslot.dlx',
          'x-message-ttl': 3600000 // 1 hour TTL
        }
      };

      // Alert processing queue
      await this.channel.assertQueue('slot_alerts', queueOptions);
      await this.channel.bindQueue('slot_alerts', 'dvslot.direct', 'slot_alerts');

      // Notification queue
      await this.channel.assertQueue('notifications', queueOptions);
      await this.channel.bindQueue('notifications', 'dvslot.direct', 'notifications');

      // Email queue
      await this.channel.assertQueue('email_notifications', queueOptions);
      await this.channel.bindQueue('email_notifications', 'dvslot.direct', 'email_notifications');

      // Push notification queue
      await this.channel.assertQueue('push_notifications', queueOptions);
      await this.channel.bindQueue('push_notifications', 'dvslot.direct', 'push_notifications');

      // Scraping queue
      await this.channel.assertQueue('scraping_tasks', queueOptions);
      await this.channel.bindQueue('scraping_tasks', 'dvslot.direct', 'scraping_tasks');

      // Dead letter queue
      await this.channel.assertQueue('dead_letters', { durable: true });
      await this.channel.bindQueue('dead_letters', 'dvslot.dlx', '#');

      logger.info('Message queues set up successfully');
    } catch (error) {
      logger.error('Failed to setup queues:', error);
      throw error;
    }
  }

  async publishMessage(queueName, message, options = {}) {
    if (!this.isConnected || !this.channel) {
      logger.warn('RabbitMQ not connected, attempting to reconnect...');
      await this.connect();
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        id: require('uuid').v4()
      }));

      const publishOptions = {
        persistent: true,
        timestamp: Date.now(),
        messageId: require('uuid').v4(),
        ...options
      };

      const success = this.channel.sendToQueue(queueName, messageBuffer, publishOptions);
      
      if (success) {
        logger.debug(`Message published to queue ${queueName}`, {
          messageId: publishOptions.messageId,
          queueName
        });
      } else {
        logger.warn(`Failed to publish message to queue ${queueName}`);
      }

      return success;
    } catch (error) {
      logger.error(`Failed to publish message to ${queueName}:`, error);
      throw error;
    }
  }

  async publishToExchange(exchangeName, routingKey, message, options = {}) {
    if (!this.isConnected || !this.channel) {
      logger.warn('RabbitMQ not connected, attempting to reconnect...');
      await this.connect();
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        id: require('uuid').v4()
      }));

      const publishOptions = {
        persistent: true,
        timestamp: Date.now(),
        messageId: require('uuid').v4(),
        ...options
      };

      this.channel.publish(exchangeName, routingKey, messageBuffer, publishOptions);
      
      logger.debug(`Message published to exchange ${exchangeName}`, {
        routingKey,
        messageId: publishOptions.messageId
      });

      return true;
    } catch (error) {
      logger.error(`Failed to publish to exchange ${exchangeName}:`, error);
      throw error;
    }
  }

  async consumeQueue(queueName, callback, options = {}) {
    if (!this.isConnected || !this.channel) {
      logger.warn('RabbitMQ not connected, attempting to reconnect...');
      await this.connect();
    }

    try {
      const defaultOptions = {
        noAck: false,
        ...options
      };

      await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          
          logger.debug(`Processing message from queue ${queueName}`, {
            messageId: content.id,
            timestamp: content.timestamp
          });

          const result = await callback(content, msg);
          
          if (result !== false) {
            this.channel.ack(msg);
          } else {
            logger.warn(`Message processing failed for queue ${queueName}`, {
              messageId: content.id
            });
            this.channel.nack(msg, false, false); // Send to dead letter queue
          }
        } catch (error) {
          logger.error(`Error processing message from queue ${queueName}:`, error);
          this.channel.nack(msg, false, false); // Send to dead letter queue
        }
      }, defaultOptions);

      logger.info(`Started consuming queue: ${queueName}`);
    } catch (error) {
      logger.error(`Failed to consume queue ${queueName}:`, error);
      throw error;
    }
  }

  async handleConnectionError(error) {
    logger.error('RabbitMQ connection error:', error);
    this.isConnected = false;
    await this.handleReconnect();
  }

  async handleConnectionClose() {
    logger.warn('RabbitMQ connection closed');
    this.isConnected = false;
    await this.handleReconnect();
  }

  async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached for RabbitMQ');
      return;
    }

    this.reconnectAttempts++;
    
    logger.info(`Attempting to reconnect to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('Reconnection attempt failed:', error);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  async getQueueInfo(queueName) {
    if (!this.isConnected || !this.channel) return null;

    try {
      const queueInfo = await this.channel.checkQueue(queueName);
      return queueInfo;
    } catch (error) {
      logger.error(`Failed to get queue info for ${queueName}:`, error);
      return null;
    }
  }

  async purgeQueue(queueName) {
    if (!this.isConnected || !this.channel) return false;

    try {
      await this.channel.purgeQueue(queueName);
      logger.info(`Purged queue: ${queueName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to purge queue ${queueName}:`, error);
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      this.isConnected = false;
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
    }
  }

  isHealthy() {
    return this.isConnected && this.connection && this.channel;
  }
}

// Singleton instance
const messageQueue = new MessageQueue();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down message queue...');
  await messageQueue.close();
});

process.on('SIGINT', async () => {
  logger.info('Shutting down message queue...');
  await messageQueue.close();
});

// Helper functions
const publishMessage = async (queueName, message, options) => {
  return await messageQueue.publishMessage(queueName, message, options);
};

const consumeQueue = async (queueName, callback, options) => {
  return await messageQueue.consumeQueue(queueName, callback, options);
};

const publishToExchange = async (exchangeName, routingKey, message, options) => {
  return await messageQueue.publishToExchange(exchangeName, routingKey, message, options);
};

module.exports = {
  messageQueue,
  publishMessage,
  consumeQueue,
  publishToExchange
};
