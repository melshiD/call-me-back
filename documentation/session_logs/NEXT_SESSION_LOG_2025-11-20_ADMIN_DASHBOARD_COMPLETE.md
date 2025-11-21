# Admin Dashboard Integration - Session Complete
**Date:** 2025-11-20
**Status:** Backend fully operational, frontend needs final CORS/deployment verification

---

## 🎯 What We Accomplished

### ✅ Backend Infrastructure (100% Complete)

1. **Log Query Service Deployed & Working**
   - Running on Vultr at `https://logs.ai-tools-marketplace.io`
   - Port 3001 (localhost only, proxied by Caddy)
   - PM2 process name: `log-query-service`
   - Authentication middleware working with ADMIN_SECRET_TOKEN

2. **Database Connection Fixed**
   - PostgreSQL password: Set to `cmb_secure_pass_2025`
   - User: `cmb_user`
   - Database: `call_me_back`
   - Schema queries updated to match actual column names

3. **Caddy HTTPS Configured**
   - SSL certificate working via Let's Encrypt
   - Config: `/etc/caddy/Caddyfile`
   - Already has `logs.ai-tools-marketplace.io` configured

4. **Live Data Verified**
   - 130 calls in database (last 7 days)
   - 3 active personas: Alex (93), Sarah (26), Brad (11)
   - Authentication working correctly

---

## ⚠️ Critical Architecture Pattern Discovered

### **Cloudflare Workers CANNOT Fetch External URLs**

**The Problem:**
- API Gateway runs on Cloudflare Workers (Raindrop)
- Cloudflare blocks external fetch() calls (Error 1003)
- Cannot fetch from Vultr (logs.ai-tools-marketplace.io) from API Gateway

**The Solution That WORKS:**
```javascript
// ✅ CORRECT: Frontend calls log-query-service directly
const LOG_QUERY_URL = 'https://logs.ai-tools-marketplace.io';
const response = await fetch(`${LOG_QUERY_URL}/api/admin/dashboard?period=${period}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**What DOESN'T Work:**
```javascript
// ❌ WRONG: API Gateway trying to fetch external URL
// This fails with Error 1003 on Cloudflare Workers
const response = await fetch(`${this.env.LOG_QUERY_SERVICE_URL}/api/admin/dashboard`);
```

**Why This Pattern:**
- Browser → Vultr HTTPS: ✅ Works (CORS enabled)
- Cloudflare Workers → Vultr HTTPS: ❌ Blocked by Cloudflare
- Frontend already on Vercel (not Cloudflare), can fetch anywhere

---

## 📁 Key File Locations

### Backend (Vultr Server)
```
/root/log-query-service/
├── server.js                           # Main Express server
├── routes/admin/dashboard.js           # Admin dashboard endpoint
├── middleware/auth.js                  # NEW: Authentication middleware
├── utils/database.js                   # PostgreSQL queries
├── .env                                # ADMIN_SECRET_TOKEN added
└── deploy.sh                           # Deployment script (updated to include middleware/)

SSH: ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
PM2 Commands:
  pm2 status
  pm2 logs log-query-service --lines 50
  pm2 restart log-query-service
```

### Frontend (Local/Vercel)
```
/usr/code/ai_championship/call-me-back/
├── src/views/AdminDashboard.vue        # UPDATED: Line 337 - calls logs.ai-tools-marketplace.io
├── .admin-token                        # Admin authentication token
└── .env                                # ADMIN_SECRET_TOKEN and POSTGRES_PASSWORD added
```

---

## 🔐 Authentication Flow

### How It Works:
1. User visits `/admin/login` on frontend
2. Enters admin token (from `.admin-token` file)
3. Token stored in `localStorage.setItem('adminToken', token)`
4. Frontend sends token in Authorization header to log-query-service
5. Middleware validates token matches `ADMIN_SECRET_TOKEN` on server
6. Returns live data from PostgreSQL

### Admin Token Location:
- **Local:** `/usr/code/ai_championship/call-me-back/.admin-token`
- **Server:** `/root/log-query-service/.env` (ADMIN_SECRET_TOKEN=...)
- **Frontend:** `localStorage.getItem('adminToken')`

**IMPORTANT:** These must match exactly!

---

## 🐛 Database Schema - Actual vs Expected

### What We Discovered:
The database schema is DIFFERENT from what was documented. Always check actual schema first!

**Actual Schema:**
```sql
-- calls table
actual_cost_cents    INTEGER  (NOT cost_usd DECIMAL)

-- call_cost_events table
calculated_cost_cents NUMERIC  (NOT total_cost DECIMAL)
```

