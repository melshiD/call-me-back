# Cost Tracking Architecture - Comprehensive Token & Usage Analytics

**Date:** 2025-01-07
**Status:** Design Phase
**Priority:** Critical (Required for MVP)

---

## 🎯 Goal

Build a **VERY robust** cost tracking system that captures **every single token, character, minute, and API call** across all paid services during a phone call, providing:

1. **Real-time cost accumulation** during active calls
2. **Per-service breakdowns** (Twilio, ElevenLabs, Cerebras, Deepgram, OpenAI fallback)
3. **User-facing cost projections** before and during calls
4. **Budget warnings and auto-cutoffs** to prevent runaway costs
5. **Historical cost analytics** for optimization
6. **Billing accuracy** for Stripe charge calculation

---

## 💰 Services to Track

### 1. **Twilio (Telephony)**
- **Connection fee:** $0.25 flat per call
- **Per-minute rate:** $0.40/minute (billed per second)
- **Metrics to track:**
  - Call duration (seconds)
  - Connection status
  - Call initiation fee

### 2. **ElevenLabs (Text-to-Speech)**
- **Pricing:** $0.30 per 1,000 characters
- **Metrics to track:**
  - Characters sent to TTS API
  - Number of TTS requests
  - Voice model used
  - Streaming optimization level

### 3. **Cerebras (AI Inference - Primary)**
- **Pricing:** $0.10 per 1M tokens (input + output)
- **Metrics to track:**
  - Input tokens (prompt + context)
  - Output tokens (AI response)
  - Number of inference requests
  - Streaming chunks

### 4. **OpenAI (AI Inference - Fallback)**
- **Pricing:**
  - GPT-4 Turbo: $10/1M input tokens, $30/1M output tokens
  - Realtime API: $0.06/minute
- **Metrics to track:**
  - Input tokens
  - Output tokens
  - API used (completion vs realtime)
  - Fallback triggers (why Cerebras failed)

### 5. **Deepgram (Speech-to-Text)**
- **Pricing:** $0.0043 per minute ($0.43 per 100 minutes)
- **Metrics to track:**
  - Audio duration processed
  - Number of STT requests
  - Language model used

### 6. **Raindrop SmartMemory (Context Storage)**
- **Pricing:** TBD (May be included or metered)
- **Metrics to track:**
  - Memory operations (get/set)
  - Storage size (KB)
  - Context retrievals

---

## 📊 Cost Tracking Data Model

### Call Cost Breakdown Table

```sql
CREATE TABLE call_cost_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- TIMESTAMPS
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  finalized_at TIMESTAMP, -- When cost calculation completed

  -- TWILIO COSTS
  twilio_connection_fee_cents INTEGER DEFAULT 25,
  twilio_duration_seconds INTEGER DEFAULT 0,
  twilio_duration_cost_cents DECIMAL(10,4) DEFAULT 0,
  twilio_total_cents DECIMAL(10,4) DEFAULT 0,

  -- ELEVENLABS COSTS
  elevenlabs_total_characters INTEGER DEFAULT 0,
  elevenlabs_total_requests INTEGER DEFAULT 0,
  elevenlabs_total_cents DECIMAL(10,4) DEFAULT 0,

  -- AI INFERENCE COSTS (Cerebras primary)
  cerebras_input_tokens INTEGER DEFAULT 0,
  cerebras_output_tokens INTEGER DEFAULT 0,
  cerebras_total_tokens INTEGER DEFAULT 0,
  cerebras_total_requests INTEGER DEFAULT 0,
  cerebras_total_cents DECIMAL(10,4) DEFAULT 0,

  -- AI INFERENCE COSTS (OpenAI fallback)
  openai_input_tokens INTEGER DEFAULT 0,
  openai_output_tokens INTEGER DEFAULT 0,
  openai_total_tokens INTEGER DEFAULT 0,
  openai_total_requests INTEGER DEFAULT 0,
  openai_realtime_minutes DECIMAL(10,2) DEFAULT 0,
  openai_total_cents DECIMAL(10,4) DEFAULT 0,
  openai_fallback_triggered BOOLEAN DEFAULT FALSE,
  openai_fallback_reason TEXT,

  -- STT COSTS (Deepgram)
  deepgram_audio_duration_seconds INTEGER DEFAULT 0,
  deepgram_total_requests INTEGER DEFAULT 0,
  deepgram_total_cents DECIMAL(10,4) DEFAULT 0,

  -- RAINDROP COSTS
  raindrop_memory_operations INTEGER DEFAULT 0,
  raindrop_storage_kb INTEGER DEFAULT 0,
  raindrop_total_cents DECIMAL(10,4) DEFAULT 0,

  -- TOTALS
  subtotal_cents DECIMAL(10,4) DEFAULT 0,
  stripe_fee_cents DECIMAL(10,4) DEFAULT 0, -- Stripe's 2.9% + $0.30
  total_cost_cents DECIMAL(10,4) DEFAULT 0,

  -- METADATA
  cost_calculation_version VARCHAR(10) DEFAULT '1.0',
  exchange_rate DECIMAL(10,6) DEFAULT 1.0, -- Future: Multi-currency
  currency VARCHAR(3) DEFAULT 'USD',

  -- PROFIT MARGIN
  user_charged_cents INTEGER DEFAULT 0, -- What we charged the user
  profit_margin_cents DECIMAL(10,4) DEFAULT 0 -- user_charged - total_cost
);

CREATE INDEX idx_call_cost_call_id ON call_cost_breakdowns(call_id);
CREATE INDEX idx_call_cost_user_id ON call_cost_breakdowns(user_id);
CREATE INDEX idx_call_cost_created ON call_cost_breakdowns(created_at DESC);
```

