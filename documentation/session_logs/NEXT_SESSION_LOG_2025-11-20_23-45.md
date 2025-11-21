# Next Session Plan - Live Dashboard Data Integration

**Session Date:** 2025-11-20 (Tonight's session ended at ~23:45)
**Next Session:** 2025-11-21
**Status:** Ready to implement live data

*Read the auth dashboard documentations before reviewing this document.  Much has been done that I think wasn't known at the time of writing*
---

## 🎯 Primary Objective

Connect the Admin Dashboard to **live PostgreSQL data** instead of mock data, and verify the entire call logging pipeline is operational.

---

## ✅ Completed Tonight (2025-11-20, 21:00 - 23:45)

### 1. Pricing Implementation
- ✅ Created `Pricing.vue` with 4 customer-facing tiers
  - Casual: $4.99/call
  - Standard: $29.99/month (10 calls)
  - Power User: $49.99/month (25 calls)
  - Professional: $99.99/month (unlimited)
- ✅ Updated `Home.vue` pricing section (removed internal cost data, added customer CTAs)
- ✅ Added pricing route and navigation links
- ✅ Deployed to Vercel

### 2. Personas Page Restructure
- ✅ Renamed old `Personas.vue` → `PersonaConfig.vue` (protected route at `/personas/config`)
- ✅ Created new public `Personas.vue` with:
  - Expandable persona cards (Brad, Sarah, Alex)
  - Stylistic diagram explaining how personas work
  - Visual features: Add to Contacts, Create Custom, Share with Friends
- ✅ Updated navigation for both routes
- ✅ Added scroll-to-top behavior on route change

### 3. Infrastructure
- ✅ All pages deployed to Vercel
- ✅ Admin dashboard accessible (use browser console to set token)
- ✅ Frontend fully styled with premium dark aesthetic

---

## 🔧 Tomorrow's Tasks (2025-11-21)

### Task 1: Deploy Log Query Service to Vultr

**Current State:**
- Log query service exists at `/log-query-service/`
- Configured for port 3001
- Has Caddy configuration ready (`Caddyfile.logs`)

**Steps:** *Note! The migration of the log-query-service may have already been completed.  doublecheck before implementing*
1. SSH into Vultr server (144.202.15.249)
2. Upload log-query-service to server
3. Install dependencies: `npm install`
4. Set up systemd service for auto-restart
5. Configure Caddy for HTTPS reverse proxy
   - Domain: `logs.yourdomain.com` (or subdomain of choice)
   - Proxy to `localhost:3001`
6. Test endpoints:
   ```bash
   curl https://logs.yourdomain.com/api/admin/dashboard?period=7d
   ```

**Files to Check:**
- `/log-query-service/server.js` - Main server file
- `/log-query-service/Caddyfile.logs` - Caddy configuration
- `/log-query-service/CADDY_SETUP.md` - Setup instructions

---

### Task 2: Update API Gateway to Use Live Data

**Current State:**
- API Gateway has `/api/admin/dashboard` endpoint
- Currently returns mock data

**Steps:**
1. Locate API Gateway admin dashboard endpoint
2. Replace mock data with fetch to log-query-service:
   ```javascript
   const response = await fetch(`https://logs.yourdomain.com/api/admin/dashboard?period=${period}`)
   const data = await response.json()
   return data
   ```
3. Add error handling for when log service is unavailable
4. Test with admin token authentication

**Expected Response Format:**
```json
{
  "totalCalls": 42,
  "totalCost": 23.45,
  "averageDuration": 4.5,
  "callsByDay": [...],
  "costByService": {...},
  "topPersonas": [...]
}
```

---

### Task 3: Verify Database Schema & Data Flow

**Database Tables to Check:**
- `calls` - Main call records
- `call_cost_events` - Detailed cost breakdown per API call
- `api_call_events` - Individual API service calls

**Verification Steps:**
1. SSH to Vultr and connect to PostgreSQL:
   ```bash
   psql -U <username> -d <database_name>
   ```
2. Check table structure:
   ```sql
   \d calls
   \d call_cost_events
   \d api_call_events
   ```
3. Check if data exists:
   ```sql
   SELECT COUNT(*) FROM calls;
   SELECT * FROM calls ORDER BY created_at DESC LIMIT 5;
   ```
4. If no data exists, we need to trace the call pipeline

---

### Task 4: Make Test Calls & Verify Logging

**Test Call Workflow:**
1. Register a test user account
2. Schedule or trigger a test call
3. Monitor logs in real-time:
   ```bash
   # On Vultr server
   tail -f /path/to/voice-pipeline/logs/*.log
   ```
4. Verify data appears in database:
   ```sql
   SELECT * FROM calls WHERE user_id = '<test_user_id>' ORDER BY created_at DESC;
   ```
5. Check admin dashboard updates with new data

**Expected Call Flow:**
```
User triggers call
  → Voice pipeline receives webhook
  → Twilio initiates call
  → AI conversation happens
  → Call completes
  → Cost data logged to PostgreSQL
  → Dashboard queries show updated data
```

---

### Task 5: Verify All Cloud Endpoints

**Endpoints to Test:**

1. **Voice Pipeline (Vultr: 144.202.15.249)**
   ```bash
   curl http://144.202.15.249:3000/health
   ```
   Expected: `{ "status": "ok" }`

2. **API Gateway**
   ```bash
   curl https://your-api-gateway.com/health
   ```

3. **Database Connection**
   - Test from voice pipeline
   - Test from log-query-service
   - Verify connection pooling

4. **External Services**
   - Twilio webhook configuration
   - Deepgram API connectivity
   - Cerebras API connectivity
   - ElevenLabs API connectivity

---

## 🚨 Known Issues to Address

### Issue 1: Mock Data in Dashboard
**Problem:** Dashboard currently shows hardcoded mock data
**Solution:** Implement Task 2 above

### Issue 2: Log Query Service Not Deployed
**Problem:** Service exists locally but not on Vultr
**Solution:** Implement Task 1 above

### Issue 3: Unknown Call Data Status
**Problem:** Don't know if calls are being logged to PostgreSQL
**Solution:** Implement Task 3 & 4 above

---

## 📋 Session Checklist for 2025-11-21

Start with these in order:

- [ ] **Step 1:** SSH to Vultr and verify PostgreSQL database has call data
  - If YES → Proceed to deploy log-query-service
  - If NO → Trace why calls aren't being logged

- [ ] **Step 2:** Deploy log-query-service to Vultr
  - [ ] Upload code
  - [ ] Install dependencies
  - [ ] Create systemd service
  - [ ] Configure Caddy HTTPS proxy
  - [ ] Test endpoint

- [ ] **Step 3:** Update API Gateway to consume live data
  - [ ] Find admin dashboard endpoint
  - [ ] Replace mock data with log service fetch
  - [ ] Test with admin token
  - [ ] Deploy changes

- [ ] **Step 4:** Make test calls
  - [ ] Register test account
  - [ ] Trigger test call
  - [ ] Verify database logging
  - [ ] Check dashboard updates

- [ ] **Step 5:** Verify all endpoints
  - [ ] Voice pipeline health check
  - [ ] API Gateway health check
  - [ ] Database connections
  - [ ] External service APIs

- [ ] **Step 6:** Final verification
  - [ ] Admin dashboard shows live data
  - [ ] All charts populate correctly
  - [ ] Cost calculations accurate
  - [ ] Time period filters work (7d, 30d, all)

---

## 🔐 Security Reminders

1. **NEVER share admin tokens in conversation**
2. **Use environment variables for all API keys**
3. **Log query service should bind to localhost only** (Caddy proxies externally)
4. **Verify CORS settings** on API Gateway for admin dashboard access

---

## 📊 Success Criteria

By end of next session, we should have:

✅ Admin dashboard displaying **live data from PostgreSQL**
✅ Test calls successfully logged and visible in dashboard
✅ All cloud endpoints verified and operational
✅ Log query service deployed with HTTPS
✅ Cost tracking accurately reflected in dashboard

---

## 📝 Notes for Tomorrow

- **Priority:** Get one test call logged to database first, then work backwards
- **If stuck:** Check voice pipeline logs on Vultr for errors
- **Database credentials:** Should be in environment variables on Vultr server
- **Caddy location:** Likely in `/etc/caddy/` or `~/caddy/`

---

## 🚀 Future Sessions (Post Live Data)

Once live data is working, remaining tasks from NEXT_SESSION_GUIDE.md:

1. Complete remaining frontend pages styling:
   - Schedule.vue
   - Profile.vue
2. Test end-to-end user flow
3. Performance optimization
4. Final production deployment

---

**Session End Time:** 2025-11-20 23:45
**Next Session:** Ready to connect live data! 🎯