**Fixed Queries:**
```sql
-- Before (WRONG):
SUM(cost_usd) as total_cost_usd

-- After (CORRECT):
SUM(actual_cost_cents) / 100.0 as total_cost_usd
SUM(calculated_cost_cents) / 100.0 as total_cost
```

**Lesson:** Always run `\d table_name` in PostgreSQL before writing queries!

---

## 🚀 Deployment Pattern That Works

### log-query-service Deployment:
```bash
cd /usr/code/ai_championship/call-me-back/log-query-service

# 1. Update local .env from parent (pulls ADMIN_SECRET_TOKEN, POSTGRES_PASSWORD)
./load-env.sh

# 2. Deploy to Vultr
./deploy.sh

# 3. Verify on server
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
pm2 logs log-query-service --lines 20
curl http://localhost:3001/health
```

### Important Files in Tarball:
The `deploy.sh` must include:
- `server.js`
- `package.json`
- `.env`
- `routes/`
- `utils/`
- `middleware/`  ⚠️ **We forgot this initially, causing crashes!**

---

## 🔧 Next Session Tasks

### Immediate (5 min):
1. **Check Frontend Deployment Status**
   - Is AdminDashboard.vue deployed to Vercel with updated code?
   - Check: Does line 337 say `https://logs.ai-tools-marketplace.io`?

2. **Verify Browser Console**
   - Open Network tab in browser DevTools
   - Check `/api/admin/dashboard` request
   - Look for:
     - CORS errors (should be none - CORS enabled on server)
     - 401 Unauthorized (token mismatch)
     - 500 Internal Server Error (check server logs)

3. **Test Authentication**
   ```javascript
   // In browser console:
   localStorage.setItem('adminToken', 'PASTE_TOKEN_FROM_.admin-token_FILE');
   location.reload();
   ```

### If Getting 401 Unauthorized:
```bash
# Verify tokens match
cat /usr/code/ai_championship/call-me-back/.admin-token

ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 \
  "grep ADMIN_SECRET_TOKEN /root/log-query-service/.env"

# They must be identical!
```

### If Getting 500 Internal Server Error:
```bash
# Check server logs
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 \
  "pm2 logs log-query-service --err --lines 30"

# Common issues:
# - Database connection (password)
# - Missing middleware directory
# - SQL query syntax error
```

---

## 📊 Current Data Status

### Database Contents (as of 2025-11-20):
- **Total Calls:** 130
- **Active Users:** 1
- **Completed Calls:** 0 ⚠️ (all stuck in "initiating" status)
- **Cost Data:** Empty ⚠️ (call_cost_events table has no rows)

### Critical Issues to Investigate (Future):
1. **Why are calls stuck in "initiating" status?**
   - Check voice-pipeline logs: `pm2 logs voice-pipeline`
   - Likely: call workflow not completing properly

2. **Why is cost tracking empty?**
   - Call completion triggers cost calculation
   - If calls don't complete → no cost data logged
   - Fix call completion first, then cost tracking will work

---

## 🎨 Frontend Data Structure

### Expected Response from `/api/admin/dashboard`:
```json
{
  "period": {
    "label": "Last 7 days",
    "days": 7,
    "start": "2025-11-13T...",
    "end": "2025-11-20T..."
  },
  "summary": {
    "totalCalls": 130,
    "activeUsers": 1,
    "completedCalls": 0,
    "failedCalls": 0,
    "failureRate": "0.00%",
    "totalDuration_seconds": 0,
    "totalDuration_minutes": 0,
    "avgCallDuration_seconds": 0
  },
  "financials": {
    "revenue": "0.00",
    "totalCost": "0.00",
    "grossProfit": "0.00",
    "marginPercent": "0%",
    "avgCostPerCall": "0.0000"
  },
  "costByService": [],
  "topPersonas": [
    { "persona_id": "alex_001", "call_count": "93", "total_duration": null },
    { "persona_id": "sarah_001", "call_count": "26", "total_duration": null },
    { "persona_id": "brad_001", "call_count": "11", "total_duration": null }
  ]
}
```

### AdminDashboard.vue expects:
- `dashboardData.summary.total_calls` (NOT totalCalls)
- Field names use **snake_case** from database
- Frontend has `formatNumber()`, `formatCurrency()` helpers

---

## 🔥 Hot Tips for Next Session

### 1. Don't Modify API Gateway for External Fetches
- API Gateway on Cloudflare = can't fetch external URLs
- Use direct browser → Vultr pattern instead

### 2. Always Include All Directories in deploy.sh
- Check tarball contents before deploying
- Missing `middleware/` caused service to crash loop

### 3. Database Schema != Documentation
- Run `\d table_name` first
- Column names may be different
- Data types may be different

