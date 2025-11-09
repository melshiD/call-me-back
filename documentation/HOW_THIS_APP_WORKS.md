# How "Call Me Back" Works - Complete Technical Flow

**Last Updated:** 2025-01-07
**Purpose:** Comprehensive technical reference for development continuity
**Audience:** Future Claude (or any developer) picking up this project

---

## 🎯 The Big Picture

"Call Me Back" is an AI-powered phone companion that lets users receive **real phone calls** from AI personas (like "Brad the bro friend" or "Emma the supportive partner"). The AI has **personalized memories** of each user and provides **real-time voice conversations** with sub-3-second response times.

**Key Innovation:** Same persona (e.g., "Brad") behaves differently for each user based on their unique relationship context stored in a 4-tiered memory system.

---

## 🏗️ Architecture Overview

### **Stack:**
- **Frontend:** Vue.js 3 + Vite + Pinia (state management) + Vue Router
- **Backend:** Raindrop Platform (deployed) with 7 microservices
- **Database:** SmartSQL (SQLite-based, managed by Raindrop)
- **Memory:** SmartMemory (4-tier system for persona context)
- **Storage:** SmartBuckets (S3-compatible for call transcripts)
- **Telephony:** Twilio Programmable Voice + Media Streams (WebSocket)
- **AI Inference:** Cerebras (primary), OpenAI (fallback)
- **Text-to-Speech:** ElevenLabs Turbo v2 (streaming)
- **Speech-to-Text:** Deepgram Nova 2
- **Payments:** Stripe (manual capture PaymentIntents)

### **Deployment:**
- **Backend API:** `https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run`
- **Frontend:** Local dev server (will be deployed later)
- **Database:** Raindrop-managed SmartSQL instance
- **Session ID:** `01k9dd97njbexcbqtkcy93z98t`

---

## 📂 Project Structure

```
/usr/code/ai_championship/call-me-back/
├── src/                          # Frontend Vue.js app
│   ├── main.js                   # App entry point
│   ├── router/index.js           # Vue Router config
│   ├── stores/                   # Pinia state management
│   │   ├── auth.js               # JWT auth, user state
│   │   ├── calls.js              # Call history, trigger calls
│   │   ├── personas.js           # Persona CRUD, contacts
│   │   └── user.js               # Profile, billing, usage
│   ├── components/               # Vue components
│   ├── views/                    # Page components
│   └── assets/                   # CSS, images
│
├── src/ (Backend - Raindrop)     # Backend microservices
│   ├── api-gateway/              # PUBLIC - HTTP endpoint router
│   │   └── index.ts              # Routes all HTTP requests
│   ├── auth-manager/             # PRIVATE - Authentication
│   │   ├── index.ts              # register(), login(), validateToken(), logout()
│   │   ├── utils.ts              # JWT helpers, bcrypt
│   │   └── interfaces.ts         # TypeScript types
│   ├── persona-manager/          # PRIVATE - Persona CRUD
│   │   ├── index.ts              # getPersonas(), createPersona(), addContact()
│   │   └── interfaces.ts         # Persona types
│   ├── call-orchestrator/        # PRIVATE - Call lifecycle
│   │   ├── index.ts              # initiateCall(), scheduleCall()
│   │   └── interfaces.ts         # Call types
│   ├── payment-processor/        # PRIVATE - Stripe integration
│   │   ├── index.ts              # createPaymentIntent(), capturePayment()
│   │   └── interfaces.ts         # Payment types
│   ├── voice-pipeline/           # PRIVATE - Real-time voice WebSocket
│   │   ├── index.ts              # WebSocket handler, STT→AI→TTS loop
│   │   └── interfaces.ts         # Voice types
│   ├── webhook-handler/          # PRIVATE - External webhooks
│   │   ├── index.ts              # handleTwilioWebhook(), handleStripeWebhook()
│   │   └── interfaces.ts         # Webhook types
│   ├── shared/                   # Shared utilities
│   │   ├── db-helpers.ts         # executeSQL() wrapper
│   │   ├── cost-tracker.ts       # CallCostTracker class
│   │   ├── persona-relationship.ts # PersonaRelationshipManager class
│   │   ├── utils.ts              # Generic helpers
│   │   └── interfaces.ts         # Shared types
│   └── sql/
│       └── call-me-back-db.ts    # Database schema (all tables)
│
├── raindrop.manifest             # Raindrop app config (7 services, 4 resources)
├── .env.example                  # All 83 environment variables
├── package.json                  # Dependencies
│
└── DOCS/                         # Documentation
    ├── BACKEND_PRD.md            # Original backend requirements
    ├── RAINDROP_PRD.md           # Raindrop-generated PRD
    ├── PERSONA_MEMORY_ARCHITECTURE.md
    ├── COST_TRACKING_ARCHITECTURE.md
    ├── DEPLOYMENT_QUICKSTART.md
    ├── NEW_SERVICES_SUMMARY.md
    └── HOW_THIS_APP_WORKS.md     # This file
```

---

## 🔄 Complete User Journey Flow

### **Flow 1: User Registration & Login**

#### **Frontend:**
1. User fills form at `/register`
2. `src/stores/auth.js` → `register()` called
3. Validates password (min 8 chars, uppercase, lowercase, number, special)
4. Calls `POST /api/auth/register`

#### **Backend:**
5. **api-gateway** routes to **auth-manager**
6. `src/auth-manager/index.ts` → `register()` function:
   - Validates input
   - Checks if email/phone already exists via `executeSQL()`
   - Hashes password with bcrypt (cost 12)
   - Inserts user into `users` table
   - Generates JWT token (30-day expiration)
   - Returns `{ token, user }`

