#!/bin/bash

API_URL="https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run"

echo "Testing WorkOS Authentication..."
echo ""

# Test registration
echo "1. Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"testworkos@example.com","password":"TestPass123","name":"WorkOS Test User","phone":"+15555551234"}')

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo "✅ Registration successful"
    # Don't show user ID - just confirm it exists
    if echo "$REGISTER_RESPONSE" | grep -q '"id"'; then
        echo "   User created"
    fi
    TOKEN_TYPE=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | cut -d'.' -f1)
    if [ "$TOKEN_TYPE" = "eyJhbGciOiJIUzI1NiJ9" ]; then
        echo "   Auth Method: JWT (fallback)"
    else
        echo "   Auth Method: WorkOS"
    fi
else
    echo "❌ Registration failed"
    # Only show error message, not full response with potential tokens
    ERROR_MSG=$(echo "$REGISTER_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ERROR_MSG" ]; then
        echo "   Error: $ERROR_MSG"
    fi
fi

echo ""

# Test login
echo "2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testworkos@example.com","password":"TestPass123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login successful"
    TOKEN_TYPE=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | cut -d'.' -f1)
    if [ "$TOKEN_TYPE" = "eyJhbGciOiJIUzI1NiJ9" ]; then
        echo "   Auth Method: JWT (fallback)"
    else
        echo "   Auth Method: WorkOS"
    fi
else
    echo "❌ Login failed"
    ERROR_MSG=$(echo "$LOGIN_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ERROR_MSG" ]; then
        echo "   Error: $ERROR_MSG"
    fi
fi

echo ""
echo "Test complete!"
