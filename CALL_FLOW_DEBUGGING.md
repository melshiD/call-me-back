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
