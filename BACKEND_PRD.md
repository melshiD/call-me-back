# Call Me Back - Backend Product Requirements Document

**Version:** 1.0.0
**Date:** 2025-01-06
**Project Type:** Hackathon Submission
**Technologies:** Raindrop MCP + ElevenLabs + Cerebras

---

## Executive Summary

Build a Node.js backend API that supports the "Call Me Back" Vue.js frontend - an AI-powered phone companion that calls users on demand with customizable personas. The backend must integrate Twilio (telephony), Cerebras (AI inference), ElevenLabs (TTS), Stripe (payments), and Raindrop (orchestration, storage, memory) to deliver sub-3-second conversational responses during live phone calls.

**Core Value Proposition:** Users can schedule AI-powered phone calls with different personas (friend, boss, agent) to help escape awkward situations or provide comfort, with believable real-time conversations.

**Hackathon Focus:** Maximize use of partner technologies (Raindrop MCP, ElevenLabs, Cerebras) to demonstrate integration capabilities.

---

## 1. Project Objectives

### Primary Objectives
1. **Support Frontend API** - Implement all 23 REST endpoints documented in API_SPECIFICATION.md
2. **Enable Live Voice Calls** - Real-time phone calls with AI personas via Twilio
3. **Sub-3s Response Time** - Leverage Cerebras for <1s AI inference, <3s total response
4. **Hackathon Integration** - Showcase Raindrop, ElevenLabs, and Cerebras technologies

### Success Criteria
- ✅ All 23 API endpoints functional and tested
- ✅ Live phone call with AI persona works end-to-end
- ✅ Response time <3 seconds per conversational turn
- ✅ Payment pre-auth and capture working with Stripe
- ✅ 90%+ successful call connection rate
- ✅ Operating cost <$0.25/minute
- ✅ Working demo with video showcasing partner tech

---

## 2. Technical Stack (Hackathon Partners Highlighted)

### Core Backend
- **Runtime:** Node.js 18+ with Express.js
- **Language:** JavaScript/TypeScript
- **Database:** PostgreSQL (via Raindrop SmartSQL)
- **WebSocket:** ws library for Twilio Media Streams

### Hackathon Partner Technologies ⭐

#### Raindrop Platform (Primary Partner)
- **SmartMemory** - Store conversation context and persona data
- **SmartSQL** - Database queries for call history and analytics
- **SmartBuckets** - S3-compatible storage for call transcripts and audio
- **MCP Orchestration** - Coordinate AI workflow and integrations

#### ElevenLabs (TTS Partner)
- **Text-to-Speech API** - Convert AI responses to natural voice
- **Voice IDs** - Multiple persona voices (rachel, adam, bella, emily, grace)
- **Streaming TTS** - Real-time audio generation for low latency

#### Cerebras (AI Partner)
- **Inference API** - Sub-second AI response generation
- **Fallback:** OpenAI Realtime API if Cerebras unavailable

### Other Integrations
- **Twilio** - Programmable Voice for outbound calls and media streams
- **Stripe** - Payment processing (manual capture PaymentIntents)

---

## 3. System Architecture

### High-Level Flow
```
User (Frontend)
  → POST /api/call + PaymentIntent
    → Backend validates payment
      → Twilio initiates call
        → Phone rings → User answers
          → Twilio Media Stream → Backend WebSocket
            → STT (Speech-to-Text)
              → AI (Cerebras) generates response
                → ElevenLabs TTS
                  → Audio stream → Twilio
                    → User hears AI persona
                      → Call continues...
                        → Call ends
                          → Stripe captures actual cost
                            → Store transcript in SmartBuckets
```

### Component Diagram
```
┌─────────────┐
│  Vue.js     │
│  Frontend   │
└──────┬──────┘
       │ REST API (23 endpoints)
       ▼
┌─────────────────────────────────────┐
│   Node.js + Express Backend         │
│  ┌──────────┐  ┌─────────────────┐ │
│  │   Auth   │  │  Call Manager   │ │
│  │  (JWT)   │  │  - Trigger      │ │
│  └──────────┘  │  - Schedule     │ │
│                │  - Status       │ │
│  ┌──────────┐  └─────────────────┘ │
│  │ Persona  │                       │
│  │ Manager  │  ┌─────────────────┐ │
│  └──────────┘  │  Payment Mgr    │ │
│                │  (Stripe)       │ │
│                └─────────────────┘ │
└───────┬─────────────────────────────┘
        │
        ├──► Raindrop SmartMemory (context)
        ├──► Raindrop SmartSQL (database)
        ├──► Raindrop SmartBuckets (storage)
        │
        ├──► Twilio Voice API
        │     │
        │     └──► WebSocket Media Stream
        │           │
        │           ├──► STT Service
        │           │
        │           ├──► Cerebras AI (fallback: OpenAI)
        │           │
        │           └──► ElevenLabs TTS
        │
        └──► Stripe API (payments)
```

---

