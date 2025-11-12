# Voice Pipeline Architecture

## Overview

The Call Me Back voice pipeline uses an intelligent turn-taking system with LLM-based evaluation to create natural, human-like conversations.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SPEAKS                               │
│                "I need help with... um..."                   │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│           TWILIO MEDIA STREAM (WebSocket)                    │
│              Audio chunks → Server                           │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│     SPEECH-TO-TEXT (ElevenLabs Scribe v2 Realtime)          │
│         Streaming transcription with timestamps              │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│            CONVERSATION MANAGER                              │
│         State: LISTENING → EVALUATING                        │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├──[500ms silence]──→ Keep listening (normal pause)
              │
              ├──[1200ms silence]──→ Trigger LLM Evaluation
              │                       │
              │                       ▼
              │              ┌─────────────────────┐
              │              │  TURN EVALUATOR     │
              │              │  (Cerebras Fast)    │
              │              │  Max 10 tokens      │
              │              └──────┬──────────────┘
              │                     │
              │              ┌──────┴─────────┬─────────────┐
              │              ▼                ▼             ▼
              │           "WAIT"         "RESPOND"     "UNCLEAR"
              │              │                │             │
              │              └→ Keep waiting  │     Wait more
              │                               │
              │                               ▼
              ▼                    ┌────────────────────────┐
      [3000ms silence]             │  AI PROCESSING         │
      Force response  ────────────→│  (Cerebras LLM)        │
                                   │  Generate full response │
                                   └──────────┬─────────────┘
                                              │
                                              ▼
                                   ┌────────────────────────┐
                                   │  TEXT-TO-SPEECH        │
                                   │  (ElevenLabs TTS)      │
                                   └──────────┬─────────────┘
                                              │
                                              ▼
                                   ┌────────────────────────┐
                                   │  TWILIO PLAYBACK       │
                                   │  User hears response   │
                                   └──────────┬─────────────┘
                                              │
                                              ▼
                                        Back to LISTENING
```

## State Machine

### Conversation States

1. **IDLE** - No active conversation
2. **LISTENING** - Receiving user speech
3. **EVALUATING** - LLM checking if user is done
4. **PROCESSING** - AI generating response
5. **SPEAKING** - AI playing response
6. **INTERRUPTED** - User interrupted AI mid-speech

### State Transitions

```
IDLE → LISTENING (user starts speaking)
LISTENING → EVALUATING (silence detected)
EVALUATING → LISTENING (LLM says "WAIT")
EVALUATING → PROCESSING (LLM says "RESPOND")
PROCESSING → SPEAKING (TTS ready)
SPEAKING → LISTENING (playback complete)
SPEAKING → INTERRUPTED (user speaks)
INTERRUPTED → LISTENING (reset, start fresh)
```

## Timing Parameters

### Silence Detection Thresholds

| Threshold | Duration | Action |
|-----------|----------|--------|
| **Short Silence** | 500ms | Ignore - normal pause |
| **LLM Evaluation** | 1200ms | Trigger turn evaluator |
| **Force Response** | 3000ms | Respond regardless |

### LLM Evaluation Settings

- **Max Evaluations**: 2 per turn (prevent infinite loops)
- **Model**: Cerebras llama3.1-8b (fast & cheap)
- **Max Tokens**: 50 (buffer for processing, stop sequences limit actual usage to 1-5 tokens)
- **Temperature**: 0.3 (consistent decisions)
- **Timeout**: 500ms (fast turnaround critical)

### Cost Analysis

**Per Evaluation:**
- Input: ~100 tokens (prompt + transcript)
- Output: 1-5 tokens (single word, stopped early by sequences)
- Total: ~105 tokens (despite 50 token max, stop sequences end generation early)
- Cost: (105/1,000,000) × $0.10 = **$0.0000105** (~0.001 cents)

**Per Call (avg 8 evaluations):**
- 8 evals × $0.0000105 = **$0.000084** (~0.01 cents)
- **Negligible impact on call costs!**

## LLM Evaluation Logic

### Prompt Template

```
Analyze if the user has finished speaking:

User said: "{transcript}"

Incomplete indicators:
- Trailing "um", "uh", "so", "and", "but"
- Unfinished sentences
- Open-ended phrases like "I want to..."

Complete indicators:
- Full question or statement
- Natural end punctuation
- Clear intent expressed

