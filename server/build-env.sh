#!/bin/bash
# =============================================================================
# Build .env for the new API server by extracting secrets from existing
# VPS service .env files. No secrets are displayed — they go directly
# into /opt/api-server/.env on the VPS.
#
# Usage:
#   ./build-env.sh           # Build .env on VPS from existing service configs
#   ./build-env.sh --dry-run # Show what would be extracted (var names only, no values)
#
# Sources:
#   /root/db-proxy/.env             → DB creds, API_KEY (becomes VULTR_DB_API_KEY)
#   /opt/voice-pipeline/.env        → Deepgram, Cerebras, ElevenLabs, Twilio keys
#   /root/log-query-service/.env    → Twilio creds (backup source)
#   /root/call-me-back-raindrop/    → Raindrop project (JWT_SECRET, Stripe, etc.)
#
# Secrets that can't be found are left as placeholders for manual entry.
# =============================================================================

set -euo pipefail

VULTR_HOST="root@144.202.15.249"
SSH_KEY="$HOME/.ssh/vultr_cmb"
DEPLOY_PATH="/opt/api-server"
DRY_RUN="${1:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[env-builder]${NC} $1"; }
warn() { echo -e "${YELLOW}[env-builder]${NC} $1"; }
info() { echo -e "${CYAN}[env-builder]${NC} $1"; }

ssh_cmd() {
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VULTR_HOST" "$@"
}

# Pre-flight
if [ ! -f "$SSH_KEY" ]; then
  echo -e "${RED}SSH key not found at $SSH_KEY${NC}"
  exit 1
fi

if ! ssh_cmd "echo ok" > /dev/null 2>&1; then
  echo -e "${RED}Cannot SSH to $VULTR_HOST${NC}"
  exit 1
fi

log "Connected to VPS. Extracting secrets from existing service configs..."
log ""

if [ "$DRY_RUN" = "--dry-run" ]; then
  log "DRY RUN — showing variable sources (no values)"
  log ""
fi

# Build the .env file on the VPS using a heredoc + inline extraction
# This never exposes secrets locally — everything runs server-side
ssh_cmd "bash -s -- $DRY_RUN" << 'REMOTE_SCRIPT'
set -euo pipefail

DEPLOY_PATH="/opt/api-server"
ENV_FILE="$DEPLOY_PATH/.env"
DRY_RUN="${1:-}"

# Helper: extract a var from a .env file
get_env() {
  local file="$1"
  local var="$2"
  if [ -f "$file" ]; then
    grep -E "^${var}=" "$file" 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo ""
  else
    echo ""
  fi
}

# Helper: try multiple sources for a var
find_secret() {
  local var_name="$1"
  shift
  local value=""
  for source in "$@"; do
    local file=$(echo "$source" | cut -d: -f1)
    local key=$(echo "$source" | cut -d: -f2)
    value=$(get_env "$file" "$key")
    if [ -n "$value" ]; then
      echo "$value"
      return 0
    fi
  done
  echo ""
  return 1
}

# Source files
DB_PROXY_ENV="/root/db-proxy/.env"
VOICE_ENV="/opt/voice-pipeline/.env"
LOG_ENV="/root/log-query-service/.env"

echo "=== Scanning existing .env files ==="
for f in "$DB_PROXY_ENV" "$VOICE_ENV" "$LOG_ENV"; do
  if [ -f "$f" ]; then
    echo "  FOUND: $f ($(wc -l < "$f") lines)"
  else
    echo "  MISSING: $f"
  fi
done
echo ""

# --- Extract all secrets ---

# Database: build DATABASE_URL from db-proxy .env components
DB_HOST=$(get_env "$DB_PROXY_ENV" "DB_HOST")
DB_PORT=$(get_env "$DB_PROXY_ENV" "DB_PORT")
DB_NAME=$(get_env "$DB_PROXY_ENV" "DB_NAME")
DB_USER=$(get_env "$DB_PROXY_ENV" "DB_USER")
DB_PASSWORD=$(get_env "$DB_PROXY_ENV" "DB_PASSWORD")