## 4. Complete API Specification

### 4.1 Authentication Endpoints (4)

#### POST /api/auth/login
- **Rate Limit:** 5/min per IP
- **Input:** email, password
- **Output:** user object, JWT token (30-day expiration)
- **Errors:** 400 (validation), 401 (invalid credentials), 429 (rate limit)
- **Security:** Bcrypt (cost 12+), account lockout after 10 attempts

#### POST /api/auth/register
- **Rate Limit:** 3/hour per IP
- **Input:** name, email, password, phone (E.164)
- **Validation:**
  - Password: min 8 chars, uppercase, lowercase, number, special char
  - Phone: E.164 format (+1234567890)
- **Output:** user object, JWT token
- **Errors:** 400 (validation), 409 (email/phone exists)

#### POST /api/auth/logout
- **Rate Limit:** 10/min per user
- **Auth:** Required (JWT)
- **Action:** Revoke token
- **Output:** Success message

#### GET /api/auth/me
- **Rate Limit:** 30/min per user
- **Auth:** Required (JWT)
- **Output:** Current user object with verification status
- **Errors:** 401 (invalid/expired/revoked token)

---

### 4.2 Call Management Endpoints (5)

#### GET /api/calls
- **Rate Limit:** 60/min per user
- **Auth:** Required
- **Params:** page, limit (max 100), status, sort, from_date, to_date
- **Output:** Paginated call history with persona names, durations, costs
- **Implementation:**
  - Query Raindrop SmartSQL for user's calls
  - Index on user_id, status, start_time
  - Cache for 30 seconds

#### POST /api/call
- **Rate Limit:** 5/min per user
- **Auth:** Required
- **Input:** phone_number (E.164), persona_id, payment_intent_id
- **Process:**
  1. Verify PaymentIntent valid and sufficient
  2. Check no concurrent calls for user
  3. Fetch persona from SmartMemory
  4. Create Twilio call with webhook URL
  5. Store call record in SmartSQL
- **Output:** Call object with Twilio SID, status 'initiated'
- **Errors:**
  - 400 (invalid input)
  - 402 (payment failed/declined)
  - 429 (concurrent call exists)
  - 500 (Twilio error)
- **Pricing:** $0.25 connection + $0.40/min

#### POST /api/calls/schedule
- **Rate Limit:** 10/hour per user
- **Auth:** Required
- **Input:** phone_number, persona_id, scheduled_time (ISO 8601), payment_intent_id
- **Validation:** scheduled_time must be 5+ minutes in future, max 30 days
- **Process:**
  1. Pre-authorize payment
  2. Store scheduled call in SmartSQL
  3. Add to scheduling queue (cron/queue system)
- **Output:** Scheduled call object
- **Errors:** 400 (validation), 402 (payment), 429 (max 50 scheduled)
- **Limit:** Max 50 active scheduled calls per user

#### DELETE /api/calls/schedule/:id
- **Rate Limit:** 20/min per user
- **Auth:** Required
- **Validation:** Cannot cancel if <5 minutes before scheduled time
- **Process:**
  1. Verify user owns call
  2. Process full refund via Stripe
  3. Remove from queue
  4. Update status to 'cancelled'
- **Output:** Success message with refund details
- **Errors:** 400 (too late), 403 (not owner), 404 (not found)

#### GET /api/calls/scheduled
- **Rate Limit:** 60/min per user
- **Auth:** Required
- **Params:** status (scheduled|cancelled), sort (time_asc|time_desc)
- **Output:** List of user's scheduled calls with persona details
- **Cache:** 30 seconds

---

### 4.3 Persona Management Endpoints (7)

#### GET /api/personas
- **Rate Limit:** 60/min (anonymous), 120/min (authenticated)
- **Auth:** Optional (auth users see private personas too)
- **Params:** page, limit, search (min 2 chars), tags (comma-separated), is_public, created_by, sort
- **Output:** Paginated personas with use counts
- **Cache:** 5 minutes for public list
- **Implementation:** Full-text search on name/description in SmartSQL

#### POST /api/personas
- **Rate Limit:** 20/hour per user
- **Auth:** Required
- **Input:** name (3-50 chars), description (10-500), voice (ElevenLabs ID), system_prompt (20-2000), is_public, tags (max 10)
- **Validation:**
  - Verify voice ID with ElevenLabs API
  - Sanitize all text (XSS prevention)
  - Name unique per user
- **Process:**
  1. Validate ElevenLabs voice ID exists
  2. Store persona in SmartMemory
  3. Store metadata in SmartSQL
- **Limits:** Free: 10 personas, Premium: 50 personas
- **Errors:** 400 (validation), 402 (premium required), 429 (max reached)

#### PUT /api/personas/:id
- **Rate Limit:** 30/hour per user
- **Auth:** Required
- **Input:** Same as create (all optional)
- **Validation:** Verify user owns persona (created_by matches)
- **Restriction:** Cannot edit system personas (created_by='system')
- **Process:** Update in SmartMemory and SmartSQL
- **Errors:** 403 (not owner/system persona), 404 (not found)

