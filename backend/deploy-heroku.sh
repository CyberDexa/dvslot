#!/bin/bash

echo "🚀 Deploying DVSlot Backend to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first:"
    echo "https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Login to Heroku
echo "🔑 Please login to Heroku..."
heroku login

# Create Heroku app
echo "🎯 Creating Heroku app..."
APP_NAME="dvslot-backend-$(date +%s)"
heroku create $APP_NAME

# Add buildpack for Puppeteer
echo "📦 Adding Puppeteer buildpack..."
heroku buildpacks:add jontewks/puppeteer --app $APP_NAME
heroku buildpacks:add heroku/nodejs --app $APP_NAME

# Set environment variables
echo "⚙️ Setting environment variables..."
heroku config:set NODE_ENV=production --app $APP_NAME
heroku config:set SUPABASE_URL=https://woyivlvtvfwrnlbwydhr.supabase.co --app $APP_NAME
heroku config:set SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveWl2bHZ0dmZ3cm5sYnd5ZGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjU1OTU5MywiZXhwIjoyMDUyMTM1NTkzfQ.5e6gWIJUwKI8b0MwsPX2RCGuvEGEU6wJWz9PnYP8QTI --app $APP_NAME
heroku config:set DVSA_BASE_URL=https://www.gov.uk/book-driving-test --app $APP_NAME
heroku config:set SCRAPING_DELAY_MIN=10000 --app $APP_NAME
heroku config:set SCRAPING_DELAY_MAX=25000 --app $APP_NAME
heroku config:set MAX_CONCURRENT_SCRAPERS=1 --app $APP_NAME
heroku config:set SCRAPER_TIMEOUT=120000 --app $APP_NAME
heroku config:set SCRAPE_INTERVAL_MINUTES=60 --app $APP_NAME
heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true --app $APP_NAME

# Deploy
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy DVSlot backend with DVSA integration"
git push heroku main

# Scale up
heroku ps:scale web=1 --app $APP_NAME

echo "✅ Deployment complete!"
echo "🔗 Your app URL: https://$APP_NAME.herokuapp.com"
echo "📊 View logs: heroku logs --tail --app $APP_NAME"
echo "⚙️ Manage app: heroku dashboard"
