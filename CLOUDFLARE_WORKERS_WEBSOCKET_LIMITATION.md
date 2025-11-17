# Cloudflare Workers WebSocket Limitation - CRITICAL ISSUE

**Last Updated:** 2025-11-17
**Status:** ❌ **BLOCKING** - Prevents voice pipeline from working

---

## The Core Problem

**Cloudflare Workers cannot establish outbound WebSocket connections reliably.**

### What Works ✅

**INBOUND WebSocket connections (external client → Workers):**
- Twilio Media Streams → Workers: ✅ WORKS PERFECTLY
- Test clients → Workers echo endpoint: ✅ WORKS PERFECTLY
- `new WebSocketPair()` + `accept()` + `addEventListener`: ✅ WORKS

**Evidence:**
```
✅ FIRST_MEDIA_MESSAGE_RECEIVED marker appears in database
✅ Twilio START messages are received
✅ Event listeners fire correctly
✅ Media audio chunks arrive from Twilio
```

### What Doesn't Work ❌

**OUTBOUND WebSocket connections (Workers → external server):**
- Workers → Deepgram API: ❌ FAILS (Error 1006)
- Workers → Deepgram Proxy (our Vultr server): ❌ FAILS (Error 1006)
- Workers → ANY external WebSocket server: ❌ FAILS

**Evidence:**
```
❌ DEEPGRAM_STT_WEBSOCKET_ERROR: "[object ErrorEvent]"
❌ DEEPGRAM_STT_WEBSOCKET_CLOSED: code 1006, "Failed to establish websocket connection"
❌ No DEEPGRAM_STT_WEBSOCKET_OPENED marker ever appears
```

---

## What We've Tried (All Failed)

### Attempt 1: Direct WebSocket Constructor
```typescript
this.ws = new WebSocket(url);
```
**Result:** Error 1006

### Attempt 2: WebSocket with Protocols
```typescript
this.ws = new WebSocket(url, ['token', apiKey]);
```
**Result:** Error 1006

### Attempt 3: Fetch-Upgrade Pattern
```typescript
const response = await fetch(url, {
  headers: { 'Upgrade': 'websocket' }
});
const ws = response.webSocket;
```
**Result:** `response.webSocket` is undefined

### Attempt 4: Different Authentication Methods
- Query parameter: `?token=API_KEY` ❌
- Sec-WebSocket-Protocol header ❌
- Authorization header ❌

### Attempt 5: External Proxy Server
- Created Node.js WebSocket proxy on Vultr (144.202.15.249:8080)
- Workers → Proxy → Deepgram
- **STILL FAILS** with Error 1006

---

## Root Cause Analysis

### Cloudflare Workers WebSocket API is Incomplete

**From Cloudflare Documentation:**
> "WebSockets are currently supported in Workers for inbound connections only."

**What this means:**
- Workers can ACCEPT WebSocket connections from external clients (via WebSocketPair)
- Workers CANNOT INITIATE WebSocket connections to external servers
- The `new WebSocket(url)` constructor exists but doesn't work properly for outbound connections

### Why Error 1006 Occurs

Error 1006 = "Abnormal Closure" - connection fails during handshake

**Possible reasons:**
1. Workers runtime doesn't fully implement outbound WebSocket client protocol
2. TLS/certificate validation issues for wss:// connections
3. Network policy restrictions on outbound WebSocket connections
4. Fetch API limitations preventing WebSocket upgrade requests

---

## The Confusion We Keep Having

**We keep thinking:**
> "WebSocket events aren't firing from Twilio!"

**The reality:**
> Twilio events ARE firing perfectly. The problem is the OUTBOUND connection to Deepgram proxy fails.

**Why we keep thinking this:**
- We see no transcript output → assume STT isn't working
- We check Twilio WebSocket markers → see they're fine
- We forget that the OUTBOUND connection (Workers → Deepgram) is the actual blocker
- Debug markers show `FIRST_MEDIA_MESSAGE_RECEIVED` but no `DEEPGRAM_STT_WEBSOCKET_OPENED`

**Quick Check to Identify the Real Issue:**
```bash
# Query debug markers
source .env && curl -s -X POST https://db.ai-tools-marketplace.io/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${VULTR_DB_API_KEY}" \
  -d '{"sql": "SELECT marker_name FROM debug_markers ORDER BY created_at DESC LIMIT 10", "params": []}'
```

