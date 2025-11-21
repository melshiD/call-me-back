# Raindrop Backend Architecture
**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** #raindrop #cloudflare-workers #microservices #architecture

---

## Quick Reference

### Essential Commands
```bash
# Check deployment status
raindrop build status

# View real-time logs
raindrop logs tail -n 100 --application call-me-back

# Deploy backend (after code changes)
raindrop build deploy

# Validate manifest
raindrop build validate

# Set environment secret
raindrop build env set env:SECRET_NAME "value"

# Set all secrets at once
./set-all-secrets.sh
```

### Service Architecture at a Glance
```
api-gateway (PUBLIC) → 10 private services + 1 MCP service
├─ auth-manager (authentication)
├─ call-orchestrator (Twilio calls)
├─ persona-manager (AI personalities)
├─ database-proxy (PostgreSQL bridge)
├─ payment-processor (Stripe)
├─ webhook-handler (external events)
├─ voice-pipeline (WebSocket audio)
├─ admin-dashboard (admin UI)
├─ cost-analytics (cost tracking)
├─ log-aggregator (MCP - log ingestion)
└─ conversation-memory, call-transcripts, KV caches
```

---

## Table of Contents

1. [Why Raindrop?](#1-why-raindrop)
2. [Application Overview](#2-application-overview)
3. [Services (10 + 1 MCP)](#3-services-10--1-mcp)
4. [Resources](#4-resources)
5. [Environment Variables](#5-environment-variables)
6. [Service-to-Service Communication](#6-service-to-service-communication)
7. [Deployment](#7-deployment)
8. [Limitations & Workarounds](#8-limitations--workarounds)
9. [Multi-Cloud Architecture](#9-multi-cloud-architecture)
10. [Development Workflow](#10-development-workflow)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Why Raindrop?

### What is Raindrop?

Raindrop is a **serverless application platform** built on **Cloudflare Workers** with:
- **Instant global deployment** (Cloudflare's edge network)
- **Automatic scaling** (0 to millions of requests)
- **Unified memory system** (SmartMemory, SmartSQL, SmartBuckets)
- **AI-native resources** (embeddings, semantic search, natural language queries)
- **Service-to-service bindings** (type-safe internal communication)

### Why We Chose Raindrop for Call Me Back

**Requirements:**
- Real-time voice processing with <3s response latency
- AI inference (Cerebras) with conversation context
- Call orchestration (Twilio) with payment processing (Stripe)
- User authentication with JWT tokens
- Call history and transcript storage
- Scheduled calls (cron jobs)
- Cost tracking across 5 external APIs

**Raindrop Advantages:**
1. ✅ **Global Edge Network** - Low latency for API calls from anywhere
2. ✅ **Automatic Scaling** - Handles spiky call volume (no server management)
3. ✅ **SmartMemory** - Conversation context during calls without Redis/database queries
4. ✅ **SmartBuckets** - Transcript storage with semantic search
5. ✅ **SmartSQL** - Structured data with automatic PII detection (though we use PostgreSQL instead)
6. ✅ **Service Isolation** - Clean separation of concerns (auth, calls, personas, payments)
7. ✅ **Type Safety** - Generated TypeScript types from manifest
8. ✅ **Unified Deployment** - Single command deploys all services

**Trade-offs:**
- ❌ **No outbound WebSockets** - Forced voice pipeline to Vultr VPS
- ❌ **No direct external URLs** - Created database-proxy pattern for PostgreSQL
- ❌ **Limited SQL features** - SmartSQL too limited, migrated to PostgreSQL on Vultr
- ❌ **Environment variable caching** - Secrets persist across deployments (need support to reset)
- ❌ **Deployment time** - 2-3 minutes per deploy vs instant with traditional servers

---

## 2. Application Overview

### Architecture Pattern: API Gateway + Microservices

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL CLIENTS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Frontend   │  │    Twilio    │  │    Stripe    │         │
│  │   (Vercel)   │  │  (Webhooks)  │  │  (Webhooks)  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │ HTTPS            │ HTTPS            │ HTTPS
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               RAINDROP (Cloudflare Workers)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ api-gateway (PUBLIC SERVICE)                            │   │
│  │   Hono.js router, JWT auth, CORS, rate limiting        │   │
│  │   Routes:                                               │   │
│  │   - POST /api/auth/register                            │   │
│  │   - POST /api/auth/login                               │   │
│  │   - GET  /api/personas                                 │   │
│  │   - POST /api/calls/trigger                            │   │
│  │   - GET  /api/calls/history                            │   │
│  │   - POST /api/voice/twiml (Twilio callback)            │   │
│  └─────────────────┬───────────────────────────────────────┘   │
│                    │ Internal Worker-to-Worker calls            │
│                    │ (NO external HTTP!)                        │
│   ┌────────────────┼────────────────────────────────────┐      │
│   │  PRIVATE SERVICES                                    │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ auth-manager                                 │   │      │
│   │  │   bcrypt, JWT, token blacklist               │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ persona-manager                              │   │      │
│   │  │   Persona CRUD, favorites, relationships     │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ call-orchestrator                            │   │      │
│   │  │   Twilio calls, scheduled calls, TwiML       │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ database-proxy ⭐ CRITICAL                   │   │      │
│   │  │   Bridges Workers to Vultr PostgreSQL        │   │      │
│   │  │   (Only service that makes external calls)   │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ payment-processor                            │   │      │
│   │  │   Stripe integration (not fully implemented) │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ webhook-handler                              │   │      │
│   │  │   Twilio/Stripe webhooks with verification   │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ admin-dashboard                              │   │      │
│   │  │   Admin UI for user/persona management       │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ cost-analytics                               │   │      │
│   │  │   Cost tracking and aggregation              │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ voice-pipeline (PLACEHOLDER - runs on Vultr) │   │      │
│   │  │   Would handle WebSockets if Workers allowed │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   │  ┌──────────────────────────────────────────────┐   │      │
│   │  │ log-aggregator (MCP SERVICE - PUBLIC)        │   │      │
│   │  │   Model Context Protocol for log ingestion   │   │      │
│   │  └──────────────────────────────────────────────┘   │      │
│   └──────────────────────────────────────────────────────┘      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ RESOURCES                                               │   │
│  │  - SmartSQL: call-me-back-db (unused, see PostgreSQL)  │   │
│  │  - SmartMemory: conversation-memory                     │   │
│  │  - SmartBucket: call-transcripts, call-me-back-logs     │   │
│  │  - KV Cache: token-blacklist, rate-limit-cache          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Problem:** Cloudflare Workers have strict limitations:
- ❌ Cannot fetch external IP addresses directly
- ❌ Cannot establish outbound WebSocket connections
- ❌ Cannot call external URLs from most Workers

**Solution:** Service-to-Service Communication Pattern
1. **api-gateway** is the ONLY public entry point
2. **All other services** are private (visibility = "private")
3. **Services call each other** via `this.env.SERVICE_NAME.method()`
4. **Only database-proxy** makes external HTTPS calls (to Vultr PostgreSQL)
5. **Voice pipeline** runs on Vultr VPS (can't run in Workers due to WebSocket limitation)

**Benefits:**
- ✅ Clean separation of concerns (each service has one job)
- ✅ Type-safe service calls (TypeScript auto-completion)
- ✅ No external HTTP calls except database-proxy (bypasses Worker restrictions)
- ✅ Isolated failure domains (one service crash doesn't kill others)
- ✅ Easy testing (mock env.SERVICE_NAME for unit tests)

---

## 3. Services (10 + 1 MCP)

### 3.1 api-gateway (PUBLIC)

**Purpose:** Entry point for all HTTP requests

**Visibility:** `public`

**Technology:** Hono.js (Express-like router for Workers)

**Responsibilities:**
- Route HTTP requests to appropriate services
- Validate JWT tokens (via auth-manager)
- CORS handling (corsAllowAll for frontend)
- Rate limiting (via rate-limit-cache KV)
- Input validation (Zod schemas)
- Error formatting

**Key Routes:**
```typescript
// Authentication
POST /api/auth/register → auth-manager.register()
POST /api/auth/login → auth-manager.login()
POST /api/auth/logout → auth-manager.logout()

// Personas
GET  /api/personas → persona-manager.getPersonas()
POST /api/personas → persona-manager.createPersona()
PUT  /api/personas/:id → persona-manager.updatePersona()

// Calls
POST /api/calls/trigger → call-orchestrator.triggerCall()
GET  /api/calls/history → call-orchestrator.getCallHistory()
POST /api/calls/schedule → call-orchestrator.scheduleCall()

// Voice (Twilio callbacks)
POST /api/voice/twiml → webhook-handler.generateTwiML()
POST /api/voice/status → webhook-handler.handleCallStatus()

// Payments (Stripe webhooks)
POST /api/payments/webhook → webhook-handler.handleStripeWebhook()
```

**Example Code:**
```typescript
// src/api-gateway/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const app = new Hono<{ Bindings: Env }>();

    // CORS (required for frontend)
    app.use('/*', cors({
      origin: ['https://call-me-back.vercel.app'],
      credentials: true,
    }));

    // Authentication endpoints
    app.post('/api/auth/register', async (c) => {
      const body = await c.req.json();
      const result = await c.env.AUTH_MANAGER.register(
        body.email,
        body.password,
        body.name
      );
      return c.json(result);
    });

    // Persona endpoints
    app.get('/api/personas', async (c) => {
      const personas = await c.env.PERSONA_MANAGER.getPersonas();
      return c.json({ personas });
    });

    // Call endpoints
    app.post('/api/calls/trigger', async (c) => {
      const token = c.req.header('Authorization')?.replace('Bearer ', '');
      const user = await c.env.AUTH_MANAGER.validateToken(token);

      const body = await c.req.json();
      const call = await c.env.CALL_ORCHESTRATOR.triggerCall(
        user.id,
        body.personaId,
        body.phoneNumber
      );

      return c.json(call);
    });

    return app.fetch(request, { env: this.env });
  }
}
```

**Deployment URL:** `https://svc-XXXXX.lmapp.run` (changes with each deploy)

---

### 3.2 auth-manager (PRIVATE)

**Purpose:** User authentication and authorization

**Visibility:** `private`

**Responsibilities:**
- User registration (bcrypt password hashing)
- User login (JWT generation)
- Token validation (JWT verification)
- Token revocation (logout, blacklist)
- Password reset (not yet implemented)

**Key Methods:**
```typescript
class AuthManager extends Service<Env> {
  async register(email: string, password: string, name: string): Promise<User>;
  async login(email: string, password: string): Promise<{ token: string, user: User }>;
  async validateToken(token: string): Promise<User>;
  async logout(token: string): Promise<void>;
  async refreshToken(token: string): Promise<string>;
}
```

**JWT Structure:**
```json
{
  "jti": "unique_token_id",
  "sub": "user_123",
  "email": "user@example.com",
  "iat": 1700000000,
  "exp": 1700604800  // 7 days
}
```

**Token Blacklist:**
- Stored in `token-blacklist` KV cache
- Key: `jti` (token ID)
- Value: `{ userId, expiresAt }`
- TTL: Matches token expiration

**Usage Example:**
```typescript
// In api-gateway
const token = c.req.header('Authorization')?.replace('Bearer ', '');
const user = await c.env.AUTH_MANAGER.validateToken(token);

if (!user) {
  return c.json({ error: 'Unauthorized' }, 401);
}

// user.id, user.email available for subsequent calls
```

---

### 3.3 persona-manager (PRIVATE)

**Purpose:** Manage AI personas (Brad, Sarah, Alex, custom)

**Visibility:** `private`

**Responsibilities:**
- Get all personas (active only)
- Create custom personas
- Update persona settings (voice, system prompt)
- Mark personas as favorites
- User-persona relationships
- Load personas from database (via database-proxy)

**Key Methods:**
```typescript
class PersonaManager extends Service<Env> {
  async getPersonas(): Promise<Persona[]>;
  async getPersona(id: string): Promise<Persona>;
  async createPersona(data: CreatePersonaData): Promise<Persona>;
  async updatePersona(id: string, data: UpdatePersonaData): Promise<Persona>;
  async deletePersona(id: string): Promise<void>;
  async getUserPersonaRelationship(userId: string, personaId: string): Promise<UserPersonaRelationship>;
  async updateUserPersonaRelationship(userId: string, personaId: string, data: any): Promise<void>;
}
```

**Persona Structure:**
```typescript
interface Persona {
  id: string;
  name: string;
  description: string;
  core_system_prompt: string;
  default_voice_id: string;  // ElevenLabs voice ID
  default_voice_settings: {
    stability: number;         // 0.0-1.0
    similarity_boost: number;  // 0.0-1.0
    speed: number;            // 0.5-2.0
    style: number;            // 0.0-1.0
  };
  avatar_url: string;
  category: string;
  is_active: boolean;
  created_at: string;
}
```

**Database Access:**
```typescript
// persona-manager calls database-proxy
async getPersonas(): Promise<Persona[]> {
  const rows = await this.env.DATABASE_PROXY.executeQuery(
    'SELECT * FROM personas WHERE is_active = true ORDER BY created_at DESC',
    []
  );

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    // ... map other fields
  }));
}
```

---

### 3.4 call-orchestrator (PRIVATE)

**Purpose:** Orchestrate phone calls via Twilio

**Visibility:** `private`

**Responsibilities:**
- Trigger immediate calls
- Schedule future calls
- Generate TwiML (Twilio Markup Language)
- Track call status (initiated, in_progress, completed, failed)
- Deduct user credits
- Update call records in database

**Key Methods:**
```typescript
class CallOrchestrator extends Service<Env> {
  async triggerCall(userId: string, personaId: string, phoneNumber: string): Promise<Call>;
  async scheduleCall(userId: string, personaId: string, phoneNumber: string, scheduledTime: Date): Promise<ScheduledCall>;
  async getCallHistory(userId: string, limit: number, offset: number): Promise<Call[]>;
  async getCall(callId: string): Promise<Call>;
  async updateCallStatus(callId: string, status: string): Promise<void>;
}
```

**Call Flow:**
```typescript
// 1. User triggers call from frontend
async triggerCall(userId, personaId, phoneNumber) {
  // 1. Check user credits
  const credits = await this.env.DATABASE_PROXY.executeQuery(
    'SELECT available_credits FROM user_credits WHERE user_id = $1',
    [userId]
  );

  if (credits.rows[0].available_credits < 5) {
    throw new Error('Insufficient credits');
  }

  // 2. Create call record in database
  const callId = generateId();
  await this.env.DATABASE_PROXY.executeQuery(
    'INSERT INTO calls (id, user_id, persona_id, phone_number, status) VALUES ($1, $2, $3, $4, $5)',
    [callId, userId, personaId, phoneNumber, 'initiating']
  );

  // 3. Call Twilio API to initiate call
  const twilioResponse = await fetch('https://api.twilio.com/2010-04-01/Accounts/{sid}/Calls.json', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(this.env.TWILIO_ACCOUNT_SID + ':' + this.env.TWILIO_AUTH_TOKEN),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      To: phoneNumber,
      From: this.env.TWILIO_PHONE_NUMBER,
      Url: `https://api.your-domain.com/api/voice/twiml?callId=${callId}`
    })
  });

  const twilioData = await twilioResponse.json();

  // 4. Update call with Twilio SID
  await this.env.DATABASE_PROXY.executeQuery(
    'UPDATE calls SET twilio_call_sid = $1, status = $2 WHERE id = $3',
    [twilioData.sid, 'calling', callId]
  );

  return { callId, status: 'calling', twilioCallSid: twilioData.sid };
}

// 2. Twilio requests TwiML (via webhook-handler)
async generateTwiML(callId: string): Promise<string> {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://voice.ai-tools-marketplace.io/stream?callId=${callId}" />
  </Connect>
</Response>`;
}

// 3. Voice pipeline on Vultr handles WebSocket connection
// 4. After call ends, webhook updates status
async updateCallStatus(callId: string, status: string, duration: number) {
  await this.env.DATABASE_PROXY.executeQuery(
    'UPDATE calls SET status = $1, duration_seconds = $2, end_time = NOW() WHERE id = $3',
    [status, duration, callId]
  );
}
```

---

### 3.5 database-proxy (PRIVATE) ⭐ CRITICAL

**Purpose:** Bridge Cloudflare Workers to Vultr PostgreSQL

**Visibility:** `private`

**Why It Exists:**
- Cloudflare Workers **cannot fetch external URLs** (Error 1003)
- Need to access PostgreSQL on Vultr (144.202.15.249)
- Solution: Create dedicated Worker that makes external calls
- All other services call database-proxy via internal Worker-to-Worker communication

**Key Methods:**
```typescript
class DatabaseProxy extends Service<Env> {
  async executeQuery(query: string, parameters: any[]): Promise<QueryResult>;
  async getPersonas(): Promise<any[]>;
  async createPersona(data: any): Promise<any>;
  async getUser(userId: string): Promise<any>;
  async createUser(data: any): Promise<any>;
  // ... specific query methods for common operations
}
```

**Implementation:**
```typescript
// src/database-proxy/index.ts
export default class extends Service<Env> {
  async executeQuery(query: string, parameters: any[]): Promise<QueryResult> {
    const dbConfig = {
      apiUrl: 'https://db.ai-tools-marketplace.io',
      apiKey: this.env.VULTR_DB_API_KEY
    };

    // THIS service makes the external HTTPS call
    const response = await fetch(`${dbConfig.apiUrl}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dbConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, parameters })
    });

    if (!response.ok) {
      throw new Error(`Database query failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPersonas(): Promise<any[]> {
    const result = await this.executeQuery(
      'SELECT * FROM personas WHERE is_active = true ORDER BY created_at DESC',
      []
    );
    return result.rows;
  }
}
```

**Usage in Other Services:**
```typescript
// In persona-manager
async getPersonas(): Promise<Persona[]> {
  // Call database-proxy via internal Worker-to-Worker communication
  // NO external HTTP call!
  const rows = await this.env.DATABASE_PROXY.getPersonas();

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    // ... map fields
  }));
}
```

**Why This Pattern:**
1. ✅ Only ONE service (database-proxy) makes external calls
2. ✅ All other services use internal Worker-to-Worker communication
3. ✅ Completely bypasses Cloudflare's external URL restrictions
4. ✅ Centralized database logic (easier debugging)
5. ✅ Can add query logging, caching, etc. in one place

**Reference:** See `documentation/domain/database.md` for PostgreSQL details

---

### 3.6 payment-processor (PRIVATE)

**Purpose:** Handle payments via Stripe

**Visibility:** `private`

**Status:** Partially implemented (Stripe integration exists but pricing logic incomplete)

**Responsibilities:**
- Create payment intents (pre-authorization)
- Capture payments after call completion
- Refund overpayments
- Track payment status
- Handle subscription billing (future)

**Key Methods:**
```typescript
class PaymentProcessor extends Service<Env> {
  async createPaymentIntent(userId: string, estimatedCostCents: number): Promise<PaymentIntent>;
  async capturePayment(callId: string, actualCostCents: number): Promise<void>;
  async refundPayment(callId: string, amountCents: number): Promise<void>;
  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus>;
}
```

**Pricing Logic (2025):**
```typescript
// Base cost + per-minute cost
const baseCost = 25;  // $0.25
const perMinuteCost = 40;  // $0.40/min

const estimatedCostCents = baseCost + (estimatedMinutes * perMinuteCost);

// Component costs (for call_cost_breakdowns table):
// - Twilio: $0.0130/min
// - Deepgram: $0.0043/min
// - Cerebras: $0.10/1M tokens
// - ElevenLabs: $0.15/1K characters
```

**Payment Flow:**
```typescript
// 1. User triggers call
const paymentIntent = await this.env.PAYMENT_PROCESSOR.createPaymentIntent(
  userId,
  estimatedCostCents
);

// 2. Store payment_intent_id in calls table
await this.env.DATABASE_PROXY.executeQuery(
  'UPDATE calls SET payment_intent_id = $1, payment_status = $2 WHERE id = $3',
  [paymentIntent.id, 'pending', callId]
);

// 3. After call ends, capture actual cost
await this.env.PAYMENT_PROCESSOR.capturePayment(
  callId,
  actualCostCents
);

// 4. Refund if overcharged
if (actualCostCents < estimatedCostCents) {
  await this.env.PAYMENT_PROCESSOR.refundPayment(
    callId,
    estimatedCostCents - actualCostCents
  );
}
```

**Note:** Pricing strategy still needs implementation (see `API_COSTS_AND_PROFITABILITY_2025.md`)

---

### 3.7 webhook-handler (PRIVATE)

**Purpose:** Process webhooks from external services (Twilio, Stripe)

**Visibility:** `private`

**Responsibilities:**
- Verify webhook signatures (security)
- Process Twilio call status updates
- Process Stripe payment events
- Generate TwiML for Twilio
- Update database records asynchronously

**Key Methods:**
```typescript
class WebhookHandler extends Service<Env> {
  async handleTwilioWebhook(request: Request): Promise<Response>;
  async handleStripeWebhook(request: Request): Promise<Response>;
  async generateTwiML(callId: string): Promise<string>;
  async updateCallStatus(callId: string, status: string, duration: number): Promise<void>;
}
```

**Twilio Webhook Flow:**
```typescript
async handleTwilioWebhook(request: Request): Promise<Response> {
  // 1. Verify Twilio signature
  const signature = request.headers.get('X-Twilio-Signature');
  const valid = verifyTwilioSignature(signature, request.url, await request.text());

  if (!valid) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Parse form data
  const formData = await request.formData();
  const callSid = formData.get('CallSid');
  const callStatus = formData.get('CallStatus');
  const duration = parseInt(formData.get('CallDuration') || '0');

  // 3. Update database
  await this.env.DATABASE_PROXY.executeQuery(
    'UPDATE calls SET status = $1, duration_seconds = $2 WHERE twilio_call_sid = $3',
    [callStatus, duration, callSid]
  );

  // 4. If call completed, trigger payment capture
  if (callStatus === 'completed') {
    const call = await this.env.DATABASE_PROXY.executeQuery(
      'SELECT id, payment_intent_id, estimated_cost_cents FROM calls WHERE twilio_call_sid = $1',
      [callSid]
    );

    // Calculate actual cost based on duration
    const actualCostCents = 25 + Math.ceil(duration / 60) * 40;

    await this.env.PAYMENT_PROCESSOR.capturePayment(
      call.rows[0].id,
      actualCostCents
    );
  }

  return new Response('OK', { status: 200 });
}
```

**Stripe Webhook Flow:**
```typescript
async handleStripeWebhook(request: Request): Promise<Response> {
  // 1. Verify Stripe signature
  const signature = request.headers.get('Stripe-Signature');
  const body = await request.text();

  const event = verifyStripeSignature(body, signature, this.env.STRIPE_WEBHOOK_SECRET);

  if (!event) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await this.handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await this.handlePaymentFailure(event.data.object);
      break;
    case 'customer.subscription.created':
      await this.handleSubscriptionCreated(event.data.object);
      break;
    // ... other events
  }

  return new Response('OK', { status: 200 });
}
```

---

### 3.8 admin-dashboard (PRIVATE)

**Purpose:** Admin UI for managing users, personas, and viewing analytics

**Visibility:** `private`

**Status:** Recently added (2025-11-17)

**Responsibilities:**
- User management (view, edit, delete)
- Persona management (create, edit, delete)
- Call analytics (volume, costs, revenue)
- Cost tracking dashboard
- Admin authentication (separate from user auth)

**Key Methods:**
```typescript
class AdminDashboard extends Service<Env> {
  async fetch(request: Request): Promise<Response>;
  // Hono routes for admin UI
}
```

**Admin Authentication:**
- Separate admin users table (`migrations/009_create_admin_users.sql`)
- Admin token stored in `.admin-token` file (gitignored)
- Token passed via `Authorization: Bearer <token>` header

**Admin Routes:**
```typescript
// User management
GET  /admin/users
POST /admin/users/:id/ban
POST /admin/users/:id/unban

// Persona management
GET  /admin/personas
POST /admin/personas
PUT  /admin/personas/:id
DELETE /admin/personas/:id

// Analytics
GET  /admin/analytics/calls
GET  /admin/analytics/revenue
GET  /admin/analytics/costs
```

**Security:**
- Admin dashboard is PRIVATE (not accessible from internet)
- Requires admin token validation
- Separate from user authentication
- Can only be accessed via `raindrop logs tail` or internal calls

---

### 3.9 cost-analytics (PRIVATE)

**Purpose:** Aggregate and analyze costs across all API calls

**Visibility:** `private`

**Responsibilities:**
- Track costs per call (Twilio, Deepgram, Cerebras, ElevenLabs)
- Aggregate costs by day/week/month
- Calculate profit margins
- Generate cost reports
- Cost projections

**Key Methods:**
```typescript
class CostAnalytics extends Service<Env> {
  async recordCallCost(callId: string, breakdown: CostBreakdown): Promise<void>;
  async getCostsByDateRange(startDate: Date, endDate: Date): Promise<CostReport>;
  async getCostsByService(service: string): Promise<ServiceCostReport>;
  async getProfitability(): Promise<ProfitabilityReport>;
}
```

**Cost Breakdown Structure:**
```typescript
interface CostBreakdown {
  twilio_cost_cents: number;
  deepgram_cost_cents: number;
  cerebras_cost_cents: number;
  elevenlabs_cost_cents: number;
  total_cost_cents: number;

  // Usage metrics
  twilio_duration_seconds: number;
  deepgram_audio_seconds: number;
  cerebras_input_tokens: number;
  cerebras_output_tokens: number;
  elevenlabs_characters: number;
}
```

**Usage Example:**
```typescript
// After call completes
await this.env.COST_ANALYTICS.recordCallCost(callId, {
  twilio_cost_cents: 6.50,
  deepgram_cost_cents: 2.15,
  cerebras_cost_cents: 0.08,
  elevenlabs_cost_cents: 4.50,
  total_cost_cents: 13.23,

  twilio_duration_seconds: 300,
  deepgram_audio_seconds: 300,
  cerebras_input_tokens: 800,
  cerebras_output_tokens: 1200,
  elevenlabs_characters: 300
});
```

**Reference:** See `documentation/domain/cost-tracking.md` (to be created)

---

### 3.10 voice-pipeline (PRIVATE - PLACEHOLDER)

**Purpose:** Handle real-time voice processing (STT → AI → TTS)

**Visibility:** `private`

**Status:** **RUNS ON VULTR VPS** (not in Raindrop Workers)

**Why Not in Raindrop:**
- Cloudflare Workers **cannot establish outbound WebSocket connections**
- Voice pipeline needs to connect to:
  - Deepgram (STT) via WebSocket
  - ElevenLabs (TTS) via WebSocket
  - Twilio (media stream) via WebSocket (inbound)

**Actual Implementation:**
- Lives in `voice-pipeline-nodejs/` directory
- Runs on Vultr VPS (144.202.15.249:8080)
- Managed by PM2
- Accessible via `https://voice.ai-tools-marketplace.io` (Caddy reverse proxy)

**Placeholder Service in Raindrop:**
```typescript
// src/voice-pipeline/index.ts
// This service exists in manifest but doesn't run in Workers
// It's a placeholder for potential future migration if Workers add WebSocket support
export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Voice pipeline runs on Vultr VPS', { status: 501 });
  }
}
```

**Reference:** See `documentation/domain/voice-pipeline.md` for actual implementation

---

### 3.11 log-aggregator (MCP SERVICE - PUBLIC)

**Purpose:** Model Context Protocol (MCP) service for log ingestion

**Visibility:** `public` (temporarily, will add OAuth later)

**What is MCP:**
- Model Context Protocol - Standard for AI model integrations
- Allows external services to query/write logs
- Provides structured data access for AI agents

**Responsibilities:**
- Ingest logs from Raindrop services
- Store logs in `call-me-back-logs` SmartBucket
- Provide query interface for log retrieval
- OAuth authentication (disabled for testing)

**Configuration:**
```hcl
mcp_service "log-aggregator" {
  visibility = "public"
  # Temporarily public for testing - will re-enable OAuth after verification
  # authorization_server = "https://giving-hay-85-staging.authkit.app"
}
```

**Key Methods:**
```typescript
class LogAggregator extends MCPService<Env> {
  async ingestLog(log: LogEntry): Promise<void>;
  async queryLogs(filters: LogFilters): Promise<LogEntry[]>;
  async getLogStats(): Promise<LogStats>;
}
```

**Log Entry Structure:**
```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  metadata: Record<string, any>;
}
```

**Usage Example:**
```typescript
// In any service
await this.env.LOG_AGGREGATOR.ingestLog({
  timestamp: new Date().toISOString(),
  level: 'info',
  service: 'call-orchestrator',
  message: 'Call triggered successfully',
  metadata: {
    callId: 'call_12345',
    userId: 'user_123',
    personaId: 'brad'
  }
});
```

**Security Note:**
- Currently PUBLIC for testing
- Will add OAuth via WorkOS in production
- See `OAUTH_SESSION_LOG.md` for OAuth implementation details

---

## 4. Resources

### 4.1 SmartSQL: call-me-back-db

**Type:** SmartSQL (SQLite-based relational database)

**Status:** **UNUSED** (we use PostgreSQL on Vultr instead)

**Why Unused:**
- SmartSQL lacks PostgreSQL features (JSONB, triggers, advanced functions)
- Migration to Vultr PostgreSQL completed 2025-11-14
- Kept in manifest for potential future use if SmartSQL adds PostgreSQL support

**Configuration:**
```hcl
smartsql "call-me-back-db" {
}
```

**Access Pattern (if we used it):**
```typescript
import { executeSQL } from '@liquidmetal-ai/raindrop-framework/core/smartsql';

const result = await executeSQL(
  this.env.CALL_ME_BACK_DB,
  'SELECT * FROM personas',
  []
);
```

**Reference:** See `documentation/domain/database.md` for actual PostgreSQL setup

---

### 4.2 SmartMemory: conversation-memory

**Type:** SmartMemory (Semantic memory system)

**Purpose:** Store conversation context during active calls

**Configuration:**
```hcl
smartmemory "conversation-memory" {
}
```

**Use Cases:**
1. **Call Initialization** - Store user preferences, persona settings
2. **Conversation History** - Track last N messages for context
3. **State Management** - Track call status, current topic, user sentiment
4. **Handoff Data** - Pass context between services

**Access Pattern:**
```typescript
import { getMemory, putMemory } from '@liquidmetal-ai/raindrop-framework/core/smartmemory';

// Start call - create memory session
const sessionId = `call_${callId}`;
await putMemory(this.env.CONVERSATION_MEMORY, sessionId, 'persona', {
  name: 'Brad',
  systemPrompt: 'You are Brad, a friendly gym bro...',
  voiceId: 'brad_voice_id'
});

// During call - retrieve context
const persona = await getMemory(this.env.CONVERSATION_MEMORY, sessionId, 'persona');
const history = await getMemory(this.env.CONVERSATION_MEMORY, sessionId, 'conversation_history');

// Add new message
await putMemory(this.env.CONVERSATION_MEMORY, sessionId, 'conversation_history', [
  ...history,
  { role: 'user', content: 'Hey Brad, how are you?' },
  { role: 'assistant', content: 'Hey bro! Doing great, just crushed leg day!' }
]);

// End call - cleanup
await deleteMemory(this.env.CONVERSATION_MEMORY, sessionId);
```

**Benefits:**
- ✅ Fast in-memory access (no database queries during call)
- ✅ Semantic search capabilities
- ✅ Automatic cleanup after session ends
- ✅ Shared across services (voice-pipeline, call-orchestrator)

---

### 4.3 SmartBucket: call-transcripts

**Type:** SmartBucket (AI-powered object storage)

**Purpose:** Store call transcripts with semantic search

**Configuration:**
```hcl
smartbucket "call-transcripts" {
}
```

**Use Cases:**
1. **Transcript Storage** - Save full conversation after call ends
2. **Semantic Search** - Find calls by topic, sentiment, keywords
3. **Analytics** - Analyze conversation patterns
4. **Compliance** - Retain records for legal/regulatory requirements

**Access Pattern:**
```typescript
import { putObject, getObject, searchDocuments } from '@liquidmetal-ai/raindrop-framework/core/smartbucket';

// Store transcript after call
await putObject(this.env.CALL_TRANSCRIPTS, `transcripts/${callId}.json`, {
  callId: callId,
  userId: userId,
  personaId: personaId,
  startTime: startTime,
  endTime: endTime,
  transcript: [
    { timestamp: '00:00:05', speaker: 'user', text: 'Hey Brad, how are you?' },
    { timestamp: '00:00:07', speaker: 'brad', text: 'Hey bro! Doing great!' }
  ]
});

// Retrieve transcript
const transcript = await getObject(this.env.CALL_TRANSCRIPTS, `transcripts/${callId}.json`);

// Semantic search
const results = await searchDocuments(this.env.CALL_TRANSCRIPTS, {
  query: 'workout advice',
  limit: 10
});
```

**Cleanup Policy:**
- Transcripts stored for 90 days
- After 90 days, moved to cold storage or deleted (per user settings)
- Compliance requirements may override (e.g., financial advice calls = 7 years)

---

### 4.4 SmartBucket: call-me-back-logs

**Type:** SmartBucket (AI-powered object storage)

**Purpose:** Centralized log storage

**Configuration:**
```hcl
smartbucket "call-me-back-logs" {
}
```

**Use Cases:**
1. **Application Logs** - Store structured logs from all services
2. **Error Tracking** - Centralize error reports
3. **Audit Trail** - Track admin actions, payment events
4. **Debugging** - Query logs by service, time range, log level

**Access Pattern:**
```typescript
// Write log
await putObject(this.env.CALL_ME_BACK_LOGS, `logs/${date}/${service}/${timestamp}.json`, {
  timestamp: new Date().toISOString(),
  level: 'info',
  service: 'call-orchestrator',
  message: 'Call triggered',
  metadata: { callId, userId, personaId }
});

// Query logs
const logs = await searchDocuments(this.env.CALL_ME_BACK_LOGS, {
  query: 'error',
  filters: {
    service: 'call-orchestrator',
    level: 'error',
    date: '2025-11-21'
  },
  limit: 100
});
```

**Integration with log-aggregator MCP:**
- log-aggregator service writes to this bucket
- Provides query interface for external tools
- Can be accessed by monitoring/alerting systems

---

### 4.5 KV Cache: token-blacklist

**Type:** KV Cache (Fast key-value storage)

**Purpose:** JWT token revocation (logout functionality)

**Configuration:**
```hcl
kv_cache "token-blacklist" {
}
```

**Use Cases:**
1. **Logout** - Revoke token when user logs out
2. **Security** - Revoke compromised tokens
3. **Password Reset** - Invalidate all existing tokens

**Access Pattern:**
```typescript
// Add token to blacklist (logout)
await this.env.TOKEN_BLACKLIST.put(
  tokenId,  // jti from JWT
  JSON.stringify({
    userId: userId,
    expiresAt: expiresAt,
    revokedAt: new Date().toISOString()
  }),
  { expirationTtl: 7 * 24 * 60 * 60 }  // 7 days (match token expiry)
);

// Check if token is blacklisted (on every auth request)
const blacklisted = await this.env.TOKEN_BLACKLIST.get(tokenId);
if (blacklisted) {
  throw new Error('Token has been revoked');
}

// Cleanup happens automatically via TTL
```

**Performance:**
- ✅ Sub-millisecond reads (Cloudflare KV is globally distributed)
- ✅ Automatic expiration (no manual cleanup needed)
- ✅ Scales to millions of tokens

---

### 4.6 KV Cache: rate-limit-cache

**Type:** KV Cache (Fast key-value storage)

**Purpose:** Rate limiting per user/IP

**Configuration:**
```hcl
kv_cache "rate-limit-cache" {
}
```

**Use Cases:**
1. **API Rate Limiting** - Prevent abuse (e.g., 100 requests/min per user)
2. **Call Rate Limiting** - Limit calls per day (e.g., 10 calls/day for free tier)
3. **Brute Force Protection** - Block IPs after failed login attempts

**Access Pattern:**
```typescript
// Check rate limit
const key = `ratelimit:${userId}:${endpoint}`;
const current = await this.env.RATE_LIMIT_CACHE.get(key);

if (current && parseInt(current) >= 100) {
  throw new Error('Rate limit exceeded: 100 requests per minute');
}

// Increment counter
await this.env.RATE_LIMIT_CACHE.put(
  key,
  String((parseInt(current || '0') + 1)),
  { expirationTtl: 60 }  // Reset after 1 minute
);

// Allow request
```

**Rate Limits (2025):**
- **Free Tier:** 3 calls/day, 100 API requests/hour
- **Basic Tier:** 10 calls/day, 500 API requests/hour
- **Premium Tier:** 50 calls/day, unlimited API requests
- **Unlimited Tier:** Unlimited calls, unlimited API requests

---

## 5. Environment Variables

### Secret Management

**Critical Rule:** Secrets are **persistent** across deployments
- Once set, they remain until manually changed
- `raindrop build generate` does **NOT** reset secrets
- Use `./set-all-secrets.sh` to set all secrets at once

**Setting Secrets:**
```bash
# Single secret
raindrop build env set env:SECRET_NAME "value"

# All secrets at once
./set-all-secrets.sh

# Verify secrets (shows if set, not values)
raindrop build env list
```

### Required Secrets

**Authentication:**
```bash
env "JWT_SECRET" {
  secret = true
}
# Example: openssl rand -hex 32
```

**Database:**
```bash
env "VULTR_DB_API_URL" {
  secret = true
}
# Example: "https://db.ai-tools-marketplace.io"

env "VULTR_DB_API_KEY" {
  secret = true
}
# Example: "bearer_token_from_vultr_setup"
```

**Twilio:**
```bash
env "TWILIO_ACCOUNT_SID" {
  secret = true
}
# Example: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

env "TWILIO_AUTH_TOKEN" {
  secret = true
}
# Example: "auth_token_from_twilio_console"

env "TWILIO_PHONE_NUMBER" {
  default = "+17622526613"
}
```

**AI Services:**
```bash
env "ELEVENLABS_API_KEY" {
  secret = true
}
# Example: "sk_xxxxxxxxxxxxxxxxxxxxxxxx"

env "CEREBRAS_API_KEY" {
  secret = true
}
# Example: "csk-xxxxxxxxxxxxxxxxxxxxxxxx"

env "DEEPGRAM_API_KEY" {
  secret = true
}
# Example: "xxxxxxxxxxxxxxxxxxxxxxxx"
```

**Admin:**
```bash
env "ADMIN_SECRET_TOKEN" {
  secret = true
}
# Stored in .admin-token file (gitignored)
```

**WorkOS (OAuth for MCP):**
```bash
env "WORKOS_API_KEY" {
  secret = true
}
# Example: "sk_test_xxxxxxxxxxxxxxxxxxxxxxxx"

env "WORKOS_CLIENT_ID" {
  secret = true
}
# Example: "client_xxxxxxxxxxxxxxxxxxxxxxxx"
```

**Log Aggregation:**
```bash
env "LOG_QUERY_SERVICE_URL" {
  default = "https://logs.ai-tools-marketplace.io"
}
# Non-secret (uses Caddy reverse proxy with SSL)
```

### Non-Secret Defaults

```bash
env "TWILIO_PHONE_NUMBER" {
  default = "+17622526613"
}

env "LOG_QUERY_SERVICE_URL" {
  default = "https://logs.ai-tools-marketplace.io"
}
```

---

## 6. Service-to-Service Communication

### How It Works

**Pattern:** Direct method calls via environment bindings

**Example:**
```typescript
// In api-gateway (caller)
const personas = await c.env.PERSONA_MANAGER.getPersonas();

// In persona-manager (callee)
export default class extends Service<Env> {
  async getPersonas(): Promise<Persona[]> {
    const rows = await this.env.DATABASE_PROXY.executeQuery(
      'SELECT * FROM personas WHERE is_active = true',
      []
    );
    return rows.map(row => ({ id: row.id, name: row.name, ... }));
  }
}
```

### Type Safety

**Generated Types:** `raindrop.gen.ts`
```typescript
// Auto-generated after `raindrop build generate`
interface Env {
  // Services
  AUTH_MANAGER: AuthManager;
  PERSONA_MANAGER: PersonaManager;
  CALL_ORCHESTRATOR: CallOrchestrator;
  DATABASE_PROXY: DatabaseProxy;
  PAYMENT_PROCESSOR: PaymentProcessor;
  WEBHOOK_HANDLER: WebhookHandler;
  ADMIN_DASHBOARD: AdminDashboard;
  COST_ANALYTICS: CostAnalytics;
  VOICE_PIPELINE: VoicePipeline;
  LOG_AGGREGATOR: LogAggregator;

  // Resources
  CALL_ME_BACK_DB: SmartSQL;
  CONVERSATION_MEMORY: SmartMemory;
  CALL_TRANSCRIPTS: SmartBucket;
  CALL_ME_BACK_LOGS: SmartBucket;
  TOKEN_BLACKLIST: KVNamespace;
  RATE_LIMIT_CACHE: KVNamespace;

  // Environment Variables
  JWT_SECRET: string;
  TWILIO_ACCOUNT_SID: string;
  // ... all other secrets
}
```

### Benefits of Service-to-Service

1. ✅ **No External HTTP** - Internal calls bypass Worker restrictions
2. ✅ **Type Safety** - Full TypeScript auto-completion
3. ✅ **No Network Latency** - Calls happen within Cloudflare's network
4. ✅ **Automatic Load Balancing** - Cloudflare handles routing
5. ✅ **Centralized Error Handling** - Errors propagate up the call stack

### Calling Pattern

```typescript
// ✅ CORRECT - Internal service-to-service call
const user = await this.env.AUTH_MANAGER.validateToken(token);

// ❌ WRONG - External HTTP call (will fail with Error 1003)
const response = await fetch('https://svc-xxxxx.lmapp.run/validate', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 7. Deployment

### Standard Deployment

```bash
# 1. Validate manifest
raindrop build validate

# 2. Generate types (if manifest changed)
raindrop build generate

# 3. Set secrets (if needed)
./set-all-secrets.sh

# 4. Deploy and start
raindrop build deploy

# 5. Check status
raindrop build status

# 6. View logs
raindrop logs tail -n 100 --application call-me-back
```

### Deployment Modes

**Sandbox Mode** (default after `raindrop build start`)
- Services get temporary URLs
- Use for testing before production
- Exit: `rm -f .raindrop/sandbox`

**Production Mode**
- Permanent URLs
- Use after testing is complete
- Exit sandbox first: `rm -f .raindrop/sandbox`

### Deployment Flags

```bash
# Standard deployment (creates new version)
raindrop build deploy

# Amend deployment (updates current version)
raindrop build deploy --amend

# Start services after deploy
raindrop build deploy --start

# Deploy specific services only
raindrop build deploy --services api-gateway,persona-manager
```

### Deployment Checklist

**Before Deploying:**
1. ✅ Code changes tested locally
2. ✅ Manifest validated: `raindrop build validate`
3. ✅ Types generated (if manifest changed): `raindrop build generate`
4. ✅ Secrets set: `./set-all-secrets.sh`
5. ✅ Git committed (optional but recommended)

**After Deploying:**
1. ✅ Check status: `raindrop build status`
2. ✅ Test endpoints: `curl https://svc-xxxxx.lmapp.run/health`
3. ✅ Monitor logs: `raindrop logs tail`
4. ✅ Update frontend API URL (if gateway URL changed)

### Common Deployment Issues

**Issue: "Environment variable not found"**
```bash
# Check if secrets are set
raindrop build env list

# Set missing secrets
./set-all-secrets.sh
```

**Issue: "Deployment stuck in pending"**
```bash
# Check status
raindrop build status

# Wait 2-3 minutes (deployments can take time)
# If still stuck, contact support
```

**Issue: "Type errors after manifest change"**
```bash
# Regenerate types
raindrop build generate

# Rebuild TypeScript
npm run build

# Redeploy
raindrop build deploy
```

---

## 8. Limitations & Workarounds

### Limitation 1: No Outbound WebSockets

**Problem:** Cloudflare Workers cannot establish outbound WebSocket connections

**Impact:**
- Cannot connect to Deepgram (STT) WebSocket
- Cannot connect to ElevenLabs (TTS) WebSocket
- Cannot handle bidirectional audio streaming

**Workaround:**
- Move voice pipeline to Vultr VPS (144.202.15.249)
- Run Node.js server with `ws` library
- Keep placeholder service in Raindrop manifest
- Accessible via `https://voice.ai-tools-marketplace.io`

**Reference:** See `documentation/domain/voice-pipeline.md`

---

### Limitation 2: No External URL Fetching

**Problem:** Workers cannot fetch external URLs (Error 1003)

**Impact:**
- Cannot call PostgreSQL directly from services
- Cannot call external APIs from most Workers

**Workaround:**
- Create **database-proxy** service
- Only database-proxy makes external HTTPS calls
- All other services call database-proxy internally

**Example:**
```typescript
// ❌ WRONG - External call from persona-manager
const response = await fetch('https://db.ai-tools-marketplace.io/query', {
  method: 'POST',
  body: JSON.stringify({ query: 'SELECT * FROM personas' })
});

// ✅ CORRECT - Internal call to database-proxy
const rows = await this.env.DATABASE_PROXY.getPersonas();
```

**Reference:** See `documentation/domain/database.md` for architecture

---

### Limitation 3: SmartSQL Too Limited

**Problem:** SmartSQL lacks PostgreSQL features

**Missing Features:**
- JSONB data types
- Triggers
- Advanced functions
- Window functions
- Full-text search

**Workaround:**
- Use PostgreSQL on Vultr VPS
- Access via database-proxy pattern
- Keep SmartSQL in manifest (unused, for future)

**Trade-offs:**
- ❌ Lost: Automatic PII detection
- ❌ Lost: Natural language queries
- ✅ Gained: Full PostgreSQL compatibility
- ✅ Gained: Better scalability

---

### Limitation 4: Environment Variable Caching

**Problem:** Environment variables persist across deployments

**Symptoms:**
- Changing `default` values in manifest doesn't update
- "Amend mode" preserves old values
- Even new deployments carry over cached values

**Workaround:**
- **Never** put sensitive values in `default`
- Always use `secret = true` for secrets
- Set secrets via CLI: `raindrop build env set env:SECRET_NAME "value"`
- Use `./set-all-secrets.sh` script
- Contact support to reset if needed

**Example:**
```hcl
# ❌ BAD
env "DATABASE_URL" {
  default = "https://db.example.com"  # Will cache forever
}

# ✅ GOOD
env "DATABASE_URL" {
  secret = true  # Set via CLI only
}
```

---

### Limitation 5: Deployment Time

**Problem:** Deployments take 2-3 minutes

**Impact:**
- Slower iteration compared to traditional servers
- Cannot do instant hot-reloads
- Testing changes requires full deploy

**Workaround:**
- Test logic locally first (unit tests)
- Use TypeScript compiler to catch errors early
- Batch multiple changes into one deployment
- Use `--amend` flag for quick fixes (updates current version)

**Best Practices:**
```bash
# ✅ GOOD - Test locally first
npm run test
npm run build
raindrop build validate
raindrop build deploy

# ❌ BAD - Deploy blindly and hope it works
raindrop build deploy
# ... 3 minutes later, realize typo ...
raindrop build deploy  # Another 3 minutes wasted
```

---

## 9. Multi-Cloud Architecture

### Why Multi-Cloud?

Raindrop (Cloudflare Workers) has limitations that forced us to use multiple clouds:

```
┌─────────────────────────────────────────────────────────────┐
│ CLOUDFLARE WORKERS (Raindrop)                               │
│   - API Gateway (public entry point)                        │
│   - 10 private services (auth, personas, calls, etc.)       │
│   - SmartMemory, SmartBuckets, KV caches                    │
│   - Limitations: No WebSockets, No external URLs            │
└─────────────┬───────────────────────────────────────────────┘
              │ HTTPS
              ▼
┌─────────────────────────────────────────────────────────────┐
│ VULTR VPS (144.202.15.249)                                  │
│   - PostgreSQL (full-featured database)                     │
│   - Voice Pipeline (WebSocket server for STT/TTS)           │
│   - Express DB Proxy (HTTP → PostgreSQL bridge)             │
│   - Caddy (reverse proxy with SSL)                          │
│   - Limitations: Manual scaling, server management          │
└─────────────┬───────────────────────────────────────────────┘
              │ HTTP/WebSocket
              ▼
┌─────────────────────────────────────────────────────────────┐
│ VERCEL (Frontend)                                           │
│   - Vue 3 SPA                                               │
│   - Composition API, Pinia, Vue Router                      │
│   - Vite build                                              │
│   - Limitations: None (works great for static sites)        │
└─────────────────────────────────────────────────────────────┘
```

### Component Distribution

| Component | Cloud | Reason |
|-----------|-------|--------|
| **API Gateway** | Cloudflare Workers (Raindrop) | Global edge network, auto-scaling |
| **Auth/Personas/Calls** | Cloudflare Workers (Raindrop) | Service-to-service communication |
| **PostgreSQL** | Vultr VPS | SmartSQL too limited |
| **Voice Pipeline** | Vultr VPS | Workers can't do outbound WebSockets |
| **Express DB Proxy** | Vultr VPS | Workers can't fetch external URLs |
| **Frontend** | Vercel | Static site hosting, CDN |

### Inter-Cloud Communication

**Raindrop ↔ Vultr:**
```typescript
// database-proxy service makes HTTPS call to Vultr
const response = await fetch('https://db.ai-tools-marketplace.io/query', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
  body: JSON.stringify({ query, parameters })
});
```

**Frontend ↔ Raindrop:**
```typescript
// Frontend makes HTTPS call to api-gateway
const response = await fetch('https://svc-xxxxx.lmapp.run/api/personas', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Raindrop ↔ Voice Pipeline:**
```xml
<!-- TwiML directs Twilio to Voice Pipeline WebSocket -->
<Response>
  <Connect>
    <Stream url="wss://voice.ai-tools-marketplace.io/stream?callId=123" />
  </Connect>
</Response>
```

### Deployment Coordination

**Backend (Raindrop):**
```bash
raindrop build deploy
# Takes 2-3 minutes
# Updates all 10 services + 1 MCP
```

**Frontend (Vercel):**
```bash
vercel --prod
# Takes 1-2 minutes
# Must update VITE_API_URL if gateway URL changed
```

**Vultr:**
```bash
ssh root@144.202.15.249
cd voice-pipeline-nodejs && ./deploy.sh
pm2 restart voice-pipeline

cd /root/vultr-db-proxy && ./deploy.sh
pm2 restart db-proxy
```

### Cost Comparison

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Raindrop Backend | LiquidMetal/Cloudflare | $0 (free tier) or $20/mo (paid) |
| Vultr VPS | Vultr | $6/mo (1 vCPU, 1 GB RAM) |
| PostgreSQL | Vultr (on VPS) | $0 (self-hosted) |
| Frontend | Vercel | $0 (free tier) |
| Domain | Cloudflare | $9/year |
| SSL Certs | Let's Encrypt | $0 (free) |
| **Total** | | **$6-26/month** |

**API Costs (per call):**
- Twilio: $0.013/min
- Deepgram: $0.0043/min
- Cerebras: $0.10/1M tokens (~$0.001/call)
- ElevenLabs: $0.15/1K characters (~$0.045/call)
- **Total per minute:** ~$0.065/min

**Reference:** See `API_COSTS_AND_PROFITABILITY_2025.md` for detailed cost breakdown

---

## 10. Development Workflow

### Typical Development Session

```bash
# 1. Make code changes
nano src/persona-manager/index.ts

# 2. Build TypeScript (optional, deploy does this)
npm run build

# 3. Validate manifest (if changed)
raindrop build validate

# 4. Deploy
raindrop build deploy

# 5. Check status
raindrop build status

# 6. Test endpoint
curl https://svc-xxxxx.lmapp.run/api/personas

# 7. Monitor logs
raindrop logs tail -n 100 --application call-me-back

# 8. If errors, fix and repeat 1-7
```

### Testing Strategies

**Unit Tests:**
```typescript
// tests/persona-manager.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('PersonaManager', () => {
  it('should get personas', async () => {
    const mockEnv = {
      DATABASE_PROXY: {
        getPersonas: vi.fn().mockResolvedValue([
          { id: 'brad', name: 'Brad', ... }
        ])
      }
    };

    const manager = new PersonaManager();
    const personas = await manager.getPersonas();

    expect(personas).toHaveLength(1);
    expect(personas[0].name).toBe('Brad');
  });
});
```

**Integration Tests:**
```bash
# Use real deployed services
curl -X POST https://svc-xxxxx.lmapp.run/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Verify in database
ssh root@144.202.15.249
psql -U postgres -d callmeback -c "SELECT * FROM users WHERE email = 'test@example.com';"
```

**End-to-End Tests:**
```bash
# Test full call flow
# 1. Register user
# 2. Get personas
# 3. Trigger call
# 4. Verify call record created
# 5. Check logs
```

### Debugging Workflow

**Check Logs:**
```bash
# Real-time logs
raindrop logs tail -n 100 --application call-me-back

# Historical logs (last 5 minutes)
raindrop logs query --since 5m

# Filter by service
raindrop logs tail --filter "service:persona-manager"
```

**Check Service Status:**
```bash
raindrop build status
# Output shows:
# - Deployment version
# - Service URLs
# - Health status
```

**Test Individual Services:**
```bash
# Get service URL
raindrop build find --service api-gateway

# Test endpoint
curl https://svc-xxxxx.lmapp.run/health
```

**Check Database:**
```bash
ssh root@144.202.15.249
psql -U postgres -d callmeback

# Check personas
SELECT * FROM personas;

# Check recent calls
SELECT * FROM calls ORDER BY created_at DESC LIMIT 10;
```

---

## 11. Troubleshooting

### Issue: "Service not found"

**Symptom:** `TypeError: this.env.SOME_SERVICE is undefined`

**Cause:** Service not deployed or visibility incorrect

**Fix:**
```bash
# Check manifest has service defined
grep "SOME_SERVICE" raindrop.manifest

# Regenerate types
raindrop build generate

# Redeploy
raindrop build deploy

# Verify service exists
raindrop build status
```

---

### Issue: "Database query failed"

**Symptom:** 500 error with "Database query failed"

**Cause:** Database-proxy can't reach Vultr PostgreSQL

**Fix:**
```bash
# Check database-proxy logs
raindrop logs tail --filter "service:database-proxy"

# Test Vultr endpoint
curl -X POST https://db.ai-tools-marketplace.io/query \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1", "parameters": []}'

# Check Vultr VPS
ssh root@144.202.15.249
pm2 status  # Should show db-proxy online
systemctl status postgresql  # Should show active
```

**Reference:** See `documentation/domain/debugging.md` for detailed database debugging

---

### Issue: "CORS error in frontend"

**Symptom:** Frontend shows "CORS policy blocked"

**Cause:** CORS not enabled in api-gateway

**Fix:**
```typescript
// src/api-gateway/index.ts
import { cors } from 'hono/cors';

app.use('/*', cors({
  origin: ['https://call-me-back.vercel.app'],  // Add your frontend URL
  credentials: true,
}));
```

Then redeploy:
```bash
raindrop build deploy
```

---

### Issue: "Unauthorized" on authenticated endpoint

**Symptom:** 401 error even with valid JWT token

**Cause:** Token not validated correctly or token blacklisted

**Fix:**
```bash
# Check auth-manager logs
raindrop logs tail --filter "service:auth-manager"

# Test token validation
curl -X POST https://svc-xxxxx.lmapp.run/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check token blacklist
# (requires database-proxy access)
```

---

### Issue: "Deployment takes forever"

**Symptom:** `raindrop build deploy` stuck > 5 minutes

**Cause:** Deployment failure or Raindrop infrastructure issue

**Fix:**
```bash
# Check deployment status
raindrop build status

# If stuck, try:
raindrop build stop
raindrop build deploy --start

# If still stuck, contact Raindrop support
```

---

### Issue: "Environment variable not set"

**Symptom:** `Error: JWT_SECRET is not defined`

**Cause:** Secret not set or deployment didn't pick it up

**Fix:**
```bash
# List env vars (shows if set, not values)
raindrop build env list

# Set missing secret
raindrop build env set env:JWT_SECRET "your_secret_value"

# Or set all at once
./set-all-secrets.sh

# Redeploy
raindrop build deploy
```

---

## Sources

**Consolidated from:**
- `RAINDROP.md` (2025-11-12) - Quick start guide, project structure
- `RAINDROP_PRD.md` (2025-11-12) - Product requirements, architecture approach
- `raindrop.manifest` (current) - 10 services + 1 MCP, resources, env vars
- `CRITICAL_RAINDROP_RULES.md` (2025-11-15) - Deployment rules, secrets management
- `PCR2.md` (2025-11-20, lines 193-289) - Infrastructure map, service details
- Code inspection: `src/*/index.ts` - Actual service implementations

**Related Documents:**
- See `documentation/domain/deployment.md` for full deployment procedures
- See `documentation/domain/database.md` for database-proxy pattern details
- See `documentation/domain/voice-pipeline.md` for WebSocket workaround
- See `documentation/domain/vultr.md` for VPS management
- See `SYSTEM_ARCHITECTURE.md` for complete infrastructure diagram

---

**End of Raindrop Documentation**