---

### Real-Time Cost Tracking (During Call)

```sql
CREATE TABLE call_cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  call_cost_breakdown_id UUID REFERENCES call_cost_breakdowns(id),

  -- EVENT METADATA
  timestamp TIMESTAMP DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL, -- 'tts_request', 'ai_inference', 'stt_chunk', etc.
  service VARCHAR(50) NOT NULL, -- 'elevenlabs', 'cerebras', 'deepgram', 'twilio'

  -- USAGE METRICS
  tokens_input INTEGER,
  tokens_output INTEGER,
  characters INTEGER,
  duration_seconds INTEGER,
  audio_bytes INTEGER,

  -- COST CALCULATION
  unit_cost DECIMAL(10,6), -- Cost per unit (e.g., $0.10 per 1M tokens)
  calculated_cost_cents DECIMAL(10,4),

  -- REQUEST DETAILS
  request_id VARCHAR(255), -- External API request ID for debugging
  model_used VARCHAR(100),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  -- METADATA
  metadata JSONB -- Additional context (prompt length, voice ID, etc.)
);

CREATE INDEX idx_cost_events_call ON call_cost_events(call_id, timestamp);
CREATE INDEX idx_cost_events_service ON call_cost_events(service, timestamp);
CREATE INDEX idx_cost_events_type ON call_cost_events(event_type);
```

---

## 🔄 Real-Time Cost Accumulation Flow

### During a Call:

