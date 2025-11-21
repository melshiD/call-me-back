# Voice Pipeline Architecture & Implementation

**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** [voice-pipeline, architecture, real-time-streaming, ai-services]

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Services Integration](#services-integration)
3. [Call Flow](#call-flow)
4. [Debugging Guide](#debugging-guide)
5. [Performance Tuning](#performance-tuning)
6. [VAD & Turn Detection](#vad--turn-detection)
7. [Research & Future Work](#research--future-work)

---

## Architecture Overview

### Why Vultr? Technical Constraints

The voice pipeline runs on a **Vultr VPS (144.202.15.249)** instead of Cloudflare Workers due to hard technical constraints:

**Constraint 1: Outbound WebSocket Connections**
- Cloudflare Workers CANNOT establish outbound WebSocket connections
- Voice pipeline requires persistent WebSocket connections to:
  - **Deepgram:** Speech-to-text (STT) streaming
  - **ElevenLabs:** Text-to-speech (TTS) streaming
- **Solution:** Migrate voice pipeline to Node.js on Vultr VPS

**Constraint 2: Network Isolation**
- Cloudflare Workers cannot directly fetch external URLs
- **Solution:** Database-proxy pattern (Vultr Express API called by Workers)

**Result:** Hybrid multi-cloud architecture with:
- **Raindrop/Cloudflare Workers:** API Gateway, authentication, orchestration
- **Vultr VPS:** Voice pipeline, database, real-time streaming

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ TWILIO VOICE API                                            │
│ (Initiates call, WebSocket connection from user)            │
└────────────────────┬────────────────────────────────────────┘
                     │ wss://voice.ai-tools-marketplace.io/stream
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ VULTR VPS (144.202.15.249) - Node.js Voice Pipeline         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Twilio WebSocket Server (ws library, port 8080)     │   │
│  │ - Receives: mulaw audio stream (8kHz, 20ms frames)  │   │
│  │ - Sends: audio responses back to caller              │   │
│  └──────┬──────────────────────────────────────────┬───┘   │
│         │                                          │         │
│         ▼                                          ▼         │
│  ┌────────────────────┐          ┌──────────────────────┐   │
│  │ Deepgram STT       │          │ ElevenLabs TTS       │   │
│  │ (Outbound WS)      │          │ (Outbound WS)        │   │
│  │ mulaw → transcript │          │ text → audio         │   │
│  │ 8kHz streaming     │          │ PCM streaming        │   │
│  └────────┬───────────┘          └──────────┬───────────┘   │
│           │                                 │                │
│           ▼                                 ▼                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Voice Pipeline Processing (voice-pipeline-nodejs)   │   │
│  │ ┌──────────────────────────────────────────────┐   │   │
│  │ │ 1. Audio Input: Receive from Twilio          │   │   │
│  │ │    - Decode mulaw to PCM (16-bit)            │   │   │
│  │ │    - Forward to Deepgram                      │   │   │
│  │ ├──────────────────────────────────────────────┤   │   │
│  │ │ 2. Transcription: Stream from Deepgram        │   │   │
│  │ │    - Accumulate transcript until turn done    │   │   │
│  │ │    - Silence detection + VAD + heuristic      │   │   │
│  │ │    - LLM evaluation for ambiguous cases       │   │   │
│  │ ├──────────────────────────────────────────────┤   │   │
│  │ │ 3. LLM Inference: Cerebras llama3.1-8b        │   │   │
│  │ │    - Sub-1-second inference                   │   │   │
│  │ │    - Cost: $0.10/1M tokens (40x cheaper)      │   │   │
│  │ │    - Persona-specific system prompt           │   │   │
│  │ ├──────────────────────────────────────────────┤   │   │
│  │ │ 4. TTS Streaming: ElevenLabs                  │   │   │
│  │ │    - Stream text in chunks                    │   │   │
│  │ │    - Receive PCM audio chunks                 │   │   │
│  │ │    - Convert PCM to mulaw                     │   │   │
│  │ │    - Send to Twilio immediately              │   │   │
│  │ └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### WebSocket Flow

```
Timeline (milliseconds from user finishing speech):

T=0ms     User stops speaking (gap in audio)
          ↓
T=500ms   Silence detected: Check if turn is complete
          - Run heuristic check (pattern matching)
          - If RESPOND_CONFIDENT → Skip LLM, respond immediately
          - If UNCLEAR → Proceed to LLM evaluation
          ↓
T=1200ms  LLM Evaluation #1 (Cerebras)
          - Send transcript + system prompt
          - Response: "RESPOND" or "WAIT"
          - If WAIT → Reset timer, wait more
          - If RESPOND → Generate AI response
          ↓
T=2400ms  LLM Evaluation #2 (if still unclear)
          - Same evaluation as #1
          - Highest evaluation attempt allowed
          ↓
T=3000ms  Force Response (safety timeout)
          - Regardless of evaluations, respond now
          - Prevents calls from going silent
          ↓
T=3500ms  Cerebras Inference
          - Generate AI response based on persona
          - Stream response to ElevenLabs
          ↓
T=3800ms  ElevenLabs TTS Streaming
          - Receive audio chunks as text is processed
          - Convert PCM → mulaw
          - Send to Twilio immediately
          ↓
T=4100ms  User Hears Audio
          - First audio chunk reaches caller
          - Total latency: ~2-4 seconds (current)
          - Target: <1 second (with VAD optimization)
```

---

## Services Integration

### Twilio Voice API

**Role:** Phone call infrastructure, audio media streaming, call lifecycle management

**Connection Details:**
- **Endpoint:** wss://voice.ai-tools-marketplace.io/stream
- **Protocol:** WebSocket (HTTP 101 upgrade)
- **Audio Format:** mulaw-encoded PCM, 8kHz sample rate, 20ms packets
- **Packet Structure:** JSON events
  ```json
  {
    "event": "media",
    "media": {
      "payload": "base64-encoded-mulaw-audio",
      "timestamp": "12345678"
    }
  }
  ```

**Key Events:**
- `start`: Call session initiated (contains CallSid, From, To)
- `media`: Audio chunk from user (20ms frames)
- `mark`: Twilio-specific timing marker
- `stop`: User hung up or call ended

**Current Implementation:**
- ✅ Call initiation via `/api/voice/twiml` endpoint
- ✅ WebSocket connection accepted and processed
- ❌ Turn detection sometimes doesn't trigger response (hangs after 2-3 turns)
- ⚠️ Interruption handling detects user talking but doesn't stop TTS playback cleanly

**See Also:** [VOICE_PIPELINE_DEBUG_FINDINGS.md](../../VOICE_PIPELINE_DEBUG_FINDINGS.md)

---

### Deepgram Speech-to-Text

**Role:** Real-time streaming transcription, interim results, confidence scoring

**Integration:**
- **API:** Streaming WebSocket (wss://api.deepgram.com/v1/listen)
- **Model:** nova-2 (latest, most accurate)
- **Language:** en-US
- **Cost:** $0.0059/minute ($0.03 per 5-min call)
- **Latency:** 200-500ms (real-time streaming)

**Audio Format Mismatch (CRITICAL):**
- Twilio sends: mulaw-encoded PCM, 8kHz
- Deepgram expects: Linear PCM (16-bit), varies by negotiation
- **Solution:** Convert mulaw → PCM before forwarding

**Connection Issues Debugged:**
- ❌ **Issue:** WebSocket in CONNECTING state (readyState=0) when audio arrives
- ❌ **Root Cause:** Audio forwarded before Deepgram WebSocket fully connects
- **Status:** Improved with connection state tracking, still occasional timing issues

**Implementation (voice-pipeline-nodejs/index.js):**
```javascript
// Lines ~300-350: connectDeepgram()
// - Creates WebSocket connection
// - Waits for 'open' event before marking ready
// - Buffers audio until connected
// - Handles reconnection on close

// Lines ~920-950: handleTwilioMedia()
// - Receives mulaw audio from Twilio
// - Converts to PCM
// - Forwards to Deepgram only when ready
```

**Debugging Commands:**
```bash
# Monitor Deepgram connection
ssh root@144.202.15.249 "pm2 logs voice-pipeline | grep -i deepgram | head -20"

# Check WebSocket state
ssh root@144.202.15.249 "pm2 logs voice-pipeline | grep -E 'readyState|CONNECTING|OPEN'"
```

---

### Cerebras AI - LLM Inference

**Role:** Turn evaluation (RESPOND vs WAIT decision), response generation

**Specs:**
- **Model:** llama3.1-8b (open-source, very capable)
- **API:** RESTful HTTP (not WebSocket)
- **Latency:** <1 second per inference (extremely fast)
- **Cost:** $0.10/1M tokens (40x cheaper than GPT-4)
- **Architecture:** Inference-only (no fine-tuning, pre-trained)

**Two Use Cases in Pipeline:**

**Use Case 1: Turn Evaluation**
```javascript
// Lines ~460-470: evaluateTurnCompletion()
// - Input: User transcript so far
// - System Prompt: "Is the user done speaking? RESPOND or WAIT?"
// - Output: {"completion": "RESPOND"} or {"completion": "WAIT"}
// - Token Count: ~50 tokens, <100ms response
// - Cost: <$0.00001 per evaluation

const evaluationPrompt = `
You are analyzing a phone conversation. Based on the user's last statement,
should the AI respond now or wait for more input?

User said: "${transcript}"

Respond with ONLY: "RESPOND" or "WAIT"
`;
```

**Use Case 2: Response Generation**
```javascript
// Lines ~500-550: generateResponse()
// - Input: Full conversation history, persona system prompt
// - Output: Natural language response from AI persona
// - Token Count: ~100-200 tokens, <1s response
// - Cost: $0.00001-$0.00002 per response

const systemPrompt = `
You are Brad, a fitness coach. You are direct, loyal, and motivating.
Your responses are concise (max 70 tokens), suitable for phone conversations.
Never use stage directions like "(laughs)" - this is a real phone call.

Keep responses natural and brief. Do not over-explain.
`;

const userPrompt = `
User: "${userTranscript}"
Brad: `;
```

**Connection Details:**
- **Endpoint:** https://api.cerebras.ai/v1/chat/completions
- **Auth:** Bearer token in Authorization header
- **Request Format:** OpenAI-compatible API
- **Response:** Standard OpenAI completion object with usage stats

**Current Status:**
- ✅ Sub-1s inference confirmed
- ✅ Persona-specific responses working
- ✅ Token counting accurate
- ⚠️ Turn evaluation sometimes incorrect (users say more after "WAIT" response)

---

### ElevenLabs Text-to-Speech

**Role:** Real-time streaming audio generation, voice synthesis, interruption handling

**Specs:**
- **Model:** eleven_turbo_v2_5 (being optimized to eleven_flash_v2_5)
- **Voices:** Brad, Sarah, Alex (configurable per persona)
- **API:** Streaming WebSocket
- **Audio Format Out:** PCM (needs conversion to mulaw for Twilio)
- **Latency:** 300-500ms (first audio chunk to user)
- **Cost:** $0.15/1K characters ($0.30 per 5-min call, largest API cost!)

**Streaming Optimization (IMPLEMENTED):**

The pipeline uses chunked streaming to reduce latency:
```javascript
// Lines ~296-330: connectElevenLabs()
// Initialize connection with optimization params
const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?
  model_id=eleven_turbo_v2_5&
  optimize_streaming_latency=4&
  output_format=ulaw_8000`;

// Configuration: chunk_length_schedule
generation_config: {
  chunk_length_schedule: [120, 160, 250, 290]
  // Means:
  // - At 120 chars: Generate audio chunk 1
  // - At 160 chars: Generate audio chunk 2
  // - At 250 chars: Generate audio chunk 3
  // - At 290+ chars: Generate rest at once
  // Result: User hears audio WHILE text is being generated
}
```

**Connection Issues & Fixes:**

**Issue 1: 20-Second Timeout**
- ✅ **Fixed** (Nov 20): Send empty string `{"text": ""}` after completing text to signal end-of-input
- **Code Location:** Line ~786-789

**Issue 2: Interruption Handling**
- ✅ **Partially Fixed**: Send flush message `{"text": "", "flush": true}` when user interrupts
- **Code Location:** Line ~372-378
- ⚠️ May need multi-context stream endpoint for cleaner interruption

**Issue 3: Audio Not Being Played to User**
- ❌ **Still Being Investigated:** ElevenLabs reports `isFinal:true` but logs show `audio:null`
- **Possible Causes:**
  1. Audio chunks not being logged (filter?)
  2. Audio format conversion issue (PCM → mulaw)
  3. Not sending audio to Twilio correctly
  4. ElevenLabs generating silence

**Debugging Voice Selection:**
```bash
# Check which voice model is deployed
ssh root@144.202.15.249 "grep -n 'eleven_.*_v2' /opt/voice-pipeline/index.js | head -5"

# Expected: eleven_turbo_v2_5 or eleven_flash_v2_5 (NOT turbo_v2 or flash_v2)

# Check if custom voice IDs are set
ssh root@144.202.15.249 "pm2 logs voice-pipeline | grep -i 'voice\|ElevenLabs' | head -20"
```

---

### Silero VAD (Voice Activity Detection)

**Status:** Phase 1 Complete (Foundation), Phase 2 Blocked (Audio Processing)

**What's Implemented:**
- ✅ Silero-VAD v5 model installed (22 packages, 2MB local model)
- ✅ avr-vad@1.0.9 NPM package integrated
- ✅ VAD initialization in voice pipeline `start()` method
- ✅ Event handlers for speech start/stop
- ✅ Hybrid approach: VAD + heuristic + LLM

**What's NOT Working:**
- ❌ No audio being fed to VAD yet (format conversion not implemented)
- ❌ VAD events not firing in logs (input side not connected)
- ⚠️ System still uses timer-based detection with reduced thresholds (800ms vs 1200ms)

**Why VAD Matters:**
- **Current Latency:** 2-4 seconds (timer-based + LLM evaluation)
- **With Full VAD:** Expected <1 second (87% improvement!)
- **How:** Silero detects speech end in 100-300ms, skip LLM for obvious cases

**Configuration (Implemented):**
```javascript
// Lines ~59-81: VAD initialization
this.config = {
  shortSilenceMs: 300,       // Ignore pauses <300ms
  llmEvalThresholdMs: 800,   // Trigger eval after 800ms silence (reduced from 1200)
  forceResponseMs: 2000,     // Force response after 2s (reduced from 3000)
  maxEvaluations: 2          // Max LLM evals before forcing
};

// VAD settings (lines ~394-420)
{
  model: 'v5',                      // Latest Silero model
  positiveSpeechThreshold: 0.5,    // 50% probability to start
  negativeSpeechThreshold: 0.35,   // 35% probability to end
  redemptionFrames: 10,            // Allow 300ms pauses in speech
  minSpeechFrames: 3,              // Require 90ms to confirm
  frameSamples: 1536               // 96ms frames at 16kHz
}
```

**Phase 2 - Audio Processing (TODO):**

Silero requires Float32Array audio at 16kHz, but Twilio sends mulaw 8kHz:

```javascript
// What needs to be implemented:

// 1. Audio format conversion (mulaw → PCM)
const mulawBuffer = Buffer.from(audioPayload, 'base64');
const pcmBuffer = this.mulawToPcm(mulawBuffer);

// 2. Sample rate conversion (8kHz → 16kHz)
const float32Audio = this.pcmToFloat32(pcmBuffer);
const resampledAudio = this.resampler.process(float32Audio);

// 3. Feed to VAD
await this.vad.processFrame(resampledAudio);

// 4. Listen for events
// onSpeechStart() → user talking
// onSpeechEnd() → user stopped, trigger immediate response
```

**Files to Modify:**
- `voice-pipeline-nodejs/index.js` - handleTwilioMedia() method (line ~920)
- Add conversion functions: `mulawToPcm()`, `pcmToFloat32()`

**Estimated Effort:** 1-2 hours (straightforward but requires testing)

**See Also:** [SILERO_VAD_IMPLEMENTATION_STATUS.md](../../SILERO_VAD_IMPLEMENTATION_STATUS.md)

---

## Call Flow

### Complete Call Lifecycle

**Phase 1: Initiation (User → Frontend → Backend)**
```
1. User clicks "Call Now" on frontend
2. Frontend triggers POST /api/calls/trigger
   - Persona selection (Brad/Sarah/Alex)
   - Phone number
   - Optional call pretext

3. API Gateway → Call Orchestrator
   - Validates user credits
   - Creates call record (status: 'initiated')
   - Calls Twilio API to initiate outbound call

4. Twilio rings user's phone
   - Shows caller ID: TWILIO_PHONE_NUMBER
   - User picks up
```

**Phase 2: TwiML & WebSocket Upgrade**
```
5. Twilio calls webhook: GET /api/voice/twiml?callId={id}
   - API Gateway → Webhook Handler
   - Returns TwiML with WebSocket stream URL
   - TwiML Example:
     <Response>
       <Say>Connecting you now</Say>
       <Connect>
         <Stream url="wss://voice.ai-tools-marketplace.io/stream?callId={id}&persona={id}" />
       </Connect>
     </Response>

6. Twilio connects to WebSocket
   - wss://voice.ai-tools-marketplace.io/stream?callId={id}
   - Vultr voice pipeline accepts connection
   - HTTP 101 upgrade response
```

**Phase 3: Service Initialization**
```
7. Voice Pipeline start() method
   - Fetch persona metadata from database
   - Load system prompt, voice ID, AI parameters
   - Initialize Deepgram WebSocket (STT)
   - Initialize ElevenLabs WebSocket (TTS)
   - Optionally start Silero VAD

8. Deepgram connects
   - Establishes streaming STT connection
   - Ready to receive audio and return transcripts

9. ElevenLabs connects
   - Establishes streaming TTS connection
   - Ready to receive text and generate audio
```

**Phase 4: Audio Streaming Loop (Real-time Bidirectional)**
```
[REPEAT FOR EACH TURN]:

10. User speaks
    - Twilio captures audio (mulaw, 8kHz, 20ms frames)
    - Sends media events via WebSocket to voice pipeline

11. Audio forwarding
    - Voice pipeline receives mulaw chunks
    - Converts to PCM format (Deepgram requirement)
    - Forwards to Deepgram WebSocket

12. Transcription streaming
    - Deepgram processes audio, returns interim transcripts
    - Voice pipeline accumulates words until turn complete
    - Example:
      {interim: "hello"}
      {interim: "hello there"}
      {final: "hello there how are you"}

13. Turn completion detection (THIS IS COMPLEX)
    - Silence detected: 500ms+ without audio
    - Check heuristic patterns:
      * Ends with "?" → RESPOND (question)
      * Ends with "." → Evaluate (statement)
      * Trailing incomplete words → WAIT
      * Short utterances <5 words → RESPOND
    - If heuristic unclear:
      * Call Cerebras: "Is this complete?"
      * Response: "RESPOND" or "WAIT"
    - If user takes too long:
      * After 3000ms total silence → Force response

14. LLM response generation
    - Transcript: "hello there how are you"
    - System prompt: Persona definition (Brad/Sarah/Alex)
    - Call Cerebras llama3.1-8b
    - Response: "Hey! I'm doing great, how about you?"
    - Latency: <1 second

15. TTS streaming
    - Voice pipeline receives response from Cerebras
    - Streams text to ElevenLabs in chunks
    - ElevenLabs processes text → generates audio chunks (PCM format)
    - Voice pipeline receives audio chunks
    - Converts PCM → mulaw (Twilio format)
    - Sends audio chunks to Twilio WebSocket
    - Example:
      [chunk1: 100ms audio]
      [chunk2: 100ms audio]
      [chunk3: 100ms audio]
      Total: 300ms audio for response

16. User hears response
    - Audio plays through phone
    - User can interrupt by speaking again
    - Go to step 10 (next turn)
```

**Phase 5: Call Termination**
```
17. Call ends (user hangs up OR timer expires)
    - Twilio sends 'stop' event
    - Voice pipeline receives stop message

18. Cleanup
    - Close Deepgram WebSocket
    - Close ElevenLabs WebSocket
    - Destroy Silero VAD (if enabled)

19. Call record update
    - Duration: actual call length
    - Status: 'completed'
    - Cost: calculated from usage
    - SHOULD write cost events (not implemented)
    - SHOULD deduct user credits (not implemented)
```

### Detailed WebSocket Message Format

**Twilio Media Event:**
```json
{
  "event": "media",
  "sequenceNumber": "123",
  "media": {
    "payload": "base64-encoded-mulaw-audio"
  },
  "streamSid": "MJ123abc..."
}
```

**Deepgram Streaming Response:**
```json
{
  "type": "Results",
  "result": {
    "results": [
      {
        "channel": {
          "alternatives": [
            {
              "transcript": "hello there",
              "confidence": 0.95,
              "words": [
                {"word": "hello", "start": 0, "end": 0.5},
                {"word": "there", "start": 0.5, "end": 1.0}
              ]
            }
          ]
        },
        "is_final": false
      }
    ]
  }
}
```

**ElevenLabs Audio Event:**
```json
{
  "audio": "base64-encoded-pcm-audio",
  "isFinal": false,
  "normalizedAlignment": {...}
}
// Or final: {"isFinal": true} with no audio for end-of-stream
```

---

## Debugging Guide

### Common Issues & Solutions

#### Issue 1: No Audio Being Played to User

**Symptom:** ElevenLabs returns audio chunks, but user hears nothing

**Possible Causes:**
1. Audio chunks not logged (filter hides them?)
2. Audio format wrong (PCM not properly converted to mulaw)
3. Not sending to Twilio correctly
4. ElevenLabs generating silence

**Debug Steps:**
```bash
# Step 1: Check if audio messages exist in logs
ssh root@144.202.15.249 "pm2 logs voice-pipeline --lines 500 | grep -c 'audio:'"

# Step 2: Verify ElevenLabs is generating audio
ssh root@144.202.15.249 "pm2 logs voice-pipeline | grep -i 'elevenlabs\|audio' | head -30"

# Step 3: Check mulaw conversion function
ssh root@144.202.15.249 "grep -n 'mulawToPcm\|pcmToMulaw\|ulaw' /opt/voice-pipeline/index.js | head -10"

# Step 4: Add debug logging
# Edit voice-pipeline-nodejs/index.js line ~850
// Before: this.twilioWs.send(audioChunk)
// After:
console.log(`[DEBUG] Audio chunk size: ${audioChunk.length}, type: ${typeof audioChunk}`);
this.twilioWs.send(audioChunk);
```

**Likely Fix:** Add comprehensive audio logging to ElevenLabs handler

---

#### Issue 2: Excessive Latency (4+ seconds)

**Symptom:** User finishes speaking, waits 4-5 seconds before AI responds

**Root Cause:** VAD being overly cautious
- Evaluation 1 at 1200ms: WAIT
- Evaluation 2 at 2748ms: WAIT
- Force response after maxEvaluations

**Current Configuration (Partially Fixed):**
```javascript
this.config = {
  shortSilenceMs: 300,       // Reduced from 500 ✅
  llmEvalThresholdMs: 800,   // Reduced from 1200 ✅
  forceResponseMs: 2000,     // Reduced from 3000 ✅
  maxEvaluations: 2
};
```

**Further Optimization Options:**

**Option A: Improve Heuristic**
```javascript
// Lines ~478-536: evaluateHeuristic()
// Current: Checks for "?" and trailing words only
// Better: Also recognize:
// - Greetings: "hey", "hello", "hi"
// - Questions: Ends with "?"
// - Short utterances: <5 words = complete
// - Common phrases: "what's up", "how are you"

// Add confidence levels:
// - RESPOND_CONFIDENT: Skip LLM
// - WAIT_CONFIDENT: Don't call LLM
// - UNCLEAR: Use LLM evaluation
```

**Option B: Use Silero VAD**
- Phase 1 complete (initialization)
- Phase 2: Feed audio to VAD
- Phase 3: Use VAD events to trigger response
- Expected latency reduction: 87% (from 2-4s to 100-300ms)

**Option C: Reduce LLM Evaluation Thresholds**
```javascript
this.config = {
  shortSilenceMs: 200,       // 40% reduction
  llmEvalThresholdMs: 600,   // 33% reduction
  forceResponseMs: 1500,     // 25% reduction
  maxEvaluations: 2
};
```

---

#### Issue 3: Call Stops After 2-3 Exchanges

**Symptom:** User says something, long silence, call ends with "Received STOP message from Twilio"

**Example Log:**
```
[VoicePipeline CA549...] User said: oh well what are you guys up to
[VoicePipeline CA549...] Silence detected: 1199ms
[VoicePipeline CA549...] User said: what are you guys up to
[VoicePipeline CA549...] Silence detected: 1199ms
[Voice Pipeline] Received STOP message from Twilio
```

**Root Causes:**
1. Turn evaluation triggered but didn't call `triggerResponse()`
2. Deepgram WebSocket drops unexpectedly
3. Timeout for turn evaluation (takes >5 seconds)
4. Heuristic evaluation too conservative

**Debug Steps:**
```bash
# Check for turn evaluation logs
ssh root@144.202.15.249 "pm2 logs voice-pipeline --lines 500 | grep -i 'evaluation\|respond'"

# Check Deepgram connection status
ssh root@144.202.15.249 "pm2 logs voice-pipeline | grep -i 'deepgram\|readystate\|connecting'"

# Check for errors
ssh root@144.202.15.249 "pm2 logs voice-pipeline --err --lines 50"

# Monitor connection state
ssh root@144.202.15.249 "pm2 logs voice-pipeline --lines 0 | grep -i 'error\|fail\|exception'"
```

**Fixes Applied:**
- ✅ Added force response after maxEvaluations (line ~467-470)
- ✅ Added timeout protection (check if >5s since last response)
- ⚠️ Still need: Better error handling, logging of why response wasn't triggered

---

#### Issue 4: Deepgram WebSocket Not Ready

**Symptom:** Error message: "WebSocket is not open: readyState 0 (CONNECTING)"

**Root Cause:** Audio forwarded before Deepgram connection fully established

**Current Connection Flow:**
```
1. Twilio connects (WebSocket ready) ✅
2. Voice pipeline start() called
3. fetchPersonaMetadata() - async ⚠️
4. connectDeepgram() - async ⚠️ (returns promise when 'open' fires)
5. connectElevenLabs() - async ⚠️
6. Audio starts flowing from Twilio ✅
7. handleTwilioMedia() tries to send to Deepgram ❌ (may not be ready yet!)
```

**Fix Applied:**
- ✅ Added readiness checks in `handleTwilioMedia()`
- ✅ Buffer audio if Deepgram not ready
- ✅ Don't mark as "ready" until WebSocket actually opens

**Code Location:** Lines ~920-950, check readyState before forwarding

---

### Debugging Commands Reference

**Monitor voice pipeline in real-time:**
```bash
ssh root@144.202.15.249 "pm2 logs voice-pipeline --lines 0 --raw"
```

**Search for specific call:**
```bash
# Get call ID from frontend/logs
ssh root@144.202.15.249 "pm2 logs voice-pipeline --lines 1000 | grep 'CA123ABC...'"
```

**Check specific service health:**
```bash
# Deepgram
ssh root@144.202.15.249 "pm2 logs voice-pipeline --lines 500 | grep -i deepgram"

# ElevenLabs
ssh root@144.202.15.249 "pm2 logs voice-pipeline --lines 500 | grep -i elevenlabs"

# Cerebras
ssh root@144.202.15.249 "pm2 logs voice-pipeline --lines 500 | grep -i cerebras"

# Silero VAD
ssh root@144.202.15.249 "pm2 logs voice-pipeline --lines 500 | grep -i 'vad\|silero'"
```

**Check database connectivity:**
```bash
curl -X POST https://db.ai-tools-marketplace.io/query \
  -H "Authorization: Bearer $VULTR_DB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) FROM personas", "params": []}'
```

**Verify voice pipeline deployment:**
```bash
ssh root@144.202.15.249 "ps aux | grep -i voice-pipeline"
ssh root@144.202.15.249 "pm2 status"
ssh root@144.202.15.249 "pm2 describe voice-pipeline"
```

---

## Performance Tuning

### Latency Targets & Current Status

**Current Baseline (2025-11-20):**
- User stops speaking → First audio heard: **2-4 seconds**
- Breakdown:
  - Silence detection: 300-800ms
  - LLM evaluation: 1200-2400ms
  - Cerebras inference: 300-500ms
  - ElevenLabs TTS first chunk: 300-500ms
  - Audio delivery: 100-200ms

**Target Latency: <1 second**
- Silence detection: 100-300ms (VAD instead of timers)
- LLM evaluation: SKIPPED for confident cases (heuristic only)
- Cerebras inference: 300-500ms (already fast)
- ElevenLabs TTS first chunk: 300-500ms (streaming chunks)

**Optimization Strategy:**

**Priority 1: VAD Implementation (87% improvement!)**
- Phase 1: ✅ Complete (VAD initialized)
- Phase 2: Audio format conversion (TODO, 1-2 hours)
- Expected result: 2-4s → 0.5-1s latency

**Priority 2: Heuristic Confidence Levels**
- Skip LLM for obvious cases (questions, greetings)
- Expected result: 2-4s → 1.5-2.5s latency (if VAD not ready)

**Priority 3: ElevenLabs Optimization**
- ✅ Already using chunk_length_schedule
- Consider: Switch to eleven_flash_v2_5 (40-50% faster)
- Expected result: 300-500ms → 150-250ms (TTS only)

**Priority 4: Parallel Processing**
- Start ElevenLabs while Cerebras is inferring
- Current: Cerebras → Wait for response → Send to ElevenLabs
- Better: Cerebras → ElevenLabs ready to receive → Send as chunks arrive

### Cost Optimization

**Current Cost Breakdown (per 5-min call):**
```
Twilio:       $0.070 (7% of cost)
Deepgram:     $0.030 (3% of cost)
Cerebras:     $0.005 (1% of cost)
ElevenLabs:   $0.300 (70% of cost) ← OPTIMIZATION TARGET
Raindrop:     $0.020 (2% of cost)
────────────────────────
Total API:    $0.425

Stripe:       $0.475 (53% of total cost, payment processing)
```

**ElevenLabs Optimization Opportunities:**

**Option A: Model Switch (RECOMMENDED)**
- Current: eleven_turbo_v2_5
- Better: eleven_flash_v2_5
- Benefit: 40-50% latency reduction, 15-20% cost reduction
- Risk: Low (compatible API)
- Effort: 1-2 hours

**Option B: Chunk Length Schedule Tuning**
```javascript
// Current
chunk_length_schedule: [120, 160, 250, 290]

// More aggressive (start generating sooner)
chunk_length_schedule: [50, 120, 160, 290]
// Starts generating audio at 50 chars instead of 120
// Result: User hears first audio 50% faster
```

**Option C: Multi-Context Stream (ADVANCED)**
- Use `/multi-stream-input` endpoint
- Allows interruption handling in TTS
- Benefit: Clean interruption, better UX
- Risk: Moderate (different endpoint, more code changes)
- Effort: 3-5 hours

**See Also:** [ELEVENLABS_CONSIDERATIONS_2025-11-20.md](../../ELEVENLABS_CONSIDERATIONS_2025-11-20.md)

### Resource Utilization

**Vultr VPS Current Usage:**
```
CPU:  15-25% during active calls
RAM:  500MB-1GB (voice pipeline + services)
Network: 1-2 Mbps per active call

Caddy (reverse proxy):
  - Handles WebSocket upgrades
  - SSL/TLS termination
  - CPU: <5%
  - RAM: 50MB

PostgreSQL:
  - Storage: ~100MB (schema, personas, test data)
  - Queries: <10ms typical
  - Connections: 3-5 active (voice pipeline, db-proxy)

Voice Pipeline PM2:
  - Memory limit: 2GB (configured)
  - Restart count: 5 (as of 2025-11-20)
  - Watch enabled: false (no auto-restart on file change)
```

**Optimization Opportunities:**
- ✅ Silero VAD adds ~2MB per call (manageable)
- ⚠️ Memory leaks possible if connections not cleaned up properly
- Consider: Connection pooling for database, WebSocket reuse

---

## VAD & Turn Detection

### Current Implementation

**Three-Tier Decision System:**

**Tier 1: Heuristic (Lines ~478-536)**
```javascript
evaluateHeuristic(transcript) {
  // Fast pattern matching (no LLM call)
  // Return: RESPOND_CONFIDENT, WAIT_CONFIDENT, or UNCLEAR

  // Currently checks:
  - Ends with "?" → RESPOND_CONFIDENT
  - Trailing incomplete words → WAIT_CONFIDENT
  - Everything else → UNCLEAR
}
```

**Tier 2: LLM Evaluation (Lines ~437-460)**
```javascript
async evaluateLLM(transcript) {
  // Call Cerebras only for unclear cases
  // Prompt: "Is the user done speaking? RESPOND or WAIT?"
  // Cost: ~$0.00001 per evaluation
  // Latency: <100ms

  if (heuristic === UNCLEAR) {
    const response = await cerebras.chat.completions.create({
      model: "llama3.1-8b",
      messages: [{ role: "user", content: evaluationPrompt }]
    });
    return response.choices[0].text;
  }
}
```

**Tier 3: Force Response (Lines ~467-470)**
```javascript
if (this.evaluationCount >= this.config.maxEvaluations) {
  // After 2 LLM evals, force response
  // Prevents calls from hanging indefinitely
  this.triggerResponse('forced_after_max_evals');
}
```

**Timer-Based Fallback (Current):**
```javascript
this.config = {
  shortSilenceMs: 300,       // Ignore brief pauses
  llmEvalThresholdMs: 800,   // Trigger Tier 2 after 800ms silence
  forceResponseMs: 2000,     // Trigger Tier 3 after 2000ms
  maxEvaluations: 2
};
```

### Silero VAD Integration Plan

**Phase 1 (COMPLETE):**
- ✅ Install avr-vad package
- ✅ Initialize VAD in start() method
- ✅ Register event handlers
- ✅ Reduce timer thresholds (800ms vs 1200ms)
- ✅ Cleanup on call end

**Phase 2 (BLOCKED - NEEDS IMPLEMENTATION):**
- ❌ Convert audio format (mulaw 8kHz → Float32 16kHz)
- ❌ Feed audio frames to VAD
- ❌ Listen for VAD speech end event
- ❌ Bypass timers and LLM when VAD confident

**Phase 2 Implementation:**

```javascript
// In handleTwilioMedia()
const mulawBuffer = Buffer.from(audioPayload, 'base64');
const pcmBuffer = this.mulawToPcm(mulawBuffer);
const float32Audio = this.pcmToFloat32(pcmBuffer);
const resampledAudio = this.resampler.process(float32Audio);

// Only if VAD enabled
if (this.vadEnabled && this.vad) {
  await this.vad.processFrame(resampledAudio);
  // VAD will fire onVADSpeechEnd() when user stops talking
}

// onVADSpeechEnd() handler (lines ~436-462)
onVADSpeechEnd() {
  // VAD says user stopped talking
  // Hybrid logic:
  const heuristic = this.evaluateHeuristic(transcript);

  if (heuristic === RESPOND_CONFIDENT) {
    // Clear case, respond immediately
    this.triggerResponse('vad_confident');
  } else if (heuristic === WAIT_CONFIDENT) {
    // Clear case, wait more
    this.resetSilenceTimer();
  } else {
    // Unclear, use LLM evaluation
    this.evaluateLLM(transcript);
  }
}
```

### Troubleshooting Turn Detection

**Symptom: "AI says WAIT but user is done speaking"**
```javascript
// Current heuristic might be too conservative
// Example: "what's up" ends with "up" (trailing word?)

// Solution: Improve pattern recognition
if (transcript.match(/\?$/)) return RESPOND_CONFIDENT;  // Questions
if (transcript.match(/hello|hi|hey/i)) return RESPOND_CONFIDENT;  // Greetings
if (transcript.split(' ').length < 5) return RESPOND_CONFIDENT;  // Short
if (transcript.match(/\.$|!$/)) return RESPOND_CONFIDENT;  // Ends with punctuation

// More cases...
```

**Symptom: "AI responds before user finishes"**
```javascript
// Increase thresholds
this.config.llmEvalThresholdMs = 1200;  // Was 800
this.config.forceResponseMs = 3000;     // Was 2000

// Or improve heuristic to recognize incomplete sentences
if (transcript.endsWith(' with') ||
    transcript.endsWith(' about') ||
    transcript.endsWith(' for')) {
  return WAIT_CONFIDENT;  // User likely continues
}
```

---

## Research & Future Work

### Silero VAD Capabilities

**Current Status:** Foundation built, needs audio processing

**Potential Enhancements:**
1. **Language Support:** Silero supports 40+ languages
   - Current: English only
   - Future: Multi-language support for international users

2. **Custom Models:** Train on domain-specific audio patterns
   - Current: Pre-trained v5 model
   - Future: Fine-tune on "phone conversation" characteristics

3. **Real-time Streaming:** Optimization for low-latency
   - Current: 96ms frame rate
   - Future: Experiment with 48ms frames for faster response

### ElevenLabs Advancement Options

**Option A: eleven_flash_v2_5 Migration (RECOMMENDED)**
- 40-50% latency reduction
- 15-20% cost reduction
- Low risk, 1-2 hour effort
- Timeline: This sprint

**Option B: Conversational Mode (FUTURE)**
- ElevenLabs building new conversational endpoint
- Might include built-in VAD, interruption handling
- Timeline: Post-hackathon

**Option C: Voice Cloning (PREMIUM FEATURE)**
- Allow users to upload voice samples
- AI learns user's voice characteristics
- Premium revenue stream ($9.99/month)
- Timeline: Phase 2, post-launch

### Alternative STT Services

**Current:** Deepgram nova-2
**Why:** Real-time, low-latency, good accuracy, cost-effective ($0.0059/min)

**Alternatives Evaluated:**
- **Google Cloud Speech-to-Text**
  - Pros: Highest accuracy, supports 100+ languages
  - Cons: 100-200ms latency, higher cost ($0.024-0.036/min)
  - Use Case: Batch transcription, not real-time

- **Azure Speech Services**
  - Pros: Real-time, strong accuracy, good pricing
  - Cons: ~50ms more latency than Deepgram, licensing complexity
  - Use Case: Enterprise customers who already use Azure

- **OpenAI Whisper API**
  - Pros: Latest models, API simplicity
  - Cons: NOT designed for real-time (would require polling)
  - Use Case: Post-call transcript cleanup, not real-time STT

**Decision:** Keep Deepgram as primary, consider hybrid approach for accessibility

### Alternative LLM Services

**Current:** Cerebras llama3.1-8b
**Why:** <1s inference, $0.10/1M tokens (40x cheaper than GPT-4), open-source

**Alternatives:**
- **OpenAI GPT-4**
  - Pros: Highest quality, most capable
  - Cons: 2-3 second latency, expensive ($0.03-0.06/1K tokens)
  - Cost: 300x more expensive than Cerebras
  - Not viable for real-time phone calls

- **Anthropic Claude (via API)**
  - Pros: Excellent reasoning, safety
  - Cons: 2-4 second latency, expensive
  - Use Case: Async applications, not real-time

- **Meta Llama 3.1 (self-hosted)**
  - Pros: Complete control, no API latency, cheap at scale
  - Cons: Requires GPU server (~$5k hardware cost)
  - Use Case: Only if volume justifies GPU investment

**Decision:** Cerebras is optimal for current scale. Revisit if volume >100 concurrent calls

### SmartMemory Integration (P1)

**Current Gap:** `smart_memory` TEXT column exists but unused

**Vision:** Multi-layer memory system for relationship continuity

**Implementation:**
1. **Working Memory** (Session)
   - Active conversation context
   - Cleared after call ends
   - Cost: $0 (in-memory)

2. **Episodic Memory** (Long-term)
   - Conversation summaries per call
   - Searchable by topic, date
   - Example: "User mentioned goal to run a marathon"
   - Cost: $0.01-0.05 per call (Raindrop SmartMemory)

3. **Semantic Memory** (Knowledge Base)
   - Extracted facts about user
   - Vector-searchable
   - Example: "Likes hiking, marathon runner, fitness enthusiast"
   - Cost: $0.01-0.05 per call

4. **Procedural Memory** (Patterns)
   - How user typically interacts
   - Persona learned behavior
   - Example: "User prefers direct feedback over encouragement"
   - Cost: Built from episodic

**Timeline:** 1-2 days to implement (P1 priority)

**See Also:** [VOICE_PIPELINE_DEBUGGING_AND_TASKS.md](../../VOICE_PIPELINE_DEBUGGING_AND_TASKS.md) - SmartMemory implementation section

---

## Configuration Reference

### Environment Variables Required

```bash
# API Services
DEEPGRAM_API_KEY=<api-key>           # STT streaming
CEREBRAS_API_KEY=<api-key>           # LLM inference
ELEVENLABS_API_KEY=<api-key>         # TTS streaming
TWILIO_ACCOUNT_SID=<sid>             # Phone infrastructure
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=<+1XXXXXXXXXX>

# Database
VULTR_DB_API_URL=https://db.ai-tools-marketplace.io
VULTR_DB_API_KEY=<bearer-token>

# Feature Flags
VAD_ENABLED=true                     # Enable Silero VAD (Phase 1 only)
DEBUG_LOGGING=true                   # Verbose logs for debugging
```

### Deployment Files

**Vultr:**
- `/opt/voice-pipeline/index.js` - Main voice pipeline code
- `/opt/voice-pipeline/.env` - Environment variables
- `/root/voice-pipeline/` - Source repository
- `/opt/db-proxy/server.js` - Database HTTP API

**Caddy (Reverse Proxy):**
- `/etc/caddy/Caddyfile` - Configuration
- Terminates SSL, upgrades WebSockets
- Routes:
  - `voice.ai-tools-marketplace.io` → `:8080` (voice pipeline)
  - `db.ai-tools-marketplace.io` → `:3000` (db-proxy)

---

## Sources

**Consolidated from:**
- VOICE_PIPELINE_NEXT_STEPS.md
- VOICE_PIPELINE_DEBUG_FINDINGS.md
- VOICE_PIPELINE_DEBUGGING_AND_TASKS.md
- WEBSOCKET_DEBUGGING_PROCEDURE.md
- CALL_FLOW_DEBUGGING.md (Sessions 1-10)
- SILERO_VAD_IMPLEMENTATION_STATUS.md
- ELEVENLABS_CONSIDERATIONS_2025-11-20.md
- PCR2.md (voice pipeline sections)

---

## Related Documents

**See also:**
- [deployment.md](deployment.md) - Deployment procedures
- [vultr.md](vultr.md) - Vultr VPS setup & maintenance
- [debugging.md](debugging.md) - General debugging strategies
- [ELEVENLABS_CONSIDERATIONS_2025-11-20.md](../../ELEVENLABS_CONSIDERATIONS_2025-11-20.md) - Detailed ElevenLabs optimization
- [SILERO_VAD_IMPLEMENTATION_STATUS.md](../../SILERO_VAD_IMPLEMENTATION_STATUS.md) - VAD phase status
- [API_COSTS_AND_PROFITABILITY_2025.md](../../API_COSTS_AND_PROFITABILITY_2025.md) - Cost analysis including voice services
