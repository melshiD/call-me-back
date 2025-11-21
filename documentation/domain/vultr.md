# Vultr VPS Operations
**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** [vultr]

---

## Quick Reference

### Server Details
- **IP:** `144.202.15.249`
- **SSH Key:** `~/.ssh/vultr_cmb`
- **User:** `root`
- **OS:** Ubuntu (check with `lsb_release -a`)
- **Cost:** $5/month (vc2-1c-1gb)
- **Available Credit:** ~$495 remaining (from $500 hackathon credit)

### SSH Access
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
```

### Services Running
| Service | Path | Port | PM2 Name | Domain |
|---------|------|------|----------|--------|
| voice-pipeline | `/root/voice-pipeline` | 8080 | `voice-pipeline` | voice.ai-tools-marketplace.io |
| db-proxy | `/root/db-proxy` | 3000 | `db-proxy` | db.ai-tools-marketplace.io |
| log-query-service | `/root/log-query-service` | 3001 | `log-query-service` | logs.ai-tools-marketplace.io |
| deepgram-proxy | `/root/deepgram-proxy` | varies | `deepgram-proxy` | N/A |
| PostgreSQL 14 | N/A | 5432 | N/A | localhost only |

---

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [PM2 Process Management](#pm2-process-management)
3. [Deploying to Vultr](#deploying-to-vultr)
4. [Caddy Configuration](#caddy-configuration)
5. [PostgreSQL Database](#postgresql-database)
6. [Troubleshooting](#troubleshooting)
7. [Security & Networking](#security--networking)

---

## Infrastructure Overview

### Multi-Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│ LAYER 1: Caddy (Reverse Proxy)                          │
│ - Port: 443 (HTTPS)                                      │
│ - SSL/TLS termination (Let's Encrypt)                   │
│ - Routes:                                                │
│   • voice.ai-tools-marketplace.io → localhost:8080       │
│   • db.ai-tools-marketplace.io → localhost:3000          │
│   • logs.ai-tools-marketplace.io → localhost:3001        │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ LAYER 2: PM2 (Process Manager)                          │
│ - Keeps Node.js processes running                       │
│ - Auto-restart on crash                                 │
│ - Log aggregation to /var/log/pm2/                     │
│                                                          │
│ Managed Processes:                                       │
│ 1. voice-pipeline (port 8080)                           │
│ 2. db-proxy (port 3000)                                 │
│ 3. log-query-service (port 3001)                        │
│ 4. deepgram-proxy                                       │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ LAYER 3: Node.js Applications                           │
│ - voice-pipeline: WebSocket bridge for AI services      │
│ - db-proxy: HTTP API for PostgreSQL queries             │
│ - log-query-service: Log aggregation & cost tracking    │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ LAYER 4: Data Store                                     │
│ - PostgreSQL 14 (port 5432)                             │
│ - Database: callmeback                                   │
│ - Access: Local socket only (not exposed to internet)   │
└──────────────────────────────────────────────────────────┘
```

### Why Vultr? (Technical Constraints)

Vultr VPS hosts services that Cloudflare Workers/Raindrop cannot:

1. **WebSocket Connections** - Cloudflare Workers can't make outbound WebSocket connections (required for Twilio/Deepgram/ElevenLabs)
2. **Full PostgreSQL** - SmartSQL too limited for complex queries needed by the app
3. **Long-Running Processes** - Workers have execution time limits, voice calls can be minutes long
4. **Direct External API Access** - Some APIs work better from traditional servers

**Result:** Hybrid multi-cloud architecture with Raindrop (backend services) + Vultr (voice pipeline + database) + Vercel (frontend)

---

## PM2 Process Management

### What PM2 Does
- **Process Supervision:** Keeps Node.js apps running 24/7
- **Auto-Restart:** Restarts crashed processes immediately
- **Log Management:** Aggregates stdout/stderr to `/var/log/pm2/`
- **Zero-Downtime:** `pm2 reload` updates without stopping service

