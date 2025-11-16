# Call Me Back - Project Context Review
**Version:** 1.0
**Last Updated:** 2025-11-16
**Status:** In Development - Auth Working, WorkOS Integration Pending

## CRITICAL: Read These First
1. **CRITICAL_RAINDROP_RULES.md** - Deployment commands and common mistakes
2. **This document** - Complete project context
3. **WORKOS_INTEGRATION_PLAN.md** - Pending authentication upgrade

---

## Executive Summary

**Call Me Back** is an AI-powered phone companion that enables users to receive immediate or scheduled phone calls from customizable AI personas (Brad the bro, Sarah the empathetic friend, Alex the creative). Built for a hackathon with Vue.js frontend, Raindrop backend services, and integrates Twilio voice, Cerebras AI, ElevenLabs TTS, and (soon) WorkOS authentication.

**Current State:**
- ⚠️ Some Twilio env vars may not be set correctly
- ✅ Authentication working (JWT-based, needs WorkOS upgrade)
- ✅ Personas loading from Vultr PostgreSQL (Brad, Sarah, Alex)
- ✅ Database fully migrated to Vultr PostgreSQL via database-proxy pattern
- ✅ Frontend deployed to Vercel
- ✅ Backend deployed to Raindrop (sandbox mode)
- ❌ WorkOS authentication NOT YET implemented (hackathon requirement)
- ❌ "Add to contacts" button not working
- ⚠️ Timezone handling needed for scheduled calls

---

## Architecture Overview

### Deployment Model
```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│  Vercel Frontend│ ──────> │  Raindrop API Gateway│ ──────> │ Database Proxy  │
│  (Vue.js SPA)   │         │  (Hono Router)       │         │  (Service)      │
└─────────────────┘         └──────────────────────┘         └─────────────────┘
                                      │                               │
                                      ├──> Auth Manager               │
                                      ├──> Call Orchestrator          │
                                      ├──> Persona Manager            │
                                      ├──> Payment Processor          ▼
                                      └──> Voice Pipeline     ┌─────────────────┐
                                                              │ Vultr PostgreSQL│
                                                              │   144.202.15.249│
                                                              └─────────────────┘
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

**3. Frontend/Backend Separation**
- **Frontend:** Deployed to Vercel via `vercel --prod` (NOT git push)
- **Backend:** Deployed to Raindrop via `raindrop build deploy`
- **They are INDEPENDENT** - must deploy separately

---

## Current URLs (Main Branch)

| Component | URL |
|-----------|-----|
| **Frontend** | https://call-me-back-nugbql1rx-david-melsheimers-projects.vercel.app |
| **API Gateway** | https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run |
| **Vultr DB Proxy** | http://144.202.15.249:3000 |
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

**voice-pipeline** (`src/voice-pipeline/index.ts`)
- WebSocket-based real-time voice processing
- ElevenLabs STT → Cerebras AI → ElevenLabs TTS pipeline
- Target: <3s total response time

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

---

## Deployment Procedures

### CRITICAL Deployment Rules

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

**3. Twilio Environment Variables** (this item is marked 3 but I'm placing highest importance on it currently)
- Frontend error suggests Twilio vars aren't set
- Check `./set-all-secrets.sh` execution
- Verify variables in Raindrop: `raindrop build env list`

**1. "Add to Contacts" Button Not Working**
- Frontend button exists but functionality not implemented
- Need to wire up to `/api/contacts` endpoint
- Backend may need updates in persona-manager

**2. Timezone Handling for Scheduled Calls**
- Need to respect user timezones
- Implement timer function for safety
- Ensure calls trigger at expected local time

**4. Password Special Characters**
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
- Frontend deploys successfully
- Backend deploys successfully
- Database queries via database-proxy

### ❌ Not Tested / Not Working
- WorkOS authentication (not implemented)
- Call triggering end-to-end with real phone
- Add to contacts functionality
- Scheduled calls with timezone handling
- Payment processing with Stripe
- Voice pipeline with actual calls
- WebSocket voice streaming

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

## Cost Model

**Connection Fee:** $0.25 per call
**Per-Minute Rate:** $0.40/minute
**Payment:** Stripe PaymentIntent with manual capture
**Target Operating Cost:** <$0.25/minute

**Cost Breakdown Per Call:**
- Twilio: ~$0.01-0.02/minute
- Cerebras: ~$0.05/minute (fast inference)
- ElevenLabs: ~$0.10/minute (TTS)
- Total platform cost: ~$0.16-0.17/minute
- Margin: ~$0.23/minute

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

**End of Review Document**
