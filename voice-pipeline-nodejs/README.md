# Voice Pipeline - Cost Tracking Enabled

**Status:** ✅ Cost tracking ACTIVE (deployed 2025-11-19)

## Overview
Node.js WebSocket service handling real-time voice calls with Twilio, Deepgram STT, Cerebras AI, and ElevenLabs TTS.

## Cost Tracking (NEW)

### Logs Now Include Usage Data

**Cerebras AI:**
```
[VoicePipeline CALL_ID] Cerebras usage: model: llama3.1-8b prompt_tokens: 25 completion_tokens: 50 total_tokens: 75
```

**ElevenLabs TTS:**
```
[VoicePipeline CALL_ID] ElevenLabs TTS: characters: 145 voice_id: pNInz6obpgDQGcFmaJgB model: eleven_turbo_v2_5
```

**Deepgram STT:**
```
[VoicePipeline CALL_ID] Deepgram transcript: duration: 2.5 confidence: 0.95 is_final: true
```

### What Gets Tracked
- ✅ Cerebras token usage (prompt + completion + total) with model name
- ✅ ElevenLabs character count with voice ID and model
- ✅ Deepgram duration, confidence, and finality status
- ✅ Twilio call duration (tracked via Twilio API)

### Log Location
```bash
# View live logs
pm2 logs voice-pipeline -f

# Last 100 lines
pm2 logs voice-pipeline --lines 100

# On Vultr server
tail -f /var/log/pm2/voice-pipeline-out.log
```

## Deployment

```bash
./deploy.sh
```

Deploys to: `144.202.15.249:8080` (proxied via Caddy to `wss://voice.ai-tools-marketplace.io/stream`)

## Environment Variables

Required in `.env`:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `DEEPGRAM_API_KEY`
- `CEREBRAS_API_KEY`
- `ELEVENLABS_API_KEY`
- `VULTR_DB_API_URL`
- `VULTR_DB_API_KEY`

## Integration with Log Query Service

The logs are parsed by `log-query-service` collectors:
- `cerebras.js` - Extracts token usage
- `elevenlabs.js` - Extracts character counts
- `deepgram.js` - Extracts transcript duration
- `twilio.js` - Queries Twilio API for call duration

Cost calculations happen in `log-query-service/trackers/usage-tracker.js`

## Recent Changes

**2025-11-19:** Added comprehensive cost tracking logging
- Cerebras usage with model tracking
- ElevenLabs character counts
- Deepgram duration tracking
- All data now flows to cost aggregation service
