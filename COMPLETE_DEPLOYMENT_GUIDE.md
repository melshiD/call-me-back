# Complete Deployment Guide - Frontend + Backend

This guide walks you through deploying the complete Call Me Back application:
- **Backend** (Raindrop) - Voice pipeline, SmartMemory, APIs
- **Frontend** (Vercel) - Vue UI

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├──────────────────┐
               │                  │
        [Browser]           [Phone Call]
               │                  │
               │                  │
               ▼                  ▼
    ┌──────────────────┐   ┌──────────────────┐
    │  Vercel Frontend │   │  Twilio          │
    │  Vue App         │   │  Media Streams   │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
             │                      │
             │  API Calls           │  WebSocket
             │                      │
             ▼                      ▼
        ┌─────────────────────────────────────┐
        │  Raindrop Backend                   │
        │  ├─ API Gateway (public)            │
        │  ├─ Voice Pipeline (private)        │
        │  ├─ SmartMemory                     │
        │  └─ SmartSQL Database               │
        └─────────────────────────────────────┘
```

## Prerequisites

1. **GitHub account** (you already have repo set up)
2. **Vercel account** - Sign up at https://vercel.com (free tier)
3. **Raindrop CLI installed**
   ```bash
   npm install -g @liquidmetal-ai/raindrop-cli
   ```
4. **API Keys** (in `.env`):
   - `ELEVENLABS_API_KEY`
   - `CEREBRAS_API_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

## Step 1: Commit Your Changes

First, let's get everything in Git:

```bash
# Make sure you're on main branch
git checkout main

# Stage all changes
git add .

# Commit with the good message we prepared earlier
git commit -m "feat: Complete SmartMemory integration for voice pipeline with 4-tier memory architecture

Implements full Raindrop SmartMemory integration across the voice pipeline, enabling
AI personas to remember conversations, learn facts about users, and maintain consistent
behavioral patterns across calls.

INTEGRATION COMPONENTS:
- PersonaMemoryManager with Working/Episodic/Semantic/Procedural memory
- VoicePipelineOrchestrator with full memory context
- API Gateway with Twilio endpoints (TwiML + WebSocket)
- Database migrations for personas and relationships
- 3 demo personas (Brad, Sarah, Alex) with seed data

Ready for deployment and testing."

# Push to GitHub
git push origin main
```

## Step 2: Deploy Backend to Raindrop

Deploy the backend services from your local machine:

```bash
# Navigate to project directory
cd /usr/code/ai_championship/call-me-back

# Ensure .env is configured with all required keys
# (Check .env.example for reference)

# Deploy to Raindrop
raindrop deploy

# Follow prompts:
# - Confirm deployment
# - Wait for build to complete (may take a few minutes)
# - IMPORTANT: Note the deployed URL!

# Example output:
# ✅ Deployment successful!
# 🌐 URL: https://call-me-back-abc123.raindrop.ai
```

**Save this URL!** You'll need it for:
1. Frontend environment variable
2. Twilio webhook configuration

### Initialize Database

After backend deploys, run migrations:

```bash
# Run database migrations
raindrop db migrate

# This will:
# 1. Create personas, user_persona_relationships, call_logs tables
# 2. Seed 3 demo personas (Brad, Sarah, Alex)
# 3. Create demo user relationships

# Verify it worked:
raindrop db query "SELECT id, name FROM personas;"
# Should show: brad_001, sarah_001, alex_001
```

## Step 3: Deploy Frontend to Vercel

Now deploy the Vue frontend from GitHub:

### 3a. Connect GitHub to Vercel

1. Go to https://vercel.com
2. Click **"Add New..." → Project**
3. Click **"Import Git Repository"**
4. Select your GitHub repo: `melshiD/call-me-back`
5. Click **"Import"**

### 3b. Configure Build Settings

Vercel should auto-detect Vite, but verify:

- **Framework Preset**: `Vite`
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

### 3c. Add Environment Variables

In Vercel project settings → Environment Variables:

**Variable Name**: `VITE_API_URL`
**Value**: Your Raindrop backend URL (from Step 2)
**Example**: `https://call-me-back-abc123.raindrop.ai`

Click **"Add"**

### 3d. Deploy

Click **"Deploy"**

Wait 1-2 minutes for build to complete.

**Save your Vercel URL!**
Example: `https://call-me-back.vercel.app`

## Step 4: Configure Twilio Webhooks

Now that backend is deployed, configure Twilio to use it:

1. Go to **Twilio Console**: https://console.twilio.com/
2. Navigate to **Phone Numbers → Manage → Active Numbers**
3. Click on your Twilio phone number
4. Scroll to **Voice Configuration**
5. Under **"A call comes in"**:
   - Select: `Webhook`
   - URL: `https://YOUR-RAINDROP-URL/api/voice/answer`
   - Example: `https://call-me-back-abc123.raindrop.ai/api/voice/answer`
   - HTTP Method: `POST`
6. Click **Save Configuration**

## Step 5: Test End-to-End!

### Test the Voice Pipeline

1. **Call your Twilio number** from any phone
2. You should hear: "Connecting you now."
3. **Brad (default persona) will answer**
4. Have a conversation!

