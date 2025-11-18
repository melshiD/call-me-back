# Dynamic Pricing Strategy - API-Based Price Discovery

**Created:** 2025-11-18
**Goal:** Fetch current pricing programmatically from service provider APIs instead of hardcoding

---

## Problem Statement

Hardcoded pricing in config files becomes stale immediately when providers change rates. We need:
1. Real-time pricing data from service APIs
2. Fallback to cached pricing if APIs are down
3. Automatic updates when pricing changes
4. Historical pricing for retroactive cost calculations

---

## Service Provider Pricing APIs

### 1. Twilio Pricing API ✅

**API Endpoint:**
```
GET https://pricing.twilio.com/v2/Voice/Countries/{CountryCode}
```

**Authentication:** Basic Auth (Account SID + Auth Token)

**Example Response:**
```json
{
  "country": "US",
  "outbound_call_prices": [
    {
      "type": "outbound-call",
      "base_price": 0.014,
      "current_price": 0.014
    }
  ]
}
```

**How to Use:**
```typescript
async function getTwilioPricing() {
  const response = await fetch(
    'https://pricing.twilio.com/v2/Voice/Countries/US',
    {
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)
      }
    }
  );
  const data = await response.json();
  return data.outbound_call_prices[0].current_price; // per minute
}
```

---

### 2. Deepgram Pricing API ⚠️

**Status:** No dedicated pricing API (as of 2025)

**Alternative Approach:**
- Pricing available via Account Dashboard API
- Can fetch account balance and rate information

**API Endpoint:**
```
GET https://api.deepgram.com/v1/projects/{project_id}/balances
```

**Workaround:**
Since Deepgram doesn't expose pricing directly via API, we have options:
1. **Web scraping** their pricing page (fragile)
2. **Manual updates** with change detection alerts
3. **Inference from usage bills** - calculate rate from usage records

**Recommended:** Manual updates with automated change detection by checking their pricing page hash

```typescript
async function checkDeepgramPricingChanged() {
  const response = await fetch('https://deepgram.com/pricing');
  const html = await response.text();
  const currentHash = hashContent(html);

  const lastKnownHash = await db.query(
    'SELECT content_hash FROM pricing_snapshots WHERE service = $1 ORDER BY created_at DESC LIMIT 1',
    ['deepgram']
  );

  if (currentHash !== lastKnownHash) {
    // Pricing page changed - alert admin to review
    await sendAlert({
      type: 'pricing_change_detected',
      service: 'deepgram',
      message: 'Deepgram pricing page has changed. Please review and update pricing table.'
    });
  }
}
```

---

### 3. Cerebras Pricing API ✅

**API Endpoint:**
```
GET https://api.cerebras.ai/v1/models
```

**Response includes pricing per model:**
```json
{
  "models": [
    {
      "id": "llama3.1-8b",
      "pricing": {
        "prompt": 0.10,  // per 1M tokens
        "completion": 0.10
      }
    }
  ]
}
```

**How to Use:**
```typescript
async function getCerebrasPricing(model = 'llama3.1-8b') {
  const response = await fetch('https://api.cerebras.ai/v1/models', {
    headers: {
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`
    }
  });
  const data = await response.json();
  const modelData = data.models.find(m => m.id === model);

  // Return per-token price (convert from per-1M-tokens)
  return {
    prompt: modelData.pricing.prompt / 1_000_000,
    completion: modelData.pricing.completion / 1_000_000
  };
}
```

---

### 4. ElevenLabs Pricing API ✅

**API Endpoint:**
```
GET https://api.elevenlabs.io/v1/user/subscription
```

**Returns current subscription tier and character quota:**
```json
{
  "tier": "creator",
  "character_count": 50000,
  "character_limit": 100000,
  "can_extend_character_limit": true,
  "next_character_count_reset_unix": 1700000000
}
```

**Pricing Info:**
ElevenLabs doesn't expose per-character pricing via API, but we can infer from subscription tiers.

**Alternative:** Use their published pricing table
```typescript
const ELEVENLABS_PRICING = {
  'free': { price_per_1k_chars: 0, monthly_chars: 10000 },
  'starter': { price_per_1k_chars: 0.30, monthly_chars: 30000 },
  'creator': { price_per_1k_chars: 0.24, monthly_chars: 100000 },
  'pro': { price_per_1k_chars: 0.18, monthly_chars: 500000 },
  'scale': { price_per_1k_chars: 0.15, monthly_chars: 2000000 }
};

