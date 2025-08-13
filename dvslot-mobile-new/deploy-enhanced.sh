#!/bin/bash

echo "🚀 Deploying Enhanced DVSlot Frontend..."

# Build the web version
echo "📦 Building web version..."
npm run export

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Enhanced DVSlot Frontend deployed successfully!"
echo "📱 Your professional DVSlot app is now live with:"
echo "  • Enhanced UI/UX design"
echo "  • Professional theme system"
echo "  • Fixed navigation and sign-out"
echo "  • Improved mobile responsiveness"
echo "  • Real UK test center data integration"

echo "🔗 Visit: https://dvs-lot.vercel.app"
