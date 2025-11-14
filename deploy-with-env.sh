#!/bin/bash
set -e

# Deploy script that sets environment variables first
echo "Setting Vultr DB API Key..."

# Get the current version ID
VERSION_ID=$(raindrop build status 2>/dev/null | grep "@" | awk '{print $2}' | sed 's/@//' | sed 's/\.\.\.//')

if [ -z "$VERSION_ID" ]; then
  echo "Error: Could not determine version ID"
  exit 1
fi

echo "Version ID: $VERSION_ID"

# Try to set the environment variable
echo "Attempting to set VULTR_DB_API_KEY..."
raindrop build env set VULTR_DB_API_KEY "e66e2a9c1e0b881c349a39ef5cba347c68ce27d8fea0970c21a2425f25e05882" -v "$VERSION_ID" || {
  echo "Failed to set via CLI, trying deploy with inline env..."
}

# Deploy
echo "Deploying..."
export VULTR_DB_API_KEY="e66e2a9c1e0b881c349a39ef5cba347c68ce27d8fea0970c21a2425f25e05882"
raindrop build deploy --amend

echo "✓ Deployment complete"
