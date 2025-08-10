#!/bin/bash
# DVSlot Vercel Deployment Script

echo "🚀 Starting DVSlot Web Deployment..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: No .env file found. Make sure to set environment variables in Vercel dashboard."
fi

# Build the web version
echo "🔨 Building web application..."
npm run build:web

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Deployment successful!"
        echo "📱 Your DVSlot web app is now live!"
        echo ""
        echo "📋 Post-deployment checklist:"
        echo "  1. Test authentication (sign up/login)"
        echo "  2. Test search functionality"
        echo "  3. Check mobile responsiveness"
        echo "  4. Verify Supabase integration"
        echo ""
        echo "🛠️  Next steps:"
        echo "  • Configure custom domain (optional)"
        echo "  • Set up monitoring and analytics"
        echo "  • Update Supabase allowed origins"
    else
        echo "❌ Deployment failed! Check error messages above."
    fi
else
    echo "❌ Build failed! Check error messages above."
fi
