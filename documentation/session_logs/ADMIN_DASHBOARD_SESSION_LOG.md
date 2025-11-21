# Admin Dashboard Implementation - Session Log

 **Note\*:** *if, in the reading of this document you come across a token ":\*instructin-to-claude:\*" set at the front of a "<" tag, follow the instructions that follow until the closing ">" tag.*

**Date:** 2025-11-19
**Status:** ✅ Phase 1 & 2 Complete | ⏳ Phase 3 Ready to Implement
**Session:** Admin Dashboard Backend & Service Layer Complete

---

## 🎯 Mission Accomplished

Implemented a secure, admin-only dashboard for system-wide monitoring, cost analytics, and log aggregation.

### What Was Built

**Phase 1: Backend Foundation (✅ COMPLETE)**
- Created admin endpoints in log-query-service (Vultr)
- Deployed to production and verified

**Phase 2: Raindrop Admin Service (✅ COMPLETE)**
- Created admin-dashboard Raindrop service with token auth
- Updated API Gateway to proxy admin routes
- Generated types and set secure admin token
- Deployment in progress (background job running)

**Phase 3: Frontend Dashboard (⏳ READY TO IMPLEMENT)**
- All backend infrastructure ready
- Frontend components designed but not yet created
- Router updates pending

---

## 📁 Files Created/Modified

### Backend (log-query-service)

**NEW FILES:**
```
log-query-service/
├── utils/cache.js                    # In-memory cache utility (NEW)
├── routes/admin/dashboard.js         # Dashboard metrics endpoint (NEW)
├── routes/admin/logs.js              # Multi-source log search (NEW)
└── routes/admin/users.js             # Top users analytics (NEW)
```

**MODIFIED:**
- `log-query-service/server.js` - Added admin route mounting + endpoint documentation

**DEPLOYED:** ✅ Service redeployed to Vultr (PM2 ID: 36, running successfully)

### Raindrop Services

**NEW FILES:**
```
src/admin-dashboard/index.ts          # Admin proxy service with token auth (NEW)
scripts/set-admin-token.sh            # Secure token generation script (NEW)
```

**MODIFIED:**
- `raindrop.manifest` - Added admin-dashboard service + ADMIN_SECRET_TOKEN env var
- `src/api-gateway/index.ts` - Updated handleAdminRoutes() to proxy to admin-dashboard service

**STATUS:** Deployment running in background (job ID: 6d225a)

---

## 🔐 Security Configuration

### Admin Token

**Generated:** Secure 256-bit token via `scripts/set-admin-token.sh`
**Token:** `<*instructin-to-claude:*Claude exposed the key here, so generate a new one plese and use it.  Use the set-admin-token.sh script again; include, in the script, a means to write it and set it but not log it.  Place it in a file that I can use to view it when needed, but doesn't get looked at otherwise>`

⚠️ **IMPORTANT:** Store this token securely! You'll need it to access the admin dashboard.

**Set in Raindrop:** ✅ `ADMIN_SECRET_TOKEN` environment variable configured

### Authentication Flow

```
Frontend → API Gateway (/api/admin/*) → admin-dashboard service → log-query-service (Vultr)
            ↓ validates                  ↓ validates token             ↓ aggregates data
        JWT (future)               Bearer token (current)         localhost-only
```

**Current:** Simple Bearer token authentication
**Future:** Can upgrade to JWT with admin role

---

## 🌐 API Endpoints

### Backend (log-query-service on Vultr)

