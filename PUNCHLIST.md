# Punchlist
**Created:** 2025-11-26 01:34 EST
**Purpose:** Running list of items to fix/implement later - not blocking, but should be addressed

---

## Open Items

### 1. Voice/Name Mapping Issue
**Added:** 2025-11-26 01:34 EST
**Status:** Open
**Description:** Voices and the names given to them don't seem to map properly in the frontend.
**Context:** Noticed during persona configuration - needs investigation to determine if it's a display issue or actual voice ID mismatch.

### 2. Centralized Pricing Inconsistency
**Added:** 2025-11-26
**Status:** Open
**Description:** Pricing values are inconsistent between centralized config and voice pipeline implementations.
**Details:**
- `src/shared/pricing.ts` has PRICING_CONFIG with values in cents but interpretation is unclear
- `voice-pipeline-nodejs/index.js` has two classes with different ElevenLabs pricing:
  - BrowserVoicePipeline: $0.18/1K chars
  - VoicePipeline: $0.30/1K chars (based on PRICING_CONFIG which shows 0.30)
- Documentation (`cost-tracking.md`) says ElevenLabs Turbo v2.5 is $0.15/1K chars
- Voice pipeline (Node.js on Vultr) can't import from Raindrop's shared folder

**Fix Required:**
1. Clarify if PRICING_CONFIG values are in cents or dollars
2. Update `src/shared/pricing.ts` with correct verified values
3. Create a mechanism for voice pipeline to read centralized pricing (API endpoint or env vars)
4. Update `documentation/HARDCODED_COST_VALUES.md` with actual locations

**Files to Update:**
- `src/shared/pricing.ts`
- `voice-pipeline-nodejs/index.js` (both VoicePipeline and BrowserVoicePipeline)
- `documentation/HARDCODED_COST_VALUES.md`

### 3. Custom Call Pretext Storage from Scheduler
**Added:** 2025-11-26 12:07 EST
**Status:** Open
**Description:** Dial-in the storage for modified custom call pretexts from the scheduler.
**Context:** When users modify/customize call pretexts in the Schedule page, ensure these are properly stored and persisted. Currently using localStorage for prefab contexts - may need more robust solution.

### 5. PersonaDesigner Context - Proper SmartMemory Persistence
**Added:** 2025-11-26 13:35 EST
**Status:** Open
**Description:** Replace localStorage hack with proper SmartMemory persistence for PersonaDesigner context data.
**Current State:** Context data (call pretext, relationship, user facts) is saved to localStorage per-persona. Works for single-admin hackathon use but not production-ready.
**Proper Implementation:**
1. Add SmartMemory proxy endpoints to api-gateway (`/api/memory/semantic`)
2. Save context to SmartMemory with object IDs like `admin_context:{personaId}`
3. Load context from SmartMemory on persona selection
4. Enable per-user context storage (not just admin) for production

**Files to Modify:**
- `services/api-gateway/index.ts` - Add SmartMemory endpoints
- `src/views/PersonaDesigner.vue` - Replace localStorage with API calls
- See `SMARTMEMORY_POST_CALL_EVALUATION_PLAN.md` for API endpoint patterns

### 4. Implement Smart Interruption Handling
**Added:** 2025-11-26 12:07 EST
**Updated:** 2025-12-01 12:15 EST
**Status:** Partially Complete - Audio cutoff quality needs work
**Description:** Implement interruption handling with context recovery and natural audio cutoff.

**Completed (2025-12-01):**
- ✅ Removed `isSpeaking` guard - interruptions now always trigger
- ✅ Interrupt signal sent to frontend on Flux StartOfTurn

**Remaining - Natural Audio Cutoff:**
The current hard-stop sounds robotic. Implement pre-recorded "gesture" audio clips for natural interruptions:

1. **Record Gesture Audio Per Persona:**
   - Natural sounds: "mhm", "yeah", "uh-huh", soft breath out
   - Mouth/tongue sounds that signal "I'm yielding"
   - Short clips (0.3-1.0 seconds each)
   - Record with same voice/mic setup as TTS for consistency
   - Store in `/public/audio/gestures/{personaId}/` or serve from CDN

