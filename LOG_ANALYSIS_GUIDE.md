# Log Analysis Guide

**Created:** 2025-11-18
**Purpose:** Document how to search and analyze logs for debugging Call Me Back issues

---

## How to Access Logs

### Voice Pipeline Logs (Vultr/PM2)

**Basic command:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 100 --nostream'
```

**Filtered for key events:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 200 --nostream' | grep -E "(ElevenLabs|User said|AI says|Force response|Turn Decision|disconnected|reconnecting|STOP)" | tail -50
```

**Real-time monitoring:**
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline'
```

### API Gateway / Raindrop Services Logs

```bash
raindrop logs tail -n 100 --application call-me-back
```

**Real-time:**
```bash
raindrop logs tail -f --application call-me-back
```

### Database Debug Markers (Low Context Usage)

```bash
./query-debug-markers.sh
```

---

## Common Grep Patterns

### Find Specific Call by SID
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 500 --nostream' | grep "CA1a1909b348a4b0d1194c309481bbd024"
```

### Find Connection Issues
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 200 --nostream' | grep -E "(disconnected|reconnecting|WebSocket is not open|readyState)"
```

### Find Turn Detection Issues
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 200 --nostream' | grep -E "(Turn Decision|Force response|Evaluating turn)"
```

### Find ElevenLabs Issues
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 200 --nostream' | grep -E "(ElevenLabs|Speaking:|finished speaking)"
```

### Find Deepgram Issues
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 200 --nostream' | grep -E "(Deepgram|User said:|Silence detected)"
```

---

## Recent Log Analysis (2025-11-18)

### Issue: Sarah "Droppy-Outty" - AI Responses Cut Off Mid-Sentence

**Call SID:** CA1a1909b348a4b0d1194c309481bbd024

**Symptoms:**
- AI responses truncated mid-sentence
- ElevenLabs disconnecting and reconnecting between EVERY response
- Responses like "Not much, but we do have a situation at" (incomplete)

**Root Cause Analysis:**

#### 1. **ElevenLabs Connection Instability (CRITICAL)**

Pattern observed:
```
[VoicePipeline CA1a...] AI says: Not much, but we do have a situation at
[VoicePipeline CA1a...] Speaking: Not much, but we do have a situation at
[VoicePipeline CA1a...] ElevenLabs finished speaking
[VoicePipeline CA1a...] ElevenLabs connection closed  ← CLOSES AFTER EVERY RESPONSE
[VoicePipeline CA1a...] User said: okay what's the situation
[VoicePipeline CA1a...] AI says: The Johnson account has escalated a dispute over last quarter
[VoicePipeline CA1a...] ElevenLabs disconnected, reconnecting...  ← HAS TO RECONNECT
[VoicePipeline CA1a...] Connecting to ElevenLabs with voice: EXAVITQu4vr4xnSDxMaL...
[VoicePipeline CA1a...] ElevenLabs connected
[VoicePipeline CA1a...] Speaking: The Johnson account has escalated a dispute over last quarter
```

**Problem:** ElevenLabs WebSocket is closing after EVERY single response, requiring reconnection.

**Why this causes "droppy" audio:**
- Connection overhead adds latency
- Reconnection may fail intermittently
- Audio stream gets interrupted during reconnection

**Expected behavior:** ElevenLabs WebSocket should stay open for entire call duration.

#### 2. **AI Responses Truncated Mid-Sentence**

Examples from logs:
- "Not much, but we do have a situation at" (incomplete)
- "The Johnson account has escalated a dispute over last quarter" (incomplete)
- "It sounds like there's some background noise, can" (incomplete)
- "Sorry about that, I'll try to keep this" (incomplete)
- "Let's get back to the Johnson account - their" (incomplete)

**All responses end abruptly**, suggesting:
1. Token limit too low (current: 70 tokens may still be too restrictive)
2. ElevenLabs cutting off due to connection issues
3. Cerebras API returning incomplete responses

