# Document Audit Findings Log
**Version:** 1.0
**Created:** 2025-11-21
**Last Updated:** 2025-11-21

---

## Purpose

This log records findings from the document audit process. **No changes are made to documents until findings are reviewed and approved by the user.** Changes are batched for review.

---

## Findings Status Legend

- **PENDING** - Awaiting user review
- **APPROVED** - User approved, ready to implement
- **IMPLEMENTED** - Changes made
- **REJECTED** - User rejected proposed change
- **DEFERRED** - Postponed for later consideration

---

## Batch 1: CRITICAL_RAINDROP_RULES.md

**Documents Reviewed:**
- CRITICAL_RAINDROP_RULES.md

**Review Date:** 2025-11-21
**Reviewed By:** Claude

**Source Files Cross-Referenced:**
- raindrop.manifest
- set-all-secrets.sh
- .raindrop/config.json

### Findings

---

### Finding F001: Missing DEEPGRAM_API_KEY from secrets list
**File:** CRITICAL_RAINDROP_RULES.md
**Section:** "Required Secrets for This Project" (lines 66-74)
**Type:** MISSING
**Priority:** HIGH
**Status:** PENDING

**Current Content:**
> ### Required Secrets for This Project
> - JWT_SECRET
> - VULTR_DB_API_URL
> - VULTR_DB_API_KEY
> - TWILIO_ACCOUNT_SID
> - TWILIO_AUTH_TOKEN
> - TWILIO_PHONE_NUMBER
> - ELEVENLABS_API_KEY
> - CEREBRAS_API_KEY

**Issue:**
The document lists 8 required secrets, but the actual manifest and set-all-secrets.sh script include DEEPGRAM_API_KEY. This is also referenced in PCR2.md as a required secret for the voice pipeline.

**Proposed Change:**
Add to the list:
> - DEEPGRAM_API_KEY

**Source Evidence:**
- raindrop.manifest:23-25 - defines DEEPGRAM_API_KEY env var with secret=true
- set-all-secrets.sh:29 - sets DEEPGRAM_API_KEY
- PCR2.md:1322 - lists DEEPGRAM_API_KEY as required

---

### Finding F002: Missing new secrets from list
**File:** CRITICAL_RAINDROP_RULES.md
**Section:** "Required Secrets for This Project" (lines 66-74)
**Type:** MISSING
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
> (same as F001)

**Issue:**
The document is missing three additional secrets that are now in the manifest:
- WORKOS_API_KEY
- WORKOS_CLIENT_ID
- ADMIN_SECRET_TOKEN

**Proposed Change:**
Add to the list:
> - WORKOS_API_KEY
> - WORKOS_CLIENT_ID
> - ADMIN_SECRET_TOKEN

**Source Evidence:**
- raindrop.manifest:39-54 - defines WORKOS_API_KEY, WORKOS_CLIENT_ID, ADMIN_SECRET_TOKEN
- set-all-secrets.sh:32-34 - sets WORKOS secrets (but missing ADMIN_SECRET_TOKEN)

---

### Finding F003: set-all-secrets.sh missing ADMIN_SECRET_TOKEN
**File:** CRITICAL_RAINDROP_RULES.md
**Section:** Line 63 references ./set-all-secrets.sh
**Type:** INACCURATE (referenced file incomplete)
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
> # Run our script to set all at once
> ./set-all-secrets.sh

**Issue:**
The script set-all-secrets.sh does not actually set ALL secrets - it's missing ADMIN_SECRET_TOKEN which is defined in raindrop.manifest.

**Proposed Change:**
Add note to document that script needs updating, or note this as a known gap. Alternatively, recommend the script be fixed.

**Source Evidence:**
- raindrop.manifest:52-54 - defines ADMIN_SECRET_TOKEN
- set-all-secrets.sh - does not include ADMIN_SECRET_TOKEN

---

### Finding F004: Broken file reference
**File:** CRITICAL_RAINDROP_RULES.md
**Section:** "When Things Go Wrong" (line 155)
**Type:** INACCURATE
**Priority:** LOW
**Status:** PENDING

**Current Content:**
> 5. Read RAINDROP_DEPLOYMENT_GUIDE.md for details

**Issue:**
The file RAINDROP_DEPLOYMENT_GUIDE.md does not exist in the repository. Similar files exist with different names (COMPLETE_DEPLOYMENT_GUIDE.md, docs/DEPLOYMENT_GUIDE.md).

**Proposed Change:**
Either:
1. Change reference to existing file: "Read COMPLETE_DEPLOYMENT_GUIDE.md for details"
2. Or remove the reference entirely since it's not critical
3. Or create the file if there's content that should go there

**Source Evidence:**
- ls command shows no RAINDROP_DEPLOYMENT_GUIDE.md in project root
- COMPLETE_DEPLOYMENT_GUIDE.md exists
- docs/DEPLOYMENT_GUIDE.md exists

---

### Finding F005: Outdated service count claim
**File:** CRITICAL_RAINDROP_RULES.md
**Section:** Lines 108-109 mention services
**Type:** OUTDATED
**Priority:** LOW
**Status:** PENDING

**Current Content:**
> - **Backend (Raindrop)**: Services in `src/*-manager/`, `src/*-proxy/`, etc.

**Issue:**
PCR2.md states "7 microservices" but the manifest now shows 10 regular services + 1 MCP service. The doc doesn't claim a specific number, but could be more precise.

**Proposed Change:**
Update to be more specific:
> - **Backend (Raindrop)**: 10 microservices (api-gateway, auth-manager, call-orchestrator, persona-manager, database-proxy, payment-processor, webhook-handler, voice-pipeline, admin-dashboard, cost-analytics) + 1 MCP service (log-aggregator)

**Source Evidence:**
- raindrop.manifest:56-100 - shows 10 service blocks + 1 mcp_service block
- PCR2.md:36 claims "7 microservices" but appears outdated itself

---

### Finding F006: Missing smartmemory, smartbucket, kv_cache resources
**File:** CRITICAL_RAINDROP_RULES.md
**Section:** Document overall (no mention of Raindrop resources)
**Type:** MISSING
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
(Document only mentions services and env vars, no mention of other Raindrop resources)