### PM2 vs Application Code
```
ecosystem.config.js (PM2 Config)
    ↓
pm2 start ecosystem.config.js
    ↓
PM2 spawns: node server.js
    ↓
server.js (Our Application Code)
```

**Key Point:** PM2 is infrastructure, not application logic.

### Common PM2 Commands

```bash
# Check all processes
pm2 status

# Start a process
pm2 start ecosystem.config.js

# Restart specific process
pm2 restart voice-pipeline

# Stop a process
pm2 stop log-query-service

# Delete a process
pm2 delete db-proxy

# View logs (follow mode)
pm2 logs voice-pipeline

# View last 100 lines
pm2 logs voice-pipeline --lines 100

# View only errors
pm2 logs voice-pipeline --err --lines 50

# Save current process list (survives reboot)
pm2 save

# Resurrect saved processes after reboot
pm2 resurrect

# Get detailed info about a process
pm2 info voice-pipeline

# Monitor all processes (real-time)
pm2 monit
```

### Verify Service Paths

**⚠️ IMPORTANT:** Some older docs reference `/opt/` paths but actual server uses `/root/`. Always verify:

```bash
pm2 info <service-name> | grep 'exec cwd'
```

### PM2 Log Locations

```bash
/var/log/pm2/voice-pipeline-out.log       # stdout
/var/log/pm2/voice-pipeline-error.log     # stderr
/var/log/pm2/db-proxy-out.log
/var/log/pm2/db-proxy-error.log
/var/log/pm2/log-query-service-out.log
/var/log/pm2/log-query-service-error.log
```

---

## Deploying to Vultr

### Voice Pipeline Deployment

**Using Deploy Script (Recommended):**
```bash
cd voice-pipeline-nodejs
./deploy.sh
```

**What the script does:**
1. Creates tarball with `tar -czf` (excludes `node_modules`, `.env`)
2. Transfers to Vultr via `scp`
3. Extracts on server to `/root/voice-pipeline/`
4. Runs `npm install`
5. Restarts PM2 process

**Manual Deployment:**
```bash
# Step 1: Create tarball (excludes node_modules and .env)
tar -czf /tmp/voice-pipeline.tar.gz --exclude='node_modules' --exclude='.env' .

# Step 2: Transfer to server
scp -i ~/.ssh/vultr_cmb /tmp/voice-pipeline.tar.gz root@144.202.15.249:/tmp/

# Step 3: Extract on server
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "cd /root/voice-pipeline && tar -xzf /tmp/voice-pipeline.tar.gz"

# Step 4: Install dependencies and restart
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "cd /root/voice-pipeline && npm install && pm2 restart voice-pipeline"

# Step 5: Check logs
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 logs voice-pipeline --lines 50"
```

**Why exclude node_modules?**
- They're huge (~200MB+) and platform-specific
- Better to run `npm install` on the target server

**Why exclude .env?**
- Contains secrets
- Server already has its own `.env` with production credentials

### Database Proxy Deployment

```bash
cd vultr-db-proxy
scp -i ~/.ssh/vultr_cmb server.js root@144.202.15.249:/root/db-proxy/server.js
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 restart db-proxy"
```

### Log Query Service Deployment

```bash
cd log-query-service
./deploy.sh

# Or manually:
scp -i ~/.ssh/vultr_cmb -r . root@144.202.15.249:/root/log-query-service/
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "cd /root/log-query-service && npm install && pm2 restart log-query-service"
```

### Complete Deployment Workflow

For any new service:

1. **Local Development:** Write code and test
2. **Package:** Create tarball excluding `node_modules` and `.env`
3. **Upload:** `scp` tarball to Vultr
4. **Extract:** SSH to Vultr, extract to appropriate directory
5. **Install:** `npm install --production`
6. **PM2 Start:** `pm2 start ecosystem.config.js` (for new service) or `pm2 restart <name>` (existing)
7. **PM2 Save:** `pm2 save` (persist across reboots)
8. **Caddy Config:** Add reverse proxy route if service needs HTTPS access
9. **Reload Caddy:** `systemctl reload caddy`
10. **Test:** `curl https://<subdomain>.ai-tools-marketplace.io/health`

