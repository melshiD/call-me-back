> **Navigation:** [← Back to README](../../README.md) | [Documentation Catalog](../CATALOG.md)

# Cost Tracking Implementation Guide
**Date:** 2025-11-20 11:48:03 UTC
**Session Focus:** Implementing real-time cost tracking in voice-pipeline
**Priority:** CRITICAL - No revenue/cost data without this

---

## 🎯 Executive Summary

**THE PROBLEM:**
- Admin dashboard deployed and working ✅
- Backend API returning data ✅
- **BUT: 0 cost events in database** ❌
- No cost tracking happening during calls ❌
- You're paying for API calls but not logging costs ❌

**WHY THIS MATTERS:**
- You're making 130+ calls with NO cost data
- Paying for Cerebras, Deepgram, ElevenLabs, Twilio on **every call** (even failed ones)
- Admin dashboard shows $0 revenue/$0 cost (misleading)
- Can't track profitability or optimize costs
- Can't bill users accurately

**THE FIX:**
Cost tracker **exists** in codebase but isn't being **called** by voice pipeline services (Deepgram, ElevenLabs, Cerebras integration code).

---

## 📊 Current State Analysis

### Database Schema (Verified on Vultr)

**Table: `call_cost_events` (EMPTY - 0 rows)**
```sql
Columns:
- id (varchar 255)
- call_id (varchar 255) - FK to calls(id)
- call_cost_breakdown_id (varchar 255)
- event_type (varchar 50) - 'tts_request', 'ai_inference', 'stt_chunk', etc.
- service (varchar 50) - 'elevenlabs', 'cerebras', 'deepgram', 'twilio'
- tokens_input (integer)
- tokens_output (integer)
- characters (integer)
- duration_seconds (numeric)
- audio_bytes (integer)
- unit_cost (numeric)
- calculated_cost_cents (numeric) ⚠️ THIS IS WHAT MATTERS
- model_used (varchar 100)
- metadata (text)
- created_at (timestamp)
```

**Table: `calls` (130 rows)**
```sql
Relevant columns:
- actual_cost_cents (integer) - Currently NULL for all calls
- estimated_cost_cents (integer) - Currently NULL
- status (varchar) - All stuck at 'initiating'
```

### Existing Cost Tracking Code

**✅ Already Implemented:**

1. **`src/shared/cost-tracker.ts`** (419 lines)
   - `CallCostTracker` class fully implemented
   - Methods: `trackTTS()`, `trackAIInference()`, `trackSTT()`, `trackCallDuration()`
   - Budget warnings and auto-cutoff logic
   - Writes to `call_cost_events` table
   - Status: **COMPLETE AND READY**

2. **`src/shared/pricing.ts`** (355 lines)
   - Centralized pricing config for all services
   - ElevenLabs: $0.30 per 1K chars
   - Cerebras: $10 per 1M tokens
   - Deepgram: $0.43 per minute
   - Twilio: $0.40/min + $0.25 connection fee
   - Status: **COMPLETE AND ACCURATE**

3. **`src/voice-pipeline/index.ts`** (Lines 43-45)
   ```typescript
   // Initialize cost tracker for this call
   const costTracker = new CallCostTracker(callId, userId, this.env.CALL_ME_BACK_DB);
   await costTracker.initialize();
   ```
   - Cost tracker **IS initialized**
   - Cost tracker **IS passed to pipeline**
   - Status: **INITIALIZED BUT NOT USED**

---

## 🔍 Root Cause Analysis

### Where Cost Tracking Should Happen (But Doesn't)

The voice pipeline has these components that make API calls but **don't track costs**:

1. **`deepgram-stt.ts`** - Speech-to-Text
   - Receives audio chunks from Twilio
   - Processes with Deepgram API
   - **MISSING:** `await costTracker.trackSTT(audioDurationSeconds)`

2. **`elevenlabs-tts.ts`** - Text-to-Speech
   - Generates speech from AI responses
   - Sends characters to ElevenLabs
   - **MISSING:** `await costTracker.trackTTS(text, voiceId, model)`

3. **`conversation-manager.ts`** - AI Inference
   - Sends prompts to Cerebras
   - Receives AI responses with token counts
   - **MISSING:** `await costTracker.trackAIInference(inputTokens, outputTokens, 'cerebras')`

