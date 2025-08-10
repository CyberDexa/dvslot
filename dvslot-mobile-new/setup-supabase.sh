#!/bin/bash

# DVSlot Supabase Setup Script
echo "🚀 DVSlot Supabase Setup"
echo "========================"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one first."
    exit 1
fi

# Check if Supabase variables are set
if ! grep -q "EXPO_PUBLIC_SUPABASE_URL" .env; then
    echo "⚠️  Please add your Supabase URL and API key to .env file:"
    echo ""
    echo "EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co"
    echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here"
    echo ""
    echo "Get these from: https://supabase.com/dashboard → Settings → API"
    exit 1
fi

echo "✅ Environment variables found"

# Install dependencies if not already installed
if [ ! -d "node_modules/@supabase" ]; then
    echo "📦 Installing Supabase client..."
    npm install @supabase/supabase-js
fi

echo "✅ Supabase client installed"

echo ""
echo "🎯 Next Steps:"
echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard"
echo "2. Open the SQL Editor"
echo "3. Copy and run the SQL from: supabase-schema.sql"
echo "4. Copy and run the SQL from: supabase-sample-data.sql"
echo "5. Update your .env file with real Supabase credentials"
echo "6. Run: npm start"
echo ""
echo "🌟 Your app will be ready to go live!"
