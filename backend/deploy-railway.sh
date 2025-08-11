#!/bin/bash

echo "🚀 Deploying DVSlot Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔑 Please login to Railway..."
railway login

# Initialize Railway project
echo "🎯 Creating Railway project..."
railway init

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=https://woyivlvtvfwrnlbwydhr.supabase.co
railway variables set SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveWl2bHZ0dmZ3cm5sYnd5ZGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjU1OTU5MywiZXhwIjoyMDUyMTM1NTkzfQ.5e6gWIJUwKI8b0MwsPX2RCGuvEGEU6wJWz9PnYP8QTI
railway variables set DVSA_BASE_URL=https://www.gov.uk/book-driving-test
railway variables set SCRAPING_DELAY_MIN=5000
railway variables set SCRAPING_DELAY_MAX=15000
railway variables set MAX_CONCURRENT_SCRAPERS=2
railway variables set SCRAPER_TIMEOUT=60000
railway variables set SCRAPE_INTERVAL_MINUTES=30

# Deploy
echo "🚀 Deploying to Railway..."
railway deploy

echo "✅ Deployment complete!"
echo "🔗 Your backend is now running on Railway"
echo "📊 View logs: railway logs"
echo "⚙️ Manage deployment: railway dashboard"
