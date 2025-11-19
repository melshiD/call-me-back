#!/bin/bash

# Setup environment for log-query-service by reading from root .env
# Usage: ./setup-env.sh

ROOT_ENV="../.env"
SERVICE_ENV=".env"

echo "Setting up log-query-service environment..."

# Check if root .env exists
if [ ! -f "$ROOT_ENV" ]; then
  echo "Error: Root .env file not found at $ROOT_ENV"
  exit 1
fi

# Source the root .env to get all variables
set -a
source "$ROOT_ENV"
set +a

# Create/overwrite service .env
cat > "$SERVICE_ENV" << EOF
# Server Configuration
PORT=3001
NODE_ENV=production

# Vultr Local Paths (service-specific)
VULTR_VOICE_LOG_PATH=/var/log/pm2/voice-pipeline-out.log
VULTR_DB_LOG_PATH=/var/log/pm2/db-proxy-out.log

# Twilio API (piped from root .env)
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID:-your_account_sid_here}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN:-your_auth_token_here}

# PostgreSQL Connection (piped from root .env)
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_DB=${POSTGRES_DB:-callmeback}
POSTGRES_USER=${POSTGRES_USER:-your_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-your_password}

# Cache Settings
CACHE_TTL=300
EOF

echo "✅ Environment file created at $SERVICE_ENV"
echo "Variables piped from root .env:"
[ -n "$TWILIO_ACCOUNT_SID" ] && echo "  ✓ TWILIO_ACCOUNT_SID"
[ -n "$TWILIO_AUTH_TOKEN" ] && echo "  ✓ TWILIO_AUTH_TOKEN"
[ -n "$POSTGRES_HOST" ] && echo "  ✓ POSTGRES_HOST"
[ -n "$POSTGRES_PORT" ] && echo "  ✓ POSTGRES_PORT"
[ -n "$POSTGRES_DB" ] && echo "  ✓ POSTGRES_DB"
[ -n "$POSTGRES_USER" ] && echo "  ✓ POSTGRES_USER"
[ -n "$POSTGRES_PASSWORD" ] && echo "  ✓ POSTGRES_PASSWORD"

echo ""
echo "Review $SERVICE_ENV and adjust as needed."