#### DELETE /api/personas/:id
- **Rate Limit:** 20/hour per user
- **Auth:** Required
- **Validation:**
  - User owns persona
  - Not a system persona
  - Not in active scheduled calls
- **Process:**
  1. Remove from all users' contacts
  2. Delete from SmartMemory
  3. Delete from SmartSQL
- **Errors:** 403 (forbidden), 404 (not found)

#### GET /api/contacts
- **Rate Limit:** 60/min per user
- **Auth:** Required
- **Output:** User's favorited personas with full persona objects
- **Sort:** added_at descending
- **Cache:** 1 minute
- **Implementation:** Join contacts with personas in SmartSQL

#### POST /api/contacts
- **Rate Limit:** 30/min per user
- **Auth:** Required
- **Input:** persona_id
- **Validation:**
  - Persona exists and accessible (public or owned by user)
  - Not already in contacts
  - Max 50 contacts per user
- **Process:** Create contact record in SmartSQL
- **Errors:** 400 (duplicate/max reached), 404 (persona not found)

#### DELETE /api/contacts/:personaId
- **Rate Limit:** 30/min per user
- **Auth:** Required
- **Process:** Remove contact from SmartSQL
- **Output:** Success message

---

### 4.4 User & Billing Endpoints (7)

#### PUT /api/user/profile
- **Rate Limit:** 10/min per user
- **Auth:** Required
- **Input:** name, email, phone (all optional)
- **Validation:** Same as registration
- **Process:** Update in SmartSQL, check email uniqueness
- **Errors:** 400 (validation), 409 (email exists)

#### GET /api/user/billing
- **Rate Limit:** 30/min per user
- **Auth:** Required
- **Output:** Payment methods (from Stripe Customer), balance, currency
- **Process:** Fetch from Stripe API and cache

#### POST /api/user/payment-method
- **Rate Limit:** 10/hour per user
- **Auth:** Required
- **Input:** payment_method_id (from Stripe.js), set_as_default
- **Process:**
  1. Attach PaymentMethod to Stripe Customer
  2. Store in SmartSQL
  3. Set as default if requested
- **Errors:** 400 (invalid payment method)

#### DELETE /api/user/payment-method/:id
- **Rate Limit:** 20/min per user
- **Auth:** Required
- **Validation:** Cannot remove if default (must set another first)
- **Process:** Detach from Stripe Customer

#### PUT /api/user/payment-method/:id/default
- **Rate Limit:** 20/min per user
- **Auth:** Required
- **Process:** Update Stripe Customer default payment method

#### GET /api/user/usage
- **Rate Limit:** 60/min per user
- **Auth:** Required
- **Params:** months (default 3)
- **Output:** Total calls/minutes/spent, current month stats, monthly breakdown
- **Implementation:** Query SmartSQL with aggregations

#### POST /api/user/create-payment-intent
- **Rate Limit:** 10/min per user
- **Auth:** Required
- **Input:** estimated_duration (1-30 minutes)
- **Process:**
  1. Calculate amount: $0.25 + ($0.40 × duration) in cents
  2. Create Stripe PaymentIntent with capture_method='manual'
  3. Use default payment method
  4. Store payment_intent_id with metadata
- **Output:** payment_intent_id, client_secret (if needed), amount, currency
- **Errors:** 400 (no payment method), 402 (card declined/insufficient funds)

---

### 4.5 Webhook Endpoints (2)

#### POST /api/twilio/callback
- **Auth:** Twilio signature verification
- **Input:** Twilio webhook data (CallSid, CallStatus, CallDuration)
- **Process:**
  1. Verify Twilio signature
  2. Update call record in SmartSQL
  3. Calculate actual cost: $0.25 + ($0.40 × duration_minutes)
  4. Capture Stripe PaymentIntent with actual amount
  5. Store transcript in SmartBuckets (if available)
- **Implementation:** Update call status to 'completed', 'failed', etc.

#### POST /api/stripe/webhook
- **Auth:** Stripe signature verification
- **Input:** Stripe webhook event
- **Process:**
  - payment_intent.succeeded → Update payment status
  - payment_intent.payment_failed → Mark payment failed
  - payment_method.attached → Update billing info
  - payment_method.detached → Update billing info
- **Implementation:** Verify signature, update SmartSQL

---

## 5. Real-Time Voice Pipeline (Critical Path)

### 5.1 Twilio Media Stream Integration

**Endpoint:** `WS /api/twilio/stream`

**Flow:**
```
1. User answers phone call
2. Twilio sends TwiML response (from POST /api/twilio/answer)
3. TwiML starts Media Stream to WebSocket
4. Backend receives audio chunks (base64 μ-law)
5. Accumulate audio until silence detected
6. Convert to format for STT
```

