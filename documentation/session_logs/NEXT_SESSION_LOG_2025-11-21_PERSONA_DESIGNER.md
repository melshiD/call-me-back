# Next Session: Persona Designer Dashboard Build
**Date:** 2025-11-21 05:50 UTC
**Context Budget:** ~70k tokens remaining when session ended

---

## What Was Accomplished This Session

### 1. VAD Resampling Implemented
- Added mulaw decode + 8kHz→16kHz upsample to voice-pipeline
- `voice-pipeline-nodejs/index.js` now feeds audio to Silero-VAD during Twilio calls
- **Deployed to Vultr** at `/opt/voice-pipeline`
- Latency: negligible (<0.1ms per chunk)

### 2. Browser Voice Mode Deployed
- `/browser-stream` WebSocket endpoint working
- BrowserVoicePipeline class handles 16kHz PCM from browser

### 3. Deployment Guide Created
- `DEPLOYMENT_COMMANDS_EXPLAINED.md` - didactic guide to tar/scp/ssh/pm2 commands
- **Server paths documented:**
  - voice-pipeline: `/opt/voice-pipeline`
  - log-query-service: `/opt/log-query-service`
  - db-proxy: `/opt/db-proxy`

### 4. Research Completed
- Read PCR2.md for full project context
- Read SmartMemory and SmartBucket documentation
- Analyzed persona schema from migrations

---

## Database Schema for Personas (Key Info)

### personas table (Global/Baseline)
```sql
- id VARCHAR(100) PRIMARY KEY
- name VARCHAR(255)
- core_system_prompt TEXT  -- THE MAIN PROMPT TO EDIT
- default_voice_id VARCHAR(100)
- default_voice_settings JSONB
- max_tokens INTEGER DEFAULT 150
- temperature DECIMAL(3,2) DEFAULT 0.7
- category VARCHAR(100)
```

### user_persona_relationships table (Per-User Override)
```sql
- custom_system_prompt TEXT  -- AUGMENTS core_system_prompt
- voice_id VARCHAR(100)  -- Overrides default
- voice_settings JSONB
```

### Final Prompt Compilation:
```
Final = personas.core_system_prompt + user_persona_relationships.custom_system_prompt + [SmartMemory context]
```

---

## What To Build: Persona Designer Dashboard

### File Location
`src/views/PersonaDesigner.vue`

### Design Brief (Approved by User)

**Aesthetic:** "Recording Studio Control Room"
- Dark theme (#1a1a1a background)
- Amber accent (#f59e0b) like VU meters
- Monospace for prompts (JetBrains Mono / Fira Code)
- DM Sans for body text
- LED-style status indicators
- Audio waveform motifs

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│ PERSONA DESIGNER                                             │
├──────────────────┬──────────────────────────────────────────┤
│ PERSONA SELECTOR │  [Brad] [Sarah] [Alex]                   │
├──────────────────┴──────────────────────────────────────────┤
│ CORE SYSTEM PROMPT (expandable textarea)                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ You are Brad, a direct and loyal friend...              │ │
│ │ [expand/collapse]                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ PREVIEW PANEL - Shows compiled final prompt                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ {core_prompt}                                           │ │
│ │ ---                                                      │ │
│ │ {memory_context placeholder}                            │ │
│ │ ---                                                      │ │
│ │ {conversation_history}                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ AI PARAMETERS                                                │
│ Temperature: [═══════●═══] 0.7                              │
│ Max Tokens:  [150]                                          │
│ Voice ID:    [dropdown: ElevenLabs voices]                  │
├─────────────────────────────────────────────────────────────┤
│ TEST PANEL                                                   │
│ ┌───────────────────┐  ┌───────────────────┐               │
│ │  🎤 BROWSER VOICE │  │  📞 TWILIO CALL   │               │
│ │  [GO LIVE button] │  │  [DIAL button]    │               │
│ └───────────────────┘  └───────────────────┘               │
│                                                              │
│ Admin Phone: [+1234567890] (for Twilio testing)             │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints Available

```javascript
// Persona CRUD (already built)
GET  /api/admin/personas          // List all personas
GET  /api/admin/personas/:id      // Get one
PATCH /api/admin/personas/:id     // Update (core_system_prompt, max_tokens, temperature, etc.)

// Text chat debug (already built)
POST /api/admin/chat              // Single-turn test
POST /api/admin/chat/session      // Multi-turn session

// Browser voice (already built)
WebSocket wss://voice.ai-tools-marketplace.io/browser-stream
// Connect with: { type: 'config', persona_id, admin_id }

// Twilio call trigger (needs endpoint or use existing)
POST /api/calls/trigger           // Trigger call to phone number
```

### Implementation Checklist

- [ ] Create `src/views/PersonaDesigner.vue`
- [ ] Persona selector tabs/cards
- [ ] Expandable textarea for `core_system_prompt`
- [ ] Live preview panel (shows compiled prompt)
- [ ] Temperature slider (0-2 range)
- [ ] Max tokens input
- [ ] Voice ID dropdown (fetch from ElevenLabs or hardcode Brad/Sarah/Alex voices)
- [ ] Browser Voice button → WebSocket to `/browser-stream`
- [ ] Twilio Call button → POST to trigger endpoint
- [ ] Admin phone number field (save to localStorage or add to admin_users table)
- [ ] Save button → PATCH /api/admin/personas/:id

### Voice IDs (Hardcoded)
```javascript
const VOICES = {
  brad: 'pNInz6obpgDQGcFmaJgB',
  sarah: 'EXAVITQu4vr4xnSDxMaL',
  alex: 'pNInz6obpgDQGcFmaJgB'
};
```

---

## Files Modified This Session

1. **voice-pipeline-nodejs/index.js**
   - Added `MULAW_DECODE_TABLE` and `decodeMulaw()` function
   - Added `upsample8kTo16k()` function
   - Modified `handleTwilioMedia()` to feed audio to VAD

2. **DEPLOYMENT_COMMANDS_EXPLAINED.md** (created)
   - Server paths, deployment commands guide

---

## Quick Start Commands for Next Session

```bash
# Check current state
raindrop build status --application call-me-back
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 status"

# View voice pipeline logs
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 logs voice-pipeline --lines 30"

# Test persona API
curl -s http://144.202.15.249:3001/api/admin/personas | jq

# Start frontend dev
cd /usr/code/ai_championship/call-me-back && npm run dev
```

---

## Priority for Next Session

1. **Build PersonaDesigner.vue** using frontend-design skill
2. Wire up to existing APIs
3. Test browser voice integration
4. Add admin phone number persistence (localStorage or DB)

---

## User's Request (Verbatim)
> "I need to be able to also experiment with how the system prompt is compiled (from the layers of memory) from the page as well. So basically, I need access to the system prompt for the model, so I can set it and change it."

The dashboard should show the COMPILED final prompt that goes to the model, not just the raw `core_system_prompt`. This means showing:
1. Base prompt from `personas.core_system_prompt`
2. Memory context (placeholder until SmartMemory integrated)
3. Conversation history preview

---

**End of Session Log**