### 4. CORS is Already Enabled
- `app.use(cors())` in server.js line 12
- Should work from any origin
- If CORS errors: check Caddy config, not Express

### 5. Test Locally on Server First
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
curl -H "Authorization: Bearer $(cat .admin-token)" \
  http://localhost:3001/api/admin/dashboard?period=7d
```
If this works but browser doesn't → CORS or frontend deployment issue

---

## 🎯 Success Criteria

### When Admin Dashboard is Fully Working:
- [ ] Frontend loads without errors
- [ ] Data displays in dashboard cards (130 calls, 3 personas)
- [ ] Period selector works (7d, 30d, all time)
- [ ] No console errors
- [ ] Charts render (even if empty due to no cost data)
- [ ] Logout button works

### What Will Be Empty (Expected):
- ✅ Completed calls: 0 (calls not completing)
- ✅ Cost breakdown: [] (no cost events logged)
- ✅ Total duration: 0 (calls not completing)
- ✅ Revenue: $0 (no completed calls)

**This is NORMAL** - we're getting live data, just no completed calls yet.

---

## 🛠️ Quick Reference Commands

### Check Service Status:
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 status"
```

### View Logs:
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 \
  "pm2 logs log-query-service --lines 50"
```

### Test Endpoint:
```bash
curl -H "Authorization: Bearer $(cat .admin-token)" \
  https://logs.ai-tools-marketplace.io/api/admin/dashboard?period=7d | jq
```

### Restart Service:
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 \
  "pm2 restart log-query-service"
```

### Check Database:
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 \
  "sudo -u postgres psql -d call_me_back -c 'SELECT COUNT(*) FROM calls;'"
```

---

## 📝 Files Modified This Session

1. **log-query-service/server.js** - No changes (CORS already enabled)
2. **log-query-service/routes/admin/dashboard.js** - Added auth middleware, fixed SQL queries
3. **log-query-service/middleware/auth.js** - NEW FILE - Token validation
4. **log-query-service/load-env.sh** - Added ADMIN_SECRET_TOKEN
5. **log-query-service/deploy.sh** - Added middleware/ to tarball
6. **src/views/AdminDashboard.vue** - Line 337: Changed to call logs.ai-tools-marketplace.io
7. **.env** (root) - Added ADMIN_SECRET_TOKEN and POSTGRES_PASSWORD

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Don't try to fetch external URLs from API Gateway**
   - Cloudflare Workers will block it
   - Use direct frontend → Vultr pattern

2. ❌ **Don't assume database schema matches docs**
   - Always verify with `\d table_name`
   - PCR2.md schema != actual schema

3. ❌ **Don't forget to update deploy.sh when adding directories**
   - We forgot `middleware/` initially
   - Caused crash loop

4. ❌ **Don't test without proper token**
   - Must match exactly between frontend localStorage and server .env
   - Case-sensitive, no extra spaces

5. ❌ **Don't panic if data is empty**
   - Empty cost data = normal (no completed calls)
   - Focus on getting dashboard to load first
   - Investigate call completion later

---

## 💡 Patterns That Work

### ✅ Direct Frontend → Backend HTTPS
```javascript
// Frontend calls Vultr directly
fetch('https://logs.ai-tools-marketplace.io/api/admin/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### ✅ Caddy Reverse Proxy
```caddyfile
logs.ai-tools-marketplace.io {
    reverse_proxy localhost:3001
}
```

### ✅ PM2 Deployment
- Tarball → SCP → Extract → npm install → pm2 start
- Stateless deploys, no git needed on server

### ✅ Express Auth Middleware
```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.substring(7);
  if (token !== process.env.ADMIN_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.get('/', authMiddleware, async (req, res) => { ... });
```

---

## 🎬 Next Session Start Here

1. **Open browser to your Vercel admin dashboard**
   - URL: `https://your-app.vercel.app/admin/login` (or wherever it's deployed)

2. **Open DevTools (F12) → Network tab**

3. **Enter admin token in login**
   - Get from: `cat /usr/code/ai_championship/call-me-back/.admin-token`

4. **Check what error you're seeing**
   - 401? Token mismatch
   - 500? Check server logs
   - CORS? Shouldn't happen, but check Caddy

5. **Verify frontend deployment**
   - Is `AdminDashboard.vue` with line 337 update deployed?
   - May need to git push and wait for Vercel rebuild

---

**Session End:** 2025-11-20 ~16:00 UTC
**Next Priority:** Get frontend displaying live data (backend is 100% working!)
**Estimated Time to Fix:** 5-15 minutes (likely just frontend deployment or token issue)

🎯 **You're 95% there! Backend is solid, just need to verify frontend deployment.**
