# Cost Observability System - Comprehensive Plan

**Created:** 2025-11-18
**Status:** Planning Phase
**Goal:** Track all operational costs at micro (per-API-call) and macro (aggregate) levels with real-time monitoring and limit alerts

---

## Executive Summary

Build a comprehensive cost tracking and observability system that:
1. **Tracks every API call** to external services (Twilio, Deepgram, Cerebras, ElevenLabs, Stripe)
2. **Calculates real-time costs** per conversation, per user, per day/month
3. **Monitors usage limits** and sends alerts when approaching quotas
4. **Provides analytics dashboards** for profitability analysis
5. **Integrates with billing** to ensure accurate cost attribution

---

## Services to Track

### External API Services

| Service | Pricing Model | API Endpoint for Usage | Rate Limits |
|---------|--------------|------------------------|-------------|
| **Twilio Voice** | $0.014/min outbound | [Twilio Usage API](https://www.twilio.com/docs/usage/api) | Account-based |
| **Deepgram STT** | $0.0059/min streaming | [Deepgram Usage API](https://developers.deepgram.com/reference/usage-api) | API key limits |
| **Cerebras AI** | $0.10/1M tokens | [Cerebras Usage API](https://inference-docs.cerebras.ai/api-reference/usage) | Rate limits |
| **ElevenLabs TTS** | $0.15/1K chars | [ElevenLabs Usage API](https://elevenlabs.io/docs/api-reference/usage) | Character quotas |
| **Stripe** | 3.4% + $0.30 | [Stripe Balance API](https://stripe.com/docs/api/balance_transactions) | N/A |
| **Raindrop** | $20/month base | Raindrop CLI/API | Service limits |

### Current Cost Tracking Infrastructure

**Existing Tables:**
- ✅ `call_cost_events` - Granular cost tracking per API call
- ✅ `calls` - Call records with duration and costs
- ✅ `user_budget_settings` - Per-user spending limits
- ⚠️ **Needs enhancement** - Not currently being populated

---

## Architecture Design

### 1. Cost Tracking Service

**New Raindrop Service:** `cost-tracker`

**Responsibilities:**
- Record every external API call in real-time
- Calculate costs based on usage metrics
- Aggregate costs by call, user, day, month
- Query external APIs for usage verification
- Send alerts when approaching limits

**Key Functions:**
```typescript
interface CostTrackerService {
  // Record individual API calls
  recordApiCall(params: {
    callId: string,
    userId: string,
    service: 'twilio' | 'deepgram' | 'cerebras' | 'elevenlabs' | 'stripe' | 'raindrop',
    operation: string,
    usage: number,  // minutes, tokens, characters, etc.
    estimatedCost: number,
    metadata: object
  }): Promise<void>;

  // Get real-time cost for a call
  getCallCosts(callId: string): Promise<CallCostBreakdown>;

  // Get user spending
  getUserSpending(userId: string, period: 'day' | 'month'): Promise<UserSpending>;

  // Check if user is within budget
  checkUserBudget(userId: string): Promise<BudgetStatus>;

  // Sync with external APIs for verification
  syncExternalUsage(service: string, fromDate: Date): Promise<void>;

  // Get platform-wide costs
  getPlatformCosts(fromDate: Date, toDate: Date): Promise<PlatformCosts>;
}
```

---

### 2. Enhanced Database Schema

#### Table: `api_call_events` (enhanced `call_cost_events`)

```sql
CREATE TABLE api_call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Call context
  call_id VARCHAR(100),  -- Twilio call SID
  user_id UUID REFERENCES users(id),
  persona_id VARCHAR(50),

  -- API service details
  service VARCHAR(50) NOT NULL,  -- 'twilio', 'deepgram', 'cerebras', 'elevenlabs', 'stripe'
  operation VARCHAR(100) NOT NULL,  -- 'voice_call', 'stt_streaming', 'chat_completion', 'tts_generation', 'payment'

  -- Usage metrics
  usage_amount DECIMAL(12, 6) NOT NULL,  -- Generic usage amount
  usage_unit VARCHAR(20) NOT NULL,  -- 'minutes', 'tokens', 'characters', 'request'

  -- Cost tracking
  unit_cost DECIMAL(10, 6) NOT NULL,  -- Cost per unit at time of call
  total_cost DECIMAL(10, 4) NOT NULL,  -- Calculated total cost
  estimated BOOLEAN DEFAULT true,  -- False after verification with external API

  -- Metadata
  metadata JSONB,  -- Service-specific details
  external_id VARCHAR(200),  -- External service's transaction ID

  -- Indexes
  INDEX idx_call_events_call_id (call_id),
  INDEX idx_call_events_user_id (user_id),
  INDEX idx_call_events_created_at (created_at),
  INDEX idx_call_events_service (service)
);
```

#### Table: `usage_quotas`

```sql
CREATE TABLE usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  quota_type VARCHAR(50) NOT NULL,  -- 'daily', 'monthly', 'account'

  -- Limits
  max_amount DECIMAL(12, 2),  -- Max usage amount
  max_cost DECIMAL(10, 2),  -- Max cost

  -- Current usage
  current_amount DECIMAL(12, 2) DEFAULT 0,
  current_cost DECIMAL(10, 2) DEFAULT 0,

  -- Alert thresholds
  warning_threshold DECIMAL(5, 2) DEFAULT 0.80,  -- Alert at 80%
  critical_threshold DECIMAL(5, 2) DEFAULT 0.95,  -- Alert at 95%

  -- Period tracking
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  last_updated TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(service, quota_type, period_start)
);
```

#### Table: `cost_summaries`

```sql
CREATE TABLE cost_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Aggregation level
  summary_type VARCHAR(20) NOT NULL,  -- 'call', 'user_day', 'user_month', 'platform_day', 'platform_month'

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

#### Table: `external_usage_sync`

```sql
CREATE TABLE external_usage_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  sync_type VARCHAR(50) NOT NULL,  -- 'daily', 'monthly', 'manual'

  -- Sync period
  from_date TIMESTAMPTZ NOT NULL,
  to_date TIMESTAMPTZ NOT NULL,

  -- Results
  records_synced INT DEFAULT 0,
  cost_difference DECIMAL(10, 4),  -- Difference between estimated and actual
  discrepancies JSONB,  -- Details of any mismatches

  -- Status
  status VARCHAR(20) NOT NULL,  -- 'pending', 'success', 'failed'
  error_message TEXT,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  INDEX idx_sync_service_date (service, from_date)
);
```

---

### 3. Real-Time Cost Tracking Flow

#### During a Call (Voice Pipeline)

```javascript
// voice-pipeline-nodejs/index.js

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
      unitCost: PRICING[service][operation],  // From config
      totalCost: usage.amount * PRICING[service][operation],
      metadata,
      timestamp: new Date().toISOString()
    };

    // Send to cost-tracker service
    await fetch(`${env.API_GATEWAY_URL}/api/costs/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(costEvent)
    });
  }

  async generateResponse() {
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
      completion_tokens: response.usage.completion_tokens
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
      model: 'nova-3',
      encoding: 'mulaw'
    });

    // ... existing cleanup
  }
}
```

#### In Payment Processor

```typescript
// src/payment-processor/index.ts

async recordPayment(chargeId: string, amount: number, userId: string) {
  const stripeFee = (amount * 0.034) + 0.30;

  await this.costTracker.recordApiCall({
    callId: null,  // Not tied to specific call
    userId,
    service: 'stripe',
    operation: 'payment_processing',
    usage: 1,
    usageUnit: 'transaction',
    estimatedCost: stripeFee,
    metadata: {
      charge_id: chargeId,
      charge_amount: amount,
      fee_percentage: 3.4,
      fee_fixed: 0.30
    }
  });
}
```

---

### 4. External API Integration

#### Cost Tracker Service - External Sync Functions

```typescript
// src/cost-tracker/external-sync.ts

class ExternalUsageSync {
  async syncTwilioUsage(fromDate: Date, toDate: Date) {
    const client = require('twilio')(
      this.env.TWILIO_ACCOUNT_SID,
      this.env.TWILIO_AUTH_TOKEN
    );

    // Fetch usage records from Twilio
    const records = await client.usage.records.list({
      category: 'calls-outbound',
      startDate: fromDate,
      endDate: toDate
    });

    // Compare with our estimates
    for (const record of records) {
      const ourEstimate = await this.getEstimatedCost('twilio', record.date);
      const actualCost = parseFloat(record.price);
      const difference = actualCost - ourEstimate;

      if (Math.abs(difference) > 0.01) {
        // Log discrepancy
        await this.logDiscrepancy('twilio', record.date, {
          estimated: ourEstimate,
          actual: actualCost,
          difference
        });
      }

      // Update records as verified
      await this.markAsVerified('twilio', record.date, actualCost);
    }
  }

  async syncDeepgramUsage(fromDate: Date, toDate: Date) {
    // Deepgram Usage API
    const response = await fetch('https://api.deepgram.com/v1/usage', {
      headers: {
        'Authorization': `Token ${this.env.DEEPGRAM_API_KEY}`
      },
      params: {
        start: fromDate.toISOString(),
        end: toDate.toISOString()
      }
    });

    const data = await response.json();

    // Process and reconcile
    // ... similar to Twilio
  }

  async syncCerebrasUsage(fromDate: Date, toDate: Date) {
    // Cerebras Usage API
    const response = await fetch('https://api.cerebras.ai/v1/usage', {
      headers: {
        'Authorization': `Bearer ${this.env.CEREBRAS_API_KEY}`
      },
      params: {
        start_time: fromDate.toISOString(),
        end_time: toDate.toISOString()
      }
    });

    // ... reconcile
  }

  async syncElevenLabsUsage(fromDate: Date, toDate: Date) {
    // ElevenLabs Usage API
    const response = await fetch('https://api.elevenlabs.io/v1/usage', {
      headers: {
        'xi-api-key': this.env.ELEVENLABS_API_KEY
      },
      params: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    });

    // ... reconcile
  }

  async checkQuotaLimits() {
    // Check Deepgram character quota
    const deepgramUsage = await fetch('https://api.deepgram.com/v1/usage/balance', {
      headers: { 'Authorization': `Token ${this.env.DEEPGRAM_API_KEY}` }
    });

    // Check ElevenLabs character quota
    const elevenLabsUsage = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': this.env.ELEVENLABS_API_KEY }
    });

    // Update usage_quotas table and send alerts if needed
  }
}
```

---

### 5. Cost Analytics & Reporting

#### API Endpoints

```typescript
// src/cost-tracker/index.ts

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

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlySpending = await this.db.query(`
    SELECT SUM(total_cost) as total
    FROM api_call_events
    WHERE user_id = $1 AND created_at >= $2
  `, [userId, monthStart]);

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
    },
    month: {
      spent: monthlySpending.rows[0].total || 0,
      limit: budget.rows[0]?.monthly_limit,
      remaining: (budget.rows[0]?.monthly_limit || 0) - (monthlySpending.rows[0].total || 0)
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
      SUM(stripe_cost) as stripe,
      SUM(total_cost) as total,
      SUM(call_count) as total_calls,
      SUM(total_duration_seconds) as total_minutes
    FROM cost_summaries
    WHERE summary_type = 'platform_day'
      AND period_start >= $1
      AND period_end <= $2
  `, [fromDate, toDate]);

  return summary.rows[0];
}

// GET /api/costs/alerts
async getActiveAlerts() {
  const quotas = await this.db.query(`
    SELECT * FROM usage_quotas
    WHERE (current_cost / max_cost) >= warning_threshold
      AND period_end > NOW()
    ORDER BY (current_cost / max_cost) DESC
  `);

  return quotas.rows.map(q => ({
    service: q.service,
    type: q.quota_type,
    usage_percent: (q.current_cost / q.max_cost) * 100,
    level: (q.current_cost / q.max_cost) >= q.critical_threshold ? 'critical' : 'warning',
    current: q.current_cost,
    limit: q.max_cost,
    period_end: q.period_end
  }));
}
```

---

### 6. Scheduled Jobs

#### Daily Sync Job

```typescript
// Runs daily at 2 AM UTC
async dailySyncJob() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sync all services
  await this.syncTwilioUsage(yesterday, today);
  await this.syncDeepgramUsage(yesterday, today);
  await this.syncCerebrasUsage(yesterday, today);
  await this.syncElevenLabsUsage(yesterday, today);

  // Generate platform summaries
  await this.generatePlatformSummary(yesterday, today);

  // Check quotas and send alerts
  await this.checkQuotaLimits();
}

#### Real-Time Budget Checks

```typescript
// Called before initiating a call
async canUserMakeCall(userId: string): Promise<boolean> {
  const spending = await this.getUserCurrentSpending(userId);
  const estimatedCallCost = 0.90;  // Average 5-min call cost

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
```

---

### 7. Alert System

#### Alert Triggers

```typescript
interface Alert {
  type: 'quota_warning' | 'quota_critical' | 'budget_exceeded' | 'cost_discrepancy';
  service?: string;
  userId?: string;
  message: string;
  data: any;
}

async sendAlert(alert: Alert) {
  // Log to database
  await this.db.query(`
    INSERT INTO cost_alerts (type, service, user_id, message, data)
    VALUES ($1, $2, $3, $4, $5)
  `, [alert.type, alert.service, alert.userId, alert.message, alert.data]);

  // Send email to admins
  if (alert.type === 'quota_critical') {
    await this.sendEmail({
      to: 'admin@callmeback.ai',
      subject: `🚨 CRITICAL: ${alert.service} quota at ${alert.data.usage_percent}%`,
      body: alert.message
    });
  }

  // Notify user if budget exceeded
  if (alert.type === 'budget_exceeded') {
    await this.sendEmail({
      to: alert.data.user_email,
      subject: 'Call Me Back - Budget Limit Reached',
      body: `You've reached your ${alert.data.period} spending limit of $${alert.data.limit}.`
    });
  }
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- ✅ Create database migrations for new tables
- ✅ Build cost-tracker service skeleton
- ✅ Implement basic cost recording in voice pipeline
- ✅ Create API endpoints for cost queries
- ✅ Test with manual cost recording

