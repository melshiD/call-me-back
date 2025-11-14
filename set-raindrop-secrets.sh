#!/bin/bash
set -e

echo "=== Setting Raindrop Secrets Securely ==="
echo ""
echo "Reading from .env and setting secrets in Raindrop..."
echo "(Values will NOT be displayed)"
echo ""

# Source .env file silently
set -a
source .env 2>/dev/null
set +a

# Counter for tracking
SUCCESS=0
FAILED=0

# Set each variable without exposing values
echo -n "Setting TWILIO_ACCOUNT_SID... "
raindrop build env set TWILIO_ACCOUNT_SID "$TWILIO_ACCOUNT_SID" > /dev/null 2>&1 && echo "✓" && ((SUCCESS++)) || (echo "✗" && ((FAILED++)))

echo -n "Setting TWILIO_AUTH_TOKEN... "
raindrop build env set TWILIO_AUTH_TOKEN "$TWILIO_AUTH_TOKEN" > /dev/null 2>&1 && echo "✓" && ((SUCCESS++)) || (echo "✗" && ((FAILED++)))

echo -n "Setting TWILIO_PHONE_NUMBER... "
raindrop build env set TWILIO_PHONE_NUMBER "$TWILIO_PHONE_NUMBER" > /dev/null 2>&1 && echo "✓" && ((SUCCESS++)) || (echo "✗" && ((FAILED++)))

echo -n "Setting ELEVENLABS_API_KEY... "
raindrop build env set ELEVENLABS_API_KEY "$ELEVENLABS_API_KEY" > /dev/null 2>&1 && echo "✓" && ((SUCCESS++)) || (echo "✗" && ((FAILED++)))

echo -n "Setting CEREBRAS_API_KEY... "
raindrop build env set CEREBRAS_API_KEY "$CEREBRAS_API_KEY" > /dev/null 2>&1 && echo "✓" && ((SUCCESS++)) || (echo "✗" && ((FAILED++)))

echo -n "Setting VULTR_DB_API_URL... "
raindrop build env set VULTR_DB_API_URL "$VULTR_DB_API_URL" > /dev/null 2>&1 && echo "✓" && ((SUCCESS++)) || (echo "✗" && ((FAILED++)))

echo -n "Setting VULTR_DB_API_KEY (CRITICAL)... "
raindrop build env set VULTR_DB_API_KEY "$VULTR_DB_API_KEY" > /dev/null 2>&1 && echo "✓" && ((SUCCESS++)) || (echo "✗" && ((FAILED++)))

echo ""
echo "=== Results ==="
echo "✓ Success: $SUCCESS"
echo "✗ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "All secrets set successfully! You can now deploy."
else
    echo "Some secrets failed to set. Please check and retry."
    exit 1
fi