---

## Caddy Configuration

### What Caddy Does
- **Reverse Proxy:** Routes HTTPS traffic to local services
- **SSL/TLS:** Automatic certificates from Let's Encrypt
- **CORS Headers:** Adds appropriate headers for API access
- **Compression:** gzip encoding for responses
- **Logging:** Access logs for each service

### Current Caddy Routes

```caddy
# /etc/caddy/Caddyfile

voice.ai-tools-marketplace.io {
    reverse_proxy localhost:8080
    encode gzip
    log {
        output file /var/log/caddy/voice-service.log
        format json
    }
}

db.ai-tools-marketplace.io {
    reverse_proxy localhost:3000
    encode gzip
    log {
        output file /var/log/caddy/db-service.log
        format json
    }
}

logs.ai-tools-marketplace.io {
    reverse_proxy localhost:3001

    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type"
    }

    encode gzip

    log {
        output file /var/log/caddy/logs-service.log
        format json
    }
}
```

### Editing Caddy Configuration

```bash
# SSH to Vultr
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249

# Edit Caddyfile
sudo nano /etc/caddy/Caddyfile

# Test configuration (checks for syntax errors)
caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy (applies changes without downtime)
sudo systemctl reload caddy

# Check Caddy status
sudo systemctl status caddy

# View Caddy logs
sudo journalctl -u caddy -n 100 -f
```

### Adding a New Route

To add a new service with HTTPS:

1. **Add DNS A record** pointing to `144.202.15.249`
2. **Edit Caddyfile:**
   ```caddy
   newservice.ai-tools-marketplace.io {
       reverse_proxy localhost:<port>
       encode gzip
       log {
           output file /var/log/caddy/newservice.log
           format json
       }
   }
   ```
3. **Test and reload:** `caddy validate && systemctl reload caddy`
4. **Test HTTPS:** `curl https://newservice.ai-tools-marketplace.io/health`

Caddy automatically obtains SSL certificates from Let's Encrypt!

### Troubleshooting Caddy

**Issue: Certificate error**
```bash
# Check DNS
dig <subdomain>.ai-tools-marketplace.io
# Should show: 144.202.15.249

# Check Caddy logs
sudo journalctl -u caddy -n 100 | grep -i "certificate\|error\|fail"

# Force certificate renewal
caddy reload --force
```

**Issue: 502 Bad Gateway**
```bash
# Backend service not running
pm2 status

# Check service is listening on correct port
netstat -tuln | grep <port>

# Check service logs
pm2 logs <service-name> --lines 50
```

---

## PostgreSQL Database

### Database Details
- **Version:** PostgreSQL 14
- **Port:** 5432 (localhost only, not exposed to internet)
- **Database:** `callmeback`
- **User:** `cmb_user` (and other service-specific users)
- **Access:** Local socket only

### Connecting to Database

```bash
# SSH to Vultr first
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249

# Connect as postgres superuser
sudo -u postgres psql

# Connect to specific database
sudo -u postgres psql -d callmeback

# Connect as specific user
sudo -u postgres psql -d callmeback -U cmb_user
```

### Common Database Commands

```sql
-- List databases
\l

-- List tables in current database
\dt

-- Describe table structure
\d <table_name>

-- List users
\du

-- Count records in table
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM calls;
SELECT COUNT(*) FROM personas;

-- View recent calls
SELECT id, user_id, persona_id, status, created_at
FROM calls
ORDER BY created_at DESC
LIMIT 10;

-- Exit psql
\q
```

### Running Database Migrations

```bash
# From local machine
cd /usr/code/ai_championship/call-me-back
./apply-migrations.sh

# Or manually on Vultr
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
cd /root/migrations
sudo -u postgres psql -d callmeback -f 009_create_admin_users.sql
```

### Database Backup

