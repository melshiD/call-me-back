#!/bin/bash

# Deploy log-query-service to Vultr VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Deploying log-query-service to Vultr..."

# Build tarball
echo "📦 Creating deployment package..."
tar -czf log-query-service.tar.gz \
  server.js \
  package.json \
  ecosystem.config.js \
  setup-env.sh \
  collectors/ \
  trackers/ \
  routes/ \
  utils/

# Copy to Vultr
echo "📤 Uploading to Vultr..."
scp log-query-service.tar.gz root@144.202.15.249:/root/

# SSH and deploy
echo "🔧 Extracting and installing..."
ssh root@144.202.15.249 << 'ENDSSH'
  cd /root
  mkdir -p log-query-service
  tar -xzf log-query-service.tar.gz -C log-query-service/
  cd log-query-service

  # Setup environment (will read from root .env if it exists on Vultr)
  if [ -f "../.env" ]; then
    chmod +x setup-env.sh
    ./setup-env.sh
  else
    echo "⚠️  No root .env found, you'll need to create .env manually"
  fi

  npm install --production

  # Stop if already running
  pm2 delete log-query-service 2>/dev/null || true

  # Start with PM2
  pm2 start ecosystem.config.js
  pm2 save

  echo "✅ Deployment complete!"
  echo "📊 PM2 Status:"
  pm2 status
ENDSSH

# Cleanup local tarball
rm log-query-service.tar.gz

echo "✨ Service deployed successfully!"
echo "🔍 Check status: ssh root@144.202.15.249 'pm2 status'"
echo "📋 View logs: ssh root@144.202.15.249 'pm2 logs log-query-service'"
echo "🌐 Test: curl https://logs.ai-tools-marketplace.io/health"
echo ""
echo "⚠️  Don't forget to configure Caddy reverse proxy!"
echo "    See DEPLOYMENT_INSTRUCTIONS.md for details"
