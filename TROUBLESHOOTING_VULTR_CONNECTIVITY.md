# Troubleshooting Guide: Vultr Log-Query-Service Connectivity
**Issue:** Admin Dashboard showing mock data instead of live PostgreSQL metrics
**Date:** 2025-11-20
**Priority:** High
**Estimated Fix Time:** 30-60 minutes

---

## 🔴 Problem Summary

The Raindrop API Gateway cannot connect to the Vultr log-query-service to fetch live admin dashboard metrics from PostgreSQL.

**Symptoms:**
- `curl http://144.202.15.249:3001/api/admin/dashboard` hangs (no response)
- API Gateway returns mock data instead of real metrics
- No error logs in Vultr service (request never arrives)

**Root Cause:**
Network connectivity issue between Raindrop (Cloudflare Workers) and Vultr VPS. Likely:
1. Vultr firewall blocking external requests
2. Service not listening on public IP
3. Port 3001 not open to external traffic
4. Network routing issue

---

## 🔍 Diagnostic Steps

### Step 1: Verify Vultr Service is Running
```bash
# SSH into Vultr VPS
ssh root@144.202.15.249

# Check PM2 status
pm2 status

# Should show:
# id: 36
# name: log-query-service
# status: online
# restarts: 0

# Check service logs
pm2 logs log-query-service --lines 50
```

**Expected:** Service running without errors

---

### Step 2: Check Service Binding
```bash
# Check what port/IP the service is listening on
netstat -tuln | grep 3001

# Should show:
# tcp 0.0.0.0:3001 (listening on all interfaces)
# OR
# tcp 127.0.0.1:3001 (listening on localhost only)
```

**Problem if:** Shows `127.0.0.1:3001` (localhost only)
**Fix:** Update log-query-service/server.js to bind to `0.0.0.0`

---

### Step 3: Test Local Connection (on Vultr)
```bash
# From within Vultr VPS
curl -s "http://localhost:3001/api/admin/dashboard?period=7d" | head -100

# Should return JSON with real data
```

**Expected:** Valid JSON response with database metrics
**If fails:** Service not working - check PM2 logs and database connection

---

### Step 4: Test External Connection
```bash
# From your local machine or another server
curl -v "http://144.202.15.249:3001/api/admin/dashboard?period=7d"

# Watch for:
# - Connection timeout = firewall issue
# - Connection refused = service not listening on 0.0.0.0
# - 404/500 error = service running but endpoint issue
# - Valid JSON = connectivity working!
```

**If timeout/refused:** Proceed to firewall fixes below

---

## 🛠️ Fix Options

### Fix 1: Update Service to Listen on 0.0.0.0 (Most Likely)

**Problem:** Service only listening on localhost (127.0.0.1)

**Solution:**
```bash
# Edit server.js
cd /root/log-query-service
nano server.js

# Find the app.listen() line (probably near the end)
# Change from:
app.listen(3001, 'localhost', () => {
  console.log('Log query service running on port 3001');
});

# To:
app.listen(3001, '0.0.0.0', () => {
  console.log('Log query service running on http://0.0.0.0:3001');
});

# Save (Ctrl+O, Enter, Ctrl+X)

# Restart the service
pm2 restart log-query-service

# Verify
netstat -tuln | grep 3001
# Should now show: tcp 0.0.0.0:3001
```

---

### Fix 2: Configure Vultr Firewall

**Problem:** Vultr firewall blocking port 3001

**Solution A: Via Vultr Dashboard**
1. Login to https://my.vultr.com
2. Navigate to your VPS instance
3. Go to "Firewall" or "Settings" tab
4. Add firewall rule:
   - **Protocol:** TCP
   - **Port:** 3001
   - **Source:**
     - For testing: `0.0.0.0/0` (allow all)
     - For production: Cloudflare IP ranges (recommended)
   - **Action:** Accept
5. Apply rule
6. Test connection

**Solution B: Via UFW (if using UFW firewall)**
```bash
# Check if UFW is active
sudo ufw status

# If active, allow port 3001
sudo ufw allow 3001/tcp

# Verify
sudo ufw status numbered
```

**Solution C: Via iptables**
```bash
# Check current rules
sudo iptables -L -n

# Allow port 3001
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT

# Save rules (varies by distro)
sudo iptables-save > /etc/iptables/rules.v4
```

