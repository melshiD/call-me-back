# Voice Pipeline Debug Findings (2025-11-18)

## Issues Discovered

### 1. Database Authorization Failure (CRITICAL)

**Symptom**: Voice pipeline logs show "Fetching persona metadata for brad_001..." but never logs success or failure. DB proxy logs show "POST /query 401" errors.

**Root Cause**: Wrong authorization header format.

**Current Code** (voice-pipeline-nodejs/index.js:81-85):
```javascript
const response = await fetch(`${env.VULTR_DB_API_URL}/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': env.VULTR_DB_API_KEY  // ❌ WRONG HEADER
  },
```

**Required Fix**: Change to `Authorization: Bearer {token}` format based on DB proxy logs showing 401 unauthorized errors.

### 2. Persona Data Not Loading

**Symptom**: Bot always uses "Brad" voice and default prompts, never custom persona data.

**Root Causes**:
1. Database authorization failing (see issue #1)
2. May not have persona records in database yet
3. No logging of database response to debug

**Required Fixes**:
1. Fix authorization header (issue #1)
2. Add detailed logging of database responses
3. Seed database with persona data if missing

### 3. Call Stops After 2-3 Exchanges

**Symptom**: User says "what are you guys up to" → silence → call ends with "Received STOP message from Twilio"

**Possible Causes**:
1. Silence detection evaluating turn but not responding
2. Deepgram WebSocket in CONNECTING state when receiving audio (errors show "readyState 0")
3. Bot taking too long to respond, Twilio times out

**Observed from Logs**:
```
[VoicePipeline CA549addd452977730ce0c311d87176a8b] User said: oh well what are you guys up to
[VoicePipeline CA549addd452977730ce0c311d87176a8b] Silence detected: 1199ms
[VoicePipeline CA549addd452977730ce0c311d87176a8b] User said: what are you guys up to
[VoicePipeline CA549addd452977730ce0c311d87176a8b] Silence detected: 1199ms
[Voice Pipeline] Received STOP message from Twilio
```

No turn evaluation triggered, no response generated. Bot is stuck waiting.

**Required Fixes**:
1. Fix Deepgram connection timing - ensure it's fully connected before forwarding audio
2. Add timeout protection - if no response after X seconds, speak something
3. Better error handling when evaluating turns fails

### 4. SmartMemory Not Implemented

**Symptom**: `smart_memory` column exists in database but we're not using Raindrop's SmartMemory API properly.

**Current Implementation**: Database column `user_persona_relationships.smart_memory` (TEXT)

**Question**: Should we be using Raindrop's SmartMemory resource/API instead of a database column?

**Raindrop SmartMemory Tools Available**:
- `mcp__raindrop-mcp__put-memory`
- `mcp__raindrop-mcp__get-memory`
- `mcp__raindrop-mcp__search-memory`
- `mcp__raindrop-mcp__summarize-memory`

**Decision Needed**:
- Option A: Keep using database TEXT column for simple smart_memory storage
- Option B: Migrate to Raindrop SmartMemory API for better AI-powered memory
- Option C: Hybrid - use both (DB for static config, Raindrop for dynamic memories)

### 5. Deepgram WebSocket Not Ready

**Symptom**: Errors show "WebSocket is not open: readyState 0 (CONNECTING)" when trying to send audio to Deepgram.

**Root Cause**: Audio from Twilio is being forwarded to Deepgram before the WebSocket connection is fully established.

**Current Flow**:
```
1. Twilio connects (WebSocket ready)
2. Voice pipeline start() called
3. fetchPersonaMetadata() - async
4. connectDeepgram() - async (returns promise when 'open' event fires)
5. connectElevenLabs() - async
6. speak() sends greeting
7. Audio starts flowing from Twilio
8. handleTwilioMedia() tries to send to Deepgram
9. ❌ ERROR: Deepgram WebSocket not ready yet
```

**Required Fix**: Don't mark services as "connected" until WebSocket is fully open. Add readiness checks.

## Recommended Fixes (Priority Order)

### Priority 1: Fix Database Authorization (IMMEDIATE)

Change header from `'X-API-Key'` to `'Authorization': 'Bearer ${env.VULTR_DB_API_KEY}'`

### Priority 2: Add Debug Logging (IMMEDIATE)

Add comprehensive logging in `fetchPersonaMetadata()`:
- Log full database response
- Log parsed persona data
- Log any errors with full stack traces

### Priority 3: Fix Deepgram Connection Timing (HIGH)

Ensure Deepgram WebSocket is fully connected before accepting Twilio audio:
- Add connection state tracking
- Buffer audio if Deepgram not ready
- Add reconnection logic

### Priority 4: Fix Turn Detection Hang (HIGH)

Add timeout protection:
- If turn evaluation takes >  5 seconds, log error and use default RESPOND
- If no AI response after 10 seconds, speak fallback message

### Priority 5: Seed Database with Personas (MEDIUM)

Create initialization script to seed:
- Default personas (Brad, Sarah, etc.)
- Test user_persona_relationships
- Sample smart_memory data

### Priority 6: Clarify SmartMemory Strategy (MEDIUM)

Document decision on how to use SmartMemory:
- If using DB column: Document format and usage
- If using Raindrop API: Implement integration
- If hybrid: Document when to use which

## Next Steps

1. Apply Priority 1-2 fixes immediately
2. Deploy and test
3. Check logs to confirm persona loading works
4. Apply Priority 3-4 fixes
5. Test call flow end-to-end
6. Document SmartMemory strategy
7. Seed database with test data
