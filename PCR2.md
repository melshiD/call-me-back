# Call Me Back - Project Context Review 2.0
**Version:** 2.0
**Last Updated:** 2025-11-19
**Project:** AI Championship Hackathon (Devpost)
**Architecture:** Multi-cloud hybrid (Vercel + Raindrop/Cloudflare Workers + Vultr VPS)

---

## CRITICAL: Read These First
1. **CRITICAL_RAINDROP_RULES.md** - Deployment commands and common mistakes
2. **This document (PCR2.md)** - Complete consolidated project context
<!-- 3. **MCP_DEBUGGING_SESSION_2025-11-19.md** - Latest debugging session (MCP blocked) -->
4. **Additional docs indexed at bottom** - For specific deep-dives

**SECURITY NOTE:** NEVER expose environment variables or secrets in logs, console output, or tracked files.

---

## Executive Summary

**Call Me Back** is a real-time AI voice companion application that enables users to receive phone calls from customizable AI personas. The system integrates multiple AI services (Cerebras for inference, Deepgram for STT, ElevenLabs for TTS) with Twilio voice infrastructure, running across three distinct cloud platforms due to technical constraints.

### Technical Architecture Overview

**Multi-Cloud Deployment Model:**
- **Vercel:** Vue.js frontend SPA with Tailwind CSS v4 (chosen for simplicity, considering Netlify migration for hackathon partner benefits)
- **Raindrop (Cloudflare Workers):** 7 microservices (API Gateway, Auth Manager, Database Proxy, Persona Manager, Call Orchestrator, Payment Processor, Webhook Handler)
- **Vultr VPS (144.202.15.249):** Voice Pipeline (Node.js/PM2), PostgreSQL database, Database Proxy HTTP API

**Why Multi-Cloud:**
1. Cloudflare Workers CANNOT make outbound WebSocket connections → Voice pipeline moved to Vultr
2. Cloudflare Workers CANNOT fetch external URLs directly → Database proxy pattern required
3. Raindrop SmartSQL has critical SQL limitations → Full PostgreSQL on Vultr required

**Current Complexity:**
- 9 services total (7 on Raindrop, 2 on Vultr)
- 3 deployment targets with independent lifecycles
- 4 external AI/telephony APIs (Twilio, Deepgram, Cerebras, ElevenLabs)
- 12 database tables across PostgreSQL
- WebSocket connections from 3 sources (Twilio, Deepgram, ElevenLabs)

---

## Current State (2025-11-19)

### ✅ Working & Verified

