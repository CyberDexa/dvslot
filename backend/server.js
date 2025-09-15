require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const dvsaScraper = require('./services/dvsaScraper');
const scheduler = require('./workers/scheduler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration - Allow Vercel preview domains and localhost
const allowedOrigins = [
  'http://localhost:19006', // Expo web default
  'http://localhost:8081',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://dvslot.com',
  'https://www.dvslot.com',
  'https://dvslot-web.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches Vercel pattern
    const ok = allowedOrigins.includes(origin)
      || /\.vercel\.app$/i.test(origin)
      || /localhost(:\d+)?$/i.test(origin)
      || /127\.0\.0\.1(:\d+)?$/i.test(origin);
      
    if (ok) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
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

// Postcode lookup proxy to bypass CSP issues
app.get('/postcode/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    if (!postcode) {
      return res.status(400).json({ success: false, error: 'Postcode required' });
    }

    try {
      // Fetch from postcodes.io API
      const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`;
      const response = await axios.get(url, { timeout: 5000 });
      const data = response.data;

      if (data.status === 200 && data.result) {
        res.json({
          success: true,
          latitude: data.result.latitude,
          longitude: data.result.longitude,
          postcode: data.result.postcode
        });
      } else {
        res.status(404).json({ success: false, error: 'Postcode not found' });
      }
    } catch (apiError) {
      // Fallback response for testing or when API is unavailable
      logger.warn('Postcodes.io API unavailable, using fallback coordinates');
      
      // Provide fallback coordinates for common UK postcodes for testing
      const fallbackCoordinates = {
        'SW1A 1AA': { latitude: 51.5014, longitude: -0.1419 }, // Buckingham Palace
        'M1 1AA': { latitude: 53.4834, longitude: -2.2426 }, // Manchester
        'B1 1AA': { latitude: 52.4862, longitude: -1.8904 }, // Birmingham
      };
      
      const coordinates = fallbackCoordinates[postcode.toUpperCase()];
      if (coordinates) {
        res.json({
          success: true,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          postcode: postcode.toUpperCase(),
          fallback: true
        });
      } else {
        res.status(404).json({ success: false, error: 'Postcode not found' });
      }
    }
  } catch (error) {
    logger.error('Postcode lookup error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

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
