#!/bin/bash

API_URL="https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run"
TEST_EMAIL="testuser@example.com"
TEST_PASSWORD="TestPass123"
TEST_PHONE="+15555551234"

echo "Testing Call Functionality..."
echo ""

# Step 1: Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Run test-contacts.sh first to create test user."
    exit 1
fi
echo "✅ Logged in"

echo ""

# Step 2: Trigger a demo call
echo "2. Triggering demo call to Brad..."
CALL_RESPONSE=$(curl -s -X POST "$API_URL/api/calls/trigger" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"personaId\":\"brad_001\",\"phoneNumber\":\"$TEST_PHONE\",\"paymentMethod\":\"demo\"}")

if echo "$CALL_RESPONSE" | grep -q '"success":true'; then
    CALL_ID=$(echo "$CALL_RESPONSE" | grep -o '"callId":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Call triggered successfully"
    echo "   Call ID created in database"
elif echo "$CALL_RESPONSE" | grep -q '"id"'; then
    CALL_ID=$(echo "$CALL_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    STATUS=$(echo "$CALL_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Call initiated"
    echo "   Status: $STATUS"
else
    echo "❌ Call failed"
    ERROR=$(echo "$CALL_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ERROR" ]; then
        echo "   Error: $ERROR"
    fi
fi

echo ""
echo "Test complete!"
echo ""
echo "Note: With Twilio trial account, you can only call verified numbers."
echo "To verify a number: https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
