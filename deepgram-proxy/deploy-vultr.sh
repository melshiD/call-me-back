#!/bin/bash

# Simple deployment script for Vultr Compute Instance
# Run this ON your Vultr server after uploading the files

set -e

echo "🚀 Deploying Deepgram Proxy to Vultr..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create .env if doesn't exist
if [ ! -f .env ]; then
    echo "⚠️  .env file not found! Creating from example..."
    cp .env.example .env
    echo "❗ Please edit .env and add your DEEPGRAM_API_KEY"
    exit 1
fi

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 stop deepgram-proxy 2>/dev/null || true
pm2 start index.js --name deepgram-proxy
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs deepgram-proxy"
echo "🔄 Restart: pm2 restart deepgram-proxy"
echo ""
echo "Your proxy should be running on port 8080"
echo "Make sure to open port 8080 in Vultr firewall!"
