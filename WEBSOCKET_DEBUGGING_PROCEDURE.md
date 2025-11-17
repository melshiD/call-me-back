# WebSocket Debugging Procedure for Cloudflare Workers

## The Problem We Keep Facing

**Symptom:** WebSocket connection established, but event listeners never fire
**Result:** No "start" message received from Twilio, voice pipeline never initializes

## Things We've Tried (That Didn't Work)

1. ❌ Adding event listeners BEFORE accept()
2. ❌ Adding event listeners AFTER accept()
3. ❌ Using separate method call for setup
4. ❌ Inlining event listeners synchronously
5. ❌ Using ctx.waitUntil() with never-resolving promise

## Systematic Debugging Steps

### Step 1: Verify WebSocket Connection Established
```bash
raindrop logs tail -n 100 --application call-me-back | grep -E "WebSocket|upgrade|stream request"
```

**What to look for:**
- ✅ "WebSocket stream request"
- ✅ "WebSocket upgrade request received"
- ✅ "WebSocket accept() called, readyState: 1"

### Step 2: Check if Event Listeners Are Set Up
```bash
raindrop logs tail -n 100 --application call-me-back | grep -E "Event listeners set up|SYNCHRONOUSLY"
```

**What to look for:**
- ✅ "Setting up event listeners SYNCHRONOUSLY..."
- ✅ "Event listeners set up, waiting for messages from Twilio..."

### Step 3: Check if ANY Events Fire
```bash
raindrop logs tail -n 200 --application call-me-back | grep -E "message event fired|ERROR event|CLOSE event|====="
```

**What to look for:**
- ❌ NONE of these appear (this is our current problem)

### Step 4: Check Debug Markers
```bash
raindrop logs tail -n 100 --application call-me-back | grep -E "debug_markers|INSERT INTO"
```

**What to look for:**
- ✅ Debug markers ARE being written (proves code is running)

### Step 5: Check Proxy Logs
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 logs deepgram-proxy --lines 20 --nostream"
```

**What to look for:**
- ❌ No connection attempts (proves Deepgram STT handler never runs)

## Key Observations

1. **Twilio DOES connect** - We see the WebSocket upgrade request from Twilio
2. **Accept DOES succeed** - readyState is 1 (OPEN)
3. **Event listeners ARE added** - We see the log message
4. **Events NEVER fire** - No message/error/close events at all
5. **Code IS running** - Debug markers prove the Worker didn't crash

## The Real Problem

**Cloudflare Workers WebSocket events DON'T WORK the way we expect them to.**

The event listeners are added, but Cloudflare Workers doesn't actually deliver the events to them. This is likely because:

1. The execution context ends after returning the 101 response
2. WebSocket events require a different pattern in Cloudflare Workers
3. We need to use the Cloudflare Workers Durable Objects pattern instead
4. OR there's a completely different API we should be using

## What Actually Works in Cloudflare Workers

Based on the echo endpoint that DOES work, we know:
- Event listeners CAN fire in Workers
- But only if the pattern is exactly right

## Next Investigation Steps

1. **Compare with working echo endpoint** - What's different?
2. **Check Raindrop-specific WebSocket handling** - Does Raindrop abstract WebSockets differently?
3. **Look for Raindrop WebSocket examples** - How do other apps handle this?
4. **Check if Twilio is actually sending messages** - Maybe it's not our code at all?

## Hypothesis to Test

**Maybe the issue is that we return the Response immediately, before Twilio connects?**

The pattern might need to be:
1. Create WebSocket pair
2. Accept connection
3. Add event listeners
4. **DON'T return Response yet**
5. Wait for confirmation that Twilio is connected
6. **THEN** return Response

But this conflicts with how HTTP 101 upgrades work...

## Alternative: Check if Raindrop Uses Different WebSocket API

Raindrop might have its own WebSocket abstraction that we need to use instead of native Cloudflare Workers WebSocket API.

Check:
- Raindrop documentation for WebSocket handling
- Look for `@raindrop/websocket` or similar
- Check if other services use WebSocket successfully
