const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration for your mobile app
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://dvs-lot.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (Render free tier friendly)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_REQUESTS || 100,
    message: 'Too many requests, please try again later.'
});
app.use('/api', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Health check endpoint (required by Render)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// Test Supabase connection with simpler query
app.get('/api/test-connection', async (req, res) => {
    try {
        console.log('Testing basic Supabase connection...');
        
        // Try a simple query first
        const { data, error } = await supabase
            .from('test_centers')
            .select('name, region')
            .limit(1);

        if (error) {
            console.error('Supabase error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return res.status(500).json({
                success: false,
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
        }

        res.json({
            success: true,
            message: 'Supabase connection working!',
            dataCount: data ? data.length : 0,
            sample: data && data.length > 0 ? data[0] : null
        });
    } catch (error) {
        console.error('Connection test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            type: error.constructor.name
        });
    }
});

// Debug endpoint to check environment
app.get('/api/debug', (req, res) => {
    res.json({
        environment: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        supabaseUrl: process.env.SUPABASE_URL || 'NOT_SET',
        keyLength: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0
    });
});

// API Routes
app.get('/api/test-centers', async (req, res) => {
    try {
        console.log('Testing Supabase connection...');
        console.log('URL:', process.env.SUPABASE_URL);
        console.log('Key length:', process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 'NO KEY');
        
        const { data, error } = await supabase
            .from('test_centers')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Query successful, rows returned:', data.length);

        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.details || 'No additional details'
        });
    }
});

app.get('/api/test-centers/:region', async (req, res) => {
    try {
        const { region } = req.params;
        
        const { data, error } = await supabase
            .from('test_centers')
            .select('*')
            .eq('region', region)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: data,
            region: region,
            count: data.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Mock slots endpoint (will be replaced with real DVSA scraping)
app.get('/api/slots/:centerId', async (req, res) => {
    try {
        const { centerId } = req.params;
        
        // For now, return mock data
        // This will be replaced with real DVSA scraping
        const mockSlots = [
            {
                id: `slot_${Date.now()}_1`,
                center_id: centerId,
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                time: '09:00',
                available: true,
                type: 'practical'
            },
            {
                id: `slot_${Date.now()}_2`,
                center_id: centerId,
                date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                time: '14:30',
                available: true,
                type: 'practical'
            }
        ];

        res.json({
            success: true,
            data: mockSlots,
            center_id: centerId,
            count: mockSlots.length,
            note: "Mock data - will be replaced with real DVSA scraping"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: 'The requested endpoint does not exist'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DVSlot API running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📱 CORS enabled for: ${process.env.CORS_ORIGIN}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