7. **Frontend receives response:**
   - Stores token in `localStorage`
   - Stores user object in Pinia store
   - Redirects to `/dashboard`

#### **Key Files:**
- Frontend: `src/stores/auth.js` (lines 20-45)
- Backend: `src/auth-manager/index.ts` (lines 11-64)
- Database: `users` table in `src/sql/call-me-back-db.ts`

---

### **Flow 2: Browsing & Adding Personas**

#### **Frontend:**
1. User navigates to `/personas`
2. `src/views/PersonasView.vue` loads
3. `src/stores/personas.js` → `fetchPersonas()` called on mount

#### **Backend:**
4. **api-gateway** → **persona-manager**
5. `src/persona-manager/index.ts` → `getPersonas()`:
   - Queries `personas` table with filters (public + user's private)
   - Returns paginated list

6. **User clicks "Add to Contacts" on Brad:**
7. Frontend calls `addToContacts(bradId)`
8. Backend `addContact()`:
   - Inserts into `contacts` table
   - Creates `user_persona_relationships` entry (if first time)
   - Default relationship type: "friend"

#### **Key Files:**
- Frontend: `src/stores/personas.js` (lines 50-120)
- Backend: `src/persona-manager/index.ts` (lines 78-102)
- Database: `personas`, `contacts`, `user_persona_relationships` tables

---

### **Flow 3: Triggering a Phone Call (THE BIG ONE)**

This is the most complex flow - involves 7 services and 5 external APIs.

#### **A. Pre-Call (Frontend):**

1. **User clicks "Call Me Now" on Brad's card**
2. `src/views/DashboardView.vue` → triggers call flow
3. `src/stores/calls.js` → `initiateCall(personaId, phoneNumber)`:

```javascript
// src/stores/calls.js (line ~85)
async initiateCall(personaId, phoneNumber) {
  // Step 1: Create payment intent (pre-auth)
  const paymentIntent = await userStore.createPaymentIntent(5); // 5 min estimate

  // Step 2: Estimate cost and show to user
  const estimate = await this.estimateCost(personaId, 5);
  // Shows: "Estimated cost: $2.45"

  // Step 3: User confirms
  const confirmed = await confirmDialog(estimate);
  if (!confirmed) return;

  // Step 4: Trigger call
  const response = await api.post('/api/call', {
    persona_id: personaId,
    phone_number: phoneNumber,
    payment_intent_id: paymentIntent.id
  }, {
    headers: { Authorization: `Bearer ${authStore.token}` }
  });

  return response.data; // { call_id, status: 'initiated' }
}
```

#### **B. Backend Call Initiation:**

4. **api-gateway** → **call-orchestrator**
5. `src/call-orchestrator/index.ts` → `initiateCall()`:

```typescript
// src/call-orchestrator/index.ts (line ~10)
async initiateCall(input: { userId: string; personaId: string; phoneNumber: string; paymentIntentId: string }) {
  // Step 1: Verify payment
  const paymentValid = await this.env.PAYMENT_PROCESSOR.verifyPaymentIntent(input.paymentIntentId);
  if (!paymentValid) throw new Error('Payment failed');

  // Step 2: Check no concurrent calls
  const activeCalls = await executeSQL(
    this.env.CALL_ME_BACK_DB,
    "SELECT id FROM calls WHERE user_id = ? AND status IN ('pending', 'in-progress')",
    [input.userId]
  );
  if (activeCalls.rows.length > 0) throw new Error('Concurrent call exists');

  // Step 3: Create call record
  const callId = crypto.randomUUID();
  await executeSQL(
    this.env.CALL_ME_BACK_DB,
    'INSERT INTO calls (id, user_id, persona_id, phone_number, status, payment_intent_id) VALUES (?, ?, ?, ?, ?, ?)',
    [callId, input.userId, input.personaId, input.phoneNumber, 'pending', input.paymentIntentId]
  );

  // Step 4: Initialize cost tracking
  const costTracker = new CallCostTracker(callId, input.userId, this.env.CALL_ME_BACK_DB);
  await costTracker.initialize();
  // Creates entry in call_cost_breakdowns with $0.25 Twilio connection fee

  // Step 5: Load persona relationship and build memory context
  const relManager = new PersonaRelationshipManager(this.env.CALL_ME_BACK_DB, this.env.CONVERSATION_MEMORY);
  const relationship = await relManager.getOrCreateRelationship(input.userId, input.personaId);
  const longTermMemory = await relManager.getLongTermMemory(input.userId, input.personaId);
  const recentContext = await relManager.getRecentContext(input.userId, input.personaId);

  // Step 6: Build composite system prompt
  const persona = await this.getPersona(input.personaId);
  const systemPrompt = await relManager.buildCompositePrompt(
    input.userId,
    input.personaId,
    persona.system_prompt,
    persona.personality_traits
  );

  // Step 7: Store prompt in SmartMemory for voice pipeline to use
  await this.env.CONVERSATION_MEMORY.set(`call_session:${callId}`, {
    session_id: callId,
    user_id: input.userId,
    persona_id: input.personaId,
    relationship_id: relationship.id,
    system_prompt: systemPrompt.full_prompt,
    conversation_history: [],
    current_context: {}
  });

  // Step 8: Initiate Twilio call
  const twilioCall = await this.initiateTwilioCall(input.phoneNumber, callId);

  // Step 9: Update call record with Twilio SID
  await executeSQL(
    this.env.CALL_ME_BACK_DB,
    'UPDATE calls SET sid = ?, status = ?, start_time = datetime("now") WHERE id = ?',
    [twilioCall.sid, 'initiated', callId]
  );

  return { call_id: callId, status: 'initiated', twilio_sid: twilioCall.sid };
}

async initiateTwilioCall(phoneNumber: string, callId: string) {
  // Uses Twilio SDK (via env vars)
  const twilio = require('twilio')(this.env.TWILIO_ACCOUNT_SID, this.env.TWILIO_AUTH_TOKEN);

  const call = await twilio.calls.create({
    to: phoneNumber,
    from: this.env.TWILIO_PHONE_NUMBER,
    url: `${this.env.BASE_URL}/api/twilio/answer?callId=${callId}`,
    statusCallback: `${this.env.BASE_URL}/api/twilio/callback`,
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallbackMethod: 'POST'
  });

  return call;
}
```

#### **C. Twilio Calls Backend (TwiML Response):**

6. **User's phone rings**
7. **User answers**
8. **Twilio requests:** `POST /api/twilio/answer?callId=abc123`
9. **api-gateway** → **webhook-handler**
10. `src/webhook-handler/index.ts` → `handleTwilioAnswer()`:

```typescript
async handleTwilioAnswer(callId: string): Response {
  // Generate TwiML to start media stream
  const twiml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="alice">Hey! One second, let me just...</Say>
      <Connect>
        <Stream url="wss://${this.env.BASE_URL}/api/twilio/stream?callId=${callId}" />
      </Connect>
    </Response>
  `;

  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' }
  });
}
```

#### **D. Real-Time Voice Loop (WebSocket):**

11. **Twilio establishes WebSocket:** `wss://[BASE_URL]/api/twilio/stream?callId=abc123`
12. **api-gateway** → **voice-pipeline**
13. `src/voice-pipeline/index.ts` → WebSocket handler:

