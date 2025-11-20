#!/bin/bash
# Extract only needed variables from parent .env

source ../.env

cat > .env << EOF
PORT=3001
NODE_ENV=production

# Vultr Local Paths
VULTR_VOICE_LOG_PATH=/root/.pm2/logs/voice-pipeline-out.log
VULTR_DB_LOG_PATH=/root/.pm2/logs/db-proxy-out.log

# Twilio API
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}

# PostgreSQL Connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=call_me_back
POSTGRES_USER=cmb_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Cache Settings
CACHE_TTL=300

# Admin Authentication
ADMIN_SECRET_TOKEN=${ADMIN_SECRET_TOKEN}
EOF

echo "Environment variables loaded from parent .env"