**If you see:**
- ✅ `FIRST_MEDIA_MESSAGE_RECEIVED` - Twilio → Workers is working
- ❌ NO `DEEPGRAM_STT_WEBSOCKET_OPENED` - Workers → Deepgram is broken

**Then the problem is outbound WebSocket connections, NOT Twilio integration.**

---

## Workarounds That MIGHT Work (Untested)

### Option 1: Durable Objects
**Theory:** Durable Objects might have better WebSocket support than regular Workers

```typescript
// Create a Durable Object that maintains the Deepgram connection
export class DeepgramProxy {
  async fetch(request: Request) {
    // Try outbound WebSocket from Durable Object context
    const ws = new WebSocket('wss://api.deepgram.com/v1/listen?token=...');
    // ...
  }
}
```

**Why it might work:**
- Durable Objects have persistent execution context
- May have different network capabilities than stateless Workers
- Cloudflare's recommended pattern for stateful WebSocket apps

**Status:** NOT TESTED

### Option 2: Cloudflare Workers AI (Deepgram Built-in)
**Theory:** Use Cloudflare's built-in Deepgram integration instead of external API

```typescript
const ai = this.env.AI;
const response = await ai.run('@cf/deepgram/nova-3', {
  audio: audioBuffer
});
```

**Why it might work:**
- No outbound WebSocket connection needed
- Native Workers AI API
- Officially supported integration

**Concerns:**
- May not support streaming (need to check docs)
- Different API than standard Deepgram
- Pricing might be different

**Status:** NOT TESTED

### Option 3: HTTP-based STT (No Streaming)
**Theory:** Use REST API instead of WebSocket streaming

```typescript
// Buffer audio chunks
const audioBuffer = /* collect chunks */;

// Send via HTTP POST
const response = await fetch('https://api.deepgram.com/v1/listen', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${apiKey}`,
    'Content-Type': 'audio/mulaw'
  },
  body: audioBuffer
});
```

**Why it might work:**
- HTTP fetch() is fully supported in Workers
- No WebSocket connection needed

**Trade-offs:**
- Higher latency (batch processing, not streaming)
- Need to buffer audio before sending
- May not feel like real-time conversation

**Status:** NOT TESTED

### Option 4: Service Worker on Edge Function Platform
**Theory:** Use a different serverless platform that supports outbound WebSockets

**Platforms to try:**
- **Vercel Edge Functions** - May have better WebSocket support
- **Deno Deploy** - Full WebSocket support documented
- **AWS Lambda@Edge** - Via API Gateway WebSocket API

**Why it might work:**
- Different runtime with different capabilities
- Some platforms explicitly support outbound WebSockets

**Trade-offs:**
- Move voice pipeline off Raindrop/Workers
- Split architecture across multiple platforms
- Increased complexity

**Status:** NOT TESTED

---

## Recommended Next Steps

1. **FIRST: Try Durable Objects** (Option 1)
   - Quick test to see if they have better outbound WebSocket support
   - Still within Cloudflare/Raindrop ecosystem
   - If it works, minimal code changes needed

2. **SECOND: Try Cloudflare Workers AI** (Option 2)
   - Check if streaming is supported
   - Test latency and quality
   - May be the "official" solution Cloudflare expects

3. **THIRD: Consider alternative platforms** (Option 4)
   - Move just the voice-pipeline service to Deno Deploy or Vercel
   - Keep everything else on Raindrop
   - Use service-to-service HTTP calls

4. **LAST RESORT: HTTP polling** (Option 3)
   - Only if all WebSocket approaches fail
   - Will add latency but at least works

---

## Decision Criteria

**Use Durable Objects if:**
- Outbound WebSocket works from Durable Object context
- Latency is acceptable
- Can handle concurrent connections

**Use Workers AI if:**
- Streaming is supported
- Quality and latency match our requirements
- Pricing is acceptable

**Use alternative platform if:**
- Durable Objects don't support outbound WebSocket
- Workers AI doesn't support streaming or has poor quality
- We need guaranteed WebSocket support

**Use HTTP polling if:**
- All other options fail
- We can accept 1-2 second latency
- Real-time feel is less important than just working

---

## Key Insight

**THE TWILIO INTEGRATION IS NOT THE PROBLEM.**

The Twilio → Workers WebSocket connection works perfectly. Event listeners fire. Media messages arrive. The entire debugging session about "events not firing" was a red herring.

**THE REAL PROBLEM: Workers cannot connect outbound to Deepgram.**

Every single test shows:
- ✅ Twilio messages arrive (FIRST_MEDIA_MESSAGE_RECEIVED)
- ❌ Deepgram connection fails (DEEPGRAM_STT_WEBSOCKET_CLOSED with error 1006)

---

## Stop Debugging Twilio Integration

If you see this note in the future and are tempted to debug "why Twilio events aren't firing":

**STOP. CHECK DEBUG MARKERS FIRST.**

```bash
# Run this command:
source .env && curl -s -X POST https://db.ai-tools-marketplace.io/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${VULTR_DB_API_KEY}" \
  -d '{"sql": "SELECT marker_name, metadata FROM debug_markers ORDER BY created_at DESC LIMIT 15", "params": []}'