async function getElevenLabsPricing() {
  const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY }
  });
  const data = await response.json();

  return ELEVENLABS_PRICING[data.tier].price_per_1k_chars / 1000; // per character
}
```

---

### 5. Stripe Pricing ✅

**Fixed Rate:** 3.4% + $0.30 per successful card charge

**No API needed** - this is contractual and rarely changes, but we can store in database

---

### 6. Raindrop Pricing ⚠️

**Status:** No pricing API available

**Current:** $20/month base (check Raindrop docs for usage-based pricing)

**How to Track:**
```typescript
async function getRaindropPricing() {
  // Fixed monthly base cost amortized across calls
  const MONTHLY_BASE = 20; // USD
  const estimatedMonthlyCallsCount = 1000; // Adjust based on actual usage

  return MONTHLY_BASE / estimatedMonthlyCallsCount; // per call
}
```

---

### 7. Vultr Pricing ✅

**Status:** Vultr API available for billing data

**API Endpoint:**
```
GET https://api.vultr.com/v2/billing/history
GET https://api.vultr.com/v2/account
```

**Authentication:** Bearer token (API Key)

**Services We Use on Vultr:**
- **PostgreSQL Database** (Managed Database)
- **Compute Instance** (Voice Pipeline server - 144.202.15.249)
- **Bandwidth** (Data transfer)

**Example Response:**
```json
{
  "billing_history": [
    {
      "id": 123456,
      "date": "2025-11-01",
      "type": "invoice",
      "description": "Invoice for November 2025",
      "amount": 45.50,
      "balance": 0
    }
  ],
  "meta": {
    "total": 1
  }
}
```

**Account Info:**
```json
{
  "account": {
    "name": "Call Me Back",
    "email": "admin@callmeback.ai",
    "balance": -45.50,
    "pending_charges": 2.30,
    "last_payment_date": "2025-11-01",
    "last_payment_amount": 45.50
  }
}
```

**How to Use:**
```typescript
async function getVultrPricing() {
  // Get current month billing
  const response = await fetch('https://api.vultr.com/v2/billing/history', {
    headers: {
      'Authorization': `Bearer ${VULTR_API_KEY}`
    }
  });
  const data = await response.json();

  // Get current pending charges
  const accountResponse = await fetch('https://api.vultr.com/v2/account', {
    headers: {
      'Authorization': `Bearer ${VULTR_API_KEY}`
    }
  });
  const accountData = await accountResponse.json();

  return {
    current_month_cost: accountData.account.pending_charges,
    last_invoice: data.billing_history[0]?.amount || 0
  };
}

// Calculate per-call cost
async function getVultrPerCallCost() {
  const pricing = await getVultrPricing();

  // Get monthly call count
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const callCount = await db.query(
    'SELECT COUNT(*) FROM calls WHERE created_at >= $1',
    [thirtyDaysAgo]
  );

  const monthlyCallCount = callCount.rows[0].count || 1000;
  const monthlyVultrCost = pricing.current_month_cost +
                          (pricing.last_invoice / 30) * new Date().getDate();

  return monthlyVultrCost / monthlyCallCount; // per call
}
```

**Vultr API Documentation:**
- Billing API: https://www.vultr.com/api/#tag/billing
- Account API: https://www.vultr.com/api/#tag/account

**Cost Breakdown on Vultr:**
- Managed PostgreSQL: ~$15-25/month (depending on size)
- Compute Instance (voice pipeline): ~$6-12/month (depending on specs)
- Bandwidth: Usually included, overage charges rare
- **Total Estimated:** $25-40/month

---

## Architecture: Dynamic Pricing System

### Database Schema

#### Table: `service_pricing`

```sql
CREATE TABLE service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  pricing_type VARCHAR(50) NOT NULL,  -- 'per_minute', 'per_token', 'per_character', 'per_transaction'

  -- Pricing details
  unit_price DECIMAL(12, 8) NOT NULL,  -- Cost per unit (very precise for small amounts)
  currency VARCHAR(3) DEFAULT 'USD',

  -- Metadata
  metadata JSONB,  -- Service-specific details (e.g., model, region, tier)

  -- Versioning
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,  -- NULL if current pricing

  -- Source tracking
  source VARCHAR(50) NOT NULL,  -- 'api', 'manual', 'inferred'
  last_verified TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_pricing_service_effective (service, effective_to),
  UNIQUE(service, pricing_type, effective_from, metadata)
);
```

#### Table: `pricing_sync_log`

```sql
CREATE TABLE pricing_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  sync_method VARCHAR(50) NOT NULL,  -- 'api', 'manual', 'page_check'

  -- Results
  pricing_changed BOOLEAN DEFAULT false,
  old_price DECIMAL(12, 8),
  new_price DECIMAL(12, 8),

  -- Details
  response_data JSONB,
  error_message TEXT,

  synced_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_sync_service_time (service, synced_at)
);
```

---

## Implementation: Pricing Service

### Service: `pricing-manager`

```typescript
// src/pricing-manager/index.ts