```javascript
class CallCostTracker {
  constructor(callId, userId) {
    this.callId = callId;
    this.userId = userId;
    this.breakdown = null;
    this.startTime = Date.now();
  }

  // Initialize cost tracking when call starts
  async initialize() {
    this.breakdown = await createCostBreakdown({
      call_id: this.callId,
      user_id: this.userId,
      twilio_connection_fee_cents: 25 // Flat fee
    });
  }

  // Track TTS request
  async trackTTS(text, voiceId, model) {
    const characters = text.length;
    const costPerChar = 0.30 / 1000; // $0.30 per 1K chars
    const costCents = characters * costPerChar;

    // Log event
    await logCostEvent({
      call_id: this.callId,
      call_cost_breakdown_id: this.breakdown.id,
      event_type: 'tts_request',
      service: 'elevenlabs',
      characters,
      unit_cost: costPerChar,
      calculated_cost_cents: costCents,
      model_used: model,
      metadata: { voice_id: voiceId, text_length: characters }
    });

    // Update breakdown
    await updateBreakdown(this.breakdown.id, {
      elevenlabs_total_characters: this.breakdown.elevenlabs_total_characters + characters,
      elevenlabs_total_requests: this.breakdown.elevenlabs_total_requests + 1,
      elevenlabs_total_cents: this.breakdown.elevenlabs_total_cents + costCents
    });

    // Check if user is approaching budget limit
    await this.checkBudgetWarnings();

    return costCents;
  }

  // Track AI inference
  async trackAIInference(inputTokens, outputTokens, provider = 'cerebras') {
    const totalTokens = inputTokens + outputTokens;

    let costCents;
    if (provider === 'cerebras') {
      // $0.10 per 1M tokens
      costCents = (totalTokens / 1_000_000) * 10;
    } else if (provider === 'openai') {
      // $10/1M input, $30/1M output
      const inputCost = (inputTokens / 1_000_000) * 1000;
      const outputCost = (outputTokens / 1_000_000) * 3000;
      costCents = inputCost + outputCost;
    }

    await logCostEvent({
      call_id: this.callId,
      call_cost_breakdown_id: this.breakdown.id,
      event_type: 'ai_inference',
      service: provider,
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      unit_cost: provider === 'cerebras' ? 0.10 : null,
      calculated_cost_cents: costCents,
      model_used: provider === 'cerebras' ? 'llama3.1-8b' : 'gpt-4-turbo',
      metadata: { total_tokens: totalTokens }
    });

    if (provider === 'cerebras') {
      await updateBreakdown(this.breakdown.id, {
        cerebras_input_tokens: this.breakdown.cerebras_input_tokens + inputTokens,
        cerebras_output_tokens: this.breakdown.cerebras_output_tokens + outputTokens,
        cerebras_total_tokens: this.breakdown.cerebras_total_tokens + totalTokens,
        cerebras_total_requests: this.breakdown.cerebras_total_requests + 1,
        cerebras_total_cents: this.breakdown.cerebras_total_cents + costCents
      });
    } else {
      await updateBreakdown(this.breakdown.id, {
        openai_input_tokens: this.breakdown.openai_input_tokens + inputTokens,
        openai_output_tokens: this.breakdown.openai_output_tokens + outputTokens,
        openai_total_tokens: this.breakdown.openai_total_tokens + totalTokens,
        openai_total_requests: this.breakdown.openai_total_requests + 1,
        openai_total_cents: this.breakdown.openai_total_cents + costCents,
        openai_fallback_triggered: true,
        openai_fallback_reason: 'Cerebras API unavailable'
      });
    }

    await this.checkBudgetWarnings();

    return costCents;
  }

  // Track STT processing
  async trackSTT(audioDurationSeconds) {
    const costPerMinute = 0.43; // $0.43 per 100 minutes = $0.0043/min
    const minutes = audioDurationSeconds / 60;
    const costCents = minutes * (costPerMinute / 100);

    await logCostEvent({
      call_id: this.callId,
      call_cost_breakdown_id: this.breakdown.id,
      event_type: 'stt_processing',
      service: 'deepgram',
      duration_seconds: audioDurationSeconds,
      unit_cost: costPerMinute / 100,
      calculated_cost_cents: costCents,
      model_used: 'nova-2',
      metadata: { audio_duration_seconds: audioDurationSeconds }
    });

    await updateBreakdown(this.breakdown.id, {
      deepgram_audio_duration_seconds: this.breakdown.deepgram_audio_duration_seconds + audioDurationSeconds,
      deepgram_total_requests: this.breakdown.deepgram_total_requests + 1,
      deepgram_total_cents: this.breakdown.deepgram_total_cents + costCents
    });

    await this.checkBudgetWarnings();

    return costCents;
  }

  // Track Twilio call duration
  async trackCallDuration() {
    const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = durationSeconds / 60;
    const costCents = minutes * 40; // $0.40 per minute

    await updateBreakdown(this.breakdown.id, {
      twilio_duration_seconds: durationSeconds,
      twilio_duration_cost_cents: costCents,
      twilio_total_cents: 25 + costCents // Connection fee + duration
    });

    return { durationSeconds, costCents };
  }

  // Calculate current total cost
  async getCurrentTotal() {
    const breakdown = await getBreakdown(this.breakdown.id);

    const subtotal =
      breakdown.twilio_total_cents +
      breakdown.elevenlabs_total_cents +
      breakdown.cerebras_total_cents +
      breakdown.openai_total_cents +
      breakdown.deepgram_total_cents +
      breakdown.raindrop_total_cents;

    return {
      subtotal_cents: subtotal,
      total_cents: subtotal,
      breakdown
    };
  }

  // Check if user is approaching budget limits
  async checkBudgetWarnings() {
    const { total_cents } = await this.getCurrentTotal();

    // Check per-call limit
    if (total_cents >= env.COST_CUTOFF_PER_CALL) {
      // HARD CUTOFF: End call immediately
      await this.emergencyCutoff('Per-call cost limit exceeded');
      return;
    }

    if (total_cents >= env.COST_WARNING_PER_CALL) {
      // Soft warning: Notify user
      await this.sendCostWarning('approaching_limit', total_cents);
    }

    // Check daily user limit
    const dailyTotal = await getUserDailyCost(this.userId);
    if (dailyTotal >= env.COST_WARNING_DAILY_USER) {
      await this.sendCostWarning('daily_limit_warning', dailyTotal);
    }
  }

  // Finalize costs when call ends
  async finalize(callEndedAt) {
    // Final Twilio duration calculation
    await this.trackCallDuration();

    const { subtotal_cents, breakdown } = await this.getCurrentTotal();

    // Calculate Stripe fee (2.9% + $0.30)
    const stripeFee = (subtotal_cents * 0.029) + 30;

    const totalCost = subtotal_cents + stripeFee;

    await updateBreakdown(this.breakdown.id, {
      subtotal_cents: subtotal_cents,
      stripe_fee_cents: stripeFee,
      total_cost_cents: totalCost,
      finalized_at: callEndedAt
    });

    return {
      subtotal_cents,
      stripe_fee_cents: stripeFee,
      total_cost_cents: totalCost,
      breakdown
    };
  }
}
```

