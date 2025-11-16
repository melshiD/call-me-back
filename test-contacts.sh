#!/bin/bash

API_URL="https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run"
TEST_EMAIL="testuser@example.com"
TEST_PASSWORD="TestPass123"

echo "Testing Contacts Functionality..."
echo ""

# Step 1: Login to get token
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Trying to register..."
    REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\",\"phone\":\"+15555551234\"}")

    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$TOKEN" ]; then
        echo "❌ Registration also failed. Cannot proceed."
        exit 1
    fi
    echo "✅ Registered new user"
else
    echo "✅ Logged in successfully"
fi

echo ""

# Step 2: Get available personas
echo "2. Fetching available personas..."
PERSONAS=$(curl -s "$API_URL/api/personas")
BRAD_ID=$(echo "$PERSONAS" | grep -o '"id":"brad_001"' | head -1 | cut -d'"' -f4)

if [ -z "$BRAD_ID" ]; then
    echo "❌ Could not find Brad persona"
    exit 1
fi
echo "✅ Found Brad persona (brad_001)"

echo ""

# Step 3: Add Brad to contacts
echo "3. Adding Brad to contacts..."
ADD_RESPONSE=$(curl -s -X POST "$API_URL/api/contacts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"personaId\":\"brad_001\"}")

if echo "$ADD_RESPONSE" | grep -q "brad_001"; then
    echo "✅ Successfully added Brad to contacts"
else
    echo "❌ Failed to add contact"
    ERROR=$(echo "$ADD_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ERROR" ]; then
        echo "   Error: $ERROR"
    fi
fi

echo ""

# Step 4: Get contacts
echo "4. Fetching user contacts..."
CONTACTS=$(curl -s -X GET "$API_URL/api/contacts" \
  -H "Authorization: Bearer $TOKEN")

if echo "$CONTACTS" | grep -q "brad_001"; then
    CONTACT_COUNT=$(echo "$CONTACTS" | grep -o '"id":"brad_001"' | wc -l)
    echo "✅ Contacts fetched successfully"
    echo "   Found Brad in contacts"
else
    echo "⚠️  Contacts list may be empty"
fi

echo ""
echo "Test complete!"
