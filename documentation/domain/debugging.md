# Debugging Guide
**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** [debugging] [troubleshooting]

---

## Quick Navigation

- [Call Connection Issues](#1-call-doesnt-connect)
- [Audio & Voice Pipeline Issues](#2-audio-issues)
- [Database Errors](#3-database-errors)
- [Deployment Failures](#4-deployment-failures)
- [WebSocket Connection Problems](#5-websocket-connection-problems)
- [Tools & Commands](#tools--commands)
- [Common Patterns](#common-patterns)

---

## 1. Call Doesn't Connect

**Symptom:** User tries to make a call but connection fails or never establishes

### Quick Checklist

- [ ] **Verify Twilio is connected** - Check WebSocket upgrade request logs
- [ ] **Check routing** - Ensure `/api/voice/stream` endpoint exists in API Gateway
- [ ] **Verify TwiML is valid** - Call returns proper XML-escaped parameters
- [ ] **Check API Gateway logs** - `raindrop logs tail | grep -i "voice\|stream"`
- [ ] **Verify Vultr services running** - `pm2 status` on Vultr VPS
- [ ] **Test WebSocket endpoint** - Try connecting to voice.ai-tools-marketplace.io

### Diagnostic Steps

#### Step 1: Check WebSocket Upgrade Request
```bash
raindrop logs tail -n 100 --application call-me-back | grep -E "WebSocket|upgrade|stream request"
```

**Look for:**
- ✅ "WebSocket stream request"
- ✅ "WebSocket upgrade request received"
- ✅ "WebSocket accept() called, readyState: 1"

#### Step 2: Verify Twilio Connection Details
```bash
# From Twilio Console, check:
# - Account SID is correct
# - Phone number is correct
# - Webhook URL is correct
# - TwiML returned is valid
```

#### Step 3: Check TwiML Parameters
**Correct format:**
```xml
<Say>Connecting you now...</Say>
<Connect>
  <Stream url="wss://voice.ai-tools-marketplace.io/stream?sessionId=abc&userId=123&personaId=456" />
</Connect>
```

**Wrong format (will fail):**
```xml
<!-- ❌ Raw ampersands instead of &amp; -->
<Stream url="wss://voice.ai-tools-marketplace.io/stream?sessionId=abc&userId=123" />
```

**Fix:** XML-escape ampersands in TwiML
```typescript
// In src/api-gateway/index.ts
const streamUrl = `wss://voice.ai-tools-marketplace.io/stream?sessionId=${sessionId}&userId=${userId}&personaId=${personaId}`;
// Return in TwiML with escaped ampersands
return Response with `<Stream url="${streamUrl.replace(/&/g, '&amp;')}" />`
```

#### Step 4: Verify Voice Pipeline is Running
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249

# Check PM2 status
pm2 status

# Should show:
# id: 1 | name: voice-pipeline | status: online

# Check logs
pm2 logs voice-pipeline --lines 100
```

#### Step 5: Test Voice Endpoint
```bash
# Test HTTPS endpoint
curl -i https://voice.ai-tools-marketplace.io/health

# Should return: 200 OK
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Connection refused" | Voice pipeline not running | `pm2 restart voice-pipeline` on Vultr |
| "Invalid XML" error from Twilio | Ampersands not escaped in TwiML | Escape `&` as `&amp;` |
| "Stream URL invalid" | Wrong domain name | Use `voice.ai-tools-marketplace.io` (not IP address) |
| WebSocket closes after 1 second | Raindrop service not accepting connection | Check API Gateway WebSocket handler code |
| User hears silence | Voice pipeline connects but audio not flowing | See [Audio Issues](#2-audio-issues) |

---

## 2. Audio Issues

**Symptom:** Call connects but user hears silence, no bot response, or one-way audio

### Quick Checklist

- [ ] **Verify Deepgram STT connected** - Check voice pipeline logs for "Deepgram connected"
- [ ] **Verify ElevenLabs TTS connected** - Check for "ElevenLabs connected"
- [ ] **Check audio buffer flowing** - Look for "handleTwilioMedia" logs
- [ ] **Verify persona data loaded** - Check database response logged
- [ ] **Test Deepgram API key** - Make sure it's valid and not expired
- [ ] **Test ElevenLabs API key** - Verify it works in isolation
- [ ] **Check WebSocket event listeners** - Ensure they're actually firing

### Diagnostic Steps

#### Step 1: Check Voice Pipeline Startup Sequence
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
pm2 logs voice-pipeline --lines 200 | grep -E "Starting|connected|error|Deepgram|ElevenLabs"
```

**Expected sequence:**
```
[Voice Pipeline] Starting voice pipeline for call: <call-id>
[Voice Pipeline] Fetching persona metadata...
[Voice Pipeline] Persona data: name=Brad, voice_id=xyz...
[Voice Pipeline] Connecting to Deepgram STT...
[Deepgram] WebSocket connected
[Voice Pipeline] Connecting to ElevenLabs TTS...
[ElevenLabs] WebSocket connected
[Voice Pipeline] Speaking greeting: "Hi, I'm Brad..."
[Voice Pipeline] Listening for user audio...
[Voice Pipeline] User said: "hello"
```

#### Step 2: Check Deepgram WebSocket Connection
**Problem:** "WebSocket is not open: readyState 0 (CONNECTING)"

**Cause:** Audio being sent before Deepgram WebSocket fully opens

**Fix:** In voice-pipeline-nodejs/index.js, ensure connection state:
```javascript
// WRONG - sends audio before connection ready
connectDeepgram().then(() => {
  // Stream starts immediately
  handleAudio(data);
});

// RIGHT - wait for connection to be ready
connectDeepgram().then(() => {
  return new Promise(resolve => {
    ws.addEventListener('open', () => {
      isDeepgramReady = true;
      resolve();
    });
  });
}).then(() => {
  // NOW stream starts
  handleAudio(data);
});
```

#### Step 3: Check Persona Metadata Loading
**Problem:** Database query returns 401, persona not found

**Cause:** Wrong authorization header format

**Current Code (WRONG):**
```javascript
const response = await fetch(`${env.VULTR_DB_API_URL}/query`, {
  headers: {
    'X-API-Key': env.VULTR_DB_API_KEY  // ❌ WRONG
  }
});
```

**Fixed Code:**
```javascript
const response = await fetch(`${env.VULTR_DB_API_URL}/query`, {
  headers: {
    'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`  // ✅ CORRECT
  }
});
```

#### Step 4: Check Silence Detection Timeout
**Problem:** "User said: [empty string]" repeated, call ends after 2-3 exchanges

**Cause:** Turn detection evaluator hangs, call times out

**Fix:** Add timeout protection in voice pipeline:
```javascript
// Add timeout for turn evaluation
const evaluateWithTimeout = async (userText, timeout = 5000) => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Turn eval timeout')), timeout)
    );

    return await Promise.race([
      evaluateTurn(userText),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('Turn eval failed:', error);
    return 'RESPOND'; // Default action
  }
};
```

#### Step 5: Verify WebSocket Event Listeners Fire
**Problem:** WebSocket connection established but events never fire

**Cause:** Cloudflare Workers WebSocket timing issue (applies if still using Workers)

**Key Finding:** Event listeners MUST be added immediately after `accept()` within same execution context, BEFORE returning response.

```typescript
// CORRECT for Cloudflare Workers:
const pair = new WebSocketPair();
const [client, server] = Object.values(pair);

server.accept();  // Must accept before adding listeners

// Add listeners SYNCHRONOUSLY, before returning
server.addEventListener('message', (event) => {
  handleMessage(event.data);
});

server.addEventListener('close', () => {
  handleClose();
});

// Return response to upgrade HTTP to WebSocket
return new Response(null, { status: 101, webSocket: client });
```

**Note:** Voice pipeline now runs on Node.js (Vultr), which doesn't have this timing issue, but worth knowing for future Cloudflare work.

### Common Audio Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Complete silence (no sound at all) | WebSocket event listeners not firing | Ensure listeners added before response returns |
| Bot responds but user voice not transcribed | Deepgram not receiving audio | Check audio buffer is flowing to Deepgram |
| Deepgram shows "readyState 0" | Audio sent before connection ready | Wait for 'open' event before streaming |
| No bot response after user speaks | Turn detection hangs | Add 5-second timeout, return default action |
| 401 error from database | Wrong auth header | Use `Authorization: Bearer` not `X-API-Key` |
| Persona always "Brad" | Persona metadata not loading | Fix database auth header (see above) |
| "Invalid API key" from Deepgram | Expired or wrong key | Verify `DEEPGRAM_API_KEY` in environment |
| "Invalid API key" from ElevenLabs | Key wrong or permissions missing | Check `ELEVENLABS_API_KEY` in environment |

---

## 3. Database Errors

**Symptom:** Database queries fail, persona/user data not loading, authentication errors

### Quick Checklist

- [ ] **Verify PostgreSQL running** - Check `pg_isready` on Vultr
- [ ] **Check database proxy running** - `pm2 status | grep db-proxy`
- [ ] **Verify connection string** - Correct host, port, database name
- [ ] **Check credentials** - Password matches PostgreSQL user
- [ ] **Test local connection** - `psql -U cmb_user -d callmeback` from Vultr
- [ ] **Verify API key** - `VULTR_DB_API_KEY` is set in environment
- [ ] **Check firewall** - Port 3000 not blocked (should be localhost only)

### Diagnostic Steps

#### Step 1: Check PostgreSQL Status
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Or with pg_isready
pg_isready -h localhost -p 5432 -U postgres
```

**Expected:** "accepting connections"

#### Step 2: Check Database Proxy Status
```bash
pm2 status
# Should show db-proxy as "online"

pm2 logs db-proxy --lines 50
# Should show "Database proxy listening on 0.0.0.0:3000"
```

#### Step 3: Test Local Database Connection
```bash
# As root on Vultr
sudo -u postgres psql -d callmeback -c "SELECT COUNT(*) FROM users;"

# Or as specific user
sudo -u postgres psql -d callmeback -U cmb_user
# (Will prompt for password, check .env file)
```

**Expected:** Query succeeds, returns row count

#### Step 4: Test Database Proxy from Local Machine
```bash
# Get API key
cat .admin-token  # or appropriate env var

# Test proxy endpoint
curl -H "Authorization: Bearer $(cat .admin-token)" \
  "https://db.ai-tools-marketplace.io/health"

# Test actual query
curl -H "Authorization: Bearer $(cat .admin-token)" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT * FROM personas LIMIT 1"}' \
  "https://db.ai-tools-marketplace.io/query"
```

#### Step 5: Check Authorization Header Format
**Problem:** 401 Unauthorized from database proxy

**Cause:** Wrong authorization format or invalid key

**Correct Format:**
```
Authorization: Bearer <API_KEY>
```

**Wrong Formats:**
```
X-API-Key: <API_KEY>                 # ❌ Wrong header name
Bearer <API_KEY> (no "Authorization") # ❌ Missing header name
Authorization: <API_KEY>              # ❌ Missing "Bearer" prefix
```

#### Step 6: Check PM2 Environment Variable Pollution
**Problem:** After deploying new service, OTHER services start failing with "password authentication failed"

**Cause:** PM2 ecosystem.config.js using `require('dotenv').config()` pollutes global environment

**Check:**
```bash
# Look in ecosystem.config.js files
grep -n "require('dotenv')" /root/*/ecosystem.config.js

# If found, it's the problem!
```

**Fix:**
```javascript
// ❌ WRONG - in ecosystem.config.js
require('dotenv').config();
module.exports = {
  apps: [{...}]
};

// ✅ RIGHT - use env_file (Option 1)
module.exports = {
  apps: [{
    name: 'service-name',
    script: './server.js',
    cwd: '/root/service-name',
    env_file: './.env'  // PM2 loads .env only for this app
  }]
};

// ✅ RIGHT - load in server.js (Option 2)
// In server.js:
require('dotenv').config();
// In ecosystem.config.js: no dotenv!
module.exports = { apps: [{...}] };
```

**Recovery if Already Broken:**
```bash
# 1. Remove require('dotenv') from all ecosystem.config.js files
# 2. Fresh restart
pm2 delete all
cd /opt/vultr-db-proxy && pm2 start ecosystem.config.js
cd /root/log-query-service && pm2 start ecosystem.config.js
cd /root/voice-pipeline && pm2 start ecosystem.config.js

# 3. Verify each service connects
pm2 logs --lines 50 | grep -i "connected\|error"

# 4. Save for reboot
pm2 save
```

### Common Database Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Connection refused" | PostgreSQL not running | `systemctl start postgresql` |
| "Host not found" | Wrong hostname | Check `DATABASE_URL` in `.env` |
| "Password authentication failed" | Wrong password or PM2 pollution | Reset password or fix ecosystem.config.js |
| "Database callmeback does not exist" | Database not created | Run migrations: `./apply-migrations.sh` |
| "Relation 'users' does not exist" | Tables not created | Run migration: `psql -d callmeback -f migrations/*.sql` |
| 401 from database proxy | Wrong API key or auth header | Use `Authorization: Bearer <key>` format |
| Proxy returns 500 | Database query error | Check PM2 logs: `pm2 logs db-proxy` |
| Persona not found | Persona not in database | Seed database: `INSERT INTO personas...` |

---

## 4. Deployment Failures

**Symptom:** Deployment hangs, fails with error, or services not updating

### Quick Checklist

- [ ] **Check current deployment status** - `raindrop build status --application call-me-back`
- [ ] **No chained commands** - Never run `generate && deploy` together
- [ ] **Reset secrets after generate** - Always run `./set-all-secrets.sh`
- [ ] **Check git status** - No uncommitted changes blocking deploy
- [ ] **Verify Raindrop connection** - `raindrop build status` responds
- [ ] **One deploy at a time** - Wait for previous to finish

### Diagnostic Steps

#### Step 1: Check Deployment Status
```bash
raindrop build status --application call-me-back
```

**Expected:**
```
✅ call-me-back: version xyz - CONVERGED
  Handler: api-gateway (converged)
  Handler: voice-pipeline (converged)
  ...
```

**Problems:**
```
⏳ PENDING        # Deployment in progress, wait
❌ FAILED        # Deployment failed, check logs
⚠️ PARTIAL       # Some handlers failed
```

#### Step 2: Check Raindrop Logs
```bash
raindrop logs tail -f --application call-me-back
```

**Look for errors:**
```
❌ ERROR
❌ Failed
❌ 500
❌ timeout
```

#### Step 3: Identify Which Handler Failed
```bash
# If deployment failed:
raindrop build status --application call-me-back | grep -E "❌|⚠️"

# Check specific handler logs
raindrop logs tail -n 100 --application call-me-back | grep -i "api-gateway\|voice-pipeline\|auth"
```

#### Step 4: Check if in Sandbox Mode
```bash
# Check Raindrop config
cat .raindrop/config.json | grep sandbox

# If sandbox is enabled:
rm -f .raindrop/sandbox
raindrop build deploy
```

#### Step 5: Verify Secrets Not Wiped
```bash
# List environment variables
raindrop build env list --application call-me-back | grep -i "DEEPGRAM\|ELEVENLABS\|TWILIO\|JWT"

# If missing, restore them:
./set-all-secrets.sh
```

### Common Deployment Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Deployment stuck >10 min | Previous deploy still running | Wait or `raindrop build status` to check |
| "Environment variable not found" | Secrets wiped by `generate` | Run `./set-all-secrets.sh` |
| 400 Bad Request errors | Manifest syntax error | Check `raindrop.manifest` for typos |
| Deployed but services offline | In sandbox mode | `rm -f .raindrop/sandbox && deploy` |
| Frontend not updating | Vercel not tied to git | Deploy manually: `vercel --prod` |
| "Too many requests" | Rate limited by Raindrop | Wait 1-2 minutes before retrying |
| Git merge conflicts | Modified protected files | Resolve conflicts before deploy |

### Deployment Checklists

**Standard Deployment (No Manifest Changes):**
```bash
1. [ ] Make code changes
2. [ ] raindrop build deploy
3. [ ] Wait for deployment to complete
4. [ ] raindrop logs tail to verify
5. [ ] Test endpoint
```

**With Manifest Changes (New env var, service, etc):**
```bash
1. [ ] Edit raindrop.manifest
2. [ ] raindrop build generate
3. [ ] Wait 30 seconds for secrets to be wiped
4. [ ] ./set-all-secrets.sh
5. [ ] raindrop build deploy
6. [ ] Wait for deployment to complete
7. [ ] raindrop logs tail to verify
8. [ ] Test endpoint
```

**Frontend Deployment (Separate):**
```bash
1. [ ] Make code changes in src/
2. [ ] vercel --prod (NOT git push!)
3. [ ] Wait for deployment URL
4. [ ] Test the deployed URL
```

**Vultr Service Deployment:**
```bash
1. [ ] cd voice-pipeline-nodejs
2. [ ] ./deploy.sh (or scp + npm install)
3. [ ] pm2 logs voice-pipeline --lines 50
4. [ ] Verify audio working in test call
```

---

## 5. WebSocket Connection Problems

**Symptom:** WebSocket fails to connect, closes immediately, or events don't fire

### Quick Checklist

- [ ] **Verify endpoint accessibility** - `curl https://voice.ai-tools-marketplace.io/health`
- [ ] **Check Caddy reverse proxy** - `sudo systemctl status caddy` on Vultr
- [ ] **Verify WebSocket protocol** - Browser console shows correct `wss://` URLs
- [ ] **Check firewall rules** - Port 443 open on Vultr
- [ ] **Test WebSocket with curl** - `curl --include \ -H "Connection: Upgrade" ...`
- [ ] **Check DNS resolves** - `dig voice.ai-tools-marketplace.io`

### Diagnostic Steps

#### Step 1: Check Endpoint Accessibility
```bash
# Test from local machine
curl -i https://voice.ai-tools-marketplace.io/health

# Should return: 200 OK
```

**If timeout or refused:**
- Endpoint not accessible - check Caddy, firewall, DNS

#### Step 2: Check Caddy Status
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249

# Check if running
sudo systemctl status caddy

# Check Caddy logs for errors
sudo journalctl -u caddy -n 100 | grep -i "error\|certificate\|refused"

# Validate Caddyfile
caddy validate --config /etc/caddy/Caddyfile
```

#### Step 3: Check WebSocket Route Configuration
```bash
# View Caddy configuration
sudo cat /etc/caddy/Caddyfile | grep -A 5 "voice.ai-tools"

# Should show:
# voice.ai-tools-marketplace.io {
#     reverse_proxy localhost:8080
# }
```

#### Step 4: Check Voice Pipeline Listening
```bash
# Check if service listening on port 8080
netstat -tuln | grep 8080

# Expected:
# tcp    0    0 127.0.0.1:8080    0.0.0.0:*    LISTEN
```

**If not listening:**
- Service not running: `pm2 restart voice-pipeline`
- Wrong port: Check voice-pipeline code and ecosystem.config.js

#### Step 5: Check DNS Resolution
```bash
# Verify DNS points to server
dig voice.ai-tools-marketplace.io

# Should show:
# voice.ai-tools-marketplace.io. 300 IN A 144.202.15.249
```

**If wrong or missing:**
- Update DNS A record at domain registrar
- Wait for propagation (can take hours)

#### Step 6: Test WebSocket Connection
```bash
# Test WebSocket upgrade request
curl -i \
  -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  "https://voice.ai-tools-marketplace.io/stream"

# Should return: 101 Switching Protocols
# If returns: 400, 404, 500 - check voice-pipeline handler
```

### WebSocket Event Listener Issues

**Problem:** WebSocket connects but events don't fire

**Affects:** Only Cloudflare Workers version (current version uses Node.js which doesn't have this issue)

**For Reference - The Cloudflare Workers Issue:**
```typescript
// ❌ WRONG - Event listeners might not fire
const [client, server] = Object.values(pair);
server.accept();

// Add listeners AFTER accept
server.addEventListener('message', handleMessage);
server.addEventListener('close', handleClose);

return new Response(null, { status: 101, webSocket: client });

// ❌ WRONG - Return too early
setTimeout(() => {
  server.addEventListener('message', handleMessage);
}, 100);  // Too late, events already lost

// ✅ RIGHT - Listeners added BEFORE response returns
const [client, server] = Object.values(pair);
server.accept();

// Add listeners SYNCHRONOUSLY, immediately
server.addEventListener('message', handleMessage);
server.addEventListener('close', handleClose);

// Now return
return new Response(null, { status: 101, webSocket: client });
```

**Key Finding:** Cloudflare Workers WebSocket events only fire if listeners are added in the same execution context before returning the 101 response. This is why the voice pipeline was moved to Node.js on Vultr.

### Common WebSocket Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Connection refused" | Endpoint not accessible | Check Caddy, firewall, DNS |
| "Certificate error" | SSL certificate issue | Check Caddy logs: `journalctl -u caddy` |
| "WebSocket handshake failed" | Not a WebSocket endpoint or wrong path | Verify path and handler code |
| Connection closes after 1 second | Voice pipeline handler not accepting | Add `server.accept()` in handler |
| "101 Switching Protocols" but no events | Event listeners not firing (Workers only) | Add listeners before response return |
| DNS not resolving | DNS A record not set | Add A record pointing to 144.202.15.249 |
| "Host not found" | DNS propagation pending | Wait 1-2 hours for propagation |

---

## Tools & Commands

### Raindrop CLI
```bash
# Deployment
raindrop build deploy                        # Deploy all changes
raindrop build status --application cmb     # Check deployment status
raindrop build generate                     # Regenerate types (wipes secrets!)
raindrop build start --branch feature       # Create feature branch

# Logs
raindrop logs tail -f --application cmb     # Follow logs in real-time
raindrop logs tail -n 100 --application cmb # Last 100 lines
raindrop logs tail | grep -i "error"        # Filter for errors

# Environment
raindrop build env list --application cmb   # List env variables
raindrop build env set env:KEY "value"      # Set single env var
./set-all-secrets.sh                        # Set all secrets at once
```

### Vultr SSH Commands
```bash
# Connect to server
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249

# Process management
pm2 status                    # List all processes
pm2 logs <service> --lines 50 # View recent logs
pm2 restart <service>         # Restart service
pm2 stop <service>            # Stop service
pm2 delete <service>          # Remove from PM2
pm2 save                      # Persist processes across reboot

# Service diagnostics
netstat -tuln | grep <port>   # Check if port is listening
curl localhost:<port>/health  # Test local endpoint
```

### Database
```bash
# Connect to PostgreSQL
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
sudo -u postgres psql -d callmeback

# Common queries
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM calls;
SELECT COUNT(*) FROM personas;
SELECT * FROM personas LIMIT 5;

# Backup and restore
sudo -u postgres pg_dump callmeback > backup.sql
sudo -u postgres psql callmeback < backup.sql

# Exit psql
\q
```

### Frontend Deployment
```bash
# Deploy to production
vercel --prod

# List deployments
vercel ls

# Preview deployment (not production)
vercel
```

### Testing
```bash
# Test API endpoint with auth
curl -H "Authorization: Bearer $(cat .admin-token)" \
  "https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/personas"

# Test Vultr service
curl -H "Authorization: Bearer $(cat .admin-token)" \
  "https://db.ai-tools-marketplace.io/health"

# WebSocket test
curl -i \
  -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  "https://voice.ai-tools-marketplace.io/stream"
```

---

## Common Patterns

### Pattern 1: "Authorization: Bearer" vs "X-API-Key"
**Database Proxy:** Uses `Authorization: Bearer <key>`
**Wrong:** `X-API-Key: <key>`

```bash
# CORRECT
curl -H "Authorization: Bearer ABC123" \
  https://db.ai-tools-marketplace.io/query

# WRONG
curl -H "X-API-Key: ABC123" \
  https://db.ai-tools-marketplace.io/query
```

### Pattern 2: XML Escaping in TwiML
**Problem:** Raw ampersands in URLs break TwiML parsing

**Wrong:**
```xml
<Stream url="wss://example.com?a=1&b=2" />
```

**Correct:**
```xml
<Stream url="wss://example.com?a=1&amp;b=2" />
```

### Pattern 3: WebSocket Event Listener Timing (Cloudflare Workers)
Event listeners MUST be added before returning response.

```typescript
// WRONG - Listeners added after response
server.accept();
return new Response(null, { status: 101, webSocket: client });
server.addEventListener('message', handler);  // Never fires!

// CORRECT - Listeners added before response
server.accept();
server.addEventListener('message', handler);  // Will fire
return new Response(null, { status: 101, webSocket: client });
```

### Pattern 4: Deepgram Connection Ready State
Before sending audio to Deepgram, ensure WebSocket is fully open.

```javascript
// WRONG - Audio sent before connection ready
connectDeepgram();
handleAudio(data);  // Error: readyState 0 (CONNECTING)

// CORRECT - Wait for open event
let isDeepgramReady = false;
deepgramWs.addEventListener('open', () => {
  isDeepgramReady = true;
});

// Only when ready:
if (isDeepgramReady) {
  deepgramWs.send(audioData);
}
```

### Pattern 5: Timeout Protection for Long Operations
Add timeouts to prevent calls from hanging indefinitely.

```javascript
// Turn evaluation timeout
const result = await Promise.race([
  evaluateTurn(userText),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 5000)
  )
]).catch(err => 'RESPOND');  // Default action

// AI response timeout
const response = await Promise.race([
  generateResponse(transcript),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 10000)
  )
]).catch(err => 'Sorry, I took too long to respond.');
```

### Pattern 6: Database Connection Verification
Always test local connection before external.

```bash
# Step 1: Local connection (on Vultr)
sudo -u postgres psql -d callmeback -c "SELECT 1;"

