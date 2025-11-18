# Call Me Back - Project Context Review
**Version:** 1.1
**Last Updated:** 2025-11-17
**Status:** In Development - Voice Pipeline Working (1 Volley Confirmed), WorkOS Integration Pending

## CRITICAL: Read These First
1. **CRITICAL_RAINDROP_RULES.md** - Deployment commands and common mistakes
2. **This document** - Complete project context
3. **WORKOS_INTEGRATION_PLAN.md** - Pending authentication upgrade

---

## Executive Summary

**Call Me Back** is an AI-powered phone companion that enables users to receive immediate or scheduled phone calls from customizable AI personas (Brad the bro, Sarah the empathetic friend, Alex the creative). Built for a hackathon with Vue.js frontend, Raindrop backend services, and integrates Twilio voice, Cerebras AI, ElevenLabs TTS, and (soon) WorkOS authentication.

**Current State:**
- ✅ **Voice Pipeline WORKING** (2025-11-17: First successful talk-response volley! Deepgram→Cerebras→ElevenLabs working)
- ✅ **Twilio integration WORKING** (TwiML connects to wss://voice.ai-tools-marketplace.io/stream)
- ✅ **Authentication WORKING** (JWT-based, registration/login/add contacts functional)
- ⚠️ **WorkOS NOT IMPLEMENTED** - Still using JWT, WorkOS required for hackathon
- ✅ **Voice Pipeline Migrated to Node.js/Vultr** (Cloudflare Workers can't make outbound WebSocket connections)
- ✅ Personas loading from Vultr PostgreSQL (Brad, Sarah, Alex)
- ✅ Database fully migrated to Vultr PostgreSQL
- ✅ Frontend deployed to Vercel
- ✅ Backend services deployed to Raindrop
- ⏳ **Multi-turn conversation** needs testing (only 1 volley confirmed so far)
- ⏳ **Turn-taking logic** not yet implemented (need Cerebras parallel evaluation)

---

## Architecture Overview

### Deployment Model (UPDATED 2025-11-17)

**CRITICAL CHANGE**: Voice Pipeline moved to Node.js/Vultr due to Cloudflare Workers WebSocket limitation.

```
┌─────────────────┐         ┌──────────────────────────────────────────┐
│  Vercel Frontend│ ──────> │    CLOUDFLARE WORKERS (Raindrop)        │
│  (Vue.js SPA)   │         │  ┌────────────────────────────────────┐ │
└─────────────────┘         │  │  • API Gateway (Hono)              │ │
                            │  │  • Auth Manager (JWT)              │ │
         ┌──────────────────┤  │  • Database Proxy                   │ │
         │                  │  │  • Persona Manager                  │ │
         │                  │  │  • Call Orchestrator                │ │
         │                  │  │  • Payment Processor                │ │
         │                  │  │  • Webhook Handler                  │ │
         │                  │  └────────────────────────────────────┘ │
         │                  └──────────────────────────────────────────┘
         │                                      │
         │                                      ▼
         │                  ┌─────────────────────────────────────────┐
         │                  │   VULTR SERVER (144.202.15.249)         │
         │                  │  ┌───────────────────────────────────┐  │
         │                  │  │ Voice Pipeline (Node.js/PM2)      │  │
         │  TwiML connects  │  │  • Twilio WebSocket (wss://)      │  │
         └─────────────────>│  │  • Deepgram STT (outbound WS)     │  │
           to wss://        │  │  • Cerebras AI (HTTP)              │  │
           voice.ai-tools-  │  │  • ElevenLabs TTS (outbound WS)   │  │
           marketplace.io   │  └───────────────────────────────────┘  │
                            │  ┌───────────────────────────────────┐  │
                            │  │ Database Proxy (HTTP)             │  │
                            │  └───────────────────────────────────┘  │
                            │  ┌───────────────────────────────────┐  │
                            │  │ Vultr PostgreSQL (Direct)         │  │
                            │  └───────────────────────────────────┘  │
                            │  ┌───────────────────────────────────┐  │
                            │  │ Caddy (SSL/TLS reverse proxy)     │  │
                            │  └───────────────────────────────────┘  │
                            └─────────────────────────────────────────┘
```

### Key Architectural Decisions

**1. Database: Vultr PostgreSQL (NOT SmartSQL)**
- **Why:** SmartSQL has critical limitations:
  - Doesn't support all SQL functions
  - Limited JOIN capabilities
  - No support for certain data types
  - Caused "Invalid input or query execution error"
- **Solution:** All database operations go through `database-proxy` service to Vultr PostgreSQL
- **Proof:** Personas (Brad, Sarah, Alex) load successfully from Vultr

**2. Database-Proxy Pattern**
- **Why:** Cloudflare Workers (Raindrop's runtime) cannot fetch external URLs directly
- **How:** Services call `DATABASE_PROXY.executeQuery()` instead of direct SQL
- **All services use this:** auth-manager, call-orchestrator, persona-manager

**3. Voice Pipeline: Node.js on Vultr (NOT Cloudflare Workers)**
- **Why:** Cloudflare Workers CANNOT make outbound WebSocket connections (platform limitation)
- **Evidence:** 8 debugging sessions proved `fetch()` with `Upgrade: websocket` hangs indefinitely
- **Solution:** Migrated ONLY voice-pipeline to Node.js/PM2 on Vultr (Sessions 9-10 in CALL_FLOW_DEBUGGING.md)
- **URL:** wss://voice.ai-tools-marketplace.io/stream (Caddy provides SSL)
- **Status:** ✅ Working! First successful talk-response volley confirmed

**4. Frontend/Backend Separation**
- **Frontend:** Deployed to Vercel via `vercel --prod` (NOT git push)
- **Backend Services:** Deployed to Raindrop via `raindrop build deploy`
- **Voice Pipeline:** Deployed to Vultr via `./deploy.sh` in `voice-pipeline-nodejs/`
- **They are INDEPENDENT** - must deploy separately

---

## Current URLs (Main Branch)

| Component | URL |
|-----------|-----|
| **Frontend** | https://call-me-back-nugbql1rx-david-melsheimers-projects.vercel.app |
| **API Gateway** | https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run |
| **Voice Pipeline** | wss://voice.ai-tools-marketplace.io/stream ✅ WORKING |
| **Vultr DB Proxy** | https://db.ai-tools-marketplace.io |
| **Branch** | main (@01ka41s1...) |
| **Mode** | Sandbox (see .raindrop/config.json) |

---

## Database Schema

### Core Tables (All in Vultr PostgreSQL)

**Authentication & Users:**
- `users` - User accounts (id, email, password_hash, name, phone, stripe_customer_id)
- `token_blacklist` - JWT revocation for logout
- `user_budget_settings` - Per-user spending limits
- `user_credits` - Credit balances and subscription tiers

**Personas & Relationships:**
- `personas` - AI personality definitions (Brad, Sarah, Alex + custom)
  - Fields: id, name, description, core_system_prompt, default_voice_id, category, is_system_persona
- `user_persona_relationships` - User-specific persona customizations and favorites
  - Stores: custom_system_prompt, voice_id, total_calls, is_favorite

**Calls:**
- `calls` - Active/completed call records
  - Tracks: twilio_call_sid, duration, payment status, costs
- `scheduled_calls` - Future scheduled calls
- `call_logs` - Historical call data with detailed metrics
- `call_cost_events` - Granular cost tracking per API call

**Migrations Applied:**
- 001: personas, user_persona_relationships, call_logs tables
- 002-003: Seed initial personas (Brad, Sarah, Alex)
- 004: calls, scheduled_calls tables
- 005: user_credits, credit_transactions tables
- 006: users, token_blacklist, user_budget_settings, call_cost_events tables

**Demo User:** demo@callmeback.ai / demo123 (100 credits)

---

## Service Architecture

### Services (Raindrop Microservices)

**api-gateway** (`src/api-gateway/index.ts`)
- Public HTTP API using Hono router
- Handles CORS (MUST be `corsAllowAll` in src/_app/cors.ts) [!!Is this going to be a escurity issue?]
- Routes:
  - ✅ `/api/auth/*` - Registration, login, logout, validate
  - ✅ `/api/personas` - Get personas
  - ✅ `/api/calls/trigger` - Trigger immediate calls
  - ✅ `/api/voice/*` - Voice/Twilio webhooks
  - ⚠️ More routes may be incomplete

**auth-manager** (`src/auth-manager/index.ts`)
- User registration with bcrypt password hashing
- JWT token generation and validation
- Uses `DATABASE_PROXY.executeQuery()` with PostgreSQL syntax ($1, $2 placeholders)
- **Note:** Special characters in passwords cause JSON parsing errors (use alphanumeric)

**database-proxy** (`src/database-proxy/index.ts`)
- Bridges Cloudflare Workers to Vultr PostgreSQL
- Config: `apiUrl: 'https://db.ai-tools-marketplace.io'`
- All services MUST use this for database access

**persona-manager** (`src/persona-manager/index.ts`)
- Manages persona CRUD operations
- Loads system personas (Brad, Sarah, Alex)
- Handles user contacts/favorites
- Uses DATABASE_PROXY

**call-orchestrator** (`src/call-orchestrator/index.ts`)
- Twilio call lifecycle management
- Scheduled call execution
- Uses DATABASE_PROXY

**payment-processor** (`src/payment-processor/index.ts`)
- Stripe integration (not fully tested)
- Pricing: $0.25 connection fee + $0.40/minute

**voice-pipeline** (`voice-pipeline-nodejs/index.js`) **[MIGRATED TO NODE.JS]**
- **Location**: Vultr server (144.202.15.249) running on PM2
- **URL**: wss://voice.ai-tools-marketplace.io/stream
- **Stack**: Node.js + Express + ws library (NOT Cloudflare Workers)
- **Flow**: Twilio WebSocket → Deepgram STT → Cerebras AI → ElevenLabs TTS → Twilio
- **Status**: ✅ First successful talk-response volley confirmed (Session 10)
- **Pending**: Multi-turn conversation, turn-taking logic, interrupt handling
- **Deployment**: `cd voice-pipeline-nodejs && ./deploy.sh`

**webhook-handler** (`src/webhook-handler/index.ts`)
- Processes Twilio and Stripe webhooks
- Signature verification for security

---

## Environment Variables & Secrets
**NOTE!:** Do not ever... EVER expose secrets to tracked files or in the Claude logs
### Required Secrets (Set via `./set-all-secrets.sh`)

**CRITICAL:** Running `raindrop build generate` WIPES all environment secrets!
Always run `./set-all-secrets.sh` after any `generate` command.

```bash
# Authentication & Database
JWT_SECRET=<random-string>
VULTR_DB_API_URL=https://db.ai-tools-marketplace.io
VULTR_DB_API_KEY=<from-vultr>

# Twilio (may have configuration issues)
TWILIO_ACCOUNT_SID=<from-twilio>
TWILIO_AUTH_TOKEN=<from-twilio>
TWILIO_PHONE_NUMBER=<from-twilio>

# AI Services
ELEVENLABS_API_KEY=<from-elevenlabs>
CEREBRAS_API_KEY=<from-cerebras>

# WorkOS (NEEDED FOR HACKATHON - NOT YET SET)
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=<32-char-random>
```

### Setting Secrets
```bash
# Use the env: prefix
raindrop build env set env:SECRET_NAME "value"

# Or run the script (recommended)
./set-all-secrets.sh
```

### CRITICAL: Adding New Environment Variables

**When adding a new environment variable, you MUST do THREE things:**

1. **Add to `.env` file** - The actual value
2. **Add to `raindrop.manifest`** - Declare it as an env variable
   ```hcl
   env "YOUR_VAR_NAME" {
     secret = true  # or false if not sensitive
   }
   ```
3. **Add to `set-all-secrets.sh`** - So it gets set during deployment
   ```bash
   raindrop build env set env:YOUR_VAR_NAME "$YOUR_VAR_NAME"
   ```

**If you skip step 2 (manifest), you'll get TypeScript errors:**
```
error TS2339: Property 'YOUR_VAR_NAME' does not exist on type 'Env'
```

**Order matters:**
1. Add to manifest first
2. Run `raindrop build generate` to regenerate types
3. Then you can use it in code via `this.env.YOUR_VAR_NAME`

### Frontend Authentication Token Naming

**IMPORTANT:** The frontend uses `'token'` as the localStorage key for auth tokens, NOT `'authToken'`.

```javascript
// ✅ CORRECT (what we use)
localStorage.setItem('token', jwtToken)        // in auth.js
localStorage.getItem('token')                   // in personas.js

// ❌ WRONG (don't use this)
localStorage.setItem('authToken', jwtToken)
localStorage.getItem('authToken')
```

**Fixed 2025-11-16:** Updated personas.js to use `'token'` key to match auth.js (was causing "Authentication required" errors)

---

## Deployment Procedures

### CRITICAL Deployment Rules

**IMPORTANT: Raindrop Dashboard is Essentially Useless**
- The Raindrop web dashboard is extremely sparse (can't even set env vars through it)
- **ALL useful information must be obtained through the CLI**
- Logs, status, debugging - everything is CLI-based
- Don't waste time looking for features in the dashboard

**Getting Logs (CLI Only):**
```bash
# Get last 100 log entries
raindrop logs tail -n 100 --application call-me-back

# Follow logs in real-time (like tail -f)
raindrop logs tail -f --application call-me-back

# Get last 50 logs and then follow
raindrop logs tail -n 50 -f --application call-me-back
```

**EFFICIENT DEBUGGING: Query Debug Markers Instead of Reading Logs**
- **Problem:** Reading logs consumes massive context (200+ lines per check)
- **Solution:** Debug markers inserted into `debug_markers` table during execution
- **Usage:** Run `./query-debug-markers.sh` to see last 20 execution markers
- **Benefits:** Tiny context usage, precise execution flow tracking, queryable history
- **Markers:** BEFORE_PIPELINE_START, AFTER_PIPELINE_START, etc.

**Creating New Branches:**
```bash
# CORRECT
raindrop build start --branch feature-name

# WRONG - Never use git directly
git checkout -b feature-name  # ❌
```

**Sandbox vs Production Mode:**
- After `raindrop build start`, you're in **sandbox mode** (temporary URLs)
- Exit sandbox: `rm -f .raindrop/sandbox`
- Check mode: `cat .raindrop/config.json` (look for `"sandbox": true`)

**Deployment Commands:**
```bash
# Standard deployment
raindrop build deploy

# Amend deployment (update current version)
raindrop build deploy --amend

# NEVER chain generate and deploy
raindrop build generate && raindrop build deploy  # ❌ STUCK
```

**Deployment Workflow:**
1. Make code changes
2. Run `./set-all-secrets.sh` if you ran `generate`
3. Run `raindrop build deploy`
4. Check `raindrop build status`
5. Wait for completion (don't start another deploy)

### Frontend Deployment (Vercel)

**Vercel is NOT tied to Git repository!**

```bash
# Production deployment
vercel --prod

# Preview deployment
vercel

# Check deployments
vercel ls

# View logs
vercel logs <deployment-url>
```

**Environment Variables:**
Frontend needs `VITE_API_URL` set in Vercel:
```bash
vercel env rm VITE_API_URL production
echo "https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run" | vercel env add VITE_API_URL production
vercel --prod
```

---

## Known Issues & Pending Work

### HIGH PRIORITY: WorkOS Integration (HACKATHON REQUIREMENT)

**Status:** NOT IMPLEMENTED
**Plan:** WORKOS_INTEGRATION_PLAN.md

**What's Needed:**
1. Sign up at workos.com
2. Get API Key and Client ID
3. Activate AuthKit in dashboard
4. Add redirect URI: `https://<api-gateway-url>/api/auth/callback`
5. Create new auth service using WorkOS SDK
6. Update API gateway routes for WorkOS flow
7. Replace JWT with WorkOS sessions (encrypted cookies)

**Impact:** Meets hackathon requirement, better security, enterprise-ready (SSO/MFA)

### Medium Priority Issues

**1. Pricing & Payment Implementation** (CRITICAL FOR LAUNCH)
- ❌ No pricing logic implemented in payment-processor
- ❌ No call duration selection in frontend
- ❌ No subscription tiers implemented
- ❌ No Stripe subscription management
- ❌ No Twilio call timers (5-min default not enforced)
- **Action Required:**
  - Implement call duration selection UI
  - Add pricing calculation to payment-processor
  - Set up Stripe subscriptions
  - Configure Twilio call timers
  - Add mid-call extension prompts
  - Build fair use monitoring
- **See:** `API_COSTS_AND_PROFITABILITY_2025.md` for detailed pricing strategy

**2. Twilio Trial Account Limitation** ✅ INTEGRATION WORKING
- **Status:** Twilio API integration is fully working!
- **Issue:** Trial accounts can only call verified phone numbers
- **Solution Options:**
  - Verify phone numbers at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
  - Upgrade to paid Twilio account (add payment method)
  - Continue using demo mode for testing
- **Fixed (2025-11-16):** Changed `process.env` to `this.env` in call-orchestrator and voice-pipeline

**3. "Add to Contacts" Button Not Working**
- Frontend button exists but functionality not implemented
- Need to wire up to `/api/contacts` endpoint
- Backend may need updates in persona-manager

**4. Timezone Handling for Scheduled Calls**
- Need to respect user timezones
- Implement timer function for safety
- Ensure calls trigger at expected local time

**5. Password Special Characters**
- Passwords with `!` cause JSON parsing errors.
- Current workaround: use alphanumeric only
- Need better input sanitization

---

## Testing Status

### ✅ Working
- User registration: `POST /api/auth/register`
- User login: `POST /api/auth/login`
- JWT token generation
- Personas API: `GET /api/personas` (returns Brad, Sarah, Alex from Vultr)
- **Twilio integration: `POST /api/calls/trigger`** (Full integration working!)
- **Voice Pipeline**: Twilio → Deepgram → Cerebras → ElevenLabs → Twilio (1 volley confirmed!)
- Frontend deploys successfully
- Backend deploys successfully (Raindrop)
- Voice pipeline deploys successfully (Vultr/PM2)
- Database queries via database-proxy

### ⏳ Partially Working / Needs Testing
- **Multi-turn conversation** (only 1 volley confirmed, needs more testing)
- **Turn-taking logic** (not implemented - need Cerebras parallel evaluation from conversation-manager.ts)
- **Interrupt handling** (not implemented)

### ❌ Not Implemented
- WorkOS authentication (critical for hackathon - still using JWT)
- Scheduled calls with timezone handling
- Payment processing with Stripe
- Call recording/transcripts
- Persona switching mid-call
- Cost tracking per call

---

## Key Files & Scripts

### Critical Scripts
- `./set-all-secrets.sh` - Sets all Raindrop environment variables
- `./apply-migrations.sh` - Applies SQL migrations to Vultr (already done)
- `vercel --prod` - Deploys frontend to Vercel

### Important Config Files
- `.raindrop/config.json` - Check sandbox mode status
- `src/_app/cors.ts` - MUST be `corsAllowAll` for frontend to work
- `CRITICAL_RAINDROP_RULES.md` - Deployment command reference
- `FINAL_DATABASE_STRATEGY.md` - Why we use Vultr, not SmartSQL

### Database Files
- `migrations/*.sql` - All migration files (001-006)
- `seed.sql` - Seed data for Brad, Sarah, Alex personas
- `migrations/006_create_users_and_auth_tables_fixed.sql` - Users table + demo user

### Service Implementation
- `src/api-gateway/index.ts` - Main HTTP router
- `src/database-proxy/index.ts` - Vultr PostgreSQL bridge
- `src/auth-manager/index.ts` - JWT authentication
- `src/persona-manager/index.ts` - Persona CRUD
- `src/call-orchestrator/index.ts` - Call lifecycle

---

## Common Mistakes to Avoid

### Deployment Mistakes
❌ Using git branches instead of `raindrop build start`
❌ Running `generate` without re-setting secrets after
❌ Deploying while another deployment is running
❌ Forgetting to exit sandbox mode
❌ Trying to deploy frontend with `raindrop build deploy` (use `vercel --prod`)
❌ Thinking Vercel is tied to git (it's NOT - use Vercel CLI)

### Database Mistakes
❌ Trying to use SmartSQL for complex queries (won't work)
❌ Direct SQL calls instead of DATABASE_PROXY
❌ Forgetting PostgreSQL uses $1, $2 placeholders (not ?)
❌ Not applying migrations before testing

### Code Mistakes
❌ Setting CORS to `corsDisabled` (must be `corsAllowAll`)
❌ Using special characters in passwords without sanitization
❌ Exposing secrets in logs or frontend code
❌ Not handling timezone conversions for scheduled calls

---

## Development Workflow

### Starting a New Feature
1. Read CRITICAL_RAINDROP_RULES.md
2. Read this document
3. Create new branch: `raindrop build start --branch feature-name`
4. Make code changes
5. Run `./set-all-secrets.sh` if needed
6. Deploy: `raindrop build deploy`
7. Test via API Gateway URL
8. Deploy frontend if needed: `vercel --prod`

### Debugging Issues
1. Check deployment status: `raindrop build status`
2. Check if in sandbox: `cat .raindrop/config.json`
3. Verify secrets are set (they reset after `generate`)
4. Check for stuck deployments
5. Review RAINDROP_DEPLOYMENT_GUIDE.md for details
6. Test database connectivity via database-proxy

### Making Database Changes
1. Create new migration file in `migrations/`
2. Number it sequentially (007, 008, etc.)
3. Apply via `./apply-migrations.sh` (targets Vultr)
4. Update services to use new schema via DATABASE_PROXY
5. Test with demo user (demo@callmeback.ai / demo123)

---

## Tech Stack

**Frontend (Vercel):**
- Vue 3 (Composition API)
- Vite build tool
- Pinia state management
- Vue Router

**Backend (Raindrop):**
- Hono HTTP router
- Service-to-service architecture
- Cloudflare Workers runtime
- TypeScript

**Database:**
- PostgreSQL on Vultr (144.202.15.249:3000)
- Accessed via database-proxy service
- Full SQL support (unlike SmartSQL)

**External APIs:**
- Twilio Programmable Voice
- Cerebras AI (sub-1s inference)
- ElevenLabs TTS (voice synthesis)
- Stripe (payment processing)
- WorkOS (pending - for auth)

**Deployment:**
- Frontend: Vercel CLI
- Backend: Raindrop CLI
- Database: Self-hosted Vultr

---

## Personas System

### System Personas (Pre-loaded)

**Brad (brad_001)** - "Your bro who keeps it real"
- Voice: pNInz6obpgDQGcFmaJgB
- Category: coach
- Personality: Decisive, direct, loyal, practical, encouraging
- Use case: Accountability partner, tough love advice

**Sarah (sarah_001)** - "A warm, empathetic friend"
- Voice: EXAVITQu4vr4xnSDxMaL
- Category: friend
- Personality: Empathetic, patient, non-judgmental, insightful
- Use case: Emotional support, active listening

**Alex (alex_001)** - "An energetic creative"
- Voice: pNInz6obpgDQGcFmaJgB
- Category: creative
- Personality: Creative, enthusiastic, curious, playful
- Use case: Brainstorming, creative problem-solving

### Persona Customization
- Users can create custom personas
- Override system prompts per user
- Custom voice settings via ElevenLabs
- Favorites system (needs "add to contacts" fix)
- Usage tracking (total_calls, total_duration_seconds)

---

## Cost Model & Pricing Strategy

### Actual API Costs Per 5-Minute Call (2025 Pricing)

**Direct API Costs:**
- **Twilio (5 min outbound):** $0.07 ($0.014/min)
- **Deepgram STT (5 min streaming):** $0.03 ($0.0059/min)
- **Cerebras AI (50K tokens, Llama 3.1 8B):** $0.005 ($0.10/1M tokens)
- **ElevenLabs TTS (2K chars, Turbo model):** $0.30 ($0.15/1K chars)
- **Raindrop (amortized @ 1K calls/mo):** $0.02
- **Subtotal Direct Costs:** $0.425 per 5-min call

**Payment Processing:**
- **Stripe (3.4% + $0.30):** ~$0.47 per $5 transaction

**Total Cost Per 5-Minute Call:** ~$0.90

### User Pricing Strategy (NOT YET IMPLEMENTED)

**Phase 1: Launch Pricing (Month 1-3)**
- **Pay-As-You-Go:** $4.99 per call (5 min default)
- **First call FREE** (no credit card)
- **Gross Margin:** 82% ($4.10 profit per call)

**Phase 2: Proven Model (Month 4-12)**
- **Pay-As-You-Go:** $6.99 per call
- **Starter Pack:** $24.99 for 5 calls ($4.99/call)
- **Monthly Unlimited:** $29.99/month (up to 10 calls)
- **Gross Margin:** 87% on pay-per-call

**Phase 3: Premium Tiers (Month 12+)**
- **Casual Plan:** $9.99/month (3 calls + $4.99 per additional)
- **Standard Plan:** $29.99/month (up to 10 calls)
- **Power User Plan:** $49.99/month (up to 25 calls)
- **Pro Plan:** $99.99/month (unlimited with fair use)

**Call Duration Pricing:**
- **3 minutes:** $3.99
- **5 minutes:** $4.99 (default, most popular)
- **10 minutes:** $7.99
- **15 minutes:** $10.99
- Extension during call: +$2.99 for 5 more minutes

### Key Pricing Insights

**Current State:** ❌ **NOT IMPLEMENTED**
- No pricing logic in payment-processor yet
- No call duration limits implemented
- No subscription tiers implemented
- Currently using placeholder/demo pricing

**Must Implement:**
1. Call duration selection UI in frontend
2. Pricing calculation in payment-processor
3. Stripe subscription management
4. Call timer with Twilio (5-min default)
5. Mid-call extension prompt
6. Fair use monitoring for "unlimited" plans

**Profitability:**
- Break-even at 127 calls/month @ $5/call
- 80%+ gross margin achievable
- Stripe fees are largest cost (24-50% of total)
- Cerebras is 40x cheaper than OpenAI GPT-4 (key advantage)
- ElevenLabs is largest API cost (35% of direct costs)

**See:** `API_COSTS_AND_PROFITABILITY_2025.md` for complete analysis

---

## Security Notes

### Authentication Flow (Current - JWT)
1. User registers/logs in → auth-manager
2. bcrypt hashes password → stores in users table
3. JWT token generated with JWT_SECRET
4. Token sent to frontend
5. Frontend includes token in Authorization header
6. API Gateway validates token before routing

### Authentication Flow (Future - WorkOS)
1. User clicks login → redirects to WorkOS hosted UI
2. WorkOS handles authentication (email/password, SSO, MFA)
3. Callback to `/api/auth/callback` with code
4. Exchange code for user session
5. Store encrypted session cookie
6. No JWT needed - WorkOS manages sessions

### Security Best Practices
- Never expose secrets in frontend code
- Never log secrets to console
- Always use HTTPS for API calls
- Validate all user input
- Sanitize passwords before JSON parsing
- Use database-proxy to prevent direct DB access
- Verify webhook signatures (Twilio, Stripe)

---

## Quick Reference Commands

### Raindrop
```bash
raindrop build status                    # Check deployment status
raindrop build start --branch name       # Create new branch
raindrop build deploy                    # Deploy changes
raindrop build deploy --amend            # Update current deployment
raindrop build env set env:NAME "val"    # Set secret
raindrop build env list                  # List secrets
rm -f .raindrop/sandbox                  # Exit sandbox mode
cat .raindrop/config.json                # Check config
```

### Vercel
```bash
vercel --prod                            # Deploy to production
vercel                                   # Deploy preview
vercel ls                                # List deployments
vercel env add VITE_API_URL production   # Add env var
vercel env rm VITE_API_URL production    # Remove env var
```

### Database
```bash
./apply-migrations.sh                    # Apply migrations to Vultr
./set-all-secrets.sh                     # Set all Raindrop secrets
```

### Testing
```bash
# Test personas API
curl https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/personas

# Test registration
curl -X POST https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","name":"Test User"}'
```

---

## Next Steps for Development

### Immediate (Critical)
1. **Implement WorkOS Authentication**
   - Sign up for WorkOS account
   - Configure AuthKit
   - Update auth-manager to use WorkOS SDK
   - Update API Gateway routes
   - Test end-to-end auth flow
   - Deploy and verify

2. **Fix "Add to Contacts" Button**
   - Wire frontend button to API
   - Implement `/api/contacts` POST endpoint
   - Update persona-manager service
   - Test with demo user

3. **Implement Timezone Handling**
   - Add timezone field to scheduled_calls
   - Convert to UTC for storage
   - Convert back to user timezone for execution
   - Add safety timer function

### Short-term
4. Test call triggering end-to-end
5. Verify Twilio integration works
6. Test voice pipeline with real calls
7. Implement payment processing
8. Test scheduled calls execution

### Medium-term
9. Add comprehensive error handling
10. Implement rate limiting
11. Add usage analytics
12. Build admin dashboard
13. Add call recording/transcripts
14. Implement referral system

---

## Troubleshooting Guide

### "Database query failed: Invalid input or query execution error"
**Cause:** Trying to use SmartSQL instead of Vultr PostgreSQL
**Solution:** Ensure service uses `DATABASE_PROXY.executeQuery()` with PostgreSQL syntax ($1, $2)

### "Cannot branch from locked parent"
**Cause:** Another deployment is running
**Solution:** Use `raindrop build start --branch new-name` instead of deploy

### Personas return "TEST_FALLBACK" instead of Brad/Sarah/Alex
**Cause:** Database connection failing or migrations not applied
**Solution:** Run `./apply-migrations.sh` and check VULTR_DB_API_KEY is set

### CORS errors in browser console
**Cause:** CORS disabled in src/_app/cors.ts
**Solution:** Change to `corsAllowAll`

### "Twilio credentials not set" error
**Cause:** Environment variables not set or wiped by `generate`
**Solution:** Run `./set-all-secrets.sh`

### Frontend shows old API URL
**Cause:** Vercel environment variables not updated
**Solution:** Update VITE_API_URL in Vercel and redeploy

### Password with special characters fails
**Cause:** JSON parsing error with special chars
**Solution:** Use alphanumeric passwords or implement proper sanitization

---

## Resources & Documentation

### Internal Docs
- CRITICAL_RAINDROP_RULES.md - Deployment rules
- WORKOS_INTEGRATION_PLAN.md - WorkOS implementation plan
- FINAL_DATABASE_STRATEGY.md - Why Vultr, not SmartSQL
- RAINDROP_PRD.md - Product requirements
- DEPLOYMENT_SUCCESS.md - Historical deployment notes
- UPDATE_SUMMARY.md - Recent updates summary

### External Links
- Raindrop Docs: https://docs.liquidmetal.ai
- WorkOS Docs: https://workos.com/docs
- Twilio Docs: https://www.twilio.com/docs/voice
- ElevenLabs Docs: https://elevenlabs.io/docs
- Cerebras Docs: https://cerebras.ai/docs
- Stripe Docs: https://stripe.com/docs

---

## Summary for AI Assistants

When working on this project:

1. **ALWAYS read CRITICAL_RAINDROP_RULES.md first**
2. **NEVER use SmartSQL** - all database ops go through database-proxy to Vultr
3. **NEVER expose secrets** - use environment variables
4. **Frontend deploys separately** - use `vercel --prod`, not git push
5. **Set secrets after generate** - run `./set-all-secrets.sh`
6. **WorkOS is NOT implemented** - it's a critical pending task
7. **Sandbox mode** - check .raindrop/config.json before debugging
8. **Database migrations** - already applied, don't re-run unless adding new ones
9. **Auth works** - JWT-based, registration/login tested and working
10. **Personas work** - Brad, Sarah, Alex load from Vultr PostgreSQL

**The app is functional but needs WorkOS integration to meet hackathon requirements.**

---
## Other docs currently required: Read the following: ##
- VOICE_PIPELINE_DEBUG_FINDINGS.md
- VOICE_PIPELINE_DEBUG_AND_TASKS.md
**End of Review Document**
##### AND REMEMBER, NEVER SHOW SECRETS IN THE LOGS OR TO A USER! #####
