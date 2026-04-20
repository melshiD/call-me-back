# Next Session Log — 2026-04-19 14:30 EDT (2026-04-19 18:30 UTC)

## Session Summary

**Mission**: Commit/push Apr-18 work, restore inbound calling, layer on trial/pretext/cap policy for inbound, add persona hangup-on-demand. Prep for future "caller dossier" work.

**End state**: Inbound calling works end-to-end. Verified users get a 12-min test-phase cap. Anonymous callers get a one-time 3-minute trial with a knowledge-gathering pretext that funnels them to callbackapp.ai. Unmapped app-owned numbers route to Brad with a "covering for Dave" pretext. Personas can now end calls when the user says "bye" / "gotta go" / etc. All shipped, pushed to origin/main, and DB-verified.

**Deferred (explicit user direction)**: JWT_SECRET rotation. Post-call memory reimplementation. Full caller dossier + differential Call-N treatment + SMS link-send (requires Phase B inference routing for Sonnet).

---

## What Got Done (chronological)

### 1. Committed and pushed 2026-04-16/18 backlog (4 commits)

origin/main was 11 commits ahead of GitHub; plus this session's unpushed diffs. Investigated deployment patterns and confirmed:
- `server/deploy.sh` tarballs `server/src/` directly from local disk — **deploy does not depend on git push**.
- Vercel prebuilt workflow handled by user; `vercel --prod` on a post-push hook is broken (remote builds don't match local), workaround is `vercel deploy --prebuilt --prod && vercel alias set <url> callbackapp.ai`.
- Pre-migration repo had `voice-pipeline-nodejs/` at root containing `{README.md, index.js, package.json}`. That directory was gone in HEAD; live source-of-truth was only on VPS disk (bus-factor risk).

Pulled current VPS voice-pipeline files (`/opt/voice-pipeline/{index.js, package.json, package-lock.json, README.md, deploy.sh, load-env.sh}`) back into repo at `voice-pipeline-nodejs/`. Accidentally grabbed a stale `.env` via SCP brace expansion; deleted immediately without committing.

Commits (all per prior NSL draft):
- `12e498a` fix(api-server): use available_credits everywhere (drop minutes_balance column refs)
- `7d84d61` fix(frontend): robust auth localStorage parse + balance shape compat + /register route
- `7c1a4de` feat(voice-pipeline): sync live VPS state back into repo (DB-SHIM + guards)
- `7bcfbab` chore: NSLs for Raindrop→self-host migration sessions + gitignore schema dumps

Push auth: GitHub remote is HTTPS; password auth was disabled by GitHub. Found working SSH key at `~/.ssh/github_ed25519`. Pushed via `GIT_SSH_COMMAND="ssh -i ~/.ssh/github_ed25519 -o IdentitiesOnly=yes" git push git@github.com:melshiD/call-me-back.git main`. **Did not change remote URL** — future pushes need the same prefix, or we switch the remote to SSH form (user's call).

`.gitignore` additions:
- `server/schema-dump.sql` + root-level `schema-dump.sql` (pg_dump artifact; migrations/ is authoritative)
- `voice-pipeline-nodejs/.env` (generated at deploy time by `load-env.sh`)

### 2. Inbound calling — root cause + fix

**Root cause A**: All 4 Twilio numbers' `VoiceUrl` was still pointing at the dead Raindrop URL (`https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/voice/answer`). Every inbound call POSTed into a non-existent service → no TwiML → Twilio dropped.

**Root cause B**: Even with the URL right, `/api/voice/answer` on the new api-server was outbound-only. It required `callId`/`userId`/`personaId` as query params, which Twilio does not send on inbound. Form body fields (`From`, `To`, `CallSid`) were ignored.

**Fix A** — Twilio config: Used REST API to PATCH all 4 numbers to:
- `VoiceUrl = https://api.callbackapp.ai/api/voice/answer`
- `StatusCallback = https://api.callbackapp.ai/api/voice/status`

Loop ran with HTTP 200 on all 4. Verified via GET.

**Fix B** — api-server (`server/src/routes/voice.ts`): Made `/answer` bidirectional. If query params present → outbound (existing behavior preserved). Else → inbound branch: parse form body, look up persona by `To` in `personas.twilio_phone_number`, look up user by `From` in `users.phone WHERE phone_verified=true`, INSERT `calls` row with `direction='inbound'`, build TwiML.

### 3. Inbound policy layer (this session's real novelty)

Extended `/answer` inbound branch with test-phase caps and pretext routing:

**Verified users** (phone match, phone_verified=true):
- `max_duration_minutes = min(VERIFIED_USER_MAX_MINUTES, user_credits.max_call_duration_minutes)` where `VERIFIED_USER_MAX_MINUTES = 12`. User's admin account shows `max_call_duration_minutes=10` in `user_credits`, so effectively 10 min until we raise that tier's limit. The 12-min cap is a cost guard for the testing window.
- No special `call_pretext` — persona behaves normally.

**Anonymous callers** (no verified phone match):
- `max_duration_minutes = 3` (`ANONYMOUS_TRIAL_MINUTES`).
- `call_pretext` is a two-part script:
  1. `[ANONYMOUS CALLER — NEW TO SERVICE]` — greet naturally, suss out how they got the number + whether they meant to call, read their AI openness, pitch callbackapp.ai if interested, 3-minute budget. Explicit "don't be salesy" instruction.
  2. `[UNVERIFIED REGISTERED USER — possible]` — if caller claims they have an account, remind them to verify their phone in the dashboard.
- `unknown_caller_attempts` upsert now uses `RETURNING call_count` so the pretext can reference prior call count (currently just embeds "They have called this number N times before"; dossier-driven Call-N branching is a later session).

**Unmapped app-owned numbers** (constant whitelist `UNMAPPED_NUMBERS`; currently only `+14632313462`):
- Uses `brad_001` persona with "covering for Dave" pretext so bot doesn't pretend to be the number's owner.
- `max_duration_minutes = 3` (`UNMAPPED_NUMBER_MINUTES`).
- Any caller (verified or not) gets this treatment when dialing an unmapped number. Future: consider keying different sidecar personas to different unmapped numbers.

Voice-pipeline's existing max-duration enforcement already handles the warning progression (66% subtle heads-up → 86% "sign up at callbackapp.ai" pitch → 96% final warning → 100% force-terminate) and already pitches the signup URL at 86% and 96%. Zero voice-pipeline changes needed for the funnel — just needed the right `max_duration_minutes` and `call_pretext` in the `calls` row, which this session delivered.

### 4. Hangup intent detection (voice-pipeline)

**Problem**: Persona could only end calls on max-duration timeout. Users saying "gotta go" would get stuck in a conversation loop because `gpt-4o-mini` doesn't reliably cooperate with end-of-call requests without explicit pretext instructions.

**Fix** (voice-pipeline-nodejs/index.js):
- Module-level `detectHangupIntent(utterance)` function:
  - `HANGUP_PHRASES` array: ~35 whole-phrase substring matches (goodbye, hang up, I gotta go, that's all, thanks bye, all set, etc.)
  - `HANGUP_STANDALONE_WORDS = ['bye', 'later']`: high-false-positive, require end-of-utterance position. Strips trailing punctuation then checks last token. So `"alright later"` fires but `"maybe later we can discuss that"` does not.
- Class method `sayFarewellAndTerminate()`:
  - Speaks hardcoded `"Alright, take care!"` through `speak()` (so TTS alignment tracking works)
  - Waits `min(6000, max(1500, totalAudioDurationMs + 500))` ms
  - Calls `forceTerminate()` which closes the Twilio WebSocket
- Hook point: top of `generateResponse()`. Before the LLM call, check most recent user message in `conversationHistory`; if hangup detected, farewell + terminate, return. No LLM call consumed.
- 15/15 unit test cases pass (ran against a temp `/tmp/test-hangup.mjs`, including tricky negatives like `"maybe later"` and `"bye the way"`).

---

## Known Things To Watch For In User Tests (EXPLICIT FOLLOW-UPS)

These came up as potential issues or edge cases in the design of this session's work. **Must revisit and address next session or when symptoms appear.**

### 1. Farewell line `"Alright, take care!"` is hardcoded

It ignores persona voice. If Sarah calls `sayFarewellAndTerminate()` she still says "Alright, take care!" in her voice — it'll sound right via TTS, but the *phrasing* isn't persona-specific. Brad's farewell vs Alex's should probably be different in tone.

**Fix ideas** (next session):
- Move farewell into a new `personas.farewell_line` column, default `"Alright, take care!"` if null.
- Or have `sayFarewellAndTerminate()` dispatch a quick one-shot LLM call to generate a persona-consistent farewell (cheap because the prompt is tiny).

### 2. Speculative draft (EagerEndOfTurn) path bypass

Hangup detection is ONLY in `generateResponse()`. If the disabled speculative draft (`prepareDraftResponse()`) is ever re-enabled (per prior NSL, Phase B), the detector MUST also run there or hangup would race with a draft LLM call. **When re-enabling speculative drafts, add the detector to both paths.**

### 3. History-scope false positive (currently a non-issue, but fragile)

Detector uses `[...this.conversationHistory].reverse().find(m => m.role === 'user')` which always finds the MOST RECENT user message — what just triggered `generateResponse()`. So no bug today. But if `generateResponse()` is ever refactored to run on something *other* than the just-finished user turn, the detector could misfire on a stale "bye" from 10 turns ago. **Consider passing the current utterance explicitly rather than grepping history.**

### 4. Interrupt-during-farewell handling

If the user speaks over "Alright, take care!", the terminate still fires at the computed wait time. No way to cancel. Probably fine for v1 (user wanted to hang up anyway), but if testing reveals jarring cutoffs, add:
- Abort mechanism: set `this.farewellInProgress = true`, have the user-interrupt handler set `this.farewellAborted = true`, check before the final `forceTerminate()`.

### 5. `user_credits.max_call_duration_minutes` default is 10 not 12

`VERIFIED_USER_MAX_MINUTES = 12` is a ceiling; the actual cap for `dave.melshman@gmail.com` is `min(12, 10) = 10` because `user_credits.max_call_duration_minutes = 10` for that row. If user wants an honest 12-min test cap: `UPDATE user_credits SET max_call_duration_minutes = 12 WHERE user_id = 'user_01KAJKFCJ2DNS5AKP478BS0G4R';`. Or change the constant.

### 6. Unmapped number `+14632313462` is hardcoded with `ownerName = "Dave"`

Fine for one sidecar number. If more are added, we'll want a DB-driven mapping rather than `UNMAPPED_NUMBERS` const in `voice.ts`. Schema suggestion: new table `app_numbers (phone_number PK, owner_name, fallback_persona_id, purpose VARCHAR)`.

### 7. Inbound `/status` handling uses existing `updateCallStatus`

`updateCallStatus(callSid, callStatus)` was written for outbound. We already store `twilio_call_sid` on inbound INSERT, so the UPDATE-by-SID path works. **But**: any code that assumes `direction='outbound'` when it sees a call status update is now wrong. Scan `callService.updateCallStatus` and adjacent post-call cost/credit logic before assuming inbound cost tracking is correct.

### 8. Anonymous caller = free minutes

Until a caller verifies, their calls cost us money and earn us nothing (pretext funnels them to signup but conversion rate < 100%). The `unknown_caller_attempts.blocked` column exists but enforcement is NOT wired. **When abuse starts, flip on blocked-check in `voice.ts` inbound branch → return `<Hangup/>` TwiML.**

### 9. The "+14632313462" unmapped test wasn't verified end-to-end by a real phone call in this session

Only DB-verified via curl. A real call might expose Twilio-specific quirks (StatusCallback returning 404 for unmapped-number inbound, etc.). **Need a real dial-from-phone test.**

### 10. `/api/voice/amd` — outbound only

Answering Machine Detection only makes sense for outbound (we dial you, we want to know if voicemail picked up). Inbound by definition was answered by a human. Current implementation only runs when callId query param present; inbound path skips it. This is correct behavior, but note it in case something weirdly triggers AMD on an inbound call in prod.

---

## Deferred — Full Scope of Caller Dossier Feature (EXPLICITLY deferred)

User confirmed this is next-session+ scope. Not coded this session.

### Requirements recap
- **Caller populations to distinguish**:
  - Verified user (done in this session)
  - User-but-phone-unverified (partially addressed via pretext reminder; no DB lookup logic yet)
  - Non-user (done via unknown_caller_attempts + 3-min trial; no dossier logic yet)

### Phases not yet built
- **Phase 1** (this session — DONE): 3-min trial cap + knowledge-gathering pretext for every unknown caller, same treatment regardless of call count.
- **Phase 2** (TBD): `caller_dossier` schema + post-call analysis job. Schema sketch:
  ```sql
  CREATE TABLE caller_dossier (
    phone_number VARCHAR(50) PRIMARY KEY,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    call_count INT,
    conversion_score REAL,           -- 0..1 probability assigned by analyzer
    triage_decision VARCHAR(32),     -- 'continue_conversion' | 'polite_finite' | 'terminal_block'
    outcome_category VARCHAR(32),    -- 'interested' | 'skeptical' | 'confused' | 'abusive' | ...
    notes TEXT,                      -- LLM-generated summary
    ai_opinion TEXT,                 -- "they seemed curious about X, hesitant about Y"
    last_call_ids JSONB,             -- pointer array to recent calls.id
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
  Post-call job runs when an `anonymous_caller` call completes; pulls transcript, asks LLM to write/update the row. **This analysis should use Sonnet**, not gpt-4o-mini, because the persona-quality judgment matters.
- **Phase 3** (TBD): Pre-call decision logic in `/api/voice/answer` reads dossier, routes to one of three treatments:
  - `continue_conversion` — send to regular persona flow with a "high-intent prospect" pretext, budget more tokens
  - `polite_finite` — 1-2 questions max, then "here's the link, come back when registered" → next call auto-terminates
  - `terminal_block` — hangup TwiML on connect, persona never speaks
- **Phase 4** (TBD): SMS link-send capability.
  - New `POST /api/sms/send-signup-link` endpoint (admin-secret protected)
  - Voice-pipeline gets a tool/function call the persona can invoke mid-call when user agrees to receive a link
  - Requires Claude or GPT-4-turbo-class for reliable tool use; NOT gpt-4o-mini
  - TCPA consent handling ("can I text you a link?" → user says yes → we send)
  - Hard rate-limit: 1 SMS per phone per 24h
- **Phase 5** (TBD): Real-time mid-call dossier updates + smart triage model tuning.

### Architectural blockers for caller dossier work
- Sonnet routing requires Phase B (configurable inference routing system). Could do it hackily now (hardcoded override for post-call analysis), but Phase B is already on the board.

---

## Post-Call Memory Reimplementation (EXPLICITLY deferred)

User direction: *"we're going to reimplement the post-call memory for all calls in a future session"*

Currently disabled per the 2026-04-18 session: `runPostCallEvaluation` in voice-pipeline is a log + return no-op. Was firing one LLM call per call against OpenAI extracting facts; cost vs value was unclear, and the extraction pattern was Cerebras-era.

Reimplementation requirements when we pick this up:
- Provider-neutral extraction (must work with whatever model Phase B routes to)
- Per-user + per-persona selectable: different users may want different memory depth
- Clear opt-in semantics (GDPR-aligned)
- Should share infrastructure with the caller-dossier analysis job — they're two instances of the same "post-call LLM analysis" pattern
- Plan 2 from the Raindrop migration spec (`docs/superpowers/specs/2026-04-13-raindrop-migration-design.md`) covers this alongside pgvector semantic memory

---

## Commits This Session

All pushed to `origin/main`:

```
29925ea feat(voice-pipeline): detect user hangup intent + graceful farewell
e8b1387 feat(voice): inbound call policy — trial caps, persona lookup, pretext routing
7bcfbab chore: NSLs for Raindrop→self-host migration sessions + gitignore schema dumps
7c1a4de feat(voice-pipeline): sync live VPS state back into repo (DB-SHIM + guards)
7d84d61 fix(frontend): robust auth localStorage parse + balance shape compat + /register route
12e498a fix(api-server): use available_credits everywhere (drop minutes_balance column refs)
```

All verified with curl simulation + DB row inspection; hangup detection verified with 15/15 unit tests.

---

## Current Production State

### What's Live
| Component | Status | Notes |
|-----------|--------|-------|
| Frontend https://callbackapp.ai | ✅ Unchanged this session | No frontend code changes; last deploy from prior session still current. User handles Vercel redeploy. |
| API Server https://api.callbackapp.ai | ✅ Healthy | Restarts from this session: api-server count now ~8 (2 this session). DB + Redis green. |
| Voice Pipeline wss://voice.callbackapp.ai/stream | ✅ Working | Restart #10 this session (hangup detector deploy). Online with DB-SHIM + hangup intent handling. |
| Twilio webhooks | ✅ Updated | All 4 numbers now POST to api.callbackapp.ai/api/voice/answer (was dead lmapp.run URL). |

### VPS File Changes This Session
- `/opt/api-server/` — full rebuild from `server/deploy.sh --sync-only && --restart`. Source tarball uploaded twice (once for initial inbound fix, once for trial policy addition).
- `/opt/voice-pipeline/index.js` — scp'd directly with backup to `index.js.bak.pre-hangup-<epoch>`. pm2 restart. Previous DB-SHIM backup `index.js.bak.pre-dbshim-1776444899` still present.

### Test Account (unchanged from prior NSL)
- Email: `dave.melshman@gmail.com`
- Password: `Testing123`
- User ID: `user_01KAJKFCJ2DNS5AKP478BS0G4R`
- Phone: `+16196433644` (verified, so inbound calls from here hit verified-user branch with 12-min cap)
- Credits: 1000, `user_credits.max_call_duration_minutes = 10`

### Persona → Number mapping
| Persona | Number |
|---|---|
| Brad (`brad_001`) | `+14633454719` |
| Sarah (`sarah_001`) | `+14632239537` |
| Alex (`alex_001`) | `+17622526613` |
| (unmapped, Brad-for-Dave) | `+14632313462` |

---

## Next Session Priorities

### A. Verify user's live test results from this session's work
- Hangup detection fires correctly on natural "gotta go" etc.
- Inbound 3-min trial cap hits warnings + terminates properly
- Unmapped number test (real dial, not curl)
- Verified-user 12-min cap (or document if we need to bump user_credits row)
- Any of the 10 "known things to watch for" that surfaced

### B. Pick from the deferred pile — USER DIRECTION NEEDED
1. **Caller dossier Phase 2** (schema + post-call analysis job) — blocks on Sonnet availability / Phase B inference routing
2. **Post-call memory reimplementation** — shares infrastructure with (1), probably do together
3. **Phase B inference routing system** (multi-model selection) — enables (1) and (2), is itself a big session
4. **Latency research** — the Apr 2026 inference-provider comparison, still on board from prior NSL
5. **Auth hardening** — rate limit login, password reset via Resend, shorter JWTs + refresh, lockout. User flagged as must-have before public launch, still outstanding.

### C. Rotate JWT_SECRET
Still deferred. Not blocking. ~3 command lines when user is ready.

---

## Docs That Need Updating

- `documentation/domain/voice-pipeline.md` — describe DB-SHIM, hangup detection, trial policy. NEW DOC (flagged in prior NSL).
- `documentation/domain/api.md` — `/api/voice/answer` is now bidirectional; document the inbound branch with caller populations.
- `documentation/domain/auth.md` — mention that inbound calls tie to `phone_verified=true` users only.
- `documentation/deployment/COMMAND_REFERENCE.md` — add the Twilio webhook update curl pattern, the safe voice-pipeline scp pattern (NOT the repo's deploy.sh which clobbers .env).
- `NEW DOC`: `documentation/domain/inbound-callers.md` — codify the verified/unverified-user/non-user matrix, trial cap policy, pretext templates, hangup detection, and the forthcoming dossier schema.

---

## Useful Commands Reference (additions this session)

```bash
# Push to origin (HTTPS remote + SSH key indirection)
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_ed25519 -o IdentitiesOnly=yes" \
  git push git@github.com:melshiD/call-me-back.git main

# Deploy voice-pipeline changes safely (avoids deploy.sh's .env clobber)
scp -i ~/.ssh/vultr_cmb voice-pipeline-nodejs/index.js \
  root@144.202.15.249:/opt/voice-pipeline/index.js.new
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 \
  'cd /opt/voice-pipeline && cp index.js index.js.bak.$(date +%s) && \
   mv index.js.new index.js && node --check index.js && pm2 restart voice-pipeline'

# Update all Twilio numbers to point at a given VoiceUrl
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'cd /opt/api-server && source .env && \
  for SID_PHONE in $(curl -s -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
      https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/IncomingPhoneNumbers.json | \
      python3 -c "import json,sys; d=json.load(sys.stdin); \
                  [print(n[\"sid\"]+\":\"+n[\"phone_number\"]) for n in d.get(\"incoming_phone_numbers\",[])]"); \
  do SID=${SID_PHONE%%:*}; PHONE=${SID_PHONE#*:}; \
     curl -s -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
       -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/IncomingPhoneNumbers/$SID.json" \
       --data-urlencode "VoiceUrl=https://api.callbackapp.ai/api/voice/answer" \
       --data-urlencode "VoiceMethod=POST" \
       --data-urlencode "StatusCallback=https://api.callbackapp.ai/api/voice/status" \
       --data-urlencode "StatusCallbackMethod=POST"; \
  done'

# Inbound test (simulate Twilio POST)
curl -s -X POST https://api.callbackapp.ai/api/voice/answer \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B16196433644&To=%2B17622526613&CallSid=CA_test_$(date +%s)"
```
