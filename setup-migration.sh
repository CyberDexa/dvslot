#!/bin/bash

# DVSlot - Complete UK Test Centers Migration Setup
# This script will help you set credentials and run the migration

echo "🚀 DVSlot - Complete UK Test Centers Migration"
echo "=============================================="
echo ""

echo "📋 Please provide your Supabase credentials:"
echo ""

# Get Supabase URL
read -p "🔗 Enter your Supabase URL (from Settings > API): " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: Supabase URL is required"
    exit 1
fi

# Get Supabase Service Role Key
read -p "🔑 Enter your Supabase Service Role Key (from Settings > API): " SUPABASE_SERVICE_ROLE_KEY
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Service Role Key is required"
    exit 1
fi

echo ""
echo "✅ Credentials received!"
echo "🔗 URL: $SUPABASE_URL"
echo "🔑 Service Key: ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."
echo ""

# Export environment variables
export SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "🎯 Starting migration of 350+ UK test centers..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install @supabase/supabase-js
fi

# Run the migration
node database/migrate-complete-centers.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 MIGRATION COMPLETED SUCCESSFULLY!"
    echo "=================================="
    echo ""
    echo "✅ Your database now contains ALL UK DVSA test centers (350+)"
    echo "🔄 The scraper will work on the complete UK dataset"
    echo "📊 This means maximum coverage for finding driving test slots"
    echo ""
    echo "🚀 Ready to deploy your backend for 24/7 real DVSA scraping!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy your backend: bash scripts/deploy-railway.sh"
    echo "2. Your mobile app will get live data from ALL UK test centers"
    echo "3. Users will see real availability across the entire country"
else
    echo ""
    echo "❌ MIGRATION FAILED"
    echo "=================="
    echo ""
    echo "🔧 Please check:"
    echo "1. Your Supabase credentials are correct"
    echo "2. Your internet connection is working"
    echo "3. The test_centers table exists in your database"
fi