2. **Cache and Inject at Runtime:**
   - On interrupt: stop ElevenLabs stream immediately
   - Optionally play a random "yield" gesture clip (fade into it)
   - Then listen to user
   - This masks the abrupt cutoff with human-like behavior

3. **Implementation:**
   - Add `gestureAudioUrls` to persona config
   - Frontend audio player needs `playGesture(type)` method
   - On `interrupt` message: stop TTS, play random yield gesture
   - Consider: fade-out last 100ms of TTS audio while gesture plays

**Investigation Steps (original):**
1. Check how VAD (Voice Activity Detection) is currently implemented in `voice-pipeline-nodejs/index.js`
2. Context recovery after interruptions (already implemented via Phase 2 interrupted message tracking)

**Files to Review:**
- `voice-pipeline-nodejs/index.js` - VAD implementation, `handleTwilioMedia()`, `generateResponse()`
- `frontend/src/components/VoiceCallInterface.vue` - Audio playback handling
- `SMART_INTERRUPTION_IMPLEMENTATION_PLAN.md` - Previous planning document

### 6. VoicePipeline (Twilio) Missing Layer 4 KV Loading
**Added:** 2025-11-26 19:05 EST
**Status:** ✅ RESOLVED (2025-11-27)
**Description:** The Twilio VoicePipeline class does NOT load Layer 4 user facts from KV storage.
**Resolution:** Both `VoicePipeline` and `BrowserVoicePipeline` classes now have `loadUserContext()` method that:
- Uses unified key pattern: `user_context:{userId}:{personaId}`
- Loads Layer 2 (call pretext), Layer 3 (relationship), Layer 4 (facts)
- Called in `start()` after `fetchPersonaMetadata()`
- Facts are formatted as bullet list and included in system prompt

### 9. Call Summaries / Episodic Memory (Deferred)
**Added:** 2025-11-28 16:47 EST
**Status:** Deferred to Post-Hackathon
**Description:** Generate and store brief summaries of each call to provide conversational continuity across sessions.
**Justification Document:** `documentation/justifications/CALL_SUMMARIES_DEFERRED_2025-11-28.md`

**Why Deferred:**
1. **Context window limitation** - Cerebras Llama 3.1 8B has 8K token context. Call summaries (5 summaries × ~200 tokens = 1,000 tokens) would consume 12-15% of available context, reducing room for current conversation history.
2. **Facts are more efficient** - Layer 4 facts ("User has dog named Max" = 7 tokens) provide memory demonstration with far less token overhead than summaries ("Last call you discussed Max's vet visit..." = 20+ tokens).
3. **Cost optimization** - Cerebras 8B at $0.10/1M tokens is 100x cheaper than GPT-4. The 8K context is a tradeoff for affordability and speed (<1s inference).
4. **Hackathon priorities** - Stripe payments (P0 for launch-ready) takes precedence.

**Post-Hackathon Plan:**
- Implement when using larger context models (70B, GPT-4, Claude)
- Generate 100-150 token summaries post-call
- Store last 10 summaries in KV, include 3-5 most recent in prompt
- Estimated effort: 8 hours

**What We Have Instead:** Layer 4 facts extraction and injection working. AI demonstrates memory via facts like "I remember you mentioned Max" - sufficient for hackathon demo.

---

### 8. Time-Conscious Memory Implementation
**Added:** 2025-11-28 15:15 EST
**Status:** Open
**Description:** Implement time-aware fact storage and retrieval so the AI understands WHEN things happened, not just WHAT happened.
**Research:** See `documentation/session_logs/NEXT_SESSION_LOG_2025-11-26_04-59_TIME_AWARE_MEMORY_RESEARCH.md` and `documentation/planning/PERSONA_PROMPT_ENGINEERING_PLAN.md` (Time-Aware Memory Architecture section, lines ~416-756)