```bash
# SSH to Vultr
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249

# Create backup
sudo -u postgres pg_dump callmeback > /root/backups/callmeback_$(date +%Y%m%d).sql

# Restore from backup
sudo -u postgres psql callmeback < /root/backups/callmeback_20251121.sql
```

### Database Security

- ✅ PostgreSQL listens on localhost only (127.0.0.1)
- ✅ Not exposed to internet
- ✅ Access via db-proxy service requires API key
- ✅ Parameterized queries prevent SQL injection
- ✅ Service-specific users with limited permissions

---

## Troubleshooting

### Service Not Responding

**Check if service is running:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 status"
```

**Restart service:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 restart <service-name>"
```

**View logs:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 logs <service-name> --lines 100"
```

### Cannot Connect from Local Machine

**Test connectivity:**
```bash
# Test HTTPS endpoint (should work)
curl https://db.ai-tools-marketplace.io/health

# Test direct IP:port (should timeout if firewalled)
curl http://144.202.15.249:3000/health
```

**Expected:** HTTPS works (via Caddy), direct port access blocked (security).

### Service Listening on Wrong Interface

**Check what interface service is bound to:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "netstat -tuln | grep <port>"
```

**If shows `127.0.0.1:<port>` (localhost only):**
- For services behind Caddy: This is correct! Caddy proxies from internet.
- For direct access: Need to bind to `0.0.0.0` instead.

**If shows `0.0.0.0:<port>` (all interfaces):**
- Service is accessible from internet (may need firewall rule).

### PM2 Environment Variable Issues

**⚠️ CRITICAL:** Never use `require('dotenv').config()` in `ecosystem.config.js`!

**Problem:** PM2 loads environment variables into **GLOBAL** environment affecting ALL processes.

**Symptoms:**
- After deploying one service, other services break
- Database authentication errors: "password authentication failed"
- Services that were working suddenly can't connect

**The Wrong Way (DO NOT DO THIS):**
```javascript
// ❌ BAD - Pollutes global PM2 environment!
require('dotenv').config();

module.exports = {
  apps: [{
    name: 'log-query-service',
    script: './server.js',
    env: {
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
      // ...
    }
  }]
};
```

**The Right Way (Option 1):**
```javascript
// ✅ GOOD - PM2 loads .env only for this app
module.exports = {
  apps: [{
    name: 'log-query-service',
    script: './server.js',
    cwd: '/root/log-query-service',
    env_file: './.env',  // PM2 loads this for this app only
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

**The Right Way (Option 2):**
```javascript
// In server.js (NOT ecosystem.config.js)
require('dotenv').config();
const express = require('express');
// ... rest of your app

// ecosystem.config.js - no dotenv!
module.exports = {
  apps: [{
    name: 'log-query-service',
    script: './server.js',  // server.js loads its own .env
    cwd: '/root/log-query-service'
  }]
};
```

**How to Fix If Already Broken:**
1. Remove `require('dotenv')` from all `ecosystem.config.js` files
2. Use `env_file` option OR load dotenv in `server.js`
3. Reset all PostgreSQL passwords to match `.env` files
4. Fresh restart: `pm2 delete all` then start each service individually
5. Verify each service connects successfully

**Key Insight:** All services connecting to the SAME PostgreSQL database should use the SAME password!

### DNS Not Resolving

**Check DNS:**
```bash
dig <subdomain>.ai-tools-marketplace.io
# Should show: 144.202.15.249
```

**If wrong IP or no result:**
- Update DNS A record at domain registrar
- Wait for DNS propagation (can take minutes to hours)

### Caddy Certificate Issues

**Check Caddy logs:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "sudo journalctl -u caddy -n 100 | grep -i certificate"
```