Example conversation:
```
You: "Hey Brad, I'm working on a new startup called TechCo."
Brad: "Nice! TechCo - what's the big idea? And more importantly, what's the first milestone you're trying to hit?"
```

### Test Memory Continuity

**Call again in a few minutes:**
```
You: "Hey Brad, what's up?"
Brad: "Hey! How's TechCo going? Made progress on that first milestone?"
```

**Brad remembers!** 🎉

### Test the Frontend

1. Open your Vercel URL in browser: `https://call-me-back.vercel.app`
2. You should see the Vue app
3. The app can make API calls to your Raindrop backend

## Step 6: Monitor & Debug

### View Backend Logs

```bash
# Watch logs in real-time
raindrop logs --follow

# Filter for specific service
raindrop logs --service=voice-pipeline --follow

# Look for:
# - "Incoming call" (Twilio webhook received)
# - "Voice pipeline started" (Pipeline initialized)
# - "Memory context loaded" (SmartMemory loaded)
# - "Final transcript" (User speech recognized)
# - "AI response generated" (Cerebras response)
```

### View Frontend Logs

In Vercel dashboard:
1. Go to your project
2. Click **Deployments**
3. Click latest deployment
4. View **Function Logs** and **Build Logs**

### Check Database

```bash
# View recent calls
raindrop db query "SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 5;"

# View personas
raindrop db query "SELECT id, name FROM personas;"

# View relationships
raindrop db query "SELECT user_id, persona_id, relationship_type FROM user_persona_relationships;"
```

## URLs Reference

After deployment, you'll have:

| Component | URL | Purpose |
|-----------|-----|---------|
| **Frontend** | `https://call-me-back.vercel.app` | Vue UI |
| **Backend API** | `https://call-me-back-abc123.raindrop.ai` | REST APIs |
| **Twilio TwiML** | `https://call-me-back-abc123.raindrop.ai/api/voice/answer` | Voice webhook |
| **Twilio WebSocket** | `wss://call-me-back-abc123.raindrop.ai/api/voice/stream` | Audio streaming |

## Environment Variables Summary

### Backend (.env)
```bash
# Required
ELEVENLABS_API_KEY=sk_...
CEREBRAS_API_KEY=csk_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1555...
JWT_SECRET=your-32-char-secret

# Optional
DEFAULT_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

### Frontend (Vercel Environment Variables)
```bash
VITE_API_URL=https://call-me-back-abc123.raindrop.ai
```

## Troubleshooting

### "Connecting you now" but then silence

**Check:**
```bash
# View logs
raindrop logs --service=voice-pipeline --follow

# Common issues:
# - Missing API keys
# - WebSocket connection failed
# - Database not migrated
```

### Frontend can't reach backend

**Check:**
1. VITE_API_URL is set correctly in Vercel
2. Backend is deployed and running: `curl https://YOUR-URL/api/health`
3. CORS is enabled (should be by default in api-gateway)

### Persona doesn't remember previous calls

**Check:**
```bash
# Verify SmartMemory is provisioned
raindrop resources list

# Check call completed successfully
raindrop db query "SELECT status FROM call_logs ORDER BY created_at DESC LIMIT 1;"
# Should be: 'completed'
```

## Continuous Deployment

Once set up:

### Frontend Updates
```bash
git add .
git commit -m "Update frontend feature"
git push origin main
# Vercel auto-deploys! ✨
```

### Backend Updates
```bash
git add .
git commit -m "Update backend feature"
git push origin main
raindrop deploy  # Manual deploy required
```

## Cost Monitoring

Expected costs per call (5 minutes, 8 turns):
- STT: $0.03
- LLM: $0.0002
- TTS: $0.0005
- Twilio: $0.10
- **Total: ~$0.13/call**

Check actual costs:
```bash
raindrop db query "
  SELECT
    AVG(cost_total) as avg_cost_cents,
    COUNT(*) as total_calls
  FROM call_logs
  WHERE status = 'completed';
"
```

## Next Steps

1. **Customize personas**: Add new ones in database
2. **User phone lookup**: Replace `demo_user` with actual user lookup
3. **Voice customization**: Let users pick voices in frontend
4. **Analytics dashboard**: Build UI to show call stats
5. **Token budget**: Add memory context limits (1500 tokens)

## Quick Commands Cheat Sheet

```bash
# Backend
raindrop deploy              # Deploy backend
raindrop logs --follow       # Watch logs
raindrop db migrate          # Run migrations
raindrop db query "SELECT 1" # Test database
raindrop resources list      # List resources

# Frontend (Vercel)
vercel                       # Deploy from CLI (optional)
vercel logs                  # View logs from CLI

# Git
git status                   # Check changes
git add .                    # Stage changes
git commit -m "message"      # Commit
git push origin main         # Push to GitHub (triggers Vercel deploy)
```

## Support

- **Raindrop Docs**: https://docs.liquidmetal.ai/
- **Vercel Docs**: https://vercel.com/docs
- **Twilio Docs**: https://www.twilio.com/docs
- **Your GitHub**: https://github.com/melshiD/call-me-back

---

🎉 **You're all set!** Call your Twilio number and talk to Brad!