**Implementation:**
```javascript
wss.on('connection', (ws) => {
  let audioBuffer = []

  ws.on('message', (message) => {
    const msg = JSON.parse(message)

    if (msg.event === 'media') {
      audioBuffer.push(msg.media.payload) // base64 audio
    }

    if (msg.event === 'stop') {
      // User finished speaking
      processAudio(audioBuffer)
      audioBuffer = []
    }
  })
})
```

### 5.2 Speech Processing Pipeline

**STT → AI → TTS → Twilio**

```javascript
async function processAudio(audioBuffer) {
  // 1. Speech-to-Text (using Deepgram, AssemblyAI, or Whisper)
  const transcript = await speechToText(audioBuffer)

  // 2. Get conversation context from Raindrop SmartMemory
  const context = await raindrop.smartMemory.get({
    key: `call_context_${callId}`,
    persona_id: personaId
  })

  // 3. Generate AI response using Cerebras (fallback OpenAI)
  const aiResponse = await generateResponse({
    transcript,
    context,
    persona: personaData,
    provider: 'cerebras' // or 'openai-realtime'
  })

  // 4. Update context in SmartMemory
  await raindrop.smartMemory.set({
    key: `call_context_${callId}`,
    value: updatedContext
  })

  // 5. Convert to speech using ElevenLabs
  const audioStream = await elevenlabs.textToSpeech({
    text: aiResponse,
    voice_id: persona.voice,
    model_id: 'eleven_turbo_v2', // Fastest model
    optimize_streaming_latency: 3
  })

  // 6. Stream to Twilio
  ws.send(JSON.stringify({
    event: 'media',
    media: {
      payload: audioStream.toString('base64')
    }
  }))
}
```

### 5.3 Latency Optimization

**Target: <3 seconds total, <1s for AI inference**

1. **Parallel Processing**
   - Start TTS while AI is still generating (streaming)
   - Begin STT processing as audio arrives

2. **Cerebras Optimization**
   ```javascript
   const cerebrasResponse = await fetch('https://api.cerebras.ai/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       model: 'llama3.1-8b', // Fast model
       messages: conversationHistory,
       max_tokens: 150, // Keep responses concise
       temperature: 0.7,
       stream: true // Enable streaming
     })
   })
   ```

3. **ElevenLabs Streaming**
   ```javascript
   const elevenLabsStream = await elevenlabs.textToSpeechStream({
     voice_id: persona.voice,
     model_id: 'eleven_turbo_v2',
     optimize_streaming_latency: 4, // Maximum optimization
     output_format: 'ulaw_8000' // Match Twilio format
   })
   ```

4. **Caching**
   - Cache persona system prompts in SmartMemory
   - Pre-warm connections to Cerebras/ElevenLabs
   - Keep WebSocket connections alive

---

## 6. Database Schema (Raindrop SmartSQL)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
```

### Calls Table
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'initiated', 'in-progress', 'completed', 'failed'
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER, -- seconds
  cost DECIMAL(10,2),
  sid VARCHAR(50), -- Twilio call SID
  transcript TEXT,
  error_message TEXT,
  payment_intent_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calls_user_status ON calls(user_id, status);
CREATE INDEX idx_calls_start_time ON calls(start_time DESC);
CREATE INDEX idx_calls_sid ON calls(sid);
```

### Scheduled Calls Table
```sql
CREATE TABLE scheduled_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'cancelled', 'executed'
  payment_intent_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scheduled_user ON scheduled_calls(user_id, status);
CREATE INDEX idx_scheduled_time ON scheduled_calls(scheduled_time);
```

### Personas Table
```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  voice VARCHAR(50) NOT NULL, -- ElevenLabs voice ID
  system_prompt TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(50) NOT NULL, -- 'system' or user_id
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(created_by, name) -- Unique name per user
);

CREATE INDEX idx_personas_public ON personas(is_public);
CREATE INDEX idx_personas_created_by ON personas(created_by);
CREATE INDEX idx_personas_tags ON personas USING GIN(tags);
```

### Contacts Table
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, persona_id)
);

CREATE INDEX idx_contacts_user ON contacts(user_id);
```

### Payment Methods Table
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_pm_id VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) DEFAULT 'card',
  last4 VARCHAR(4),
  brand VARCHAR(20),
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
```

---

## 7. Raindrop Integration Details

### 7.1 SmartMemory Usage

**Purpose:** Store conversation context and persona data

```javascript
// Store persona with context
await raindrop.smartMemory.set({
  key: `persona_${personaId}`,
  value: {
    name: 'Best Friend',
    system_prompt: 'You are a supportive best friend...',
    voice: 'rachel',
    conversation_style: 'warm and understanding'
  },
  metadata: {
    type: 'persona',
    created_by: userId
  }
})

// Retrieve during call
const persona = await raindrop.smartMemory.get({
  key: `persona_${personaId}`
})

// Store conversation context
await raindrop.smartMemory.set({
  key: `call_context_${callId}`,
  value: {
    conversationHistory: [
      { role: 'user', content: 'Hey, I need help' },
      { role: 'assistant', content: 'Of course! What\'s going on?' }
    ],
    callStart: new Date(),
    personaId: personaId
  }
})
```

