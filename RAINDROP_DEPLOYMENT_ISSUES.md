# Raindrop Deployment Issues and Learnings

## Key Issues We Keep Encountering

### 1. Environment Variables Not Being Accepted
**Problem:** Raindrop doesn't read environment variables from `.env` files or shell environment during deployment.

**What we've tried:**
- Setting env vars in shell before deployment: `export VAR=value` - DOESN'T WORK
- Using `raindrop build env set` command - FAILS with "variable must be an env variable or secret"
- Sourcing .env before deployment - DOESN'T WORK
- Creating scripts to inject env vars - DOESN'T WORK

**Root Cause:** Raindrop expects environment variables to be set through their cloud platform dashboard or API, not locally.

### 2. Deployments Getting Stuck in "Stopping..." State
**What happens:**
1. Run `raindrop build deploy`
2. Deployment starts and builds successfully
3. Gets stuck showing "Status: stopping..." for all modules
4. Never completes, hangs indefinitely

**Why this happens:**
- Raindrop uses "sandbox mode" for development
- Multiple deployment processes create lock contention
- The lock in `.raindrop/config.json` prevents new deployments
- Using `--amend` tries to modify existing deployment but gets stuck

### 3. Database-Proxy Pattern
**Solution we implemented:**
- Created `src/database-proxy/` service to handle external database connections
- Other Workers call database-proxy via internal service-to-service communication
- This bypasses Cloudflare Workers' restriction on external URL fetches (error 1003)

**Status:** Code is correct and builds, but can't deploy with required env vars.

## What Happens When We Deploy

### Without --amend flag:
```
Failed to deploy: [failed_precondition] cannot branch an application from a parent that is locked
```

### With --amend flag:
- Tries to update existing deployment
- Gets stuck in "stopping..." state
- Creates lock contention
- Never completes

### Current Lock File:
```json
{
  "versionId": "01ka20da8pjbe9q6btxcbb0dsb",
  "lock": "user:deploy:user_01K8HSZFFJNQXEKP25NW7T7B9T:c8fc9f72-bfd2-410e-b57e-08e306c71dd4"
}
```

## Critical Environment Variables Needed

These are declared in `raindrop.manifest` but we can't set them:

1. **VULTR_DB_API_KEY** - Required for database access (MOST CRITICAL)
2. **VULTR_DB_API_URL** - Database endpoint
3. **TWILIO_ACCOUNT_SID** - For phone calls
4. **TWILIO_AUTH_TOKEN** - Twilio authentication
5. **ELEVENLABS_API_KEY** - For voice synthesis
6. **CEREBRAS_API_KEY** - For AI processing

## The Fundamental Problem

**We MUST use Raindrop for the hackathon** but:
1. Can't set environment variables locally
2. Don't have access to Raindrop's cloud dashboard
3. The `raindrop build env set` command doesn't work
4. Without env vars, database-proxy can't connect to PostgreSQL
5. Without database, we only get mock personas (Boss, Doctor) instead of real ones (Brad, Sarah, Alex)

## What We Need

A way to either:
1. Access Raindrop's dashboard to set secrets properly
2. Find the correct CLI command syntax to set env vars
3. Get Raindrop to accept environment variables from the shell
4. Find an alternative deployment method that still qualifies for the hackathon