```typescript
// src/voice-pipeline/index.ts (line ~20)
async handleWebSocket(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const callId = url.searchParams.get('callId');

  // Upgrade to WebSocket
  const { socket, response } = Durable.WebSocketPair();

  // Accept connection
  socket.accept();

  // Load call context from SmartMemory
  const session = await this.env.CONVERSATION_MEMORY.get(`call_session:${callId}`);
  const costTracker = new CallCostTracker(callId, session.user_id, this.env.CALL_ME_BACK_DB);

  let audioBuffer: Buffer[] = [];

  socket.addEventListener('message', async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.event === 'connected') {
      this.env.logger.info('WebSocket connected', { callId });
    }

    if (msg.event === 'start') {
      this.env.logger.info('Call stream started', { callId, streamSid: msg.start.streamSid });
    }

    if (msg.event === 'media') {
      // Incoming audio from user (base64 μ-law)
      const audioPayload = msg.media.payload;
      audioBuffer.push(Buffer.from(audioPayload, 'base64'));
    }

    if (msg.event === 'stop' || audioBuffer.length > 50) { // Stop event or buffer full
      // User finished speaking OR buffer is full enough to process

      // STEP 1: SPEECH-TO-TEXT
      const audioData = Buffer.concat(audioBuffer);
      const userText = await this.transcribeAudio(audioData); // Deepgram (is this deepgram running on Cerebras?)
      const audioDurationSeconds = audioBuffer.length * 0.02; // Rough estimate
      await costTracker.trackSTT(audioDurationSeconds);

      audioBuffer = []; // Clear buffer

      if (!userText || userText.trim().length === 0) return;

      // STEP 2: UPDATE CONVERSATION HISTORY
      session.conversation_history.push({
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString()
      });

      await this.env.CONVERSATION_MEMORY.set(`call_session:${callId}`, session);

      // STEP 3: AI INFERENCE (Cerebras or OpenAI)
      const messages = [
        { role: 'system', content: session.system_prompt },
        ...session.conversation_history
      ];

      let aiResponse: { text: string; input_tokens: number; output_tokens: number };

      try {
        aiResponse = await this.generateAIResponse(messages, 'cerebras');
        await costTracker.trackAIInference(aiResponse.input_tokens, aiResponse.output_tokens, 'cerebras');
      } catch (error) {
        // Fallback to OpenAI
        this.env.logger.warn('Cerebras failed, falling back to OpenAI', { error });
        aiResponse = await this.generateAIResponse(messages, 'openai');
        await costTracker.trackAIInference(aiResponse.input_tokens, aiResponse.output_tokens, 'openai', 'Cerebras API error');
      }

      // STEP 4: TEXT-TO-SPEECH (ElevenLabs)
      const voiceAudio = await this.synthesizeSpeech(aiResponse.text, session.voice_id);
      await costTracker.trackTTS(aiResponse.text, session.voice_id, 'eleven_turbo_v2');

      // STEP 5: UPDATE CONVERSATION HISTORY
      session.conversation_history.push({
        role: 'assistant',
        content: aiResponse.text,
        timestamp: new Date().toISOString()
      });

      await this.env.CONVERSATION_MEMORY.set(`call_session:${callId}`, session);

      // STEP 6: SEND AUDIO BACK TO TWILIO
      // Convert audio to μ-law base64
      const audioBase64 = voiceAudio.toString('base64');

      socket.send(JSON.stringify({
        event: 'media',
        streamSid: msg.streamSid,
        media: {
          payload: audioBase64
        }
      }));

      // STEP 7: CHECK BUDGET
      const { total_cents } = await costTracker.getCurrentTotal();

      if (total_cents > 500) { // $5 warning threshold
        // TODO: Send in-call warning to user
        this.env.logger.warn('Call approaching budget limit', { callId, total_cents });
      }
    }

    if (msg.event === 'closed') {
      // Call ended
      this.env.logger.info('Call ended', { callId });
      socket.close();
    }
  });

  return response;
}

async transcribeAudio(audioData: Buffer): Promise<string> {
  // Call Deepgram API
  const response = await fetch('https://api.deepgram.com/v1/listen', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${this.env.DEEPGRAM_API_KEY}`,
      'Content-Type': 'audio/wav'
    },
    body: audioData
  });

  const result = await response.json();
  return result.results.channels[0].alternatives[0].transcript;
}