### 7.2 SmartSQL Usage

**Purpose:** Structured data queries

```javascript
// Query call history with aggregations
const stats = await raindrop.smartSQL.query(`
  SELECT
    COUNT(*) as total_calls,
    SUM(duration) / 60 as total_minutes,
    SUM(cost) as total_spent
  FROM calls
  WHERE user_id = $1 AND status = 'completed'
`, [userId])

// Paginated call history
const calls = await raindrop.smartSQL.query(`
  SELECT c.*, p.name as persona_name
  FROM calls c
  LEFT JOIN personas p ON c.persona_id = p.id
  WHERE c.user_id = $1
  ORDER BY c.start_time DESC
  LIMIT $2 OFFSET $3
`, [userId, limit, offset])
```

### 7.3 SmartBuckets Usage

**Purpose:** Store call transcripts and audio files

```javascript
// Store transcript after call
await raindrop.smartBuckets.put({
  bucket: 'call-transcripts',
  key: `transcripts/${callId}.json`,
  body: JSON.stringify({
    callId,
    userId,
    personaId,
    transcript: fullTranscript,
    duration,
    cost,
    timestamp: new Date()
  }),
  metadata: {
    contentType: 'application/json'
  }
})

// Store temporary audio chunks (if needed)
await raindrop.smartBuckets.put({
  bucket: 'call-audio',
  key: `audio/${callId}/${chunkId}.wav`,
  body: audioBuffer,
  metadata: {
    contentType: 'audio/wav'
  },
  ttl: 86400 // Auto-delete after 24 hours
})

// Retrieve for analysis
const transcript = await raindrop.smartBuckets.get({
  bucket: 'call-transcripts',
  key: `transcripts/${callId}.json`
})
```

---

## 8. Third-Party Integration Specifications

### 8.1 Twilio Integration

**Account Setup:**
- Create Twilio account
- Get Account SID and Auth Token
- Purchase phone number (or use trial)
- Configure webhooks

**Call Initiation:**
```javascript
const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

const call = await twilio.calls.create({
  to: userPhoneNumber,
  from: TWILIO_PHONE_NUMBER,
  url: `${BASE_URL}/api/twilio/answer`, // TwiML webhook
  statusCallback: `${BASE_URL}/api/twilio/callback`,
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
  statusCallbackMethod: 'POST'
})
```

**TwiML Response (POST /api/twilio/answer):**
```javascript
app.post('/api/twilio/answer', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse()

  twiml.say({
    voice: 'alice'
  }, 'Hey! One second, let me just...')

  const connect = twiml.connect()
  connect.stream({
    url: `wss://${BASE_URL}/api/twilio/stream`
  })

  res.type('text/xml')
  res.send(twiml.toString())
})
```

### 8.2 ElevenLabs Integration

**API Setup:**
- Get ElevenLabs API key
- Identify voice IDs to use

**Text-to-Speech:**
```javascript
const ElevenLabs = require('elevenlabs-node')
const elevenlabs = new ElevenLabs({ apiKey: ELEVENLABS_API_KEY })

const audioStream = await elevenlabs.textToSpeechStream({
  text: aiResponse,
  voice_id: 'EXAVITQu4vr4xnSDxMaL', // rachel
  model_id: 'eleven_turbo_v2',
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
  },
  optimize_streaming_latency: 4,
  output_format: 'ulaw_8000' // Twilio-compatible
})
```

**Voice IDs (from personas):**
- rachel: EXAVITQu4vr4xnSDxMaL
- adam: pNInz6obpgDQGcFmaJgB
- bella: EXAVITQu4vr4xnSDxMaL
- emily: LcfcDJNUP1GQjkzn1xUU
- grace: oWAxZDx7w5VEj9dCyTzz

### 8.3 Cerebras Integration

**API Setup:**
- Get Cerebras API key
- Use llama3.1-8b for speed

**Chat Completion:**
```javascript
const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama3.1-8b',
    messages: [
      {
        role: 'system',
        content: persona.system_prompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userTranscript
      }
    ],
    max_tokens: 150,
    temperature: 0.7,
    stream: true
  })
})

// Handle streaming response
const reader = response.body.getReader()
let aiResponse = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = new TextDecoder().decode(value)
  const lines = chunk.split('\n').filter(line => line.trim())

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6))
      if (data.choices[0].delta.content) {
        aiResponse += data.choices[0].delta.content
      }
    }
  }
}
```

**Fallback to OpenAI:**
```javascript
if (cerebrasError) {
  // Fallback to OpenAI Realtime API
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: conversationMessages,
    max_tokens: 150,
    stream: true
  })
}
```

### 8.4 Stripe Integration

**Setup:**
- Create Stripe account
- Get API keys (test and live)
- Set webhook URL

**Create PaymentIntent:**
```javascript
const stripe = require('stripe')(STRIPE_SECRET_KEY)

