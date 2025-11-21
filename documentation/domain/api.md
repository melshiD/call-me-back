# API Architecture & Endpoints
**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** api, endpoints, rest, jwt, raindrop

---

## Quick Reference

### Base URLs
```
Production:  https://api.callmeback.app
Development: http://localhost:8787
```

### Authentication Header
```
Authorization: Bearer <JWT_TOKEN>
```

### Common Response Codes
- `200` OK - Success
- `201` Created - Resource created
- `400` Validation Error
- `401` Unauthorized - Auth required/invalid
- `402` Payment Required
- `403` Forbidden - Not your resource
- `404` Not Found
- `429` Rate Limit Exceeded
- `500` Server Error

### Rate Limits
- Auth endpoints: 5-10/min per IP
- Read operations: 60-120/min per user
- Write operations: 10-30/min per user
- Call triggering: 5/min per user

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication System](#2-authentication-system)
3. [API Endpoints](#3-api-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [Persona Endpoints](#persona-endpoints)
   - [Contact Endpoints](#contact-endpoints)
   - [Call Endpoints](#call-endpoints)
   - [User & Profile Endpoints](#user--profile-endpoints)
   - [Billing Endpoints](#billing-endpoints)
   - [Voice & WebSocket Endpoints](#voice--websocket-endpoints)
   - [Admin Endpoints](#admin-endpoints)
   - [Scenario Template Endpoints](#scenario-template-endpoints)
4. [Error Handling](#4-error-handling)
5. [Rate Limiting](#5-rate-limiting)
6. [Security](#6-security)
7. [Implementation Details](#7-implementation-details)

---

## 1. Architecture Overview

### API Gateway Service

The API Gateway is implemented as a **Raindrop service** (`api-gateway`) running on Cloudflare Workers.

**Location:** `src/api-gateway/index.ts`

**Architecture Pattern:**
```
Client Request
    ↓
API Gateway (Cloudflare Workers)
    ↓
Service-to-Service Communication (internal, no external HTTP)
    ↓
├── auth-manager (JWT verification, user management)
├── persona-manager (persona CRUD)
├── call-orchestrator (call initiation)
├── database-proxy (all database queries)
└── ... (other services)
```

**Critical Design Pattern:**
- API Gateway routes requests to appropriate Raindrop services
- Services communicate internally via `this.env.SERVICE_NAME.method()`
- Only `database-proxy` makes external HTTPS calls (to Vultr PostgreSQL)
- Voice pipeline runs on **Vultr VPS** (not Workers) at `voice.ai-tools-marketplace.io`

**Why Vultr for Voice Pipeline:**
Cloudflare Workers cannot make outbound WebSocket connections, so the voice pipeline (Twilio Media Streams, Deepgram, ElevenLabs) runs on a Node.js server on Vultr.

### Route Structure

**Main Route Handlers in API Gateway:**
```typescript
// Persona routes
if (path.startsWith('/api/personas')) {
  return await this.handlePersonaRoutes(request, path);
}

// Contacts routes
if (path.startsWith('/api/contacts')) {
  return await this.handleContactRoutes(request, path);
}

// Auth routes
if (path.startsWith('/api/auth')) {
  return await this.handleAuthRoutes(request, path);
}

// Call trigger routes
if (path.startsWith('/api/calls')) {
  return await this.handleCallRoutes(request, path);
}

// Voice routes (TwiML + WebSocket stream)
if (path.startsWith('/api/voice')) {
  return await this.handleVoiceRoutes(request, path, url);
}

// Scenario template routes
if (path.startsWith('/api/scenario-templates')) {
  return await this.handleScenarioTemplates(request, path);
}

// Admin routes
if (path.startsWith('/api/admin')) {
  return await this.handleAdminRoutes(request, path);
}
```

---

## 2. Authentication System

### JWT Token-Based Authentication

**Implementation:** Raindrop service `auth-manager`

**Token Format:**
```json
{
  "user_id": "uuid",
  "issued_at": 1640995200,
  "expires_at": 1643587200
}
```

**Token Lifecycle:**
- **Expiration:** 30 days
- **Storage:** Client stores in `localStorage`
- **Revocation:** Maintained in `token_blacklist` table
- **Verification:** `auth-manager` verifies JWT on each authenticated request

**Security Measures:**
- Password hashing: bcrypt with cost factor 12+
- Account lockout: 10 failed attempts = 30 minute lockout
- HTTPS only in production
- Token revocation list for logout

**Authentication Flow:**
```
1. POST /api/auth/login with email + password
   ↓
2. auth-manager verifies credentials
   ↓
3. Generate JWT token
   ↓
4. Return { user, token }
   ↓
5. Client stores token in localStorage
   ↓
6. Future requests: Authorization: Bearer <token>
```

---

## 3. API Endpoints

### Auth Endpoints

#### POST /api/auth/login

**Description:** Authenticate user and receive JWT token

**Authentication:** None (public)
**Rate Limit:** 5/min per IP

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` VALIDATION_ERROR - Invalid email format
- `401` INVALID_CREDENTIALS - Wrong email/password
- `429` RATE_LIMIT_EXCEEDED - Too many attempts

**Validation:**
- email: Valid format, max 255 chars
- password: Required

**Frontend Implementation:** `src/stores/auth.js` → `login()`

---

#### POST /api/auth/register

**Description:** Create new user account

**Authentication:** None (public)
**Rate Limit:** 3/hour per IP

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` VALIDATION_ERROR - Invalid input
- `409` EMAIL_EXISTS - Email already registered
- `409` PHONE_EXISTS - Phone already registered

**Validation:**
- name: 1-100 chars, letters/spaces/hyphens/apostrophes
- email: Valid format, unique, lowercase
- password: Min 8 chars, uppercase + lowercase + number + special char
- phone: E.164 format (+1234567890)

**Frontend Implementation:** `src/stores/auth.js` → `register()`

---

#### POST /api/auth/logout

**Description:** Revoke JWT token

**Authentication:** Required
**Rate Limit:** 10/min per user

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Implementation:**
- Adds token to `token_blacklist` table
- Client clears localStorage

**Frontend Implementation:** `src/stores/auth.js` → `logout()`

---

#### GET /api/auth/me

**Description:** Get current authenticated user

**Authentication:** Required
**Rate Limit:** 30/min per user

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "created_at": "2024-01-01T00:00:00Z",
    "email_verified": true,
    "phone_verified": true
  }
}
```

**Errors:**
- `401` UNAUTHORIZED - Invalid token
- `401` INVALID_TOKEN - Expired token
- `401` TOKEN_REVOKED - Token revoked

**Frontend Implementation:** `src/stores/auth.js` → `fetchUser()`

---

### Persona Endpoints

#### GET /api/personas

**Description:** Fetch personas (public + user's private)

**Authentication:** Optional (anonymous users see only public)
**Rate Limit:** 60/min (anonymous), 120/min (authenticated)

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `search` (string, min: 2 chars)
- `tags` (string, comma-separated)
- `is_public` (boolean)
- `created_by` (string: user_id or 'system')
- `sort` (string: name_asc | name_desc | created_asc | created_desc)

**Example:**
```
GET /api/personas?page=1&limit=20&search=friend&tags=friendly,supportive
```

**Response (200):**
```json
{
  "personas": [
    {
      "id": "uuid",
      "name": "Best Friend",
      "description": "Your supportive best friend...",
      "voice": "rachel",
      "system_prompt": "You are a supportive best friend...",
      "is_public": true,
      "created_by": "system",
      "tags": ["friendly", "supportive", "casual"],
      "created_at": "2024-01-01T00:00:00Z",
      "use_count": 1523
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

**Implementation:**
- Anonymous: Only public personas
- Authenticated: Public + user's private personas
- Cache public list for 5 minutes
- Index on: `is_public`, `created_by`, `tags`

**Frontend Implementation:** `src/stores/personas.js` → `fetchPersonas()`

---

#### POST /api/personas

**Description:** Create custom persona

**Authentication:** Required
**Rate Limit:** 20/hour per user

**Request:**
```json
{
  "name": "My Custom Persona",
  "description": "A custom persona for...",
  "voice": "rachel",
  "system_prompt": "You are a...",
  "is_public": false,
  "tags": ["friendly", "custom"]
}
```

**Response (201):**
```json
{
  "persona": {
    "id": "uuid",
    "name": "My Custom Persona",
    "description": "A custom persona for...",
    "voice": "rachel",
    "system_prompt": "You are a...",
    "is_public": false,
    "created_by": "user_uuid",
    "tags": ["friendly", "custom"],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400` VALIDATION_ERROR - Invalid fields
- `400` DUPLICATE_NAME - Name already used by this user
- `402` PAYMENT_REQUIRED - Premium required for custom personas
- `429` MAX_PERSONAS - Max 50 personas (or 10 for free users)

**Validation:**
- name: 3-50 chars, alphanumeric + spaces/hyphens/apostrophes
- description: 10-500 chars
- voice: Valid ElevenLabs voice ID
- system_prompt: 20-2000 chars
- tags: Max 10, each 2-30 chars

**Limits:**
- Free users: 10 custom personas
- Premium users: 50 custom personas

**Frontend Implementation:** `src/stores/personas.js` → `createPersona()`

---

#### PUT /api/personas/:id

**Description:** Update persona (only if owned by user)

**Authentication:** Required
**Rate Limit:** 30/hour per user

**Request (all fields optional):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "voice": "adam",
  "system_prompt": "Updated prompt",
  "is_public": true,
  "tags": ["updated", "tag"]
}
```

**Response (200):**
```json
{
  "persona": { ... }
}
```

**Errors:**
- `403` FORBIDDEN - Cannot edit system personas / not your persona
- `404` NOT_FOUND - Persona not found

**Implementation:**
- Verify user owns persona (created_by must match user_id)
- System personas (created_by='system') cannot be edited

**Frontend Implementation:** `src/stores/personas.js` → `updatePersona()`

---

#### DELETE /api/personas/:id

**Description:** Delete persona (only if owned by user)

**Authentication:** Required
**Rate Limit:** 20/hour per user

**Response (200):**
```json
{
  "message": "Persona deleted successfully"
}
```

**Errors:**
- `403` FORBIDDEN - Cannot delete system personas / not your persona
- `404` NOT_FOUND - Persona not found

**Implementation:**
- Verify user owns persona
- System personas cannot be deleted
- Cascade delete: remove from all users' contacts
- Cannot delete if in active scheduled calls

**Frontend Implementation:** `src/stores/personas.js` → `deletePersona()`

---

### Contact Endpoints

#### GET /api/contacts

**Description:** Fetch user's saved contacts (personas)

**Authentication:** Required
**Rate Limit:** 60/min per user

**Response (200):**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "persona_id": "uuid",
      "persona": {
        "id": "uuid",
        "name": "Best Friend",
        ...
      },
      "added_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Implementation:**
- Return only authenticated user's contacts
- Include full persona object via join
- Sort by added_at desc
- Cache for 1 minute

---

#### POST /api/contacts

**Description:** Add persona to contacts

**Authentication:** Required
**Rate Limit:** 30/min per user

**Request:**
```json
{
  "persona_id": "uuid"
}
```

**Response (201):**
```json
{
  "contact": {
    "id": "uuid",
    "persona_id": "uuid",
    "added_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400` ALREADY_EXISTS - Already in contacts
- `404` NOT_FOUND - Persona not found
- `429` MAX_CONTACTS - Max 50 contacts

**Implementation:**
- Check persona exists and is accessible (public or owned by user)
- Prevent duplicates (unique constraint on user_id + persona_id)
- Limit to 50 contacts per user

---

#### DELETE /api/contacts/:personaId

**Description:** Remove persona from contacts

**Authentication:** Required
**Rate Limit:** 30/min per user

**Response (200):**
```json
{
  "message": "Removed from contacts"
}
```

---

### Call Endpoints

#### GET /api/calls

**Description:** Fetch call history with pagination and filters

**Authentication:** Required
**Rate Limit:** 60/min per user

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (string: completed | failed | in-progress | initiated)
- `sort` (string: date_desc | date_asc | cost_desc | cost_asc)
- `from_date` (ISO 8601)
- `to_date` (ISO 8601)

**Example:**
```
GET /api/calls?page=1&limit=20&status=completed&sort=date_desc
```

**Response (200):**
```json
{
  "calls": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "persona_id": "uuid",
      "persona_name": "Best Friend",
      "status": "completed",
      "start_time": "2024-01-01T12:00:00Z",
      "end_time": "2024-01-01T12:05:30Z",
      "duration": 330,
      "cost": 2.45,
      "sid": "CA1234567890abcdef",
      "transcript": "Call transcript...",
      "error_message": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "pages": 3
  }
}
```

**Implementation:**
- Only return authenticated user's calls
- Index on: user_id, status, start_time
- Cache for 30 seconds

**Frontend Implementation:** `src/stores/calls.js` → `fetchCalls()`

---

#### POST /api/call

**Description:** Trigger immediate call

**Authentication:** Required
**Rate Limit:** 5/min per user

**Request:**
```json
{
  "phone_number": "+1234567890",
  "persona_id": "uuid",
  "payment_intent_id": "pi_..."
}
```

**Response (200):**
```json
{
  "call": {
    "id": "uuid",
    "sid": "CA1234567890",
    "status": "initiated",
    "persona_id": "uuid",
    "phone_number": "+1234567890",
    "created_at": "2024-01-01T12:00:00Z",
    "estimated_cost": 2.25
  }
}
```

**Errors:**
- `400` VALIDATION_ERROR - Invalid phone/persona
- `402` PAYMENT_REQUIRED - No payment method
- `402` PAYMENT_FAILED - Payment declined
- `403` PHONE_NOT_VERIFIED - Phone verification required
- `429` CONCURRENT_CALLS - Already in call
- `500` TWILIO_ERROR - Twilio API error

**Validation:**
- phone_number: E.164 format (10-15 digits with +)
- persona_id: Must exist and be accessible
- payment_intent_id: Valid Stripe PaymentIntent in 'requires_capture' status

**Implementation:**
- Verify payment has sufficient pre-auth
- Create Twilio call via Programmable Voice
- Store call record immediately
- Send webhook URL to Twilio for status updates
- Check for concurrent calls (max 1 per user)
- Pricing: $0.25 connection + $0.40/minute

**Frontend Implementation:** `src/stores/calls.js` → `triggerCall()`

---

#### POST /api/calls/schedule

**Description:** Schedule future call

**Authentication:** Required
**Rate Limit:** 10/hour per user

**Request:**
```json
{
  "phone_number": "+1234567890",
  "persona_id": "uuid",
  "scheduled_time": "2024-01-02T15:00:00Z",
  "payment_intent_id": "pi_..."
}
```

**Response (201):**
```json
{
  "scheduled_call": {
    "id": "uuid",
    "user_id": "uuid",
    "persona_id": "uuid",
    "phone_number": "+1234567890",
    "scheduled_time": "2024-01-02T15:00:00Z",
    "status": "scheduled",
    "created_at": "2024-01-01T12:00:00Z",
    "estimated_cost": 2.25
  }
}
```

**Errors:**
- `400` VALIDATION_ERROR - Invalid inputs
- `402` PAYMENT_REQUIRED - No payment method
- `429` MAX_SCHEDULED - Max 50 active scheduled calls

**Validation:**
- scheduled_time: At least 5 minutes in future, max 30 days
- Must be ISO 8601 format

**Implementation:**
- Use cron job/queue for scheduled execution
- Pre-authorize payment at schedule time
- Send reminder 5 minutes before call
- Limit to 50 active scheduled calls per user

**Frontend Implementation:** `src/stores/calls.js` → `scheduleCall()`

---

#### DELETE /api/calls/schedule/:id

**Description:** Cancel scheduled call with refund

**Authentication:** Required
**Rate Limit:** 20/min per user

**Response (200):**
```json
{
  "message": "Scheduled call cancelled successfully",
  "refund": {
    "amount": 0.25,
    "status": "refunded",
    "refund_id": "re_..."
  }
}
```

**Errors:**
- `400` CANCELLATION_DENIED - Too close to scheduled time (< 5 min)
- `403` FORBIDDEN - Not your call
- `404` NOT_FOUND - Call not found

**Implementation:**
- Verify user owns the call
- Process full refund via Stripe
- Remove from scheduling queue
- Cannot cancel if < 5 minutes before scheduled time

**Frontend Implementation:** `src/stores/calls.js` → `cancelScheduledCall()`

---

#### GET /api/calls/scheduled

**Description:** Fetch user's scheduled calls

**Authentication:** Required
**Rate Limit:** 60/min per user

**Query Parameters:**
- `status` (string: scheduled | cancelled)
- `sort` (string: time_asc | time_desc)

**Response (200):**
```json
{
  "scheduled_calls": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "persona_id": "uuid",
      "persona_name": "Best Friend",
      "phone_number": "+1234567890",
      "scheduled_time": "2024-01-02T15:00:00Z",
      "status": "scheduled",
      "created_at": "2024-01-01T12:00:00Z",
      "estimated_cost": 2.25
    }
  ]
}
```

**Frontend Implementation:** `src/stores/calls.js` → `fetchScheduledCalls()`

---

### User & Profile Endpoints

#### PUT /api/user/profile

**Description:** Update user profile

**Authentication:** Required
**Rate Limit:** 10/min per user

**Request (all fields optional):**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Updated Name",
    "email": "newemail@example.com",
    "phone": "+1234567890",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

**Errors:**
- `400` VALIDATION_ERROR - Invalid format
- `409` EMAIL_EXISTS - Email taken

**Validation:**
- name: 1-100 chars
- email: Valid format, unique
- phone: E.164 format

---

#### GET /api/user/usage

**Description:** Fetch usage statistics

**Authentication:** Required
**Rate Limit:** 60/min per user

**Query Parameters:**
- `months` (number, default: 3)

**Response (200):**
```json
{
  "total_calls": 47,
  "total_minutes": 142,
  "total_spent": 67.45,
  "current_month": {
    "calls": 12,
    "minutes": 38,
    "spent": 16.75
  },
  "monthly_breakdown": [
    {
      "month": "Nov 2024",
      "calls": 12,
      "minutes": 38,
      "spent": 16.75
    }
  ]
}
```

---

### Billing Endpoints

#### GET /api/user/billing

**Description:** Fetch billing information

**Authentication:** Required
**Rate Limit:** 30/min per user

**Response (200):**
```json
{
  "payment_methods": [
    {
      "id": "pm_...",
      "type": "card",
      "last4": "4242",
      "brand": "visa",
      "exp_month": 12,
      "exp_year": 2025,
      "is_default": true
    }
  ],
  "balance": 0,
  "currency": "usd"
}
```

---

#### POST /api/user/payment-method

**Description:** Add payment method

**Authentication:** Required
**Rate Limit:** 10/hour per user

**Request:**
```json
{
  "payment_method_id": "pm_...",
  "set_as_default": true
}
```

**Response (201):**
```json
{
  "payment_method": {
    "id": "pm_...",
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "exp_month": 12,
    "exp_year": 2025,
    "is_default": true
  }
}
```

**Implementation:**
- payment_method_id comes from Stripe.js client-side tokenization
- Attach PaymentMethod to Stripe Customer
- Store in database

---

#### DELETE /api/user/payment-method/:id

**Description:** Remove payment method

**Authentication:** Required
**Rate Limit:** 20/min per user

**Response (200):**
```json
{
  "message": "Payment method removed"
}
```

**Errors:**
- `400` CANNOT_REMOVE_DEFAULT - Cannot remove default (set another first)

---

#### PUT /api/user/payment-method/:id/default

**Description:** Set default payment method

**Authentication:** Required
**Rate Limit:** 20/min per user

**Response (200):**
```json
{
  "message": "Default payment method updated"
}
```

---

#### POST /api/user/create-payment-intent

**Description:** Create pre-authorized payment for call

**Authentication:** Required
**Rate Limit:** 10/min per user

**Request:**
```json
{
  "estimated_duration": 5
}
```

**Response (200):**
```json
{
  "payment_intent_id": "pi_...",
  "client_secret": "pi_...secret...",
  "amount": 225,
  "currency": "usd"
}
```

**Errors:**
- `400` NO_PAYMENT_METHOD - No payment method on file
- `402` PAYMENT_FAILED - Payment declined
- `402` CARD_DECLINED - Card declined
- `402` INSUFFICIENT_FUNDS - Insufficient funds
- `500` STRIPE_ERROR - Stripe API error

**Validation:**
- estimated_duration: 1-30 minutes

**Implementation:**
- Amount: $0.25 + ($0.40 × estimated_duration) in cents
- Create Stripe PaymentIntent with capture_method='manual'
- Use default payment method
- Capture actual amount after call based on real duration
- Metadata: user_id, call_type, estimated_duration

---

### Voice & WebSocket Endpoints

**IMPORTANT:** Voice pipeline runs on **Vultr VPS** (not Cloudflare Workers) because Workers cannot make outbound WebSocket connections.

**Voice Pipeline URL:** `voice.ai-tools-marketplace.io` (Vultr VPS at 144.202.15.249)

#### POST /api/voice/answer

**Description:** Twilio calls this endpoint when call is answered - returns TwiML with Media Streams configuration

**Authentication:** Twilio signature verification
**Rate Limit:** No limit (webhook)

**Location:** `src/api-gateway/index.ts:128` → `handleVoiceAnswer()`

**Request:** Twilio sends form data
```
CallSid=CA...
From=+1234567890
To=+1234567890
```

**Query Parameters (passed by call-orchestrator):**
- `userId` (string, default: 'demo_user')
- `personaId` (string, default: 'brad_001')
- `callPretext` (string, optional)

**Response (200):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="wss://voice.ai-tools-marketplace.io/stream">
            <Parameter name="callId" value="CA..." />
            <Parameter name="userId" value="uuid" />
            <Parameter name="personaId" value="uuid" />
            <Parameter name="callPretext" value="..." />
        </Stream>
    </Connect>
</Response>
```

**Implementation:**
- Parse Twilio form data (CallSid, From, To)
- Extract userId, personaId, callPretext from query params
- Generate TwiML with WebSocket stream URL pointing to Vultr voice pipeline
- Use `<Parameter>` elements to pass custom data (sent in WebSocket "start" message)
- Voice pipeline fetches full persona metadata from database using these IDs

**Critical Notes:**
- Stream URL points to Vultr: `wss://voice.ai-tools-marketplace.io/stream`
- Twilio Stream URLs DO NOT support query parameters - must use `<Parameter>` elements
- DNS: voice.ai-tools-marketplace.io must point to 144.202.15.249 (A record)

---

#### WebSocket /api/voice/stream

**Description:** Handle Twilio Media Streams WebSocket connection

**IMPORTANT:** This endpoint is defined in API Gateway but **redirects to Vultr voice pipeline**. The actual WebSocket handling happens on Vultr, not in Cloudflare Workers.

**Location in API Gateway:** `src/api-gateway/index.ts:105` → `handleVoiceRoutes()`

**Why This Pattern:**
- API Gateway checks for WebSocket upgrade header
- If valid, redirects to Vultr voice pipeline
- Cloudflare Workers cannot handle outbound WebSocket connections (Deepgram, ElevenLabs)
- Voice pipeline runs on Node.js on Vultr with full WebSocket support

**Actual Implementation:** Vultr voice pipeline at `voice.ai-tools-marketplace.io`

**See:** `documentation/domain/voice-pipeline.md` for full voice pipeline documentation

---

### Admin Endpoints

#### /api/admin/*

**Description:** Admin dashboard endpoints (persona management, user management, system monitoring)

**Authentication:** Required (admin JWT)
**Rate Limit:** Varies by endpoint

**Location:** `src/api-gateway/index.ts:45` → `handleAdminRoutes()`

**Admin Authentication:**
- Admin users stored in `admin_users` table
- Separate JWT token with admin flag
- See `documentation/domain/auth.md` for admin auth details

**Admin Functionality:**
- Persona CRUD operations
- User management
- Call monitoring
- System health checks

**Implementation:** Admin routes delegate to admin-specific services

---

### Scenario Template Endpoints

#### /api/scenario-templates/*

**Description:** Manage scenario templates for persona conversations

**Authentication:** Required
**Rate Limit:** Varies by endpoint

**Location:** `src/api-gateway/index.ts:40` → `handleScenarioTemplates()`

**Implementation:** Uses `ScenarioTemplateManager` from `src/shared/scenario-templates`

**Endpoints:**
- GET /api/scenario-templates - List templates
- POST /api/scenario-templates - Create template
- PUT /api/scenario-templates/:id - Update template
- DELETE /api/scenario-templates/:id - Delete template

---

## 4. Error Handling

### Standard Error Response Format

All errors return this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "retry_after": 60,
  "details": {}
}
```

### Common Error Codes

**4xx Client Errors:**
- `VALIDATION_ERROR` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Authentication required
- `INVALID_TOKEN` (401) - Token invalid/expired
- `TOKEN_REVOKED` (401) - Token revoked
- `FORBIDDEN` (403) - Not authorized for resource
- `NOT_FOUND` (404) - Resource not found
- `EMAIL_EXISTS` (409) - Email already registered
- `PHONE_EXISTS` (409) - Phone already registered
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests

**Payment Errors (402):**
- `PAYMENT_REQUIRED` - Payment method required
- `PAYMENT_FAILED` - Payment declined
- `CARD_DECLINED` - Card declined
- `INSUFFICIENT_FUNDS` - Insufficient funds

**5xx Server Errors:**
- `SERVER_ERROR` (500) - Internal server error
- `TWILIO_ERROR` (500) - Twilio API error
- `STRIPE_ERROR` (500) - Stripe API error
- `SERVICE_UNAVAILABLE` (503) - Service unavailable

### Error Handling Pattern

```typescript
try {
  // API call
} catch (error) {
  this.env.logger.error('API Gateway error', {
    error: error instanceof Error ? error.message : String(error)
  });
  return new Response('Internal Server Error', { status: 500 });
}
```

---

## 5. Rate Limiting

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

### Rate Limits by Endpoint Type

**Authentication:**
- Login: 5/min per IP
- Register: 3/hour per IP
- Logout: 10/min per user
- Get current user: 30/min per user

**Read Operations:**
- Fetch personas: 60/min (anonymous), 120/min (authenticated)
- Fetch calls: 60/min per user
- Fetch contacts: 60/min per user
- Fetch user info: 60/min per user

**Write Operations:**
- Create persona: 20/hour per user
- Update persona: 30/hour per user
- Delete persona: 20/hour per user
- Add/remove contact: 30/min per user
- Update profile: 10/min per user

**Call Triggering:**
- Trigger call: 5/min per user
- Schedule call: 10/hour per user
- Cancel scheduled call: 20/min per user

**Webhooks:**
- No limit (Twilio, Stripe webhooks)

### Rate Limit Response (429)

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "retry_after": 60
}
```

---

## 6. Security

### Authentication Security

**JWT Tokens:**
- Expire in 30 days
- Stored securely in localStorage (never in URL)
- Maintained revocation list in `token_blacklist` table
- HTTPS only in production

**Password Security:**
- Hashing: Bcrypt with cost factor 12+
- Requirements: Min 8 chars, uppercase, lowercase, number, special char
- Lockout: 10 failed attempts = 30 min lockout

### Input Validation

**Sanitization:**
- All text inputs sanitized for XSS
- SQL injection prevention via parameterized queries

**Phone Numbers:**
- E.164 format normalized
- Validated on input

**Email Validation:**
- Proper format validation
- Lowercase normalization
- Unique constraint

### Payment Security

**PCI Compliance:**
- Never store card details
- Use Stripe Elements for card collection
- Manual capture: Pre-authorize, capture after call
- Webhook verification: Verify Stripe/Twilio signatures

**Payment Flow:**
1. Pre-authorize estimated amount
2. Complete call
3. Capture actual amount based on real duration
4. Release unused pre-authorization

### API Security

**CORS:**
- Configure allowed origins
- Restrict to production domains

**Rate Limiting:**
- Prevent abuse
- Per-IP and per-user limits

**Request Size:**
- Limit to 1MB
- Timeout: 30 seconds

### Data Privacy

**Authorization:**
- Users only see their own data
- Resource ownership verification

**Phone Numbers:**
- Mask in logs (show last 4 digits)

**Transcripts:**
- Encrypted at rest

**GDPR:**
- Support data export/deletion

---

## 7. Implementation Details

### Service-to-Service Communication

**Pattern:** Internal Worker-to-Worker communication (no external HTTP)

```typescript
// API Gateway calls auth-manager
const user = await this.env.AUTH_MANAGER.verifyToken(token);

// API Gateway calls persona-manager
const personas = await this.env.PERSONA_MANAGER.getPersonas();

// API Gateway calls database-proxy for queries
const rows = await this.env.DATABASE_PROXY.executeQuery(
  'SELECT * FROM personas WHERE is_active = true',
  []
);
```

**Why This Pattern:**
- Cloudflare Workers can only make HTTPS calls to external URLs via database-proxy
- Direct Worker-to-Worker communication is internal and fast
- Avoids "Error 1003" (external URL restriction)

**See:** `documentation/domain/raindrop.md` for full service architecture

### Database Access Pattern

**All database queries go through `database-proxy` service:**

```typescript
// CORRECT: Via database-proxy service
const result = await this.env.DATABASE_PROXY.executeQuery(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// INCORRECT: Direct external HTTPS call (will fail in Workers)
const response = await fetch('https://db.ai-tools-marketplace.io/query', {
  method: 'POST',
  body: JSON.stringify({ query, parameters })
});
```

**See:** `documentation/domain/database.md` for database architecture

### Frontend Store Pattern

**Frontend stores (Pinia) call API endpoints:**

```typescript
// src/stores/auth.js
const login = async (email, password) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  token.value = data.token;
  localStorage.setItem('token', data.token);
  return data;
};
```

**Environment Variable:**
```bash
# .env
VITE_API_URL=https://api.callmeback.app
```

**See:** `documentation/domain/frontend.md` for frontend architecture

### Cost Tracking

**API calls are tracked for cost analysis:**

```typescript
// CallCostTracker from src/shared/cost-tracker
const tracker = new CallCostTracker(this.env);
await tracker.trackCallCost(callId, duration, costs);
```

**Cost Breakdown Per Call:**
- Twilio: $0.070 (16.5%)
- Deepgram: $0.030 (7.0%)
- Cerebras: $0.005 (1.2%)
- ElevenLabs: $0.300 (70.6%) ← Largest cost!
- Raindrop: $0.020 (4.7%)
- **Total Variable:** $0.425/call
- **Stripe:** $0.475 (53% of total cost)
- **Grand Total:** $0.900/call

**See:** `documentation/domain/cost-tracking.md` for cost analysis

---

## Sources

**Consolidated from:**
- documentation/API_SPECIFICATION.md (comprehensive spec, dated 2024-11-19)
- src/api-gateway/index.ts (actual implementation, lines 1-200)
- src/stores/auth.js (frontend auth implementation, lines 1-100)
- src/stores/calls.js (frontend calls implementation, lines 1-100)
- src/stores/personas.js (implied from API spec)
- src/stores/user.js (implied from API spec)

**Related Documents:**
- See also: `documentation/domain/raindrop.md` (service architecture)
- See also: `documentation/domain/database.md` (database patterns)
- See also: `documentation/domain/voice-pipeline.md` (WebSocket implementation)
- See also: `documentation/domain/auth.md` (JWT authentication details)
- See also: `documentation/domain/cost-tracking.md` (API cost tracking)
- See also: `documentation/domain/frontend.md` (frontend store patterns)