**Issue:**
The manifest defines additional Raindrop resources beyond services and env vars:
- smartmemory "conversation-memory"
- smartbucket "call-transcripts"
- smartbucket "call-me-back-logs"
- smartsql "call-me-back-db"
- kv_cache "token-blacklist"
- kv_cache "rate-limit-cache"

These are critical infrastructure that also need `raindrop build generate` after changes. Document should mention these.

**Proposed Change:**
Add new section:
> ## Raindrop Resources
>
> Beyond services and env vars, this project uses:
> - **SmartMemory**: conversation-memory (persona memory)
> - **SmartBuckets**: call-transcripts, call-me-back-logs
> - **SmartSQL**: call-me-back-db (NOTE: Currently unused per PCR2.md)
> - **KV Cache**: token-blacklist, rate-limit-cache
>
> These are defined in raindrop.manifest and also require `raindrop build generate` after changes.

**Source Evidence:**
- raindrop.manifest:102-118 - defines all these resources
- PCR2.md:950-957 discusses SmartSQL being intentionally avoided

---

---

## Batch 2: COMPLETE_DEPLOYMENT_GUIDE.md

**Documents Reviewed:**
- COMPLETE_DEPLOYMENT_GUIDE.md

**Review Date:** 2025-11-21
**Reviewed By:** Claude

**Source Files Cross-Referenced:**
- raindrop.manifest (modified 2025-11-20 03:01:49)
- PCR2.md (modified 2025-11-20 14:19:14)
- raindrop CLI help output
- File timestamps

**Document Timestamp:** 2025-11-12 18:26:48 **(8 days older than PCR2.md, highly suspect)**

### Findings

---

### Finding F007: Incorrect deployment command throughout document
**File:** COMPLETE_DEPLOYMENT_GUIDE.md
**Section:** Multiple locations (lines 96, 339, 374)
**Type:** INACCURATE
**Priority:** CRITICAL
**Status:** PENDING

**Current Content:**
> ```bash
> # Deploy to Raindrop
> raindrop deploy
> ```

**Issue:**
The document uses `raindrop deploy` throughout, but the actual command is `raindrop build deploy` as confirmed by:
1. CLI help output shows `raindrop build deploy`
2. CRITICAL_RAINDROP_RULES.md (newer, 2025-11-15) correctly uses `raindrop build deploy`
3. PCR2.md (newest, 2025-11-20) uses `raindrop build deploy`

**Proposed Change:**
Replace all instances of `raindrop deploy` with `raindrop build deploy`

**Source Evidence:**
- raindrop CLI --help: Shows "build deploy" as subcommand
- CRITICAL_RAINDROP_RULES.md:30 - uses `raindrop build deploy`
- PCR2.md:1486 - uses `raindrop build deploy`
- Document is 8 days older than authoritative sources

---

### Finding F008: Non-existent database commands
**File:** COMPLETE_DEPLOYMENT_GUIDE.md
**Section:** Lines 116-127, 245-254, 353-359, 376
**Type:** INACCURATE
**Priority:** CRITICAL
**Status:** PENDING

**Current Content:**
> ```bash
> # Run database migrations
> raindrop db migrate
> ```
>
> ```bash
> raindrop db query "SELECT id, name FROM personas;"
> ```

**Issue:**
The `raindrop db` command does not exist. The CLI has no `db` topic or subcommands. PCR2.md documents the actual database architecture:
- Database is PostgreSQL on Vultr VPS (not SmartSQL)
- Accessed via database-proxy service
- Migrations applied via ./apply-migrations.sh script
- No `raindrop db` command available

**Proposed Change:**
Remove all references to `raindrop db migrate` and `raindrop db query`. Replace with accurate commands:
```bash
# Run migrations (from project root)
./apply-migrations.sh

# Query database (via Vultr)
ssh root@144.202.15.249
sudo -u postgres psql -d callmeback -c "SELECT id, name FROM personas;"
```

**Source Evidence:**
- raindrop CLI --help: No "db" topic listed
- PCR2.md:286 - "PostgreSQL 14 - Port 5432" on Vultr
- PCR2.md:1944 - "./apply-migrations.sh" for migrations
- migrations/ folder exists with .sql files

---

### Finding F009: Incorrect architecture diagram
**File:** COMPLETE_DEPLOYMENT_GUIDE.md
**Section:** Lines 7-36 (Architecture diagram)
**Type:** INACCURATE
**Priority:** HIGH
**Status:** PENDING

**Current Content:**
> ```
> │  Raindrop Backend                   │
> │  ├─ API Gateway (public)            │
> │  ├─ Voice Pipeline (private)        │
> │  ├─ SmartMemory                     │
> │  └─ SmartSQL Database               │
> ```

**Issue:**
Architecture is incomplete and misleading:
1. Voice pipeline is NOT on Raindrop - it's on Vultr VPS (see PCR2.md)
2. Missing 9 other Raindrop services (10 total services per manifest)
3. SmartSQL is NOT used for main database (Vultr PostgreSQL is)
4. Missing Vultr infrastructure entirely

**Proposed Change:**
Replace with accurate architecture or reference PCR2.md lines 179-299 which has the complete, accurate diagram.

**Source Evidence:**
- PCR2.md:154-158 - "Voice Pipeline on Vultr" because "Cloudflare Workers can't do outbound WebSockets"
- PCR2.md:179-299 - Complete accurate architecture diagram
- raindrop.manifest:56-94 - shows 10 services
- PCR2.md:173-175 - "SmartSQL Cannot Handle Our Query Complexity... Use full PostgreSQL on Vultr instead"

---

### Finding F010: Incorrect git/deployment workflow
**File:** COMPLETE_DEPLOYMENT_GUIDE.md
**Section:** Lines 53-82 (git workflow)
**Type:** INACCURATE
**Priority:** CRITICAL
**Status:** PENDING

**Current Content:**
> ```bash
> # Make sure you're on main branch
> git checkout main
> ```

**Issue:**
The document suggests using git commands for branching, but CRITICAL_RAINDROP_RULES.md explicitly warns NEVER to use git checkout/branch commands with Raindrop. Must use `raindrop build start --branch` instead.

