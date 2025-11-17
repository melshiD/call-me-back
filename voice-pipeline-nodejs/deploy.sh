#!/bin/bash

# Deploy voice pipeline to Vultr server
# Run this script from the voice-pipeline-nodejs directory

set -e

echo "🚀 Deploying Voice Pipeline to Vultr..."

# 1. Create deployment package
echo "📦 Creating deployment package..."
tar -czf voice-pipeline-deploy.tar.gz \
  package.json \
  index.js \
  .env

# 2. Copy to server
echo "📤 Copying to Vultr server..."
scp -i ~/.ssh/vultr_cmb voice-pipeline-deploy.tar.gz root@144.202.15.249:/opt/

# 3. Deploy on server
echo "🔧 Deploying on server..."
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 << 'EOF'
cd /opt
mkdir -p voice-pipeline
tar -xzf voice-pipeline-deploy.tar.gz -C voice-pipeline
cd voice-pipeline
npm install --production

# Stop old process if running
pm2 stop voice-pipeline 2>/dev/null || true
pm2 delete voice-pipeline 2>/dev/null || true

# Start new process
pm2 start index.js --name voice-pipeline
pm2 save

echo ""
echo "✅ Voice Pipeline deployed successfully!"
echo ""
pm2 status
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Service URL: ws://144.202.15.249:8001/stream"
echo "Health check: curl http://144.202.15.249:8001/health"
echo ""
echo "View logs: ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline'"
