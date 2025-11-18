# Voice Pipeline Debugging & Tasks

**Created:** 2025-11-18
**Status:** In Progress

---

## Current Focus: Get Personas Working End-to-End

### ✅ Completed Tasks

1. **Fixed database authorization header** (voice-pipeline-nodejs/index.js:85)
   - Changed from `'X-API-Key'` to `'Authorization': 'Bearer ${env.VULTR_DB_API_KEY}'`
   - Added comprehensive debug logging to fetchPersonaMetadata()

2. **Confirmed database has personas**
   - Brad (brad_001) - Coach persona
   - Sarah (sarah_001) - Friend persona
   - Alex (alex_001) - Creative persona
   - 6 user-persona relationships exist

3. **Researched SmartMemory integration**
   - Decided on hybrid approach: DB column for static context + SmartMemory API for dynamic intelligence
   - Documented 4 memory systems: Working, Episodic, Semantic, Procedural

4. **Deployed fixes to Vultr**
   - Voice pipeline successfully deployed with authorization fix

5. **Fixed overly verbose personas** (2025-11-18)
   - Initially reduced max_tokens from 150 to 40 (voice-pipeline-nodejs/index.js:607)
   - Added strict brevity instruction to system prompt (voice-pipeline-nodejs/index.js:584)
   - Eliminated stage directions like "(laughs)" from phone conversations
   - Deployed to production

6. **Removed auto-greeting and made AI params admin-configurable** (2025-11-18)
   - Removed hardcoded greeting "Hey! Sorry it took me a minute to get to you!" (voice-pipeline-nodejs/index.js:164)
   - User now speaks first to start conversation naturally
   - Made max_tokens and temperature configurable from admin panel (voice-pipeline-nodejs/index.js:88-95, 119-121, 616-617)
   - Voice pipeline now fetches AI params from personas table instead of hardcoding
   - Default values: max_tokens: 70 (prevents mid-sentence truncation), temperature: 0.7
   - Deployed to production

---

## 🔥 Active Tasks (In Progress)

### Task 1: Fix Persona Selection Flow ✅ COMPLETED

**Problem:** API Gateway hardcoded `brad_001` instead of using selected persona

**Solution:** Pass persona and callPretext via query params in Twilio answer URL

**Steps:**
1. ✅ Identified the issue (lines 128-132 in api-gateway/index.ts)
2. ✅ Updated call-orchestrator to include persona and callPretext in answer URL
3. ✅ Updated API Gateway to read persona and callPretext from query params
4. ✅ Updated frontend calls store to accept and send callPretext
5. ✅ Deployed all services
6. ⏳ Test with Sarah persona
7. ⏳ Test with Alex persona

**Files modified:**
- `src/call-orchestrator/index.ts` (lines 10-17, 75-86: Added callPretext param, use URLSearchParams)
- `src/api-gateway/index.ts` (lines 128-132: Extract from URL params, 768-774: Accept callPretext, 829-844: Pass to orchestrator)
- `src/stores/calls.js` (lines 209-228: Accept callPretext param, send in API request)

**Changes deployed:** 2025-11-18 (all services converged)

---

## 📋 Upcoming Tasks (Prioritized)

### Priority 1: Fix Deepgram WebSocket Connection Timing

**Problem:** Audio forwarded before Deepgram WebSocket fully connected (readyState 0 errors)

**Solution:**
- Add connection state tracking
- Buffer audio if Deepgram not ready
- Wait for WebSocket OPEN event before forwarding audio

**Files:** `voice-pipeline-nodejs/index.js`

---

### Priority 2: Add Timeout Protection for Turn Detection

**Problem:** Calls stop after 2-3 exchanges when turn evaluation hangs

**Solution:**
- Add 5-second timeout for turn evaluation
- Add 10-second timeout for AI response generation
- Add fallback responses if timeouts occur

**Files:** `voice-pipeline-nodejs/index.js`

---

### Priority 3: Add Phone Numbers to User Profile

**Goal:** Allow users to configure multiple phone numbers, select which to call

**Steps:**
1. Create database migration to add `phone_numbers` JSONB column to `users` table
2. Update frontend Settings page to manage phone numbers
3. Update frontend "Request Call" to show phone number dropdown (if multiple) or auto-select (if one)
4. Update `/api/calls/trigger` to accept `phoneNumber` from frontend

**Files to create/modify:**
- `migrations/007_add_user_phone_numbers.sql`
- Frontend: `src/views/Settings.vue` (or similar)
- Frontend: Call trigger component
- Already accepts phoneNumber in trigger endpoint ✅

---

### Priority 4: Implement SmartMemory Integration

**Goal:** Use Raindrop SmartMemory API for conversation intelligence

**Architecture:**
- **Database `smart_memory` column**: Static relationship context (JSON)
- **SmartMemory API**: Dynamic conversation memory

**Implementation phases:**

**Phase 1: Working Memory (Session)**
```javascript
// voice-pipeline start()
const sessionId = await startSession();
this.smartMemorySession = sessionId;

// Load static context from DB
const relationshipContext = persona.smart_memory;
await putMemory(sessionId, relationshipContext);
```

**Phase 2: Fact Extraction (Semantic Memory)**
```javascript
// After each conversation turn
const facts = extractFacts(userMessage);
await putMemory(sessionId, facts, { key: 'semantic' });
```