const paymentIntent = await stripe.paymentIntents.create({
  amount: 225, // $2.25 in cents
  currency: 'usd',
  customer: user.stripe_customer_id,
  payment_method: user.default_payment_method,
  capture_method: 'manual', // Don't capture yet
  metadata: {
    user_id: userId,
    estimated_duration: 5,
    call_type: 'immediate'
  }
})
```

**Capture After Call:**
```javascript
// After call completes with actual duration
const actualCost = 25 + (callDurationMinutes * 40) // cents

await stripe.paymentIntents.capture(paymentIntentId, {
  amount_to_capture: actualCost
})

// If call was shorter, capture less (release rest)
// If call was longer, may need to create additional charge
```

---

## 9. Security Requirements

### 9.1 Authentication & Authorization
- **JWT Tokens:** 30-day expiration, include user_id and issued_at
- **Token Revocation:** Maintain blacklist in SmartMemory/Redis
- **Password Hashing:** Bcrypt with cost factor 12+
- **Account Lockout:** 10 failed attempts = 30-minute lockout

### 9.2 Input Validation
- **Phone Numbers:** Validate with Twilio Lookup API
- **Email:** Proper format validation, lowercase normalization
- **SQL Injection:** Use parameterized queries (SmartSQL handles this)
- **XSS Prevention:** Sanitize all user text inputs
- **Rate Limiting:** Implement per endpoint (see API specs)

### 9.3 API Security
- **HTTPS Only:** Enforce in production
- **CORS:** Configure allowed origins (frontend URL)
- **Request Size Limits:** Max 1MB
- **Timeout:** 30-second default
- **Webhook Verification:** Verify Twilio and Stripe signatures

### 9.4 Data Privacy
- **Authorization:** Users only access their own data
- **Phone Masking:** Show only last 4 digits in logs
- **Transcript Encryption:** Encrypt at rest in SmartBuckets
- **GDPR Compliance:** Support data export/deletion

---

## 10. Environment Variables

```env
# Server
NODE_ENV=development
PORT=3001
BASE_URL=https://api.callmeback.app

# Database (Raindrop SmartSQL)
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=30d

# Raindrop
RAINDROP_API_KEY=your-raindrop-key
RAINDROP_PROJECT_ID=your-project-id

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-key

# Cerebras
CEREBRAS_API_KEY=your-cerebras-key

# OpenAI (fallback)
OPENAI_API_KEY=your-openai-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# STT Service (choose one)
DEEPGRAM_API_KEY=your-deepgram-key
# or ASSEMBLYAI_API_KEY=your-assemblyai-key
# or OPENAI_API_KEY (for Whisper)
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1) - MVP
**Priority: High**

- [ ] Set up Node.js/Express server with Raindrop MCP
- [ ] Configure SmartSQL database and run migrations
- [ ] Implement JWT authentication (login, register, logout, me)
- [ ] Add rate limiting middleware
- [ ] Configure CORS for frontend
- [ ] Create error handling middleware
- [ ] Set up logging

**Deliverable:** Authentication working, frontend can login/register

---

### Phase 2: Core Call Features (Week 1-2) - MVP
**Priority: High**

- [ ] Integrate Twilio Programmable Voice
- [ ] Implement POST /api/call endpoint
- [ ] Set up Twilio webhooks (answer, callback)
- [ ] Implement call history (GET /api/calls)
- [ ] Basic persona management (GET /api/personas)
- [ ] Store system personas in SmartMemory
- [ ] Test end-to-end call flow

**Deliverable:** Can trigger a call, receive TwiML, get call history

---

### Phase 3: Real-Time Voice (Week 2) - MVP
**Priority: Critical**

- [ ] Set up WebSocket server for Twilio Media Streams
- [ ] Integrate STT service (Deepgram recommended)
- [ ] Integrate Cerebras AI for response generation
- [ ] Integrate ElevenLabs TTS
- [ ] Implement conversation flow (STT → AI → TTS → Twilio)
- [ ] Store conversation context in SmartMemory
- [ ] Optimize latency (<3s target)
- [ ] Store transcripts in SmartBuckets

**Deliverable:** Live AI conversation working during phone call

---

### Phase 4: Payments (Week 2-3)
**Priority: High**

- [ ] Integrate Stripe SDK
- [ ] Implement payment method management
- [ ] Create PaymentIntent pre-authorization
- [ ] Implement manual capture after call
- [ ] Set up Stripe webhooks
- [ ] Add usage statistics endpoint
- [ ] Implement billing info endpoint

**Deliverable:** Payment flow working, can charge for calls

---

### Phase 5: Scheduling & Polish (Week 3)
**Priority: Medium**

