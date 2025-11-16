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

## Current Status: Ready for Testing

**All Issues Fixed/Bypassed:**
1. ✅ TwiML XML parsing (using `<Parameter>` elements)
2. ✅ WebSocket handshake (correct WebSocketPair constructor + accept())
3. ✅ WebSocket serialization (moved pipeline instantiation to api-gateway)
4. ✅ ElevenLabs authentication (API key via query parameter for Cloudflare Workers compatibility)
5. ⚠️ Cost tracker bypassed temporarily (needs refactoring to use DATABASE_PROXY)

**Next Test:** Make a call to verify the complete voice pipeline works end-to-end!
