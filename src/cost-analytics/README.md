# Cost Analytics Service

**Version:** 1.0.0
**Created:** 2025-11-19
**Purpose:** User-facing cost tracking, budgets, and spending analytics for Call Me Back

---

## Overview

The `cost-analytics` service provides **secure, user-facing APIs** for cost tracking and spending analytics. It sits between the frontend and the internal `log-query-service`, enforcing authentication and user-level data access controls.

### Key Features

- ✅ **JWT-based Authentication:** Validates user identity before serving cost data
- ✅ **User Data Isolation:** Users can only access their own cost data
- ✅ **Budget Tracking:** Monitor spending against daily/monthly limits
- ✅ **Spending Summaries:** Aggregate costs across time periods
- ✅ **Call-Level Breakdown:** Detailed cost breakdown per call
- ✅ **Secure Architecture:** Never exposes internal log service to public

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (Vercel)                                        │
│  - User dashboard                                         │
│  - Cost visualizations                                    │
└────────────────┬─────────────────────────────────────────┘
                 │ HTTPS + JWT
                 ▼
┌──────────────────────────────────────────────────────────┐
│  API Gateway (Raindrop - PUBLIC)                          │
│  - Routes: /api/costs/*                                   │
│  - JWT validation                                         │
└────────────────┬─────────────────────────────────────────┘
                 │ Internal service call
                 ▼
┌──────────────────────────────────────────────────────────┐
│  cost-analytics (Raindrop - PRIVATE) ← YOU ARE HERE       │
│  - User authorization checks                              │
│  - Business logic (budgets, summaries, forecasts)         │
│  - Aggregation & calculations                             │
└────────────────┬─────────────────────────────────────────┘
                 │ Server-to-server HTTP
                 ▼
┌──────────────────────────────────────────────────────────┐
│  log-query-service (Vultr localhost:3001 - INTERNAL)      │
│  - Raw usage data from logs                               │
│  - Cost calculations from pricing constants               │
│  - No authentication (localhost only)                     │
└────────────────┬─────────────────────────────────────────┘
                 │ PostgreSQL
                 ▼
┌──────────────────────────────────────────────────────────┐
│  Database (Vultr PostgreSQL)                              │
│  - call_cost_events                                       │
│  - calls                                                  │
│  - user_budget_settings                                   │
└──────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

### GET /api/costs/call/:callId

Get detailed cost breakdown for a specific call.

**Authorization:** User must own the call (verified via database)

**Response:**
```json
{
  "success": true,
  "data": {
    "callId": "uuid",
    "userId": "uuid",
    "personaId": "brad_001",
    "duration_seconds": 300,
    "apiCosts": {
      "twilio": [...],
      "deepgram": [...],
      "cerebras": [...],
      "elevenlabs": [...]
    },
    "infrastructureCosts": {
      "raindrop": { "costPerCall": 0.02 },
      "vultr": { "costPerCall": 0.01 },
      "vercel": { "costPerCall": 0.005 }
    },
    "transactionCosts": {
      "stripe": { "totalFee": 0.475 }
    },
    "totalCost": 0.90,
    "chargedToUser": 4.99,
    "grossProfit": 4.09,
    "grossMarginPercent": "82.47%"
  }
}
```

---

### GET /api/costs/user/:userId/spending

Get user spending summary for a time period.

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d` (default: `30d`)

**Authorization:** User can only access their own spending data

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "period": {
      "start": "2025-10-20T00:00:00Z",
      "end": "2025-11-19T23:59:59Z",
      "label": "Last 30 days"
    },
    "totalCalls": 12,
    "totalDuration_seconds": 3600,
    "totalCost": 10.80,
    "totalCharged": 59.88,
    "totalGrossProfit": 49.08,
    "averageMarginPercent": "82.00%",
    "costByService": {
      "twilio": 1.73,
      "deepgram": 0.76,
      "cerebras": 0.11,
      "elevenlabs": 7.56,
      "raindrop": 0.43,
      "vultr": 0.11,
      "vercel": 0.05,
      "stripe": 5.70
    },
    "topPersonas": [
      { "personaId": "brad_001", "calls": 8, "totalCost": 7.20 },
      { "personaId": "sarah_001", "calls": 4, "totalCost": 3.60 }
    ]
  }
}
```

---

### GET /api/costs/user/:userId/budget

Get user budget status and remaining balances.

**Authorization:** User can only access their own budget

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "dailyLimit_usd": 10.00,
    "monthlyLimit_usd": 100.00,
    "alertThreshold_percent": 80,
    "currentDailySpend": 4.99,
    "currentMonthlySpend": 59.88,
    "dailyRemaining": 5.01,
    "monthlyRemaining": 40.12,
    "alertTriggered": false
  }
}
```

---

## Security Model

### Why Separate from log-query-service?

**log-query-service** (Vultr):
- Internal ETL service (Extract logs → Transform → Load to DB)
- No user concept, just callIds
- Bound to localhost for security
- Raw usage data, no business logic

**cost-analytics** (Raindrop):
- User-facing API service
- Enforces JWT authentication
- Per-user data access controls
- Business logic (budgets, forecasts, alerts)
- Can scale independently

### Authorization Flow

```
1. User requests: GET /api/costs/call/abc-123
2. API Gateway validates JWT → extracts userId
3. cost-analytics receives request with JWT
4. cost-analytics extracts userId from JWT
5. cost-analytics queries DB: "SELECT user_id FROM calls WHERE id = 'abc-123'"
6. cost-analytics verifies: call.user_id === requestUserId
7. If match: Fetch data from log-query-service
8. If no match: Return 403 Forbidden
```

**Security guarantees:**
- User A cannot access User B's cost data
- Tampering with JWT is detected (signature validation)
- Expired JWTs are rejected
- No public access to raw log data

---

## Future Enhancements

### Phase 1 (Post-Hackathon)
- [ ] Cost forecasting (predict monthly spend based on usage trends)
- [ ] Budget alerts (email/SMS when threshold reached)
- [ ] CSV export for cost data
- [ ] Real-time WebSocket updates during active calls

### Phase 2 (Production)
- [ ] Aggregate analytics dashboard (admin view across all users)
- [ ] Cost optimization recommendations
- [ ] Dynamic pricing (fetch latest API rates daily)
- [ ] Cost anomaly detection (alert on unusual spikes)

---

## Development

### Local Testing

```bash
# This is a Raindrop service, test via framework
cd /usr/code/ai_championship/call-me-back

# Generate types
raindrop build generate

# Deploy
raindrop build deploy

# Test endpoints
curl -H "Authorization: Bearer <jwt-token>" \
  https://svc-....lmapp.run/api/costs/user/user-id/spending?period=7d
```

---

## Integration with Frontend

**Example: Fetch user spending for dashboard**

```javascript
// src/services/costs.js
import { apiClient } from './api';

export const costService = {
  async getUserSpending(userId, period = '30d') {
    const response = await apiClient.get(
      `/api/costs/user/${userId}/spending?period=${period}`
    );
    return response.data;
  },

  async getCallCost(callId) {
    const response = await apiClient.get(`/api/costs/call/${callId}`);
    return response.data;
  },

  async getUserBudget(userId) {
    const response = await apiClient.get(`/api/costs/user/${userId}/budget`);
    return response.data;
  }
};
```

**Example: Display budget alert**

```vue
<template>
  <div v-if="budget.alertTriggered" class="alert alert-warning">
    ⚠️ You've used {{ budget.currentMonthlySpend }}$ of your {{ budget.monthlyLimit_usd }}$ monthly budget
  </div>
</template>

<script>
import { costService } from '@/services/costs';

export default {
  data() {
    return {
      budget: null
    };
  },
  async mounted() {
    this.budget = await costService.getUserBudget(this.$store.state.auth.userId);
  }
};
</script>
```

---

## Documentation

- **Interfaces:** See `interfaces.ts` for complete type definitions
- **Database Schema:** See PCR2.md for table structures
- **Pricing Constants:** See `log-query-service/trackers/pricing-constants.js`
- **Architecture:** See SYSTEM_ARCHITECTURE.md

---

**Status:** ✅ Ready for development
**Next Steps:**
1. Run `raindrop build generate` to create types
2. Deploy to Raindrop
3. Test with frontend integration
4. Build cost dashboard UI