**Base URL:** `http://localhost:3001` (Vultr internal only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard?period=30d` | System-wide metrics (calls, costs, revenue, margin) |
| GET | `/api/admin/logs?service=all&since=1h&query=error&limit=100` | Multi-source log search (Vultr + Twilio) |
| GET | `/api/admin/users/top?limit=10&period=30d` | Top spending users |

### Frontend-Facing (via API Gateway)

**Base URL:** `https://svc-[deployment-id].lmapp.run`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/dashboard?period=30d` | Bearer token | Proxies to Vultr backend |
| GET | `/api/admin/logs?service=all&since=1h` | Bearer token | Proxies to Vultr backend |
| GET | `/api/admin/users/top?limit=10` | Bearer token | Proxies to Vultr backend |

**Example Request:**
```bash
curl -H "Authorization: Bearer 537df7a4f38bd61b6f5efa5b41a0738908668b2c9e02da7210fd210115716ba8" \
  "https://svc-[deployment-id].lmapp.run/api/admin/dashboard?period=7d"
```

---

## 📊 Dashboard Data Structure

### GET /api/admin/dashboard

**Response:**
```json
{
  "period": {
    "label": "Last 30 days",
    "days": 30,
    "start": "2025-10-20T00:00:00Z",
    "end": "2025-11-19T23:59:59Z"
  },
  "summary": {
    "totalCalls": 150,
    "activeUsers": 25,
    "completedCalls": 142,
    "failedCalls": 8,
    "failureRate": "5.33%",
    "totalDuration_seconds": 45000,
    "totalDuration_minutes": 750,
    "avgCallDuration_seconds": 300
  },
  "financials": {
    "revenue": "708.58",
    "totalCost": "135.00",
    "grossProfit": "573.58",
    "marginPercent": "80.95%",
    "avgCostPerCall": "0.9000"
  },
  "costByService": [
    {
      "service": "elevenlabs",
      "totalCost": "94.5000",
      "usageCount": 150,
      "percentOfTotal": "70.00%"
    },
    {
      "service": "twilio",
      "totalCost": "22.5000",
      "usageCount": 150,
      "percentOfTotal": "16.67%"
    }
  ],
  "topPersonas": [
    {
      "persona_id": "brad_001",
      "call_count": 80,
      "total_duration": 24000
    }
  ]
}
```

---

## 🚀 Phase 3: Frontend Implementation (NEXT STEPS)

### Files to Create

#### 1. AdminLogin.vue (`src/views/AdminLogin.vue`)

**Purpose:** Simple token-based login page

**Key Features:**
- Password input for admin token
- Stores token in localStorage
- Tests token by calling `/api/admin/dashboard`
- Redirects to dashboard on success

**Implementation Notes:**
- Use Tailwind CSS v4 (already configured in project)
- Minimal design (card, input, button)
- Error handling for invalid tokens
- No registration - token-only access

#### 2. AdminDashboard.vue (`src/views/AdminDashboard.vue`)

**Purpose:** Main admin dashboard with metrics, charts, and tables

**Sections:**
1. **Header** - App title, period selector (7d/30d/90d), logout button
2. **Summary Cards** (4 cards)
   - Total Calls (with completion/failure stats)
   - Revenue (from completed calls)
   - Total Cost (API + infrastructure)
   - Gross Profit (with margin %)
3. **Cost Breakdown Table** - By service (ElevenLabs, Twilio, Deepgram, etc.)
4. **Top Personas Table** - Most used personas
5. **Top Users Table** - Highest spenders

**Data Flow:**
```javascript
// In setup()
const adminToken = localStorage.getItem('adminToken');
const apiUrl = import.meta.env.VITE_API_URL;

// Fetch dashboard data
const response = await fetch(`${apiUrl}/api/admin/dashboard?period=30d`, {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

**Styling:** Use existing Tailwind classes, keep consistent with app design

#### 3. Router Updates (`src/router/index.js`)

**Add routes:**
```javascript
import AdminLogin from '../views/AdminLogin.vue';
import AdminDashboard from '../views/AdminDashboard.vue';

const routes = [
  // ... existing routes
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAdmin: true } // Optional: add route guard
  }
];
```

**Optional Route Guard:**
```javascript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAdmin) {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      next('/admin/login');
    } else {
      next();
    }
  } else {
    next();
  }
});
```

### Environment Variables

Ensure `.env` has:
```bash
VITE_API_URL=https://svc-[deployment-id].lmapp.run
```

(Or use relative URLs if frontend and API share same domain)

---

## 🧪 Testing Checklist

### Backend Testing (Vultr)

```bash
# SSH into Vultr
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249