4. **`voice-pipeline-orchestrator.ts`** - Call Lifecycle
   - Manages entire call flow
   - **MISSING:** `await costTracker.finalize()` on call end
   - **MISSING:** `await costTracker.trackCallDuration()` updates

### Why This Happened

The cost tracker was built as infrastructure but the voice pipeline components were developed **independently**. Nobody connected them together.

Classic integration gap: Both pieces work individually but aren't wired up.

---

## 🛠️ Implementation Plan

### Phase 1: Find Where API Calls Happen (15 min)

**Objective:** Locate exact lines where Deepgram, ElevenLabs, Cerebras APIs are called

**Tasks:**
1. Read `src/voice-pipeline/deepgram-stt.ts`
   - Find where audio is sent to Deepgram
   - Identify where duration/bytes can be measured
   - Note: May be in event handlers

2. Read `src/voice-pipeline/elevenlabs-tts.ts`
   - Find where text is sent to ElevenLabs API
   - Count characters before sending
   - Note voice model being used

3. Read `src/voice-pipeline/conversation-manager.ts` or orchestrator
   - Find where Cerebras API is called
   - Look for response structure with token counts
   - Check if OpenAI fallback exists

**Expected Findings:**
- Async function calls to external APIs
- Response objects with usage metadata
- Event-driven architecture (WebSockets)

---

### Phase 2: Add Cost Tracking Calls (30 min)

**Objective:** Insert `costTracker` method calls at each API interaction point

#### 2.1 Track Text-to-Speech (ElevenLabs)

**Location:** `src/voice-pipeline/elevenlabs-tts.ts`

**Before:**
```typescript
async generateSpeech(text: string): Promise<AudioStream> {
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/...', {
    method: 'POST',
    body: JSON.stringify({ text, voice_id: this.voiceId })
  });

  return response.body;
}
```

**After:**
```typescript
async generateSpeech(text: string): Promise<AudioStream> {
  // Track cost BEFORE API call (so we log even if it fails)
  const costCents = await this.costTracker.trackTTS(
    text,
    this.voiceId,
    'eleven_turbo_v2'  // Model name from config
  );

  this.logger.info('TTS cost tracked', {
    characters: text.length,
    costCents
  });

  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/...', {
    method: 'POST',
    body: JSON.stringify({ text, voice_id: this.voiceId })
  });

  return response.body;
}
```

**Key Points:**
- Track BEFORE the API call (in case it fails, you still pay)
- Log the cost for debugging
- Use exact model name from pricing config

---

#### 2.2 Track AI Inference (Cerebras)

**Location:** `src/voice-pipeline/conversation-manager.ts`

**Before:**
```typescript
async getAIResponse(userMessage: string, context: string): Promise<string> {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: userMessage }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

**After:**
```typescript
async getAIResponse(userMessage: string, context: string): Promise<string> {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: userMessage }
      ]
    })
  });

  const data = await response.json();

  // Extract token usage from response
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  // Track cost
  const costCents = await this.costTracker.trackAIInference(
    inputTokens,
    outputTokens,
    'cerebras',
    'llama3.1-8b'
  );

  this.logger.info('AI inference cost tracked', {
    inputTokens,
    outputTokens,
    costCents
  });

  return data.choices[0].message.content;
}
```

**Key Points:**
- Token counts come from response.usage
- Track AFTER successful response (so we have accurate token counts)
- Include model name for pricing lookup
- Handle OpenAI fallback separately with provider='openai'

---

#### 2.3 Track Speech-to-Text (Deepgram)

**Location:** `src/voice-pipeline/deepgram-stt.ts`

**Challenge:** Deepgram is **streaming** - we get chunks, not one big request

**Strategy:** Track accumulated audio duration when transcription completes

**Before:**
```typescript
// WebSocket event handler
deepgramWs.on('message', (message) => {
  const data = JSON.parse(message);

  if (data.is_final) {
    this.emit('transcript', {
      text: data.channel.alternatives[0].transcript,
      isFinal: true
    });
  }
});
```

**After:**
```typescript
// Track audio duration periodically
private audioDurationSeconds = 0;
private lastCostTrackTime = Date.now();
private readonly COST_TRACK_INTERVAL_MS = 5000; // Track every 5 seconds

