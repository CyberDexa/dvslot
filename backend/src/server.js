require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dvsaScraper = require('../services/dvsaScraper');
const scheduler = require('../workers/scheduler');
const logger = require('../utils/logger');

const app = express();
const PORT = process.env.PORT || 10000;

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
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

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://dvs-lot.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    scheduler: scheduler.getStatus()
  });
});

// API v1 Routes
const apiV1 = express.Router();

// Test centers endpoints
apiV1.get('/test-centers/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 25 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get nearby test centers
    const { data: centers, error } = await supabase
      .from('test_centers')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Calculate distances and filter
    const nearbyCenters = centers
      .map(center => {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          center.latitude,
          center.longitude
        );
        return { ...center, distance };
      })
      .filter(center => center.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20); // Limit results

    res.json({
      success: true,
      data: nearbyCenters
    });
  } catch (error) {
    logger.error('Nearby centers error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.get('/test-centers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: center, error } = await supabase
      .from('test_centers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !center) {
      return res.status(404).json({
        success: false,
        error: 'Test center not found'
      });
    }

    res.json({
      success: true,
      data: center
    });
  } catch (error) {
    logger.error('Get center error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test slots endpoints
apiV1.get('/test-slots', async (req, res) => {
  try {
    const { postcode, radius = 25, testType, dateFrom, dateTo } = req.query;
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    let query = supabase
      .from('driving_test_slots')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0]);

    if (testType) {
      query = query.eq('test_type', testType);
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data: slots, error } = await query
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(100);

    if (error) throw error;

    res.json({
      success: true,
      data: slots || []
    });
  } catch (error) {
    logger.error('Search slots error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.get('/test-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: slot, error } = await supabase
      .from('driving_test_slots')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !slot) {
      return res.status(404).json({
        success: false,
        error: 'Test slot not found'
      });
    }

    res.json({
      success: true,
      data: slot
    });
  } catch (error) {
    logger.error('Get slot error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.post('/test-slots/book', async (req, res) => {
  try {
    const { slotId, userDetails } = req.body;
    
    if (!slotId || !userDetails) {
      return res.status(400).json({
        success: false,
        error: 'Slot ID and user details are required'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Check if slot exists
    const { data: slot, error: slotError } = await supabase
      .from('driving_test_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found'
      });
    }

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        slot_id: slotId,
        user_details: userDetails,
        status: 'confirmed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    res.json({
      success: true,
      data: {
        bookingId: booking.id,
        slot: slot,
        status: 'confirmed'
      }
    });
  } catch (error) {
    logger.error('Book slot error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User alerts endpoints
apiV1.get('/alerts/history', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    // For now, return mock data - you'll need to implement proper JWT verification
    const userId = 'mock-user-id';

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: alerts, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        alerts: alerts || []
      }
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.get('/alerts/subscriptions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: subscriptions, error } = await supabase
      .from('alert_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        subscriptions: subscriptions || []
      }
    });
  } catch (error) {
    logger.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.post('/alerts/subscribe', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification
    const alertData = req.body;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: subscription, error } = await supabase
      .from('alert_subscriptions')
      .insert({
        user_id: userId,
        ...alertData,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.delete('/alerts/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from('alert_subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    logger.error('Delete subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User profile endpoints
apiV1.get('/users/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.put('/users/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification
    const profileData = req.body;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: user, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Auth endpoints
apiV1.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        user: data.user,
        token: data.session?.access_token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

apiV1.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and password are required'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        user: data.user,
        token: data.session?.access_token
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.post('/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Here you would invalidate the token if using a token blacklist
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Support endpoints
apiV1.post('/support/tickets', async (req, res) => {
  try {
    const { subject, message, category } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }

    // For now, just log the support request
    logger.info('Support ticket created:', { subject, message, category });

    res.json({
      success: true,
      data: {
        ticketId: `ticket_${Date.now()}`
      }
    });
  } catch (error) {
    logger.error('Support ticket error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Statistics endpoints
apiV1.get('/alerts/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get user statistics
    const [alertsResult, subscriptionsResult] = await Promise.all([
      supabase.from('user_alerts').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('alert_subscriptions').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_active', true)
    ]);

    res.json({
      success: true,
      data: {
        totalSearches: 0, // Not implemented yet
        activeAlerts: subscriptionsResult.count || 0,
        slotsFound: alertsResult.count || 0,
        lastActivity: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mount API v1 routes
app.use('/api/v1', apiV1);

// Manual scraping endpoint (for testing/admin use)
app.post('/api/scrape', async (req, res) => {
  try {
    logger.info('🔧 Manual scraping triggered via API');
    
    const results = await dvsaScraper.scrapeAllCenters();
    
    res.json({
      success: true,
      message: 'Scraping completed successfully',
      results: {
        totalCenters: results.totalCenters,
        successfulScrapes: results.successfulScrapes,
        totalSlotsFound: results.totalSlotsFound,
        duration: results.duration
      }
    });
    
  } catch (error) {
    logger.error('❌ Manual scraping failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Scraping failed',
      error: error.message
    });
  }
});

// Get scraping statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get statistics
    const [centersResult, slotsResult, recentSlotsResult] = await Promise.all([
      supabase.from('test_centers').select('id', { count: 'exact' }),
      supabase.from('driving_test_slots').select('id', { count: 'exact' }),
      supabase.from('driving_test_slots')
        .select('last_checked_at, test_center_id')
        .order('last_checked_at', { ascending: false })
        .limit(1)
    ]);

    const stats = {
      totalCenters: centersResult.count || 0,
      totalSlots: slotsResult.count || 0,
      lastUpdate: recentSlotsResult.data?.[0]?.last_checked_at || null,
      systemStatus: scheduler.getStatus(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('❌ Failed to get statistics:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 DVSlot Backend Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Initialize scheduler
scheduler.start().catch(error => {
  logger.error('❌ Failed to start scheduler:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    logger.info('📄 HTTP server closed');
  });
  
  await scheduler.stop();
  await dvsaScraper.close();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    logger.info('📄 HTTP server closed');
  });
  
  await scheduler.stop();
  await dvsaScraper.close();
  
  process.exit(0);
});

module.exports = app;