async generateAIResponse(messages: any[], provider: 'cerebras' | 'openai'): Promise<{ text: string; input_tokens: number; output_tokens: number }> {
  if (provider === 'cerebras') {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.CEREBRAS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages,
        max_tokens: 150,
        temperature: 0.7,
        stream: false
      })
    });

    const result = await response.json();
    return {
      text: result.choices[0].message.content,
      input_tokens: result.usage.prompt_tokens,
      output_tokens: result.usage.completion_tokens
    };
  } else {
    // OpenAI fallback
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const result = await response.json();
    return {
      text: result.choices[0].message.content,
      input_tokens: result.usage.prompt_tokens,
      output_tokens: result.usage.completion_tokens
    };
  }
}

async synthesizeSpeech(text: string, voiceId: string): Promise<Buffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': this.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      },
      output_format: 'ulaw_8000' // Twilio-compatible
    })
  });

  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer);
}
```

#### **E. Post-Call Processing:**

14. **User hangs up**
15. **Twilio sends webhook:** `POST /api/twilio/callback`
16. **webhook-handler** → `handleTwilioCallback()`:

```typescript
async handleTwilioCallback(twilioData: any): Promise<void> {
  const { CallSid, CallStatus, CallDuration } = twilioData;

  // Find call by Twilio SID
  const callResult = await executeSQL(
    this.env.CALL_ME_BACK_DB,
    'SELECT * FROM calls WHERE sid = ?',
    [CallSid]
  );

  if (callResult.rows.length === 0) return;

  const call = callResult.rows[0];
  const callId = call.id;
  const userId = call.user_id;
  const personaId = call.persona_id;

  // Update call status
  await executeSQL(
    this.env.CALL_ME_BACK_DB,
    'UPDATE calls SET status = ?, end_time = datetime("now"), duration = ? WHERE id = ?',
    [CallStatus === 'completed' ? 'completed' : 'failed', CallDuration, callId]
  );

  if (CallStatus !== 'completed') return;

  // FINALIZE COSTS
  const costTracker = new CallCostTracker(callId, userId, this.env.CALL_ME_BACK_DB);
  const finalCost = await costTracker.finalize(new Date());

  // CAPTURE STRIPE PAYMENT (actual amount)
  await this.env.PAYMENT_PROCESSOR.capturePayment(call.payment_intent_id, finalCost.total_cost_cents);

  // UPDATE CALL RECORD WITH FINAL COST
  await executeSQL(
    this.env.CALL_ME_BACK_DB,
    'UPDATE calls SET cost = ? WHERE id = ?',
    [finalCost.total_cost_cents / 100, callId] // Store in dollars
  );

  // UPDATE RELATIONSHIP STATISTICS
  const relManager = new PersonaRelationshipManager(this.env.CALL_ME_BACK_DB, this.env.CONVERSATION_MEMORY);
  const durationMinutes = Math.ceil(CallDuration / 60);
  await relManager.incrementCallStats(userId, personaId, durationMinutes);

  // GET FULL TRANSCRIPT FROM WORKING MEMORY
  const session = await this.env.CONVERSATION_MEMORY.get(`call_session:${callId}`);
  const transcript = session.conversation_history;

  // STORE TRANSCRIPT IN SMARTBUCKETS
  await this.env.CALL_TRANSCRIPTS.put(`transcripts/${callId}.json`, JSON.stringify({
    call_id: callId,
    user_id: userId,
    persona_id: personaId,
    transcript,
    duration: CallDuration,
    cost: finalCost.total_cost_cents,
    timestamp: new Date().toISOString()
  }));

  // EXTRACT MEMORIES (AI-powered)
  const longTermMemory = await relManager.getLongTermMemory(userId, personaId);
  const extractedFacts = await this.extractMemories(transcript, longTermMemory);

  // UPDATE LONG-TERM MEMORY
  await relManager.setLongTermMemory(userId, personaId, {
    ...longTermMemory,
    ...extractedFacts
  });

  // UPDATE SHORT-TERM MEMORY (recent calls)
  const summary = await this.summarizeCall(transcript);
  await relManager.updateRecentContext(
    userId,
    personaId,
    callId,
    summary.text,
    summary.topics,
    summary.outcome
  );

  // CLEANUP WORKING MEMORY
  await this.env.CONVERSATION_MEMORY.delete(`call_session:${callId}`);

  this.env.logger.info('Call post-processing complete', { callId, finalCost: finalCost.total_cost_cents });
}

async extractMemories(transcript: any[], existingMemory: any): Promise<any> {
  // Use Cerebras to analyze transcript and extract facts
  const prompt = `Analyze this conversation and extract:
1. User facts (job, hobbies, family, preferences)
2. Relationship details (how they know each other)
3. Inside jokes or references
4. Important events mentioned

Existing memory: ${JSON.stringify(existingMemory)}

Conversation:
${transcript.map(t => `${t.role}: ${t.content}`).join('\n')}

Return JSON with: user_facts, relationship_facts, inside_jokes, important_memories`;

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.env.CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    })
  });

  const result = await response.json();
  const extracted = JSON.parse(result.choices[0].message.content);

  return extracted;
}

