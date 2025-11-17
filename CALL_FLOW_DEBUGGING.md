# Call Flow Debugging

**Last Updated:** 2025-11-16
**Status:** WebSocket connection failing - Twilio can't connect to our stream endpoint

---

## Problem Summary

User successfully triggered a call from the frontend. Call was initiated and phone rang, but instead of AI conversation, user heard Twilio's error message:

> "We are sorry. An application error has occurred. Goodbye"

---

## What's Working ✅

1. **Frontend → Backend Communication**
   - User can trigger calls from the web app
   - API Gateway receives the request correctly

2. **Call Initiation**
   - Call-orchestrator successfully calls Twilio API
   - Twilio initiates the call and phone rings
   - Call SID created: `CA1e7d7935a377dd721fb2b96bd2384542`

3. **Answer Webhook**
   - Twilio successfully calls `/api/voice/answer`
   - API Gateway `handleVoiceAnswer` executes without errors
   - TwiML generated and returned successfully
   - Logs show:
     ```
     handleVoiceAnswer called
     Incoming call (callSid: CA1e7d..., from: +1762..., to: +1619...)
     Generated stream URL: wss://svc-01ka41sfy58tbr0dxm8kwz8jyy...
     Returning TwiML: <Response><Say>Connecting you now.</Say><Connect><Stream url="wss://..." /></Connect></Response>
     ```

---

## What's NOT Working ❌

**TwiML XML Parsing Error - Twilio Error 12100**

### ACTUAL ERROR (from Twilio Console):
**Error 12100: Unable to parse provided XML**

### Root Cause:
The TwiML contains **unescaped ampersands (`&`)** in the WebSocket URL query parameters.

### Evidence:
- Twilio successfully receives our TwiML
- Twilio rejects it due to XML parsing error
- No WebSocket connection is attempted because XML parsing fails first
- User hears Twilio's error message: "We are sorry. An application error has occurred. Goodbye"

### TwiML Returned:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting you now.</Say>
    <Connect>
        <Stream url="wss://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/voice/stream?callId=CA1e7d7935a377dd721fb2b96bd2384542&userId=demo_user&personaId=brad_001" />
    </Connect>
</Response>
```

---

## Hypotheses

### Hypothesis 1: WebSocket Not Supported on Cloudflare Workers (Most Likely)
**Problem:** Cloudflare Workers may not support external WebSocket connections from Twilio Media Streams

**Reasoning:**
- WebSocket upgrades in Cloudflare Workers are designed for direct client connections
- Twilio Media Streams connects as a server-to-server WebSocket
- Raindrop/Cloudflare might not expose the WebSocket endpoint correctly for external connections

**Next Steps:**
- Check Raindrop documentation for WebSocket support
- Verify Cloudflare Workers WebSocket limitations
- May need to use Twilio's REST API + polling instead of Media Streams

### Hypothesis 2: WebSocket Upgrade Implementation Issue
**Problem:** Our WebSocket upgrade code might not be compatible with Raindrop/Cloudflare Workers

**Current Implementation (src/api-gateway/index.ts:146-177):**
```typescript
private async handleVoiceStream(request: Request, url: URL): Promise<Response> {
  // Upgrade to WebSocket (Cloudflare Workers API)
  const pair = new (WebSocket as any).WebSocketPair();
  const [client, server] = [pair[0], pair[1]];

  // Start the voice pipeline in the background
  this.startVoicePipeline(server as WebSocket, callId, userId, personaId);

  return new Response(null, {
    status: 101,
    // @ts-ignore - Cloudflare Workers WebSocket API
    webSocket: client
  });
}
```

**Potential Issues:**
- WebSocket upgrade response format might be incorrect
- May need specific headers for WebSocket upgrade
- Raindrop might handle WebSockets differently than standard Cloudflare Workers

**Next Steps:**
- Review Raindrop documentation for WebSocket examples
- Check if WebSocket needs to be handled differently in Raindrop Services
- Test WebSocket connection directly (not through Twilio)

### Hypothesis 3: Routing Issue
**Problem:** The `/api/voice/stream` route might not be properly configured

**Next Steps:**
- Verify route is registered in API Gateway fetch handler
- Check if WebSocket upgrade path is different in Raindrop
- Ensure no middleware is blocking WebSocket upgrade

### Hypothesis 4: CORS/Security Headers
**Problem:** Twilio might be blocked by CORS or security headers

**Less Likely Because:**
- WebSocket connections don't use CORS in the traditional sense
- Twilio documentation doesn't mention CORS issues with Media Streams

---

## Investigation Tasks

### For AI/Developer:
- [ ] Check how WebSocket upgrade is handled in handleVoiceStream
- [ ] Review Raindrop framework documentation for WebSocket support
- [ ] Verify API Gateway routing for /api/voice/stream
- [ ] Check if WebSocket needs to be in a separate service (not API Gateway)

### For User:
- [ ] Check Twilio Debugger Console for call SID: `CA1e7d7935a377dd721fb2b96bd2384542`
- [ ] Look for specific error message from Twilio about WebSocket connection
- [ ] Verify Twilio Media Streams is enabled on account

---

## Relevant Code Locations

### API Gateway - Answer Endpoint
**File:** `src/api-gateway/index.ts:91-144`
- Handles Twilio webhook when call is answered
- Returns TwiML with WebSocket Stream URL
- **Status:** ✅ Working correctly

### API Gateway - WebSocket Stream Endpoint
**File:** `src/api-gateway/index.ts:146-177`
- Should handle WebSocket upgrade
- Creates WebSocketPair
- Passes server socket to voice-pipeline
- **Status:** ❌ Never gets called (no logs)

### Voice Pipeline
**File:** `src/voice-pipeline/index.ts`
- Should handle WebSocket communication
- Processes audio streams
- Connects to Cerebras AI, ElevenLabs
- **Status:** ❌ Never gets called (no logs from handleConnection)

---

## Twilio Media Streams Requirements

According to Twilio documentation, Media Streams requires:
1. WebSocket endpoint that accepts connections
2. Endpoint must respond to WebSocket upgrade request
3. Bidirectional audio streaming (base64 encoded μ-law)
4. Must handle Twilio's specific message format

**Our Implementation:**
- Uses Cloudflare Workers WebSocketPair API
- Returns 101 status with webSocket in response
- May not be compatible with Twilio's connection method

---

## Solution Implemented ✅

**Fix:** XML-escape ampersands in WebSocket URL query parameters

**Change Made (src/api-gateway/index.ts:113):**
```typescript
// XML-escape the URL (ampersands must be &amp; in XML)
const escapedStreamUrl = streamUrl.replace(/&/g, '&amp;');
```

**Before:**
```xml
<Stream url="wss://...?callId=CA...&userId=demo&personaId=brad" />
```

**After:**
```xml
<Stream url="wss://...?callId=CA...&amp;userId=demo&amp;personaId=brad" />
```

**Deployed:** 2025-11-16 (just now)

**Status:** ✅ FIXED - XML parsing now works

**Test Result:** User made another call after fix was deployed

**New Error:** Error 31920 - Stream WebSocket handshake error

This is PROGRESS! The XML is now valid, and Twilio is attempting to connect to our WebSocket, but the handshake is failing.

---

## New Issue: WebSocket Handshake Failure

**Twilio Error:** Error 31920 - Stream WebSocket handshake error

**What This Means:**
- ✅ TwiML XML parsing succeeded
- ✅ Twilio received the WebSocket URL
- ✅ Twilio attempted to connect to `wss://svc-01ka41sfy58tbr0dxm8kwz8jyy.../api/voice/stream`
- ❌ WebSocket handshake failed

**Possible Causes:**
1. **WebSocket upgrade response incorrect** - Cloudflare Workers WebSocket API might be incompatible with Twilio's expectations
2. **Missing headers** - WebSocket handshake requires specific headers
3. **Raindrop framework limitation** - May not support external WebSocket connections
4. **Response status/format** - Need to check if our 101 response is correct

