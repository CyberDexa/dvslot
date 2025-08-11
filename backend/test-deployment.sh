#!/bin/bash

# Test deployed backend
echo "🧪 Testing deployed DVSlot backend..."

if [ -z "$1" ]; then
    echo "Usage: ./test-deployment.sh <your-deployed-url>"
    echo "Example: ./test-deployment.sh https://your-app.railway.app"
    exit 1
fi

BACKEND_URL=$1

echo "🔍 Testing health endpoint..."
curl -s "$BACKEND_URL/health" | json_pp

echo -e "\n📊 Testing statistics endpoint..."
curl -s "$BACKEND_URL/api/stats" | json_pp

echo -e "\n🚀 Triggering manual scrape..."
curl -X POST -s "$BACKEND_URL/api/scrape" | json_pp

echo -e "\n✅ Deployment test completed!"
echo "🔗 Your backend is running at: $BACKEND_URL"
echo "📊 Monitor at: $BACKEND_URL/health"