import { Service, Env } from '@raindrop/runtime';

export default class PricingManagerService extends Service<Env> {

  /**
   * Get current price for a service operation
   * Returns cached price if available, fetches from API if stale
   */
  async getCurrentPrice(
    service: string,
    pricingType: string,
    metadata?: object
  ): Promise<number> {
    // Check cache first
    const cached = await this.getCachedPrice(service, pricingType, metadata);

    if (cached && this.isCacheValid(cached)) {
      return cached.unit_price;
    }

    // Fetch fresh pricing
    try {
      const freshPrice = await this.fetchPricingFromAPI(service, pricingType, metadata);

      // Cache the new price
      await this.cachePricing(service, pricingType, freshPrice, metadata);

      return freshPrice;
    } catch (error) {
      console.error(`Failed to fetch pricing for ${service}:`, error);

      // Fallback to cached price even if stale
      if (cached) {
        console.warn(`Using stale cached price for ${service}`);
        return cached.unit_price;
      }

      throw new Error(`No pricing available for ${service}`);
    }
  }

  /**
   * Fetch pricing from service provider API
   */
  async fetchPricingFromAPI(
    service: string,
    pricingType: string,
    metadata?: object
  ): Promise<number> {
    switch (service) {
      case 'twilio':
        return await this.fetchTwilioPricing();

      case 'cerebras':
        return await this.fetchCerebrasPricing(metadata?.model || 'llama3.1-8b');

      case 'elevenlabs':
        return await this.fetchElevenLabsPricing();

      case 'deepgram':
        // No API - use cached manual pricing
        throw new Error('Deepgram pricing must be updated manually');

      case 'stripe':
        // Fixed rate
        return pricingType === 'percentage' ? 0.034 : 0.30;

      case 'raindrop':
        return await this.calculateRaindropPerCallCost();

      case 'vultr':
        return await this.calculateVultrPerCallCost();

      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }

  /**
   * Vultr Billing API
   */
  async fetchVultrPricing(): Promise<number> {
    // Get account billing info
    const accountResponse = await fetch('https://api.vultr.com/v2/account', {
      headers: { 'Authorization': `Bearer ${this.env.VULTR_API_KEY}` }
    });

    const accountData = await accountResponse.json();

    // Get billing history for last invoice
    const historyResponse = await fetch('https://api.vultr.com/v2/billing/history?per_page=1', {
      headers: { 'Authorization': `Bearer ${this.env.VULTR_API_KEY}` }
    });

    const historyData = await historyResponse.json();

    // Log the fetch
    await this.logPricingSync('vultr', 'api', {
      account: accountData.account,
      last_invoice: historyData.billing_history?.[0]
    });

    return {
      pending_charges: accountData.account.pending_charges,
      last_invoice_amount: historyData.billing_history?.[0]?.amount || 0
    };
  }

  /**
   * Calculate Vultr per-call cost based on actual usage
   */
  async calculateVultrPerCallCost(): Promise<number> {
    const pricingData = await this.fetchVultrPricing();

    // Get monthly call count from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.DATABASE_PROXY.executeQuery({
      sql: 'SELECT COUNT(*) as call_count FROM calls WHERE created_at >= $1',
      params: [thirtyDaysAgo.toISOString()]
    });

    const monthlyCallCount = result.rows[0].call_count || 1000; // Fallback

    // Estimate current month cost from pending charges + prorated last invoice
    const daysIntoMonth = new Date().getDate();
    const proratedLastInvoice = (pricingData.last_invoice_amount / 30) * daysIntoMonth;
    const estimatedMonthlyCost = pricingData.pending_charges + proratedLastInvoice;