# Step 2: Through db-proxy locally (on Vultr)
curl localhost:3000/health

# Step 3: Through db-proxy externally
curl https://db.ai-tools-marketplace.io/health

# Step 4: Actual query through proxy
curl -H "Authorization: Bearer $KEY" \
  https://db.ai-tools-marketplace.io/query \
  -d '{"sql":"SELECT 1"}'
```

### Pattern 7: Service Health Check
Always verify services running and listening:

```bash
# 1. Check PM2 status
pm2 status

# 2. Check listening ports
netstat -tuln | grep -E "3000|3001|8080|5432"

# 3. Check actual endpoint
curl -i https://<domain>/health

# 4. Check service logs for errors
pm2 logs <service> --lines 100 | grep -i error
```

### Pattern 8: Verifying Persona Data Loads
Check that persona metadata flows through the system:

```bash
# 1. Check database has persona
sudo -u postgres psql -d callmeback -c \
  "SELECT id, name, voice_id FROM personas WHERE name='Brad';"

# 2. Check voice pipeline logs for fetch
pm2 logs voice-pipeline | grep -i "persona\|metadata"

# 3. Verify response in logs
# Should show: "Persona data: name=Brad, voice_id=..."

# 4. If fails, check database proxy logs
pm2 logs db-proxy | grep -i "error\|401\|500"
```

---

## Debugging Workflow Summary

### Quick Start (Most Common Issues)
1. Check what's failing: "Call won't connect" vs "No audio" vs "Database error"
2. Find the right section above (1-5)
3. Run "Step 1" diagnostic
4. If still unclear, check "Common Issues & Fixes" table
5. Check service logs: `pm2 logs <service>`
6. Check Raindrop logs: `raindrop logs tail`

### When Stuck
1. Search for your error message in this document
2. Check the "Common Patterns" section
3. Verify all services running: `pm2 status` on Vultr
4. Verify secrets set: `raindrop build env list`
5. Check recent deployment: `raindrop build status`
6. Review the architecture: Is issue in frontend, Raindrop, or Vultr?

### Where Issues Live
- **Frontend not loading:** Vercel deployment or API URL env var
- **API endpoints failing:** Raindrop services, secrets, or manifests
- **Call won't connect:** Twilio TwiML, Raindrop routing, or Vultr voice-pipeline
- **Audio issues:** Voice pipeline (Vultr), Deepgram, or ElevenLabs
- **Database errors:** PostgreSQL, db-proxy, or API key
- **Deployment hanging:** Previous deployment still running or command chaining

---

**Sources:** Consolidated from:
- WEBSOCKET_DEBUGGING_PROCEDURE.md
- CALL_FLOW_DEBUGGING.md
- TROUBLESHOOTING_VULTR_CONNECTIVITY.md
- VOICE_PIPELINE_DEBUG_FINDINGS.md
- MCP_DEBUGGING_SESSION_2025-11-19.md
- deployment.md (Debugging sections)
- vultr.md (Troubleshooting sections)

**Related Documents:** See also:
- [voice-pipeline.md](voice-pipeline.md) - Voice pipeline architecture
- [vultr.md](vultr.md) - Vultr VPS operations
- [deployment.md](deployment.md) - Deployment procedures
- [database.md](database.md) - Database operations