---

## 📈 User-Facing Cost Projections

### Pre-Call Estimation

```javascript
async function estimateCallCost(estimatedDurationMinutes, personaId, userId) {
  // Get user's persona relationship
  const relationship = await getRelationship(userId, personaId);

  // Estimate memory context size
  const memoryTokens = await estimateMemoryTokens(userId, personaId);

  // Estimate per-turn costs
  const avgTurnsPerMinute = 4; // Assumes ~15 seconds per turn
  const totalTurns = estimatedDurationMinutes * avgTurnsPerMinute;

  // TTS cost (avg 50 chars per response)
  const avgCharsPerResponse = 50;
  const totalTTSChars = totalTurns * avgCharsPerResponse;
  const ttsCost = (totalTTSChars / 1000) * 0.30;

  // AI inference cost
  const avgInputTokens = 1000 + memoryTokens; // Prompt + context
  const avgOutputTokens = 100; // Response
  const totalTokens = totalTurns * (avgInputTokens + avgOutputTokens);
  const aiCost = (totalTokens / 1_000_000) * 0.10; // Cerebras pricing

  // STT cost
  const sttCost = estimatedDurationMinutes * (0.43 / 100);

  // Twilio cost
  const twilioCost = 0.25 + (estimatedDurationMinutes * 0.40);

  // Total
  const subtotal = ttsCost + aiCost + sttCost + twilioCost;
  const stripeFee = (subtotal * 0.029) + 0.30;
  const total = subtotal + stripeFee;

  return {
    estimated_duration_minutes: estimatedDurationMinutes,
    breakdown: {
      twilio: twilioCost,
      tts: ttsCost,
      ai: aiCost,
      stt: sttCost
    },
    subtotal_cents: Math.round(subtotal * 100),
    stripe_fee_cents: Math.round(stripeFee * 100),
    total_cents: Math.round(total * 100),
    memory_tokens: memoryTokens,
    warning: memoryTokens > 3000 ? 'Large memory context will increase costs' : null
  };
}
```

### During-Call Real-Time Display

Frontend should poll `/api/calls/:id/cost` every 5 seconds during active call:

```javascript
// API Endpoint: GET /api/calls/:id/cost
{
  "call_id": "call_abc123",
  "duration_seconds": 127,
  "current_cost_cents": 87,
  "projected_cost_cents": 245, // Based on current rate
  "breakdown": {
    "twilio_cents": 25,
    "tts_cents": 12,
    "ai_cents": 45,
    "stt_cents": 5
  },
  "warnings": [
    {
      "type": "approaching_limit",
      "message": "You're 75% towards your per-call budget",
      "threshold_cents": 500,
      "current_cents": 375
    }
  ],
  "updated_at": "2025-01-07T10:05:23Z"
}
```

---

## 🚨 Budget Controls & Auto-Cutoffs

### User Budget Preferences