if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST:-localhost}:${DB_PORT:-5432}/${DB_NAME:-callmeback}"
  echo "  DATABASE_URL: assembled from db-proxy .env"
else
  DATABASE_URL=""
  echo "  DATABASE_URL: *** MISSING - need DB_USER/DB_PASSWORD from db-proxy ***"
fi

# Twilio
TWILIO_ACCOUNT_SID=$(find_secret "TWILIO_ACCOUNT_SID" \
  "$VOICE_ENV:TWILIO_ACCOUNT_SID" \
  "$LOG_ENV:TWILIO_ACCOUNT_SID" || echo "")
echo "  TWILIO_ACCOUNT_SID: $([ -n "$TWILIO_ACCOUNT_SID" ] && echo 'found' || echo '*** MISSING ***')"

TWILIO_AUTH_TOKEN=$(find_secret "TWILIO_AUTH_TOKEN" \
  "$VOICE_ENV:TWILIO_AUTH_TOKEN" \
  "$LOG_ENV:TWILIO_AUTH_TOKEN" || echo "")
echo "  TWILIO_AUTH_TOKEN: $([ -n "$TWILIO_AUTH_TOKEN" ] && echo 'found' || echo '*** MISSING ***')"

TWILIO_VERIFY_SERVICE_SID=$(find_secret "TWILIO_VERIFY_SERVICE_SID" \
  "$VOICE_ENV:TWILIO_VERIFY_SERVICE_SID" \
  "$LOG_ENV:TWILIO_VERIFY_SERVICE_SID" || echo "")
echo "  TWILIO_VERIFY_SERVICE_SID: $([ -n "$TWILIO_VERIFY_SERVICE_SID" ] && echo 'found' || echo '*** MISSING ***')"

# AI Providers
CEREBRAS_API_KEY=$(find_secret "CEREBRAS_API_KEY" \
  "$VOICE_ENV:CEREBRAS_API_KEY" || echo "")
echo "  CEREBRAS_API_KEY: $([ -n "$CEREBRAS_API_KEY" ] && echo 'found' || echo '*** MISSING ***')"

DEEPGRAM_API_KEY=$(find_secret "DEEPGRAM_API_KEY" \
  "$VOICE_ENV:DEEPGRAM_API_KEY" || echo "")
echo "  DEEPGRAM_API_KEY: $([ -n "$DEEPGRAM_API_KEY" ] && echo 'found' || echo '*** MISSING ***')"

ELEVENLABS_API_KEY=$(find_secret "ELEVENLABS_API_KEY" \
  "$VOICE_ENV:ELEVENLABS_API_KEY" || echo "")
echo "  ELEVENLABS_API_KEY: $([ -n "$ELEVENLABS_API_KEY" ] && echo 'found' || echo '*** MISSING ***')"

# JWT Secret — check if Raindrop project has a local .env or config
JWT_SECRET=$(find_secret "JWT_SECRET" \
  "$VOICE_ENV:JWT_SECRET" \
  "$LOG_ENV:JWT_SECRET" || echo "")
# If not found in any .env, check raindrop project
if [ -z "$JWT_SECRET" ]; then
  # Try the raindrop env files
  for f in /root/call-me-back-raindrop/.env /root/call-me-back-raindrop/src/.env; do
    if [ -f "$f" ]; then
      JWT_SECRET=$(get_env "$f" "JWT_SECRET")
      [ -n "$JWT_SECRET" ] && break
    fi
  done
fi
echo "  JWT_SECRET: $([ -n "$JWT_SECRET" ] && echo 'found' || echo '*** MISSING - will generate new one ***')"

# Generate JWT_SECRET if not found anywhere
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  echo "  JWT_SECRET: generated new 64-char random secret"
fi

# Stripe — these were in Raindrop cloud, may not be on VPS
STRIPE_SECRET_KEY=$(find_secret "STRIPE_SECRET_KEY" \
  "$LOG_ENV:STRIPE_SECRET_KEY" \
  "$VOICE_ENV:STRIPE_SECRET_KEY" || echo "")