    return estimatedMonthlyCost / monthlyCallCount;
  }

  /**
   * Twilio Pricing API
   */
  async fetchTwilioPricing(): Promise<number> {
    const url = 'https://pricing.twilio.com/v2/Voice/Countries/US';
    const auth = btoa(`${this.env.TWILIO_ACCOUNT_SID}:${this.env.TWILIO_AUTH_TOKEN}`);

    const response = await fetch(url, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    const data = await response.json();

    // Log the fetch
    await this.logPricingSync('twilio', 'api', data);

    return data.outbound_call_prices[0].current_price; // per minute
  }

  /**
   * Cerebras Pricing API
   */
  async fetchCerebrasPricing(model: string): Promise<number> {
    const response = await fetch('https://api.cerebras.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${this.env.CEREBRAS_API_KEY}` }
    });

    const data = await response.json();
    const modelData = data.models.find(m => m.id === model);

    if (!modelData) {
      throw new Error(`Model ${model} not found in Cerebras pricing`);
    }

    // Log the fetch
    await this.logPricingSync('cerebras', 'api', modelData);

    // Average of prompt and completion pricing per token
    const avgPricePerMillionTokens = (modelData.pricing.prompt + modelData.pricing.completion) / 2;
    return avgPricePerMillionTokens / 1_000_000;
  }

  /**
   * ElevenLabs Pricing (inferred from subscription tier)
   */
  async fetchElevenLabsPricing(): Promise<number> {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': this.env.ELEVENLABS_API_KEY }
    });

    const data = await response.json();

    const TIER_PRICING = {
      'free': 0,
      'starter': 0.30 / 1000,
      'creator': 0.24 / 1000,
      'pro': 0.18 / 1000,
      'scale': 0.15 / 1000
    };

    // Log the fetch
    await this.logPricingSync('elevenlabs', 'api', data);

    return TIER_PRICING[data.tier] || TIER_PRICING['creator'];
  }

  /**
   * Calculate Raindrop per-call cost based on usage
   */
  async calculateRaindropPerCallCost(): Promise<number> {
    const MONTHLY_BASE = 20; // USD

    // Get actual monthly call count from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.DATABASE_PROXY.executeQuery({
      sql: 'SELECT COUNT(*) as call_count FROM calls WHERE created_at >= $1',
      params: [thirtyDaysAgo.toISOString()]
    });

    const monthlyCallCount = result.rows[0].call_count || 1000; // Fallback

    return MONTHLY_BASE / monthlyCallCount;
  }

  /**
   * Cache pricing in database
   */
  async cachePricing(
    service: string,
    pricingType: string,
    price: number,
    metadata?: object
  ): Promise<void> {
    // Expire old pricing
    await this.DATABASE_PROXY.executeQuery({
      sql: `
        UPDATE service_pricing
        SET effective_to = NOW()
        WHERE service = $1
          AND pricing_type = $2
          AND effective_to IS NULL
          AND metadata = $3
      `,
      params: [service, pricingType, JSON.stringify(metadata || {})]
    });

    // Insert new pricing
    await this.DATABASE_PROXY.executeQuery({
      sql: `
        INSERT INTO service_pricing
          (service, pricing_type, unit_price, metadata, effective_from, source, last_verified)
        VALUES ($1, $2, $3, $4, NOW(), 'api', NOW())
      `,
      params: [service, pricingType, price, JSON.stringify(metadata || {})]
    });
  }

  /**
   * Get cached pricing
   */
  async getCachedPrice(
    service: string,
    pricingType: string,
    metadata?: object
  ): Promise<any> {
    const result = await this.DATABASE_PROXY.executeQuery({
      sql: `
        SELECT * FROM service_pricing
        WHERE service = $1
          AND pricing_type = $2
          AND metadata = $3
          AND effective_to IS NULL
        ORDER BY effective_from DESC
        LIMIT 1
      `,
      params: [service, pricingType, JSON.stringify(metadata || {})]
    });

    return result.rows[0];
  }

  /**
   * Check if cached price is still valid (< 24 hours old)
   */
  isCacheValid(cachedPrice: any): boolean {
    const lastVerified = new Date(cachedPrice.last_verified);
    const hoursSinceVerified = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60);

    return hoursSinceVerified < 24;
  }

  /**
   * Log pricing sync attempt
   */
  async logPricingSync(
    service: string,
    method: string,
    data: any
  ): Promise<void> {
    await this.DATABASE_PROXY.executeQuery({
      sql: `
        INSERT INTO pricing_sync_log
          (service, sync_method, response_data)
        VALUES ($1, $2, $3)
      `,
      params: [service, method, JSON.stringify(data)]
    });
  }

  /**
   * Scheduled job: Refresh all pricing daily
   */
  async refreshAllPricing(): Promise<void> {
    const services = ['twilio', 'cerebras', 'elevenlabs'];

    for (const service of services) {
      try {
        await this.getCurrentPrice(service, this.getDefaultPricingType(service));
        console.log(`✅ Refreshed pricing for ${service}`);
      } catch (error) {
        console.error(`❌ Failed to refresh pricing for ${service}:`, error);
      }
    }
  }

  getDefaultPricingType(service: string): string {
    const types = {
      'twilio': 'per_minute',
      'deepgram': 'per_minute',
      'cerebras': 'per_token',
      'elevenlabs': 'per_character',
      'stripe': 'per_transaction'
    };
    return types[service];
  }
}
```

---

## Usage in Cost Tracker

```typescript
// src/cost-tracker/index.ts

