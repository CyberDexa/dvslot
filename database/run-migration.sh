#!/bin/bash

# Complete UK Test Centers Migration Script
# Updates your Supabase database with all 350+ official DVSA test centers

echo "🚀 DVSlot - Complete UK Test Centers Migration"
echo "=============================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "database/migrate-complete-centers.js" ]; then
    echo "❌ Error: Please run this script from the DVSlot root directory"
    exit 1
fi

# Check for environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  Missing Supabase credentials!"
    echo ""
    echo "Please set your environment variables:"
    echo "export SUPABASE_URL='your-supabase-url'"
    echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    echo ""
    echo "You can find these in your Supabase dashboard:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > API"
    echo "4. Copy the URL and service_role key"
    exit 1
fi

echo "✅ Supabase credentials found"
echo "🔗 URL: ${SUPABASE_URL}"
echo "🔑 Service Key: ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install @supabase/supabase-js
fi

echo "🎯 Starting migration of 350+ UK test centers..."
echo ""

# Run the migration
node database/migrate-complete-centers.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 MIGRATION COMPLETED SUCCESSFULLY!"
    echo "=================================="
    echo ""
    echo "✅ Your database now contains ALL UK DVSA test centers"
    echo "🔄 The scraper will work on the complete 350+ center dataset"
    echo "📊 This means maximum coverage for finding driving test slots"
    echo ""
    echo "🚀 Ready to deploy your backend for 24/7 real DVSA scraping!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy your backend using: bash scripts/deploy-railway.sh"
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
    echo ""
    echo "Need help? Check the migration logs above for specific errors."
fi