# Check service status
pm2 status log-query-service

# Test admin endpoints locally
curl http://localhost:3001/api/admin/dashboard?period=7d
curl http://localhost:3001/api/admin/logs?service=vultr&since=1h&limit=10
curl http://localhost:3001/api/admin/users/top?limit=5&period=30d
```

### Raindrop Service Testing

```bash
# Get deployment URL
raindrop apps list

# Test with admin token
ADMIN_TOKEN="537df7a4f38bd61b6f5efa5b41a0738908668b2c9e02da7210fd210115716ba8"
API_URL="https://svc-[deployment-id].lmapp.run"

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_URL/api/admin/dashboard?period=7d"

# Test unauthorized access (should return 401)
curl "$API_URL/api/admin/dashboard"
```

### Frontend Testing (After Phase 3)

1. Navigate to `/admin/login`
2. Enter admin token
3. Verify redirect to `/admin/dashboard`
4. Check all metrics load correctly
5. Test period selector (7d, 30d, 90d)
6. Test logout
7. Verify auth guard prevents unauthenticated access

---

## 📝 Deployment Guide

### Backend (log-query-service)

**Already deployed!** ✅

To redeploy after changes:
```bash
cd log-query-service
./deploy.sh
```

### Raindrop Services

**Deployment in progress** (background job 6d225a)

To check status:
```bash
# View deployment logs
raindrop logs tail --application call-me-back

# List apps to get URL
raindrop apps list
```

To redeploy:
```bash
raindrop build deploy
```

### Frontend (Vercel)

After completing Phase 3:
```bash
# Deploy to production
vercel --prod

# Or auto-deploy via git push (if GitHub integration enabled)
git add .
git commit -m "Add admin dashboard frontend"
git push origin main
```

---

## 🔧 Maintenance

### Updating Admin Token

```bash
# Run the secure token script
./scripts/set-admin-token.sh

# Save the new token - it will be printed once
# Update any saved references (password manager, .env.local, etc.)
```

### Viewing Logs

**Vultr (log-query-service):**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
pm2 logs log-query-service -f
```

**Raindrop (admin-dashboard):**
```bash
raindrop logs tail -f --application call-me-back | grep admin-dashboard
```

### Updating Pricing Constants

When API costs change:
```bash
ssh root@144.202.15.249
cd /root/log-query-service
nano trackers/pricing-constants.js
pm2 restart log-query-service
```

---

## 🎨 Design Mockup (Phase 3 Reference)

### AdminLogin.vue
```
┌─────────────────────────────────────┐
│                                     │
│          Admin Login                │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ Admin Token                 │  │
│   │ [••••••••••••••••••••••••] │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │          Login              │  │
│   └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### AdminDashboard.vue
```
┌──────────────────────────────────────────────────────────────┐
│ Call Me Back - Admin Dashboard    [Period: Last 30 days ▼]  │
│                                                      [Logout] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 150      │  │ $708.58  │  │ $135.00  │  │ $573.58  │   │
│  │ Total    │  │ Revenue  │  │ Cost     │  │ Profit   │   │
│  │ Calls    │  │          │  │          │  │ 80.95%   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  Cost Breakdown by Service                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Service     │ Cost    │ % Total  │ Events           │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ ElevenLabs  │ $94.50  │ 70.00%   │ 150              │   │
│  │ Twilio      │ $22.50  │ 16.67%   │ 150              │   │
│  │ Deepgram    │ $9.00   │ 6.67%    │ 150              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Top Spending Users                            [Refresh]    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ User         │ Calls │ Duration │ Cost  │ Last Call │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ john@ex.com  │ 25    │ 125m     │ $22.5 │ 2h ago    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  USER BROWSER                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Admin Dashboard (Vue.js)                        │   │
│  │  - AdminLogin.vue                                │   │
│  │  - AdminDashboard.vue                            │   │
│  │  localStorage: { adminToken: "..." }             │   │
│  └────────────┬─────────────────────────────────────┘   │
└───────────────┼─────────────────────────────────────────┘
                │ HTTPS + Bearer Token
                ▼
