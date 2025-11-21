# Deployment Guide
**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** [deployment]

---

## Quick Reference

### Raindrop Backend (Standard Deployment)
```bash
raindrop build deploy
```

### Raindrop Backend (With Secrets Reset)
```bash
raindrop build generate
./set-all-secrets.sh
raindrop build deploy
```

### Frontend (Vercel)
```bash
vercel --prod
```

### Vultr Services
```bash
cd <service-directory>
./deploy.sh
```

### Emergency Rollback
```bash
raindrop build start --branch main
raindrop build deploy --amend
```

---

## Table of Contents

1. [Raindrop Backend Deployment](#raindrop-backend-deployment)
2. [Vercel Frontend Deployment](#vercel-frontend-deployment)
3. [Vultr VPS Deployment](#vultr-vps-deployment)
4. [Environment Variables & Secrets](#environment-variables--secrets)
5. [Common Mistakes](#common-mistakes)
6. [Troubleshooting](#troubleshooting)
7. [Historical Context](#historical-context)

---

## Raindrop Backend Deployment

### Overview
Raindrop hosts 10 microservices on Cloudflare Workers:
- api-gateway
- auth-manager
- call-orchestrator
- persona-manager
- database-proxy
- payment-processor
- webhook-handler
- admin-dashboard
- cost-analytics
- voice-pipeline (service definition, but runs on Vultr)

Plus 1 MCP service:
- log-aggregator

### Standard Deployment Process

**Step 1: Check Current Status**
```bash
raindrop build status --application call-me-back
```

**Step 2: Make Your Changes**
```bash
# Edit code in src/ directory
vim src/api-gateway/index.ts
```

**Step 3: Deploy**
```bash
raindrop build deploy
```

**Step 4: Monitor**
```bash
# Check deployment status
raindrop build status

# Follow logs
raindrop logs tail -f --application call-me-back

# Test endpoint
curl https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/personas
```

### Deployment with Manifest Changes

If you modified `raindrop.manifest` (added services, env vars, resources):

```bash
# 1. Regenerate types
raindrop build generate

# 2. CRITICAL: Reset all secrets (they get wiped!)
./set-all-secrets.sh

# 3. Deploy
raindrop build deploy

# 4. Monitor
raindrop logs tail -f --application call-me-back
```

**⚠️ WARNING:** Running `raindrop build generate` **WIPES ALL ENVIRONMENT SECRETS**. Always run `./set-all-secrets.sh` immediately after.

### Branching & Sandbox Mode

**Creating a New Branch:**
```bash
# ✅ CORRECT
raindrop build start --branch feature-name

# ❌ WRONG - Never use git branch commands
git checkout -b feature-name  # DON'T DO THIS
```

**Sandbox Mode:**
- After `raindrop build start`, services deploy with temporary URLs
- Use for testing before production
- Check if in sandbox: `cat .raindrop/config.json | grep sandbox`
- Exit sandbox: `rm -f .raindrop/sandbox`

**Amend Deployment:**
```bash
# Update current version without creating new version
raindrop build deploy --amend
```

### Critical Raindrop Facts

1. **Raindrop Dashboard is Useless** - All operations must be CLI-based
2. **Logs Only via CLI** - No web interface for logs
3. **Secrets Reset After Generate** - Always run `./set-all-secrets.sh`
4. **One Deploy at a Time** - Wait for completion before starting another
5. **Sandbox Mode is Default** - Exit with `rm -f .raindrop/sandbox` when ready
6. **Don't Chain Commands** - Never run `raindrop build generate && raindrop build deploy` (gets stuck!)

### Useful Raindrop Commands

```bash
# Check build status
raindrop build status --application call-me-back

# View logs (last 100 lines)
raindrop logs tail -n 100 --application call-me-back

# Follow logs in real-time
raindrop logs tail -f --application call-me-back

# List environment variables
raindrop build env list --application call-me-back

# Set a single secret
raindrop build env set env:SECRET_NAME "value"

# Check if in sandbox mode
cat .raindrop/config.json

# Exit sandbox mode
rm -f .raindrop/sandbox
```

---

## Vercel Frontend Deployment

### Overview
The Vue.js frontend (in `src/views/`, `src/stores/`, etc.) deploys to Vercel **separately** from the backend.

**⚠️ IMPORTANT:** Vercel is **NOT tied to Git** in this project. All deployments are manual via CLI.

### Deployment Commands

```bash
# Production deployment (use for live site)
vercel --prod

# Preview deployment (for testing)
vercel

# List deployments
vercel ls

# View logs for specific deployment
vercel logs <deployment-url>
```

### Environment Variables

```bash
# Set production environment variable
echo "https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run" | \
  vercel env add VITE_API_URL production

# Remove environment variable
vercel env rm VITE_API_URL production

# Pull environment variables locally
vercel env pull
```

**Required Environment Variable:**
- `VITE_API_URL` - Points to API Gateway on Raindrop

### Frontend Code Structure

```
src/
├── views/          # Vue components (HomePage.vue, PersonaPage.vue, etc.)
├── stores/         # Pinia state management (auth.js, personas.js)
├── router/         # Vue Router config
├── services/       # API clients (auth.js, personas.js, calls.js)
└── assets/         # Static files (CSS, images)
```

### Styling (Tailwind CSS v4)

As of 2025-11-19:
- **Tailwind CSS v4** installed and configured
- Uses new `@import "tailwindcss"` syntax (v4 migration)
- PostCSS plugin: `@tailwindcss/postcss`
- Config: `postcss.config.js` (no `tailwind.config.js` needed in v4)
- Custom theme colors defined in `src/assets/styles/main.css` with `@theme` directive

---

## Vultr VPS Deployment

### Overview
Vultr VPS hosts services that Cloudflare Workers can't run:
- **voice-pipeline** - WebSocket connections (Cloudflare Workers limitation)
- **db-proxy** - PostgreSQL database proxy
- **log-query-service** - Log aggregation and queries
- **deepgram-proxy** - Deepgram STT proxy
- **PostgreSQL 14** - Main database

**Server Details:**
- IP: `144.202.15.249`
- SSH Key: `~/.ssh/vultr_cmb`
- User: `root`

### Voice Pipeline Deployment

**Using Deploy Script (Recommended):**
```bash
cd voice-pipeline-nodejs
./deploy.sh
```

**What the script does:**
1. Packages code into tarball (excludes `node_modules`, `.env`)
2. Transfers to Vultr via SCP
3. Extracts on server
4. Runs `npm install`
5. Restarts PM2 service

**Manual Deployment:**
```bash
# Step 1: Create tarball
tar -czf /tmp/voice-pipeline.tar.gz --exclude='node_modules' --exclude='.env' .

# Step 2: Transfer to server
scp -i ~/.ssh/vultr_cmb /tmp/voice-pipeline.tar.gz root@144.202.15.249:/tmp/

# Step 3: Extract and install
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "cd /root/voice-pipeline && tar -xzf /tmp/voice-pipeline.tar.gz && npm install && pm2 restart voice-pipeline"

# Step 4: Check logs
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 logs voice-pipeline --lines 50"
```

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
```

### Vultr Service Management

**Check Running Services:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249

# PM2 status
pm2 status

# View logs
pm2 logs voice-pipeline --lines 100
pm2 logs db-proxy --lines 100
pm2 logs log-query-service --lines 100

# Restart a service
pm2 restart <service-name>

# Check PostgreSQL
sudo -u postgres psql -d callmeback -c "SELECT COUNT(*) FROM users;"
```

**Verify Service Paths:**
```bash
# Check actual deployment path for a service
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 info voice-pipeline | grep 'exec cwd'"
```

**Service Paths:**
| Service | Server Path | PM2 Name |
|---------|-------------|----------|
| voice-pipeline | `/root/voice-pipeline` | `voice-pipeline` |
| log-query-service | `/root/log-query-service` | `log-query-service` |
| db-proxy | `/root/db-proxy` | `db-proxy` |
| deepgram-proxy | `/root/deepgram-proxy` | `deepgram-proxy` |

**⚠️ NOTE:** Some older docs reference `/opt/` paths but actual server uses `/root/`. Always verify with `pm2 info`.

### Caddy Reverse Proxy

Services are exposed via Caddy reverse proxy with SSL:
- `https://voice.ai-tools-marketplace.io` → voice-pipeline
- `https://db.ai-tools-marketplace.io` → db-proxy
- `https://logs.ai-tools-marketplace.io` → log-query-service

**Edit Caddy Configuration:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
sudo nano /etc/caddy/Caddyfile

# Test configuration
caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy

# Check status
sudo systemctl status caddy
```

---

## Environment Variables & Secrets

### Required Secrets for This Project

- `JWT_SECRET`
- `VULTR_DB_API_URL`
- `VULTR_DB_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ELEVENLABS_API_KEY`
- `CEREBRAS_API_KEY`
- `DEEPGRAM_API_KEY`
- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `ADMIN_SECRET_TOKEN`

### Setting Secrets

**All at once (Recommended):**
```bash
./set-all-secrets.sh
```

**Individual secret:**
```bash
raindrop build env set env:SECRET_NAME "value"
```

**⚠️ CRITICAL:** The `env:` prefix is required!

**List secrets:**
```bash
raindrop build env list --application call-me-back
```

### When Secrets Reset

Secrets are **WIPED** when you run:
- `raindrop build generate`

Always run `./set-all-secrets.sh` immediately after `generate`.

---

## Common Mistakes

### ❌ DON'T

1. **Use git branches instead of Raindrop CLI**
   ```bash
   git checkout -b feature  # ❌ WRONG
   ```

2. **Chain generate and deploy**
   ```bash
   raindrop build generate && raindrop build deploy  # ❌ Gets stuck!
   ```

3. **Deploy frontend with Raindrop**
   ```bash
   raindrop build deploy  # ❌ This is backend only!
   ```

4. **Push to git expecting Vercel to auto-deploy**
   ```bash
   git push origin main  # ❌ Vercel is NOT tied to repo!
   ```

5. **Forget to set secrets after generate**
   ```bash
   raindrop build generate
   raindrop build deploy  # ❌ Secrets are missing!
   ```

6. **Deploy while another deployment is running**
   - Wait for current deployment to finish

7. **Use wrong paths on Vultr**
   - Always use `/root/` not `/opt/`

### ✅ DO

1. **Use Raindrop CLI for branches**
   ```bash
   raindrop build start --branch feature
   ```

2. **Separate steps with secrets**
   ```bash
   raindrop build generate
   ./set-all-secrets.sh
   raindrop build deploy
   ```

3. **Deploy frontend via Vercel CLI**
   ```bash
   vercel --prod
   ```

4. **Check status frequently**
   ```bash
   raindrop build status
   ```

5. **Exit sandbox when ready**
   ```bash
   rm -f .raindrop/sandbox
   ```

6. **Verify paths on Vultr**
   ```bash
   pm2 info <service> | grep 'exec cwd'
   ```

---

## Troubleshooting

### Issue: Deployment Stuck

**Check:**
```bash
raindrop build status
```

**Fix:**
- Wait for current deployment to finish
- If truly stuck (>10 minutes), kill and redeploy

### Issue: "Environment variable not found"

**Check:**
```bash
raindrop build env list --application call-me-back | grep SECRET_NAME
```

**Fix:**
```bash
./set-all-secrets.sh
```

**Likely cause:** You ran `raindrop build generate` without re-setting secrets.

### Issue: Sandbox URLs instead of Production

**Check:**
```bash
cat .raindrop/config.json | grep sandbox
```

**Fix:**
```bash
rm -f .raindrop/sandbox
raindrop build deploy
```

### Issue: Frontend not updating

**Remember:** Vercel is NOT tied to git!

**Fix:**
```bash
vercel --prod
```

### Issue: Vultr service not responding

**Check:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 status"
```

**Restart:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 restart <service-name>"
```

**View logs:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 logs <service-name> --lines 100"
```

### Issue: Caddy SSL certificate error

**Check DNS:**
```bash
dig <subdomain>.ai-tools-marketplace.io
# Should show: 144.202.15.249
```

**Check Caddy logs:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "sudo journalctl -u caddy -n 100"
```

---

## Historical Context

### Key Lessons Learned

1. **Cloudflare Tunnel → Caddy Migration** (2025-11-14)
   - Cloudflare Tunnel quick URLs were unreliable
   - Migrated to Caddy reverse proxy with custom domains
   - Much more stable and production-ready

2. **Raindrop CLI Quirks** (Ongoing)
   - Dashboard is not functional, must use CLI
   - `generate` wipes secrets every time
   - Chaining commands causes hangs
   - Created `./set-all-secrets.sh` as workaround

3. **Multi-Cloud Architecture Decision** (2025-11-15)
   - Cloudflare Workers can't do outbound WebSockets
   - Voice pipeline must run on Vultr VPS
   - PostgreSQL too complex for SmartSQL
   - Resulted in hybrid Raindrop + Vultr setup

4. **Vercel Not Tied to Git** (By design)
   - Manual CLI deployments for all changes
   - Prevents accidental deployments
   - More control over what goes to production

### Related Documents

See also:
- [vultr.md](vultr.md) - Vultr VPS operations
- [raindrop.md](raindrop.md) - Raindrop platform guide
- [debugging.md](debugging.md) - Troubleshooting deployments

---

**Sources:**
- Consolidated from: DEPLOYMENT_COMMANDS_EXPLAINED.md, CRITICAL_RAINDROP_RULES.md, DASHBOARD_DEPLOYMENT_CHECKLIST.md, PCR2.md (lines 1432-1629)
- Additional context: RAINDROP_DEPLOYMENT_BREAKTHROUGH.md, DEPLOYMENT_SUCCESS.md, RAINDROP_DEPLOYMENT_ISSUES.md

**Historical notes:** COMPLETE_DEPLOYMENT_GUIDE.md and docs/DEPLOYMENT_GUIDE.md were found to contain critical errors (wrong commands, wrong database architecture) and have been deprecated.
