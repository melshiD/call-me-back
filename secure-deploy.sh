#!/bin/bash

echo "=== Secure Raindrop Deployment Script ==="
echo ""
echo "This script will deploy with environment variables WITHOUT exposing them."
echo ""

# Step 1: Source the .env file silently
set -a
source .env 2>/dev/null
set +a

# Step 2: Verify critical variables are loaded (without showing values)
MISSING_VARS=()

[ -z "$TWILIO_ACCOUNT_SID" ] && MISSING_VARS+=("TWILIO_ACCOUNT_SID")
[ -z "$TWILIO_AUTH_TOKEN" ] && MISSING_VARS+=("TWILIO_AUTH_TOKEN")
[ -z "$ELEVENLABS_API_KEY" ] && MISSING_VARS+=("ELEVENLABS_API_KEY")
[ -z "$CEREBRAS_API_KEY" ] && MISSING_VARS+=("CEREBRAS_API_KEY")
[ -z "$VULTR_DB_API_URL" ] && MISSING_VARS+=("VULTR_DB_API_URL")
[ -z "$VULTR_DB_API_KEY" ] && MISSING_VARS+=("VULTR_DB_API_KEY")

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "ERROR: Missing required environment variables:"
    printf '%s\n' "${MISSING_VARS[@]}"
    exit 1
fi

echo "✓ All required environment variables loaded"
echo ""

# Step 3: Try to deploy with the environment loaded
echo "Attempting deployment with loaded environment..."
echo ""

# The key insight: Raindrop might accept env vars if they're exported to the shell
# Run the deployment
raindrop build deploy --amend

# If that fails, show alternative approach
if [ $? -ne 0 ]; then
    echo ""
    echo "=== Alternative: Manual Secret Setting ==="
    echo ""
    echo "If the above failed, Raindrop may require secrets to be set via their platform."
    echo "You'll need to manually set them through the Raindrop dashboard or CLI."
    echo ""
    echo "The required variables are loaded in your current shell."
    echo "Try running: raindrop build deploy --amend"
fi