echo "  STRIPE_SECRET_KEY: $([ -n "$STRIPE_SECRET_KEY" ] && echo 'found' || echo '*** MISSING - set manually ***')"

STRIPE_WEBHOOK_SECRET=$(find_secret "STRIPE_WEBHOOK_SECRET" \
  "$LOG_ENV:STRIPE_WEBHOOK_SECRET" \
  "$VOICE_ENV:STRIPE_WEBHOOK_SECRET" || echo "")
echo "  STRIPE_WEBHOOK_SECRET: $([ -n "$STRIPE_WEBHOOK_SECRET" ] && echo 'found' || echo '*** MISSING - set manually ***')"

# Admin token
ADMIN_SECRET_TOKEN=$(find_secret "ADMIN_SECRET_TOKEN" \
  "$LOG_ENV:ADMIN_SECRET_TOKEN" \
  "$VOICE_ENV:ADMIN_SECRET_TOKEN" || echo "")
if [ -z "$ADMIN_SECRET_TOKEN" ]; then
  ADMIN_SECRET_TOKEN=$(openssl rand -hex 16)
  echo "  ADMIN_SECRET_TOKEN: generated new token"
else
  echo "  ADMIN_SECRET_TOKEN: found"
fi

echo ""

# --- Write the .env file ---
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "=== DRY RUN — would write to $ENV_FILE ==="
  echo "(Run without --dry-run to create the file)"
  exit 0
fi

mkdir -p "$DEPLOY_PATH"

cat > "$ENV_FILE" << ENVEOF
# =============================================================================
# CallbackApp API Server - Production Environment
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Source: Assembled from existing VPS service .env files
# =============================================================================

# Database (direct connection — no HTTP proxy needed)
DATABASE_URL=${DATABASE_URL}

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=30d

# Twilio
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
TWILIO_PHONE_NUMBER=+17622526613
TWILIO_VERIFY_SERVICE_SID=${TWILIO_VERIFY_SERVICE_SID}

# AI Providers
CEREBRAS_API_KEY=${CEREBRAS_API_KEY}
DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
STRIPE_PRICE_TWENTY_FIVE_MIN=price_1SYrTJA358BGMOqmgLSmViHy
STRIPE_PRICE_FIFTY_MIN=price_1SYrTKA358BGMOqmc3piklNb
STRIPE_PRICE_ONE_HUNDRED_MIN=price_1SYrTLA358BGMOqm3AxzcRxL

# URLs
API_BASE_URL=https://api.callbackapp.ai
VOICE_WS_URL=wss://voice.callbackapp.ai/stream
FRONTEND_URL=https://callbackapp.ai

# Admin
ADMIN_SECRET_TOKEN=${ADMIN_SECRET_TOKEN}

# Server
PORT=3000
NODE_ENV=production
ENVEOF

chmod 600 "$ENV_FILE"
echo "=== .env written to $ENV_FILE ==="
echo "    Permissions: 600 (owner read/write only)"
echo ""

# Count what's missing
MISSING=0
while IFS= read -r line; do
  if echo "$line" | grep -qE '^[A-Z_]+=\s*$'; then
    VAR=$(echo "$line" | cut -d= -f1)
    echo "  *** NEEDS MANUAL ENTRY: $VAR"
    MISSING=$((MISSING + 1))
  fi
done < "$ENV_FILE"

if [ "$MISSING" -gt 0 ]; then
  echo ""
  echo "  $MISSING variable(s) need manual entry."
  echo "  Edit with: nano $ENV_FILE"
else
  echo ""
  echo "  All variables populated!"
fi
REMOTE_SCRIPT

log ""
log "Done. Review the .env on VPS with:"
log "  ssh -i $SSH_KEY $VULTR_HOST 'cat $DEPLOY_PATH/.env | grep -E \"^[A-Z]\" | cut -d= -f1'"
log ""
log "To see which vars are empty:"
log "  ssh -i $SSH_KEY $VULTR_HOST 'grep -E \"^[A-Z_]+=\$\" $DEPLOY_PATH/.env'"