async summarizeCall(transcript: any[]): Promise<{ text: string; topics: string[]; outcome: string }> {
  // Similar AI call to generate call summary
  // Returns: { text: "Discussed work conflict with Sarah", topics: ["work", "conflict"], outcome: "advice_given" }
}
```

17. **Frontend polls** `GET /api/calls/:id` until status is "completed"
18. **Shows final cost** and updates call history

---

## 🗂️ Database Schema (All Tables)

### **Core Tables (Original):**

1. **`users`** - User accounts
   - `id`, `email`, `password_hash`, `name`, `phone`
   - `stripe_customer_id`, `default_payment_method`
   - `email_verified`, `phone_verified`
   - Created by: `auth-manager`

2. **`personas`** - AI persona definitions
   - `id`, `name`, `description`, `voice`, `system_prompt`
   - `is_public`, `created_by`, `tags`
   - Created by: `persona-manager` or seeded

3. **`calls`** - Call history
   - `id`, `user_id`, `persona_id`, `phone_number`
   - `status`, `start_time`, `end_time`, `duration`, `cost`
   - `sid` (Twilio), `transcript`, `payment_intent_id`
   - Created by: `call-orchestrator`

4. **`scheduled_calls`** - Future scheduled calls
   - `id`, `user_id`, `persona_id`, `phone_number`, `scheduled_time`
   - `status`, `payment_intent_id`
   - Created by: `call-orchestrator`

5. **`contacts`** - User's favorite personas
   - `id`, `user_id`, `persona_id`, `added_at`
   - Created by: `persona-manager`

6. **`payment_methods`** - Stripe payment methods
   - `id`, `user_id`, `stripe_pm_id`, `type`, `last4`, `brand`
   - `is_default`
   - Created by: `payment-processor`

7. **`token_blacklist`** - Revoked JWT tokens
   - `token_id`, `user_id`, `expires_at`
   - Created by: `auth-manager`

### **New Tables (Cost Tracking & Memory):**

8. **`user_persona_relationships`** - User-specific persona contexts
   - `id`, `user_id`, `persona_id`, `relationship_type`
   - `custom_system_prompt` - User's personalization
   - `memory_config` - JSON: remember settings
   - `total_calls`, `total_minutes`, `last_call_at`
   - Created by: `PersonaRelationshipManager`

9. **`call_cost_breakdowns`** - Per-call cost tracking
   - `id`, `call_id`, `user_id`
   - Twilio costs: `twilio_connection_fee_cents`, `twilio_duration_seconds`, `twilio_total_cents`
   - ElevenLabs: `elevenlabs_total_characters`, `elevenlabs_total_requests`, `elevenlabs_total_cents`
   - Cerebras: `cerebras_input_tokens`, `cerebras_output_tokens`, `cerebras_total_cents`
   - OpenAI: `openai_*` fields + `openai_fallback_triggered`, `openai_fallback_reason`
   - Deepgram: `deepgram_audio_duration_seconds`, `deepgram_total_cents`
   - Totals: `subtotal_cents`, `stripe_fee_cents`, `total_cost_cents`
   - Created by: `CallCostTracker`

10. **`call_cost_events`** - Event-level cost logging
    - `id`, `call_id`, `event_type`, `service`
    - Usage: `tokens_input`, `tokens_output`, `characters`, `duration_seconds`
    - Cost: `unit_cost`, `calculated_cost_cents`
    - Metadata: `request_id`, `model_used`, `success`, `error_message`
    - Created by: `CallCostTracker.logEvent()`

11. **`user_budget_settings`** - User budget preferences
    - `id`, `user_id`
    - Limits: `max_cost_per_call_cents`, `max_cost_per_day_cents`, `max_cost_per_month_cents`
    - Warnings: `warn_at_percent_per_call`, etc.
    - Controls: `max_memory_tokens`, `enable_auto_cutoff`, `cutoff_grace_period_seconds`
    - Created by: User settings API (to be built)

---

## 🧠 Memory System (4 Tiers)

### **Tier 1: Working Memory (Call Session)**
- **Storage:** SmartMemory
- **Key:** `call_session:{callId}`
- **Lifespan:** Duration of call + 1 hour
- **Contents:**
  ```json
  {
    "session_id": "call_abc123",
    "user_id": "user_123",
    "persona_id": "persona_brad",
    "relationship_id": "rel_xyz",
    "system_prompt": "=== CORE IDENTITY ===\nYou are Brad...",
    "conversation_history": [
      { "role": "user", "content": "Hey Brad", "timestamp": "..." },
      { "role": "assistant", "content": "What's up dude?", "timestamp": "..." }
    ],
    "current_context": { "topic": "work", "mood": "stressed" }
  }
  ```
- **Created by:** `call-orchestrator` before Twilio call
- **Used by:** `voice-pipeline` during conversation
- **Deleted by:** `webhook-handler` after call completes

### **Tier 2: Short-Term Memory (Recent Calls)**
- **Storage:** SmartMemory
- **Key:** `recent_calls:{userId}:{personaId}`
- **Lifespan:** 30 days or 100 calls
- **Contents:**
  ```json
  {
    "recent_calls": [
      {
        "call_id": "call_abc123",
        "date": "2025-01-07T10:00:00Z",
        "summary": "Discussed work conflict with Sarah",
        "key_topics": ["work", "sarah", "conflict"],
        "outcome": "action_planned"
      }
    ],
    "ongoing_storylines": [
      {
        "topic": "sarah_work_conflict",
        "first_mentioned": "2025-01-07",
        "status": "in_progress"
      }
    ]
  }
  ```
- **Created/Updated by:** `webhook-handler` post-call processing
- **Used by:** `PersonaRelationshipManager.buildCompositePrompt()`

### **Tier 3: Long-Term Memory (Persistent Facts)**
- **Storage:** SmartMemory
- **Key:** `long_term:{userId}:{personaId}`
- **Lifespan:** Never expires (unless user deletes relationship)
- **Contents:**
  ```json
  {
    "relationship_facts": {
      "how_we_met": "College party in 2020",
      "friendship_duration_years": 5,
      "trust_level": "high"
    },
    "user_facts": {
      "job": "Software Engineer at TechCorp",
      "boss_name": "Marcus",
      "coworkers": ["Sarah (problematic)", "Jake", "Priya"],
      "dating_status": "Casually seeing Jessica",
      "hobbies": ["rock climbing", "fantasy football"],
      "allergies": ["peanuts"]
    },
    "inside_jokes": [
      "The burrito incident (2021)",
      "Never trust a guy named Trevor"
    ],
    "important_memories": [
      {
        "event": "Helped Alice through breakup",
        "date": "2022-03-15",
        "significance": "high",
        "summary": "3-hour call, Alice devastated, Brad came over with pizza"
      }
    ],
    "preferences": {
      "greeting_style": "casual ('Yo', 'What's up dude')",
      "advice_style": "direct but supportive",
      "topics_to_avoid": ["dad's death", "weight"]
    }
  }
  ```
- **Created by:** `webhook-handler.extractMemories()` (AI-powered)
- **Updated by:** User via memory editor API (to be built)
- **Used by:** `PersonaRelationshipManager.buildCompositePrompt()`

### **Tier 4: Episodic Memory (Full Transcripts)**
- **Storage:** SmartBuckets
- **Path:** `transcripts/{userId}/{personaId}/{callId}.json`
- **Lifespan:** 1 year (configurable)
- **Contents:**
  ```json
  {
    "call_id": "call_abc123",
    "user_id": "user_123",
    "persona_id": "persona_brad",
    "full_transcript": [
      { "speaker": "user", "text": "Hey Brad", "timestamp": "..." },
      { "speaker": "brad", "text": "What's up dude?", "timestamp": "..." }
    ],
    "auto_summary": "Alice called about conflict with Sarah...",
    "extracted_entities": {
      "people_mentioned": ["Sarah", "Marcus", "Jessica"],
      "topics": ["work conflict", "confrontation"],
      "emotions": ["stressed", "frustrated", "relieved"]
    },
    "embedding_vector": [0.123, 0.456, ...], // For semantic search
    "tags": ["work", "conflict_resolution"]
  }
  ```
- **Created by:** `webhook-handler` post-call
- **Searchable by:** SmartBucket semantic search (future feature)

---

## 💰 Cost Tracking Flow

### **Pre-Call Estimation:**
```typescript
// User triggers call
const estimate = await estimateCallCost(5, 2000); // 5 min, 2000 memory tokens
// Returns: { total_cents: 245, breakdown: {...}, warning: "High memory context" }
// Frontend shows: "Estimated cost: $2.45"
```

### **During Call:**
```typescript
// In voice-pipeline WebSocket handler
const costTracker = new CallCostTracker(callId, userId, db);

