#!/bin/bash
# Script to set Vultr environment variables in Raindrop
# Run this manually to avoid exposing secrets in logs

echo "Setting Vultr DB API key in Raindrop..."
raindrop env set VULTR_DB_API_KEY e66e2a9c1e0b881c349a39ef5cba347c68ce27d8fea0970c21a2425f25e05882

echo ""
echo "✓ Environment variable set"
echo ""
echo "Now run: raindrop build deploy"
