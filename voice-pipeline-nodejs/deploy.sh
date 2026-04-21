#!/bin/bash
# =============================================================================
# Voice Pipeline — Vultr VPS Deployment Script (safe rewrite)
# =============================================================================
#
# Encodes the NSL-proven manual deployment ritual into a single command.
# Replaces the older deploy.sh (preserved as deploy.sh.old), which had these
# problems:
#   - Included .env in the tarball (overwrote the VPS .env every deploy)
#   - No `node --check` preflight (bad syntax crashed the VPS process)
#   - `pm2 stop && pm2 delete && pm2 start` dropped all in-flight calls and
#     reset the restart counter / logs
#   - `npm install --production` ran on every deploy (slow, pointless when deps
#     unchanged)
#
# What this script does (default flow):
#   1. Local `node --check` on index.js  — fail fast before touching the VPS
#   2. Remote backup  /opt/voice-pipeline/index.js → index.js.bak.<epoch>
#   3. `scp` ONLY index.js to the VPS  (NOT .env, NOT package.json, NOT deps)
#   4. Remote `node --check`  — belt + suspenders
#   5. `pm2 restart voice-pipeline`  — preserves pm2 state, no process replace
#   6. Brief verification via `pm2 status`
#
# Usage:
#   ./deploy.sh               # default: code-only deploy of index.js
#   ./deploy.sh --with-deps   # also sync package.json + package-lock.json and
#                             # run `npm install` on VPS. Use when deps changed.
#   ./deploy.sh --dry-run     # local checks only; skip upload/restart
#   ./deploy.sh --rollback    # restore the most recent index.js.bak.<epoch>
#                             # and pm2 restart
#   ./deploy.sh --list-backups# list all index.js.bak.<epoch> files on the VPS
#   ./deploy.sh --help        # show this message
#
# Run from: voice-pipeline-nodejs/
#
# Prerequisites:
#   - SSH key at ~/.ssh/vultr_cmb
#   - Target VPS: root@144.202.15.249
#   - Remote pm2 process named "voice-pipeline" already exists
#
# =============================================================================

set -euo pipefail

