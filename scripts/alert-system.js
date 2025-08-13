#!/usr/bin/env node

/**
 * DVSlot Alert Notification System
 * 
 * Manages user alerts and notifications for slot availability
 * across all 318 UK test centers
 */

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Production Configuration - Use the working API key from mobile app
const SUPABASE_URL = 'https://mrqwzdrdbdguuaarjkwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4';

class DVSlotAlertSystem {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.emailTransporter = null;
    this.alertsSent = 0;
    this.alertsProcessed = 0;
    this.errors = 0;
  }

  async initialize() {
    console.log('📢 DVSlot Alert Notification System');
    console.log('===================================\n');

    try {
      // Initialize email service
      await this.initializeEmailService();
      
      // Verify database connection
      const { data: testQuery, error } = await this.supabase
        .from('dvsa_test_centers')
        .select('center_id')
        .limit(1);

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      console.log('✅ Database connection verified');
      console.log('✅ Alert system initialized\n');
      
      return true;

    } catch (error) {
      console.error('❌ Alert system initialization failed:', error.message);
      return false;
    }
  }

  async initializeEmailService() {
    // Mock email service for development
    // In production, configure with real SMTP settings
    this.emailTransporter = {
      sendMail: async (options) => {
        console.log(`📧 [MOCK EMAIL] To: ${options.to}`);
        console.log(`📧 [MOCK EMAIL] Subject: ${options.subject}`);
        console.log(`📧 [MOCK EMAIL] Preview: ${options.text.substring(0, 100)}...`);
        return { messageId: 'mock-' + Date.now() };
      }
    };

    console.log('📧 Email service initialized (mock mode for development)');
  }

  // Helper function to calculate distance between coordinates
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async getActiveSubscriptions() {
    try {
      const { data: subscriptions, error } = await this.supabase
        .from('alert_subscriptions')
        .select(`
          subscription_id,
          user_id,
          center_id,
          test_type,
          preferred_date_start,
          preferred_date_end,
          preferred_time_start,
          preferred_time_end,
          is_active,
          users!inner(email, first_name, last_name),
          dvsa_test_centers(name, postcode, region, latitude, longitude)
        `)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to get subscriptions: ${error.message}`);
      }

      return subscriptions || [];

    } catch (error) {
      console.error('Error getting subscriptions:', error.message);
      return [];
    }
  }

  async findMatchingSlots(subscription) {
    try {
      let query = this.supabase
        .from('driving_test_slots')
        .select(`
          slot_id,
          center_id,
          test_type,
          date,
          time,
          available,
          last_checked,
          dvsa_test_centers!inner(name, address, postcode, city, region)
        `)
        .eq('available', true)
        .gte('date', new Date().toISOString().split('T')[0]);

      // Filter by center if specified
      if (subscription.center_id) {
        query = query.eq('center_id', subscription.center_id);
      }

      // Filter by test type
      if (subscription.test_type) {
        query = query.eq('test_type', subscription.test_type);
      }

      // Filter by date range
      if (subscription.preferred_date_start) {
        query = query.gte('date', subscription.preferred_date_start);
      }
      if (subscription.preferred_date_end) {
        query = query.lte('date', subscription.preferred_date_end);
      }

      const { data: slots, error } = await query.limit(10);

      if (error) {
        throw new Error(`Failed to find matching slots: ${error.message}`);
      }

      // Filter by time range if specified
      let filteredSlots = slots || [];
      if (subscription.preferred_time_start || subscription.preferred_time_end) {
        filteredSlots = filteredSlots.filter(slot => {
          const slotTime = slot.time;
          
          if (subscription.preferred_time_start && slotTime < subscription.preferred_time_start) {
            return false;
          }
          if (subscription.preferred_time_end && slotTime > subscription.preferred_time_end) {
            return false;
          }
          return true;
        });
      }

      return filteredSlots;

    } catch (error) {
      console.error('Error finding matching slots:', error.message);
      return [];
    }
  }

  async sendSlotAlert(subscription, slots) {
    try {
      const user = subscription.users;
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      const userName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'there';
      const slotCount = slots.length;
      const firstSlot = slots[0];
      const centerInfo = firstSlot.dvsa_test_centers;

      // Create email content
      const subject = `🚨 DVSlot Alert: ${slotCount} New Driving Test Slot${slotCount > 1 ? 's' : ''} Available!`;
      
      const emailText = `
Hi ${userName},

Great news! We found ${slotCount} available driving test slot${slotCount > 1 ? 's' : ''} that match your preferences:

${slots.map(slot => {
  const center = slot.dvsa_test_centers;
  const date = new Date(slot.date).toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const time = slot.time.substring(0, 5); // HH:MM format
  
  return `📅 ${date} at ${time}
📍 ${center.name}, ${center.city} (${center.postcode})
🎯 ${slot.test_type.charAt(0).toUpperCase() + slot.test_type.slice(1)} Test
`;
}).join('\n')}

⚠️ Important: These slots are in high demand and may be booked quickly. 
Visit the DVSA website immediately to book: https://www.gov.uk/book-driving-test

🚗 DVSlot is monitoring all ${centerInfo ? '318' : 'UK'} official DVSA test centers to bring you the latest availability.

Need to modify your alerts? Log into your DVSlot account.

Good luck with your driving test!

Best regards,
The DVSlot Team

---
This is an automated alert from DVSlot. You're receiving this because you have an active alert subscription.
      `.trim();

      // Send email
      await this.emailTransporter.sendMail({
        to: user.email,
        subject: subject,
        text: emailText,
        html: this.generateEmailHTML(userName, slots, subject),
      });

      // Log the alert to database
      await this.logAlert(subscription.subscription_id, subscription.user_id, slots, 'email');

      this.alertsSent++;
      return true;

    } catch (error) {
      console.error('Failed to send slot alert:', error.message);
      this.errors++;
      return false;
    }
  }

  generateEmailHTML(userName, slots, subject) {
    const slotRows = slots.map(slot => {
      const center = slot.dvsa_test_centers;
      const date = new Date(slot.date).toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const time = slot.time.substring(0, 5);
      
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; font-weight: bold;">${date}</td>
          <td style="padding: 12px; font-weight: bold; color: #2563eb;">${time}</td>
          <td style="padding: 12px;">${center.name}<br><small style="color: #666;">${center.city}, ${center.postcode}</small></td>
          <td style="padding: 12px;"><span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">${slot.test_type}</span></td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚗 DVSlot Alert</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">New Driving Test Slots Available!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 25px;">Great news! We found <strong>${slots.length} available driving test slot${slots.length > 1 ? 's' : ''}</strong> that match your preferences:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Date</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Time</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Test Center</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Type</th>
                    </tr>
                </thead>
                <tbody>
                    ${slotRows}
                </tbody>
            </table>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 25px; border-radius: 4px;">
                <p style="margin: 0; font-weight: 600; color: #92400e;">⚠️ Act Fast!</p>
                <p style="margin: 8px 0 0 0; color: #92400e;">These slots are in high demand and may be booked quickly. Visit the DVSA website immediately to secure your test.</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
                <a href="https://www.gov.uk/book-driving-test" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Book Your Test Now</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">🎯 DVSlot is monitoring all 318 official UK DVSA test centers to bring you the latest availability.</p>
            
            <p style="font-size: 16px;">Good luck with your driving test!</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">Best regards,<br><strong>The DVSlot Team</strong></p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">This is an automated alert from DVSlot. You're receiving this because you have an active alert subscription.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async logAlert(subscriptionId, userId, slots, method) {
    try {
      const alertData = slots.map(slot => ({
        user_id: userId,
        subscription_id: subscriptionId,
        message: `New ${slot.test_type} test slot available: ${slot.date} at ${slot.time}`,
        sent: true,
        sent_at: new Date().toISOString(),
        notification_method: method,
        created_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from('user_alerts')
        .insert(alertData);

      if (error) {
        console.error('Failed to log alert:', error.message);
      }

    } catch (error) {
      console.error('Error logging alert:', error.message);
    }
  }

  async processAlerts() {
    console.log('\n🔄 Processing user alerts...');
    const startTime = Date.now();

    this.alertsSent = 0;
    this.alertsProcessed = 0;
    this.errors = 0;

    try {
      // Get active subscriptions
      const subscriptions = await this.getActiveSubscriptions();
      console.log(`📊 Found ${subscriptions.length} active alert subscriptions`);

      if (subscriptions.length === 0) {
        console.log('✅ No active subscriptions to process');
        return;
      }

      // Process each subscription
      for (const subscription of subscriptions) {
        this.alertsProcessed++;
        
        try {
          console.log(`🔍 Processing subscription ${this.alertsProcessed}/${subscriptions.length} for ${subscription.users.email}`);
          
          // Find matching slots
          const matchingSlots = await this.findMatchingSlots(subscription);
          
          if (matchingSlots.length > 0) {
            console.log(`   📅 Found ${matchingSlots.length} matching slots`);
            
            // Send alert
            const alertSent = await this.sendSlotAlert(subscription, matchingSlots);
            if (alertSent) {
              console.log(`   📧 Alert sent successfully`);
            } else {
              console.log(`   ❌ Failed to send alert`);
            }
          } else {
            console.log(`   📭 No matching slots found`);
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`❌ Error processing subscription for ${subscription.users.email}:`, error.message);
          this.errors++;
        }
      }

      const duration = Math.round((Date.now() - startTime) / 1000);
      
      console.log('\n✅ Alert processing completed!');
      console.log(`📊 Results:`);
      console.log(`   Subscriptions processed: ${this.alertsProcessed}`);
      console.log(`   Alerts sent: ${this.alertsSent}`);
      console.log(`   Errors: ${this.errors}`);
      console.log(`   Duration: ${duration} seconds\n`);

    } catch (error) {
      console.error('❌ Alert processing failed:', error.message);
    }
  }

  async createTestSubscription(userEmail, testPreferences = {}) {
    try {
      console.log(`📝 Creating test subscription for ${userEmail}...`);

      // Create or get test user
      let { data: user, error: userError } = await this.supabase
        .from('users')
        .select('user_id')
        .eq('email', userEmail)
        .single();

      if (userError || !user) {
        // Create test user
        const { data: newUser, error: createError } = await this.supabase
          .from('users')
          .insert([{
            email: userEmail,
            password_hash: 'test_hash',
            first_name: 'Test',
            last_name: 'User',
            is_active: true,
            role_id: 2, // Regular user
          }])
          .select('user_id')
          .single();

        if (createError) {
          throw new Error(`Failed to create test user: ${createError.message}`);
        }

        user = newUser;
        console.log(`✅ Created test user: ${userEmail}`);
      }

      // Create alert subscription
      const subscriptionData = {
        user_id: user.user_id,
        center_id: testPreferences.center_id || null,
        test_type: testPreferences.test_type || 'practical',
        preferred_date_start: testPreferences.date_start || new Date().toISOString().split('T')[0],
        preferred_date_end: testPreferences.date_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        preferred_time_start: testPreferences.time_start || '09:00',
        preferred_time_end: testPreferences.time_end || '17:00',
        is_active: true,
      };

      const { data: subscription, error: subError } = await this.supabase
        .from('alert_subscriptions')
        .insert([subscriptionData])
        .select('subscription_id')
        .single();

      if (subError) {
        throw new Error(`Failed to create subscription: ${subError.message}`);
      }

      console.log(`✅ Created alert subscription ID: ${subscription.subscription_id}`);
      return subscription.subscription_id;

    } catch (error) {
      console.error('❌ Failed to create test subscription:', error.message);
      return null;
    }
  }

  async showSystemStats() {
    try {
      console.log('\n📊 DVSlot Alert System Statistics');
      console.log('=================================\n');

      // Get subscription stats
      const { data: subStats } = await this.supabase
        .from('alert_subscriptions')
        .select('is_active, test_type')
        .eq('is_active', true);

      console.log(`Active Subscriptions: ${subStats?.length || 0}`);
      if (subStats && subStats.length > 0) {
        const practicalSubs = subStats.filter(s => s.test_type === 'practical').length;
        const theorySubs = subStats.filter(s => s.test_type === 'theory').length;
        console.log(`  - Practical test alerts: ${practicalSubs}`);
        console.log(`  - Theory test alerts: ${theorySubs}`);
      }

      // Get alert stats
      const { data: alertStats } = await this.supabase
        .from('user_alerts')
        .select('sent, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (alertStats) {
        console.log(`\nAlerts (Last 7 Days): ${alertStats.length}`);
        console.log(`  - Sent: ${alertStats.filter(a => a.sent).length}`);
        console.log(`  - Pending: ${alertStats.filter(a => !a.sent).length}`);
      }

      // Get slot availability
      const { count: availableSlots } = await this.supabase
        .from('driving_test_slots')
        .select('*', { count: 'exact', head: true })
        .eq('available', true)
        .gte('date', new Date().toISOString().split('T')[0]);

      console.log(`\nAvailable Slots: ${availableSlots || 0}`);

      console.log('\n✅ Statistics retrieved successfully\n');

    } catch (error) {
      console.error('❌ Failed to retrieve statistics:', error.message);
    }
  }
}

// CLI Commands
async function main() {
  const alertSystem = new DVSlotAlertSystem();
  const initialized = await alertSystem.initialize();
  
  if (!initialized) {
    process.exit(1);
  }

  const command = process.argv[2];

  switch (command) {
    case 'process':
      console.log('🔄 Processing all active alerts...');
      await alertSystem.processAlerts();
      break;

    case 'test':
      const testEmail = process.argv[3] || 'test@dvslot.com';
      console.log(`🧪 Creating test subscription for ${testEmail}...`);
      await alertSystem.createTestSubscription(testEmail, {
        test_type: 'practical',
        date_start: new Date().toISOString().split('T')[0],
        date_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      break;

    case 'stats':
      await alertSystem.showSystemStats();
      break;

    default:
      console.log('DVSlot Alert Notification System');
      console.log('================================');
      console.log('Usage:');
      console.log('  node alert-system.js process                - Process all active alerts');
      console.log('  node alert-system.js test [email]           - Create test subscription');
      console.log('  node alert-system.js stats                  - Show system statistics');
      break;
  }
}

// Export for use as module
module.exports = DVSlotAlertSystem;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
