#!/bin/bash
# DVSlot Live Deployment Script
set -e

echo "🚀 DVSlot Live Deployment"
echo "========================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
    echo "❌ Error: Must run from dvslot-mobile-new directory"
    exit 1
fi

# Build the web app
echo "📦 Building web app..."
npm run build:web

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy with production flag
vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo "📱 Your app should be live on Vercel"
echo ""
echo "🔧 Next steps:"
echo "1. Visit your Vercel URL to test login/signup"
echo "2. Try searching for slots (e.g., SW1A 1AA)"
echo "3. Use backend login to connect alerts system"
echo ""
echo "🆘 If you see CORS errors:"
echo "- The backend at https://dvslot-api.onrender.com should auto-deploy from GitHub"
echo "- Wait 2-3 minutes for Render deployment to complete"