// After each TTS request
await costTracker.trackTTS("Hey, what's up?", "adam"); // +$0.01

// After each AI inference
await costTracker.trackAIInference(1200, 85, 'cerebras'); // +$0.0013

// After each STT chunk
await costTracker.trackSTT(3.5); // 3.5 seconds audio, +$0.0002

// Get current total anytime
const { total_cents } = await costTracker.getCurrentTotal();
// Frontend polls: GET /api/calls/:id/cost every 5 seconds
```

### **Budget Warning:**
```typescript
// Automatically checked after each cost event
await costTracker.checkBudgetWarnings();

// If at 75% of budget:
// → Logs warning
// → TODO: Send in-call TTS announcement "You've spent $7.50 of your $10 budget"

// If at 100%:
// → Calls emergencyCutoff()
// → Ends call via Twilio API
// → Updates call status to 'terminated'
```

### **Post-Call Finalization:**
```typescript
// After call completes
const final = await costTracker.finalize(new Date());
// Returns: { subtotal_cents: 287, stripe_fee_cents: 38, total_cost_cents: 325 }

// Capture exact amount from Stripe
await stripe.paymentIntents.capture(paymentIntentId, {
  amount_to_capture: 325 // $3.25
});
```

---

## 🔌 External API Integration Points

### **1. Twilio (Telephony)**
- **Used by:** `call-orchestrator`, `webhook-handler`
- **Operations:**
  - `calls.create()` - Initiate outbound call
  - TwiML generation - Answer webhook, start media stream
  - WebSocket - Bidirectional audio streaming
- **Env Vars:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### **2. ElevenLabs (Text-to-Speech)**
- **Used by:** `voice-pipeline`
- **Endpoint:** `POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream`
- **Model:** `eleven_turbo_v2` (fastest, streaming)
- **Output:** `ulaw_8000` (Twilio-compatible)
- **Cost:** $0.30 per 1K characters
- **Env Var:** `ELEVENLABS_API_KEY`

### **3. Cerebras (AI Inference - Primary)**
- **Used by:** `voice-pipeline`, `webhook-handler` (memory extraction)
- **Endpoint:** `POST https://api.cerebras.ai/v1/chat/completions`
- **Model:** `llama3.1-8b`
- **Target:** <1 second inference time
- **Cost:** $0.10 per 1M tokens
- **Env Var:** `CEREBRAS_API_KEY`

### **4. OpenAI (AI Inference - Fallback)**
- **Used by:** `voice-pipeline` (if Cerebras fails)
- **Endpoint:** `POST https://api.openai.com/v1/chat/completions`
- **Model:** `gpt-4-turbo-preview`
- **Cost:** $10/1M input, $30/1M output tokens
- **Env Var:** `OPENAI_API_KEY`

### **5. Deepgram (Speech-to-Text)**
- **Used by:** `voice-pipeline`
- **Endpoint:** `POST https://api.deepgram.com/v1/listen`
- **Model:** `nova-2`
- **Cost:** $0.43 per 100 minutes
- **Env Var:** `DEEPGRAM_API_KEY`

