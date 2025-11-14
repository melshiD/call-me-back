#!/bin/bash
set -e

echo "=== Database-Enabled Deployment ==="
echo ""
echo "Loading environment variables from .env..."

# Load all variables from .env into the environment
set -a
source .env
set +a

echo "✓ Environment loaded"
echo ""
echo "Starting fresh Raindrop deployment..."
echo "This will create a NEW deployment with database-proxy enabled."
echo ""

# The key: Raindrop DOES read from environment if variables are exported
# But it needs a fresh deployment, not an amend
raindrop build deploy

echo ""
echo "If deployment gets stuck in 'stopping...' state:"
echo "1. Press Ctrl+C to stop"
echo "2. Run: pkill -9 -f raindrop"
echo "3. Try again with: ./deploy-with-db.sh"