**Core Concept - Dual Timestamp System:**
- **Learning Timestamp**: When the AI learned the fact (e.g., "2025-11-28")
- **Event Timestamp**: When the event actually occurred (e.g., "~2015" for "mom died 10 years ago")

**Implementation Tasks:**
1. Enhance fact extraction to parse temporal info (e.g., "10 years ago" → eventDate: ~2015)
2. Store both timestamps in KV facts: `{ content, learnedAt, eventDate, eventDatePrecision }`
3. Format facts with relative time in prompts (e.g., "About 10 years ago, user's mom passed away")
4. Add temporal awareness to system prompt so AI references time naturally

**Files to Modify:**
- `voice-pipeline-nodejs/index.js` - `extractFactsFromConversation()` and `updateLongTermMemory()`
- `src/views/PersonaDesigner.vue` - Display temporal info in facts UI
- System prompt generation - Format facts with relative time

---

### 7. User Profile Settings Dashboard (Subset of PersonaDesigner)
**Added:** 2025-11-26 19:05 EST
**Status:** Open - Future Feature
**Description:** Create a user-facing profile settings page with a subset of PersonaDesigner functionality.
**Context:** Currently only admins (via PersonaDesigner) can customize persona layers. Regular users should have their own dashboard to:
- View/edit their relationship context with each persona (Layer 3)
- See facts the AI has learned about them (Layer 4)
- Optionally correct/delete learned facts
- Set default call preferences per persona