**Phase 3: Conversation History (Episodic Memory)**
```javascript
// Search past conversations for context
const pastContext = await searchMemory(sessionId, userMessage.topic);
// Include in AI prompt
```

**Phase 4: Behavior Patterns (Procedural Memory)**
```javascript
// After call ends
const summary = await summarizeMemory(sessionId);
// Store key patterns for next call
```

**Files:**
- `voice-pipeline-nodejs/index.js` (add SmartMemory calls)
- Migration to add `smart_memory` column to `user_persona_relationships`

**MCP Tools to use:**
- `mcp__raindrop-mcp__start-session`
- `mcp__raindrop-mcp__put-memory`
- `mcp__raindrop-mcp__get-memory`
- `mcp__raindrop-mcp__search-memory`
- `mcp__raindrop-mcp__summarize-memory`
- `mcp__raindrop-mcp__end-session`

---

## 🐛 Known Issues

### Issue 1: Database Authorization (FIXED ✅)
- **Status:** Fixed in latest deployment
- **Logs may show old 401 errors** from before fix was deployed

### Issue 2: Calls Stop After 2-3 Exchanges
- **Symptom:** User says something → Silence → Call ends with STOP
- **Root cause:** Turn detection hanging, no timeout protection
- **Fix:** Priority 2 task above

### Issue 3: Deepgram WebSocket Timing
- **Symptom:** "WebSocket is not open: readyState 0 (CONNECTING)"
- **Root cause:** Audio sent before connection established
- **Fix:** Priority 1 task above

### Issue 4: Personas Too Verbose (FIXED ✅)
- **Symptom:** Personas "going ON and ON" with long monologues and stage directions like "(laughs to self)"
- **Root cause:** max_tokens: 150 was too high for natural phone conversations
- **Fix:** Now configurable from admin panel (default: 70 tokens) + added brevity instruction to system prompt
- **Status:** Fixed in latest deployment (2025-11-18)

### Issue 5: Auto-Greeting Prevents User from Starting Conversation (FIXED ✅)
- **Symptom:** Call immediately says "Hey! Sorry it took me a minute to get to you!" before user can speak
- **Root cause:** Hardcoded greeting in voice pipeline start() method
- **Fix:** Removed auto-greeting; call now waits for user to say "Hello" first
- **Status:** Fixed in latest deployment (2025-11-18)

### Issue 6: Token Limit Truncating Responses Mid-Sentence (FIXED ✅)
- **Symptom:** AI responses cut off mid-sentence when max_tokens too low
- **Root cause:** max_tokens: 40 was too restrictive after fixing verbosity
- **Fix:** Increased default to 70 tokens, made configurable from admin panel per persona
- **Status:** Fixed in latest deployment (2025-11-18)

---

## 📊 Testing Checklist

### Persona Testing
- [ ] Trigger call with Brad → Verify Brad's voice and system prompt
- [ ] Trigger call with Sarah → Verify Sarah's voice and system prompt
- [ ] Trigger call with Alex → Verify Alex's voice and system prompt
- [ ] Verify persona loads from database (not hardcoded)
- [ ] Check logs for successful persona fetch

### Multi-turn Conversation Testing
- [ ] Have 5+ back-and-forth exchanges
- [ ] Verify call doesn't hang/stop prematurely
- [ ] Check turn detection works correctly
- [ ] Verify AI responses are timely

### SmartMemory Testing (After Implementation)
- [ ] Make first call → Add personal facts
- [ ] Make second call → Verify persona remembers facts
- [ ] Check Working Memory session created
- [ ] Check Semantic Memory stores facts
- [ ] Check Episodic Memory recalls past conversations

---

## 🔍 Debugging Commands

### Check Voice Pipeline Logs
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 50'
```

### Check API Gateway Logs
```bash
raindrop logs tail -n 50 -f --application call-me-back
```

### Check Database Personas
```bash
curl -X POST https://db.ai-tools-marketplace.io/query \
  -H "Authorization: Bearer $VULTR_DB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT id, name, default_voice_id FROM personas"}'
```

### Test Voice Pipeline Health
```bash
curl https://voice.ai-tools-marketplace.io/health
```

---

## 📝 Notes

- **Voice Pipeline URL:** `wss://voice.ai-tools-marketplace.io/stream`
- **API Gateway URL:** `https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run`
- **Database Proxy URL:** `https://db.ai-tools-marketplace.io`

- **Personas live in:** Vultr PostgreSQL
- **SmartMemory will use:** Raindrop SmartMemory API
- **Voice pipeline runs on:** Vultr (Node.js/PM2) - NOT Cloudflare Workers

---

## 🎯 Success Criteria

**Immediate (Current Session):**
- ✅ Database authorization working
- ✅ Persona selection working (Brad/Sarah/Alex)
- ✅ Voice and system prompts load correctly per persona
- ✅ AI parameters (max_tokens, temperature) configurable from admin panel
- ✅ Auto-greeting removed; user starts conversation naturally

**Short-term (Next Session):**
- Multi-turn conversations working (5+ exchanges)
- No premature call termination
- Deepgram connection stable

**Medium-term:**
- Phone number management in user profiles
- SmartMemory integration Phase 1 (Working Memory)
- Call history with persona-specific memory

**Long-term:**
- Full SmartMemory integration (all 4 memory systems)
- Persona learns and adapts over multiple calls
- Rich conversation context across sessions