- [ ] Implement scheduled calls (POST /api/calls/schedule)
- [ ] Set up cron job / queue system for scheduled calls
- [ ] Implement cancel scheduled call
- [ ] Add custom persona creation
- [ ] Implement contact management
- [ ] Add profile update endpoint
- [ ] Polish error messages

**Deliverable:** Full feature parity with frontend

---

### Phase 6: Optimization (Week 3-4)
**Priority: Medium**

- [ ] Implement caching (Redis or SmartMemory)
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Load testing
- [ ] Security audit
- [ ] Add monitoring/logging
- [ ] Performance tuning for <3s response

**Deliverable:** Production-ready backend

---

### Phase 7: Production (Week 4)
**Priority: High**

- [ ] Deploy to Fly.io or Vultr
- [ ] Configure production environment variables
- [ ] Set up HTTPS/SSL
- [ ] Configure production Stripe account
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Create deployment documentation
- [ ] Final testing with production frontend

**Deliverable:** Live production system

---

## 12. Testing Strategy

### Unit Tests
- Authentication logic (JWT, password hashing)
- Payment calculations
- Input validation
- Persona management

### Integration Tests
- API endpoints (all 23)
- Twilio webhook handling
- Stripe webhook handling
- Database operations

### End-to-End Tests
- Complete call flow (trigger → Twilio → AI → completion)
- Payment flow (pre-auth → call → capture)
- Scheduled call execution
- User registration → login → make call

### Performance Tests
- Response time <3 seconds for AI conversation
- Concurrent calls handling
- Database query performance
- API rate limiting

---

## 13. Monitoring & Logging

### Key Metrics
- **Call Success Rate:** Target 90%+
- **Average Response Time:** Target <3s
- **Payment Success Rate:** Target 95%+
- **API Response Times:** p95, p99
- **Error Rates:** By endpoint

### Logging
```javascript
// Structured logging
logger.info('Call initiated', {
  userId,
  callId,
  personaId,
  phoneNumber: maskPhone(phoneNumber),
  timestamp: new Date()
})

logger.error('AI inference failed', {
  callId,
  provider: 'cerebras',
  error: error.message,
  fallback: 'openai'
})
```

### Alerting
- Payment failures
- High error rate (>5%)
- Slow response times (>5s)
- Twilio failures
- ElevenLabs/Cerebras API errors

---

## 14. Success Metrics

### Technical Metrics
- ✅ Response time <3 seconds (target <1s AI inference)
- ✅ Call success rate >90%
- ✅ API uptime >99%
- ✅ Payment success rate >95%
- ✅ Operating cost <$0.25/minute

### Hackathon Metrics
- ✅ Demo video showcasing Raindrop + ElevenLabs + Cerebras
- ✅ Working end-to-end phone call with AI persona
- ✅ README highlighting partner technology integration
- ✅ Code demonstrates best practices for each technology

### User Experience
- ✅ Natural-sounding AI voice (ElevenLabs quality)
- ✅ Believable conversation flow
- ✅ Quick response times (feels real-time)
- ✅ Reliable call connection

---

## 15. Risks & Mitigations

### Technical Risks

**Risk:** Cerebras API latency or unavailability
- **Mitigation:** Fallback to OpenAI Realtime API
- **Mitigation:** Pre-warm connections, retry logic

**Risk:** ElevenLabs TTS latency
- **Mitigation:** Use turbo model, maximum streaming optimization
- **Mitigation:** Consider caching common phrases

**Risk:** Twilio Media Stream complexity
- **Mitigation:** Start with simple TwiML, iterate
- **Mitigation:** Extensive testing before production

**Risk:** WebSocket connection drops
- **Mitigation:** Implement reconnection logic
- **Mitigation:** Graceful degradation

### Business Risks

**Risk:** High operating costs
- **Mitigation:** Monitor costs per call closely
- **Mitigation:** Optimize AI token usage
- **Mitigation:** Consider call duration limits

**Risk:** Payment fraud
- **Mitigation:** Stripe fraud detection
- **Mitigation:** Rate limiting on calls
- **Mitigation:** Phone number verification

---

## 16. Deliverables

### Code Deliverables
1. **Backend API** - All 23 endpoints implemented
2. **WebSocket Server** - Real-time voice handling
3. **Database Schema** - Raindrop SmartSQL tables
4. **Integration Code** - Twilio, ElevenLabs, Cerebras, Stripe
5. **Tests** - Unit, integration, e2e tests

### Documentation Deliverables
1. **README.md** - Project overview, setup instructions
2. **API Documentation** - Already created (API_SPECIFICATION.md)
3. **Deployment Guide** - How to deploy to production
4. **Integration Guide** - How each partner tech is used

### Hackathon Deliverables
1. **Demo Video** - 2-3 minutes showcasing live call
2. **Presentation** - Highlighting Raindrop, ElevenLabs, Cerebras
3. **Working Demo** - Live deployment
4. **Code Repository** - Clean, documented code

---

## 17. Next Steps After PRD

### Immediate Actions (When Claude Code Restarts)