deepgramWs.on('message', (message) => {
  const data = JSON.parse(message);

  if (data.is_final) {
    // Calculate audio duration from timestamps
    const duration = data.duration || 0;
    this.audioDurationSeconds += duration;

    // Track cost every 5 seconds to avoid DB spam
    const now = Date.now();
    if (now - this.lastCostTrackTime >= this.COST_TRACK_INTERVAL_MS) {
      this.trackAccumulatedSTTCost();
      this.lastCostTrackTime = now;
    }

    this.emit('transcript', {
      text: data.channel.alternatives[0].transcript,
      isFinal: true
    });
  }
});

private async trackAccumulatedSTTCost() {
  if (this.audioDurationSeconds > 0) {
    const costCents = await this.costTracker.trackSTT(
      this.audioDurationSeconds,
      'nova-2'  // Deepgram model
    );

    this.logger.info('STT cost tracked', {
      durationSeconds: this.audioDurationSeconds,
      costCents
    });

    // Reset accumulator
    this.audioDurationSeconds = 0;
  }
}
```

**Key Points:**
- Accumulate duration from streaming chunks
- Track in batches (every 5 seconds) to avoid DB overload
- Track final amount on disconnect
- Use actual audio duration from Deepgram metadata

---

#### 2.4 Track Call Duration (Twilio)

**Location:** `src/voice-pipeline/voice-pipeline-orchestrator.ts`

**Add to call cleanup/end logic:**

```typescript
async cleanup() {
  try {
    // Track final call duration
    const { durationSeconds, costCents } = await this.costTracker.trackCallDuration();

    this.logger.info('Call duration tracked', {
      durationSeconds,
      costCents,
      callId: this.callId
    });

    // Finalize all costs (adds Stripe fee, calculates totals)
    const finalCosts = await this.costTracker.finalize(new Date());

    this.logger.info('Call costs finalized', {
      subtotal_cents: finalCosts.subtotal_cents,
      stripe_fee_cents: finalCosts.stripe_fee_cents,
      total_cost_cents: finalCosts.total_cost_cents
    });

    // Update calls table with final cost
    await this.updateCallCost(finalCosts.total_cost_cents);

  } catch (error) {
    this.logger.error('Failed to track final costs', { error });
  }

  // ... rest of cleanup
}

private async updateCallCost(totalCostCents: number) {
  await executeSQL(
    this.db,
    `UPDATE calls SET
      actual_cost_cents = ?,
      status = 'completed',
      end_time = datetime('now'),
      updated_at = datetime('now')
     WHERE id = ?`,
    [totalCostCents, this.callId]
  );
}
```

**Key Points:**
- Call in cleanup/end handler
- Track even if call fails (set status='failed' but still log costs)
- Update `calls.actual_cost_cents` for easy querying
- Finalize adds Stripe payment processing fee

---

### Phase 3: Handle Failed Calls (15 min)

**Objective:** Ensure costs are tracked even when calls fail

**Principle:** You pay for API calls regardless of call success

**Implementation:**

```typescript
// In error handlers
catch (error) {
  this.logger.error('Call failed', { error, callId: this.callId });

  // IMPORTANT: Still finalize costs even on failure
  try {
    await this.costTracker.trackCallDuration();
    const finalCosts = await this.costTracker.finalize(new Date());

    await executeSQL(
      this.db,
      `UPDATE calls SET
        actual_cost_cents = ?,
        status = 'failed',
        error_message = ?,
        end_time = datetime('now')
       WHERE id = ?`,
      [finalCosts.total_cost_cents, error.message, this.callId]
    );
  } catch (costError) {
    this.logger.error('Failed to track costs on error', { costError });
  }

  throw error; // Re-throw original error
}
```

---

### Phase 4: Pass CostTracker to Components (20 min)

**Objective:** Ensure all components have access to the cost tracker instance

**Current:** Cost tracker created in `voice-pipeline/index.ts` but not passed down

**Fix:**

1. **Update VoicePipelineOrchestrator constructor:**

```typescript
// src/voice-pipeline/voice-pipeline-orchestrator.ts

export class VoicePipelineOrchestrator {
  private costTracker: CallCostTracker;