### Phase 2: Real-Time Tracking (Week 2)
- ✅ Instrument voice pipeline with all cost tracking calls
- ✅ Add cost tracking to payment-processor
- ✅ Implement budget checking before call initiation
- ✅ Build cost summary aggregation jobs
- ✅ Test end-to-end cost tracking

### Phase 3: External API Sync (Week 3)
- ✅ Integrate Twilio Usage API
- ✅ Integrate Deepgram Usage API
- ✅ Integrate Cerebras Usage API
- ✅ Integrate ElevenLabs Usage API
- ✅ Build reconciliation logic
- ✅ Schedule daily sync jobs

### Phase 4: Analytics & Alerts (Week 4)
- ✅ Build cost analytics dashboard endpoints
- ✅ Implement quota monitoring
- ✅ Create alert system
- ✅ Add frontend cost display
- ✅ Test alert thresholds

---

## Success Metrics

### Accuracy
- Cost estimates within 2% of actual billed amounts
- 100% of API calls tracked
- Daily reconciliation with < 1% discrepancy

### Performance
- Cost recording adds < 50ms latency to API calls
- Real-time budget checks complete in < 100ms
- Analytics queries return in < 500ms

### Observability
- Real-time visibility into current spending
- Per-call cost breakdown available immediately after call
- Alerts sent within 5 minutes of threshold breach

---

## Future Enhancements

1. **Predictive Budgeting** - ML model to predict monthly costs based on usage trends
2. **Cost Optimization Recommendations** - Suggest cheaper alternatives (e.g., batch processing)
3. **User Cost Transparency** - Show users their per-call costs in UI
4. **Automated Cost Optimization** - Switch to cheaper models/services when quality allows
5. **Anomaly Detection** - Alert on unusual cost spikes

---

## Summary

This comprehensive cost observability system will provide:
- ✅ **Micro-level tracking**: Every API call recorded with cost
- ✅ **Macro-level analytics**: Platform-wide spending summaries
- ✅ **Real-time monitoring**: Budget checks before operations
- ✅ **External verification**: Daily sync with service provider usage APIs
- ✅ **Proactive alerts**: Warnings before limits are hit
- ✅ **Profitability insights**: Revenue vs cost analysis per user/call

**Next Step:** Begin Phase 1 implementation with database schema creation.
