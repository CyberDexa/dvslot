#!/bin/bash

# Test Chrome installation and Puppeteer setup on Render
echo "🔍 Checking Chrome installation..."

# Check if Chrome is installed
if command -v google-chrome-stable &> /dev/null; then
    echo "✅ Chrome is installed"
    google-chrome-stable --version
else
    echo "❌ Chrome not found at /usr/bin/google-chrome-stable"
fi

# Check alternative Chrome locations
echo "🔍 Checking for Chrome in common locations..."
find /usr -name "*chrome*" -type f 2>/dev/null | head -10

# Check Puppeteer cache
echo "🔍 Checking Puppeteer cache..."
ls -la /opt/render/.cache/puppeteer/ 2>/dev/null || echo "No Puppeteer cache found"

# Test Node.js and npm
echo "🔍 Node.js version:"
node --version

echo "🔍 npm version:"
npm --version

# Check environment variables
echo "🔍 Environment variables:"
echo "PUPPETEER_EXECUTABLE_PATH: $PUPPETEER_EXECUTABLE_PATH"
echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: $PUPPETEER_SKIP_CHROMIUM_DOWNLOAD"
echo "NODE_ENV: $NODE_ENV"

echo "✅ Chrome diagnostics completed!"
