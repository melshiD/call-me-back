# CRITICAL RAINDROP DEPLOYMENT RULES

⚠️ **READ THIS EVERY TIME BEFORE ANY RAINDROP OPERATION** ⚠️

## Branching & Deployment

### Creating a New Branch
```bash
# CORRECT - Use --start flag
raindrop build start --branch feature-name

# WRONG - Never use git branch commands
git checkout -b feature-name  # ❌ DON'T DO THIS
```

### Deployment Modes

**Sandbox Mode** (Default after `raindrop build start`)
- Services deployed with temporary URLs
- Use for testing before production
- Exit with: `rm -f .raindrop/sandbox`

**Production Mode**
- Only after exiting sandbox
- Permanent URLs
- Use after testing is complete

### Deployment Commands

```bash
# Standard deployment (use this most of the time)
raindrop build deploy

# Amend deployment (updates current version)
raindrop build deploy --amend

# NEVER run these together or you'll get stuck:
raindrop build generate && raindrop build deploy  # ❌ BAD
```

### Critical Deployment Facts

1. **Environment Variables Reset**: Running `raindrop build generate` WIPES all environment secrets
   - Always run `./set-all-secrets.sh` after generate

2. **Sandbox Detection**: Check `.raindrop/config.json` for `"sandbox": true`

3. **Build Status**: Always check status before debugging:
   ```bash
   raindrop build status
   ```

4. **One Deployment at a Time**: Wait for previous deploy to finish

## Environment Secrets Management

### Setting Secrets
```bash
# Use the env: prefix
raindrop build env set env:SECRET_NAME "value"

# Run our script to set all at once
./set-all-secrets.sh
```

### Required Secrets for This Project (15 total)

**Authentication & Database:**
- JWT_SECRET
- VULTR_DB_API_URL
- VULTR_DB_API_KEY

**Twilio (Voice & Verification):**
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
- TWILIO_VERIFY_SERVICE_SID

**AI Services:**
- ELEVENLABS_API_KEY
- CEREBRAS_API_KEY
- DEEPGRAM_API_KEY

**WorkOS (OAuth):**
- WORKOS_API_KEY
- WORKOS_CLIENT_ID

**Stripe (Payments):**
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_TWENTY_FIVE_MIN
- STRIPE_PRICE_FIFTY_MIN
- STRIPE_PRICE_ONE_HUNDRED_MIN

## Frontend Deployment (Vercel)

### How Frontend Deployment Works
The frontend (Vue.js app in `src/` directory) is deployed to Vercel using the **Vercel CLI** and is **separate** from Raindrop backend services.

### Deploying Frontend Changes
```bash
# Make your frontend changes in src/

# Deploy to Vercel using CLI
vercel --prod

# Or just for preview (non-production)
vercel
```

### Vercel CLI Commands
```bash
# Production deployment (use this for live site)
vercel --prod

# Preview deployment (for testing)
vercel

# Check deployment status
vercel ls

# View logs
vercel logs <deployment-url>
```

### Frontend vs Backend
- **Backend (Raindrop)**: Services in `src/*-manager/`, `src/*-proxy/`, etc.
  - Deploy with: `raindrop build deploy`
  - URLs: `*.lmapp.run`

- **Frontend (Vercel)**: Vue components in `src/views/`, `src/stores/`, etc.
  - Deploy with: `vercel --prod`
  - URL: `*.vercel.app`

### Important Notes
- Frontend and backend are deployed **independently**
- Frontend changes require `vercel --prod` (NOT git push)
- Backend changes require `raindrop build deploy`
- Vercel is NOT tied to a Git repository in this project
- Use Vercel CLI for all frontend deployments

## Common Mistakes to Avoid

❌ **DON'T**:
- Run `raindrop build generate` without re-setting secrets after
- Use git branches instead of `raindrop build start`
- Deploy while another deployment is running
- Forget to exit sandbox mode before final testing
- Try to deploy frontend with `raindrop build deploy` (use `vercel --prod` instead)
- Try to deploy frontend with git push (Vercel is NOT tied to repo)
- Forget that frontend and backend deploy separately

✅ **DO**:
- Use `raindrop build start --branch name` for new branches
- Always run `./set-all-secrets.sh` after generate
- Check `raindrop build status` frequently
- Exit sandbox with `rm -f .raindrop/sandbox` when ready
- Deploy frontend via `vercel --prod`
- Deploy backend via `raindrop build deploy`

## Current Project URLs

**Production:**
- **Frontend**: https://callbackapp.ai
- **Admin API**: https://api.callbackapp.ai

**Development/Internal:**
- **API Gateway**: https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run
- **Frontend (Preview)**: https://call-me-back.vercel.app
- **Vultr DB Proxy**: https://db.ai-tools-marketplace.io
- **Voice Pipeline**: wss://voice.ai-tools-marketplace.io/stream
- **Branch**: main

## Recommended Deployment Method (2025-12-03+)

The preferred deployment method uses Vultr as a build server to avoid WSL/Windows npm issues:

```bash
# Deploy backend via Vultr (recommended)
./deploy-via-vultr.sh

# What it does:
# 1. Syncs code to Vultr
# 2. Runs npm install
# 3. Runs raindrop build deploy
# 4. Shows deployment status
```

**Why use this?**
- Avoids WSL/Windows npm issues
- Consistent build environment
- Faster than local builds

## When Things Go Wrong

1. Check if in sandbox: `cat .raindrop/config.json`
2. Check deployment status: `raindrop build status`
3. Check if secrets are set: They reset after `generate`
4. Check for stuck deployments: Kill and redeploy
5. Read `documentation/domain/deployment.md` for details

---
**This file must be read at the start of EVERY conversation continuation**
