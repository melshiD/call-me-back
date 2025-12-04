> **Navigation:** [← Back to README](../README.md) | [Documentation Catalog](./CATALOG.md)

# Cost Tracking & Profitability
**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** #costs #api-pricing #profitability #budget #observability

---

## Quick Reference

### Current API Costs (2025 Verified Rates)

**Per 5-Minute Call:**
```
Twilio (outbound):      $0.070  (16.5%)
Deepgram (STT):         $0.030   (7.0%)
Cerebras (AI):          $0.005   (1.2%)
ElevenLabs (TTS):       $0.300  (70.6%)  ← Largest cost!
Raindrop (amortized):   $0.020   (4.7%)
───────────────────────────────────────
SUBTOTAL (API):         $0.425  (100%)

Stripe (payment):       $0.475  (53% of total)
───────────────────────────────────────
TOTAL COST:             $0.900/call
```

### Profitability at $4.99 Pricing
```
Revenue:                $4.99
Cost:                   $0.90
───────────────────────────────────────
Gross Profit:           $4.09
Margin:                 82%
```

### Break-Even
```
Fixed costs:            $20/month (Raindrop Small tier)
Variable cost:          $0.90/call
At $4.99 pricing:       127 calls/month to break even
```

---

## Table of Contents

1. [API Cost Breakdown](#1-api-cost-breakdown)
2. [Cost Tracking System](#2-cost-tracking-system)
3. [Profitability Analysis](#3-profitability-analysis)
4. [Pricing Strategy](#4-pricing-strategy)
5. [Cost Optimization](#5-cost-optimization)
6. [Budget Management](#6-budget-management)
7. [Real-World Scenarios](#7-real-world-scenarios)
8. [Implementation Guide](#8-implementation-guide)

---

## 1. API Cost Breakdown

### 1.1 Twilio (Telephony)

**Service:** Voice calling infrastructure

**Pricing Model:** Per-minute billing
- **Outbound calls (US):** $0.014/minute ($0.84/hour)
- **Inbound calls (US):** $0.0085/minute ($0.51/hour)
- **Call recording:** $0.0025/minute (optional, not used)

**Our Usage:**
- Outbound calls only (we call the user)
- Average duration: 5 minutes
- **Cost per 5-min call:** $0.070

**Volume Discounts:**
- Available at 100K+ minutes/year (negotiable)
- Typically 15-20% reduction

**Pricing API:** ✅ Available
```bash
curl -X GET 'https://pricing.twilio.com/v2/Voice/Countries/US' \
  -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}"
```

**Documentation:**
- Pricing: https://www.twilio.com/voice/pricing/us
- Usage API: https://www.twilio.com/docs/usage/api

---

### 1.2 Deepgram (Speech-to-Text)

**Service:** Real-time audio transcription

**Pricing Model:** Per-minute billing
- **Nova-2 (streaming):** $0.0059/minute
- **Nova-2 (pre-recorded):** $0.0043/minute
- Billed by the second (no rounding)

**Our Usage:**
- Real-time streaming required
- 5 minutes of audio per call
- **Cost per 5-min call:** $0.030

**Free Tier:**
- $200 credit on signup
- ~45,000 minutes of transcription

**Pricing API:** ❌ Not available
- Must track manually or scrape pricing page
- Set up alerts for pricing page changes

**Documentation:**
- Pricing: https://deepgram.com/pricing
- Usage API: https://developers.deepgram.com/reference/usage-api

---

### 1.3 Cerebras AI (Inference)

**Service:** Ultra-fast AI inference

**Pricing Model:** Per-token billing
- **Llama 3.1 8B:** $0.10 per 1M tokens (input + output combined)
- **Llama 3.1 70B:** $0.60 per 1M tokens
- **Llama 3.1 405B:** $6.00 per 1M input, $12.00 per 1M output

**Our Usage:**
- Llama 3.1 8B for speed (<1s inference)
- ~10,000 tokens per turn (context + response)
- ~5 turns per 5-min call = 50,000 tokens
- **Cost per 5-min call:** $0.005 (50K tokens × $0.0000001/token)

**Why Cerebras:**
- **40x cheaper than OpenAI GPT-4** ($4/1M tokens vs $0.10/1M)
- **Sub-1-second inference** (critical for real-time conversation)
- **Key competitive advantage**

**OpenAI Fallback (if Cerebras down):**
- **GPT-4 Turbo:** $10/1M input, $30/1M output
- **Cost per 5-min call:** ~$2.00 (40x more expensive!)
- **Fallback rate:** Target <5% (Cerebras is highly reliable)

**Pricing API:** ✅ Available
```bash
curl -X GET 'https://api.cerebras.ai/v1/models' \
  -H "Authorization: Bearer ${CEREBRAS_API_KEY}"
```

**Documentation:**
- Pricing: https://inference-docs.cerebras.ai/pricing
- API: https://inference-docs.cerebras.ai/api-reference

---

### 1.4 ElevenLabs (Text-to-Speech)

**Service:** Real-time voice synthesis

**Pricing Model:** Per-character billing
- **Standard models:** $0.30 per 1,000 characters
- **Turbo models (v2.5):** $0.15 per 1,000 characters (50% discount)
- Voice cloning included

**Our Usage:**
- Turbo v2.5 for speed and cost savings
- ~400 characters per minute (average AI response)
- 5 minutes = ~2,000 characters
- **Cost per 5-min call:** $0.300 (2K chars × $0.00015/char)

**⚠️ LARGEST API COST**
- **70.6% of API costs** ($0.30 of $0.425 subtotal)
- **33.3% of total costs** (including Stripe)
- **Primary optimization target**

**Pricing API:** ⚠️ Tier-based inference
```bash
curl -X GET 'https://api.elevenlabs.io/v1/user/subscription' \
  -H "xi-api-key: ${ELEVENLABS_API_KEY}"
```

**Subscription Tiers:**
- Free: $0/month, 10K chars
- Starter: $5/month, 30K chars ($0.30/1K)
- Creator: $22/month, 100K chars ($0.24/1K)
- Pro: $99/month, 500K chars ($0.18/1K)
- Scale: $330/month, 2M chars ($0.15/1K)

**Cost Optimization Strategies:**
1. Use Turbo models exclusively (50% cheaper)
2. Cache common phrases (e.g., greetings)
3. Optimize prompts to reduce AI verbosity
4. Negotiate volume discounts at 100K+ chars/month

**Documentation:**
- Pricing: https://elevenlabs.io/pricing
- API: https://elevenlabs.io/docs/api-reference/usage

---

### 1.5 Stripe (Payment Processing)

**Service:** Credit card payment processing

**Pricing Model:** Percentage + fixed fee per transaction
- **Standard rate:** 2.9% + $0.30
- **CNP (Card-Not-Present):** 3.4% + $0.30 (2025 update)
- **ACH transfers:** 0.8% (capped at $5.00)
- **International cards:** +1.5% + 1% currency conversion

**Our Usage:**
- CNP transactions (all web payments)
- **Cost per $4.99 charge:** ($4.99 × 0.034) + $0.30 = **$0.475**

**⚠️ LARGEST TOTAL COST**
- **53% of total costs** ($0.475 of $0.900)
- **More expensive than all APIs combined!**
- **Optimization target:** Move to subscription model

**Cost Reduction Strategies:**
1. **Subscription model** - One monthly charge instead of many per-call charges
2. **ACH payments** - 0.8% vs 3.4% for power users
3. **Prepaid credits** - Fewer transactions, better cash flow
4. **Volume discounts** - Negotiate at scale (usually >$100K/month volume)

**No API needed:** Contractual rate, stable

**Documentation:**
- Pricing: https://stripe.com/pricing
- API: https://stripe.com/docs/api/balance_transactions

---

### 1.6 Raindrop (Backend Infrastructure)

**Service:** Serverless backend hosting

**Pricing Tiers:**
| Tier | Monthly Cost | Estimated Calls/Month |
|------|-------------|----------------------|
| Beta | $5 | Unlimited (during beta) |
| Small | $20 | 500-1,000 |
| Medium | $50 | 2,000-5,000 |
| Large | $100 | 10,000+ |

**Included Resources:**
- 10 services + 1 MCP service
- SmartSQL database
- SmartMemory (conversation context)
- SmartBuckets (transcripts, logs)
- KV caches (tokens, rate limits)

**Our Usage:**
- Currently on Small tier ($20/month)
- Amortized cost per call: $20 ÷ 1,000 calls = **$0.020/call**

**No pricing API:** Fixed monthly cost

**Documentation:**
- Pricing: https://liquidmetal.ai/pricing

---

### 1.7 Vultr (VPS & PostgreSQL)

**Service:** Voice pipeline hosting + PostgreSQL database

**Current Setup:**
- VPS ($6/month): Voice pipeline (WebSocket server)
- PostgreSQL: Self-hosted on VPS ($0/month additional)
- Bandwidth: Usually included

**Why Vultr (not Raindrop):**
- Cloudflare Workers can't do outbound WebSockets
- SmartSQL too limited (no JSONB, triggers, etc.)
- See `documentation/domain/database.md` for details

**Cost per call:** $6 ÷ 1,000 calls = **$0.006/call** (negligible)

**Pricing API:** ✅ Available
```bash
curl -X GET 'https://api.vultr.com/v2/account' \
  -H "Authorization: Bearer ${VULTR_API_KEY}"
```

**Documentation:**
- Billing API: https://www.vultr.com/api/#tag/billing
- Account API: https://www.vultr.com/api/#tag/account

---

## 2. Cost Tracking System

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Voice Pipeline (Vultr) / Services (Raindrop)           │
│   ↓ Record every API call                              │
│   POST /api/costs/track                                 │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ cost-analytics Service (Raindrop)                      │
│   - Validates cost data                                 │
│   - Calculates unit cost from pricing-manager          │
│   - Stores in api_call_events table                    │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ PostgreSQL (Vultr)                                      │
│   - api_call_events (micro-level)                      │
│   - cost_summaries (macro-level)                       │
│   - service_pricing (dynamic pricing)                  │
│   - usage_quotas (limits & alerts)                     │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Database Schema

#### Table: `api_call_events`

**Purpose:** Record every external API call with cost details

```sql
CREATE TABLE api_call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Call context
  call_id VARCHAR(100),
  user_id UUID REFERENCES users(id),
  persona_id VARCHAR(50),

  -- API service details
  service VARCHAR(50) NOT NULL,  -- 'twilio', 'deepgram', 'cerebras', 'elevenlabs', 'stripe'
  operation VARCHAR(100) NOT NULL,  -- 'voice_call', 'stt_streaming', 'chat_completion', 'tts_generation'

  -- Usage metrics
  usage_amount DECIMAL(12, 6) NOT NULL,
  usage_unit VARCHAR(20) NOT NULL,  -- 'minutes', 'tokens', 'characters', 'transaction'

  -- Cost tracking
  unit_cost DECIMAL(10, 6) NOT NULL,
  total_cost DECIMAL(10, 4) NOT NULL,
  estimated BOOLEAN DEFAULT true,  -- False after verification

  -- Metadata
  metadata JSONB,
  external_id VARCHAR(200),

  INDEX idx_call_events_call_id (call_id),
  INDEX idx_call_events_user_id (user_id),
  INDEX idx_call_events_created_at (created_at),
  INDEX idx_call_events_service (service)
);
```

**Usage Example:**
```sql
-- Record Cerebras API call
INSERT INTO api_call_events (
  call_id, user_id, persona_id,
  service, operation,
  usage_amount, usage_unit,
  unit_cost, total_cost,
  metadata
) VALUES (
  'call_12345', 'user_123', 'brad',
  'cerebras', 'chat_completion',
  50000, 'tokens',
  0.0000001, 0.005,
  '{"model": "llama3.1-8b", "prompt_tokens": 30000, "completion_tokens": 20000}'
);
```

---

#### Table: `cost_summaries`

**Purpose:** Aggregated cost data for analytics

```sql
CREATE TABLE cost_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Aggregation level
  summary_type VARCHAR(20) NOT NULL,  -- 'call', 'user_day', 'user_month', 'platform_day'

  -- Context
  call_id VARCHAR(100),
  user_id UUID REFERENCES users(id),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Cost breakdown
  twilio_cost DECIMAL(10, 4) DEFAULT 0,
  deepgram_cost DECIMAL(10, 4) DEFAULT 0,
  cerebras_cost DECIMAL(10, 4) DEFAULT 0,
  elevenlabs_cost DECIMAL(10, 4) DEFAULT 0,
  stripe_cost DECIMAL(10, 4) DEFAULT 0,
  raindrop_cost DECIMAL(10, 4) DEFAULT 0,
  vultr_cost DECIMAL(10, 4) DEFAULT 0,
  total_cost DECIMAL(10, 4) NOT NULL,

  -- Usage metrics
  total_duration_seconds INT DEFAULT 0,
  total_ai_tokens INT DEFAULT 0,
  total_tts_characters INT DEFAULT 0,
  call_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_summaries_type_period (summary_type, period_start),
  INDEX idx_summaries_user (user_id, period_start),
  INDEX idx_summaries_call (call_id)
);
```

**Usage Example:**
```sql
-- Get user's monthly spending
SELECT
  SUM(total_cost) as total_spent,
  AVG(total_cost) as avg_per_call,
  SUM(call_count) as total_calls
FROM cost_summaries
WHERE user_id = 'user_123'
  AND summary_type = 'user_month'
  AND period_start >= DATE_TRUNC('month', NOW());
```

---

#### Table: `service_pricing`

**Purpose:** Historical pricing data from service APIs

```sql
CREATE TABLE service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  pricing_type VARCHAR(50) NOT NULL,  -- 'per_minute', 'per_token', 'per_character'

  -- Pricing details
  unit_price DECIMAL(12, 8) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Metadata
  metadata JSONB,

  -- Versioning
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,  -- NULL if current

  -- Source tracking
  source VARCHAR(50) NOT NULL,  -- 'api', 'manual', 'inferred'
  last_verified TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_pricing_service_effective (service, effective_to)
);
```

**Usage Example:**
```sql
-- Get current Twilio pricing
SELECT unit_price
FROM service_pricing
WHERE service = 'twilio'
  AND pricing_type = 'per_minute'
  AND effective_to IS NULL
ORDER BY effective_from DESC
LIMIT 1;
```

---

#### Table: `usage_quotas`

**Purpose:** Track API limits and send alerts

```sql
CREATE TABLE usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  quota_type VARCHAR(50) NOT NULL,  -- 'daily', 'monthly', 'account'

  -- Limits
  max_amount DECIMAL(12, 2),
  max_cost DECIMAL(10, 2),

  -- Current usage
  current_amount DECIMAL(12, 2) DEFAULT 0,
  current_cost DECIMAL(10, 2) DEFAULT 0,

  -- Alert thresholds
  warning_threshold DECIMAL(5, 2) DEFAULT 0.80,  -- Alert at 80%
  critical_threshold DECIMAL(5, 2) DEFAULT 0.95,  -- Alert at 95%

  -- Period tracking
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2.3 Real-Time Cost Recording

**In Voice Pipeline (voice-pipeline-nodejs/index.js):**

```javascript
class VoicePipeline {
  async recordCost(service, operation, usage, metadata = {}) {
    const costEvent = {
      callId: this.callId,
      userId: this.userId,
      personaId: this.personaId,
      service,
      operation,
      usageAmount: usage.amount,
      usageUnit: usage.unit,
      metadata,
      timestamp: new Date().toISOString()
    };

    // Send to cost-analytics service
    await fetch(`${process.env.API_GATEWAY_URL}/api/costs/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(costEvent)
    });
  }

  async generateResponse(userInput) {
    const startTime = Date.now();
    const response = await cerebrasAPI.chatCompletion(...);
    const tokensUsed = response.usage.total_tokens;

    // Record cost immediately
    await this.recordCost('cerebras', 'chat_completion', {
      amount: tokensUsed,
      unit: 'tokens'
    }, {
      model: 'llama3.1-8b',
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
      inference_time_ms: Date.now() - startTime
    });

    return response;
  }

  async speak(text) {
    const charCount = text.length;

    // Record cost immediately
    await this.recordCost('elevenlabs', 'tts_generation', {
      amount: charCount,
      unit: 'characters'
    }, {
      voice_id: this.voiceId,
      model: 'eleven_turbo_v2_5',
      text_length: charCount
    });

    // ... existing speak logic
  }

  async cleanup() {
    // Calculate final call duration
    const durationMinutes = (Date.now() - this.startTime) / 60000;

    // Record Twilio cost
    await this.recordCost('twilio', 'voice_outbound', {
      amount: durationMinutes,
      unit: 'minutes'
    }, {
      call_sid: this.callId,
      duration_seconds: durationMinutes * 60
    });

    // Record Deepgram cost
    await this.recordCost('deepgram', 'stt_streaming', {
      amount: durationMinutes,
      unit: 'minutes'
    }, {
      model: 'nova-2',
      encoding: 'mulaw'
    });
  }
}
```

---

### 2.4 Cost Analytics Service

**API Endpoints:**

```typescript
// GET /api/costs/call/:callId
async getCallCosts(callId: string) {
  const events = await this.db.query(`
    SELECT service, operation, usage_amount, usage_unit, total_cost, metadata
    FROM api_call_events
    WHERE call_id = $1
    ORDER BY created_at
  `, [callId]);

  const summary = await this.db.query(`
    SELECT * FROM cost_summaries
    WHERE call_id = $1 AND summary_type = 'call'
  `, [callId]);

  return {
    callId,
    events: events.rows,
    summary: summary.rows[0],
    breakdown: {
      twilio: summary.rows[0]?.twilio_cost || 0,
      deepgram: summary.rows[0]?.deepgram_cost || 0,
      cerebras: summary.rows[0]?.cerebras_cost || 0,
      elevenlabs: summary.rows[0]?.elevenlabs_cost || 0,
      total: summary.rows[0]?.total_cost || 0
    }
  };
}

// GET /api/costs/user/:userId/current
async getUserCurrentSpending(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailySpending = await this.db.query(`
    SELECT SUM(total_cost) as total
    FROM api_call_events
    WHERE user_id = $1 AND created_at >= $2
  `, [userId, today]);

  const budget = await this.db.query(`
    SELECT daily_limit, monthly_limit
    FROM user_budget_settings
    WHERE user_id = $1
  `, [userId]);

  return {
    today: {
      spent: dailySpending.rows[0].total || 0,
      limit: budget.rows[0]?.daily_limit,
      remaining: (budget.rows[0]?.daily_limit || 0) - (dailySpending.rows[0].total || 0)
    }
  };
}

// GET /api/costs/platform/summary
async getPlatformSummary(fromDate: Date, toDate: Date) {
  const summary = await this.db.query(`
    SELECT
      SUM(twilio_cost) as twilio,
      SUM(deepgram_cost) as deepgram,
      SUM(cerebras_cost) as cerebras,
      SUM(elevenlabs_cost) as elevenlabs,
      SUM(total_cost) as total,
      SUM(call_count) as total_calls
    FROM cost_summaries
    WHERE summary_type = 'platform_day'
      AND period_start >= $1
      AND period_end <= $2
  `, [fromDate, toDate]);

  return summary.rows[0];
}
```

---

## 3. Profitability Analysis

### 3.1 Unit Economics (Per Call)

**Scenario: Standard 5-Minute Call**

```
Revenue:               $4.99
───────────────────────────────
Variable Costs:
  Twilio:              $0.070
  Deepgram:            $0.030
  Cerebras:            $0.005
  ElevenLabs:          $0.300
  Raindrop:            $0.020
  ───────────────────────────
  Subtotal (API):      $0.425

  Stripe:              $0.475
  ───────────────────────────
  Total Variable:      $0.900
───────────────────────────────
Gross Profit:          $4.09
Gross Margin:          82%
───────────────────────────────
```

**Scenario: 10-Minute Call ($7.99 pricing)**

```
Revenue:               $7.99
───────────────────────────────
Variable Costs:
  Twilio:              $0.140
  Deepgram:            $0.060
  Cerebras:            $0.010
  ElevenLabs:          $0.600
  Raindrop:            $0.020
  ───────────────────────────
  Subtotal (API):      $0.830

  Stripe:              $0.572
  ───────────────────────────
  Total Variable:      $1.402
───────────────────────────────
Gross Profit:          $6.59
Gross Margin:          82.5%
───────────────────────────────
```

**Key Insight:** Margins remain consistent (82-83%) regardless of call length!

---

### 3.2 Break-Even Analysis

**Fixed Costs (Monthly):**
```
Raindrop (Small tier):    $20
Developer time:           $0 (solo founder bootstrap)
Marketing baseline:       $500
───────────────────────────────
Total Fixed:              $520
```

**Break-Even Formula:**
```
Break-Even Calls = Fixed Costs / (Price - Variable Cost)
```

**At $4.99 Pricing:**
```
$520 / ($4.99 - $0.90) = 127 calls/month
```

**With 50 Users × 2.5 Calls/Month = 125 Calls:**
- Monthly revenue: 125 × $4.99 = $624
- Monthly costs: $520 + (125 × $0.90) = $632.50
- **Result: Break-even!**

**Already profitable at just 150 calls/month!**

---

### 3.3 Scaling Economics

**Scenario A: 500 Users (1,500 Calls/Month)**

```
Monthly Revenue:
  1,500 calls × $4.99 = $7,485

Monthly Costs:
  Fixed (Raindrop Medium): $50
  Variable (1,500 × $0.90): $1,350
  Marketing (30%): $2,246
  ───────────────────────────────
  Total Costs: $3,646

Profit: $3,839 (51% margin)
```

**Scenario B: 5,000 Users (20,000 Calls/Month)**

```
Monthly Revenue:
  20,000 calls × $4.99 = $99,800

Monthly Costs:
  Fixed (Raindrop Large + Team): $16,100
  Variable (20,000 × $0.90): $18,000
  Marketing (20%): $19,960
  ───────────────────────────────
  Total Costs: $54,060

Profit: $45,740 (46% margin)
```

---

## 4. Pricing Strategy

### 4.1 Phase 1: Launch (Month 1-3)

**Goal:** Acquire first 100-500 users, prove concept

**Pricing:**
```
Free Trial
  - 1 call free (no credit card)
  - Cost to us: $0.90
  - Goal: 30% conversion

Pay-As-You-Go
  - $4.99 per 5-minute call
  - Margin: 82%
  - Target: Casual users
```

**Why Low Pricing:**
- Remove friction for first-time users
- Build viral word-of-mouth
- Gather usage data and testimonials
- **Already profitable at $4.99!**

---

### 4.2 Phase 2: Growth (Month 4-12)

**Goal:** Scale to 2,500 users, optimize revenue

**Pricing:**
```
Pay-As-You-Go
  - $6.99 per call (↑ from $4.99)
  - Grandfathered users keep $4.99
  - Margin: 88%

Starter Pack
  - $24.99 for 5 calls ($4.99/call)
  - Reduces Stripe fees (1 transaction vs 5)
  - Target: Regular users

Monthly Unlimited
  - $29.99/month (up to 10 calls)
  - Fair use limit prevents abuse
  - Most popular tier
```

---

### 4.3 Phase 3: Scale (Month 12+)

**Goal:** Maximize ARPU, introduce premium tiers

**Pricing:**
```
Casual Plan - $9.99/month
  - 3 calls included
  - Additional: $4.99 each
  - Target: Monthly users

Standard Plan - $29.99/month
  - 10 calls/month (5 min each)
  - Additional: $4.99 each
  - Target: Weekly users

Power Plan - $49.99/month
  - 25 calls/month
  - Additional: $3.99 each
  - Target: Daily users

Pro Plan - $99.99/month
  - Unlimited calls (fair use: 100/month)
  - Custom personas
  - Priority support
  - Target: Enterprise
```

**Call Duration Pricing:**
```
3 minutes:  $3.99 (margin: 86%)
5 minutes:  $4.99 (margin: 82%) ← Default
10 minutes: $7.99 (margin: 83%)
15 minutes: $10.99 (margin: 84%)
```

---

## 5. Cost Optimization

### 5.1 ElevenLabs Optimization (Largest Cost)

**Current:** $0.30/call (70.6% of API costs)

**Strategies:**

1. **Use Turbo Models Only**
   - Already using Turbo v2.5 (50% cheaper than standard)
   - Savings: $0.15 → $0.30 per call

2. **Response Caching**
   - Cache common phrases (greetings, farewells)
   - Pre-generate for frequently used personas
   - **Potential savings:** 20-30% ($0.06-0.09/call)

3. **Prompt Optimization**
   - Reduce AI verbosity (fewer characters)
   - Target: 1,500 chars instead of 2,000
   - **Potential savings:** 25% ($0.075/call)

4. **Volume Discounts**
   - Negotiate at 100K+ chars/month
   - Typical discount: 10-20%
   - **Potential savings:** $0.03-0.06/call

**Total Potential:** Reduce from $0.30 → $0.18/call (40% reduction)

---

### 5.2 Stripe Fee Reduction (Largest Total Cost)

**Current:** $0.475/call (53% of total costs)

**Strategies:**

1. **Subscription Model**
   - One monthly charge instead of multiple per-call
   - Saves 3.4% on additional calls within subscription
   - **Potential savings:** 50-70% on Stripe fees

2. **ACH Payments (for power users)**
   - 0.8% vs 3.4%
   - Only viable for subscriptions ($29.99+)
   - **Potential savings:** 76% reduction ($0.475 → $0.11)

3. **Prepaid Credit Bundles**
   - Fewer transactions, better cash flow
   - User buys $50 for 10 calls = 1 Stripe fee
   - **Potential savings:** 80% ($0.475 → $0.095 per call)

4. **Alternative Processors**
   - Paddle, Lemon Squeezy at scale
   - Typically 5% + $0.50, but handles VAT/taxes
   - Viable at $100K+/month volume

**Total Potential:** Reduce from $0.475 → $0.10-0.20/call (58-79% reduction)

---

### 5.3 Cerebras Token Optimization

**Current:** $0.005/call (1.2% of API costs)

**Already Optimal:** Cerebras is 40x cheaper than GPT-4!

**Strategies:**

1. **Smart Memory Pruning**
   - Keep context <3K tokens per turn
   - Remove old conversation history
   - **Potential savings:** 20-30% ($0.001-0.0015/call)

2. **Scenario-Specific Prompts**
   - Load only relevant context for persona
   - Avoid full history on every turn
   - **Potential savings:** 20% ($0.001/call)

3. **Cache Base Prompts**
   - Persona system prompts cached
   - Reuse across calls
   - **Potential savings:** Minimal (<$0.001/call)

**Total Potential:** Reduce from $0.005 → $0.003/call (40% reduction)

---

### 5.4 Optimized Cost Structure

**After All Optimizations:**

```
BEFORE:
  Twilio:       $0.070
  Deepgram:     $0.030
  Cerebras:     $0.005
  ElevenLabs:   $0.300
  Raindrop:     $0.020
  Stripe:       $0.475
  ─────────────────────
  TOTAL:        $0.900/call (82% margin at $4.99)

AFTER:
  Twilio:       $0.070  (unchanged)
  Deepgram:     $0.030  (unchanged)
  Cerebras:     $0.003  (↓ 40%)
  ElevenLabs:   $0.180  (↓ 40%)
  Raindrop:     $0.010  (↓ 50% via scale)
  Stripe:       $0.150  (↓ 68% via subscriptions)
  ─────────────────────
  TOTAL:        $0.443/call (91% margin at $4.99!)
```

**Impact:**
- **Cost reduction:** $0.900 → $0.443 (51% savings)
- **Margin improvement:** 82% → 91%
- **Break-even:** 127 calls → 62 calls/month

---

## 6. Budget Management

### 6.1 Per-User Budget Limits

**Table: `user_budget_settings`**

```sql
CREATE TABLE user_budget_settings (
  user_id VARCHAR(255) PRIMARY KEY,
  max_cost_per_call_cents INTEGER DEFAULT 1000,  -- $10
  max_monthly_spend_cents INTEGER DEFAULT 10000, -- $100
  warn_at_percent_per_call INTEGER DEFAULT 75,
  enable_auto_cutoff BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Usage:**

```typescript
// Before initiating call
async canUserMakeCall(userId: string): Promise<boolean> {
  const spending = await this.getUserCurrentSpending(userId);
  const estimatedCallCost = 0.90;

  // Check daily limit
  if (spending.today.remaining < estimatedCallCost) {
    return false;
  }

  // Check monthly limit
  if (spending.month.remaining < estimatedCallCost) {
    return false;
  }

  return true;
}

// During call (voice pipeline checks every 30 seconds)
async checkCallBudget(callId: string): Promise<boolean> {
  const costs = await this.getCallCosts(callId);
  const budget = await this.getUserBudget(costs.userId);

  const percentUsed = (costs.total / budget.max_cost_per_call_cents) * 100;

  if (percentUsed >= budget.warn_at_percent_per_call) {
    // Send warning to user
    await this.sendBudgetWarning(costs.userId, percentUsed);
  }

  if (percentUsed >= 100 && budget.enable_auto_cutoff) {
    // Automatically end call
    return false;
  }

  return true;
}
```

---

### 6.2 Platform-Wide Quotas

**Table: `usage_quotas`**

```sql
-- Example: ElevenLabs monthly quota
INSERT INTO usage_quotas (
  service, quota_type,
  max_amount, max_cost,
  warning_threshold, critical_threshold,
  period_start, period_end
) VALUES (
  'elevenlabs', 'monthly',
  100000, 15.00,  -- 100K chars = $15
  0.80, 0.95,
  DATE_TRUNC('month', NOW()),
  DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
);
```

**Monitoring:**

```typescript
// Runs every hour
async checkQuotaLimits() {
  const quotas = await this.db.query(`
    SELECT * FROM usage_quotas
    WHERE (current_cost / max_cost) >= warning_threshold
      AND period_end > NOW()
  `);

  for (const quota of quotas.rows) {
    const usagePercent = (quota.current_cost / quota.max_cost) * 100;

    if (usagePercent >= quota.critical_threshold * 100) {
      // Send critical alert
      await this.sendAlert({
        type: 'quota_critical',
        service: quota.service,
        message: `${quota.service} at ${usagePercent.toFixed(1)}% of quota`,
        data: { quota }
      });
    } else {
      // Send warning
      await this.sendAlert({
        type: 'quota_warning',
        service: quota.service,
        message: `${quota.service} at ${usagePercent.toFixed(1)}% of quota`,
        data: { quota }
      });
    }
  }
}
```

---

## 7. Real-World Scenarios

### 7.1 Solo Developer Launch (Month 1-3)

**User Base:** 50 active users
**Usage:** 2 calls/user/month = 100 calls/month
**Pricing:** $4.99/call

**Monthly Costs:**
```
Raindrop (Small):       $20.00
API costs (100 × $0.43): $43.00
Stripe (100 × $0.48):    $48.00
Marketing:              $500.00
─────────────────────────────────
Total:                  $611.00
```

**Monthly Revenue:**
```
100 calls × $4.99 = $499.00
```

**Result:** -$112/month (investment phase)

**Break-even:** Month 3 at 150 calls

---

### 7.2 Growth Phase (Month 6-12)

**User Base:** 500 active users
**Usage:** 3 calls/user/month = 1,500 calls/month
**Pricing:** Mix of $4.99 pay-per-call + $9.99/$29.99 subscriptions

**Monthly Costs:**
```
Raindrop (Medium):       $50.00
API costs (1,500 × $0.43): $645.00
Stripe (avg):            $700.00
Marketing (30%):        $2,700.00
─────────────────────────────────
Total:                  $4,095.00
```

**Monthly Revenue:**
```
30% subscriptions ($9.99 avg): $1,498
70% pay-per-call ($4.99 × 1,050): $5,240
─────────────────────────────────
Total:                  $6,738.00
```

**Result:** +$2,643/month profit (39% margin)

---

### 7.3 Scale (Month 12+)

**User Base:** 5,000 active users
**Usage:** 4 calls/user/month = 20,000 calls/month
**Pricing:** 60% on subscriptions

**Monthly Costs:**
```
Raindrop (Large):       $100.00
API costs (20K × $0.43):  $8,600.00
Stripe (reduced via subs): $6,000.00
Team (2 devs):          $16,000.00
Marketing (20%):        $18,000.00
─────────────────────────────────
Total:                  $48,700.00
```

**Monthly Revenue:**
```
40% pay-per-call (8K × $6.99): $55,920
30% Casual ($9.99 × 1,500): $14,985
20% Standard ($29.99 × 1,000): $29,990
10% Power ($49.99 × 500): $24,995
─────────────────────────────────
Total:                  $125,890
```

**Result:** +$77,190/month profit (61% margin)

**Annual Revenue:** $1.5M
**Annual Profit:** $926K

---

## 8. Implementation Guide

### 8.1 Phase 1: Core Infrastructure (Week 1)

**Tasks:**
1. Create database tables (`api_call_events`, `cost_summaries`, `service_pricing`, `usage_quotas`)
2. Build `cost-analytics` service skeleton
3. Create API endpoints for cost queries
4. Test with manual cost recording

**SQL Migrations:**
```bash
# Create migrations
touch migrations/010_create_cost_tracking_tables.sql

# Apply migrations
ssh root@[VULTR_VPS_IP]
psql -U postgres -d callmeback < migrations/010_create_cost_tracking_tables.sql
```

---

### 8.2 Phase 2: Real-Time Tracking (Week 2)

**Tasks:**
1. Instrument voice pipeline with cost tracking calls
2. Add cost tracking to payment-processor
3. Implement budget checking before call initiation
4. Build cost summary aggregation jobs

**Voice Pipeline Integration:**
```javascript
// voice-pipeline-nodejs/cost-tracker.js
class CostTracker {
  async recordCost(service, operation, usage, metadata) {
    await fetch(`${API_GATEWAY_URL}/api/costs/track`, {
      method: 'POST',
      body: JSON.stringify({
        callId: this.callId,
        userId: this.userId,
        service,
        operation,
        usageAmount: usage.amount,
        usageUnit: usage.unit,
        metadata
      })
    });
  }
}
```

---

### 8.3 Phase 3: External API Sync (Week 3)

**Tasks:**
1. Integrate Twilio Usage API
2. Integrate Deepgram Usage API
3. Integrate Cerebras Usage API
4. Integrate ElevenLabs Usage API
5. Integrate Vultr Billing API
6. Build reconciliation logic
7. Schedule daily sync jobs

**Pricing Manager Service:**
```typescript
// src/pricing-manager/index.ts
async fetchTwilioPricing() {
  const url = 'https://pricing.twilio.com/v2/Voice/Countries/US';
  const auth = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
  const response = await fetch(url, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  const data = await response.json();
  return data.outbound_call_prices[0].current_price;
}
```

---

### 8.4 Phase 4: Analytics & Alerts (Week 4)

**Tasks:**
1. Build cost analytics dashboard endpoints
2. Implement quota monitoring
3. Create alert system (email, in-app)
4. Add frontend cost display
5. Test alert thresholds

**Alert System:**
```typescript
async sendAlert(alert: Alert) {
  // Log to database
  await this.db.query(`
    INSERT INTO cost_alerts (type, service, user_id, message, data)
    VALUES ($1, $2, $3, $4, $5)
  `, [alert.type, alert.service, alert.userId, alert.message, alert.data]);

  // Send email
  if (alert.type === 'quota_critical') {
    await this.sendEmail({
      to: 'admin@callmeback.ai',
      subject: `🚨 CRITICAL: ${alert.service} quota at ${alert.data.usage_percent}%`,
      body: alert.message
    });
  }
}
```

---

## Sources

**Consolidated from:**
- `API_COSTS_AND_PROFITABILITY_2025.md` (2025-01, 1,149 lines) - Complete cost analysis, profitability models
- `COST_OBSERVABILITY_PLAN.md` (2025-11-19, 735 lines) - Cost tracking system architecture
- `DYNAMIC_PRICING_STRATEGY.md` (2025-11-18, 873 lines) - API-based price discovery
- `PCR2.md` (2025-11-20, lines 978-1088) - Actual API costs verification

**Related Documents:**
- See `documentation/domain/raindrop.md` for service architecture
- See `documentation/domain/database.md` for PostgreSQL tables
- See `documentation/domain/voice-pipeline.md` for call cost recording
- See `SYSTEM_ARCHITECTURE.md` for infrastructure overview

---

**End of Cost Tracking Documentation**

---

> **Navigation:** [← Back to README](../README.md) | [Documentation Catalog](./CATALOG.md)