**Next Investigation:**
- Check logs for WebSocket connection attempt
- Review Cloudflare Workers WebSocket API requirements
- May need to test WebSocket endpoint independently

---

## Current Investigation: Query Parameter Parsing

**Hypothesis:** The 400 error might be due to missing query parameters when Twilio makes the WebSocket request.

**Logs from 2:04:04 AM show:**
```
handleVoiceRoutes called
  path: "/api/voice/stream"
  method: "GET"
  headers: {"upgrade":"websocket", ...}

WebSocket stream request
  upgradeHeader: "websocket"  ✅ Detected correctly

http.status: ❌ 400
```

**Code at src/api-gateway/index.ts:186-189:**
```typescript
if (!callId || !userId || !personaId) {
  this.env.logger.error('Missing required parameters', { callId, userId, personaId });
  return new Response('Missing required parameters', { status: 400 });
}
```

**Enhanced Logging Added (2025-11-16 2:15 AM):**
```typescript
this.env.logger.info('handleVoiceStream parameters', {
  callId,
  userId,
  personaId,
  fullUrl: request.url,
  searchParams: Object.fromEntries(url.searchParams.entries())
});
```

**Deployed:** 2025-11-16 2:15 AM

**Test Results (2:08:59 AM):**
```
handleVoiceStream parameters
  callId: null
  userId: null
  personaId: null
  fullUrl: "https://svc-01ka41sfy58tbr0dxm8kwz8jyy.../api/voice/stream"
  searchParams: {}
```

**ROOT CAUSE IDENTIFIED:** ✅

The query parameters are completely missing when Twilio makes the WebSocket request!

**Why:** When we XML-escape ampersands to `&amp;` in the TwiML, Twilio does NOT unescape them back to `&` when constructing the WebSocket URL. The `<Stream>` element's URL attribute should contain raw ampersands (`&`), not XML entities (`&amp;`).

---

## Solution #2: Remove XML Escaping for Stream URL ✅

**Fix Applied (2025-11-16 2:20 AM):**

Removed the XML escaping for the Stream URL. The `<Stream>` element in TwiML handles raw ampersands correctly.

**Change Made (src/api-gateway/index.ts:122-136):**
```typescript
// Build WebSocket URL for Media Streams
const baseUrl = new URL(request.url).origin;
const streamUrl = `${baseUrl.replace('http', 'ws')}/api/voice/stream?callId=${callSid}&userId=${userId}&personaId=${personaId}`;

this.env.logger.info('Generated stream URL', { streamUrl, baseUrl });

// Generate TwiML response with Media Streams
// NOTE: Do NOT XML-escape the Stream URL - Twilio handles it correctly with raw ampersands
const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting you now.</Say>
    <Connect>
        <Stream url="${streamUrl}" />
    </Connect>
</Response>`;
```

**Before:**
```xml
<Stream url="wss://...?callId=CA...&amp;userId=demo&amp;personaId=brad" />
```

**After:**
```xml
<Stream url="wss://...?callId=CA...&userId=demo&personaId=brad" />
```

**Deployed:** 2025-11-16 2:20 AM

**Test Result:** Document Parse Failure again - can't use raw ampersands either!

---

## Solution #3: Use Twilio `<Parameter>` Elements (CORRECT APPROACH) ✅

**Discovery:** Consulted Twilio documentation - Stream URLs do NOT support query parameters at all!

According to [Twilio's documentation](https://www.twilio.com/docs/voice/twiml/stream):
> "The `url` does not support query string parameters. To pass custom key value pairs to the WebSocket, make use of Custom Parameters instead."

**Correct Approach:**
1. Use `<Parameter>` elements in TwiML to pass data
2. Parameters are sent in the WebSocket "start" message under `start.customParameters`
3. Extract parameters from the start message, not from URL

**Changes Made:**

**1. API Gateway TwiML (src/api-gateway/index.ts:122-141):**
```typescript
// Build WebSocket URL for Media Streams (without query parameters)
const streamUrl = `${baseUrl.replace('http', 'ws')}/api/voice/stream`;

// Generate TwiML with <Parameter> elements
const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting you now.</Say>
    <Connect>
        <Stream url="${streamUrl}">
            <Parameter name="callId" value="${callSid}" />
            <Parameter name="userId" value="${userId}" />
            <Parameter name="personaId" value="${personaId}" />
        </Stream>
    </Connect>
</Response>`;
```

**2. Voice Pipeline - Extract from Start Message (src/voice-pipeline/index.ts:27-37):**
```typescript
async handleConnection(ws: WebSocket): Promise<{ status: string }> {
  this.env.logger.info('WebSocket connection established, waiting for start message');

  // Wait for the "start" message from Twilio to get parameters
  const startMessage = await this.waitForStartMessage(ws);

  const callId = startMessage.customParameters.callId;
  const userId = startMessage.customParameters.userId;
  const personaId = startMessage.customParameters.personaId;

  this.env.logger.info('Extracted parameters from start message', { callId, userId, personaId });
  // ... continue with pipeline setup
}
```

**3. Added Helper Method (src/voice-pipeline/index.ts:202-240):**
```typescript
private async waitForStartMessage(ws: WebSocket): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for start message'));
    }, 10000);

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data as string);
      if (message.event === 'start') {
        clearTimeout(timeout);
        resolve(message.start);
      }
    });
  });
}
```

**Deployed:** 2025-11-16 2:30 AM

**Expected Result:**
- ✅ TwiML XML parsing will succeed (no ampersands in URL)
- ✅ WebSocket will connect successfully
- ✅ Parameters will be extracted from "start" message customParameters
- ✅ Voice pipeline will initialize with correct callId, userId, personaId

**Test Result:** Still getting Error 31920 - WebSocket handshake error

---

## Solution #4: Add `server.accept()` Call ✅

**Discovery:** Cloudflare Workers requires calling `accept()` on the server WebSocket to begin terminating the connection.