**Common issues:**
- DNS not pointing to server yet
- Port 80/443 blocked by firewall
- Domain validation failed
- Rate limit hit (Let's Encrypt limits)

**Fix:** Ensure DNS is correct, ports are open, wait and retry.

---

## Security & Networking

### Firewall Configuration

**Check if UFW is active:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "sudo ufw status"
```

**Allow necessary ports:**
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (for Let's Encrypt)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

**Block direct access to service ports:**
- Services run on localhost (127.0.0.1) by default
- Only Caddy (reverse proxy) should access them
- External requests go through Caddy (HTTPS)

### Current Security Posture

✅ **Good:**
- PostgreSQL listens on localhost only
- Services behind Caddy reverse proxy
- SSL/TLS for all external communication
- API keys required for db-proxy and log-query-service
- SSH key authentication (no password login)
- Parameterized queries prevent SQL injection

⚠️ **Could Improve:**
- Add rate limiting to public endpoints
- Rotate API keys regularly
- Set up automated backups for database
- Enable fail2ban for SSH brute force protection
- Add monitoring/alerting (e.g., Datadog, Prometheus)

### Exposed Endpoints

**Public (via HTTPS):**
- `https://voice.ai-tools-marketplace.io/stream` - WebSocket for voice calls
- `https://db.ai-tools-marketplace.io` - Database proxy API (requires API key)
- `https://logs.ai-tools-marketplace.io` - Log query API (requires admin token)

**Internal (localhost only):**
- `localhost:5432` - PostgreSQL
- `localhost:8080` - voice-pipeline (behind Caddy)
- `localhost:3000` - db-proxy (behind Caddy)
- `localhost:3001` - log-query-service (behind Caddy)

### Backup Strategy

**Where to backup:**
See `WHERE_TO_BACKUP_VULTR_SERVERS_INDEX_FILES.md` for details.

**What to backup:**
- PostgreSQL database dumps
- `/root/<service>/.env` files (contains secrets)
- Caddy certificates (auto-renewed, but good to have)
- PM2 process list (`pm2 save`)

**Backup commands:**
```bash
# Database
sudo -u postgres pg_dump callmeback > /root/backups/db_$(date +%Y%m%d).sql

# Environment files
tar -czf /root/backups/env_files_$(date +%Y%m%d).tar.gz \
  /root/voice-pipeline/.env \
  /root/db-proxy/.env \
  /root/log-query-service/.env

# PM2 config
pm2 save
cp ~/.pm2/dump.pm2 /root/backups/pm2_dump_$(date +%Y%m%d).pm2
```

---

## Historical Context

### Cloudflare Tunnel → Caddy Migration (2025-11-14)

**Old Setup:**
- Used Cloudflare Tunnel quick URLs (`*.trycloudflare.com`)
- Temporary with no uptime guarantee
- Could change if tunnel restarted

**New Setup:**
- Caddy reverse proxy with custom domains
- Automatic SSL certificates from Let's Encrypt
- Production-ready with 99.9%+ uptime

**Why the change:**
- Cloudflare quick URLs not suitable for production
- Needed stable, predictable endpoints
- Caddy provides better control and logging

### Key Lessons

1. **Path Confusion:** Some docs use `/opt/`, actual paths are `/root/`. Always verify with `pm2 info`.
2. **PM2 Environment Pollution:** Using `require('dotenv')` in ecosystem.config.js breaks other services.
3. **Firewall Surprises:** Services bound to `0.0.0.0` may still be blocked by Vultr firewall.
4. **DNS Propagation:** Can take hours for DNS changes to propagate globally.

---

**Sources:**
- Consolidated from: VULTR_SETUP.md, TROUBLESHOOTING_VULTR_CONNECTIVITY.md, SYSTEM_ARCHITECTURE.md, DEPLOYMENT_COMMANDS_EXPLAINED.md, WHERE_TO_BACKUP_VULTR_SERVERS_INDEX_FILES.md
- Additional context: PCR2.md, DASHBOARD_DEPLOYMENT_CHECKLIST.md

**Related Documents:**
- [deployment.md](deployment.md) - Full deployment procedures
- [voice-pipeline.md](voice-pipeline.md) - Voice pipeline specifics
- [debugging.md](debugging.md) - Troubleshooting guide
- [database.md](database.md) - Database operations