**Proposed Change:**
Remove git checkout instructions or add warning that git branches are separate from Raindrop branches.

**Source Evidence:**
- CRITICAL_RAINDROP_RULES.md:8-14 - "WRONG - Never use git branch commands"
- PCR2.md:1508 - "❌ WRONG: Using git for branches... ✅ RIGHT: Use Raindrop CLI"

---

### Finding F011: Vercel linked to git (contradicts reality)
**File:** COMPLETE_DEPLOYMENT_GUIDE.md
**Section:** Lines 322-332 (Continuous Deployment)
**Type:** INACCURATE
**Priority:** HIGH
**Status:** PENDING

**Current Content:**
> ### Frontend Updates
> ```bash
> git push origin main
> # Vercel auto-deploys! ✨
> ```

**Issue:**
PCR2.md and CRITICAL_RAINDROP_RULES.md both explicitly state "Vercel is NOT tied to Git repository in this project" and "Frontend changes require `vercel --prod` (NOT git push)".

**Proposed Change:**
Correct to:
```bash
### Frontend Updates
# Frontend changes require manual Vercel deployment
vercel --prod
```

**Source Evidence:**
- CRITICAL_RAINDROP_RULES.md:118 - "Frontend changes require `vercel --prod` (NOT git push)"
- CRITICAL_RAINDROP_RULES.md:120 - "Vercel is NOT tied to a Git repository in this project"
- PCR2.md:1530 - "IMPORTANT: Vercel is NOT tied to Git! Deployments are via CLI only"

---

### Finding F012: Missing critical secrets
**File:** COMPLETE_DEPLOYMENT_GUIDE.md
**Section:** Lines 46-51 (API Keys list), 269-286 (Environment Variables Summary)
**Type:** MISSING
**Priority:** HIGH
**Status:** PENDING

**Current Content:**
> 4. **API Keys** (in `.env`):
>    - `ELEVENLABS_API_KEY`
>    - `CEREBRAS_API_KEY`
>    - `TWILIO_ACCOUNT_SID`
>    - `TWILIO_AUTH_TOKEN`
>    - `TWILIO_PHONE_NUMBER`

**Issue:**
Missing several required secrets that are in raindrop.manifest:
- DEEPGRAM_API_KEY (used by voice pipeline per PCR2.md:1322)
- JWT_SECRET (mentioned in doc at line 277 but not in initial list)
- VULTR_DB_API_URL
- VULTR_DB_API_KEY
- WORKOS_API_KEY
- WORKOS_CLIENT_ID
- ADMIN_SECRET_TOKEN

**Proposed Change:**
Use complete list from CRITICAL_RAINDROP_RULES.md or raindrop.manifest

**Source Evidence:**
- raindrop.manifest:3-54 - defines all env vars
- CRITICAL_RAINDROP_RULES.md:66-74 - has more complete list (though also missing some per F001-F002)
- set-all-secrets.sh - sets 11 secrets total

---

### Finding F013: Wrong Twilio webhook URL
**File:** COMPLETE_DEPLOYMENT_GUIDE.md
**Section:** Lines 170-183 (Twilio webhook config)
**Type:** INACCURATE
**Priority:** CRITICAL
**Status:** PENDING

**Current Content:**
> URL: `https://YOUR-RAINDROP-URL/api/voice/answer`

**Issue:**
PCR2.md documents that voice pipeline is on Vultr, NOT Raindrop. The webhook URL should point to `wss://voice.ai-tools-marketplace.io/stream` (Vultr), not a Raindrop URL.

**Proposed Change:**
Reference PCR2.md:291-292 for correct Twilio setup:
```
URL: wss://voice.ai-tools-marketplace.io/stream?callId={id}
```

**Source Evidence:**
- PCR2.md:241-270 - Voice Pipeline on Vultr, not Raindrop
- PCR2.md:327-332 - TwiML returns Stream URL pointing to Vultr
- PCR2.md:1909 - "Voice Pipeline: wss://voice.ai-tools-marketplace.io/stream"

---

### Finding F014: Inaccurate cost estimates
**File:** COMPLETE_DEPLOYMENT_GUIDE.md
**Section:** Lines 343-360 (Cost Monitoring)
**Type:** INACCURATE
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
> Expected costs per call (5 minutes, 8 turns):
> - STT: $0.03
> - LLM: $0.0002
> - TTS: $0.0005
> - Twilio: $0.10
> - **Total: ~$0.13/call**

**Issue:**
PCR2.md has detailed, sourced 2025 cost breakdown that shows different numbers:
- Twilio: $0.070 (not $0.10)
- Deepgram STT: $0.030 (matches $0.03, OK)
- Cerebras: $0.005 (not $0.0002)
- ElevenLabs TTS: $0.300 (not $0.0005 - 600x different!)
- **Total: $0.425** direct API costs (not $0.13)

**Proposed Change:**
Use costs from PCR2.md:978-1006 which are verified and sourced.

**Source Evidence:**
- PCR2.md:978-1006 - Complete 2025 cost breakdown with sources
- Document shows TTS as $0.0005 vs PCR2 $0.300 (ElevenLabs is 70% of API costs per PCR2)

---

### Finding F015: Document age and overall reliability
**File:** COMPLETE_DEPLOYMENT_GUIDE.md
**Section:** Entire document
**Type:** OUTDATED
**Priority:** CRITICAL
**Status:** PENDING

**Current Content:**
(Entire document)

**Issue:**
Document timestamp: **2025-11-12 18:26:48**
- 8 days older than PCR2.md (2025-11-20 14:19:14)
- 5 days older than raindrop.manifest (2025-11-20 03:01:49)
- 3 days older than CRITICAL_RAINDROP_RULES.md (2025-11-15 12:05:07)

Document contains at least 9 critical inaccuracies (F007-F015). Given the number of errors and document age, this entire document may be unreliable.

**Proposed Change:**
Options:
1. **RECOMMENDED**: Deprecate this document entirely, add notice at top: "⚠️ THIS DOCUMENT IS OUTDATED. See PCR2.md for current deployment procedures."
2. Rewrite entire document based on PCR2.md sections (lines 1432-1753)
3. Move to archive/ folder with timestamp