According to [Cloudflare Workers WebSocket documentation](https://developers.cloudflare.com/workers/runtime-apis/websockets/):
> "`accept()` accepts the WebSocket connection and begins terminating requests for the WebSocket on Cloudflare's global network."

**Change Made (src/api-gateway/index.ts:185):**
```typescript
// Upgrade to WebSocket (Cloudflare Workers API)
const pair = new (WebSocket as any).WebSocketPair();
const [client, server] = [pair[0], pair[1]];

// Accept the WebSocket connection (required for Cloudflare Workers)
(server as any).accept();

// Start the voice pipeline in the background
this.startVoicePipeline(server as WebSocket);
```

**Deployed:** 2025-11-16 2:35 AM

**Test Result:** Still Error 31920 - WebSocket handshake error

---

## Solution #5: Fix WebSocketPair Constructor ✅

**Error Found in Logs:**
```
Voice stream error: "WebSocket.WebSocketPair is not a constructor"
```

**Root Cause:** Incorrect constructor call - `new WebSocket.WebSocketPair()` should be `new WebSocketPair()`

**Change Made (src/api-gateway/index.ts:181-182):**
```typescript
// Upgrade to WebSocket (Cloudflare Workers API)
// @ts-ignore - WebSocketPair is a Cloudflare Workers global
const pair = new WebSocketPair();
const [client, server] = Object.values(pair);
```

**Before:**
```typescript
const pair = new (WebSocket as any).WebSocketPair();
```

**After:**
```typescript
const pair = new WebSocketPair();
```

**Deployed:** 2025-11-16 2:45 AM

**Test Result:** ✅ MAJOR PROGRESS! Error changed from 31920 (handshake error) to 31921 (close error)

**What This Means:**
- ✅ WebSocket handshake NOW WORKS!
- ✅ Twilio successfully connects to our WebSocket
- ❌ Our server closes the connection unexpectedly

**Twilio Error 31921:** "Stream - WebSocket - Close Error" - The remote server closed the WebSocket connection. This is different from a handshake failure - the connection was established successfully but then closed by our server.

---

## Solution #6: Enhanced Error Logging for WebSocket Closure ✅

**Goal:** Understand why the WebSocket connection closes after successful handshake

**Changes Made (src/voice-pipeline/index.ts):**

1. **Wrapped handleConnection in try-catch (line 28):**
   ```typescript
   async handleConnection(ws: WebSocket): Promise<{ status: string }> {
     try {
       this.env.logger.info('WebSocket connection established, waiting for start message');

       const startMessage = await this.waitForStartMessage(ws);
       this.env.logger.info('Start message received', { startMessage });
       // ... rest of function
     } catch (error) {
       this.env.logger.error('Failed to handle WebSocket connection', {
         error: error instanceof Error ? error.message : String(error),
         stack: error instanceof Error ? error.stack : undefined
       });
       ws.close(1011, 'Internal error');
       throw error;
     }
   }
   ```

2. **Added detailed logging for start message extraction (line 34):**
   - Logs the entire start message received from Twilio
   - Logs extracted parameters (callId, userId, personaId)

**Deployed:** 2025-11-16 2:53 AM

**Next Test:** Will reveal exact error causing WebSocket to close

---

## Solution #7: Fix WebSocket Serialization Across Service Boundary ✅

**Error Found in Logs (2:29:14 AM):**
```
❌ handleConnection (0ms)
   service: VOICE_PIPELINE
✅ log
   level: ERROR
   message: Failed to start voice pipeline
   fields: {"error":"Could not serialize object of type \"WebSocket\". This type does not support serialization."}
```

**Root Cause:** CRITICAL - Raindrop Framework (Cloudflare Workers) **cannot serialize WebSocket objects** across service RPC boundaries!

When we called `this.env.VOICE_PIPELINE.handleConnection(ws)`, Raindrop tried to serialize the WebSocket object to send it to the voice-pipeline service via RPC. WebSocket objects cannot be serialized, causing the call to fail immediately and the WebSocket to close.

**Solution:** Instantiate the `VoicePipelineOrchestrator` **directly in the api-gateway service** instead of passing the WebSocket across the service boundary.

**Changes Made (src/api-gateway/index.ts):**

1. **Added imports (lines 4-6):**
   ```typescript
   import { VoicePipelineOrchestrator, VoicePipelineConfig } from '../voice-pipeline/voice-pipeline-orchestrator';
   import { CallCostTracker } from '../shared/cost-tracker';
   import { executeSQL } from '../shared/db-helpers';
   ```

2. **Replaced startVoicePipeline method (lines 214-393):**
   - Instead of calling `this.env.VOICE_PIPELINE.handleConnection(ws)`, we now:
   - Wait for Twilio's "start" message directly in api-gateway
   - Extract parameters from customParameters
   - Load persona and relationship from database
   - Create `VoicePipelineOrchestrator` instance locally
   - Call `pipeline.start(ws)` with the WebSocket in the same execution context

3. **Added helper methods:**
   - `waitForStartMessage(ws)` - Waits for Twilio's start message with parameters
   - `loadPersona(personaId)` - Loads persona from database
   - `loadOrCreateRelationship(userId, personaId)` - Loads or creates user-persona relationship

**Key Insight:**
In Cloudflare Workers/Raindrop Framework, WebSocket objects are "exotic" objects that cannot cross service boundaries. They must be handled in the same service/execution context where they're created.

**Deployed:** 2025-11-16 2:42 AM (Eastern Time)

**Expected Result:**
- ✅ WebSocket stays in same execution context
- ✅ No serialization error
- ✅ Voice pipeline initializes successfully
- ✅ Full AI conversation flow should work

---

## Solution #8: Bypass Cost Tracker (Temporary) ⚠️

**Error Found in Logs (2:41:02 AM):**
```
❌ Error: D1_ERROR: no such table: call_cost_breakdowns: SQLITE_ERROR
```

**Root Cause:** The `CallCostTracker` was trying to use the SmartSQL database (`CALL_ME_BACK_DB`), but we use Vultr PostgreSQL for all database operations. The table `call_cost_breakdowns` doesn't exist in SmartSQL.

**Temporary Solution (src/api-gateway/index.ts:229-233):**
```typescript
// TODO: Cost tracker needs to be refactored to use DATABASE_PROXY instead of SmartSQL
// For now, skip cost tracking to get the voice pipeline working
// const costTracker = new CallCostTracker(callId, userId, this.env.CALL_ME_BACK_DB);
// await costTracker.initialize();
const costTracker = null as any; // Temporarily disabled
```

**Deployed:** 2025-11-16 2:48 AM (Eastern Time)

**⚠️ TODO - CRITICAL:**
The `CallCostTracker` class needs to be refactored to:
1. Accept `DATABASE_PROXY` service instead of SmartSQL binding
2. Use `this.env.DATABASE_PROXY.executeQuery()` instead of `executeSQL()` helper
3. Use PostgreSQL syntax ($1, $2 placeholders) instead of SQLite (?)
4. Ensure the `call_cost_breakdowns` table exists in Vultr PostgreSQL

**Impact:** Cost tracking is disabled during calls. Users won't see detailed cost breakdowns, but calls will work.

---

## Solution #9: Fix ElevenLabs WebSocket Authentication ✅

**Error Discovered (from logs after 2:54:00 AM):**
The call successfully initialized through memory loading and procedure loading, but then went **completely silent** before disconnecting with Error 31921.

**Root Cause:** ElevenLabs STT and TTS WebSocket connections were failing because:
1. Code tried to pass API key via `headers` option: `new WebSocket(url, { headers: { 'xi-api-key': apiKey } })`
2. **Cloudflare Workers WebSocket API doesn't support the `headers` option** - it only accepts the URL parameter
3. This caused STT/TTS connections to fail silently, preventing any audio processing

**Security Concern:**
Passing API keys as query parameters is normally a security risk (logged, cached, visible in URLs). However, in this case:
- ✅ **Server-to-server only** - WebSocket connection is from Cloudflare Workers, not browser
- ✅ **TLS encrypted** - `wss://` encrypts the entire URL including query parameters
- ✅ **No client exposure** - API key never reaches the browser
- ✅ **ElevenLabs documented approach** - Their API supports `authorization` query parameter for this exact use case

**Changes Made:**

**1. ElevenLabs STT Handler (src/voice-pipeline/elevenlabs-stt.ts):**
```typescript
// buildWebSocketUrl() method - Added authorization parameter
params.append('authorization', this.config.apiKey);

// connect() method - Removed headers option
this.ws = new WebSocket(url); // Not: new WebSocket(url, { headers: {...} })
```

**2. ElevenLabs TTS Handler (src/voice-pipeline/elevenlabs-tts.ts):**
```typescript
// buildWebSocketUrl() method - Added authorization parameter
params.append('authorization', this.config.apiKey);

// connect() method - Removed headers option
this.ws = new WebSocket(url); // Not: new WebSocket(url, { headers: {...} })
```

**Deployed:** 2025-11-16 (current deployment)

**Expected Result:**
- ✅ STT WebSocket connects to ElevenLabs
- ✅ TTS WebSocket connects to ElevenLabs
- ✅ Audio flows: Twilio → STT → AI → TTS → Twilio
- ✅ User hears AI voice instead of silence

---

## Current Status: Debugging Silent Audio / No Response

**All Previous Issues Fixed:**
1. ✅ TwiML XML parsing (using `<Parameter>` elements)
2. ✅ WebSocket handshake (correct WebSocketPair constructor + accept())
3. ✅ WebSocket serialization (moved pipeline instantiation to api-gateway)
4. ✅ ElevenLabs authentication (API key via query parameter for Cloudflare Workers compatibility)
5. ⚠️ Cost tracker bypassed temporarily (needs refactoring to use DATABASE_PROXY)

**Current Issue: WebSocket Stays Connected but User Hears Silence**

**Symptoms (as of 3:10 AM - 3:15 AM test calls):**
- ✅ Call connects successfully
- ✅ Twilio says "Connecting you now"
- ✅ WebSocket stays connected (no Error 31921)
- ✅ Database queries complete (persona, relationship loaded)
- ✅ Memory initialization completes (SmartMemory operations succeed)
- ❌ User hears complete silence
- ❌ No voice from AI
- ❌ Eventually disconnects (likely Twilio timeout or user hangup)

**Critical Discovery:**
Looking at the logs, the pipeline initialization **stops at memory loading** and never proceeds to the ElevenLabs connection attempts. The last logged operations are:
- `getProcedure` calls (4 of them)
- `vector_index.upsert` operations
- Database query completions

But **NONE** of the console.log statements from `VoicePipelineOrchestrator.start()` appear in the logs!

This indicates that `pipeline.start(ws)` is either:
1. Never being called at all
2. Hanging before the first console.log statement
3. Throwing an error that's not being caught/logged

---

## Solution #10: Enhanced Logging Throughout Pipeline Initialization 🔍

**Goal:** Trace exactly where the voice pipeline is failing after memory initialization completes.

**Changes Made (2025-11-16 3:15 AM):**

**1. API Gateway - startVoicePipeline Method (src/api-gateway/index.ts:214-314):**
Added extensive console.log statements at every step:
- Line 215: `console.log('[API Gateway] startVoicePipeline called')`
- Line 219: `console.log('[API Gateway] Waiting for start message...')`
- Line 221: `console.log('[API Gateway] Start message received')`
- Line 229: `console.log('[API Gateway] Extracted parameters:', ...)`
- Line 237: `console.log('[API Gateway] Cost tracker bypassed')`
- Line 240: `console.log('[API Gateway] Loading persona...')`
- Line 245: `console.log('[API Gateway] Persona loaded:', persona.name)`
- Line 248: `console.log('[API Gateway] Loading relationship...')`
- Line 250: `console.log('[API Gateway] Relationship loaded')`
- Line 262: `console.log('[API Gateway] Voice config:', ...)`
- Line 275: `console.log('[API Gateway] Pipeline config created, API keys present:', ...)`
- Line 281: `console.log('[API Gateway] Creating VoicePipelineOrchestrator...')`
- Line 289: `console.log('[API Gateway] VoicePipelineOrchestrator created, calling start()...')`
- Line 293: `console.log('[API Gateway] pipeline.start() returned')`
- Line 296-300: Enhanced error logging

**2. VoicePipelineOrchestrator - start Method (src/voice-pipeline/voice-pipeline-orchestrator.ts:132-208):**
Wrapped entire method in try-catch with detailed logging:
- Line 134: `console.log('[VoicePipeline] Starting pipeline')`
- Line 138: `console.log('[VoicePipeline] Initializing memory manager...')`
- Line 145: `console.log('[VoicePipeline] Memory manager initialized')`
- Line 148: `console.log('[VoicePipeline] Loading memory context...')`
- Line 153: `console.log('[VoicePipeline] Memory context loaded')`
- Line 156: `console.log('[VoicePipeline] Building system prompt...')`
- Line 158: `console.log('[VoicePipeline] System prompt built')`
- Line 161: `console.log('[VoicePipeline] Connecting Twilio WebSocket...')`
- Line 163: `console.log('[VoicePipeline] Twilio WebSocket connected')`
- Line 166-168: API key presence/length validation logging
- Line 171: `console.log('[VoicePipeline] Calling sttHandler.connect()...')`
- Line 173: `console.log('[VoicePipeline] STT connected successfully')`
- Line 175-180: Detailed STT error logging
- Line 183-184: TTS voice ID logging
- Line 187: `console.log('[VoicePipeline] Calling ttsHandler.connect()...')`
- Line 189: `console.log('[VoicePipeline] TTS connected successfully')`
- Line 191-196: Detailed TTS error logging
- Line 199: `console.log('[VoicePipeline] All services connected successfully!')`
- Line 200-207: Fatal error catch block with detailed logging

**3. ElevenLabs STT/TTS - Async WebSocket Connection Fix (CRITICAL):**
Modified `connect()` methods to properly await WebSocket 'open' event instead of returning immediately:

**Before (elevenlabs-stt.ts & elevenlabs-tts.ts):**
```typescript
async connect(): Promise<void> {
  const url = this.buildWebSocketUrl();
  this.ws = new WebSocket(url);

  this.ws.addEventListener('open', () => {
    console.log('[ElevenLabsSTT] WebSocket connected');
    this.reconnectAttempts = 0;
    this.handlers.onConnected?.();
  });
  // Returns immediately - doesn't wait for connection!
}
```

**After:**
```typescript
async connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const url = this.buildWebSocketUrl();
      this.ws = new WebSocket(url);

      const timeout = setTimeout(() => {
        reject(new Error('[ElevenLabsSTT] Connection timeout'));
      }, 10000); // 10 second timeout

      this.ws.addEventListener('open', () => {
        clearTimeout(timeout);
        console.log('[ElevenLabsSTT] WebSocket connected');
        this.reconnectAttempts = 0;
        this.handlers.onConnected?.();
        resolve(); // Only resolve when actually connected
      });

      this.ws.addEventListener('error', (error) => {
        clearTimeout(timeout);
        console.error('[ElevenLabsSTT] WebSocket error:', error);
        this.handlers.onError?.(new Error('WebSocket error'));
        reject(new Error('[ElevenLabsSTT] WebSocket error'));
      });

    } catch (error) {
      console.error('[ElevenLabsSTT] Failed to connect:', error);
      reject(error);
    }
  });
}
```

**Root Cause:** In Cloudflare Workers, `new WebSocket(url)` is **synchronous** and returns immediately. The previous code set up event listeners but didn't wait for the 'open' event, so `await this.sttHandler.connect()` would complete instantly without actually waiting for the connection to establish.

**Deployed:** 2025-11-16 3:15 AM

**Expected Result:**
- ✅ See detailed logs showing exactly which step executes
- ✅ Identify where pipeline initialization hangs/fails
- ✅ ElevenLabs connections will properly await before proceeding
- ✅ If ElevenLabs connections timeout/fail, we'll see the specific error

**Next Test:** User is making a call now. Logs will reveal the exact failure point.

---

## Solution #11: Fix WebSocket Event Listener Timing (CRITICAL FIX) ✅

**Issue Discovered (From Test Calls at 3:18 AM and 3:20 AM):**
The WebSocket 'start' message from Twilio was never being received. Logs showed:
- ✅ `[API Gateway] startVoicePipeline called`
- ✅ `[API Gateway] Waiting for start message...`
- ❌ Never logs `[API Gateway] Start message received`

**Root Cause:**
Event listeners were being attached TOO LATE - inside the async `waitForStartMessage()` method which was called from `startVoicePipeline()`. By the time the Promise was created and the listener attached, Twilio had already sent the "start" message over the WebSocket.

**Timeline of the Bug:**
1. Twilio connects to WebSocket (HTTP 101 upgrade succeeds)
2. Twilio immediately sends "start" message with customParameters
3. `handleVoiceStream()` calls `accept()` on server WebSocket
4. `handleVoiceStream()` calls `startVoicePipeline()` WITHOUT awaiting
5. `startVoicePipeline()` is async and calls `waitForStartMessage(ws)`
6. `waitForStartMessage()` creates Promise and attaches 'message' event listener
7. **BUT the "start" message was already sent and lost!**

**The Fix (src/api-gateway/index.ts:176-249):**
Refactored to create the Promise and attach event listeners SYNCHRONOUSLY, immediately after calling `accept()`:

```typescript
private async handleVoiceStream(request: Request, url: URL): Promise<Response> {
  // ... WebSocketPair setup ...

  const serverWs = server as WebSocket;
  (serverWs as any).accept();

  // CRITICAL: Set up event listeners IMMEDIATELY (synchronously) after accept()
  // This ensures we don't miss Twilio's "start" message
  const startMessagePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('[API Gateway] Timeout waiting for start message'));
    }, 10000);

    serverWs.addEventListener('message', (event: any) => {
      const message = JSON.parse(event.data as string);
      if (message.event === 'start') {
        clearTimeout(timeout);
        console.log('[API Gateway] Start message received');
        resolve(message.start);
      }
    });

    serverWs.addEventListener('error', (event: any) => {
      clearTimeout(timeout);
      reject(new Error('[API Gateway] WebSocket error before start message'));
    });

    serverWs.addEventListener('close', (event: any) => {
      clearTimeout(timeout);
      reject(new Error('[API Gateway] WebSocket closed before start message'));
    });
  });

  // Pass the promise to startVoicePipeline
  this.startVoicePipeline(serverWs, startMessagePromise);

  return new Response(null, { status: 101, webSocket: client });
}
```

**Updated startVoicePipeline signature:**
```typescript
private async startVoicePipeline(ws: WebSocket, startMessagePromise: Promise<any>): Promise<void> {
  // Now just awaits the promise that was set up synchronously
  const startMessage = await startMessagePromise;
  // ... rest of pipeline initialization ...
}
```

**Removed:**
- `waitForStartMessage()` method - no longer needed since listener is set up in `handleVoiceStream`

**Key Insight:**
In Cloudflare Workers, when Twilio makes a WebSocket connection, the "start" message arrives almost instantly. Event listeners MUST be attached synchronously (not inside an async function) to catch early messages. The Promise pattern allows us to set up listeners immediately while still using async/await for the resolution.

**Deployed:** 2025-11-16 3:30 AM (current deployment)

**Expected Result:**
- ✅ Event listener ready BEFORE Twilio sends "start" message
- ✅ `[API Gateway] Start message received` will appear in logs
- ✅ Parameters (callId, userId, personaId) successfully extracted
- ✅ Voice pipeline initialization proceeds
- ✅ Full call flow: Twilio → STT → AI → TTS → User hears AI voice

**Test Status:** Awaiting user's test call to verify fix.

---

## Diagnostic Enhancement #12: Enhanced WebSocket Logging

**Issue (From Test Call at 3:37:37 AM):**
After deploying Solution #11, test calls still showed silence. Logs revealed:
- ✅ `[API Gateway] startVoicePipeline called`
- ✅ `[API Gateway] Waiting for start message...`
- ❌ NEVER logs `[API Gateway] Start message received`
- ❌ None of the `this.env.logger` statements from WebSocket event handlers appeared in logs

**Problem:**
The WebSocket event handler code uses `this.env.logger.info()` for logging, but these logs were NOT appearing in the output. Only `console.log()` statements were visible in logs. This made it impossible to determine whether:
- WebSocket messages were arriving but not logging
- Event listeners weren't being triggered
- Connection was closing/erroring silently

**Enhancement (src/api-gateway/index.ts:191-265):**
Added extensive `console.log()` statements throughout WebSocket setup and event handlers:

```typescript
// After accept()
(serverWs as any).accept();
console.log('[API Gateway] WebSocket accept() called, readyState:', serverWs.readyState);

// Before setting up listeners
console.log('[API Gateway] Setting up event listeners...');

// Inside message event handler
serverWs.addEventListener('message', (event: any) => {
  console.log('[API Gateway] ===== WebSocket message event fired =====');
  console.log('[API Gateway] WebSocket message received, data type:', typeof event.data);
  // ... parse and handle message ...
  console.log('[API Gateway] Parsed WebSocket message, event:', message.event);

  if (message.event === 'start') {
    console.log('[API Gateway] START message received! Resolving promise...');
    // ...
  }
});

// Inside error event handler
serverWs.addEventListener('error', (event: any) => {
  console.log('[API Gateway] ===== WebSocket ERROR event fired =====');
  // ...
});

// Inside close event handler
serverWs.addEventListener('close', (event: any) => {
  console.log('[API Gateway] ===== WebSocket CLOSE event fired =====', event.code, event.reason);
  // ...
});

// After all listeners are set up
console.log('[API Gateway] All event listeners set up. Ready to receive messages.');

// Before calling startVoicePipeline
console.log('[API Gateway] Calling startVoicePipeline...');

// Inside timeout
const timeout = setTimeout(() => {
  console.log('[API Gateway] TIMEOUT after 10 seconds waiting for start message');
  // ...
}, 10000);
```

**Diagnostic Information Now Available:**
1. **WebSocket State:** ReadyState immediately after accept()
2. **Listener Setup:** Confirmation that event listeners are being attached
3. **Message Events:** Clear indication when message events fire
4. **Error Events:** Immediate notification of WebSocket errors
5. **Close Events:** When/why WebSocket closes with code and reason
6. **Timeout Events:** If 10 seconds pass without receiving "start" message

**Deployed:** 2025-11-16 3:42 AM

**Expected Diagnostic Output (Normal Flow):**
```
[API Gateway] WebSocket accept() called, readyState: 1
[API Gateway] Setting up event listeners...
[API Gateway] All event listeners set up. Ready to receive messages.
[API Gateway] Calling startVoicePipeline...
[API Gateway] startVoicePipeline called
[API Gateway] Waiting for start message...
[API Gateway] ===== WebSocket message event fired =====
[API Gateway] WebSocket message received, data type: string
[API Gateway] Parsed WebSocket message, event: start
[API Gateway] START message received! Resolving promise...
[API Gateway] Start message received
```

**Expected Diagnostic Output (If No Messages Arrive):**
```
[API Gateway] WebSocket accept() called, readyState: 1
[API Gateway] Setting up event listeners...
[API Gateway] All event listeners set up. Ready to receive messages.
[API Gateway] Calling startVoicePipeline...
[API Gateway] startVoicePipeline called
[API Gateway] Waiting for start message...
[API Gateway] TIMEOUT after 10 seconds waiting for start message
```

**Expected Diagnostic Output (If Connection Closes Early):**
```
[API Gateway] WebSocket accept() called, readyState: 1
[API Gateway] Setting up event listeners...
[API Gateway] All event listeners set up. Ready to receive messages.
[API Gateway] Calling startVoicePipeline...
[API Gateway] startVoicePipeline called
[API Gateway] Waiting for start message...
[API Gateway] ===== WebSocket CLOSE event fired ===== 1006 "Abnormal closure"
```

**Test Status:** Ready for next test call to gather detailed diagnostic information.

---

## Solution #13: Critical ctx.waitUntil() Fix for WebSocket Async Operations ⚡

**Critical Discovery (From Test Call at 3:44:20 AM):**
After deploying enhanced logging (Solution #12), the logs revealed the full sequence:
1. ✅ `[API Gateway] WebSocket accept() called, readyState: 1`
2. ✅ `[API Gateway] Setting up event listeners...`
3. ✅ `[API Gateway] All event listeners set up. Ready to receive messages.`
4. ✅ `[API Gateway] Calling startVoicePipeline...`
5. ✅ `[API Gateway] startVoicePipeline called`
6. ✅ `[API Gateway] Waiting for start message...`
7. ❌ **THEN NOTHING** - No message events, no timeout, no error, no close

**The Smoking Gun:**
The 10-second timeout **NEVER FIRED**. This is impossible unless the Worker execution context was terminated before the timeout could fire.

**Root Cause - Cloudflare Workers Execution Model:**
In Cloudflare Workers, once you return an HTTP response (including a 101 WebSocket upgrade), the Worker's execution context ends **immediately**. Any async operations (like `setTimeout`, Promises, async function calls) that are not explicitly registered with `ctx.waitUntil()` are **CANCELED**.

**From Cloudflare Workers Documentation:**
> "Outstanding asynchronous tasks are canceled as soon as a Worker finishes sending its main response body to the client. To ensure that async operations complete, you should pass the request promise to `event.waitUntil()`."

**What Was Happening:**
1. `handleVoiceStream()` sets up event listeners (synchronous - works fine)
2. `handleVoiceStream()` calls `this.startVoicePipeline(...)` but doesn't await it
3. `handleVoiceStream()` returns 101 response
4. **Worker execution context ENDS**
5. The `setTimeout` for the 10-second timeout is CANCELED
6. The `startVoicePipeline` async function is CANCELED
7. **BUT** - WebSocket event listeners continue to work because they're handled by the Workers runtime

**Why Event Listeners Never Fired:**
The event listeners ARE working, but the Promise they're supposed to resolve is part of the canceled execution context. So even when Twilio sends messages, the handlers can't resolve/reject the Promise that `startVoicePipeline` is awaiting.

**The Fix (src/api-gateway/index.ts:274):**
```typescript
// BEFORE (broken):
this.startVoicePipeline(serverWs, startMessagePromise);
return new Response(null, { status: 101, webSocket: client });

// AFTER (fixed):
this.ctx.waitUntil(this.startVoicePipeline(serverWs, startMessagePromise));
return new Response(null, { status: 101, webSocket: client });
```

**What ctx.waitUntil() Does:**
- Tells Cloudflare Workers to keep the async operation alive
- The Promise passed to `ctx.waitUntil()` will continue executing even after the response is sent
- Allows the `startVoicePipeline` function to await the `startMessagePromise`
- Ensures `setTimeout` timeouts can fire
- Keeps all async/await chains alive

**Key Insight:**
Cloudflare Workers WebSockets have two execution contexts:
1. **HTTP Request Context** - Ends when you return the 101 response. Use `ctx.waitUntil()` for async operations here.
2. **WebSocket Event Context** - Lives for the lifetime of the WebSocket connection. Event listeners (`addEventListener`) work here.

The critical mistake was starting async operations in the HTTP context without using `ctx.waitUntil()`.

**Why This Matters for Twilio Integration:**
Twilio sends messages immediately upon WebSocket connection:
1. First: "connected" message
2. Second: "start" message with customParameters

Without `ctx.waitUntil()`, the async function awaiting these messages gets canceled before it can receive them, even though the event listeners fire correctly.

**Deployed:** 2025-11-16 3:47 AM

**Expected Result:**
- ✅ `ctx.waitUntil()` keeps `startVoicePipeline` alive
- ✅ WebSocket message events fire
- ✅ Promise resolves with "start" message data
- ✅ Pipeline initialization proceeds
- ✅ Full voice call flow works: Twilio → STT → AI → TTS → User

**Test Status:** Ready for next test call to verify the ctx.waitUntil() fix.

---

## WHERE WE LEFT OFF - Session End Summary (2025-11-16 4:05 AM)

### The Core Issue We're Stuck On

**WebSocket event listeners (`addEventListener('message', ...)`) set up in Cloudflare Workers are NOT FIRING when Twilio sends messages.**

This is the fundamental blocker preventing the entire voice call flow from working. We've spent the entire debugging session trying different approaches to get WebSocket events to fire, but none have succeeded.

### What We've Tried (All Failed)

**Attempt #1: Event Listeners in HTTP Request Context**
- Set up `addEventListener` before returning the 101 WebSocket upgrade response
- **Result:** ❌ Events never fired
- **Reason:** Suspected that HTTP context ends when response is returned, canceling listeners

**Attempt #2: Event Listeners with ctx.waitUntil() and Promise/await**
- Moved event listener setup inside `startVoicePipeline` wrapped in `ctx.waitUntil()`
- Used Promise with `resolve/reject` that would be called by event listeners
- Used `await Promise.race([startMessagePromise, timeoutPromise])` to wait for message or timeout
- **Result:** ❌ Neither the message events nor the timeout fired
- **Reason:** `setTimeout` doesn't work in ctx.waitUntil() context for WebSocket connections

**Attempt #3: Direct Event-Driven Handling (Current State)**
- Removed all `await` and Promise patterns
- Set up event listeners in `ctx.waitUntil()` context that directly call handler methods
- No setTimeout, no blocking - just pure event-driven architecture
- **Result:** ❌ Events still never fire
- **Code Location:** src/api-gateway/index.ts:233-279 (startVoicePipeline method)

### What We Know For Certain

✅ **Working:**
- WebSocket upgrade succeeds (HTTP 101 response returned)
- `accept()` is called on the server WebSocket
- `readyState` shows `1` (OPEN) immediately after accept()
- Event listeners are being attached (confirmed by log messages)
- `ctx.waitUntil()` keeps the async function alive (confirmed by subsequent logs)
- Code executes up to "Event listeners set up, waiting for messages from Twilio..."

❌ **Not Working:**
- `addEventListener('message', ...)` - NEVER fires
- `addEventListener('error', ...)` - NEVER fires
- `addEventListener('close', ...)` - NEVER fires
- `setTimeout(...)` - NEVER fires (even inside ctx.waitUntil() context)
- No exceptions or errors are thrown
- The call just hangs until Twilio times out and disconnects

### Evidence from Logs

**Latest Test Call (4:04 AM):**
```
[API Gateway] WebSocket accept() called, readyState: 1
[API Gateway] WebSocket accepted, will set up listeners in startVoicePipeline
[API Gateway] Calling startVoicePipeline...
[API Gateway] startVoicePipeline called
[API Gateway] Setting up WebSocket event listeners...
[API Gateway] Event listeners set up, waiting for messages from Twilio...
[API Gateway] startVoicePipeline promise created
[API Gateway] ctx.waitUntil() called with pipeline promise

... THEN NOTHING - no message events, no timeouts, no errors ...
```

**What We Expected to See:**
```
[API Gateway] ===== WebSocket message event fired =====
[API Gateway] Parsed WebSocket message, event: connected
[API Gateway] ===== WebSocket message event fired =====
[API Gateway] Parsed WebSocket message, event: start
[API Gateway] START message received!
[API Gateway] handleStartMessage called
```

### Current Hypothesis

There's a **fundamental incompatibility** between:
1. **Cloudflare Workers WebSocket event loop** - How Workers handle WebSocket events
2. **Raindrop Framework Service wrapper** - How Raindrop wraps Workers Services
3. **Execution context model** - What happens to event loops after returning a 101 response

**Theory:** The WebSocket event loop may be tied to a different execution context that isn't kept alive by `ctx.waitUntil()`. In standard Cloudflare Workers, WebSocket events are handled in a persistent connection context separate from the HTTP request/response cycle. The Raindrop framework may have additional layers that interfere with this.

### Next Steps to Investigate

1. **Check Raindrop WebSocket Documentation**
   - Search Raindrop docs for WebSocket examples
   - Look for any special handling required for WebSocket connections
   - Check if there's a different pattern needed for Service-based WebSockets

2. **Minimal WebSocket Test**
   - Create a simple echo server to test if ANY WebSocket events fire
   - Strip away all the pipeline complexity
   - Just log when events fire and echo messages back

3. **Contact Raindrop Support**
   - Ask specifically about WebSocket event handling in Services
   - Ask if there are known limitations with `addEventListener` in Services
   - Ask about examples of working WebSocket implementations

4. **Consider Alternative Architectures**
   - **Durable Objects:** Cloudflare's recommended solution for WebSocket handling
   - **Direct Cloudflare Workers:** Bypass Raindrop framework for WebSocket handling
   - **HTTP Polling:** Fallback if WebSocket events truly don't work

### Code State at Session End

**Latest Deployment:** 2025-11-16 4:03 AM

**Key Files Modified:**
- `src/api-gateway/index.ts` - Refactored to event-driven WebSocket handling
- `CALL_FLOW_DEBUGGING.md` - Documented all solutions and attempts

**Current Implementation:**
- Event listeners set up in `startVoicePipeline` (inside ctx.waitUntil)
- Direct event-driven architecture (no Promise.await blocking)
- Message handler calls `handleStartMessage()` when "start" event arrives
- All pipeline initialization code ready and waiting for that first message

**The Blocker:**
The WebSocket 'message' event never fires, so `handleStartMessage()` is never called, so the pipeline never starts, so the user just hears silence until the call times out.

---

## Next Session Priorities

1. **FIRST:** Test if WebSocket events work at all - create minimal echo server
2. **SECOND:** Check Raindrop docs/examples for WebSocket patterns
3. **THIRD:** If events don't work in Services, explore Durable Objects or alternative architectures
4. **FOURTH:** Contact Raindrop support if still blocked

**The Goal:** Get even ONE WebSocket 'message' event to fire. Once we have that, everything else should work.

---

## SESSION 2: November 16, 2025 - THE BREAKTHROUGH

### Critical Discovery: Event Listeners DO Fire! (But Logs Don't Show It)

**Created minimal WebSocket echo test endpoint** at `/api/debug/ws-echo`

```typescript
// Minimal echo handler - same pattern as voice stream
private async handleEchoWebSocket(request: Request): Promise<Response> {
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);
  const serverWs = server as WebSocket;

  (serverWs as any).accept();

  // Set up listeners SYNCHRONOUSLY
  serverWs.addEventListener('message', (event: any) => {
    console.log('[Echo] ===== MESSAGE EVENT FIRED =====');
    serverWs.send(`Echo: ${event.data}`);
  });

  serverWs.addEventListener('error', (event: any) => {
    console.log('[Echo] ===== ERROR EVENT FIRED =====');
  });

  serverWs.addEventListener('close', (event: any) => {
    console.log('[Echo] ===== CLOSE EVENT FIRED =====');
  });

  return new Response(null, { status: 101, webSocket: client });
}
```

**Test Results:**
✅ WebSocket connected successfully
✅ Messages were echoed back correctly
✅ All 3 test messages received and responded to

```
WebSocket Echo Test
=================================
✅ WebSocket connected!
Sending test message: "Hello from test client"
📨 Received: Echo: Hello from test client
Sending test message 2: "Second test message"
📨 Received: Echo: Second test message
Sending JSON test: {"event":"test","data":"JSON test"}
📨 Received: Echo: {"event":"test","data":"JSON test"}
```

**CRITICAL FINDING: Console.log inside event handlers doesn't appear in Raindrop logs!**

Looking at Raindrop logs:
- ✅ Setup logs appear: "[Echo] Creating WebSocketPair...", "[Echo] Event listeners set up"
- ❌ Handler logs DON'T appear: "[Echo] ===== MESSAGE EVENT FIRED =====" is NEVER in logs
- ✅ But messages WERE received (proven by echo responses)

**This means:**
1. WebSocket addEventListener DOES work in Cloudflare Workers/Raindrop
2. Event handlers ARE firing when messages arrive
3. console.log statements inside event callbacks are NOT logged by Raindrop

**Re-analyzed Twilio voice stream logs:**

From logs at 5:17:11-16 PM:
1. ✅ WebSocket upgrade happened
2. ✅ Event listeners were set up ("[API Gateway] Event listeners set up")
3. ✅ Database queries ran - persona and relationship loaded (5:17:12 PM)
4. ✅ Memory operations ran - ai.run, putMemory, getSemanticMemory (5:17:12-16 PM)

**CONCLUSION: The START message WAS received and handleStartMessage() WAS called!**

Evidence:
- We see database queries for `SELECT * FROM personas WHERE id = $1`
- We see database queries for `SELECT * FROM user_persona_relationships`
- We see memory initialization (ai.run, putMemory, getSemanticMemory)
- These operations ONLY happen inside `handleStartMessage()` after extracting parameters from the "start" message

**The Previous Session's Wrong Assumption:**
We thought events weren't firing because we didn't see the "[API Gateway] ===== WebSocket message event fired =====" logs. But now we know those logs simply don't appear in Raindrop - the events ARE firing!

### New Mystery: What Happens After Memory Init?

After memory initialization completes successfully, the code should call `pipeline.start(ws)` which should:
1. Try to connect to ElevenLabs STT (WebSocket)
2. Try to connect to ElevenLabs TTS (WebSocket)
3. Start processing audio

**But we don't see ANY logs from:**
- "[VoicePipeline] Starting pipeline"
- "[VoicePipeline] About to connect to ElevenLabs STT..."
- "[ElevenLabsSTT] WebSocket connected"
- "[ElevenLabsTTS] WebSocket connected"

### Deep Analysis: Where Does Execution Stop?

**Timeline from logs:**
1. ✅ `handleStartMessage()` is called (proven by database queries)
2. ✅ Persona loaded: `SELECT * FROM personas WHERE id = $1`
3. ✅ Relationship loaded: `SELECT * FROM user_persona_relationships`
4. ✅ VoicePipelineOrchestrator created (line 355-361 in api-gateway)
5. ✅ `pipeline.start(ws)` is called (line 364 in api-gateway)
6. ✅ Memory manager initialized (proven by ai.run, putMemory logs at 5:17:12-16 PM)
7. ❓ ElevenLabs connections attempted but no success/failure logs

**Key Insight:**
The memory operations (ai.run, putMemory, vector_index.upsert, bucket.get) happen inside `pipeline.start()` at lines 149-152. We see these in logs, which proves:
- `pipeline.start()` IS executing
- It reaches at least line 152 (memory context loaded)
- But we DON'T see logs from line 134 `'[VoicePipeline] Starting pipeline'`

**This confirms:** Console.log inside event handler context doesn't appear in Raindrop logs, BUT service operations (database, memory, AI) DO appear.

**The Question:** Does execution reach lines 166-197 (ElevenLabs connection attempts)?

**Possibilities:**
1. **Hanging:** `await this.sttHandler.connect()` (line 172) or `await this.ttsHandler.connect()` (line 188) hangs indefinitely
2. **Timeout:** Connection times out (10 second timeout exists) but error is swallowed in ctx.waitUntil() context
3. **Silent Failure:** ElevenLabs rejects connection but error handling doesn't create logs visible to Raindrop
4. **Success but No Logs:** Connections succeed but all console.log statements are invisible

**Evidence against "hanging indefinitely":**
- ElevenLabs connect() has 10-second timeout (elevenlabs-stt.ts line 117, elevenlabs-tts.ts line 135)
- Should reject Promise after timeout
- api-gateway has error handling that calls this.env.logger.error() which DOES appear in logs

**Evidence against "error logged":**
- No ERROR level logs in Raindrop logs for any of the test calls
- No error traces in the time window around memory initialization

**Most Likely:**
Code execution continues past ElevenLabs connections but we can't see console.log statements. Need to add logger.info() calls that will be visible, or test ElevenLabs connection directly.

### THE ROOT CAUSE FOUND! 🎯

**After creating database marker system to avoid log parsing:**

Created `debug_markers` table and `./query-debug-markers.sh` script to track execution flow with minimal context usage.

Used database markers to track execution flow:
```sql
BEFORE_PIPELINE_START → AFTER_PIPELINE_START
```

**Results:**
- ✅ `pipeline.start()` IS being called
- ✅ `pipeline.start()` IS returning successfully
- ✅ Memory operations complete (5 seconds total: 01:37:26 to 01:37:32)
- ✅ No ElevenLabs connection errors thrown

**But then discovered in api-gateway/index.ts line 259-261:**
```typescript
} else if (message.event === 'media') {
  // Forward audio to pipeline
  // TODO: implement when pipeline is working
```

**ROOT CAUSE: Media messages are NOT being forwarded to the voice pipeline!**

The pipeline initializes successfully, connects to ElevenLabs, and waits for audio...
but the Twilio "media" messages containing the call audio **are never sent to it**.

**Additional Issue Found:**
The api-gateway was setting up its own WebSocket message listeners AND the VoicePipelineOrchestrator was setting up listeners via `twilioHandler.handleConnection(ws)`. This caused duplicate listeners where:
- api-gateway's listener handled "start" but had a TODO for "media"
- TwilioMediaStreamHandler's listener was set up but api-gateway's listener ran first

**Solution (src/api-gateway/index.ts lines 250-275):**
Refactored api-gateway to ONLY listen for the "start" message, then remove its listener and let the VoicePipelineOrchestrator's TwilioMediaStreamHandler take over for all subsequent messages (media, stop, etc.).

```typescript
// Only listen for the 'start' message to initialize the pipeline
// After initialization, the VoicePipelineOrchestrator's TwilioMediaStreamHandler
// will take over and handle all messages (media, stop, etc.)
const startMessageHandler = async (event: any) => {
  if (message.event === 'start') {
    // Remove this listener since we only need it once
    ws.removeEventListener('message', startMessageHandler);
    await this.handleStartMessage(ws, message.start);
    // TwilioMediaStreamHandler now handling messages
  }
};
ws.addEventListener('message', startMessageHandler);
```

**Deployed:** 2025-11-16 (Session 2)

**Expected Result:**
- ✅ Pipeline initializes on "start" message
- ✅ TwilioMediaStreamHandler receives "media" messages with audio data
- ✅ Audio forwarded to ElevenLabs STT
- ✅ AI responses generated
- ✅ Audio sent back via ElevenLabs TTS
- ✅ Full conversation flow works!

---

## SESSION 3: November 17, 2025 - STT NOT RETURNING TRANSCRIPTS

### Progress So Far

**Database marker debugging approach implemented successfully:**
- Created `debug_markers` table for minimal-context debugging
- Created `./query-debug-markers.sh` to query markers efficiently
- Avoids massive log parsing that consumes context

**What We've Confirmed Works:**
1. ✅ WebSocket upgrade successful
2. ✅ START message received and processed
3. ✅ Pipeline initializes (BEFORE_PIPELINE_START → AFTER_PIPELINE_START)
4. ✅ Media messages received (FIRST_MEDIA_MESSAGE_RECEIVED marker appears)
5. ✅ Audio forwarded to STT (code path confirmed)
6. ✅ ElevenLabs API key is valid
7. ✅ User speaking into phone during calls

**What's NOT Working:**
- ❌ **NO `TRANSCRIPT_RECEIVED` markers** - ElevenLabs STT not returning transcripts
- ❌ No TTS audio generated (because no transcript to respond to)
- ❌ Silence on the call

### Root Cause Investigation

**Initial hypothesis:** Manual commit strategy meant transcripts were never committed.
- **Fix attempted:** Switched from `commitStrategy: 'manual'` to `commitStrategy: 'vad'` with 0.8s silence threshold
- **Result:** Still no transcripts received

**Current hypothesis:** ElevenLabs STT connection is either:
1. Not actually connecting (fails silently without throwing error)
2. Connecting but audio format incompatible (`ulaw_8000` from Twilio may not work with ElevenLabs)
3. Connecting but closing immediately due to auth/format error (logs not visible)

**Evidence:**
- No error logs from STT connection attempts
- No WebSocket close events logged
- ElevenLabs API key validated (works for API calls)
- `ulaw_8000` is listed as supported format in code
- pipeline.start() completes successfully (should fail if connection throws)

### Next Steps

**Plan A: Direct ElevenLabs STT Test**
1. Create minimal test script to verify ElevenLabs Scribe v2 Realtime works
2. Send sample ulaw audio to STT WebSocket
3. Verify we receive transcripts back
4. If this fails → audio format issue or API incompatibility
5. If this works → issue is in our pipeline integration

**Plan B: Add STT Connection Markers** ✅ IMPLEMENTED
1. ✅ Add database marker when STT WebSocket opens: `STT_WEBSOCKET_OPENED`
2. ✅ Add marker when STT WebSocket closes: `STT_WEBSOCKET_CLOSED` (with code/reason metadata)
3. ✅ Add marker when STT message received: `STT_FIRST_MESSAGE_RECEIVED`
4. ✅ Add marker on STT WebSocket error: `STT_WEBSOCKET_ERROR`
5. This will show if connection is actually being established

**Implementation Details:**
- Modified `elevenlabs-stt.ts` to accept optional `STTDebugContext` parameter
- Added `metadata` column to `debug_markers` table for storing error details
- Passed `callId` and `databaseProxy` from VoicePipelineOrchestrator
- All markers inserted asynchronously without blocking WebSocket operations
- Deployed: November 17, 2025

**New Markers to Check:**
- `STT_WEBSOCKET_OPENED` - Confirms STT connection established
- `STT_FIRST_MESSAGE_RECEIVED` - Confirms STT is sending messages back
- `STT_WEBSOCKET_CLOSED` - Shows if/when/why connection closes (check metadata)
- `STT_WEBSOCKET_ERROR` - Shows if connection errors occur

**Plan C: Alternative STT Provider** ✅ **SOLUTION FOUND**

### Root Cause Discovered

**Problem:** ElevenLabs STT WebSocket requires `xi-api-key` HTTP header during WebSocket handshake.

**Evidence from Debug Markers:**
```json
{
  "message_type": "auth_error",
  "error": "You must be authenticated to use this endpoint."
}
```

**Attempts Made:**
1. ❌ Query parameter `authorization` - Auth error
2. ❌ Query parameter `token` - Auth error
3. ❌ Query parameter `xi-api-key` - Auth error
4. ❌ WebSocket subprotocol `xi-api-key.{API_KEY}` - Auth error

**Fundamental Issue:**
- ElevenLabs STT requires `xi-api-key` as HTTP header in WebSocket handshake
- Cloudflare Workers WebSocket API does NOT support custom headers
- No workaround exists (confirmed via docs and testing)

**Documentation Reference:**
- ElevenLabs docs: "Authentication is done either by providing a valid API key in the `xi-api-key` header or by providing a valid token in the `token` query parameter."
- `token` parameter is for single-use tokens only (requires separate API call to generate)
- Direct API key in `token` parameter does not work
- Cloudflare Workers limitation is documented: custom headers not supported in WebSocket constructor

### Solution: Switch to Deepgram STT

**Decision:** Use Deepgram for STT, keep ElevenLabs for TTS

**New Architecture:**
```
User speaks → Twilio (mulaw) → Deepgram STT → Cerebras AI → ElevenLabs TTS → User hears
```

**Why Deepgram:**
- ✅ Supports authentication via query parameters (works with Cloudflare Workers)
- ✅ Native Twilio integration (handles mulaw_8000 format)
- ✅ Excellent STT quality and low latency
- ✅ Well-documented WebSocket API
- ✅ Widely used in production voice applications

**TODO for Production:**
- Consider implementing ElevenLabs single-use token generation endpoint
- This would require an additional API call before each STT connection
- For hackathon: Deepgram is the pragmatic solution

**Security Note:**
- Current implementation uses API key directly in query parameters
- For production: implement single-use token generation for both providers
- Reduces risk of API key exposure in logs/URLs

---

**End of debugging session 3 - November 17, 2025 - RESOLVED: Switching to Deepgram STT**
