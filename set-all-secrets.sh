#!/bin/bash
set -e

echo "=== Setting ALL Raindrop Secrets with Correct Syntax ==="
echo ""
echo "Using the env: prefix as documented..."
echo ""

# Source .env file to get values
set -a
source .env 2>/dev/null
set +a

echo "Setting database secrets (CRITICAL)..."
raindrop build env set env:VULTR_DB_API_URL "$VULTR_DB_API_URL" && echo "✓ VULTR_DB_API_URL"
raindrop build env set env:VULTR_DB_API_KEY "$VULTR_DB_API_KEY" && echo "✓ VULTR_DB_API_KEY"

echo ""
echo "Setting Twilio secrets..."
raindrop build env set env:TWILIO_ACCOUNT_SID "$TWILIO_ACCOUNT_SID" && echo "✓ TWILIO_ACCOUNT_SID"
raindrop build env set env:TWILIO_AUTH_TOKEN "$TWILIO_AUTH_TOKEN" && echo "✓ TWILIO_AUTH_TOKEN"
raindrop build env set env:TWILIO_PHONE_NUMBER "$TWILIO_PHONE_NUMBER" && echo "✓ TWILIO_PHONE_NUMBER"

echo ""
echo "Setting AI service secrets..."
raindrop build env set env:ELEVENLABS_API_KEY "$ELEVENLABS_API_KEY" && echo "✓ ELEVENLABS_API_KEY"
raindrop build env set env:CEREBRAS_API_KEY "$CEREBRAS_API_KEY" && echo "✓ CEREBRAS_API_KEY"

echo ""
echo "=== All Secrets Set Successfully! ==="
echo ""
echo "Now deploy with: raindrop build deploy"
echo ""
echo "NOTE: If you run 'raindrop build generate' it will reset these secrets!"
echo "      You'll need to run this script again after generate."