  constructor(
    config: VoicePipelineConfig,
    costTracker: CallCostTracker,  // ✅ Already has this param
    memory: SmartMemory,
    persona: Persona,
    relationship: UserPersonaRelationship
  ) {
    this.costTracker = costTracker;
    // ... rest of init
  }
}
```

2. **Pass to STT component:**

```typescript
// In orchestrator initialization
this.deepgramSTT = new DeepgramSTT(
  config.deepgramApiKey,
  this.costTracker,  // ⬅️ ADD THIS
  this.logger
);
```

3. **Pass to TTS component:**

```typescript
this.elevenLabsTTS = new ElevenLabsTTS(
  config.elevenLabsApiKey,
  config.voiceId,
  config.voiceSettings,
  this.costTracker,  // ⬅️ ADD THIS
  this.logger
);
```

4. **Pass to AI conversation manager:**

```typescript
this.conversationManager = new ConversationManager(
  config.cerebrasApiKey,
  this.costTracker,  // ⬅️ ADD THIS
  this.memory,
  this.logger
);
```

5. **Update component constructors to accept cost tracker:**

```typescript
// deepgram-stt.ts
export class DeepgramSTT {
  constructor(
    private apiKey: string,
    private costTracker: CallCostTracker,  // ⬅️ ADD THIS
    private logger: Logger
  ) {}
}

// elevenlabs-tts.ts
export class ElevenLabsTTS {
  constructor(
    private apiKey: string,
    private voiceId: string,
    private voiceSettings: any,
    private costTracker: CallCostTracker,  // ⬅️ ADD THIS
    private logger: Logger
  ) {}
}

// conversation-manager.ts
export class ConversationManager {
  constructor(
    private cerebrasApiKey: string,
    private costTracker: CallCostTracker,  // ⬅️ ADD THIS
    private memory: SmartMemory,
    private logger: Logger
  ) {}
}
```

---

## 🧪 Testing Strategy

### Phase 5: Verification (15 min)

**Test 1: Make a Test Call**
```bash
# Trigger a call (even if it fails, costs should be tracked)
curl -X POST https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/calls/trigger \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+15551234567",
    "persona_id": "alex_001"
  }'
```

**Test 2: Check Database**
```bash
ssh user@[VULTR_VPS_IP] \
  "sudo -u postgres psql -d call_me_back -c 'SELECT COUNT(*) FROM call_cost_events;'"
```

**Expected:** Should see > 0 rows

**Test 3: Check Specific Call Costs**
```sql
SELECT
  c.id as call_id,
  c.status,
  c.actual_cost_cents,
  COUNT(cce.id) as cost_events_count,
  SUM(cce.calculated_cost_cents) as total_tracked_cents
