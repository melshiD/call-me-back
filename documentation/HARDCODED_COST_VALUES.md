# Hardcoded Cost Values - Audit

**Date:** 2025-01-08
**Purpose:** Track all locations where API cost values are hardcoded

---

## 🚨 Why This Matters

These hardcoded values need to match the actual API pricing from:
- Twilio
- ElevenLabs
- Cerebras
- OpenAI
- Deepgram
- Stripe

**When pricing changes, all these locations must be updated.**

---

## 📍 Backend Cost Values

### 1. **Cost Tracker Service** (`src/shared/cost-tracker.ts`)

#### Line 72-73: ElevenLabs TTS Cost
```typescript
const costPerChar = 0.30 / 1000; // $0.30 per 1K characters
```
**Source:** ElevenLabs pricing
**Current Value:** $0.30 per 1,000 characters

---

#### Line 119: Cerebras AI Cost
```typescript
costCents = (totalTokens / 1_000_000) * 10; // $0.10 per 1M tokens
```
**Source:** Cerebras llama3.1-8b pricing
**Current Value:** $0.10 per 1M tokens (combined input + output)

---

#### Line 146-147: OpenAI Fallback Cost
```typescript
const inputCost = (inputTokens / 1_000_000) * 1000;   // $10/1M input tokens
const outputCost = (outputTokens / 1_000_000) * 3000; // $30/1M output tokens
```
**Source:** OpenAI gpt-4-turbo-preview pricing
**Current Values:**
- Input: $10.00 per 1M tokens
- Output: $30.00 per 1M tokens

---

#### Line 187: Deepgram STT Cost
```typescript
const costPerMinute = 0.43 / 100; // $0.43 per 100 minutes = $0.0043/min
```
**Source:** Deepgram Nova-2 pricing
**Current Value:** $0.0043 per minute

---

#### Line 225: Twilio Call Duration Cost
```typescript
const costCents = minutes * 40; // $0.40 per minute
```
**Source:** Twilio voice pricing
**Current Value:** $0.40 per minute

---

#### Line 59: Twilio Connection Fee
```typescript
[id, this.callId, this.userId, 25] // 25 cents connection fee
```
**Source:** Twilio voice pricing
**Current Value:** $0.25 per call initiation

---

#### Line 347: Stripe Payment Processing Fee
```typescript
const stripeFee = (subtotal_cents * 0.029) + 30; // 2.9% + $0.30
```
**Source:** Stripe standard pricing
**Current Values:**
- Percentage: 2.9%
- Fixed fee: $0.30 per transaction

---

### 2. **Cost Estimation Function** (`src/shared/cost-tracker.ts:415-495`)

#### Line 433-434: Conversation Assumptions
```typescript
const avgTurnsPerMinute = 4; // ~15 seconds per conversational turn
const avgCharsPerResponse = 50;
const avgOutputTokens = 100;
```
**Source:** Estimated based on typical conversation patterns
**Purpose:** Used for pre-call cost projections

#### Line 443: TTS Cost Calculation
```typescript
const ttsCost = (totalTTSChars / 1000) * 0.30;
```
**Current Value:** $0.30 per 1K characters (ElevenLabs)

#### Line 449: AI Inference Cost
```typescript
const aiCost = (totalTokens / 1_000_000) * 0.10;
```
**Current Value:** $0.10 per 1M tokens (Cerebras)

#### Line 452: STT Cost
```typescript
const sttCost = estimatedDurationMinutes * (0.43 / 100);
```
**Current Value:** $0.0043 per minute (Deepgram)

#### Line 455: Twilio Cost
```typescript
const twilioCost = 0.25 + (estimatedDurationMinutes * 0.40);
```
**Current Values:**
- Connection: $0.25
- Per minute: $0.40

#### Line 459: Stripe Fee
```typescript
const stripeFee = (subtotal * 0.029) + 0.30;
```
**Current Values:** 2.9% + $0.30

---

## 📍 Frontend Cost Values

### 3. **Schedule View** (`src/views/Schedule.vue`)

