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

# PostgreSQL Connection (uses same credentials as db-proxy)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=call_me_back
POSTGRES_USER=cmb_user
POSTGRES_PASSWORD=R7BcHfxm8O3ivSwd3nauxL24/7un3pCL8dGihpURc5g=

# Cache Settings
CACHE_TTL=300

# Admin Authentication
ADMIN_SECRET_TOKEN=${ADMIN_SECRET_TOKEN}

# WorkOS OAuth (for admin login)
WORKOS_API_KEY=${WORKOS_API_KEY}
WORKOS_CLIENT_ID=${WORKOS_CLIENT_ID}
WORKOS_REDIRECT_URI=https://logs.ai-tools-marketplace.io/api/admin/auth/callback
FRONTEND_URL=https://call-me-back.vercel.app
EOF

echo "Environment variables loaded from parent .env"
