# Raindrop Deployment Breakthrough - How to Deploy with Secrets

## The Problem We Were Facing
- Raindrop wouldn't accept environment variables from `.env` files or shell exports
- Got stuck with "cannot branch an application from a parent that is locked" errors
- Deployments got stuck in "stopping..." state indefinitely
- Database couldn't connect without proper environment variables

## THE SOLUTION That Actually Works

### Step 1: Set Environment Variables with Correct Syntax
The documentation wasn't clear, but you MUST use the `env:` prefix:

```bash
# SOURCE YOUR .ENV FIRST
source .env

# SET EACH SECRET WITH env: PREFIX
raindrop build env set env:VULTR_DB_API_KEY "$VULTR_DB_API_KEY"
raindrop build env set env:VULTR_DB_API_URL "$VULTR_DB_API_URL"
raindrop build env set env:TWILIO_ACCOUNT_SID "$TWILIO_ACCOUNT_SID"
raindrop build env set env:TWILIO_AUTH_TOKEN "$TWILIO_AUTH_TOKEN"
raindrop build env set env:ELEVENLABS_API_KEY "$ELEVENLABS_API_KEY"
raindrop build env set env:CEREBRAS_API_KEY "$CEREBRAS_API_KEY"
```

Or use the script we created:
```bash
./set-all-secrets.sh
```

### Step 2: Create a NEW BRANCH (Not Deploy!)
**THIS IS THE KEY BREAKTHROUGH!**

Don't use `raindrop build deploy` when you have lock issues. Instead, create a new branch:

```bash
raindrop build branch database-enabled --start
```

This:
- Creates a completely new version/deployment
- Bypasses any lock issues from previous deployments
- Starts fresh with your environment variables already set
- Automatically starts the services

### Step 3: Verify Deployment
```bash
raindrop build status
```

You should see all modules running with a new version ID.

## Why This Works

1. **Branching vs Deploying**:
   - `raindrop build deploy` tries to update/create from existing version
   - `raindrop build branch` creates a fresh deployment branch
   - Branches don't inherit locks from parent versions

2. **Environment Variables**:
   - The `env:` prefix is REQUIRED but not well documented
   - Variables are stored at the version level
   - Once set, they persist for that deployment

3. **Avoiding Lock Issues**:
   - Previous deployments can leave locks in `.raindrop/config.json`
   - Using `--amend` often gets stuck in "stopping..." state
   - Branching sidesteps these issues entirely

## Quick Redeploy Process

When you need to redeploy with database access:

```bash
# 1. Set secrets (if not already set)
./set-all-secrets.sh

# 2. Create new branch with a descriptive name
raindrop build branch my-feature-branch --start

# 3. Check status
raindrop build status

# 4. Get the API URL from the output
# Look for: → svc-[version-id].01k8eade5c6qxmxhttgr2hn2nz.lmapp.run
```

## Current Working Deployment

As of November 14, 2024:
- Version: `01ka23ek...`
- API URL: `https://svc-01ka23f9q75s1jdjgxhh700ghv.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run`
- Status: All 17 modules running
- Database-proxy: Active with environment variables

## Important Notes

1. **Don't run `raindrop build generate`** after setting secrets - it resets them!
2. **Use branching** when you hit lock issues, not `--amend`
3. **Push to git** can sometimes help with version management
4. **The frontend needs the new API URL** - update .env with the new deployment URL