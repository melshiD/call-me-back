#!/bin/bash

# Deploy Deepgram proxy to existing server (alongside DB proxy)
# This adds the Deepgram proxy to your ai-tools-marketplace.io server

set -e

echo "🚀 Deploying Deepgram Proxy to existing server..."

# Package files for deployment
echo "📦 Creating deployment package..."
tar -czf deepgram-proxy-deploy.tar.gz \
  package.json \
  index.js \
  .env

echo ""
echo "✅ Package created: deepgram-proxy-deploy.tar.gz"
echo ""
echo "📋 Next steps - Run these commands:"
echo ""
echo "1. Copy package to your server:"
echo "   scp deepgram-proxy-deploy.tar.gz root@ai-tools-marketplace.io:/opt/"
echo ""
echo "2. SSH into your server:"
echo "   ssh root@ai-tools-marketplace.io"
echo ""
echo "3. On the server, run:"
echo "   cd /opt"
echo "   mkdir -p deepgram-proxy"
echo "   tar -xzf deepgram-proxy-deploy.tar.gz -C deepgram-proxy"
echo "   cd deepgram-proxy"
echo "   npm install --production"
echo "   pm2 start index.js --name deepgram-proxy"
echo "   pm2 save"
echo ""
echo "4. Open port 8080 in firewall (if not already open):"
echo "   ufw allow 8080/tcp"
echo ""
echo "5. Test the proxy:"
echo "   curl http://ai-tools-marketplace.io:8080/health"
echo ""
echo "Your proxy will be available at: ws://ai-tools-marketplace.io:8080/deepgram"