```

**If you see `FIRST_MEDIA_MESSAGE_RECEIVED`:** Twilio is working. Move on.
**If you see `DEEPGRAM_STT_WEBSOCKET_CLOSED` with error 1006:** This is the problem. Stop trying to fix Twilio.

---

**The path forward is NOT to keep trying outbound WebSocket patterns from Workers.**

**The path forward is to use Durable Objects, Workers AI, or move to a platform that supports outbound WebSockets.**

---

## UPDATE: Root Cause Identified - ws:// vs wss://

**Date:** 2025-11-17 (Session 9)

### The Actual Problem

**Cloudflare Workers cannot fetch `ws://` URLs (insecure WebSocket). They require `wss://` (secure WebSocket).**

### Evidence from Debug Markers

Latest test call showed:
```
✅ DEEPGRAM_STT_FETCH_UPGRADE_ATTEMPT - fetch() was called
❌ NO DEEPGRAM_STT_FETCH_RESPONSE - fetch() never completed
```

The fetch() call was **hanging indefinitely** when trying to connect to `ws://144.202.15.249:8080/deepgram`.

### The Fix Applied

**Changed from:**
```typescript
const baseUrl = 'ws://144.202.15.249:8080/deepgram';  // ❌ HANGS
```

**Changed to:**
```typescript
const baseUrl = 'wss://api.deepgram.com/v1/listen';  // ✅ Should work
params.append('token', this.config.apiKey);
```

**File:** `src/voice-pipeline/deepgram-stt.ts` (line 351)

### Why This Matters

**Cloudflare Workers Security Policy:**
- ✅ Can fetch `https://` URLs (secure HTTP)
- ✅ Can fetch `wss://` URLs (secure WebSocket)
- ❌ Cannot fetch `http://` URLs from secure origins (mixed content)
- ❌ **Cannot fetch `ws://` URLs - they just hang**

Our proxy was running on plain HTTP/WebSocket (`ws://`), which Workers cannot access.

### What This Means

1. **No proxy needed** - Connecting directly to Deepgram's `wss://` endpoint
2. **fetch-upgrade pattern should work** - Now that we're using `wss://`
3. **Proxy server is unnecessary** - Was a red herring trying to solve the wrong problem

### Expected Behavior After Fix

**Debug markers should show:**
```
✅ DEEPGRAM_STT_FETCH_UPGRADE_ATTEMPT
✅ DEEPGRAM_STT_FETCH_RESPONSE (status: 101, hasWebSocket: true)
✅ DEEPGRAM_STT_WEBSOCKET_OPENED
✅ DEEPGRAM_STT_FIRST_MESSAGE_RECEIVED
```

**What should NOT appear:**
```
❌ Fetch hanging (no response marker)
❌ DEEPGRAM_STT_WEBSOCKET_ERROR
❌ DEEPGRAM_STT_WEBSOCKET_CLOSED (error 1006)
```

### Lessons Learned

1. **Cloudflare Workers require wss://** - Not documented clearly enough
2. **ws:// causes silent hang** - Not an error, just infinite waiting
3. **Proxy was wrong approach** - Added complexity when direct connection works
4. **Always check protocol** - ws:// vs wss:// matters in Workers

### Deployment Status

- ✅ **Deployed:** 2025-11-17
- ✅ **File changed:** `src/voice-pipeline/deepgram-stt.ts`
- ⏳ **Testing:** Awaiting next test call

---

**End of documentation. Testing in progress.**
