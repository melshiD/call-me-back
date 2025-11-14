#!/bin/bash
# This script sets Raindrop environment variables securely
# It reads from .env but doesn't echo sensitive values

echo "Setting Raindrop environment variables..."

# Read .env file and set variables
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    # Remove quotes from value
    value="${value%\"}"
    value="${value#\"}"

    # Export the variable
    export "$key=$value"
done < .env

# Now we have all variables in memory, let's check which ones Raindrop needs
echo "Checking required variables..."

# Check if critical variables are set (without showing values)
if [[ -z "$TWILIO_ACCOUNT_SID" ]]; then
    echo "ERROR: TWILIO_ACCOUNT_SID not set"
    exit 1
fi

if [[ -z "$VULTR_DB_API_KEY" ]]; then
    echo "ERROR: VULTR_DB_API_KEY not set"
    exit 1
fi

echo "✓ All required variables loaded from .env"
echo ""
echo "Now run: raindrop build deploy --amend"
echo ""
echo "The variables are now in your shell environment."
echo "Raindrop should pick them up when you deploy."