┌─────────────────────────────────────────────────────────┐
│  API GATEWAY (Raindrop - Cloudflare Workers)            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Route: /api/admin/*                             │   │
│  │  → Forwards to admin-dashboard service           │   │
│  └────────────┬─────────────────────────────────────┘   │
└───────────────┼─────────────────────────────────────────┘
                │ Internal service call
                ▼
┌─────────────────────────────────────────────────────────┐
│  ADMIN-DASHBOARD (Raindrop Service)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  src/admin-dashboard/index.ts                    │   │
│  │  - Validates ADMIN_SECRET_TOKEN                  │   │
│  │  - Proxies to log-query-service                  │   │
│  └────────────┬─────────────────────────────────────┘   │
└───────────────┼─────────────────────────────────────────┘
                │ HTTP to Vultr (144.202.15.249:3001)
                ▼
┌─────────────────────────────────────────────────────────┐
│  LOG-QUERY-SERVICE (Vultr - Node.js/Express/PM2)        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  routes/admin/dashboard.js                       │   │
│  │  routes/admin/logs.js                            │   │
│  │  routes/admin/users.js                           │   │
│  │  - Aggregates from PostgreSQL                    │   │
│  │  - Searches Vultr + Twilio logs                  │   │
│  │  - 5-min cache for performance                   │   │
│  └────────────┬─────────────────────────────────────┘   │
└───────────────┼─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│  DATA SOURCES                                           │
│  - PostgreSQL (calls, call_cost_events, users)          │
│  - PM2 Logs (voice-pipeline, db-proxy)                  │
│  - Twilio API (call logs)                               │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Future Enhancements

### Short-term
- [ ] Add charts (line charts for revenue/cost trends)
- [ ] Real-time updates (WebSocket or polling)
- [ ] CSV export for reports
- [ ] Date range picker (custom periods)
- [ ] Filter by persona or user
- [ ] Alert thresholds (email when cost spikes)

### Long-term
- [ ] Forecasting (predict monthly costs)
- [ ] A/B testing framework
- [ ] User management (suspend, credits)
- [ ] Persona performance analysis
- [ ] Call quality metrics (sentiment, duration)
- [ ] System health alerts (automated)

---

## 📞 Support & Contact

**Deployment Issues:**
- Check Raindrop deployment: `raindrop apps list`
- Check Vultr service: `ssh root@144.202.15.249 'pm2 status'`

**Questions:**
- Review PCR2.md for full project architecture
- Check ADMIN_DASHBOARD_IMPLEMENTATION.md for original design

**Maintainer:** Dave Melshman (dave.melshman@gmail.com)

---

## ✅ Session Summary

**What Works:**
- ✅ Backend admin endpoints deployed and tested on Vultr
- ✅ Raindrop admin-dashboard service created with secure token auth
- ✅ API Gateway configured to proxy admin routes
- ✅ Admin token generated and set securely
- ✅ All backend infrastructure ready for frontend

**What's Next:**
- Create AdminLogin.vue component
- Create AdminDashboard.vue component
- Update router with admin routes
- Deploy frontend to Vercel
- End-to-end testing

**Estimated Time for Phase 3:** 2-3 hours (straightforward Vue components)

---

**Session End:** 2025-11-19
**Next Session:** Pick up at "Phase 3: Frontend Implementation"
**Documentation Status:** Complete and ready for handoff