async recordApiCall(params: {
  callId: string,
  userId: string,
  service: string,
  operation: string,
  usage: number,
  metadata?: object
}) {
  // Get current pricing dynamically
  const pricingType = this.getPricingType(params.service);
  const unitCost = await this.PRICING_MANAGER.getCurrentPrice(
    params.service,
    pricingType,
    params.metadata
  );

  const totalCost = params.usage * unitCost;

  // Record cost event
  await this.DATABASE_PROXY.executeQuery({
    sql: `
      INSERT INTO api_call_events
        (call_id, user_id, service, operation, usage_amount, usage_unit, unit_cost, total_cost, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    params: [
      params.callId,
      params.userId,
      params.service,
      params.operation,
      params.usage,
      this.getUsageUnit(params.service),
      unitCost,
      totalCost,
      JSON.stringify(params.metadata || {})
    ]
  });

  return { unitCost, totalCost };
}
```

---

## Scheduled Jobs

### Daily Pricing Refresh (Runs at 3 AM UTC)

```typescript
// raindrop.manifest

job "pricing_refresh" {
  schedule = "0 3 * * *"  // Daily at 3 AM
  service = "pricing-manager"
  function = "refreshAllPricing"
}
```

### Weekly Deepgram Pricing Check (Manual Review Alert)

```typescript
job "deepgram_pricing_check" {
  schedule = "0 4 * * 1"  // Weekly Monday at 4 AM
  service = "pricing-manager"
  function = "checkDeepgramPricingPage"
}
```

---

## Fallback Strategy

```typescript
/**
 * Multi-tier fallback for pricing
 */
async getPriceWithFallback(service: string, pricingType: string): Promise<number> {
  try {
    // Tier 1: Fresh API data
    return await this.fetchPricingFromAPI(service, pricingType);
  } catch (error) {
    console.warn(`API fetch failed for ${service}, trying cache...`);

    try {
      // Tier 2: Cached price (even if stale)
      const cached = await this.getCachedPrice(service, pricingType);
      if (cached) {
        console.warn(`Using cached price for ${service} (${cached.last_verified})`);
        return cached.unit_price;
      }
    } catch (cacheError) {
      console.error(`Cache lookup failed for ${service}`);
    }

    // Tier 3: Hardcoded emergency fallback
    console.error(`All pricing sources failed for ${service}, using emergency fallback`);
    return this.getEmergencyFallbackPrice(service, pricingType);
  }
}

getEmergencyFallbackPrice(service: string, pricingType: string): number {
  const EMERGENCY_PRICING = {
    'twilio': 0.014,      // per minute
    'deepgram': 0.0059,   // per minute
    'cerebras': 0.0000001, // per token ($0.10/1M)
    'elevenlabs': 0.00015, // per character ($0.15/1K)
    'stripe': 0.034       // percentage
  };

  return EMERGENCY_PRICING[service] || 0;
}
```

---

## Summary

### Services with Pricing APIs ✅
- **Twilio** - Full pricing API
- **Cerebras** - Models API with pricing
- **ElevenLabs** - Subscription API (tier-based inference)
- **Vultr** - Billing & account API (monthly cost / call count)

### Services Requiring Manual Updates ⚠️
- **Deepgram** - No pricing API (automated change detection via page hash)
- **Raindrop** - Calculate from base cost / usage

### Services with Fixed Pricing 📌
- **Stripe** - 3.4% + $0.30 (contractual)

### Architecture Benefits
1. ✅ Always uses current pricing (within 24hr cache)
2. ✅ Automatic updates when providers change rates
3. ✅ Fallback to cached/hardcoded if APIs fail
4. ✅ Historical pricing for retroactive calculations
5. ✅ Alerts when manual review needed (Deepgram)

**Next:** Implement pricing-manager service and integrate with cost-tracker