FROM calls c
LEFT JOIN call_cost_events cce ON c.id = cce.call_id
WHERE c.created_at > NOW() - INTERVAL '1 hour'
GROUP BY c.id, c.status, c.actual_cost_cents;
```

**Expected:**
- `cost_events_count` > 0
- `actual_cost_cents` = `total_tracked_cents`
- Events for: 'tts_request', 'ai_inference', 'stt_chunk', 'twilio_duration'

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Read all voice pipeline component files to understand structure
- [ ] Identify exact API call locations
- [ ] Verify cost tracker is initialized (already confirmed ✅)
- [ ] Check database schema matches code (already verified ✅)

### Code Changes
- [ ] Update `deepgram-stt.ts` constructor to accept costTracker
- [ ] Add STT cost tracking in Deepgram message handler
- [ ] Update `elevenlabs-tts.ts` constructor to accept costTracker
- [ ] Add TTS cost tracking before ElevenLabs API calls
- [ ] Update `conversation-manager.ts` constructor to accept costTracker
- [ ] Add AI inference cost tracking after Cerebras responses
- [ ] Update orchestrator to pass costTracker to all components
- [ ] Add finalize() call in cleanup/end handlers
- [ ] Add cost tracking in error handlers (for failed calls)

### Testing
- [ ] Deploy to Raindrop: `raindrop build deploy`
- [ ] Make test call and check PM2 logs for cost tracking messages
- [ ] Verify call_cost_events table has rows
- [ ] Verify actual_cost_cents is populated in calls table
- [ ] Check admin dashboard shows non-zero costs

### Validation
- [ ] Cost breakdown adds up correctly
- [ ] Failed calls still have costs logged
- [ ] Admin dashboard displays real financial data
- [ ] Per-service costs match expected rates (ElevenLabs, Cerebras, etc.)

---

## 🎯 Success Criteria

### When This Is Done:

1. **Database Populated**
   - `call_cost_events` has rows for every API call
   - `calls.actual_cost_cents` reflects true cost
   - Events logged for TTS, STT, AI, Twilio

2. **Admin Dashboard Accurate**
   - Shows real revenue (based on completed calls * $4.99)
   - Shows real costs (sum of actual_cost_cents)
   - Cost breakdown by service visible
   - Gross profit = revenue - costs

3. **Logging Visible**
   ```
   [voice-pipeline] TTS cost tracked: 47 characters = $0.014
   [voice-pipeline] AI inference cost tracked: 1203 tokens = $0.012
   [voice-pipeline] STT cost tracked: 8.4 seconds = $0.006
   [voice-pipeline] Call duration tracked: 127 seconds = $0.85
   [voice-pipeline] Call costs finalized: total = $0.882
   ```

4. **Works for Failed Calls**
   - Even failed calls have cost_events
   - `calls.status='failed'` but `actual_cost_cents` > 0
   - You can see what you paid even when call didn't complete

---

## 📚 Key Files Reference

### Database Schema
- **Table definitions:** Verified via SSH on Vultr PostgreSQL
- **call_cost_events:** 15 columns, tracks individual API calls
- **calls:** `actual_cost_cents` column for aggregated cost

### Cost Tracking Core
- **`src/shared/cost-tracker.ts`:** Complete tracker implementation (419 lines)
- **`src/shared/pricing.ts`:** Centralized pricing config (355 lines)
- **`src/shared/db-helpers.ts`:** executeSQL helper for database writes

### Voice Pipeline
- **`src/voice-pipeline/index.ts`:** Entry point, initializes cost tracker
- **`src/voice-pipeline/voice-pipeline-orchestrator.ts`:** Main coordinator
- **`src/voice-pipeline/deepgram-stt.ts`:** Needs STT cost tracking
- **`src/voice-pipeline/elevenlabs-tts.ts`:** Needs TTS cost tracking
- **`src/voice-pipeline/conversation-manager.ts`:** Needs AI cost tracking

### Admin Dashboard
- **Backend:** `log-query-service/routes/admin/dashboard.js` (working ✅)
- **Frontend:** `src/views/AdminDashboard.vue` (deployed ✅)
- **API:** `https://logs.ai-tools-marketplace.io/api/admin/dashboard`

---

## 🚨 Common Pitfalls to Avoid

1. **Don't forget to track failed calls**
   - Wrap cost tracking in try/catch
   - Log costs even if API call fails

2. **Don't spam the database**
   - Batch STT tracking (every 5 seconds, not every chunk)
   - Use transactions for multiple updates

3. **Don't use wrong model names**
   - Must match keys in `PRICING_CONFIG` exactly
   - 'eleven_turbo_v2', 'llama3.1-8b', 'nova-2'

4. **Don't forget to finalize**
   - `await costTracker.finalize()` calculates Stripe fees
   - Call in cleanup AND error handlers

5. **Don't lose token counts**
   - Extract from `response.usage` object
   - Log if missing (indicates API change)

---

## 💡 Quick Wins

If you're short on time, prioritize these in order:

1. **AI Inference Tracking** (Cerebras)
   - Highest cost per call (~40% of total)
   - Easy to implement (token counts in response)
   - One location to update

2. **TTS Tracking** (ElevenLabs)
   - Second highest cost (~35% of total)
   - Very simple (just count characters)
   - One location to update

3. **Call Duration** (Twilio)
   - Predictable cost ($0.40/min)
   - Already timed by orchestrator
   - Add to cleanup method

4. **STT Tracking** (Deepgram)
   - Lowest individual cost (~5% of total)
   - More complex (streaming)
   - Can be done last

---

## 🔗 Related Documentation

- **PCR2.md:** Overall project context, database schema
- **COST_TRACKING_ARCHITECTURE.md:** Original design document (what we're implementing)
- **ADMIN_DASHBOARD_COMPLETE.md:** Previous session's work on dashboard
- **src/cost-analytics/README.md:** User-facing cost analytics (future phase)

---

**Status:** Ready for implementation
**Estimated Time:** 1.5 - 2 hours for complete implementation and testing
**Next Step:** Read voice pipeline component files to find exact integration points

🚀 **Let's make every API call count!**

---

> **Navigation:** [← Back to README](../../README.md) | [Documentation Catalog](../CATALOG.md)