### **6. Stripe (Payments)**
- **Used by:** `payment-processor`, `webhook-handler`
- **Operations:**
  - `paymentIntents.create()` - Pre-auth before call
  - `paymentIntents.capture()` - Charge actual amount after call
  - Webhook handling - Payment events
- **Env Vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## 🛠️ Key Utility Functions

### **Database Helper:**
```typescript
// src/shared/db-helpers.ts
async function executeSQL(db: SmartSql, sql: string, args?: any[]): Promise<{ rows: any[] }> {
  // Formats SQL with args and calls db.executeQuery()
  // Returns parsed JSON results as rows
}
```

### **Cost Tracker:**
```typescript
// src/shared/cost-tracker.ts
class CallCostTracker {
  async initialize()
  async trackTTS(text, voiceId, model)
  async trackAIInference(inputTokens, outputTokens, provider, fallbackReason?)
  async trackSTT(audioDurationSeconds)
  async trackCallDuration()
  async getCurrentTotal()
  async checkBudgetWarnings()
  async finalize(callEndedAt)
}

function estimateCallCost(estimatedDurationMinutes, memoryTokens)
```

### **Persona Relationship Manager:**
```typescript
// src/shared/persona-relationship.ts
class PersonaRelationshipManager {
  async getOrCreateRelationship(userId, personaId, initialType)
  async updateRelationship(userId, personaId, updates)
  async incrementCallStats(userId, personaId, durationMinutes)
  async getLongTermMemory(userId, personaId)
  async setLongTermMemory(userId, personaId, memory)
  async addFact(userId, personaId, category, key, value)
  async deleteFact(userId, personaId, category, key)
  async getRecentContext(userId, personaId, maxCalls)
  async updateRecentContext(userId, personaId, callId, summary, topics, outcome)
  async buildCompositePrompt(userId, personaId, corePrompt, traits, tokenBudget)
}

async function extractMemoryFromTranscript(transcript, existingMemory)
```

---

## 📡 API Endpoints (23 Total)

### **Authentication (4):**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (auth required)
- `POST /api/auth/logout` - Logout (auth required)

### **Calls (5):**
- `GET /api/calls` - Call history (auth)
- `POST /api/call` - Trigger immediate call (auth)
- `GET /api/calls/scheduled` - Get scheduled calls (auth)
- `POST /api/calls/schedule` - Schedule future call (auth)
- `DELETE /api/calls/schedule/:id` - Cancel scheduled call (auth)

### **Personas (7):**
- `GET /api/personas` - List personas (optional auth)
- `POST /api/personas` - Create custom persona (auth)
- `PUT /api/personas/:id` - Update persona (auth)
- `DELETE /api/personas/:id` - Delete persona (auth)
- `GET /api/contacts` - Get favorite personas (auth)
- `POST /api/contacts` - Add to favorites (auth)
- `DELETE /api/contacts/:personaId` - Remove from favorites (auth)

### **User & Billing (7):**
- `PUT /api/user/profile` - Update profile (auth)
- `GET /api/user/billing` - Get payment methods (auth)
- `POST /api/user/payment-method` - Add payment method (auth)
- `DELETE /api/user/payment-method/:id` - Remove payment method (auth)
- `PUT /api/user/payment-method/:id/default` - Set default (auth)
- `GET /api/user/usage` - Usage statistics (auth)
- `POST /api/user/create-payment-intent` - Pre-authorize payment (auth)

### **Webhooks (2):**
- `POST /api/twilio/callback` - Twilio status updates
- `POST /api/stripe/webhook` - Stripe payment events

### **Additional Endpoints (To Be Built):**
- `GET /api/calls/:id/cost` - Real-time cost during call
- `GET /api/user/costs/summary` - Cost analytics dashboard
- `GET /api/user/costs/by-persona` - Per-persona cost breakdown
- `GET /api/personas/:id/relationship` - Get relationship context
- `PUT /api/personas/:id/relationship` - Update relationship context
- `GET /api/personas/:id/memories` - View what persona knows
- `DELETE /api/personas/:id/memories/:key` - Delete specific memory
- `GET /api/user/budget-settings` - Get budget preferences
- `PUT /api/user/budget-settings` - Update budget preferences

---

## 🚨 Critical Implementation TODOs

### **Immediate (Before First Test Call):**
1. ✅ Database schema deployed (all 11 tables created)
2. ⬜ Set environment variables in Raindrop
3. ⬜ Implement Twilio SDK integration in `call-orchestrator`
4. ⬜ Build WebSocket handler in `voice-pipeline`
5. ⬜ Integrate Deepgram STT
6. ⬜ Integrate Cerebras AI
7. ⬜ Integrate ElevenLabs TTS
8. ⬜ Wire up cost tracking in voice loop
9. ⬜ Implement Stripe capture in webhook handler

### **High Priority:**
10. ⬜ Memory extraction AI (post-call processing)
11. ⬜ Cost tracking API endpoints
12. ⬜ Relationship management API endpoints
13. ⬜ Budget warning system (in-call notifications)
14. ⬜ Frontend real-time cost ticker
15. ⬜ Frontend memory editor UI

### **Medium Priority:**
16. ⬜ Scheduled calls cron job
17. ⬜ Memory editor API (view/edit/delete facts)
18. ⬜ Cost analytics dashboard
19. ⬜ Budget settings UI
20. ⬜ System persona seeding script

### **Nice to Have:**
21. ⬜ Call recording/playback
22. ⬜ Transcript search (semantic)
23. ⬜ Multi-language support
24. ⬜ Group calls (multiple users)
25. ⬜ Voice cloning (custom voices)

---

## 🔐 Environment Variables (Critical Ones)

