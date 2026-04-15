#!/bin/bash
# =============================================================================
# Safely set missing secrets on the VPS
# =============================================================================
#
# Usage:
#   1. Create a temporary secrets file:
#        cp set-secrets.template /tmp/secrets.conf
#        nano /tmp/secrets.conf     # paste your values
#
#   2. Run this script:
#        ./set-secrets.sh /tmp/secrets.conf
#
#   3. The script will:
#        - Read each KEY=VALUE from the file
#        - Update the corresponding line in /opt/api-server/.env on the VPS via SSH
#        - Shred and delete the local secrets file
#        - Verify the update (shows var names only, never values)
#
# The secrets file is NEVER committed, logged, or echoed. It's destroyed after use.
# Shell history is not affected (no secrets in command args).
#
# =============================================================================

set -euo pipefail

VULTR_HOST="root@144.202.15.249"
SSH_KEY="$HOME/.ssh/vultr_cmb"
ENV_FILE="/opt/api-server/.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[secrets]${NC} $1"; }
warn() { echo -e "${YELLOW}[secrets]${NC} $1"; }
err()  { echo -e "${RED}[secrets]${NC} $1"; }

SECRETS_FILE="${1:-}"

if [ -z "$SECRETS_FILE" ]; then
  err "Usage: ./set-secrets.sh <path-to-secrets-file>"
  err ""
  err "Example:"
  err "  cp set-secrets.template /tmp/secrets.conf"
  err "  nano /tmp/secrets.conf"
  err "  ./set-secrets.sh /tmp/secrets.conf"
  exit 1
fi

if [ ! -f "$SECRETS_FILE" ]; then
  err "File not found: $SECRETS_FILE"
  exit 1
fi

# Pre-flight
if ! ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VULTR_HOST" "test -f $ENV_FILE" 2>/dev/null; then
  err "Remote .env file not found at $ENV_FILE. Run build-env.sh first."
  exit 1
fi

log "Reading secrets from $SECRETS_FILE..."

COUNT=0
UPDATED=0

while IFS= read -r line; do
  # Skip comments and blank lines
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue

  # Parse KEY=VALUE
  KEY=$(echo "$line" | cut -d'=' -f1 | tr -d '[:space:]')
  VALUE=$(echo "$line" | cut -d'=' -f2-)

  # Skip if key is empty or value is a placeholder
  [ -z "$KEY" ] && continue
  [[ "$VALUE" =~ ^xxxxx ]] && continue
  [[ "$VALUE" =~ ^your_ ]] && continue
  [[ "$VALUE" =~ ^\< ]] && continue
  [ -z "$VALUE" ] && continue

  COUNT=$((COUNT + 1))

  # Update on VPS via SSH — the value is piped through stdin, not in command args
  # This prevents it from appearing in shell history or process listing
  echo "$VALUE" | ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VULTR_HOST" \
    "VALUE=\$(cat); sed -i \"s|^${KEY}=.*|${KEY}=\${VALUE}|\" $ENV_FILE" 2>/dev/null

  if [ $? -eq 0 ]; then
    log "  Updated: $KEY"
    UPDATED=$((UPDATED + 1))
  else
    err "  Failed: $KEY"
  fi
done < "$SECRETS_FILE"

log ""
log "$UPDATED/$COUNT secrets updated on VPS."

# Shred the local secrets file
log "Destroying local secrets file..."
if command -v shred > /dev/null 2>&1; then
  shred -u "$SECRETS_FILE"
else
  rm -f "$SECRETS_FILE"
fi
log "Local secrets file destroyed."

# Verify — show which vars are still empty (names only, never values)
log ""
log "Remaining empty vars on VPS:"
EMPTY=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VULTR_HOST" \
  "grep -E '^[A-Z_]+=\$' $ENV_FILE" 2>/dev/null || echo "")

if [ -z "$EMPTY" ]; then
  log "  None! All variables are populated."
else
  echo "$EMPTY" | while IFS= read -r line; do
    warn "  $line"
  done
fi