---

### Fix 3: Use Cloudflare Tunnel (Advanced, More Secure)

**Problem:** Don't want to expose port 3001 to the internet

**Solution:** Create a Cloudflare Tunnel from Raindrop to Vultr

This is more complex but more secure. Cloudflare Workers can connect to private services via Cloudflare Tunnels.

**Steps:**
1. Install cloudflared on Vultr VPS
2. Create tunnel: `cloudflared tunnel create log-query`
3. Configure tunnel to route to `localhost:3001`
4. Update `LOG_QUERY_SERVICE_URL` to tunnel URL
5. Test connection from Raindrop

**Documentation:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

---

### Fix 4: Change to Internal Vultr IP (If Available)

**Problem:** Using public IP, but Raindrop and Vultr might be in same region

**Solution:**
```bash
# Check if Vultr instance has private network IP
ip addr show

# Look for addresses like:
# 10.x.x.x (private network)

# If available, update LOG_QUERY_SERVICE_URL
# From: http://144.202.15.249:3001
# To: http://10.x.x.x:3001
```

This only works if Raindrop (Cloudflare Workers) can reach Vultr private network (unlikely unless using Cloudflare Tunnel).

---

## ✅ Verification Steps

After applying fixes, verify in this order:

### 1. Local Connection (on Vultr)
```bash
curl -s "http://localhost:3001/api/admin/dashboard?period=7d" | head -50
```
**Expected:** Valid JSON with real metrics

### 2. External Connection (from dev machine)
```bash
curl -s "http://144.202.15.249:3001/api/admin/dashboard?period=7d" | head -50
```
**Expected:** Same valid JSON

### 3. From Raindrop (via API Gateway test)
```bash
# Get admin token
cat .admin-token

# Test via API Gateway
curl -H "Authorization: Bearer $(cat .admin-token)" \
  "https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/admin/dashboard?period=7d"
```
**Expected:** Real data from database (not mock data)

### 4. From Frontend
1. Refresh dashboard at `http://localhost:3001/admin/dashboard`
2. Check that data looks different from mock data
3. Change period selector (7D → 30D → 90D)
4. Verify data updates

---

## 🔄 Switching from Mock to Live Data

Once Vultr connectivity is working, update the API Gateway code:

**File:** `src/api-gateway/index.ts`

**Find this section (around line 1061):**
```typescript
// TODO: Fix Vultr connectivity - using mock data for now
// const url = new URL(request.url);
// const vultrUrl = `${this.env.LOG_QUERY_SERVICE_URL}${path}${url.search}`;
// const response = await fetch(vultrUrl);
// const data = await response.json();

// Mock data for demonstration
const mockData = { ... };

return new Response(JSON.stringify(mockData), {
```

**Replace with:**
```typescript
// Direct proxy to Vultr log-query-service
const url = new URL(request.url);
const vultrUrl = `${this.env.LOG_QUERY_SERVICE_URL}${path}${url.search}`;

const response = await fetch(vultrUrl);
const data = await response.json();

return new Response(JSON.stringify(data), {
```

**Then rebuild and deploy:**
```bash
raindrop build generate
raindrop build validate
raindrop build deploy
```

---

## 🔍 Additional Debugging

### Check Raindrop Logs
```bash
raindrop logs tail -n 50 --application call-me-back | grep -i "admin\|vultr\|fetch"
```

Look for:
- Network timeout errors
- DNS resolution failures
- TLS/SSL errors

### Test with Different HTTP Client
```bash
# Try with wget instead of curl
wget -O - "http://144.202.15.249:3001/api/admin/dashboard?period=7d"

# Try with telnet to test port
telnet 144.202.15.249 3001
# Should connect, type: GET /api/admin/dashboard HTTP/1.1
# Then: Host: 144.202.15.249
# Then: [Enter twice]
```

### Check DNS Resolution
```bash
# Verify IP resolves correctly
nslookup 144.202.15.249
dig 144.202.15.249

# Ping test
ping -c 4 144.202.15.249
```

---

## 📊 Expected Data Format

Once live data is working, the response should match this structure:

```json
{
  "summary": {
    "total_calls": 1247,
    "total_revenue": 3892.50,
    "total_cost": 1156.75,
    "total_duration": 37410
  },
  "cost_breakdown": [
    {
      "service": "twilio",
      "total_cost": 498.30,
      "usage_count": 1247
    },
    ...
  ],
  "top_personas": [
    {
      "persona_id": 1,
      "persona_name": "Brad",
      "call_count": 487,
      "total_revenue": 1523.40
    },
    ...
  ],
  "top_users": [
    {
      "user_id": 101,
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "call_count": 45,
      "total_duration": 1350,
      "total_revenue": 141.75
    },
    ...
  ]
}
```

**Important:** If the data format from Vultr is different, you'll need to adjust either:
1. The Vultr endpoint to match this format, OR
2. The frontend to handle the different format

---

## 🚨 Common Issues

### Issue: Service runs locally but not externally
**Cause:** Listening on 127.0.0.1 instead of 0.0.0.0
**Fix:** See Fix 1 above

### Issue: Connection timeout
**Cause:** Firewall blocking port 3001
**Fix:** See Fix 2 above

### Issue: Connection refused
**Cause:** Service not running or wrong port
**Fix:** Verify PM2 status and service configuration

### Issue: 404 Not Found
**Cause:** Wrong endpoint path
**Fix:** Verify path is `/api/admin/dashboard` not `/dashboard`

### Issue: Database connection error
**Cause:** PostgreSQL not accessible from log-query-service
**Fix:** Check DATABASE_URL env var and PostgreSQL permissions

---

## 📝 Configuration Checklist

Before testing, verify these are set correctly:

### On Vultr VPS
- [ ] log-query-service running (PM2)
- [ ] Listening on 0.0.0.0:3001
- [ ] DATABASE_URL environment variable set
- [ ] PostgreSQL accessible (local or remote)
- [ ] Firewall allows port 3001

### In Raindrop
- [ ] ADMIN_SECRET_TOKEN set
- [ ] LOG_QUERY_SERVICE_URL = http://144.202.15.249:3001
- [ ] API Gateway deployed with latest code

### In Frontend
- [ ] VITE_API_URL set to Raindrop API Gateway URL
- [ ] Admin token stored in .admin-token
- [ ] Dev server running on localhost:3001

---

## 🎯 Success Criteria

You know it's working when:

1. ✅ `curl http://144.202.15.249:3001/api/admin/dashboard` returns JSON (not timeout)
2. ✅ API Gateway returns different data than mock (real database numbers)
3. ✅ Frontend dashboard shows live metrics
4. ✅ Period selector (7D/30D/90D) changes the data
5. ✅ Numbers match what's actually in PostgreSQL database

---

## 📞 Next Steps After Fix

Once live data is working:

1. **Test Thoroughly**
   - Try all period options (7D, 30D, 90D)
   - Verify numbers match database queries
   - Test with no data (empty database)
   - Test with large datasets

2. **Add Missing Endpoints**
   - `/api/admin/logs` endpoint UI
   - Log search and filtering
   - Real-time log streaming

3. **Deploy to Production**
   ```bash
   # Frontend to Vercel
   vercel --prod

   # Backend already deployed
   # Update .env.production with production URLs
   ```

4. **Monitor Performance**
   - Check Raindrop logs for errors
   - Monitor Vultr CPU/memory usage
   - Watch for slow queries
   - Consider adding Redis cache layer

5. **Security Hardening**
   - Rotate admin token
   - Add rate limiting to admin endpoints
   - Set up IP whitelisting
   - Enable HTTPS for Vultr (nginx proxy)

---

**Estimated Time to Fix:** 30-60 minutes
**Most Likely Solution:** Fix 1 (listen on 0.0.0.0) + Fix 2 (firewall rule)
**Difficulty:** Medium

**Good luck! Once this is working, the dashboard will be fully functional with live production data.** 🚀

---

## 🆘 PM2 Environment Variable Issues (CRITICAL)

**Date Added:** 2025-11-20
**Severity:** CRITICAL - Can break ALL services on the server

### Problem: PM2 ecosystem.config.js with `require('dotenv').config()`

**Symptoms:**
- After deploying a new service, OTHER unrelated services start failing
- Database authentication errors: "password authentication failed"
- Services that were working suddenly can't connect to PostgreSQL
- Error: "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string"

