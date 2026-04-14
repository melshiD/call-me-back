#!/bin/bash
# =============================================================================
# CallbackApp API Server - Vultr VPS Deployment Script
# =============================================================================
#
# Deploys the new Express/Hono API server to the Vultr VPS.
# Follows existing deployment patterns from voice-pipeline-nodejs/deploy.sh.
#
# Usage:
#   ./deploy.sh              # Full deploy (build, upload, install, start)
#   ./deploy.sh --sync-only  # Upload code only, no restart
#   ./deploy.sh --restart    # Restart PM2 process only
#   ./deploy.sh --setup      # First-time setup (install Redis, create dirs, Caddy)
#
# Prerequisites:
#   - SSH key at ~/.ssh/vultr_cmb
#   - Node.js 18+ on Vultr (already installed)
#   - PM2 installed globally on Vultr (already installed)
#   - Caddy installed on Vultr (already installed)
#   - PostgreSQL 14 running on Vultr (already running)
#
# =============================================================================

set -euo pipefail

# --- Configuration ---
VULTR_HOST="root@144.202.15.249"
SSH_KEY="$HOME/.ssh/vultr_cmb"
DEPLOY_PATH="/opt/api-server"
LOCAL_SERVER_DIR="$(cd "$(dirname "$0")" && pwd)"
PM2_NAME="api-server"
PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
err()  { echo -e "${RED}[deploy]${NC} $1"; }

ssh_cmd() {
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VULTR_HOST" "$@"
}

scp_cmd() {
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$@"
}

# --- Pre-flight checks ---
preflight() {
  log "Running pre-flight checks..."

  if [ ! -f "$SSH_KEY" ]; then
    err "SSH key not found at $SSH_KEY"
    exit 1
  fi

  if [ ! -f "$LOCAL_SERVER_DIR/package.json" ]; then
    err "package.json not found. Run this script from the server/ directory."
    exit 1
  fi

  # Test SSH connection
  if ! ssh_cmd "echo ok" > /dev/null 2>&1; then
    err "Cannot SSH to $VULTR_HOST. Check your SSH key and network."
    exit 1
  fi

  log "Pre-flight checks passed."
}

# --- First-time setup ---
setup() {
  log "=== First-time setup ==="

  # Install Redis if not present
  log "Checking Redis..."
  if ssh_cmd "which redis-server > /dev/null 2>&1"; then
    log "Redis already installed."
  else
    log "Installing Redis..."
    ssh_cmd "apt-get update -qq && apt-get install -y -qq redis-server"
    ssh_cmd "systemctl enable redis-server && systemctl start redis-server"
    log "Redis installed and started."
  fi

  # Verify Redis is running
  if ssh_cmd "redis-cli ping" | grep -q "PONG"; then
    log "Redis is running."
  else
    warn "Redis not responding. Starting it..."
    ssh_cmd "systemctl start redis-server"
  fi

  # Create deploy directory
  log "Creating deploy directory at $DEPLOY_PATH..."
  ssh_cmd "mkdir -p $DEPLOY_PATH"

  # Stop old db-proxy on port 3000 (our new API server takes its place)
  log "Checking for old db-proxy on port $PORT..."
  if ssh_cmd "pm2 describe db-proxy > /dev/null 2>&1"; then
    warn "Stopping old db-proxy (port $PORT will be used by new API server)..."
    ssh_cmd "pm2 stop db-proxy || true"
    warn "db-proxy stopped. It is NOT deleted — use 'pm2 delete db-proxy' to remove it permanently."
    warn "NOTE: The new API server connects to PostgreSQL directly. The HTTP bridge is no longer needed."
  else
    log "No db-proxy running."
  fi

  # Add Caddy config for api.callbackapp.ai
  log "Configuring Caddy for api.callbackapp.ai..."
  ssh_cmd "cat /etc/caddy/Caddyfile" > /tmp/current_caddyfile 2>/dev/null || true

  if grep -q "api.callbackapp.ai" /tmp/current_caddyfile 2>/dev/null; then
    log "Caddy already has api.callbackapp.ai configured."
  else
    log "Adding api.callbackapp.ai to Caddy..."
    ssh_cmd "cat >> /etc/caddy/Caddyfile << 'CADDY_EOF'

api.callbackapp.ai {
    reverse_proxy localhost:$PORT
    encode gzip
    log {
        output file /var/log/caddy/api-server.log
        format json
    }
}
CADDY_EOF"
    log "Validating Caddy config..."
    if ssh_cmd "caddy validate --config /etc/caddy/Caddyfile 2>&1"; then
      ssh_cmd "systemctl reload caddy"
      log "Caddy reloaded with new config."
    else
      err "Caddy config validation failed! Check /etc/caddy/Caddyfile on the VPS."
      exit 1
    fi
  fi

  rm -f /tmp/current_caddyfile

  log "=== Setup complete ==="
  log ""
  log "Next steps:"
  log "  1. Create .env file on VPS: ssh -i $SSH_KEY $VULTR_HOST 'nano $DEPLOY_PATH/.env'"
  log "  2. Use server/.env.example as template"
  log "  3. Set DATABASE_URL to: postgresql://callmeback_user:<password>@localhost:5432/callmeback"
  log "  4. Set REDIS_URL to: redis://localhost:6379"
  log "  5. Copy API keys from existing Raindrop env or VPS .env files"
  log "  6. Run: ./deploy.sh  (to do the full deploy)"
}