1. **Call Raindrop MCP `get-prompt` tool** to start new development session
   ```
   Tool: mcp__raindrop-mcp__get-prompt
   Parameters: (none - this starts a new session)
   ```

2. **Provide this PRD** when the MCP asks for product requirements

3. **Follow the MCP workflow** to:
   - Generate database schema
   - Create API endpoints
   - Set up integrations
   - Implement real-time voice pipeline

4. **Test incrementally:**
   - Phase 1: Auth endpoints
   - Phase 2: Basic call triggering
   - Phase 3: Real-time voice
   - Phase 4: Payments

5. **Deploy and demo:**
   - Deploy to Fly.io/Vultr
   - Create demo video
   - Submit to hackathon

---

## 18. Instructions for Claude Code Session (IMPORTANT - READ ON RESTART)

**When Claude Code restarts with Raindrop MCP access:**

### Step 1: Verify MCP Access
Check that the following MCP tool is available:
- `mcp__raindrop-mcp__get-prompt`

If not available, run: `raindrop mcp status` and troubleshoot.

### Step 2: Start New Raindrop Application Session
Call the MCP tool to begin:
```
mcp__raindrop-mcp__get-prompt()
```

This will return workflow instructions from the Raindrop MCP.

### Step 3: Provide This PRD
When the MCP asks for product requirements or PRD, provide the contents of this file (`BACKEND_PRD.md`).

**Key points to emphasize:**
- Backend must support the Vue.js frontend we already built
- All 23 API endpoints from `API_SPECIFICATION.md` must be implemented
- Use Raindrop (SmartMemory, SmartSQL, SmartBuckets), ElevenLabs, and Cerebras
- Real-time voice pipeline is critical path (Twilio → STT → AI → TTS → Twilio)
- Target <3s response time, <1s for AI inference
- This is a hackathon project showcasing partner technologies

### Step 4: Follow MCP Workflow
The Raindrop MCP will guide the implementation. Use `mcp__raindrop-mcp__update-state` to report task completion.

### Step 5: Reference Existing Docs
Throughout implementation, reference:
- `API_SPECIFICATION.md` - Complete API reference
- `IMPLEMENTATION_SUMMARY.md` - Frontend overview
- `OPENING_MATTER.md` - Original project vision
- Frontend store files (`src/stores/*.js`) - Detailed endpoint specs

### Step 6: Implementation Priority
Focus on this order:
1. **Authentication** (4 endpoints) - Foundation
2. **Call Management** (5 endpoints) - Core feature
3. **Real-Time Voice Pipeline** - Critical differentiator
4. **Payments** (7 endpoints) - Revenue
5. **Personas & Contacts** (10 endpoints) - Polish

### Step 7: Testing Strategy
Test each phase before moving to next:
- Auth: Can login/register from frontend
- Calls: Can trigger call, receive TwiML
- Voice: Live conversation works
- Payments: Pre-auth and capture works
- Full: End-to-end user journey

### Step 8: Deployment
Once working:
1. Deploy to Fly.io or Vultr
2. Update frontend `.env` with backend URL
3. Test production deployment
4. Create demo video
5. Prepare hackathon submission

---

## 19. Hackathon Submission Highlights

**When creating demo video and presentation, emphasize:**

### Raindrop Integration
- **SmartMemory:** Stores conversation context across turns, maintains persona state
- **SmartSQL:** Manages structured data (users, calls, personas) with complex queries
- **SmartBuckets:** Stores call transcripts and audio files with auto-expiration
- **MCP Orchestration:** Coordinates the entire AI workflow

### ElevenLabs Integration
- **Natural Voice Quality:** Multiple persona voices that sound human
- **Streaming TTS:** Real-time audio generation for low latency
- **Turbo Model:** Optimized for speed in conversational scenarios

### Cerebras Integration
- **Sub-Second Inference:** <1s AI response time with llama3.1-8b
- **Streaming Responses:** Start TTS before AI finishes generating
- **Fallback Pattern:** Gracefully degrades to OpenAI if needed

### The Magic Moment
**"Watch as I receive a real phone call from my AI 'Best Friend' who helps me escape this awkward meeting..."**

Show the entire flow:
1. User clicks "Call Me Now" in Vue.js frontend
2. Phone rings immediately
3. User answers and has natural conversation with AI
4. AI responds in <3 seconds with natural voice
5. Call ends, transcript saved, payment captured
6. Dashboard shows call history and cost

---

## Conclusion

This PRD provides everything needed to build a production-ready backend that:
- ✅ Supports all frontend features (23 API endpoints)
- ✅ Delivers real-time AI phone conversations (<3s response)
- ✅ Integrates hackathon partner technologies (Raindrop, ElevenLabs, Cerebras)
- ✅ Processes payments securely (Stripe pre-auth and capture)
- ✅ Scales to handle multiple concurrent calls
- ✅ Provides excellent demo for hackathon submission

**Ready to build with Raindrop MCP!**

---

**END OF PRD**