**Root Cause:**
When you use `require('dotenv').config()` in an ecosystem.config.js file and then pass environment variables to PM2's `env` section, PM2 loads those variables into a **GLOBAL** environment that affects ALL PM2 processes.

### The Wrong Way (DO NOT DO THIS):

```javascript
// ❌ BAD - This pollutes the global PM2 environment!
require('dotenv').config();

module.exports = {
  apps: [{
    name: 'log-query-service',
    script: './server.js',
    env: {
      POSTGRES_HOST: process.env.POSTGRES_HOST,
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
      // ... other vars
    }
  }]
};
```

**Why this is bad:**
- When PM2 starts this service, it loads the .env file from `/root/log-query-service/.env`
- Those variables (including passwords) get into PM2's global env
- When you restart OTHER services like `db-proxy`, they inherit these wrong variables
- If `db-proxy` expects password `ABC` but log-query-service has password `XYZ`, db-proxy breaks!

### The Right Way:

**Option 1: Use PM2's env_file (RECOMMENDED)**
```javascript
// ✅ GOOD - PM2 loads .env only for this app
module.exports = {
  apps: [{
    name: 'log-query-service',
    script: './server.js',
    cwd: '/root/log-query-service',
    env_file: './.env',  // PM2 loads this for this app only
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

**Option 2: Load dotenv in server.js (ALSO GOOD)**
```javascript
// In your server.js (NOT ecosystem.config.js)
require('dotenv').config();
const express = require('express');
// ... rest of your app
```

```javascript
// In ecosystem.config.js - no dotenv!
module.exports = {
  apps: [{
    name: 'log-query-service',
    script: './server.js',  // server.js loads its own .env
    cwd: '/root/log-query-service',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### How to Fix If You Already Broke It:

**Step 1: Check which services are affected**
```bash
pm2 logs db-proxy --err --lines 20
pm2 logs voice-pipeline --err --lines 20

# Look for: "password authentication failed"
```

**Step 2: Fix the ecosystem.config.js files**
```bash
# For each affected service, remove require('dotenv') from ecosystem.config.js
# Use one of the "Right Way" options above
```

**Step 3: Reset PostgreSQL passwords to match .env files**
```bash
# On Vultr server
sudo -u postgres psql

# For each service that connects to PostgreSQL:
ALTER USER cmb_user WITH PASSWORD 'password_from_env_file';
ALTER USER other_user WITH PASSWORD 'password_from_other_env_file';

# Exit psql
\q
```

**Step 4: Fresh restart of ALL services**
```bash
# Stop everything
pm2 delete all

# Start each service from its directory
cd /opt/vultr-db-proxy
pm2 start ecosystem.config.js

cd /root/voice-pipeline
pm2 start ecosystem.config.js

cd /root/log-query-service
pm2 start ecosystem.config.js

# Save PM2 state
pm2 save
```

**Step 5: Verify each service can connect to PostgreSQL**
```bash
# Watch logs for successful startup
pm2 logs --lines 50

# Should see: "Database connected successfully"
# Should NOT see: "password authentication failed"
```

### Prevent This in the Future:

1. **NEVER use `require('dotenv').config()` in ecosystem.config.js**
2. **ALWAYS use `env_file` in PM2 config OR load dotenv in server.js**
3. **Keep .env files isolated per service** - different directories with different passwords
4. **Test new services in isolation** before restarting existing services
5. **Document your .env structure** so you know which password belongs to which service

### Quick Reference: Where Passwords Should Live

```
/opt/vultr-db-proxy/.env
  DB_PASSWORD=R7BcHfxm8O3ivSwd3nauxL24/7un3pCL8dGihpURc5g=

/root/log-query-service/.env
  POSTGRES_PASSWORD=R7BcHfxm8O3ivSwd3nauxL24/7un3pCL8dGihpURc5g=
  (Should match db-proxy if using same database!)

/root/voice-pipeline/.env
  DB_PASSWORD=R7BcHfxm8O3ivSwd3nauxL24/7un3pCL8dGihpURc5g=
  (Should match db-proxy if using same database!)
```

**Key Insight:** All services connecting to the SAME PostgreSQL database should use the SAME password! If they don't match, one or more will fail.

---

**This fix saved us hours of debugging. Don't make the same mistake!** 💡