# --- Build locally ---
build() {
  log "Building TypeScript..."
  cd "$LOCAL_SERVER_DIR"

  # Clean previous build
  rm -rf dist/

  # Compile
  if npx tsc 2>&1; then
    log "Build successful."
  else
    err "TypeScript compilation failed!"
    exit 1
  fi
}

# --- Upload to VPS ---
upload() {
  log "Packaging for upload..."
  cd "$LOCAL_SERVER_DIR"

  # Create tarball excluding things we don't need on the server
  tar -czf /tmp/api-server.tar.gz \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='dist' \
    --exclude='.git' \
    package.json \
    package-lock.json \
    tsconfig.json \
    ecosystem.config.cjs \
    src/

  local size=$(du -h /tmp/api-server.tar.gz | cut -f1)
  log "Package size: $size"

  log "Uploading to $VULTR_HOST:$DEPLOY_PATH..."
  scp_cmd /tmp/api-server.tar.gz "$VULTR_HOST:/tmp/api-server.tar.gz"

  log "Extracting on VPS..."
  ssh_cmd "cd $DEPLOY_PATH && tar -xzf /tmp/api-server.tar.gz && rm /tmp/api-server.tar.gz"

  rm -f /tmp/api-server.tar.gz
  log "Upload complete."
}

# --- Install dependencies + build on VPS ---
install_and_build() {
  log "Installing dependencies on VPS..."
  ssh_cmd "cd $DEPLOY_PATH && npm install --production=false 2>&1 | tail -5"

  log "Building TypeScript on VPS..."
  ssh_cmd "cd $DEPLOY_PATH && npx tsc 2>&1"
  log "Build successful on VPS."
}

# --- Start/restart PM2 ---
start() {
  log "Starting API server via PM2..."

  # Check if already running
  if ssh_cmd "pm2 describe $PM2_NAME > /dev/null 2>&1"; then
    log "Restarting existing PM2 process..."
    ssh_cmd "cd $DEPLOY_PATH && pm2 restart $PM2_NAME"
  else
    log "Starting new PM2 process..."
    ssh_cmd "cd $DEPLOY_PATH && pm2 start ecosystem.config.cjs"
  fi

  # Save PM2 config for reboot persistence
  ssh_cmd "pm2 save"

  # Wait a moment then check health
  sleep 3
  log "Checking health..."
  local health
  health=$(ssh_cmd "curl -s http://localhost:$PORT/health" 2>/dev/null || echo '{"error":"unreachable"}')
  echo "  Health: $health"

  if echo "$health" | grep -q '"healthy"'; then
    log "API server is healthy!"
  elif echo "$health" | grep -q '"degraded"'; then
    warn "API server is running but degraded. Check Redis/DB connectivity."
  else
    err "API server may not have started correctly. Check logs:"
    err "  ssh -i $SSH_KEY $VULTR_HOST 'pm2 logs $PM2_NAME --lines 50'"
  fi
}

# --- Verify deployment ---
verify() {
  log "=== Deployment Verification ==="

  log "PM2 status:"
  ssh_cmd "pm2 list" 2>/dev/null | grep -E "Name|$PM2_NAME|voice-pipeline" || true

  log ""
  log "Health check (localhost):"
  ssh_cmd "curl -s http://localhost:$PORT/health" 2>/dev/null || echo "  [unreachable]"

  log ""
  log "Testing external endpoint (if DNS is configured)..."
  if curl -s --max-time 5 "https://api.callbackapp.ai/health" 2>/dev/null | grep -q "status"; then
    log "External endpoint responding!"
    curl -s "https://api.callbackapp.ai/health" 2>/dev/null
  else
    warn "External endpoint not reachable. Check DNS and Caddy config."
    warn "DNS should point api.callbackapp.ai to 144.202.15.249"
  fi

  log ""
  log "Testing TwiML answer endpoint..."
  local twiml
  twiml=$(ssh_cmd "curl -s -X POST 'http://localhost:$PORT/api/voice/answer?callId=test&userId=test&personaId=brad_001'" 2>/dev/null || echo "")
  if echo "$twiml" | grep -q "Stream"; then
    log "TwiML endpoint working! WebSocket URL in response:"
    echo "$twiml" | grep -o 'url="[^"]*"' || echo "  (check manually)"
  else
    warn "TwiML endpoint may not be working. Check server logs."
  fi

  log ""
  log "=== Verification complete ==="
}

# --- Main ---
case "${1:-full}" in
  --setup)
    preflight
    setup
    ;;
  --sync-only)
    preflight
    upload
    install_and_build
    log "Sync complete. Use --restart to apply changes."
    ;;
  --restart)
    preflight
    start
    verify
    ;;
  --verify)
    preflight
    verify
    ;;
  full|*)
    preflight
    build
    upload
    install_and_build
    start
    verify
    log ""
    log "=== Deployment complete! ==="
    log ""
    log "Useful commands:"
    log "  Logs:    ssh -i $SSH_KEY $VULTR_HOST 'pm2 logs $PM2_NAME --lines 100'"
    log "  Status:  ssh -i $SSH_KEY $VULTR_HOST 'pm2 status'"
    log "  Restart: ssh -i $SSH_KEY $VULTR_HOST 'pm2 restart $PM2_NAME'"
    log "  Health:  curl https://api.callbackapp.ai/health"
    ;;
esac
