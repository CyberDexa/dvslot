#!/bin/bash

# DVSlot Web Deployment Script
# This script deploys the DVSlot mobile app to Vercel from the root directory

echo "🚀 Starting DVSlot Web Deployment..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run this from the project root directory."
    exit 1
fi

# Check if the mobile directory exists
if [ ! -d "dvslot-mobile-new" ]; then
    echo "❌ Error: dvslot-mobile-new directory not found."
    exit 1
fi

echo "📁 Project structure verified"

# Build the web app
echo "🔨 Building web application..."
cd dvslot-mobile-new
npm install
npm run build:web
cd ..

if [ ! -d "dvslot-mobile-new/dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo "🎉 Deployment completed!"
echo "💡 Don't forget to:"
echo "   1. Add environment variables in Vercel dashboard"
echo "   2. Update Supabase auth URLs"
echo "   3. Test your deployed application"