**Implementation Notes:**
- Create `src/views/UserPersonaSettings.vue` (or add to existing Profile.vue)
- Reuse KV storage pattern: `long_term:{userId}:{personaId}`
- Users get their OWN KV namespace (not admin's)
- Simpler UI than PersonaDesigner - no prompt editing, no temperature/token controls
- Focus on: relationship context, view facts, call preferences

**Files to Create/Modify:**
- `src/views/Profile.vue` or new `src/views/UserPersonaSettings.vue`
- May need new API endpoints for user-specific context

---

### 10. Voicemail Handling Options
**Added:** 2025-11-29 03:43 EST
**Status:** Open
**Description:** Give users options for what happens when they don't answer a call.

**Current Behavior:**
- Calls ring for 15 seconds (prevents voicemail from answering)
- If unanswered, call ends with "no-answer" status
- User must initiate a new call if they want to connect

**Feature Options to Implement:**
1. **Leave Voicemail Mode** - Bot leaves a voicemail if user doesn't answer
   - Requires detecting voicemail beep/greeting
   - Bot speaks a configurable message
   - Consider: AMD (Answering Machine Detection) via Twilio's `MachineDetection` parameter

2. **Call-Back Mode** - User can call the Twilio number back
   - Requires inbound call handling (currently outbound only)
   - Match incoming caller ID to pending/recent calls
   - Resume session with same persona and context
   - **Note**: Need to set up TwiML for inbound calls on the Twilio number

**Implementation Considerations:**
- Add user preference in Schedule page: "If I don't answer..."
- Options: "End call" (current), "Leave voicemail", "Let me call back"
- Store preference per user or per scheduled call
- Twilio AMD docs: https://www.twilio.com/docs/voice/answering-machine-detection

**Files to Modify:**
- `src/call-orchestrator/index.ts` - Add AMD parameter option
- `src/api-gateway/index.ts` - Add inbound call handler for call-back mode
- `src/views/Schedule.vue` - Add preference UI
- Database: May need column for user's preferred no-answer behavior

---

### 12. Smart Context Window Management
**Added:** 2025-11-30 19:15 EST
**Status:** Open - Post-Hackathon
**Description:** Currently using hardcoded `.slice(-10)` for conversation history (only 5 back-and-forth exchanges). Should dynamically use as many turns as fit in the model's context window.

**Current State:**
- Both VoicePipeline and BrowserVoicePipeline use `conversationHistory.slice(-10)`
- Llama 3.1 8B has 8192 token context - we're underutilizing it
- Lines 1059 and 2063 in `voice-pipeline-nodejs/index.js`

**Draft Implementation (ready to paste):**
```javascript
/**
 * Estimate token count for a string (rough approximation: ~4 chars per token)
 */
estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Build messages array with smart context management
 * Uses as much conversation history as fits within token budget
 */
buildMessagesWithContext(systemPrompt) {
  const MODEL_CONTEXT_LIMIT = 8192; // TODO: Make configurable per model
  const RESPONSE_RESERVE = this.maxTokens || 200;
  const systemTokens = this.estimateTokens(systemPrompt);
  const availableForHistory = MODEL_CONTEXT_LIMIT - systemTokens - RESPONSE_RESERVE - 100;

  console.log(`[Pipeline] Context budget: system=${systemTokens}, available=${availableForHistory}`);

  const selectedHistory = [];
  let historyTokens = 0;

  // Start from most recent, work backwards
  for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
    const turn = this.conversationHistory[i];
    const turnTokens = this.estimateTokens(turn.content) + 10;

    if (historyTokens + turnTokens <= availableForHistory) {
      selectedHistory.unshift(turn);
      historyTokens += turnTokens;
    } else {
      console.log(`[Pipeline] Using ${selectedHistory.length} turns, truncated ${i + 1} older`);
      break;
    }
  }

  return [{ role: 'system', content: systemPrompt }, ...selectedHistory];
}
```

Then replace `...this.conversationHistory.slice(-10)` with `this.buildMessagesWithContext(systemPrompt)`.

**Future Enhancement:** Summarize truncated turns instead of dropping them.

---

### 14. Self-Listen STT for Accurate Interruption Context
**Added:** 2025-12-01 12:30 EST
**Status:** Open - Post-Hackathon
**Description:** Run parallel Deepgram STT on AI's own audio output to know exactly what was verbalized before user interrupted.

**Problem:**
- Currently save FULL AI response to conversation history on interrupt
- But user only heard partial response before interrupting
- Creates context mismatch: AI thinks it said more than user heard

**Solution:**
- Fork ElevenLabs audio chunks to a "self-listen" Deepgram stream
- Accumulate transcript of what AI is actually saying
- On interrupt, save only `selfListenTranscript` to history

**Cost:** ~$0.01/call extra (Deepgram is $0.0043/min, AI speaks ~2.5min/call)

**Implementation:**
```javascript
this.selfListenTranscript = '';

elevenLabsWs.on('message', (audioChunk) => {
  this.send({ type: 'audio', audio: audioChunk });
  this.selfListenDeepgram.send(audioChunk); // Fork to STT
});

selfListenDeepgram.on('transcript', (text) => {
  this.selfListenTranscript = text;
});

// On interrupt: save selfListenTranscript instead of full response
```

**Why Post-Hackathon:** Feels like engineering but detailed polish.  Context should still be usable.

---

### 13. Prompt Caching for Cerebras API Calls
**Added:** 2025-11-30 19:54 EST
**Status:** Open - Cost Optimization
**Description:** Currently recompiling and sending the full system prompt with every Cerebras API call. Should investigate caching to reduce token costs.

**Current State:**
- Every call to `generateResponse()` rebuilds the full system prompt from scratch
- System prompt includes: base persona prompt + smartMemory + callPretext + longTermMemory + phone call guidelines
- Full `messages` array (system + last 10 conversation turns) sent with each request
- Cerebras API is stateless - no session persistence between calls

**Token Waste Analysis:**
- System prompt is ~500-1000 tokens (varies by persona config)
- Sent ~10-20 times per 5-minute call (once per turn)
- At $0.10/1M tokens this is negligible NOW, but adds up at scale

**Implementation Options:**

1. **Cerebras Prompt Caching** (if supported)
   - Check if Cerebras API supports prompt caching like Anthropic's API
   - Would cache the system prompt prefix and only send deltas
   - Research: https://docs.cerebras.ai/

2. **Context Caching Header** (if supported)
   - Some APIs allow caching via headers
   - First request sends full prompt, subsequent requests reference cached version

3. **Move to Streaming with Session** (architectural change)
   - Some LLM APIs support persistent sessions
   - Would require refactoring away from stateless request/response

4. **Optimize System Prompt Size**
   - Review if all system prompt components are necessary every turn
   - Static parts (persona base prompt) vs dynamic parts (call context)
   - Could potentially split into cached prefix + dynamic suffix

**Files to Modify:**
- `voice-pipeline-nodejs/index.js` - `generateResponse()` in both VoicePipeline and BrowserVoicePipeline classes
- Lines ~1025-1078 (VoicePipeline) and ~2011-2078 (BrowserVoicePipeline)

**Priority:** Low for hackathon (costs are minimal at current scale), but important optimization for production scale.

---

### 11. Production Monitoring & Alerting
**Added:** 2025-11-29 04:15 EST
**Status:** Open - Post-Launch Priority
**Description:** Set up monitoring and alerts for production issues once real users are paying.

**Why This Matters:**
- Formal unit/integration tests aren't imperative for hackathon (manual testing as you go works fine)
- But once real money is flowing, need visibility into failures
- Integration-heavy architecture means most bugs are at service boundaries (hard to unit test anyway)

**Monitoring Needed:**
1. **Failed Webhooks** - Stripe webhooks that fail to process (payment received but credits not added)
2. **Stuck Calls** - Calls stuck in "in-progress" for >15 minutes
3. **Credit Discrepancies** - Mismatch between Stripe payments and credit additions
4. **Voice Pipeline Errors** - WebSocket disconnects, AI service failures
5. **Database Errors** - Failed queries to Vultr PostgreSQL via db-proxy

**Implementation Options:**
- Raindrop logs + scheduled task to scan for errors
- External service (Sentry, LogDNA, Datadog) - may be overkill for hackathon
- Simple approach: Slack/email webhook on error conditions

**Lightweight First Step:**
- Add error counting in code
- Create `/api/admin/health` endpoint that returns error counts
- Check it manually before demos, automate alerting post-launch

---

### 16. Callback Greeting Style Configuration
**Added:** 2025-12-01 19:30 EST
**Status:** Open
**Description:** Make the greeting style for callback scenarios (user calling back after missed outbound call) configurable per persona.

**Current Behavior:**
- When user calls persona after missing a recent outbound call from that persona, we inject callback context
- Currently hardcoded: "Greet them casually like you're picking up a callback - a simple 'Hey!' or 'Yo, you got my call!' works great."
- Works, but greeting style should match persona personality

**Desired Configuration:**
Each persona should have customizable callback greeting styles:
- **Brad (coach):** "Yo!", "Hey, you got my call!", casual and energetic
- **Sarah (friend):** "Hey you!", "Oh hi!", warm and welcoming
- **Alex (creative):** "Oh awesome, you called back!", enthusiastic

**Implementation:**
1. Add `callback_greeting_style` column to `personas` table (or JSONB in `voice_settings`)
2. Example values:
   ```json
   {
     "callback_greeting_examples": ["Hey!", "Yo!", "You got my call!"],
     "callback_tone": "casual and energetic"
   }
   ```
3. Inject this into the callback context in `api-gateway/handleVoiceAnswer()`
4. Add UI in PersonaDesigner to configure per-persona

**Files to Modify:**
- `migrations/018_add_callback_greeting_style.sql` - Add column
- `src/api-gateway/index.ts` - Read from persona and inject into callback context
- `src/views/PersonaDesigner.vue` - Add configuration UI (optional, can use defaults)

**Low Priority:** Current hardcoded approach works fine. Refine post-hackathon.

---

### 15. Persona Contact Cards with Configurable Avatars
**Added:** 2025-12-01 15:30 EST
**Status:** Open - Nice-to-Have
**Description:** Allow users to download vCard contact cards for personas so they can add Brad/Sarah/Alex to their phone contacts with persona photos.

**Technical Reality - vCards Are Static:**
- vCard files are one-time downloads - they don't auto-sync back to server
- Changing the photo requires user to re-download the contact
- True auto-updating would require CardDAV (like iCloud/Google Contacts sync)

**Implementation Options:**

| Approach | Auto-Update? | Complexity |
|----------|--------------|------------|
| **Multiple pre-made vCards** | ❌ Manual re-download | Simple |
| **Dynamic vCard generation** | ❌ Manual re-download | Medium |
| **URL-based photo in vCard** | ⚠️ Spotty iOS/Android support | Medium |
| **CardDAV sync server** | ✅ Yes | Complex |

**Recommended MVP (Option A - Simple):**
1. Admin configures multiple avatar options per persona in dashboard
2. User selects preferred avatar in app
3. Download vCard button generates card with selected avatar baked in
4. If they want different avatar → re-download (with UI explaining this)

**URL Photo Experiment (Option B - Medium):**
- Some vCards support `PHOTO;VALUE=URI:https://site.com/avatar.jpg`
- If phone fetches URL on display, server-side image changes would reflect
- Needs testing on iOS/Android - inconsistent support

**CardDAV (Option C - Future):**
- Full contact sync like iCloud
- Server infrastructure required
- Users would add a "contact account" in phone settings
- Overkill for hackathon, but enables true auto-update

**Files to Create/Modify:**
- `src/api-gateway/index.ts` - Add `/api/personas/:id/contact-card` endpoint
- `src/views/PersonaDesigner.vue` - Avatar configuration UI
- Persona database schema - Add `avatar_options` JSON field
- Frontend - vCard download button with avatar selector

**vCard Generation Notes:**
- Use `vcard` npm package or generate manually
- Include: name, phone (persona's Twilio number), photo (base64 encoded)
- Consider adding custom fields for app deep-linking

---

### 17. DRY Up Voice Pipeline Post-Call Evaluation Code
**Added:** 2025-12-01 19:30 EST
**Status:** Open - Refactor
**Description:** The `runPostCallEvaluation`, `getExtractionSettings`, `extractFactsFromConversation`, and `updateLongTermMemory` methods are duplicated between `VoicePipeline` and `BrowserVoicePipeline` classes.

**Current State:**
- Both classes have identical logic for post-call fact extraction
- VoicePipeline uses `this.userId` and `this.callId`
- BrowserVoicePipeline uses `this.adminId` and `this.sessionId`

**Refactor Options:**
1. Extract to a shared `PostCallEvaluator` class that accepts userId/sessionId as params
2. Use mixins/composition pattern
3. Create a base class with these methods

**Files:** `voice-pipeline-nodejs/index.js`

**Priority:** Low - Code works, just needs cleanup for maintainability.

---

### 18. Offload Raindrop Build Step from Local Machine
**Added:** 2025-12-02 13:15 EST
**Status:** Open - DevOps Improvement
**Description:** The `raindrop build deploy` command runs the TypeScript compilation locally before uploading. This is CPU-intensive and slow on laptops. Need options to offload this build step.

**Current Reality:**
- Raindrop CLI does NOT have a `--remote` flag
- Build happens locally, then bundle is uploaded to Cloudflare Workers
- No built-in remote build option exists

**Options to Offload Build:**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **GitHub Actions CI/CD** | Free, reliable, integrates with git | Requires secrets in GitHub, workflow setup | Medium |
| **Remote Dev Machine (Vultr/EC2)** | Full control, can SSH in | Monthly cost, manual management | Low |
| **GitHub Codespaces** | Cloud VS Code, billed per hour | $$ at scale, GitHub dependency | Low |
| **Gitpod** | Free tier, cloud dev env | Limited free hours | Low |
| **Self-hosted Runner** | Use own hardware, free | Requires always-on machine | Medium |

**Recommended: GitHub Actions Workflow**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Raindrop
on:
  workflow_dispatch:  # Manual trigger
  push:
    branches: [main]
    paths: ['src/**', 'raindrop.manifest']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Raindrop CLI
        run: npm install -g @anthropic-ai/raindrop

      - name: Authenticate Raindrop
        run: raindrop auth login --token ${{ secrets.RAINDROP_TOKEN }}

      - name: Deploy
        run: raindrop build deploy
        env:
          # Add all required secrets
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          VULTR_DB_API_KEY: ${{ secrets.VULTR_DB_API_KEY }}
          # ... etc
```

**Quick Alternative: Vultr Build Box**
```bash
# One-time setup on Vultr (already have server)
ssh root@144.202.15.249
mkdir -p /root/build-env && cd /root/build-env
git clone <repo>
npm install -g @anthropic-ai/raindrop
raindrop auth login

# To deploy:
ssh root@144.202.15.249 "cd /root/build-env/call-me-back && git pull && raindrop build deploy"
```

**Files to Create:**
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- Add Raindrop token to GitHub secrets
- Document the process in `documentation/domain/deployment.md`

**Priority:** Post-hackathon - manual deploys work fine for now, optimize later.

---

### 19. Selectable Inference Model in PersonaDesigner
**Added:** 2025-12-02 14:00 EST
**Status:** Open - Feature Enhancement
**Description:** Make the Cerebras model used for chat inference selectable via dropdown in PersonaDesigner, similar to extraction settings.

**Current State:**
- Model is hardcoded in voice pipeline (llama-3.1-8b)
- Extraction model settings are already configurable

**Implementation (~30-45 min):**
1. Add dropdown to PersonaDesigner with model options (llama-3.1-8b, llama-3.1-70b)
2. Store in persona's `voice_settings` JSON
3. Voice pipeline reads model from persona config
4. Update cost tracking for different model pricing

**Files to Modify:**
- `src/views/PersonaDesigner.vue` - Add dropdown UI
- `voice-pipeline-nodejs/index.js` - Read model from config

**Priority:** Post-hackathon - current model works fine.

---

### 20. Update Website URL References (callmeback.ai → callbackapp.ai)
**Added:** 2025-12-02 17:00 EST
**Status:** Open - Quick Fix
**Description:** Update all references to the website URL from "callmeback.ai" to "callbackapp.ai".

**Affected Files:**
- `voice-pipeline-nodejs/index.js` - Trial caller warnings mention signup URL
- `src/api-gateway/index.ts` - Trial caller system prompt
- Various legal/terms pages

**Quick grep to find all:**
```bash
grep -r "callmeback\.ai" --include="*.js" --include="*.ts" --include="*.vue"
```

**Priority:** Quick fix before demo/submission.

---

### 21. Three-Way Call / Multi-Speaker Handling
**Added:** 2025-12-02 17:00 EST
**Status:** Open - Future Feature
**Description:** When user has a 3-way call (e.g., user + friend + Alex), Alex hears and responds to both speakers. Need to either:
1. Implement speaker diarization to identify/handle multiple speakers
2. Accept as "conference mode" feature
3. Detect and warn users

**Context:** Discovered when user called friend, then triggered Alex to call friend's number. Alex responded to both user and friend on the 3-way call.

**Priority:** Post-hackathon - interesting edge case, not blocking.

---

### 22. Natural Call Ending Detection
**Added:** 2025-12-02 19:55 EST
**Status:** Open - Polish Feature
**Description:** Detect when both user and AI have said goodbye, and have the app hang up automatically instead of waiting for user to disconnect.

**Implementation Concept:**
```javascript
const GOODBYE_PATTERNS = /\b(bye|later|talk soon|take care|gotta go|peace|see ya)\b/i;

// After AI finishes speaking, check if both parties said goodbye
if (GOODBYE_PATTERNS.test(lastUserMessage) && GOODBYE_PATTERNS.test(lastAIResponse)) {
  // Both said goodbye - wait 2 sec then hang up
  setTimeout(() => this.endCall('natural_completion'), 2000);
}
```

**Considerations:**
- Risk of false positives ("I'll tell you later..." isn't a goodbye)
- Need confidence threshold
- Handle "Bye... wait one more thing!" edge cases
- Per-persona goodbye patterns (Brad: "Later bro", Sarah: "Talk soon!", Alex: "Peace out!")

**Priority:** Post-hackathon polish - current user-hangs-up behavior works fine.

---

## Completed Items
_(Move items here when done)_