```sql
CREATE TABLE user_budget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- PER-CALL LIMITS
  max_cost_per_call_cents INTEGER DEFAULT 1000, -- $10 max per call
  warn_at_percent_per_call INTEGER DEFAULT 75, -- Warn at 75%

  -- DAILY LIMITS
  max_cost_per_day_cents INTEGER DEFAULT 5000, -- $50 per day
  warn_at_percent_per_day INTEGER DEFAULT 75,

  -- MONTHLY LIMITS
  max_cost_per_month_cents INTEGER DEFAULT 10000, -- $100 per month
  warn_at_percent_per_month INTEGER DEFAULT 75,

  -- MEMORY COST CONTROLS
  max_memory_tokens INTEGER DEFAULT 4000, -- Limit context size
  warn_high_memory_cost BOOLEAN DEFAULT TRUE,

  -- AUTO-CUTOFF SETTINGS
  enable_auto_cutoff BOOLEAN DEFAULT TRUE,
  cutoff_grace_period_seconds INTEGER DEFAULT 10, -- 10 sec warning before cutoff

  -- NOTIFICATION PREFERENCES
  notify_on_warning BOOLEAN DEFAULT TRUE,
  notify_on_cutoff BOOLEAN DEFAULT TRUE,
  notification_method VARCHAR(20) DEFAULT 'in_call', -- 'in_call', 'sms', 'email'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Cost Analytics Dashboard

### API Endpoints for Cost Analytics

#### GET /api/user/costs/summary
```json
{
  "user_id": "user_abc123",
  "current_month": {
    "total_calls": 47,
    "total_cost_cents": 3421,
    "avg_cost_per_call_cents": 73,
    "total_minutes": 234,
    "cost_per_minute_cents": 15
  },
  "breakdown": {
    "twilio_cents": 1435,
    "tts_cents": 687,
    "ai_cents": 1123,
    "stt_cents": 176
  },
  "trends": {
    "vs_last_month_percent": 15,
    "avg_memory_tokens": 2345,
    "most_expensive_persona": {
      "persona_id": "persona_brad_001",
      "name": "Brad",
      "avg_cost_cents": 92,
      "reason": "High memory context (3200 tokens avg)"
    }
  },
  "warnings": [
    "Your average call cost increased 15% this month due to longer memory contexts"
  ]
}
```

#### GET /api/user/costs/by-persona
```json
{
  "user_id": "user_abc123",
  "personas": [
    {
      "persona_id": "persona_brad_001",
      "persona_name": "Brad",
      "total_calls": 15,
      "total_cost_cents": 1380,
      "avg_cost_per_call_cents": 92,
      "avg_memory_tokens": 3200,
      "optimization_tip": "Consider reducing long-term memory to lower costs"
    },
    {
      "persona_id": "persona_emma_002",
      "persona_name": "Emma",
      "total_calls": 8,
      "total_cost_cents": 456,
      "avg_cost_per_call_cents": 57,
      "avg_memory_tokens": 1800,
      "optimization_tip": "Optimized memory usage - good balance"
    }
  ]
}
```

---

## 🎯 Implementation Checklist

### Database Setup
- [ ] Create `call_cost_breakdowns` table
- [ ] Create `call_cost_events` table
- [ ] Create `user_budget_settings` table
- [ ] Add indexes for performance

### Backend Services
- [ ] Build `CallCostTracker` class
- [ ] Implement real-time cost tracking hooks (TTS, AI, STT, Twilio)
- [ ] Create cost estimation function
- [ ] Build budget warning system
- [ ] Implement auto-cutoff logic
- [ ] Create cost analytics API endpoints

### Frontend Integration
- [ ] Pre-call cost estimation display
- [ ] Real-time cost ticker during calls
- [ ] Budget warning notifications
- [ ] Cost analytics dashboard
- [ ] Budget settings UI

### Testing
- [ ] Unit tests for cost calculations
- [ ] Integration tests for cost tracking
- [ ] Test budget warnings and cutoffs
- [ ] Verify Stripe charge accuracy
- [ ] Load test cost tracking performance

---

## 🔍 Monitoring & Alerts

### Admin Alerts
- Unusually high costs per call (>$20)
- Frequent auto-cutoffs (may indicate pricing issue)
- Discrepancies between estimated and actual costs
- API cost increases (external service price changes)

### User Alerts
- Approaching budget limits
- Higher-than-usual call costs
- Memory context optimization recommendations

---

**This architecture ensures every penny is tracked, users are informed, and costs never spiral out of control!** 💰