# --- Configuration ---
VPS_HOST="root@144.202.15.249"
SSH_KEY="$HOME/.ssh/vultr_cmb"
REMOTE_DIR="/opt/voice-pipeline"
PM2_NAME="voice-pipeline"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
info() { echo -e "${BLUE}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
err()  { echo -e "${RED}[deploy]${NC} $1" >&2; }

ssh_vps() {
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPS_HOST" "$@"
}

scp_to_vps() {
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$@"
}

# --- Preflight ---
preflight() {
  log "Preflight checks..."

  if [ ! -f "$SSH_KEY" ]; then
    err "SSH key not found at $SSH_KEY"
    exit 1
  fi

  if [ ! -f "$LOCAL_DIR/index.js" ]; then
    err "index.js not found in $LOCAL_DIR. Run this script from voice-pipeline-nodejs/."
    exit 1
  fi

  if ! ssh_vps "echo ok" > /dev/null 2>&1; then
    err "Cannot SSH to $VPS_HOST. Check key + network."
    exit 1
  fi

  # Confirm pm2 knows about the voice-pipeline process
  if ! ssh_vps "pm2 describe $PM2_NAME > /dev/null 2>&1"; then
    err "No pm2 process named '$PM2_NAME' on VPS. First-time setup required."
    err "Run manually on VPS: cd $REMOTE_DIR && pm2 start index.js --name $PM2_NAME"
    exit 1
  fi

  log "Preflight passed."
}

# --- Local node --check ---
local_check() {
  log "Local node --check on index.js..."
  if ! node --check "$LOCAL_DIR/index.js"; then
    err "Local syntax check FAILED. Fix and retry."
    exit 1
  fi
  log "Local syntax OK."
}

# --- Remote backup ---
backup_remote() {
  local epoch
  epoch=$(date +%s)
  local backup="$REMOTE_DIR/index.js.bak.$epoch"
  info "Backing up remote index.js → $backup"
  ssh_vps "cp $REMOTE_DIR/index.js $backup"
  echo "$backup"
}

# --- Upload index.js (and optionally deps) ---
upload_code() {
  log "Uploading index.js to $VPS_HOST:$REMOTE_DIR/index.js..."
  scp_to_vps "$LOCAL_DIR/index.js" "$VPS_HOST:$REMOTE_DIR/index.js"
}

upload_deps() {
  log "Uploading package.json + package-lock.json..."
  scp_to_vps \
    "$LOCAL_DIR/package.json" \
    "$LOCAL_DIR/package-lock.json" \
    "$VPS_HOST:$REMOTE_DIR/"
  log "Running npm install on VPS (this may take a minute)..."
  ssh_vps "cd $REMOTE_DIR && npm install --production 2>&1 | tail -5"
}

# --- Remote node --check ---
remote_check() {
  log "Remote node --check on uploaded index.js..."
  if ! ssh_vps "cd $REMOTE_DIR && node --check index.js"; then
    err "Remote syntax check FAILED. VPS index.js is bad."
    err "Rollback with: $0 --rollback"
    exit 1
  fi
  log "Remote syntax OK."
}

# --- pm2 restart + verify ---
restart_and_verify() {
  log "Restarting pm2 process '$PM2_NAME'..."
  ssh_vps "pm2 restart $PM2_NAME"

  sleep 2

  log "pm2 status:"
  ssh_vps "pm2 status $PM2_NAME" || true

  log "Recent log lines:"
  ssh_vps "pm2 logs $PM2_NAME --lines 10 --nostream" || true
}

# --- Cleanup old .bak files (keep N most recent) ---
trim_backups() {
  local keep=${1:-10}
  info "Trimming old backups (keeping $keep most recent)..."
  # shellcheck disable=SC2029
  ssh_vps "cd $REMOTE_DIR && ls -1t index.js.bak.* 2>/dev/null | tail -n +$((keep + 1)) | xargs -r rm -f"
}

# --- Rollback flow ---
rollback() {
  log "=== ROLLBACK ==="

  local latest_backup
  latest_backup=$(ssh_vps "cd $REMOTE_DIR && ls -1t index.js.bak.* 2>/dev/null | head -1" || echo "")

  if [ -z "$latest_backup" ]; then
    err "No backups found in $REMOTE_DIR (index.js.bak.*)"
    exit 1
  fi

  warn "Will restore: $REMOTE_DIR/$latest_backup → $REMOTE_DIR/index.js"
  read -r -p "Proceed? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    info "Aborted."
    exit 0
  fi

  # Before restoring, take a safety snapshot of the current (broken) index.js
  local epoch
  epoch=$(date +%s)
  ssh_vps "cp $REMOTE_DIR/index.js $REMOTE_DIR/index.js.bad.$epoch"
  info "Saved current (broken) index.js → index.js.bad.$epoch"

  ssh_vps "cp $REMOTE_DIR/$latest_backup $REMOTE_DIR/index.js"
  log "Restored $latest_backup → index.js"

  ssh_vps "cd $REMOTE_DIR && node --check index.js"
  log "Restored file passes node --check."

  ssh_vps "pm2 restart $PM2_NAME"
  sleep 2
  ssh_vps "pm2 status $PM2_NAME"

  log "Rollback complete."
}

list_backups() {
  log "Remote backups on $VPS_HOST:$REMOTE_DIR:"
  ssh_vps "cd $REMOTE_DIR && ls -lt index.js.bak.* 2>/dev/null | head -20" || warn "No backups found."
}

show_help() {
  sed -n '2,40p' "$0"
}

# --- Main ---
case "${1:-}" in
  --help|-h)
    show_help
    ;;
  --dry-run)
    log "DRY RUN — no VPS changes"
    preflight
    local_check
    log "Dry run OK. Would upload to $VPS_HOST:$REMOTE_DIR/index.js"
    ;;
  --rollback)
    preflight
    rollback
    ;;
  --list-backups)
    preflight
    list_backups
    ;;
  --with-deps)
    preflight
    local_check
    backup_path=$(backup_remote)
    upload_code
    upload_deps
    remote_check
    restart_and_verify
    trim_backups 10
    log ""
    log "=== Deploy complete (with deps) ==="
    log "Backup: $backup_path"
    log "Rollback: $0 --rollback"
    ;;
  ""|--code-only)
    preflight
    local_check
    backup_path=$(backup_remote)
    upload_code
    remote_check
    restart_and_verify
    trim_backups 10
    log ""
    log "=== Deploy complete ==="
    log "Backup: $backup_path"
    log "Rollback: $0 --rollback"
    ;;
  *)
    err "Unknown argument: $1"
    show_help
    exit 1
    ;;
esac
