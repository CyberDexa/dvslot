#!/bin/bash

echo "🚀 Setting up DVSlot Backend with Real DVSA Integration..."

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please copy .env.example to .env and configure your settings."
    exit 1
fi

# Test Supabase connection
echo "🔍 Testing Supabase connection..."
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
supabase.from('test_centers').select('count(*)').then(result => {
  if (result.error) {
    console.log('❌ Supabase connection failed:', result.error.message);
    process.exit(1);
  } else {
    console.log('✅ Supabase connection successful');
  }
});"

echo "🧪 Running scraper test..."
node scripts/testScraper.js

echo "✅ DVSlot Backend setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Review your .env configuration"
echo "2. Start the server: npm start"
echo "3. Test manual scraping: npm run scrape"
echo "4. Check health: curl http://localhost:3001/health"
echo ""
echo "🔧 Available commands:"
echo "  npm start          - Start the backend server with scheduler"
echo "  npm run dev        - Start in development mode"
echo "  npm run scrape     - Run manual scraping"
echo "  npm run scheduler  - Start only the scheduler"
