const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 14 // max 14 messages/second
      });

      // Verify connection configuration
      await this.transporter.verify();
      
      this.initialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const mailOptions = {
        from: {
          name: 'DVSlot - Driving Test Alerts',
          address: process.env.SMTP_USER
        },
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: info.messageId
      });

      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      logger.error('Failed to send email:', {
        error: error.message,
        to,
        subject
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBulkEmails(emails) {
    if (!this.initialized) {
      await this.initialize();
    }

    const results = [];
    const batchSize = 10; // Send in batches to avoid rate limiting

    try {
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (email) => {
          const result = await this.sendEmail(email.to, email.subject, email.html, email.text);
          return { ...email, ...result };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      logger.info('Bulk emails sent', {
        total: emails.length,
        success: successCount,
        failed: failureCount
      });

      return {
        success: true,
        total: emails.length,
        successCount,
        failureCount,
        results
      };

    } catch (error) {
      logger.error('Failed to send bulk emails:', error);
      return {
        success: false,
        error: error.message,
        results
      };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  generateSlotAlertEmail(user, slot, centerName) {
    const subject = `🚗 New Driving Test Slot Available - ${slot.date} at ${slot.time}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Driving Test Slot Available</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2c5282; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f8f9fa; padding: 30px; }
              .slot-details { background-color: white; padding: 20px; border-left: 4px solid #38a169; margin: 20px 0; }
              .button { display: inline-block; background-color: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { background-color: #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #666; }
              .urgent { background-color: #fed7d7; border-left-color: #e53e3e; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚗 DVSlot Alert</h1>
                  <p>New Driving Test Slot Available</p>
              </div>
              
              <div class="content">
                  <h2>Hello ${user.first_name || 'there'}!</h2>
                  
                  <p>Great news! A ${slot.test_type} driving test slot has just become available that matches your preferences.</p>
                  
                  <div class="slot-details urgent">
                      <h3>📅 Slot Details</h3>
                      <p><strong>Test Type:</strong> ${slot.test_type.charAt(0).toUpperCase() + slot.test_type.slice(1)}</p>
                      <p><strong>Date:</strong> ${this.formatDate(slot.date)}</p>
                      <p><strong>Time:</strong> ${slot.time}</p>
                      <p><strong>Test Center:</strong> ${centerName}</p>
                      <p><strong>Location:</strong> ${slot.address || 'Address available on DVSA website'}</p>
                  </div>
                  
                  <p><strong>⚡ Act quickly!</strong> Driving test slots fill up very fast. Click the button below to visit the DVSA website and book this slot.</p>
                  
                  <a href="https://driverpracticaltest.dvsa.gov.uk" class="button">Book This Slot Now</a>
                  
                  <p><small>Please note: DVSlot helps you find available slots but you'll need to complete your booking on the official DVSA website.</small></p>
              </div>
              
              <div class="footer">
                  <p>This alert was sent because you have an active subscription for ${slot.test_type} test alerts.</p>
                  <p>You can manage your alert preferences in the DVSlot app.</p>
                  <p>DVSlot - Making driving test booking easier</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const text = `
DVSlot Alert: New Driving Test Slot Available

Hello ${user.first_name || 'there'}!

A ${slot.test_type} driving test slot is now available:

Date: ${this.formatDate(slot.date)}
Time: ${slot.time}
Test Center: ${centerName}

This slot matches your alert preferences. Visit https://driverpracticaltest.dvsa.gov.uk to book it.

Act quickly as slots fill up fast!

DVSlot - Making driving test booking easier
    `;

    return { subject, html, text };
  }

  generateWelcomeEmail(user) {
    const subject = 'Welcome to DVSlot - Your Driving Test Alert Service';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DVSlot</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2c5282; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f8f9fa; padding: 30px; }
              .feature { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
              .button { display: inline-block; background-color: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { background-color: #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚗 Welcome to DVSlot!</h1>
                  <p>Your Driving Test Alert Service</p>
              </div>
              
              <div class="content">
                  <h2>Hello ${user.first_name}!</h2>
                  
                  <p>Welcome to DVSlot! We're excited to help you find available driving test slots quickly and easily.</p>
                  
                  <h3>What happens next?</h3>
                  
                  <div class="feature">
                      <h4>📱 Set up your alerts</h4>
                      <p>Configure your location preferences, test type, and notification settings in the app.</p>
                  </div>
                  
                  <div class="feature">
                      <h4>🔔 Get instant notifications</h4>
                      <p>We'll send you real-time alerts when slots matching your criteria become available.</p>
                  </div>
                  
                  <div class="feature">
                      <h4>⚡ Book quickly</h4>
                      <p>Click through to the DVSA website to secure your driving test slot.</p>
                  </div>
                  
                  <p>Ready to get started? Open the DVSlot app and set up your first alert!</p>
                  
                  <a href="#" class="button">Open DVSlot App</a>
              </div>
              
              <div class="footer">
                  <p>Need help? Contact our support team at support@dvslot.co.uk</p>
                  <p>DVSlot - Making driving test booking easier</p>
              </div>
          </div>
      </body>
      </html>
    `;

    return { subject, html };
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async sendWelcomeEmail(user) {
    const emailContent = this.generateWelcomeEmail(user);
    return await this.sendEmail(user.email, emailContent.subject, emailContent.html);
  }

  async sendSlotAlertEmail(user, slot, centerName) {
    const emailContent = this.generateSlotAlertEmail(user, slot, centerName);
    return await this.sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text);
  }

  async close() {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.initialized = false;
      logger.info('Email service closed');
    }
  }
}

// Singleton instance
const emailService = new EmailService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await emailService.close();
});

process.on('SIGINT', async () => {
  await emailService.close();
});

module.exports = emailService;