#### 3. **Deepgram WebSocket Timing Issues (Still Present)**

Error logs show:
```
[Voice Pipeline] Error processing Twilio message: Error: WebSocket is not open: readyState 0 (CONNECTING)
    at WebSocket.send (/opt/voice-pipeline/node_modules/ws/lib/websocket.js:450:13)
    at VoicePipeline.handleTwilioMedia (file:///opt/voice-pipeline/index.js:700:23)
```

This error appears MANY times, indicating audio is being sent to Deepgram before it's ready.

---

## Priority Fixes

### Priority 1: Fix ElevenLabs Connection Persistence (IMMEDIATE)

**Issue:** ElevenLabs WebSocket closing after every response

**Locations to check:**
- `voice-pipeline-nodejs/index.js` around line 300-400 (connectElevenLabs function)
- Check if we're calling `elevenLabsWs.close()` after speaking
- Check ElevenLabs event handlers for unexpected closures

**Fix:** Keep ElevenLabs connection open for entire call duration, only close on call end.

### Priority 2: Investigate AI Response Truncation (HIGH)

**Possible causes:**
1. `max_tokens: 70` still too low
2. Cerebras API configuration issue
3. Response parsing/buffering issue

**Actions:**
1. Increase max_tokens to 100 temporarily and test
2. Add logging for full Cerebras API response
3. Check if truncation happens at Cerebras or ElevenLabs level

### Priority 3: Fix Deepgram Connection Timing (HIGH)

**Issue:** Audio sent before Deepgram WebSocket ready (readyState 0)

**Fix:** Add proper connection state checking before forwarding audio

---

## Log Patterns Reference

### Healthy Call Pattern
```
[VoicePipeline <SID>] Connecting to Deepgram...
[VoicePipeline <SID>] Deepgram connected
[VoicePipeline <SID>] Connecting to ElevenLabs...
[VoicePipeline <SID>] ElevenLabs connected
[VoicePipeline <SID>] All services connected
[VoicePipeline <SID>] User said: <transcript>
[VoicePipeline <SID>] Turn Decision: RESPOND
[VoicePipeline <SID>] AI says: <complete response>
[VoicePipeline <SID>] Speaking: <complete response>
[VoicePipeline <SID>] ElevenLabs finished speaking
[VoicePipeline <SID>] Finished speaking, ready for user input
... (ElevenLabs stays connected)
[Voice Pipeline] Received STOP message from Twilio
[VoicePipeline <SID>] Cleaning up...
[VoicePipeline <SID>] ElevenLabs connection closed  ← ONLY CLOSES AT END
```

### Unhealthy Call Pattern (Current State)
```
[VoicePipeline <SID>] ElevenLabs connected
[VoicePipeline <SID>] AI says: Truncated response
[VoicePipeline <SID>] ElevenLabs finished speaking
[VoicePipeline <SID>] ElevenLabs connection closed  ← CLOSES TOO EARLY
... user speaks ...
[VoicePipeline <SID>] ElevenLabs disconnected, reconnecting...  ← FORCED TO RECONNECT
[VoicePipeline <SID>] Connecting to ElevenLabs...
```

---

## Testing Checklist After Fixes

- [ ] Make call with Sarah persona
- [ ] Check logs for ElevenLabs connection persistence
- [ ] Verify NO "ElevenLabs disconnected, reconnecting..." messages during call
- [ ] Verify AI responses are complete sentences
- [ ] Check NO Deepgram "readyState 0" errors
- [ ] Have 5+ turn conversation
- [ ] Verify audio quality is consistent (not "droppy")

---

## Additional Resources

- Voice pipeline code: `voice-pipeline-nodejs/index.js`
- Connection management: Look for `connectElevenLabs()`, `connectDeepgram()` functions
- Cleanup logic: Look for `cleanup()` method
- ElevenLabs event handlers: Search for `elevenLabsWs.on('close')`
