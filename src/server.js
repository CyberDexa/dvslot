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

// Postcode lookup proxy to bypass CSP issues
app.get('/postcode/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    if (!postcode) {
      return res.status(400).json({ success: false, error: 'Postcode required' });
    }

    try {
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
        return;
      } else {
        res.status(404).json({ success: false, error: 'Postcode not found' });
        return;
      }
    } catch (networkError) {
      // Fallback for development/network issues - provide mock coordinates for common UK postcodes
      logger.warn('External API unavailable, using fallback coordinates:', networkError.message);
      
      // Mock coordinates for common UK postcode areas for development
      const mockCoordinates = {
        'EH': { latitude: 55.9533, longitude: -3.1883, area: 'Edinburgh' },
        'EH54': { latitude: 55.9105, longitude: -3.4833, area: 'Livingston' },
        'M': { latitude: 53.4808, longitude: -2.2426, area: 'Manchester' },
        'M1': { latitude: 53.4808, longitude: -2.2426, area: 'Manchester' },
        'B': { latitude: 52.4862, longitude: -1.8904, area: 'Birmingham' },
        'B1': { latitude: 52.4862, longitude: -1.8904, area: 'Birmingham' },
        'L': { latitude: 53.4084, longitude: -2.9916, area: 'Liverpool' },
        'L1': { latitude: 53.4084, longitude: -2.9916, area: 'Liverpool' },
        'LS': { latitude: 53.8008, longitude: -1.5491, area: 'Leeds' },
        'LS1': { latitude: 53.8008, longitude: -1.5491, area: 'Leeds' },
        'SW': { latitude: 51.4994, longitude: -0.1276, area: 'London Westminster' },
        'SW1': { latitude: 51.4994, longitude: -0.1276, area: 'London Westminster' },
        'E': { latitude: 51.5154, longitude: -0.0648, area: 'London East' },
        'E1': { latitude: 51.5154, longitude: -0.0648, area: 'London East' },
        'W': { latitude: 51.5074, longitude: -0.1478, area: 'London West' },
        'W1': { latitude: 51.5074, longitude: -0.1478, area: 'London West' }
      };

      // Extract postcode area (first part before space or numbers)
      const postcodeClean = postcode.replace(/\s+/g, '').toUpperCase();
      let postcodeArea = postcodeClean.match(/^[A-Z]+\d*/)?.[0] || postcodeClean.match(/^[A-Z]+/)?.[0];
      
      // Try full match first, then progressively shorter matches
      let coords = mockCoordinates[postcodeArea];
      if (!coords && postcodeArea) {
        // Try just the letters part for areas like EH54 -> EH
        const lettersOnly = postcodeArea.match(/^[A-Z]+/)?.[0];
        coords = mockCoordinates[lettersOnly];
      }
      
      if (coords) {
        logger.info(`Using mock coordinates for ${postcode} (${coords.area}) - matched with ${postcodeArea || 'fallback'}`);
        res.json({
          success: true,
          latitude: coords.latitude,
          longitude: coords.longitude,
          postcode: postcode.toUpperCase(),
          mock: true,
          area: coords.area
        });
        return;
      }

      // If no mock data available, return error
      res.status(404).json({ 
        success: false, 
        error: 'Postcode lookup service unavailable and no mock data for this area' 
      });
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

const server = app.listen(PORT, () => {
  logger.info(`DVSlot API server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;