Answer with ONE word only:
- WAIT (user likely has more to say)
- RESPOND (user is done, respond now)
- UNCLEAR (not sure, wait longer)

Answer:
```

### Decision Logic

| LLM Response | Action | Reason |
|--------------|--------|--------|
| **WAIT** | Continue listening | User has more to say |
| **RESPOND** | Process full response | User is done |
| **UNCLEAR** | Wait another cycle | Need more context |

## Interrupt Handling

### Detection

- **Threshold**: 300ms of speech during AI playback
- **Action**: Immediately stop TTS, switch to LISTENING

### Flow

```
AI Speaking: "The answer to your question is..."
  ↓
User: "Actually—" (300ms detected)
  ↓
[INTERRUPT TRIGGERED]
  ├─ Stop TTS playback
  ├─ Clear audio queue
  ├─ Reset transcript
  └─ Switch to LISTENING state
  ↓
User: "Actually, I meant something else"
  ↓
[Normal flow resumes]
```

## Integration Points

### Required Services

1. **Twilio Media Streams** - Real-time audio WebSocket
2. **ElevenLabs Scribe v2 Realtime** - Streaming STT
3. **Cerebras LLM** - Turn evaluation + main responses
4. **ElevenLabs TTS** - Audio generation
5. **Cost Tracker** - Track all service usage

### Configuration

```typescript
const config = {
  // Silence thresholds
  shortSilenceMs: 500,
  llmEvalThresholdMs: 1200,
  forceResponseMs: 3000,

  // LLM evaluation
  maxEvaluations: 2,
  evalModel: 'llama3.1-8b',
  evalProvider: 'cerebras',

  // Interrupts
  enableInterrupts: true,
  interruptDetectionMs: 300,

  // Audio
  silenceThresholdDb: -40
};
```

## Testing Strategy

### Unit Tests

1. State transitions work correctly
2. Silence timers trigger at right times
3. LLM evaluation parsing handles all responses
4. Interrupt detection is reliable

### Integration Tests

1. Full conversation flow (user → STT → eval → LLM → TTS → user)
2. Interrupt handling mid-response
3. Multiple evaluation cycles
4. Timeout fallbacks

### Manual Testing Scenarios

1. **Complete thoughts**: "What's the weather today?"
2. **Incomplete thoughts**: "I want to... um... actually..."
3. **Rapid interrupts**: User cuts off AI multiple times
4. **Long pauses**: User thinks for 2-3 seconds
5. **False starts**: "I... no wait... actually..."

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **STT Latency** | <150ms | ElevenLabs Scribe v2 spec |
| **LLM Eval Latency** | <500ms | Critical for responsiveness |
| **LLM Response** | <1000ms | Main response generation |
| **TTS Latency** | <2000ms | First audio chunk |
| **Total Turn Latency** | <3500ms | User done → Audio starts |

## Future Enhancements

### Phase 2

- [ ] Context-aware evaluation (use conversation history)
- [ ] Emotion detection in speech
- [ ] Dynamic threshold adjustment per user
- [ ] Multi-language support

### Phase 3

- [ ] Predictive response generation (start processing before eval completes)
- [ ] Voice fingerprinting for multi-speaker calls
- [ ] Real-time sentiment analysis
- [ ] Adaptive personality based on user preferences

## Monitoring & Debugging

### Key Metrics

- Average evaluations per turn
- LLM eval decision distribution (WAIT/RESPOND/UNCLEAR)
- Interrupt frequency
- False positive interrupts (silence detected incorrectly)
- Average turn latency

### Logging

```typescript
console.log('[ConversationManager] State: LISTENING → EVALUATING');
console.log('[TurnEvaluator] LLM Decision: RESPOND (95ms)');
console.log('[ConversationManager] Triggering response (reason: llm_eval_complete)');
```

### Debug Mode

Set `DEBUG=voice-pipeline` to enable verbose logging of:
- All state transitions
- Transcript segments
- Silence detection events
- LLM evaluation prompts and responses
- Timing measurements

## References

- [ElevenLabs Scribe v2 Docs](https://elevenlabs.io/docs/capabilities/speech-to-text)
- [Twilio Media Streams](https://www.twilio.com/docs/voice/media-streams)
- [Cerebras API Docs](https://cerebras.ai/docs)
