require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dvsaScraper = require('./services/dvsaScraper');
const scheduler = require('./workers/scheduler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
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