**Voice Pipeline (CRITICAL SUCCESS - 2025-11-17):**
- ✅ First successful talk-response volley confirmed
- ✅ Twilio → Deepgram → Cerebras → ElevenLabs → Twilio flow working
- ✅ WebSocket connections stable (wss://voice.ai-tools-marketplace.io/stream)
- ✅ Sub-1-second inference with Cerebras Llama 3.1 8B
- ✅ Real-time TTS streaming from ElevenLabs
- ✅ Deepgram streaming STT with interim results
- ⚠️ Only 1 complete volley tested (multi-turn needs validation)
- ❌ Turn-taking logic NOT implemented (users can interrupt but no VAD)
- ❌ Conversation state management minimal

**Authentication & User Management:**
- ✅ JWT-based auth working (registration, login, logout, token validation)
- ✅ bcrypt password hashing
- ✅ Token blacklist for logout
- ✅ Demo user operational: demo@callmeback.ai / demo123 (100 credits)
- ⚠️ Special characters in passwords cause JSON parsing errors (use alphanumeric only)

**Database & Persistence:**
- ✅ Vultr PostgreSQL fully operational (144.202.15.249:5432)
- ✅ Database-proxy HTTP API working (https://db.ai-tools-marketplace.io)
- ✅ All 6 migrations applied successfully
- ✅ System personas loaded (Brad, Sarah, Alex) with voice IDs
- ✅ User-persona relationships tracking favorites and call history

**Deployment Infrastructure:**
- ✅ Frontend deployed to Vercel (https://call-me-back-nugbql1rx-david-melsheimers-projects.vercel.app)
- ✅ Tailwind CSS v4 installed and configured for UI redesign (2025-11-19)
- ✅ Backend services deployed to Raindrop main branch (@01ka41s1...)
- ✅ Voice pipeline running on Vultr via PM2 with Caddy SSL termination
- ✅ API Gateway accessible (https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run)

### ⚠️ Partially Working / Needs Testing

**Voice Conversation Quality:**
- Multi-turn conversations not thoroughly tested
- Turn detection may have timing issues (see VOICE_PIPELINE_DEBUG_FINDINGS.md)
- Interrupt handling not implemented (users can talk over AI but no VAD cutoff)
- Conversation memory between calls doesn't persist (no SmartMemory integration)

**Call Orchestration:**
- Immediate calls work via `/api/calls/trigger`
- Scheduled calls stored in database but NEVER executed (no cron job)
- Call duration tracking exists but no timers enforced
- Call cost events table exists but NOT populated

**Twilio Integration:**
- ✅ API integration fully functional
- ⚠️ Trial account limitation: Can only call verified phone numbers
- ⚠️ Need to verify numbers at console.twilio.com or upgrade to paid account

### ❌ Critical Gaps (Blocking Production/Hackathon)

**P0 - Must Fix Before Demo:**
1. **Cost Tracking System** (0% implemented)
   - `call_cost_events` table exists but never written to
   - No per-call cost calculation
   - No real-time cost accumulation during calls
   - No user spending limits enforced
   - No profitability visibility
   - **Impact:** Cannot price product, cannot track burn rate, no budget controls

2. **Scheduled Calls Execution** (0% implemented)
   - Scheduled calls stored but never executed
   - No Task (cron) definition in raindrop.manifest
   - No `executeScheduledCalls` function implemented
   - **Impact:** Advertised feature doesn't work at all

3. **WorkOS Authentication** (0% implemented)
   - Hackathon partner integration requirement
   - Currently using custom JWT (works but not impressive)
   - No SSO, no MFA, no enterprise features
   - **Impact:** Missing hackathon judging criteria, no enterprise readiness

**P1 - Required for Competitive Submission:**
4. **Pricing & Payment Logic** (0% implemented)
   - No call duration selection in frontend
   - No pricing calculation in payment-processor
   - No Twilio call timers (5-min default not enforced)
   - No mid-call extension prompts
   - No Stripe subscription management
   - **Impact:** Cannot launch, no monetization

5. **SmartMemory Integration** (0% implemented)
   - Have `smart_memory` TEXT column but not using Raindrop SmartMemory API
   - Personas don't remember past conversations
   - No semantic search across interactions
   - **Impact:** Personas feel stateless, not intelligent

**P2 - Post-Hackathon Blockers:**
6. **MCP Log Aggregation Service** (BLOCKED - Framework Issue)
   - Custom MCP service deploys successfully
   - MCP protocol handshake fails with "Internal Server Error"
   - Extensive debugging completed (7+ code variations, all fail)
   - Likely framework bug or undocumented requirement
   - **Status:** Deferred pending framework support
   - **See:** MCP_DEBUGGING_SESSION_2025-11-19.md for complete debugging log

---

## Detailed Architecture: Why Everything Is Where It Is

### The Multi-Cloud Necessity

**This is NOT a design preference - it's driven by hard technical constraints:**

#### Constraint 1: Cloudflare Workers Cannot Make Outbound WebSocket Connections
**Problem:** Voice pipeline requires outbound WebSocket connections to Deepgram and ElevenLabs.
**Evidence:** 8 debugging sessions (CALL_FLOW_DEBUGGING.md) proved `fetch()` with `Upgrade: websocket` hangs indefinitely in Cloudflare Workers.
**Solution:** Migrated voice pipeline ONLY to Node.js on Vultr VPS (Sessions 9-10).
**Code Location:** `voice-pipeline-nodejs/index.js` (deployed via PM2 on Vultr)

#### Constraint 2: Cloudflare Workers Cannot Fetch External URLs Directly
**Problem:** Cannot make direct HTTP requests to external databases or APIs from Workers.
**Solution:** Database-proxy pattern - service running on Vultr that Workers call via internal fetch.
**Implementation:**
- Raindrop service: `src/database-proxy/index.ts` (calls Vultr API)
- Vultr HTTP server: `vultr-db-proxy/server.js` (Node.js Express on port 3000)
- All services call `DATABASE_PROXY.executeQuery()` instead of direct SQL

#### Constraint 3: SmartSQL Cannot Handle Our Query Complexity
**Problem:** SmartSQL (Raindrop's built-in SQLite-based database) has severe limitations:
- Missing SQL functions (e.g., `NOW()`, date functions)
- Poor JOIN performance
- Limited data type support
- "Invalid input or query execution error" on complex queries
**Decision:** Use full PostgreSQL on Vultr instead.
**Trade-off:** Lost automatic PII detection, gained SQL compatibility.

### Infrastructure Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL (Frontend)                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Vue 3 SPA (Vite build)                                       │   │
│  │ - Composition API, Pinia state, Vue Router                   │   │
│  │ - VITE_API_URL points to API Gateway                         │   │
│  │ - Token stored in localStorage (key: 'token')                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  Deploy: vercel --prod (NOT tied to git!)                           │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTPS (API calls with JWT in Authorization header)
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│            CLOUDFLARE WORKERS (Raindrop Services)                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ api-gateway (Hono router - PUBLIC)                           │   │
│  │   Routes: /api/auth/*, /api/personas, /api/calls/*, /api/voice/* │
│  │   CORS: corsAllowAll (required for frontend)                 │   │
│  │   Validates JWT, routes to internal services                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ auth-manager                                                  │   │
│  │   bcrypt password hashing, JWT generation/validation         │   │
│  │   Uses DATABASE_PROXY for user CRUD                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ database-proxy (CRITICAL BRIDGE)                             │   │
│  │   Translates executeQuery() calls to Vultr HTTP API          │   │
│  │   Config: apiUrl = 'https://db.ai-tools-marketplace.io'      │   │
│  │   All services MUST use this (cannot call external URLs)     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ persona-manager                                               │   │
│  │   CRUD for personas, favorites, user relationships           │   │
│  │   Loads Brad/Sarah/Alex from PostgreSQL                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ call-orchestrator                                             │   │
│  │   Twilio call lifecycle, scheduled calls (needs cron!)       │   │
│  │   Triggers voice pipeline via HTTP POST to Vultr             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ payment-processor                                             │   │
│  │   Stripe integration (not fully implemented)                 │   │
│  │   Pricing logic NOT implemented yet                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ webhook-handler                                               │   │
│  │   Processes Twilio/Stripe webhooks with signature validation │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  Deploy: raindrop build deploy                                       │
│  Logs: raindrop logs tail -n 100 --application call-me-back         │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTPS to Vultr
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              VULTR VPS (144.202.15.249)                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Caddy (Reverse Proxy)                                        │   │
│  │   https://voice.ai-tools-marketplace.io → :8080 (voice)      │   │
│  │   https://db.ai-tools-marketplace.io → :3000 (db-proxy)      │   │
│  │   SSL/TLS certificates, WebSocket upgrade support            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Voice Pipeline (Node.js + PM2) - Port 8080                   │   │
│  │   WHY HERE: Cloudflare Workers can't do outbound WebSockets  │   │
│  │   ┌─────────────────────────────────────────────────────┐   │   │
│  │   │ Twilio WebSocket Server (ws library)                │   │   │
│  │   │   Receives: media stream (mulaw audio, 8kHz)        │   │   │
│  │   │   Sends: audio responses back to caller             │   │   │
│  │   └─────────────────────────────────────────────────────┘   │   │
│  │   ┌─────────────────────────────────────────────────────┐   │   │
│  │   │ Deepgram STT Client (outbound WebSocket)            │   │   │
│  │   │   Streams: audio chunks → receives transcripts       │   │   │
│  │   │   Model: nova-2, language: en-US                     │   │   │
│  │   └─────────────────────────────────────────────────────┘   │   │
│  │   ┌─────────────────────────────────────────────────────┐   │   │
│  │   │ Cerebras AI Client (HTTP API)                       │   │   │
│  │   │   Model: llama3.1-8b                                 │   │   │
│  │   │   Inference: <1s per response                        │   │   │
│  │   │   Cost: $0.10/1M tokens (40x cheaper than GPT-4)    │   │   │
│  │   └─────────────────────────────────────────────────────┘   │   │
│  │   ┌─────────────────────────────────────────────────────┐   │   │
│  │   │ ElevenLabs TTS Client (outbound WebSocket)          │   │   │
│  │   │   Streams: text → receives audio chunks (PCM)        │   │   │
│  │   │   Model: eleven_turbo_v2.5                           │   │   │
│  │   │   Voices: Brad, Sarah, Alex (configurable)           │   │   │
│  │   └─────────────────────────────────────────────────────┘   │   │
│  │   File: voice-pipeline-nodejs/index.js                       │   │
│  │   Deploy: cd voice-pipeline-nodejs && ./deploy.sh           │   │
│  │   Logs: pm2 logs voice-pipeline (on Vultr server)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Database Proxy HTTP API (Express) - Port 3000               │   │
│  │   WHY HERE: Cloudflare Workers can't fetch external URLs     │   │
│  │   Endpoints: POST /query (executes SQL, returns JSON)        │   │
│  │   Auth: Bearer token (VULTR_DB_API_KEY)                      │   │
│  │   File: vultr-db-proxy/server.js                             │   │
│  │   Deploy: manual copy to Vultr, pm2 restart db-proxy         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PostgreSQL 14 - Port 5432                                    │   │
│  │   WHY HERE: SmartSQL too limited, need full PostgreSQL       │   │
│  │   Database: callmeback                                        │   │
│  │   Tables: 12 (users, personas, calls, scheduled_calls, etc.) │   │
│  │   Access: Local socket from db-proxy only (not public)       │   │
│  │   Migrations: Applied via ./apply-migrations.sh              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  SSH Access: ssh root@144.202.15.249                                │
└─────────────────────────────────────────────────────────────────────┘
                     ▲
                     │ Twilio makes call via TwiML webhook
                     │ <Response><Connect><Stream url="wss://voice..." /></Connect></Response>
┌────────────────────┴────────────────────────────────────────────────┐
│                       TWILIO VOICE API                               │
│  - Receives: Outbound call trigger from call-orchestrator           │
│  - Connects: To voice pipeline WebSocket                             │
│  - Streams: Bidirectional audio (mulaw, 8kHz, 20ms packets)          │
│  - Trial Limitation: Can only call verified numbers                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Complete Call Journey

**1. User Triggers Call (Frontend → Backend)**
```
User clicks "Call Now" → Frontend → API Gateway → Call Orchestrator
└─> Validates user credits, persona selection
└─> Creates call record in database (status: 'initiated')
└─> Calls Twilio API to initiate outbound call
    POST https://api.twilio.com/2010-04-01/Accounts/{sid}/Calls.json
    Body: {To: user.phone, From: TWILIO_PHONE_NUMBER, Url: /api/voice/twiml}
```

**2. Twilio Fetches TwiML (Twilio → Backend)**
```
Twilio requests: GET /api/voice/twiml?callId={id}
API Gateway → Webhook Handler → Returns TwiML:
<Response>
  <Connect>
    <Stream url="wss://voice.ai-tools-marketplace.io/stream?callId={id}" />
  </Connect>
</Response>
```

**3. WebSocket Connection Established (Twilio → Vultr)**
```
Twilio connects: wss://voice.ai-tools-marketplace.io/stream?callId={id}
Voice Pipeline (Vultr) receives WebSocket connection
└─> Fetches call details from database (persona, user preferences)
└─> Initializes Deepgram STT WebSocket connection
└─> Initializes ElevenLabs TTS WebSocket connection
└─> Sends initial greeting (persona-specific)
```

**4. Audio Streaming Loop (Real-time Bidirectional)**
```
User speaks:
└─> Twilio captures audio (mulaw, 8kHz) → Voice Pipeline
    └─> Voice Pipeline forwards to Deepgram (mulaw → PCM conversion)
        └─> Deepgram returns transcript (streaming, interim results)
            └─> Voice Pipeline accumulates until turn complete (silence detection)
                └─> Complete transcript sent to Cerebras AI with persona prompt
                    └─> Cerebras returns response (<1s inference)
                        └─> Response sent to ElevenLabs TTS
                            └─> ElevenLabs streams audio chunks (PCM)
                                └─> Voice Pipeline converts PCM → mulaw
                                    └─> Sends to Twilio WebSocket
                                        └─> Twilio plays to user

CURRENT ISSUE: Turn detection timing (see VOICE_PIPELINE_DEBUG_FINDINGS.md)
```

**5. Call Termination**
```
User hangs up OR timer expires:
└─> Twilio sends 'stop' event → Voice Pipeline
    └─> Closes Deepgram WebSocket
    └─> Closes ElevenLabs WebSocket
    └─> Updates call record (status: 'completed', duration, cost)
    └─> SHOULD write cost events (NOT IMPLEMENTED)
    └─> SHOULD update user credits (NOT IMPLEMENTED)
```

---

## Database Schema (Vultr PostgreSQL)

### Core Tables with Technical Details

**users** (Authentication & Accounts)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt with 10 salt rounds
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  stripe_customer_id VARCHAR(255),  -- For Stripe integration (not active)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Demo user: demo@callmeback.ai / demo123 (password: bcrypt hash of 'demo123')
-- Issue: Passwords with special chars (!@#$%) cause JSON parsing errors
```

**personas** (AI Character Definitions)
```sql
CREATE TABLE personas (
  id VARCHAR(50) PRIMARY KEY,  -- e.g., 'brad_001', 'sarah_001', 'alex_001'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  core_system_prompt TEXT NOT NULL,  -- Base personality definition
  default_voice_id VARCHAR(100),     -- ElevenLabs voice ID
  category VARCHAR(50),               -- 'coach', 'friend', 'creative', etc.
  is_system_persona BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
-- System personas loaded via migrations/002_seed_personas.sql
-- Brad: Voice pNInz6obpgDQGcFmaJgB, Category 'coach'
-- Sarah: Voice EXAVITQu4vr4xnSDxMaL, Category 'friend'
-- Alex: Voice pNInz6obpgDQGcFmaJgB, Category 'creative'
```

**user_persona_relationships** (Customization & History)
```sql
CREATE TABLE user_persona_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  persona_id VARCHAR(50) REFERENCES personas(id),
  custom_system_prompt TEXT,           -- User-specific overrides
  custom_voice_id VARCHAR(100),        -- Override default voice
  total_calls INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  smart_memory TEXT,                   -- UNUSED! Should be SmartMemory API
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, persona_id)
);
-- Note: smart_memory column exists but NOT using Raindrop SmartMemory API!
-- This is a major missed opportunity (P1 priority to fix)
```

**calls** (Active/Completed Call Records)
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  persona_id VARCHAR(50) REFERENCES personas(id),
  twilio_call_sid VARCHAR(255) UNIQUE,  -- Twilio's identifier
  status VARCHAR(50) DEFAULT 'initiated', -- 'initiated', 'in_progress', 'completed', 'failed'
  duration_seconds INTEGER,
  cost_usd DECIMAL(10, 4),              -- CALCULATED but cost tracking not implemented
  payment_status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**scheduled_calls** (Future Calls)
```sql
CREATE TABLE scheduled_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  persona_id VARCHAR(50) REFERENCES personas(id),
  scheduled_for TIMESTAMP NOT NULL,     -- UTC timestamp
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'executed', 'cancelled'
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
-- CRITICAL ISSUE: No cron job executes these! Scheduled calls never happen.
-- Need Task definition in raindrop.manifest
```

**call_cost_events** (Granular Cost Tracking)
```sql
CREATE TABLE call_cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id),
  user_id UUID REFERENCES users(id),
  service VARCHAR(50) NOT NULL,         -- 'twilio', 'deepgram', 'cerebras', 'elevenlabs'
  operation VARCHAR(100),                -- 'streaming_stt', 'inference', 'tts', etc.
  usage_amount DECIMAL(12, 4),          -- e.g., 300 (seconds), 50000 (tokens)
  usage_unit VARCHAR(20),                -- 'seconds', 'tokens', 'characters'
  unit_cost DECIMAL(12, 8),             -- Cost per unit (e.g., $0.0059 per minute)
  total_cost DECIMAL(10, 4),            -- Calculated cost for this event
  estimated BOOLEAN DEFAULT true,       -- true if calculated, false if billed
  created_at TIMESTAMP DEFAULT NOW()
);
-- CRITICAL ISSUE: Table exists but NEVER written to!
-- No cost tracking happening at all (P0 priority)
```

**user_credits** (Credit Balances)
```sql
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance INTEGER DEFAULT 0,            -- Credit balance (demo user has 100)
  tier VARCHAR(50) DEFAULT 'free',      -- 'free', 'starter', 'pro', etc.
  subscription_status VARCHAR(50),      -- 'active', 'cancelled', etc.
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Demo user has 100 credits but no deduction logic implemented
```

**token_blacklist** (JWT Revocation)
```sql
CREATE TABLE token_blacklist (
  token_hash VARCHAR(255) PRIMARY KEY,  -- SHA-256 hash of JWT
  user_id UUID REFERENCES users(id),
  blacklisted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
-- Used for logout - tokens added here are considered invalid
```

**user_budget_settings** (Spending Limits)
```sql
CREATE TABLE user_budget_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  daily_limit_usd DECIMAL(10, 2),
  monthly_limit_usd DECIMAL(10, 2),
  alert_threshold_pct INTEGER DEFAULT 80,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- NOT ENFORCED! Limits stored but no checking logic
```

**call_logs** (Historical Analytics)
```sql
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  persona_id VARCHAR(50) REFERENCES personas(id),
  duration_seconds INTEGER,
  transcript TEXT,                      -- Full conversation (not stored yet)
  sentiment_score DECIMAL(3, 2),        -- Not implemented
  topics TEXT[],                        -- Not implemented
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Migration History
```bash
migrations/
├── 001_create_personas_and_relationships.sql  # Initial schema
├── 002_seed_personas.sql                      # Brad, Sarah, Alex
├── 003_update_seed_personas.sql               # Voice ID corrections
├── 004_create_calls_tables.sql                # calls, scheduled_calls
├── 005_create_credits_system.sql              # user_credits
└── 006_create_users_and_auth_tables_fixed.sql # users, demo user, auth tables

# Apply migrations:
./apply-migrations.sh  # Runs against Vultr PostgreSQL
```

---

## Raindrop Framework: Current vs Potential

### Current Utilization (~30%)

**What We're Using:**
1. **Services** - 7 microservices deployed successfully
2. **Environment Variables** - Secret management with `env:` prefix
3. **Versioning/Branching** - `raindrop build start --branch` workflow
4. **Database Proxy** - Custom bridge to external database
5. **Logging** - Basic `console.log()` → `raindrop logs tail`

### Unused Features (70% Opportunity)

#### 1. SmartMemory ⭐⭐⭐⭐⭐ (P1 - HIGHEST VALUE)

**What It Is:** Multi-layered AI agent memory system
- **Working Memory:** Active conversation session (temporary)
- **Episodic Memory:** Past conversation summaries (long-term)
- **Semantic Memory:** Knowledge base with vector search
- **Procedural Memory:** Templates and skills

**Current Gap:**
```typescript
// WHAT WE HAVE (WRONG):
// Database column storing JSON string
smart_memory TEXT  // Just a dumb text field!

// WHAT WE SHOULD HAVE (RIGHT):
// Raindrop SmartMemory API with 4 memory layers
const { sessionId, workingMemory } = await env.AGENT_MEMORY.startWorkingMemorySession();

// During call - automatic context building
await workingMemory.putMemory({
  content: "User loves hiking, just completed Appalachian Trail",
  key: "user_interests",
  agent: "brad_001",
  timeline: "personal"  // Separate work/personal contexts
});

// Later calls - semantic search (not exact match!)
const memories = await workingMemory.searchMemory({
  terms: "outdoor activities mountains",  // Finds "hiking" even without exact match
  nMostRecent: 5
});

// End call - flush to long-term episodic storage
const summary = await workingMemory.summarizeMemory({
  systemPrompt: "Summarize key points from this conversation"
});
await workingMemory.endSession(true);  // true = flush to episodic

// Future calls - retrieve episodic memories
const pastContext = await env.AGENT_MEMORY.searchEpisodicMemory({
  userId: "user-123",
  personaId: "brad_001",
  terms: "goals fitness",
  timeRange: "last_30_days"
});
```

**Why This Matters:**
- **Personalization:** "Remember when you told me about your marathon training?" (builds real relationships)
- **Context Continuity:** Multi-call story arcs, goal tracking
- **Semantic Search:** Finds relevant context without keyword matching
- **Automatic Summarization:** AI generates session summaries

**Implementation Steps:**
1. Add to `raindrop.manifest`:
   ```hcl
   smartmemory "agent_memory" {
     # No configuration needed
   }
   ```
2. Run `raindrop build generate` (regenerates types, adds `env.AGENT_MEMORY`)
3. Integrate in voice pipeline:
   - Start session on call initiation
   - `putMemory()` after each user statement
   - `searchMemory()` before Cerebras inference (inject context)
   - `summarizeMemory()` and `endSession()` on call end
4. Update persona system prompts to reference memories
5. Test multi-call memory persistence

**Effort:** 1-2 days
**Impact:** Transforms personas from stateless chatbots to relationship-building companions

---

#### 2. SmartBuckets ⭐⭐⭐⭐ (P2 - HIGH DIFFERENTIATION)

**What It Is:** RAG (Retrieval-Augmented Generation) in a box
- Object storage with automatic semantic indexing
- Document chat (query PDFs, text files, images)
- Multi-modal search (text + images from PDFs)
- Automatic chunking and embedding

**Current Gap:** No document-based training or knowledge storage

**Use Case 1: Persona Training Library**
```typescript
// Upload training documents for each persona
await env.PERSONA_LIBRARY.put("brad_coaching_philosophy.pdf", pdfBuffer, {
  metadata: { persona: "brad_001", category: "training_material" }
});

await env.PERSONA_LIBRARY.put("brad_conversation_examples.txt", examples, {
  metadata: { persona: "brad_001", category: "examples" }
});

// During call - search relevant context from training docs
const context = await env.PERSONA_LIBRARY.search({
  input: "User struggling with gym motivation",
  requestId: callId,
  metadata: { persona: "brad_001" }
});

// Inject search results into persona system prompt
const enhancedPrompt = basePrompt + "\nRelevant training context:\n" +
  context.results.map(r => `${r.text} (from ${r.metadata.source})`).join('\n');
```

**Use Case 2: User Document Chat**
```typescript
// NEW FEATURE: "Chat with your documents through Brad"
// User uploads resume, Brad helps them discuss career path

await env.USER_DOCUMENTS.put(`users/${userId}/resume.pdf`, resumeBuffer);

// In voice call:
const resumeInsight = await env.USER_DOCUMENTS.documentChat({
  objectId: `users/${userId}/resume.pdf`,
  input: "What are my top 3 technical skills?",
  requestId: callId
});

// Brad: "Based on your resume, your top 3 skills are..."
```

**Use Case 3: Conversation Transcript Archive**
```typescript
// Store call transcripts with automatic semantic indexing
await env.CONVERSATION_ARCHIVE.put(
  `transcripts/${callId}.json`,
  JSON.stringify({
    callId,
    userId,
    personaId: "brad_001",
    transcript: fullTranscript,
    timestamp: new Date().toISOString()
  })
);

// Later: "Brad, what did we talk about last Tuesday?"
const pastConversations = await env.CONVERSATION_ARCHIVE.search({
  input: "discussion last tuesday fitness goals",
  requestId: callId,
  metadata: { userId, personaId: "brad_001" }
});
```

**Why This Matters:**
- **Richer Personas:** Train on actual documents, not just prompts
- **New Revenue Stream:** Premium feature ($9.99/month for custom training docs)
- **Competitive Advantage:** Few voice AI apps have document-aware conversations
- **Multi-Modal:** Handle PDFs with images, screenshots, diagrams

**Implementation Steps:**
1. Add to `raindrop.manifest`:
   ```hcl
   smartbucket "persona_library" { }
   smartbucket "user_documents" { }
   smartbucket "conversation_archive" { }
   ```
2. Build document upload UI (frontend)
3. Create upload endpoint (api-gateway)
4. Integrate search into voice pipeline (before Cerebras inference)
5. Create persona training workflow (admin dashboard)

**Effort:** 3-5 days
**Impact:** Major product differentiation, new revenue stream

---

#### 3. Task (Cron Jobs) ⭐⭐⭐⭐⭐ (P0 - CRITICAL BLOCKER)

**What It Is:** Schedule background jobs with cron expressions

**Current Gap:** Scheduled calls stored but NEVER executed

**Required Immediately:**
```hcl
# raindrop.manifest

task "scheduled_calls_executor" {
  schedule = "* * * * *"  # Every minute
  service = "call-orchestrator"
  function = "executeScheduledCalls"  # Must implement this function
}

task "daily_cost_sync" {
  schedule = "0 2 * * *"  # 2 AM UTC daily
  service = "cost-tracker"  # Need to create this service
  function = "syncExternalUsage"  # Reconcile with Twilio/Stripe APIs
}

task "pricing_refresh" {
  schedule = "0 3 * * *"  # 3 AM UTC daily
  service = "pricing-manager"  # Need to create this service
  function = "refreshAllPricing"  # Fetch latest API pricing
}
```

**Implementation (call-orchestrator):**
```typescript
// src/call-orchestrator/index.ts

export class CallOrchestrator extends Service {
  // Existing methods...

  // NEW: Called by Task scheduler every minute
  async executeScheduledCalls(): Promise<void> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Find scheduled calls due now (with 5-min buffer for missed executions)
    const dueCalls = await DATABASE_PROXY.executeQuery({
      sql: `
        SELECT id, user_id, persona_id, scheduled_for
        FROM scheduled_calls
        WHERE scheduled_for <= $1
          AND scheduled_for >= $2
          AND status = 'pending'
        ORDER BY scheduled_for ASC
        LIMIT 10
      `,
      params: [now, fiveMinutesAgo]
    });

    for (const call of dueCalls) {
      try {
        // Trigger the call
        await this.triggerImmediateCall({
          userId: call.user_id,
          personaId: call.persona_id,
          scheduledCallId: call.id
        });

        // Mark as executed
        await DATABASE_PROXY.executeQuery({
          sql: `UPDATE scheduled_calls SET status = 'executed', executed_at = NOW() WHERE id = $1`,
          params: [call.id]
        });
      } catch (error) {
        console.error(`Failed to execute scheduled call ${call.id}:`, error);
        // Mark as failed
        await DATABASE_PROXY.executeQuery({
          sql: `UPDATE scheduled_calls SET status = 'failed' WHERE id = $1`,
          params: [call.id]
        });
      }
    }
  }
}
```

**Why This Matters:**
- **Core Feature:** Scheduled calls is advertised but doesn't work!
- **Cost Tracking:** Daily sync ensures accuracy
- **Dynamic Pricing:** Always use latest API rates

**Effort:** 1 day (including testing)
**Impact:** Makes advertised feature actually work

---

#### 4. MCP Services ⭐⭐⭐⭐ (P2 - HACKATHON APPEAL)

**What It Is:** Model Context Protocol servers that AI agents can connect to

**Current Status:** ⚠️ **BLOCKED - FRAMEWORK ISSUE**

**What We Attempted (2025-11-19):**
- Implemented log-aggregator MCP service
- Service deploys successfully to Raindrop
- GET requests return proper JSON-RPC errors (proves endpoint alive)
- POST requests for MCP initialization fail with "Internal Server Error"
- Tested 7+ code variations (minimal examples, no custom logic, etc.)
- All fail at MCP protocol handshake level

**Evidence of Systematic Debugging:**
1. Removed HTTP endpoints → No change
2. Fixed collector initialization timing → No change
3. Enhanced error handling → Errors not appearing in logs
4. Disabled OAuth (public visibility) → No change
5. Simplified to 2-tool minimal example → Still fails
6. Removed all error handling → No change
7. Minimal empty response → Still "Internal Server Error"

**Working vs Failing Comparison:**
```bash
# Working: raindrop-mcp (provided by Raindrop)
$ curl "https://raindrop-mcp.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/mcp"
Response: {"error":"Invalid bearer token."}  # Proper OAuth rejection

$ claude mcp list
raindrop-mcp: ... - ✓ Connected

# Failing: log-aggregator (our custom MCP)
$ curl "https://mcp-01kacjt9792m58fgndgpfmcjgc...lmapp.run/mcp"
Response: {"jsonrpc":"2.0","error":{"code":-32000,"message":"GET /mcp requires Accept: text/event-stream"},"id":null}
# ^ This is correct! Proves endpoint works for GET

$ curl -X POST "https://mcp-01kacjt9792m58fgndgpfmcjgc...lmapp.run/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize",... }'
Response: Internal Server Error (21 bytes)  # Generic error, no details

$ claude mcp list
call-me-back-logs: ... - ✗ Failed to connect
```

**Root Cause Theories:**
1. **Framework bug/limitation** (most likely) - Custom MCP services may not be fully supported yet
2. **Missing undocumented step** - raindrop-mcp may use internal setup we can't see
3. **Runtime type mismatch** - Something TypeScript can't catch

**Decision:** **DEFER UNTIL FRAMEWORK SUPPORT**

**Potential Use Cases (When Unblocked):**

**Use Case 1: Log Aggregation MCP** (P0 if working)
```typescript
// Saves 80%+ context tokens during debugging!
mcp.registerTool("search-logs", {
  description: "Search across Raindrop + Vultr + Twilio logs",
  inputSchema: {
    query: z.string(),
    service: z.string().optional(),  // Filter by service
    since: z.string().optional(),    // '10m', '1h', '24h'
    limit: z.number().optional()
  }
}, async (args) => {
  // Returns only relevant 10-20 lines instead of 500+ line dumps
  return await searchAggregatedLogs(args);
});

mcp.registerTool("get-call-logs", {
  description: "Get complete timeline for specific call ID",
  inputSchema: { call_id: z.string() }
}, async (args) => {
  // Correlates logs across all services for one call
  return await getCallTimeline(args.call_id);
});

mcp.registerTool("aggregate-costs", {
  description: "Extract cost data from logs",
  inputSchema: { since: z.string().optional() }
}, async (args) => {
  // Parses logs for API usage, returns cost breakdown
  return await extractCostsFromLogs(args.since);
});
```

**Why This Matters (If It Worked):**
- **Context Savings:** Currently burn 2000+ tokens per debugging session on logs
- **Time Savings:** Replaces 5+ manual commands with 1 MCP call
- **Cost Tracking:** Enables dynamic pricing (P0 feature!)
- **Hackathon Appeal:** Shows advanced MCP usage

**See:** MCP_DEBUGGING_SESSION_2025-11-19.md for complete debugging log (2+ hours of work)

---

#### 5. Vector Index ⭐⭐⭐ (P3 - GROWTH PHASE)

**What It Is:** High-dimensional vector storage for similarity search

**Potential Use Cases:**
```typescript
// Smart persona recommendations
await env.PERSONA_VECTORS.insert({
  vector: await embedUserPreferences(userId),
  metadata: { userId, favoritePersonas: ['brad_001'], callHistory: [...] }
});

const similar = await env.PERSONA_VECTORS.query({
  vector: currentUserVector,
  topK: 5
});
// "Users like you also loved Sarah and Alex!"

// Conversation topic clustering
const similar = await env.CONVERSATION_VECTORS.query({
  vector: await embedConversationSummary(summary),
  topK: 10
});
// "This reminds me of when we talked about..."
```

**Effort:** 2-3 days
**Impact:** Nice-to-have for growth, not critical for MVP

---

#### 6. SmartSQL ❌ (INTENTIONALLY AVOIDED)

**Decision:** **KEEP AVOIDING** - We correctly chose Vultr PostgreSQL

**Why SmartSQL Failed:**
- Limited SQL function support (no `NOW()`, poor date functions)
- Poor JOIN performance (multi-table queries fail)
- Missing data types (no proper TIMESTAMP, UUID support limited)
- SQLite-based (not PostgreSQL) - incompatible with our queries
- "Invalid input or query execution error" on complex queries

**Evidence:** Multiple debugging sessions, FINAL_DATABASE_STRATEGY.md

**Possible Future Use:** PII detection API (separate from database functionality)

---

### Feature Priority Matrix

| Feature | Business Value | Technical Risk | Effort | Hackathon Appeal | Priority | Status |
|---------|---------------|----------------|--------|------------------|----------|---------|
| **Task (Cron)** | ⭐⭐⭐⭐⭐ | LOW | LOW (1d) | ⭐⭐⭐ | **P0** | ❌ Not started |
| **Cost Tracking** | ⭐⭐⭐⭐⭐ | LOW | LOW (1-2d) | ⭐⭐⭐⭐ | **P0** | ❌ Not started |
| **WorkOS Auth** | ⭐⭐⭐⭐ | LOW | MED (2-3d) | ⭐⭐⭐⭐⭐ | **P0** | ❌ Not started |
| **SmartMemory** | ⭐⭐⭐⭐⭐ | MED | MED (1-2d) | ⭐⭐⭐⭐⭐ | **P1** | ❌ Not started |
| **Pricing/Payments** | ⭐⭐⭐⭐⭐ | MED | HIGH (5-7d) | ⭐⭐⭐ | **P1** | ❌ Not started |
| **SmartBuckets** | ⭐⭐⭐⭐ | MED | HIGH (3-5d) | ⭐⭐⭐⭐ | **P2** | ❌ Not started |
| **MCP Services** | ⭐⭐⭐⭐ | **HIGH** | MED (2-3d) | ⭐⭐⭐⭐⭐ | **P2** | ⚠️ **BLOCKED** |
| **Vector Index** | ⭐⭐⭐ | LOW | MED (2-3d) | ⭐⭐⭐ | P3 | ❌ Not started |

---

## Cost Economics & Pricing Strategy

### Actual API Costs (2025 Rates - Verified)

**Per 5-Minute Call Breakdown:**
```
Twilio (outbound, US)
  - Cost: $0.014/minute × 5 minutes = $0.070
  - What: Phone call infrastructure, media streaming

Deepgram (nova-2, en-US, streaming)
  - Cost: $0.0059/minute × 5 minutes = $0.030
  - What: Speech-to-text, real-time transcription

Cerebras AI (llama3.1-8b, ~50K tokens)
  - Cost: $0.10 per 1M tokens × 0.05M = $0.005
  - What: Sub-1s inference (40x cheaper than GPT-4!)
  - Note: Assuming ~10K tokens per turn, 5 turns per call

ElevenLabs (Turbo v2.5, ~2000 characters)
  - Cost: $0.15 per 1K chars × 2 = $0.300
  - What: Text-to-speech, real-time audio streaming
  - Note: Largest single API cost (35% of total)

Raindrop (amortized @ 1000 calls/month)
  - Base: $20/month ÷ 1000 calls = $0.020
  - What: 7 microservices hosting, 100M requests

──────────────────────────────────────────
SUBTOTAL (Direct API Costs): $0.425/call
──────────────────────────────────────────

Payment Processing (Stripe)
  - Rate: 2.9% + $0.30 per transaction
  - On $4.99 charge: ($4.99 × 0.029) + $0.30 = $0.475
  - What: Credit card processing, fraud prevention

──────────────────────────────────────────
TOTAL COST (All-in): $0.900 per 5-min call
──────────────────────────────────────────
```

**Key Cost Insights:**
1. **ElevenLabs is 70% of API costs** ($0.30 of $0.425) - Optimization target
2. **Stripe is 53% of total costs** ($0.475 of $0.900) - Consider crypto/bank ACH for power users
3. **Cerebras is negligible** ($0.005) - Can support much longer conversations without worry
4. **Twilio + Deepgram are moderate** ($0.100 combined) - Standard telecom costs

### User Pricing Strategy (NOT IMPLEMENTED)

**Target Pricing (Launch):**
```
$4.99 per 5-minute call
─────────────────────────
Revenue:        $4.99
Cost:           $0.90
─────────────────────────
Gross Profit:   $4.09
Margin:         82%
─────────────────────────
```

**Pricing Tiers (Phase 1 - Launch):**
```
Free Trial
  - 1 call free (no credit card required)
  - Cost: $0.90 (CAC budget)
  - Goal: 30% conversion to paid

Pay-As-You-Go
  - $4.99 per call (5 min)
  - No monthly commitment
  - Target: Casual users, 1-3 calls/month

Starter Pack
  - $24.99 for 5 calls ($4.99/call)
  - No expiration
  - Target: Regular users, bulk discount
```

**Pricing Tiers (Phase 2 - After Product-Market Fit):**
```
Casual Plan - $9.99/month
  - 3 calls included
  - Additional calls: $4.99 each
  - Target: Monthly users

Standard Plan - $29.99/month
  - Up to 10 calls (60 min total)
  - Additional calls: $4.99 each
  - Target: Weekly users

Power Plan - $49.99/month
  - Up to 25 calls (150 min total)
  - Additional calls: $3.99 each
  - Target: Daily users

Pro Plan - $99.99/month
  - Unlimited calls (fair use: 100 calls/month)
  - Custom personas
  - Priority support
  - Document chat feature
  - Target: Enterprise, coaching, therapy
```

**Call Duration Pricing:**
```
3 minutes  → $3.99 (cost: $0.54, margin: 86%)
5 minutes  → $4.99 (cost: $0.90, margin: 82%)  ← Default
10 minutes → $7.99 (cost: $1.35, margin: 83%)
15 minutes → $10.99 (cost: $1.80, margin: 84%)

Mid-call extension: +$2.99 for 5 more minutes
```

### Cost Tracking Implementation (CRITICAL GAP)

**Current State:** ❌ **0% IMPLEMENTED**
```sql
-- Table exists but NEVER written to
SELECT COUNT(*) FROM call_cost_events;
-- Result: 0

-- No cost calculation in voice pipeline
-- No API usage tracking
-- No user spending limits enforced
-- No profitability visibility
```

**Phase 1: Basic Tracking (P0 - Immediate)**

**Implementation Plan (1-2 days):**
```javascript
// voice-pipeline-nodejs/pricing-constants.js
const PRICING = {
  twilio: { per_minute: 0.014, per_call: 0 },
  deepgram: { per_minute: 0.0059 },
  cerebras: { per_token: 0.0000001 },  // $0.10/1M
  elevenlabs: { per_character: 0.00015 },  // $0.15/1K
  raindrop: { per_call: 0.02 }
};

// voice-pipeline-nodejs/cost-tracker.js
class CostTracker {
  constructor(callId, userId) {
    this.callId = callId;
    this.userId = userId;
    this.events = [];
  }

  async recordUsage(service, operation, amount, unit) {
    const unitCost = PRICING[service][`per_${unit}`];
    const totalCost = amount * unitCost;

    this.events.push({
      service,
      operation,
      usage_amount: amount,
      usage_unit: unit,
      unit_cost: unitCost,
      total_cost: totalCost,
      estimated: true
    });

    // Immediately write to database (don't wait until call end)
    await this.flushToDatabase();
  }

  async flushToDatabase() {
    if (this.events.length === 0) return;

    const sql = `
      INSERT INTO call_cost_events
        (call_id, user_id, service, operation, usage_amount, usage_unit, unit_cost, total_cost, estimated)
      VALUES
        ${this.events.map((_, i) => `($${i*9+1}, $${i*9+2}, $${i*9+3}, $${i*9+4}, $${i*9+5}, $${i*9+6}, $${i*9+7}, $${i*9+8}, $${i*9+9})`).join(', ')}
    `;

    const params = this.events.flatMap(e => [
      this.callId, this.userId, e.service, e.operation,
      e.usage_amount, e.usage_unit, e.unit_cost, e.total_cost, e.estimated
    ]);

    await fetch(`${process.env.VULTR_DB_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VULTR_DB_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });

    this.events = [];  // Clear after flush
  }

  // Track Twilio usage (called every second)
  async trackTwilioTime(seconds) {
    await this.recordUsage('twilio', 'call_duration', seconds / 60, 'minute');
  }

  // Track Deepgram usage (called every second)
  async trackDeepgramTime(seconds) {
    await this.recordUsage('deepgram', 'streaming_stt', seconds / 60, 'minute');
  }

  // Track Cerebras usage (called after each inference)
  async trackCerebrasTokens(tokensUsed) {
    await this.recordUsage('cerebras', 'inference', tokensUsed, 'token');
  }

  // Track ElevenLabs usage (called after each TTS)
  async trackElevenLabsChars(charCount) {
    await this.recordUsage('elevenlabs', 'tts_streaming', charCount, 'character');
  }

  // Get current call cost
  getTotalCost() {
    return this.events.reduce((sum, e) => sum + e.total_cost, 0);
  }
}

// Usage in voice-pipeline-nodejs/index.js:
const costTracker = new CostTracker(callId, userId);

// Track every second
setInterval(() => {
  const elapsed = (Date.now() - callStartTime) / 1000;
  costTracker.trackTwilioTime(elapsed);
  costTracker.trackDeepgramTime(elapsed);
}, 1000);

// Track after Cerebras inference
const response = await cerebras.chat.completions.create({...});
await costTracker.trackCerebrasTokens(response.usage.total_tokens);

// Track after ElevenLabs TTS
const audioStream = await elevenlabs.textToSpeech(text);
await costTracker.trackElevenLabsChars(text.length);

// On call end - final summary
const totalCost = costTracker.getTotalCost();
await updateCallRecord(callId, { cost_usd: totalCost, status: 'completed' });
```

**Benefits of Phase 1:**
- Immediate cost visibility (know burn rate TODAY)
- Per-call profitability analysis
- User spending patterns
- API optimization targets (focus on ElevenLabs reduction)

**Phase 2: Dynamic Pricing (P1 - Next Sprint)**

**Fetch pricing from external APIs:**
```javascript
// src/pricing-manager/index.ts (NEW SERVICE)

export class PricingManager extends Service {
  async refreshAllPricing(): Promise<void> {
    // Fetch Twilio pricing
    const twilioResponse = await fetch(
      `https://pricing.twilio.com/v2/Voice/Countries/US`,
      { headers: { Authorization: `Basic ${btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN)}` } }
    );
    const twilioPricing = await twilioResponse.json();

    // Fetch Cerebras models (includes pricing in response)
    const cerebrasResponse = await fetch(
      'https://api.cerebras.ai/v1/models',
      { headers: { Authorization: `Bearer ${CEREBRAS_API_KEY}` } }
    );
    const cerebrasPricing = await cerebrasResponse.json();

    // ElevenLabs: No API, manual update with page hash monitoring
    // (See DYNAMIC_PRICING_STRATEGY.md)

    // Deepgram: No API, manual update

    // Store in database
    await DATABASE_PROXY.executeQuery({
      sql: `
        INSERT INTO service_pricing (service, operation, unit, cost, source, fetched_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (service, operation) DO UPDATE
        SET cost = $4, fetched_at = NOW()
      `,
      params: ['twilio', 'outbound_us', 'minute', twilioPricing.price, 'api']
    });

    // ... repeat for all services
  }
}
```

**Phase 3: External Verification (P2 - Post-Launch)**

**Daily reconciliation with actual bills:**
```javascript
// Task runs daily at 2 AM UTC
task "daily_cost_sync" {
  schedule = "0 2 * * *"
  service = "cost-tracker"
  function = "syncExternalUsage"
}

async syncExternalUsage(): Promise<void> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Fetch actual Twilio usage
  const twilioUsage = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Usage/Records/Daily.json?StartDate=${format(yesterday)}`,
    { headers: { Authorization: `Basic ${btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN)}` } }
  );

  // Compare estimated vs actual
  const discrepancy = actualCost - estimatedCost;
  if (Math.abs(discrepancy) > 0.10) {  // Alert if off by >$0.10
    await sendAlert(`Cost discrepancy: ${discrepancy}`);
  }

  // Update database with actual costs
  await DATABASE_PROXY.executeQuery({
    sql: `UPDATE call_cost_events SET estimated = false, total_cost = $1 WHERE call_id = $2 AND service = 'twilio'`,
    params: [actualCost, callId]
  });
}
```

**See for Complete Details:**
- **API_COSTS_AND_PROFITABILITY_2025.md** - Full cost analysis, break-even calculations
- **DYNAMIC_PRICING_STRATEGY.md** - Implementation plan for Phase 2-3
- **COST_OBSERVABILITY_PLAN.md** - Detailed architecture, monitoring, alerts

---

## Environment Variables & Secrets Management

### Required Environment Variables

**CRITICAL RULE:** Running `raindrop build generate` **WIPES ALL SECRETS**!
Always run `./set-all-secrets.sh` immediately after any `generate` command.

```bash
# Authentication & Database
JWT_SECRET=<random-string>                      # Used for JWT signing (256-bit recommended)
VULTR_DB_API_URL=https://db.ai-tools-marketplace.io
VULTR_DB_API_KEY=<vultr-api-key>               # Bearer token for db-proxy auth

# Twilio Voice
TWILIO_ACCOUNT_SID=<twilio-account-sid>        # From Twilio console
TWILIO_AUTH_TOKEN=<twilio-auth-token>          # From Twilio console
TWILIO_PHONE_NUMBER=<+1234567890>              # Your Twilio phone number

# AI Services
DEEPGRAM_API_KEY=<deepgram-api-key>            # For STT (used in Vultr voice pipeline)
CEREBRAS_API_KEY=<cerebras-api-key>            # For LLM inference
ELEVENLABS_API_KEY=<elevenlabs-api-key>        # For TTS

# Payment Processing (Stripe)
STRIPE_API_KEY=<stripe-secret-key>             # NOT SET YET (payment not implemented)
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>  # NOT SET YET

# WorkOS Authentication (HACKATHON REQUIREMENT - NOT SET!)
WORKOS_API_KEY=sk_...                          # NOT SET YET
WORKOS_CLIENT_ID=client_...                    # NOT SET YET
WORKOS_COOKIE_PASSWORD=<32-char-random>        # NOT SET YET
```

### Setting Secrets (Raindrop Services)

```bash
# Method 1: Individual secret
raindrop build env set env:SECRET_NAME "value"

# Method 2: Run script (RECOMMENDED)
./set-all-secrets.sh  # Sets all secrets from .env file

# Method 3: Check what's set
raindrop build env list --application call-me-back
```

### Setting Secrets (Vultr Server)

**Voice Pipeline & DB Proxy use .env files on Vultr:**
```bash
# SSH to Vultr
ssh root@144.202.15.249

# Voice pipeline secrets
nano /root/voice-pipeline/.env
# Contains: DEEPGRAM_API_KEY, CEREBRAS_API_KEY, ELEVENLABS_API_KEY, etc.

# Restart services after changing secrets
pm2 restart voice-pipeline
pm2 restart db-proxy

# Verify they're loaded
pm2 logs voice-pipeline --lines 20
```

### Adding New Environment Variables (CRITICAL PROCESS)

**You MUST do THREE things (order matters!):**

**Step 1: Add to raindrop.manifest**
```hcl
# raindrop.manifest
service "my-service" {
  # ... existing config ...
}

env "NEW_SECRET_NAME" {
  secret = true  # true for sensitive data, false for public config
}
```

**Step 2: Run generate to update types**
```bash
raindrop build generate
# This creates/updates src/*/raindrop.gen.ts with new Env types
```

**Step 3: Add to set-all-secrets.sh**
```bash
# set-all-secrets.sh
raindrop build env set env:NEW_SECRET_NAME "$NEW_SECRET_NAME"
```

**Step 4: Add to .env file**
```bash
# .env (NOT tracked in git!)
NEW_SECRET_NAME=actual_value_here
```

**Step 5: Run the script**
```bash
./set-all-secrets.sh  # Sets all secrets including new one
```

**Step 6: Use in code**
```typescript
// src/my-service/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const secretValue = env.NEW_SECRET_NAME;  // TypeScript knows this exists!
    // ...
  }
}
```

**Common Error If You Skip Step 1:**
```
error TS2339: Property 'NEW_SECRET_NAME' does not exist on type 'Env'.
```

---

## Deployment Procedures & Commands

### Raindrop Backend Services

**CRITICAL FACTS:**
1. **Raindrop Dashboard is (at present) Useless** - All operations must be CLI-based
2. **Logs Only via CLI** - No web interface for logs
3. **Secrets Reset After Generate** - Always run `./set-all-secrets.sh` after `raindrop build generate`
4. **One Deploy at a Time** - Wait for completion before starting another
5. **Sandbox Mode is Default** - Exit with `rm -f .raindrop/sandbox` when ready

**Common Commands:**
```bash
# Check current status
raindrop build status --application call-me-back

# Create new branch (DON'T use git checkout!)
raindrop build start --branch feature-name

# Deploy changes (standard)
raindrop build deploy

# Deploy changes (amend current version)
raindrop build deploy --amend

# Get logs (last 100 lines)
raindrop logs tail -n 100 --application call-me-back

# Follow logs in real-time
raindrop logs tail -f --application call-me-back

# Check if in sandbox mode
cat .raindrop/config.json
# Look for "sandbox": true

# Exit sandbox mode
rm -f .raindrop/sandbox

# Regenerate types after manifest changes
raindrop build generate

# Set secrets (after generate!)
./set-all-secrets.sh

# List environment variables
raindrop build env list --application call-me-back
```

**Deployment Workflow:**
```bash
# 1. Make code changes
vim src/api-gateway/index.ts

# 2. If you added new env vars to manifest
raindrop build generate
./set-all-secrets.sh  # CRITICAL!

# 3. Deploy
raindrop build deploy

# 4. Check status
raindrop build status

# 5. Monitor logs
raindrop logs tail -f --application call-me-back

# 6. Test endpoint
curl https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/personas
```

**Common Mistakes:**
```bash
# ❌ WRONG: Using git for branches
git checkout -b new-feature  # DON'T DO THIS

# ✅ RIGHT: Use Raindrop CLI
raindrop build start --branch new-feature

# ❌ WRONG: Chaining generate and deploy
raindrop build generate && raindrop build deploy  # Gets stuck!

# ✅ RIGHT: Separate steps with secrets
raindrop build generate
./set-all-secrets.sh
raindrop build deploy

# ❌ WRONG: Deploying frontend with Raindrop
raindrop build deploy  # This is backend only!

# ✅ RIGHT: Use Vercel for frontend
vercel --prod
```

### Vercel Frontend

**IMPORTANT:** Vercel is **NOT tied to Git**! Deployments are via CLI only.

```bash
# Production deployment
vercel --prod

# Preview deployment (for testing)
vercel

# List deployments
vercel ls

# View logs for specific deployment
vercel logs <deployment-url>

# Set environment variable
echo "OBSCURED ENV VAR FOR SECURITY PURPOSES" | \
  vercel env add VITE_API_URL production

# Remove environment variable
vercel env rm VITE_API_URL production

# Pull environment variables locally
vercel env pull
```

**Frontend Environment Variables:**
```bash
# Only one required: API Gateway URL
VITE_API_URL=https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run

# Used in: src/services/auth.js, src/services/personas.js, etc.
const API_URL = import.meta.env.VITE_API_URL;
```

**Frontend Code Locations:**
```
src/
├── views/          # Vue components (HomePage.vue, PersonaPage.vue, etc.)
├── stores/         # Pinia state management (auth.js, personas.js)
├── router/         # Vue Router config
├── services/       # API clients (auth.js, personas.js, calls.js)
└── assets/         # Static files (CSS, images)
```

**Frontend Styling (Updated 2025-11-19):**
- **Tailwind CSS v4** installed and configured
- Uses new `@import "tailwindcss"` syntax (v4 migration)
- PostCSS plugin: `@tailwindcss/postcss`
- Config: `postcss.config.js` (no `tailwind.config.js` needed in v4)
- Custom theme colors defined in `src/assets/styles/main.css` with `@theme` directive
- Existing custom utility classes preserved and will be gradually replaced during UI redesign
- Build tested and working ✅

**Dependencies:**
```json
{
  "devDependencies": {
    "tailwindcss": "^4.x",
    "@tailwindcss/postcss": "^4.x",
    "autoprefixer": "^10.x"
  }
}
```

### Vultr VPS Deployments

**Voice Pipeline:**
```bash
# From local machine
cd voice-pipeline-nodejs
./deploy.sh  # Builds tarball, SCPs to Vultr, restarts PM2

# Manual deployment (if script fails)
ssh root@144.202.15.249
cd /root/voice-pipeline
git pull  # If using git, OR
# ... upload files manually ...
pm2 restart voice-pipeline
pm2 logs voice-pipeline --lines 50
```

**Database Proxy:**
```bash
# From local machine
cd vultr-db-proxy
scp server.js root@144.202.15.249:/root/db-proxy/server.js
ssh root@144.202.15.249 "pm2 restart db-proxy"
```

**Check Vultr Services:**
```bash
ssh root@144.202.15.249

# Check running processes
pm2 status

# View logs
pm2 logs voice-pipeline --lines 100
pm2 logs db-proxy --lines 100

# Check PostgreSQL
sudo -u postgres psql -d callmeback -c "SELECT COUNT(*) FROM users;"

# Check Caddy (reverse proxy)
systemctl status caddy
cat /etc/caddy/Caddyfile
```

---

## Development Workflows & Best Practices

### Starting a New Feature

**Checklist:**
1. Read CRITICAL_RAINDROP_RULES.md (always!)
2. Read this document (PCR2.md)
3. Create new Raindrop branch:
   ```bash
   raindrop build start --branch feature-name
   ```
4. Make code changes
5. If manifest changed:
   ```bash
   raindrop build generate
   ./set-all-secrets.sh
   ```
6. Deploy backend:
   ```bash
   raindrop build deploy
   ```
7. Deploy frontend (if changed):
   ```bash
   vercel --prod
   ```
8. Test via API Gateway URL
9. Monitor logs:
   ```bash
   raindrop logs tail -f --application call-me-back
   ```

### Debugging Production Issues

**Step-by-Step:**
1. **Check deployment status:**
   ```bash
   raindrop build status --application call-me-back
   ```
2. **Check if in sandbox mode:**
   ```bash
   cat .raindrop/config.json | grep sandbox
   ```
3. **Verify secrets are set:**
   ```bash
   raindrop build env list --application call-me-back
   # If empty, run: ./set-all-secrets.sh
   ```
4. **Get recent logs:**
   ```bash
   raindrop logs tail -n 200 --application call-me-back | grep -i error
   ```
5. **Check specific service logs:**
   ```bash
   raindrop logs tail -n 100 --application call-me-back | grep "api-gateway"
   ```
6. **Test database connectivity:**
   ```bash
   curl -X POST https://db.ai-tools-marketplace.io/query \
     -H "Authorization: Bearer $VULTR_DB_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"sql": "SELECT COUNT(*) FROM users", "params": []}'
   ```
7. **Test API Gateway:**
   ```bash
   curl https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/personas
   ```

### Making Database Changes

**Workflow:**
1. Create migration file:
   ```bash
   # migrations/007_add_new_feature.sql
   CREATE TABLE new_feature (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     data TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
2. Apply migration:
   ```bash
   ./apply-migrations.sh  # Runs against Vultr PostgreSQL
   ```
3. Update services to use new schema:
   ```typescript
   // src/my-service/index.ts
   const result = await DATABASE_PROXY.executeQuery({
     sql: 'INSERT INTO new_feature (user_id, data) VALUES ($1, $2)',
     params: [userId, data]
   });
   ```
4. Deploy services:
   ```bash
   raindrop build deploy
   ```
5. Test with demo user:
   ```bash
   curl -X POST https://svc-.../api/... \
     -H "Authorization: Bearer <demo-user-token>" \
     -d '{"data": "test"}'
   ```

**Alternative: Apply Migration via DB-Proxy API**
```bash
# If apply-migrations.sh doesn't work
curl -X POST https://db.ai-tools-marketplace.io/query \
  -H "Authorization: Bearer $VULTR_DB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE TABLE new_feature (...)",
    "params": []
  }'
```

---

## Known Issues & Recent Debugging

### Recent Session: MCP Service Blocked (2025-11-19)

**Goal:** Implement log aggregation MCP service to save context tokens during debugging.

**Result:** ⚠️ **BLOCKED** - Framework-level issue, likely requires Raindrop support.

**What We Did:**
- Implemented log-aggregator MCP service following official documentation exactly
- Deployed successfully to Raindrop (service running, URL accessible)
- Tested 7+ code variations:
  1. Removed HTTP endpoints
  2. Fixed collector initialization timing
  3. Added comprehensive error handling
  4. Disabled OAuth (public visibility)
  5. Simplified to minimal 2-tool example
  6. Removed all error handling
  7. Minimal empty response
- **All variations fail at MCP protocol handshake level**

**Symptoms:**
```bash
# GET requests work (proves endpoint is alive)
$ curl "https://mcp-01kacjt9792m58fgndgpfmcjgc...lmapp.run/mcp"
Response: {"jsonrpc":"2.0","error":{"code":-32000,"message":"GET /mcp requires Accept: text/event-stream"},"id":null}

# POST requests fail (MCP initialization)
$ curl -X POST "https://mcp-01kacjt9792m58fgndgpfmcjgc...lmapp.run/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize",...}'
Response: Internal Server Error (21 bytes)

# Claude Code can't connect
$ claude mcp list
call-me-back-logs: ... - ✗ Failed to connect
```

**Root Cause Theories:**
1. **Framework bug** (most likely) - Custom MCP services may not fully work yet
2. **Missing undocumented step** - raindrop-mcp (provided service) may use internal setup
3. **Runtime type mismatch** - Something TypeScript can't catch at compile time

**Decision:** **DEFER** - Focus on P0 priorities (cost tracking, scheduled calls, WorkOS)

**See:** MCP_DEBUGGING_SESSION_2025-11-19.md for complete 2+ hour debugging log with all code variations tested.

---

### Voice Pipeline Known Issues

**Issue 1: Multi-Turn Conversation Not Fully Tested**
- ✅ 1 successful talk-response volley confirmed (2025-11-17)
- ⚠️ Longer conversations not tested
- ❌ Turn-taking logic not implemented (users can interrupt but no VAD cutoff)

**Issue 2: Deepgram Connection Timing**
- Deepgram WebSocket may not be ready when audio arrives
- Buffer audio until Deepgram is connected
- **See:** VOICE_PIPELINE_DEBUG_FINDINGS.md for detailed analysis

**Issue 3: Turn Detection Hangs**
- Silence detection sometimes doesn't trigger end-of-turn
- Need timeout fallback (force turn end after X seconds of no activity)
- **See:** VOICE_PIPELINE_DEBUG_FINDINGS.md

---

### High Priority Issues

**P0 - Critical Blockers:**

1. **Cost Tracking (0% done)**
   - **Impact:** Cannot price product, no burn rate visibility, no budget controls
   - **Action:** Implement Phase 1 hardcoded pricing (1-2 days)
   - **Files:** voice-pipeline-nodejs/cost-tracker.js

2. **Scheduled Calls Execution (0% done)**
   - **Impact:** Advertised feature doesn't work at all
   - **Action:** Add Task to raindrop.manifest, implement executeScheduledCalls (1 day)
   - **Files:** raindrop.manifest, src/call-orchestrator/index.ts

3. **WorkOS Authentication (0% done)**
   - **Impact:** Missing hackathon judging criteria, no enterprise readiness
   - **Action:** Sign up, integrate SDK, replace JWT (2-3 days)
   - **Files:** src/auth-manager/index.ts, src/api-gateway/index.ts
   - **See:** WORKOS_INTEGRATION_PLAN.md

**P1 - Required for Launch:**

4. **Pricing/Payment Logic (0% done)**
   - No call duration selection in frontend
   - No pricing calculation in payment-processor
   - No Twilio call timers
   - **Action:** Build duration UI, pricing logic, Stripe integration (5-7 days)
   - **Files:** src/views/CallPage.vue, src/payment-processor/index.ts

5. **SmartMemory Integration (0% done)**
   - Have TEXT column but not using Raindrop API
   - **Action:** Add smartmemory resource, integrate in voice pipeline (1-2 days)
   - **Files:** raindrop.manifest, voice-pipeline-nodejs/index.js

---

## Additional Documentation Index

**For deep-dives on specific topics, consult:**

### Deployment & Infrastructure
- **CRITICAL_RAINDROP_RULES.md** ⭐ - Read EVERY time before deployment
- **RAINDROP_DEPLOYMENT_GUIDE.md** - Detailed deployment procedures
- **DEPLOYMENT_SUCCESS.md** - Historical deployment notes

### Voice Pipeline
- **VOICE_PIPELINE_DEBUG_FINDINGS.md** - Known issues, solutions, timing diagrams
- **VOICE_PIPELINE_DEBUG_AND_TASKS.md** - Debugging tasks, test cases
- **CALL_FLOW_DEBUGGING.md** - Complete call flow analysis (Sessions 1-10)

### Cost & Pricing
- **API_COSTS_AND_PROFITABILITY_2025.md** ⭐ - Complete cost breakdown, break-even analysis
- **DYNAMIC_PRICING_STRATEGY.md** - Phase 1-3 implementation plans
- **COST_OBSERVABILITY_PLAN.md** - Monitoring, alerts, reconciliation

### Database
- **FINAL_DATABASE_STRATEGY.md** - Why Vultr PostgreSQL, not SmartSQL
- **LOG_ANALYSIS_GUIDE.md** - How to analyze Raindrop logs
*- also read SECURE_REVERSE_PROXY_PATTERN.md and TROUBLESHOOTING_VULTR_CONNECTIVITY.md if you've having issues with or buidling for the services running on Vultr*

### Authentication
- **WORKOS_INTEGRATION_PLAN.md** ⭐ - Step-by-step WorkOS integration
- **OAUTH_SESSION_LOG.md** - OAuth setup notes
- **OAUTH_MCP_SESSION_COMPLETE.md** - OAuth completion

### MCP & Debugging
- **MCP_DEBUGGING_SESSION_2025-11-19.md** ⭐ - Latest MCP debugging (BLOCKED)
- **MCP_DEBUGGING_SESSION.md** - Previous MCP session
- **LOG_AGGREGATION_MCP_DESIGN.md** - MCP design (not implemented due to block)

### Planning & Strategy
- **RAINDROP_PRD.md** - Product requirements document
- **UPDATE_SUMMARY.md** - Recent updates summary
- **after_midterm/** - Post-midterm planning documents

---

## Quick Reference

### Current URLs
```
Frontend:       https://call-me-back-nugbql1rx-david-melsheimers-projects.vercel.app
API Gateway:    https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run
Voice Pipeline: wss://voice.ai-tools-marketplace.io/stream
DB Proxy:       https://db.ai-tools-marketplace.io
Vultr Server:   144.202.15.249 (SSH: root@144.202.15.249)
```

### Demo User
```
Email:    demo@callmeback.ai
Password: demo123
Credits:  100
```

### System Personas
```
brad_001:  Voice pNInz6obpgDQGcFmaJgB (coach, direct, loyal)
sarah_001: Voice EXAVITQu4vr4xnSDxMaL (friend, empathetic, patient)
alex_001:  Voice pNInz6obpgDQGcFmaJgB (creative, enthusiastic, curious)
```

### Critical Commands
```bash
# Raindrop
raindrop build status --application call-me-back
raindrop build deploy
raindrop logs tail -n 100 --application call-me-back
./set-all-secrets.sh

# Vercel
vercel --prod
vercel ls

# Vultr
ssh root@144.202.15.249
pm2 status
pm2 logs voice-pipeline

# Database
./apply-migrations.sh
```

---

## Summary for AI Assistants

**When working on this project, you MUST understand:**

1. **Multi-Cloud Architecture** - Services split across Vercel/Raindrop/Vultr due to technical constraints (not preference)
2. **Database-Proxy Pattern** - Cloudflare Workers can't fetch external URLs, all database calls go through proxy
3. **Voice Pipeline on Vultr** - Cloudflare Workers can't do outbound WebSockets, voice must be on Vultr
4. **SmartSQL Avoided** - Too many limitations, using full PostgreSQL on Vultr instead
5. **Secrets Reset After Generate** - Always run ./set-all-secrets.sh after raindrop build generate
6. **Frontend Separate** - Vercel frontend deploys independently with vercel --prod (NOT git push)
7. **WorkOS NOT Implemented** - Critical P0 hackathon requirement
8. **Cost Tracking NOT Implemented** - Critical P0 business gap, table exists but empty
9. **Scheduled Calls Don't Work** - Need Task cron job (P0)
10. **MCP Service BLOCKED** - Framework issue, deferred (see MCP_DEBUGGING_SESSION_2025-11-19.md)
11. **SmartMemory Unused** - High-value P1 opportunity, have TEXT column but should use Raindrop API
12. **SmartBuckets Unused** - High-value P2 opportunity for document training, RAG

**Raindrop Feature Utilization: ~30% → Target: ~70%**

**Critical Priorities:**
- **P0 (This Week):** Cost tracking, scheduled calls cron, WorkOS auth
- **P1 (Next 2 Weeks):** SmartMemory integration, pricing/payment logic
- **P2 (Post-Hackathon):** SmartBuckets, dynamic pricing, MCP (if unblocked)

**The app has working voice pipeline but needs cost tracking, scheduled calls execution, and WorkOS to be hackathon-competitive.**

---

**End of Project Context Review 2.0**

##### REMEMBER: NEVER SHOW SECRETS IN LOGS OR TO USER! #####