#### Line 259: Default Call Cost
```typescript
cost: 2.25
```
**Calculation:** $0.25 connection + (5 min * $0.40) = $2.25
**Purpose:** Default 5-minute call estimate

---

#### Line 307-311: Cost Calculation (Quick Call)
```typescript
const baseCost = 0.25 + (duration * 0.40)
const scenarioTokens = quickCall.value.scenario ? estimateTokens(quickCall.value.scenario) : 0
const scenarioCost = (scenarioTokens / 1000000) * 0.10 * (duration * 4)
quickCall.value.cost = baseCost + scenarioCost
```
**Hardcoded Values:**
- Twilio connection: $0.25
- Twilio per minute: $0.40
- Cerebras token cost: $0.10 per 1M tokens
- Turns per minute: 4 (multiplied by duration)

---

#### Line 314-320: Cost Recalculation (Scenario Change)
```typescript
const baseCost = 0.25 + (duration * 0.40)
const scenarioTokens = quickCall.value.scenario ? estimateTokens(quickCall.value.scenario) : 0
const scenarioCost = (scenarioTokens / 1000000) * 0.10 * (duration * 4)
quickCall.value.cost = baseCost + scenarioCost
```
**Same hardcoded values as above**

---

#### Line 110: Cost Display String
```html
<small>(Connection fee: $0.25 + $0.40/min{{ quickCall.scenario ? ' + scenario context' : '' }})</small>
```
**Hardcoded display values:**
- Connection fee: $0.25
- Per minute: $0.40

---

## 🔧 Recommendation: Create Cost Configuration

Instead of hardcoding, create a centralized cost configuration:

### Backend: `src/shared/cost-config.ts`

```typescript
export const COST_CONFIG = {
  twilio: {
    connectionFee: 0.25,      // $0.25 per call
    perMinute: 0.40,          // $0.40 per minute
  },
  elevenlabs: {
    perThousandChars: 0.30,   // $0.30 per 1K characters
  },
  cerebras: {
    perMillionTokens: 0.10,   // $0.10 per 1M tokens (combined)
  },
  openai: {
    perMillionInputTokens: 10.00,   // $10 per 1M input tokens
    perMillionOutputTokens: 30.00,  // $30 per 1M output tokens
  },
  deepgram: {
    perMinute: 0.0043,        // $0.0043 per minute
  },
  stripe: {
    percentageFee: 0.029,     // 2.9%
    fixedFee: 0.30,           // $0.30 per transaction
  },
  assumptions: {
    turnsPerMinute: 4,        // Average conversational turns
    charsPerResponse: 50,     // Average TTS characters
    outputTokensPerTurn: 100, // Average AI response tokens
  }
}
```

### Frontend: Use Environment Variables or API Endpoint

**Option 1:** Environment variables
```javascript
// vite.config.js or .env
VITE_TWILIO_CONNECTION_FEE=0.25
VITE_TWILIO_PER_MINUTE=0.40
```

**Option 2:** API endpoint
```typescript
// GET /api/cost-config
{
  twilio: { connectionFee: 0.25, perMinute: 0.40 },
  ...
}
```

---

## ⚠️ Priority Updates Needed

If any API pricing changes, update **ALL** the following files:

1. **Backend:**
   - `src/shared/cost-tracker.ts` (7 locations)
   - `src/shared/cost-config.ts` (create this file)

2. **Frontend:**
   - `src/views/Schedule.vue` (4 locations)
   - Consider fetching from API instead of hardcoding

3. **Documentation:**
   - `.env.example` (if using env vars)
   - User-facing cost documentation

---

## 📊 Current Total Hardcoded Locations

- **Backend:** 11 locations
- **Frontend:** 5 locations
- **Total:** 16 locations that must stay in sync

---

## ✅ Next Steps

1. **Create `src/shared/cost-config.ts`** with centralized config
2. **Replace all hardcoded values** with imports from cost-config
3. **Add environment variable** support for cost values
4. **Create admin API endpoint** to update costs without redeployment (advanced)
5. **Add cost config validation** on startup to ensure all values are set

---

**Last Updated:** 2025-01-08
**Audit Status:** Complete
