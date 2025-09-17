#!/bin/bash

# Test the postcode endpoint
echo "🧪 Testing postcode lookup endpoint..."

if [ -z "$1" ]; then
    echo "Usage: ./test-postcode.sh <your-deployed-url>"
    echo "Example: ./test-postcode.sh https://dvslot-api.onrender.com"
    exit 1
fi

BACKEND_URL=$1

echo "🔍 Testing postcode lookup for EH54 6EG..."
curl -s "$BACKEND_URL/postcode/EH54%206EG" | json_pp

echo -e "\n🔍 Testing postcode lookup for SW11..."
curl -s "$BACKEND_URL/postcode/SW11" | json_pp

echo -e "\n🔍 Testing postcode lookup for unknown postcode (should fallback to London)..."
curl -s "$BACKEND_URL/postcode/UNKNOWN123" | json_pp

echo -e "\n✅ Postcode endpoint test completed!"
echo "🔗 Your backend is running at: $BACKEND_URL"
echo "📍 Postcode endpoint: $BACKEND_URL/postcode/<postcode>"