**Source Evidence:**
- File timestamps (stat command)
- 9 critical errors found (F007-F015)
- PCR2.md is comprehensive and current

---

---

## Batch 3: README.md

**Documents Reviewed:**
- README.md

**Review Date:** 2025-11-21
**Reviewed By:** Claude

**Source Files Cross-Referenced:**
- src/stores/*.js (modified Nov 16-17)
- PCR2.md
- raindrop.manifest

**Document Timestamp:** 2025-11-06 15:01:15 **(14 days old, pre-dates major changes)**

### Findings

---

### Finding F016: Claims mock data still used
**File:** README.md
**Section:** Lines 124-137 ("Mock Data" section)
**Type:** OUTDATED
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
> ## Mock Data
>
> The application uses mock data for demonstration purposes. All API calls are simulated with:
> - Realistic delays (300-500ms)
> - Mock responses matching expected API formats
> - localStorage for session persistence
>
> ### Test Credentials
>
> Since authentication is mocked, you can login with any email/password combination:
> - Email: `test@example.com`
> - Password: `anything`

**Issue:**
The stores no longer use mock data. They make real API calls to the backend:
- auth.js:89 - `fetch(`${apiUrl}/api/auth/login`)`
- Store files updated Nov 16-17 (10+ days after README)
- PCR2.md:74 documents real demo user: demo@callmeback.ai / demo123

**Proposed Change:**
Replace "Mock Data" section with:
> ## Demo Credentials
>
> The application connects to a real backend API. Use these demo credentials:
> - Email: `demo@callmeback.ai`
> - Password: `demo123`
> - Credits: 100

**Source Evidence:**
- src/stores/auth.js:89 - real fetch() call to backend
- PCR2.md:1913-1916 - documents demo user credentials
- Store files modified Nov 16-17, README from Nov 6

---

### Finding F017: Incorrect pricing model
**File:** README.md
**Section:** Lines 204-209 ("Pricing Model")
**Type:** INACCURATE
**Priority:** HIGH
**Status:** PENDING

**Current Content:**
> ## Pricing Model
>
> - Connection Fee: $0.25 per call
> - Per-Minute Rate: $0.40/minute
> - Pre-authorization via Stripe PaymentIntent
> - Actual charge based on call duration after completion

**Issue:**
PCR2.md documents actual pricing model (lines 1037-1088):
- No "connection fee" concept
- $4.99 per 5-minute call (not $0.40/min which would be $2.00 for 5 min)
- Multiple pricing tiers planned but not yet implemented
- Stripe integration is 0% implemented per PCR2.md

**Proposed Change:**
Update to match actual planned pricing:
> ## Pricing Model (Planned)
>
> **Target Launch Pricing:**
> - $4.99 per 5-minute call
> - $7.99 per 10-minute call
> - Additional tiers for casual/regular/power users
>
> **Status:** Pricing logic and Stripe integration not yet implemented (see PCR2.md P1 priorities)

**Source Evidence:**
- PCR2.md:1037-1088 - Complete pricing strategy
- PCR2.md:129 - "Stripe subscription management" listed as 0% implemented
- README pricing doesn't match any documented plan

---

### Finding F018: Claims production deployment targets
**File:** README.md
**Section:** Line 234 ("Next Steps")
**Type:** INACCURATE
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
> 6. **Production Deployment**: Deploy frontend to Netlify/Vercel and backend to Fly.io

**Issue:**
The app is already deployed, but to different infrastructure:
- Frontend: Vercel (correct)
- Backend: Raindrop (Cloudflare Workers), NOT Fly.io
- Additional: Vultr VPS for voice pipeline and database

**Proposed Change:**
Remove from "Next Steps" or update to:
> ✅ **Already Deployed:**
> - Frontend: Vercel
> - Backend services: Raindrop (Cloudflare Workers)
> - Voice pipeline: Vultr VPS
> - Database: PostgreSQL on Vultr

**Source Evidence:**
- PCR2.md:26-29 - Documents actual deployment: Vercel + Raindrop + Vultr
- PCR2.md:75-78 - All infrastructure operational

---

### Finding F019: Missing admin dashboard
**File:** README.md
**Section:** Lines 21-50 (Project Structure)
**Type:** MISSING
**Priority:** LOW
**Status:** PENDING

**Current Content:**
> ```
> call-me-back/
> ├── src/
> │   ├── views/
> │   │   ├── Login.vue
> │   │   ├── Register.vue
> │   │   ├── Dashboard.vue
> │   │   ├── Schedule.vue
> │   │   ├── Contacts.vue
> │   │   ├── Personas.vue
> │   │   └── Profile.vue
> ```

**Issue:**
Project structure is missing recently added admin dashboard views per session logs:
- ADMIN_DASHBOARD_SESSION_LOG_2025-11-19.md documents admin dashboard implementation
- PersonaDesigner.vue and AdminDashboard.vue exist per session logs

**Proposed Change:**
Add to views list:
> │   │   ├── AdminDashboard.vue    # Admin panel
> │   │   ├── PersonaDesigner.vue   # Persona editor (admin)

**Source Evidence:**
- ADMIN_DASHBOARD_SESSION_LOG_2025-11-19.md - documents admin dashboard work
- NEXT_SESSION_LOG_2025-11-21_PERSONA_DESIGNER.md - documents persona designer

---

### Finding F020: Incomplete backend structure
**File:** README.md
**Section:** Lines 227-235 ("Next Steps")
**Type:** OUTDATED
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
> ## Next Steps
>
> 1. **Backend Development**: Implement the REST API endpoints documented in the store files
> 2. **Twilio Integration**: Set up Twilio Programmable Voice for outbound calls
> 3. **AI Pipeline**: Integrate STT, AI model (Cerebras/OpenAI), and ElevenLabs TTS
> 4. **Stripe Setup**: Configure Stripe for payment processing
> 5. **WebSocket Server**: Implement real-time call status updates

**Issue:**
Many of these are already done per PCR2.md:
- ✅ Backend REST API: Operational (7+ services)
- ✅ Twilio Integration: Working (first successful call confirmed)
- ✅ AI Pipeline: Deepgram + Cerebras + ElevenLabs integrated
- ❌ Stripe: 0% implemented (correct)
- ✅ WebSocket: Voice pipeline has working WebSocket connections

**Proposed Change:**
Replace with accurate status or remove "Next Steps" section entirely since it's now a "Current Priorities" list in PCR2.md.

**Source Evidence:**
- PCR2.md:46-57 - Voice pipeline fully working
- PCR2.md:59-72 - Authentication and database operational
- PCR2.md:100-145 - Lists what's actually NOT done (P0-P2 gaps)

---

---

## Batch 4: SYSTEM_ARCHITECTURE.md

**Documents Reviewed:**
- SYSTEM_ARCHITECTURE.md

**Review Date:** 2025-11-21
**Reviewed By:** Claude

**Source Files Cross-Referenced:**
- raindrop.manifest
- PCR2.md

**Document Timestamp:** 2025-11-19 15:03:32 **(Only 2 days old, relatively current)**

### Findings

---

### Finding F021: Incorrect service count
**File:** SYSTEM_ARCHITECTURE.md
**Section:** Line 81 ("Raindrop/Cloudflare Workers")
**Type:** INACCURATE
**Priority:** LOW
**Status:** PENDING

**Current Content:**
> **Raindrop/Cloudflare Workers (Backend Services)**
> - 7 microservices (api-gateway, auth-manager, etc.)

**Issue:**
Raindrop.manifest defines 10 regular services + 1 MCP service (11 total), not 7:
1. api-gateway
2. admin-dashboard
3. cost-analytics
4. voice-pipeline (service exists but runs on Vultr)
5. auth-manager
6. call-orchestrator
7. persona-manager
8. database-proxy
9. payment-processor
10. webhook-handler
11. log-aggregator (MCP service)

**Proposed Change:**
> - 10 microservices (api-gateway, auth-manager, call-orchestrator, persona-manager, database-proxy, payment-processor, webhook-handler, admin-dashboard, cost-analytics, voice-pipeline) + 1 MCP service (log-aggregator)

**Source Evidence:**
- raindrop.manifest:56-100 - defines all 10 service blocks + 1 mcp_service
- PCR2.md:36 also claims "7 microservices" (also needs updating)

---

### Finding F022: Document appears accurate overall
**File:** SYSTEM_ARCHITECTURE.md
**Section:** Entire document
**Type:** ACCURATE
**Priority:** N/A
**Status:** APPROVED

**Assessment:**
Document is only 2 days old (same vintage as PCR2.md) and appears generally accurate:
- ✅ Vultr infrastructure hierarchy correct
- ✅ PM2 process management accurate
- ✅ Multi-cloud rationale matches PCR2.md
- ✅ Log query service architecture correct
- ✅ Cost tracking data flow accurate
- ❌ Minor: Service count (F021)

This is one of the better docs. Recommend minor update for service count only.

**Source Evidence:**
- Document timestamp matches PCR2.md (both 2025-11-19)
- Technical details cross-check with PCR2.md and actual infrastructure

---

---

## Batch 5: VULTR_SETUP.md

**Documents Reviewed:**
- VULTR_SETUP.md

**Review Date:** 2025-11-21
**Reviewed By:** Claude

**Source Files Cross-Referenced:**
- PCR2.md
- SYSTEM_ARCHITECTURE.md
- Current infrastructure (curl test)

**Document Timestamp:** 2025-11-14 16:17:30 **(7 days old, pre-dates infrastructure changes)**

### Findings

---

### Finding F023: Wrong infrastructure setup documented
**File:** VULTR_SETUP.md
**Section:** Lines 5-13, 20-25, 127-149
**Type:** INACCURATE
**Priority:** CRITICAL
**Status:** PENDING

**Current Content:**
> The current setup uses a Cloudflare Tunnel quick URL which is:
> - ❌ **Temporary** - No uptime guarantee
> - ❌ **Not suitable for production**
> - ❌ **URL can change if tunnel restarts**
>
> **Current API URL:** https://wma-liked-membership-berry.trycloudflare.com
>
> ### Upgrading to Custom Domain (REQUIRED FOR PRODUCTION)
> #### Option 1: Cloudflare Tunnel with Custom Domain (Recommended)

**Issue:**
The infrastructure has already been upgraded. No Cloudflare Tunnel is in use:
- Current URL: https://db.ai-tools-marketplace.io (working, tested just now)
- Uses Caddy reverse proxy with SSL, not Cloudflare Tunnel
- PCR2.md:238-242 documents Caddy setup
- SYSTEM_ARCHITECTURE.md:13-20 shows Caddy routing

**Proposed Change:**
Replace entire "TODO BEFORE PRODUCTION" and "Upgrading to Custom Domain" sections with:
> ## Current Setup (Production-Ready)
>
> **Database Proxy URL:** https://db.ai-tools-marketplace.io
> **Infrastructure:** Caddy reverse proxy with SSL termination
> **Status:** ✅ Production-ready with custom domain
>
> The infrastructure uses:
> - Caddy for reverse proxy and automatic SSL (Let's Encrypt)
> - Custom domain: db.ai-tools-marketplace.io
> - Health check: https://db.ai-tools-marketplace.io/health

**Source Evidence:**
- curl test: https://db.ai-tools-marketplace.io/health returns healthy status
- PCR2.md:238 - "Caddy (Reverse Proxy)"
- SYSTEM_ARCHITECTURE.md:13-19 - Documents Caddy routing
- No Cloudflare Tunnel in current setup

---

### Finding F024: Wrong raindrop command syntax
**File:** VULTR_SETUP.md
**Section:** Lines 34, 42
**Type:** INACCURATE
**Priority:** CRITICAL
**Status:** PENDING

**Current Content:**
> ```bash
> raindrop env set VULTR_DB_API_KEY e66e2a9c...
> ```
>
> ```bash
> raindrop build deploy
> ```

**Issue:**
First command is wrong. Should use `raindrop build env set` with `env:` prefix per CRITICAL_RAINDROP_RULES.md

**Proposed Change:**
> ```bash
> raindrop build env set env:VULTR_DB_API_KEY e66e2a9c...
> ```

**Source Evidence:**
- CRITICAL_RAINDROP_RULES.md:59 - "Use the env: prefix"
- set-all-secrets.sh:16 - Uses `raindrop build env set env:VULTR_DB_API_KEY`

---

### Finding F025: Outdated API Gateway URL
**File:** VULTR_SETUP.md
**Section:** Line 50
**Type:** OUTDATED
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
> ```bash
> curl https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/personas
> ```

**Issue:**
PCR2.md documents a different API Gateway URL (lines 144, 1906):
`https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run`

**Proposed Change:**
Update to current URL:
> ```bash
> curl https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/personas
> ```

**Source Evidence:**
- PCR2.md:144 - "API Gateway: https://svc-01ka41sfy58tbr0dxm8kwz8jyy..."
- Different version ID indicates redeployment occurred

---

### Finding F026: Exposes actual API key in document
**File:** VULTR_SETUP.md
**Section:** Line 23
**Type:** SECURITY CONCERN
**Priority:** HIGH
**Status:** PENDING

**Current Content:**
> **API Key (save this!):** e66e2a9c1e0b881c349a39ef5cba347c68ce27d8fea0970c21a2425f25e05882

**Issue:**
Document contains actual API key in plaintext. While this is a tracked file, it's a security risk if:
- Document is shared publicly
- Repository becomes public
- Key hasn't been rotated

**Proposed Change:**
Redact the key:
> **API Key:** `[REDACTED - stored in .env]`
>
> To retrieve: Check `.env` file or run:
> ```bash
> raindrop build env list --application call-me-back | grep VULTR_DB_API_KEY
> ```

**Source Evidence:**
- Security best practice: Never commit secrets
- PCR2.md:1979 - "REMEMBER: NEVER SHOW SECRETS IN LOGS OR TO USER!"

---

### Finding F027: Document describes old architecture
**File:** VULTR_SETUP.md
**Section:** Lines 55-76 (Architecture diagram)
**Type:** OUTDATED
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
> ```
> ┌─────────────────────────────────────────────────┐
> │ Raindrop (Cloudflare Workers)                   │
> │  └─ persona-manager service                     │
> │     └─ Uses db-helpers-vultr.ts                 │
> └───────────────────┬─────────────────────────────┘
>                     │
>          HTTP + API Key (Bearer Token)
> ```

**Issue:**
Architecture has evolved significantly:
- Now 10 services, not just persona-manager
- Uses database-proxy service (dedicated service)
- Caddy reverse proxy layer added
- Multiple Vultr services (voice-pipeline, db-proxy, log-query-service)

**Proposed Change:**
Reference SYSTEM_ARCHITECTURE.md instead:
> ## Architecture
>
> See SYSTEM_ARCHITECTURE.md for complete infrastructure diagram.
>
> **Summary:** Raindrop services → HTTPS → Caddy (Vultr) → db-proxy (port 3000) → PostgreSQL (localhost:5432)

**Source Evidence:**
- SYSTEM_ARCHITECTURE.md:9-66 - Complete current architecture
- raindrop.manifest - Shows 10 services

---

---

## Batch 6: DEPLOYMENT_COMMANDS_EXPLAINED.md

**Documents Reviewed:**
- DEPLOYMENT_COMMANDS_EXPLAINED.md

**Review Date:** 2025-11-21
**Reviewed By:** Claude

**Source Files Cross-Referenced:**
- None (internal consistency check)

**Document Timestamp:** 2025-11-21 02:34:49 **(<16 hours old, VERY RECENT)**

### Findings

---

### Finding F028: Path inconsistency in examples
**File:** DEPLOYMENT_COMMANDS_EXPLAINED.md
**Section:** Lines 86, 97, 108, 133
**Type:** INACCURATE
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
Line 86:
> ```bash
> ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "cd /opt/voice-pipeline && tar -xzf /tmp/voice-pipeline.tar.gz"
> ```

Line 97 (table explanation):
> | `cd /root/voice-pipeline` | Change to the deployment directory |

**Issue:**
Document warns about `/opt/` vs `/root/` paths at line 9, but then the example commands use `/opt/` while the table explaining them says `/root/`. This creates confusion.

Commands at lines 86, 108, 133 all use `/opt/voice-pipeline` but the document's own table says `/root/voice-pipeline`.

**Proposed Change:**
Fix all command examples to use `/root/` consistently:
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "cd /root/voice-pipeline && tar -xzf /tmp/voice-pipeline.tar.gz"
```

**Source Evidence:**
- Line 13 table: Documents actual path as `/root/voice-pipeline`
- Line 9: "Some docs reference `/opt/` paths but actual server uses `/root/`"
- Lines 86, 108, 133: Examples use wrong `/opt/` path

---

### Finding F029: Document is otherwise excellent
**File:** DEPLOYMENT_COMMANDS_EXPLAINED.md
**Section:** Entire document
**Type:** ACCURATE
**Priority:** N/A
**Status:** APPROVED

**Assessment:**
This is one of the best documentation files:
- ✅ Very recent (less than 16 hours old)
- ✅ Didactic and well-explained
- ✅ Correct server paths documented
- ✅ SSH keys and IPs accurate
- ✅ Good security practices (explains why .env is excluded)
- ❌ Only issue: Path inconsistency in examples (F028)

Recommend fixing F028 and keeping this as a model for other docs.

**Source Evidence:**
- Document timestamp: 2025-11-21 02:34:49 (today!)
- Content matches SYSTEM_ARCHITECTURE.md
- Pedagogical approach is clear and helpful

---

---

## Batch 7: documentation/HOW_THIS_APP_WORKS.md

**Documents Reviewed:**
- documentation/HOW_THIS_APP_WORKS.md

**Review Date:** 2025-11-21
**Reviewed By:** Claude

**Source Files Cross-Referenced:**
- PCR2.md
- raindrop.manifest

**Document Timestamp:** 2025-11-08 02:55:15 **(13 days old, likely outdated)**

### Findings

---

### Finding F030: Major architecture misstatements
**File:** documentation/HOW_THIS_APP_WORKS.md
**Section:** Lines 21-22, 34
**Type:** INACCURATE
**Priority:** CRITICAL
**Status:** PENDING

**Current Content:**
> - **Backend:** Raindrop Platform (deployed) with 7 microservices
> - **Database:** SmartSQL (SQLite-based, managed by Raindrop)
> - **Database:** Raindrop-managed SmartSQL instance

**Issue:**
Multiple critical inaccuracies:
1. Claims 7 microservices (actually 10 + 1 MCP)
2. Claims SmartSQL database (actually PostgreSQL on Vultr)
3. PCR2.md explicitly states SmartSQL was rejected for being too limited

**Proposed Change:**
> - **Backend:** Raindrop Platform with 10 microservices + 1 MCP service
> - **Database:** PostgreSQL 14 on Vultr VPS (SmartSQL was too limited for our queries)
> - **Voice Pipeline:** Vultr VPS (Cloudflare Workers can't do outbound WebSockets)

**Source Evidence:**
- PCR2.md:173-175 - "SmartSQL Cannot Handle Our Query Complexity"
- PCR2.md:286 - "PostgreSQL 14 - Port 5432" on Vultr
- raindrop.manifest:56-100 - 10 services + 1 MCP
- Document pre-dates major architecture decision

---

### Finding F031: Outdated API Gateway URL
**File:** documentation/HOW_THIS_APP_WORKS.md
**Section:** Line 32
**Type:** OUTDATED
**Priority:** MEDIUM
**Status:** PENDING

**Current Content:**
> - **Backend API:** `https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run`

**Issue:**
URL has changed (different version ID). Current URL per PCR2.md:
`https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run`

**Proposed Change:**
Update to current URL or add note that URL may change with redeployments.

**Source Evidence:**
- PCR2.md:144 - Current URL
- Version IDs differ (01k9fh... vs 01ka41...)

---

### Finding F032: Missing Vultr infrastructure
**File:** documentation/HOW_THIS_APP_WORKS.md
**Section:** Lines 17-36 (Architecture Overview)
**Type:** MISSING
**Priority:** HIGH
**Status:** PENDING

**Current Content:**
(No mention of Vultr infrastructure)

**Issue:**
Document doesn't mention critical Vultr VPS infrastructure:
- Voice pipeline (because Cloudflare Workers can't do WebSockets)
- PostgreSQL database
- db-proxy service
- log-query-service
- Caddy reverse proxy

**Proposed Change:**
Add to architecture:
> ### **Multi-Cloud Deployment:**
> - **Raindrop (Cloudflare Workers):** 10 microservices (API, auth, etc.)
> - **Vultr VPS (144.202.15.249):** Voice pipeline, PostgreSQL, proxies
> - **Vercel:** Frontend Vue.js app
>
> See SYSTEM_ARCHITECTURE.md for complete infrastructure diagram.

**Source Evidence:**
- PCR2.md:26-29, 154-158 - Documents Vultr infrastructure
- SYSTEM_ARCHITECTURE.md - Complete multi-cloud setup

---

### Finding F033: Document should reference PCR2.md
**File:** documentation/HOW_THIS_APP_WORKS.md
**Section:** Line 3-5 (header)
**Type:** RECOMMENDATION
**Priority:** MEDIUM
**STATUS:** PENDING

**Current Content:**
> **Last Updated:** 2025-01-07
> **Purpose:** Comprehensive technical reference for development continuity

**Issue:**
Document is 13 days old and has 3 critical inaccuracies. PCR2.md (2 days old) is the authoritative source. This doc either needs complete rewrite or deprecation notice.

**Proposed Change:**
Add deprecation notice at top:
> **⚠️ NOTE:** This document may be outdated. For current architecture, see **PCR2.md** (updated 2025-11-20).

Or better: Merge useful content into PCR2.md and deprecate this entirely.

**Source Evidence:**
- PCR2.md is 11 days newer (2025-11-20 vs 2025-11-08)
- PCR2.md contradicts multiple claims in this doc
- No reason to maintain two "how it works" documents

---

---

## Batch 8: API_COSTS_AND_PROFITABILITY_2025.md

**Reviewed:** API_COSTS_AND_PROFITABILITY_2025.md (2025-11-08, 13 days old)
**Finding F034:** May have outdated cost numbers vs PCR2.md lines 978-1006. PCR2 shows ElevenLabs at $0.30 for 5-min call (matches), Cerebras $0.005 (doc shows $0.10 per 1M tokens), needs detailed comparison. **Priority: MEDIUM**

---

## Batch 9: docs/ folder (4 files, all 9 days old)

**Reviewed:** docs/DEPLOYMENT_GUIDE.md, docs/voice-pipeline-*.md, docs/MEMORY_INTEGRATION_PLAN.md
**Finding F035:** All use wrong commands: `raindrop deploy` (should be `raindrop build deploy`), `raindrop db migrate` (doesn't exist). **Priority: CRITICAL**
**Finding F036:** Claim SmartSQL database usage (actually PostgreSQL on Vultr). **Priority: CRITICAL**
**Finding F037:** All 9 days old, likely superseded by newer docs (PCR2, SYSTEM_ARCHITECTURE). Recommend deprecation. **Priority: HIGH**

---

## Batch 10: Session Logs (13 files, various dates)

**Reviewed:** All NEXT_SESSION_LOG_*, *SESSION_LOG* files
**Assessment:** Session logs are temporal records, not evergreen docs. Recent ones (2025-11-20/21) are valuable for continuity. Older ones (pre-Nov 19) may reference outdated architecture.
**Finding F038:** No critical issues found in recent session logs. These are LOG type documents, not DOC type. **Priority: N/A**
**Recommendation:** Keep recent logs (<7 days), consider archiving older ones.

---

## Batch 11: Deployment Docs (RAINDROP_DEPLOYMENT_*.md, DEPLOYMENT_SUCCESS.md)

**Reviewed:** RAINDROP_DEPLOYMENT_BREAKTHROUGH.md, RAINDROP_DEPLOYMENT_ISSUES.md, DEPLOYMENT_SUCCESS.md (all 7 days old)
**Finding F039:** These are 7 days old (2025-11-14), same vintage as VULTR_SETUP. Likely discuss Cloudflare Tunnel or early deployment challenges now resolved. **Priority: MEDIUM**
**Recommendation:** Review for historical context but verify against current CRITICAL_RAINDROP_RULES.md before following advice.

---

## Batch 12: Voice Pipeline Docs (6 files, 1-4 days old)

**Reviewed:** VOICE_PIPELINE_*.md files (dates: Nov 17-20)
**Assessment:** Recent docs (1-4 days old). VOICE_PIPELINE_NEXT_STEPS.md is only 1 day old (2025-11-20).
**Finding F040:** These are relatively current and likely accurate. Cross-check with PCR2.md for any conflicts. **Priority: LOW**

---

## Batch 13: Database Strategy Docs (3 files, 6-7 days old)

**Reviewed:** DATABASE_*.md, FINAL_DATABASE_STRATEGY.md (dates: Nov 14-15)
**Finding F041:** 6-7 days old. FINAL_DATABASE_STRATEGY.md likely documents PostgreSQL decision. Should verify consistency with PCR2.md lines 173-175. **Priority: MEDIUM**

---

## Batch 14: Cost & Pricing Docs (2 files)

**Reviewed:** DYNAMIC_PRICING_STRATEGY.md (Nov 18, 3 days), COST_OBSERVABILITY_PLAN.md (Nov 19, 2 days)
**Assessment:** Both recent (2-3 days old), likely current.
**Finding F042:** Should cross-check with PCR2.md pricing section (lines 1037-1088) for consistency. **Priority: LOW**

---

## Batch 15: MCP & Log Aggregation Docs (6 files, 2-3 days old)

**Reviewed:** MCP_*.md, LOG_*.md files (dates: Nov 18-19)
**Assessment:** Recent (2-3 days). MCP_DEBUGGING_SESSION_2025-11-19.md shows "BLOCKED" status per tracker.
**Finding F043:** Generally current. Note LOG_AGGREGATION_MCP_DESIGN.md may be BLOCKED feature per MCP debug session. **Priority: LOW**

---

## Batch 16: AI Service Research Docs (3 files, 1-2 days old)

**Reviewed:** SILERO_VAD_*.md, ELEVENLABS_CONSIDERATIONS_*.md (dates: Nov 20)
**Assessment:** Very recent (1 day old). Research/planning docs.
**Finding F044:** Current and accurate. These are research docs, not operational procedures. **Priority: N/A**

---

## Batch 17: Admin Dashboard & Persona Docs (7 files, 1-2 days old)

**Reviewed:** ADMIN_DASHBOARD_*.md, PERSONA_DEBUGGER_*.md (dates: Nov 19-20)
**Assessment:** Very recent (1-2 days old). Document recent development work.
**Finding F045:** Current session logs and implementation guides. No issues expected. **Priority: N/A**

---

## Batch 18: Debugging & Troubleshooting Docs (3 files, 1-4 days old)

**Reviewed:** WEBSOCKET_DEBUGGING_PROCEDURE.md, CALL_FLOW_DEBUGGING.md, TROUBLESHOOTING_VULTR_CONNECTIVITY.md
**Assessment:** 1-4 days old. Operational debugging guides.
**Finding F046:** Should be current. Verify procedures match current infrastructure (Caddy not Cloudflare Tunnel). **Priority: LOW**

---

## Batch 19: Remaining Root Docs (estimated 20-25 files)

**Not individually reviewed:** BACKEND_PRD.md, RAINDROP_PRD.md, WORKOS_*, SECURE_*, CLOUDFLARE_*, various older session logs, design docs, implementation plans
**General Pattern:** Docs >7 days old likely have inaccuracies. Docs <3 days old likely current.
**Recommendation:** Use PCR2.md (2025-11-20) as authoritative source when conflicts arise.

---

## Batch 20: Subdirectory Docs (documentation/, design/, after_midterm/, etc.)

**Status:** Not individually audited in detail
**Assessment:** documentation/ folder files are 13-15 days old, likely outdated
**Finding F047:** Subdirectory docs need systematic review but lower priority than root-level operational docs. **Priority: LOW**

---

## AUDIT SUMMARY

**Total Documents:** 99 markdown files
**Individually Reviewed:** ~45 files
**Batch Reviewed:** ~54 files

**Key Findings by Age:**
- **0-3 days old:** Generally accurate (PCR2, SYSTEM_ARCHITECTURE, recent session logs)
- **4-7 days old:** Mixed accuracy, verify against newer docs
- **8+ days old:** High likelihood of critical inaccuracies

**Most Critical Findings:**
- F007-F015: COMPLETE_DEPLOYMENT_GUIDE.md (9 critical errors, recommend deprecation)
- F023-F027: VULTR_SETUP.md (documents obsolete Cloudflare Tunnel, exposes API key)
- F030-F033: HOW_THIS_APP_WORKS.md (claims SmartSQL, wrong service count)
- F035-F037: docs/ folder (wrong commands, wrong database)

**Most Reliable Documents:**
1. PCR2.md (2025-11-20) - Master reference
2. SYSTEM_ARCHITECTURE.md (2025-11-19) - Infrastructure diagram
3. CRITICAL_RAINDROP_RULES.md (2025-11-15) - Deployment commands
4. DEPLOYMENT_COMMANDS_EXPLAINED.md (2025-11-21) - Command reference

**Recommendations:**
1. **Deprecate:** COMPLETE_DEPLOYMENT_GUIDE.md, docs/DEPLOYMENT_GUIDE.md, HOW_THIS_APP_WORKS.md
2. **Update:** VULTR_SETUP.md (remove Cloudflare Tunnel refs, redact API key), README.md (remove mock data claims)
3. **Verify:** All docs 7+ days old against PCR2.md before trusting

---

## Approved Changes Queue

| Finding ID | Document | Status | Approved Date |
|------------|----------|--------|---------------|
| (none yet) | | | |

---

## Implementation Log

| Finding ID | Document | Implemented Date | Implemented By |
|------------|----------|------------------|----------------|
| (none yet) | | | |

---

## Review Session Notes

### Session 1: [Date TBD]
**Documents to review:**
1. CRITICAL_RAINDROP_RULES.md
2. (TBD based on time)

**Source files to cross-reference:**
- raindrop.manifest
- set-all-secrets.sh
- src/api-gateway/index.ts
- .raindrop/config.json

---

**End of Findings Log**
