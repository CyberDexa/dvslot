const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Updated 2025-08-13 - Force redeploy for postcode proxy endpoint
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const alertRoutes = require('./routes/alerts');
const testCenterRoutes = require('./routes/testCenters');
const appointmentRoutes = require('./routes/appointments');

const app = express();
// Trust proxy for correct client IP detection (required for rate limiting behind Render/Vercel)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
// CORS configuration
const defaultAllowed = [
  'http://localhost:19006', // Expo web default
  'http://localhost:8081',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://dvslot.com',
  'https://www.dvslot.com',
  // Vercel preview/prod domains
  'https://dvslot-web.vercel.app',
  'https://*.vercel.app',
];
const allowedOrigins = (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : defaultAllowed).map(o => o.trim());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const ok = allowedOrigins.includes(origin)
      || /\.vercel\.app$/i.test(origin)
      || /localhost(:\d+)?$/i.test(origin)
      || /127\.0\.0\.1(:\d+)?$/i.test(origin);
    if (ok) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/test-centers', testCenterRoutes);
app.use('/api/v1/appointments', appointmentRoutes);

// Admin endpoint for manual slot population (for debugging/setup)
app.post('/admin/populate-slots', async (req, res) => {
  try {
    const { authorization } = req.headers;
    
    // Simple admin check (in production, use proper authentication)
    if (!authorization || authorization !== 'Bearer admin-debug-token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Use mock data service for demonstration
    const mockDataService = require('./services/mockDataService');
    const stats = mockDataService.getSlotStats();
    
    res.json({
      success: true,
      message: 'Slot population completed (using mock data for demo)',
      data: {
        centersProcessed: 10,
        slotsCreated: stats.total
      }
    });
  } catch (error) {
    logger.error('Manual slot population failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoint to check slot statistics
app.get('/admin/slot-stats', async (req, res) => {
  try {
    const mockDataService = require('./services/mockDataService');
    const stats = mockDataService.getSlotStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Slot stats failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Postcode lookup proxy to bypass CSP issues
app.get('/postcode/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    if (!postcode) {
      return res.status(400).json({ success: false, error: 'Postcode required' });
    }

    // Fetch from postcodes.io API using axios
    const axios = require('axios');
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
  } catch (error) {
    logger.error('Postcode lookup error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 404,
      message: 'Resource not found',
      details: `The requested endpoint ${req.originalUrl} does not exist.`
    }
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Auto-start scheduler and slot population service if in production
if (process.env.NODE_ENV === 'production' || process.env.AUTO_START_SERVICES === 'true') {
  try {
    const schedulerService = require('./services/schedulerService');
    const slotPopulationService = require('./services/slotPopulationService');
    
    // Start scheduler service
    schedulerService.start();
    logger.info('Scheduler service started automatically');
    
    // Start slot population scheduler
    slotPopulationService.startScheduler();
    logger.info('Slot population scheduler started automatically');
    
    // Run initial slot population if needed (async, don't block startup)
    setTimeout(async () => {
      try {
        const { supabase } = require('../../supabase-config');
        const { count } = await supabase
          .from('driving_test_slots')
          .select('*', { count: 'exact', head: true })
          .eq('available', true)
          .gt('date', new Date().toISOString().split('T')[0]);
        
        if (count < 50) {
          logger.info('Running initial slot population (low available slots detected)');
          await slotPopulationService.populateAllCenterSlots();
          logger.info('Initial slot population completed');
        }
      } catch (error) {
        logger.warn('Initial slot population failed:', error.message);
      }
    }, 5000); // Wait 5 seconds after server start
    
  } catch (error) {
    logger.warn('Auto-start services failed:', error.message);
  }
}

const server = app.listen(PORT, () => {
  logger.info(`DVSlot API server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;
