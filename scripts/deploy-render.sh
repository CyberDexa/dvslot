#!/bin/bash

# DVSlot Render.com Deployment Script
# Render offers excellent free tier for backend APIs

set -e

echo "🚀 DVSlot Render.com Deployment Setup"
echo "======================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}💡 $1${NC}"
}

# Create Render configuration
create_render_config() {
    print_step "Creating Render deployment configuration..."
    
    # Create render.yaml for Infrastructure as Code
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: dvslot-api
    runtime: node
    env: node
    region: oregon
    plan: free  # Free tier: 750 hours/month
    branch: main
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /health
    
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: SUPABASE_URL
        value: https://mrqwzdrdbdguuaarjkwh.supabase.co
      - key: SUPABASE_ANON_KEY
        value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: https://dvs-lot.vercel.app
      - key: SCRAPER_INTERVAL
        value: "1800000"  # 30 minutes
      - key: MAX_CONCURRENT_SCRAPERS
        value: "3"  # Conservative for free tier
      - key: RATE_LIMIT_REQUESTS
        value: "100"  # Per 15 minutes
      - key: LOG_LEVEL
        value: info
        
    # Auto-deploy on git push
    autoDeploy: true
    
    # Health check configuration
    healthCheckPath: /health
    
    # Resource limits for free tier
    disk:
      name: dvslot-disk
      size: 1GB
      
databases:
  # Using Supabase (PostgreSQL) - already configured
  # No additional database needed as we're using Supabase
  
# Static site for documentation (optional)
  - type: static
    name: dvslot-docs
    staticPublishPath: ./docs
    buildCommand: echo "Documentation site"
    routes:
      - type: redirect
        source: /*
        destination: https://dvs-lot.vercel.app
EOF

    print_success "Render configuration created"
}

# Create optimized package.json scripts for Render
optimize_package_json() {
    print_step "Optimizing package.json for Render deployment..."
    
    # Check if we're in the backend directory
    if [[ ! -f "package.json" ]]; then
        if [[ -d "backend" ]]; then
            cd backend
        else
            print_warning "No package.json found. Creating basic Node.js setup..."
            npm init -y
        fi
    fi
    
    # Add Render-specific scripts
    cat > package.json << 'EOF'
{
  "name": "dvslot-backend",
  "version": "1.0.0",
  "description": "DVSlot - Real-time DVSA driving test slot monitoring API",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "nodemon src/server.js",
    "build": "tsc || babel src --out-dir dist --extensions .js,.ts",
    "test": "jest",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js",
    "health": "curl http://localhost:$PORT/health || curl http://localhost:10000/health"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.8.1",
    "@supabase/supabase-js": "^2.26.0",
    "puppeteer": "^21.0.0",
    "user-agents": "^1.0.1358",
    "winston": "^3.9.0",
    "node-cron": "^3.0.2",
    "axios": "^1.4.0",
    "dotenv": "^16.3.1",
    "joi": "^17.9.2"
  },
  "devDependencies": {
    "@types/node": "^20.4.0",
    "@types/express": "^4.17.17",
    "typescript": "^5.1.6",
    "@babel/core": "^7.22.0",
    "@babel/cli": "^7.22.0",
    "@babel/preset-env": "^7.22.0",
    "nodemon": "^3.0.1",
    "jest": "^29.6.0"
  },
  "keywords": ["dvsa", "driving-test", "slots", "monitoring", "api"],
  "author": "DVSlot Team",
  "license": "MIT"
}
EOF

    print_success "Package.json optimized for Render"
}

# Create Render-optimized server.js
create_render_server() {
    print_step "Creating Render-optimized server..."
    
    mkdir -p src
    
    cat > src/server.js << 'EOF'
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

// API Routes
app.get('/api/test-centers', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('test_centers')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
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
EOF

    print_success "Render-optimized server created"
}

# Create deployment instructions
create_deployment_guide() {
    print_step "Creating deployment guide..."
    
    cat > RENDER_DEPLOYMENT.md << 'EOF'
# DVSlot Render.com Deployment Guide

## 🌟 Why Render.com?

✅ **Free tier includes:**
- 750 hours/month (enough for 24/7 operation)
- Automatic deploys from Git
- Custom domains
- SSL certificates
- Global CDN
- No credit card required

✅ **Perfect for DVSlot because:**
- Handles Node.js apps perfectly
- Integrates with Supabase
- Auto-scaling
- Built-in monitoring
- Zero-downtime deployments

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Deploy on Render.com
1. Go to [Render.com](https://render.com)
2. Sign up/in with GitHub
3. Click "New +" → "Web Service"
4. Connect your DVSlot repository
5. Use these settings:
   - **Name**: `dvslot-api`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Environment Variables
Add these in Render dashboard:
- `NODE_ENV` = `production`
- `SUPABASE_URL` = `https://mrqwzdrdbdguuaarjkwh.supabase.co`
- `SUPABASE_ANON_KEY` = `your_supabase_anon_key`
- `CORS_ORIGIN` = `https://dvs-lot.vercel.app`

### 4. Auto-Deploy Setup
- Render automatically deploys when you push to `main`
- No manual intervention needed
- Build logs available in dashboard

## 🔗 Your API URLs
After deployment, your API will be available at:
- **Base URL**: `https://dvslot-api.onrender.com`
- **Health Check**: `https://dvslot-api.onrender.com/health`
- **Test Centers**: `https://dvslot-api.onrender.com/api/test-centers`

## 📱 Update Your Mobile App
Update your mobile app's API base URL:

```javascript
// In your mobile app's API configuration
const API_BASE_URL = 'https://dvslot-api.onrender.com';
```

## 🔄 Free Tier Limits
- **750 hours/month** (enough for continuous operation)
- **Sleeps after 15min inactivity** (wakes up instantly on request)
- **100GB bandwidth/month**
- **500MB memory**

## 🚀 Upgrade Path
If you need more resources:
- **Starter Plan**: $7/month (no sleep, always-on)
- **Standard Plan**: $25/month (more resources)

## ✅ Monitoring & Health Checks
- Built-in health checks at `/health`
- Automatic restarts if unhealthy  
- Real-time logs in dashboard
- Metrics and monitoring included

## 🎉 Benefits for DVSlot
1. **Zero-cost deployment** for development/testing
2. **Professional infrastructure** 
3. **Scales automatically** as users grow
4. **Integrates perfectly** with your Supabase database
5. **Works seamlessly** with your Vercel mobile app

Your DVSlot backend will be production-ready and accessible worldwide!
EOF

    print_success "Deployment guide created"
}

# Main function
main() {
    print_step "Setting up DVSlot for Render.com deployment..."
    
    # Ensure we're in the right directory
    if [[ -d "backend" ]]; then
        cd backend
        print_info "Working in backend directory"
    fi
    
    create_render_config
    optimize_package_json  
    create_render_server
    create_deployment_guide
    
    print_success "🎉 Render.com deployment setup completed!"
    
    echo ""
    echo "📋 Next Steps:"
    echo "1. Run: git add . && git commit -m 'Add Render deployment'"
    echo "2. Run: git push origin main"
    echo "3. Go to render.com and connect your repository"
    echo "4. Deploy as a Web Service (Node.js)"
    echo "5. Add environment variables in Render dashboard"
    echo ""
    echo "💡 Advantages of Render over Railway:"
    echo "✅ True free tier (750 hours/month)"
    echo "✅ No credit card required"
    echo "✅ Automatic SSL certificates"
    echo "✅ Global CDN included"
    echo "✅ Built-in monitoring"
    echo "✅ Zero-downtime deployments"
    echo ""
    echo "🔗 After deployment, your API will be at:"
    echo "   https://dvslot-api.onrender.com"
    echo ""
    echo "📖 See RENDER_DEPLOYMENT.md for detailed instructions"
}

# Run main function
main "$@"