**Must Have:**
```bash
JWT_SECRET=<generated-random-string>
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+15551234567
ELEVENLABS_API_KEY=xxxxx
CEREBRAS_API_KEY=xxxxx
DEEPGRAM_API_KEY=xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
BASE_URL=https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run
```

**Full list:** See `.env.example` (83 variables total)

---

## 🧪 Testing Strategy

### **Unit Tests:**
- `CallCostTracker` calculations
- `PersonaRelationshipManager` memory operations
- JWT generation/validation
- Password hashing

### **Integration Tests:**
- Auth flow (register → login → me)
- Persona CRUD operations
- Payment intent creation
- Cost tracking accuracy

### **End-to-End Test (The Big One):**
1. Register user
2. Login
3. Add Brad to contacts
4. Create payment intent
5. Trigger call
6. **Phone rings** ✅
7. **Answer call** ✅
8. **AI responds in Brad's voice** ✅
9. **Real-time conversation** ✅
10. **Cost tracking updates** ✅
11. **Hang up** ✅
12. **Stripe charged exact amount** ✅
13. **Memories extracted and stored** ✅
14. **Next call remembers previous conversation** ✅

---

## 📝 Key Design Decisions

### **Why Raindrop?**
- Unified platform for services, database, memory, storage
- Built-in service-to-service communication
- SmartMemory perfect for conversation context
- SmartBuckets for transcript storage
- Easy deployment and scaling

### **Why Cerebras Primary?**
- Sub-1-second inference (critical for real-time conversation)
- Cost-effective ($0.10/1M tokens vs OpenAI's $10-30/1M)
- Streaming support for faster response
- OpenAI fallback ensures reliability

### **Why ElevenLabs?**
- Best-in-class natural voice quality
- Turbo v2 model optimized for low latency
- Streaming TTS reduces wait time
- Multiple voice options for different personas

### **Why Manual Capture (Stripe)?**
- Pre-auth before call (hold funds)
- Charge exact amount after call (fair pricing)
- Refund unused if call fails
- Better user experience than flat fee

### **Why 4-Tier Memory?**
- **Working:** Immediate conversation context
- **Short-term:** Recent continuity (last 10 calls)
- **Long-term:** Persistent knowledge (who they are)
- **Episodic:** Full history (searchable archive)
- Balances cost (token usage) vs personalization

### **Why Event-Level Cost Tracking?**
- Debugging: "Why was this call $15?"
- Optimization: Identify expensive operations
- Transparency: Show users exactly what they paid for
- Analytics: Find patterns to reduce costs

---

## 🎓 For Future Claude (or Any Developer)

### **When You Return to This Project:**

1. **Read this file first** - It has everything
2. **Check `NEW_SERVICES_SUMMARY.md`** - What's already built
3. **Review `.env.example`** - What env vars are needed
4. **Look at `DEPLOYMENT_QUICKSTART.md`** - How to test
5. **Scan `raindrop.manifest`** - Service architecture

### **Common Questions Answered:**

**Q: Where does the AI conversation happen?**
A: `src/voice-pipeline/index.ts` - WebSocket handler

**Q: Where are costs tracked?**
A: `src/shared/cost-tracker.ts` - CallCostTracker class, used in voice-pipeline

**Q: Where are memories stored?**
A: SmartMemory (Tiers 1-3) + SmartBuckets (Tier 4)
   Managed by `src/shared/persona-relationship.ts`

**Q: How does Brad remember Alice?**
A: `user_persona_relationships` table + `long_term:{userId}:{personaId}` in SmartMemory

**Q: Where's the payment logic?**
A: Pre-auth in `payment-processor`, capture in `webhook-handler` post-call

**Q: How do I add a new API endpoint?**
A: Add route to `api-gateway`, call appropriate service, document in API_SPECIFICATION.md

**Q: Where are the database tables defined?**
A: `src/sql/call-me-back-db.ts` - Single schema file with all 11 tables

**Q: How do I test without real calls?**
A: Set `MOCK_TWILIO=true`, `MOCK_ELEVENLABS=true`, etc. in `.env`

### **If Something's Not Working:**

1. **Check logs:** `pnpm raindrop logs <service-name>`
2. **Verify env vars:** Make sure all API keys are set
3. **Check database:** Use Raindrop console to query SmartSQL
4. **Test services individually:** Call each service's methods directly
5. **Check external APIs:** Twilio/ElevenLabs/Cerebras status pages

### **Architecture Principles:**

- **Separation of concerns:** Each service has one job
- **Stateless services:** All state in database or SmartMemory
- **Cost transparency:** Track every penny
- **Memory personalization:** Each user-persona relationship is unique
- **Fail gracefully:** Fallbacks for all external APIs
- **User control:** Users can edit/delete their data

---

## 🎯 Success Criteria

**MVP is complete when:**
1. ✅ User can register and login
2. ✅ User can browse and add personas
3. ✅ User can trigger a real phone call
4. ✅ Phone rings and user answers
5. ✅ AI persona speaks in natural voice
6. ✅ Real-time conversation works (STT→AI→TTS loop)
7. ✅ Response time is <3 seconds per turn
8. ✅ Costs are tracked in real-time
9. ✅ User is charged exact amount after call
10. ✅ Transcript is saved
11. ✅ Memories are extracted and stored
12. ✅ Next call with same persona remembers previous conversation

**Production-ready when:**
- All 23 API endpoints working
- Budget warnings and auto-cutoff functional
- Memory editor UI complete
- Cost analytics dashboard live
- Payment flow fully tested
- Error handling comprehensive
- Security audit passed
- Load testing completed

---

**This is everything. Read this file when you come back, and you'll know exactly where everything is and how it all works together.** 🚀
