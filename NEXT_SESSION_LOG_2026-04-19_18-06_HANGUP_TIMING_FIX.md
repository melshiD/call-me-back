# Next Session Log — 2026-04-19 18:06 EDT (2026-04-19 22:06 UTC)

## Session Summary

**Mission**: Tune the hangup-on-demand farewell wait so the persona's "Alright, take care!" actually finishes playing to the caller before the WebSocket closes. Prior session's implementation was consistently cutting off the farewell.

**End state**: Rewrote `sayFarewellAndTerminate()` with a two-layer synchronization mechanism (ElevenLabs `isFinal` + Twilio `mark` round-trip). Deployed to VPS (voice-pipeline restart #11). Plus: discovered last session's NSL incorrectly claimed `e8b1387` and `29925ea` were pushed to origin — they were NOT; origin/main was still at `7bcfbab`. This session finally pushes all of it.

**Deferred** (continues prior NSL deferrals): JWT_SECRET rotation, post-call memory reimplementation, caller dossier Phase 2+, auth hardening, Phase B inference routing.

---

## Root Cause of the "Too Short" Farewell

In `sayFarewellAndTerminate()` the old wait calculation was:

```js
const waitMs = Math.min(6000, Math.max(1500, (this.totalAudioDurationMs || 0) + 500));
```

Three stacked bugs made this always = 1500ms:

1. **`totalAudioDurationMs` is reset at the START of `speak()`** (line 1958 in the old layout: `this.totalAudioDurationMs = 0`). Alignment data from ElevenLabs arrives AFTER `speak()` returns, so reading `totalAudioDurationMs` immediately after `await this.speak()` read zero.
2. **`await speak()` only waits for text to be sent to ElevenLabs**, not for any audio to be generated, streamed to Twilio, or played to the caller. It returns right after the two `ws.send(JSON.stringify(...))` calls.
3. **`finishSpeaking()` uses the correct byte-based calculation** (`Math.ceil(bytes / 8) + 500`) but runs asynchronously on the ElevenLabs `isFinal` event — the old farewell path didn't wait for it.

Net: `(0 || 0) + 500 = 500`, clamped up to the `1500` floor. Every farewell got exactly 1500ms regardless of utterance length, and a "three-word" farewell with TTS start latency blew through that budget every time.

---

## Fix — Two-Layer Synchronization

### Layer 1: ElevenLabs `isFinal` waitable promise

- Added `_farewellIsFinalResolve` to the VoicePipeline constructor state.
- In the ElevenLabs message handler, when `message.isFinal` fires, if `_farewellIsFinalResolve` is set, resolve and clear it BEFORE calling `finishSpeaking()` (so the farewell path gets signaled before the normal "ready for next turn" housekeeping runs).
- `sayFarewellAndTerminate()` arms this promise BEFORE calling `await this.speak(farewell)`, then awaits it with an 8-second timeout. At this point all audio for the farewell has been generated and streamed to Twilio.

### Layer 2: Twilio `mark` event round-trip

- Added `_farewellMarkResolve` to constructor state.
- Added a new `message.event === 'mark'` branch in the Twilio WebSocket message handler (between the existing `media` and `stop` branches). When Twilio echoes back our `farewell-end` named mark, resolve the promise.
- After Layer 1 completes, `sayFarewellAndTerminate()` sends:
  ```js
  { event: 'mark', streamSid, mark: { name: 'farewell-end' } }
  ```
  to the Twilio WebSocket. Twilio is documented to echo the mark back ONLY after the caller-facing audio buffer has fully drained. This is the canonical "caller has heard the whole thing" signal.
- Timeout: `max(2500, farewellPlaybackMs + 1500)` where `farewellPlaybackMs = ceil((sentAudioBytes_after - sentAudioBytes_before) / 8)`. Byte snapshots taken before/after the farewell give us true utterance-specific byte counts.
- If `twilioWs` is closed (e.g., caller already hung up), falls back to a pure byte-based wait `max(1500, farewellPlaybackMs + 500)`.

### New sequencing

```
hangup intent detected
  ↓
arm isFinal-resolver, snapshot sentAudioBytes
  ↓
speak(farewell)                   ← text sent to ElevenLabs
  ↓
await isFinal (≤8s timeout)       ← all audio streamed to Twilio
  ↓
compute farewellBytes → farewellPlaybackMs  (bytes/8, exact)
  ↓
send Twilio mark {name:'farewell-end'}
  ↓
await mark echo (timeout = playbackMs + 1500ms, floor 2500ms)
  ↓
forceTerminate()
```

### Files touched

- `voice-pipeline-nodejs/index.js` — 87 insertions, 9 deletions:
  - Constructor: added 2 state fields (`_farewellIsFinalResolve`, `_farewellMarkResolve`)
  - ElevenLabs `isFinal` handler: added 6 lines to resolve the farewell promise before `finishSpeaking()`
  - Twilio message handler: added the `mark` event branch (~9 lines)
  - `sayFarewellAndTerminate()`: full rewrite (~70 lines including doc comment)

Local `node --check` passes. VPS `node --check` passes. Deployed via the safe scp pattern from the prior NSL (backup at `/opt/voice-pipeline/index.js.bak.pre-hangup-tune-<epoch>`). pm2 restart #11, online, 76.5mb RSS.

---

## IMPORTANT: Push Correction

Last session's NSL (`NEXT_SESSION_LOG_2026-04-19_14-30_INBOUND_TRIAL_HANGUP.md`) claimed in its commit list that these two commits were pushed:

- `29925ea feat(voice-pipeline): detect user hangup intent + graceful farewell`
- `e8b1387 feat(voice): inbound call policy — trial caps, persona lookup, pretext routing`

**They were not.** `git fetch origin && git log origin/main..HEAD` at the start of this session showed origin/main still at `7bcfbab chore: NSLs for Raindrop→self-host migration sessions`. This session's push includes those two commits PLUS this session's new commits.

---

## Things To Watch For In Next Test (EXPLICIT FOLLOW-UPS)

### 1. Mark event format

We send `{event:'mark', streamSid, mark:{name:'farewell-end'}}`. Twilio Media Streams docs indicate Twilio echoes back the mark in `{event:'mark', streamSid, sequenceNumber, mark:{name:'farewell-end'}}` after audio drains. **Verify in logs**: `[Voice Pipeline] Received MARK from Twilio: farewell-end` should appear roughly `farewellPlaybackMs` milliseconds after `📍 Sent farewell-end mark to Twilio`. If no echo ever arrives, we hit the `markTimeout` branch and fall back to timing-based termination (still better than the old 1500ms floor because `farewellPlaybackMs` is accurate).

### 2. Prior utterance's isFinal could arrive first

If `speak(farewell)` is called while a previous utterance's `isFinal` is still in flight (race condition with async ElevenLabs buffering), the farewell resolver could get triggered by the WRONG `isFinal`. Mitigation: the resolver is armed ONLY inside `sayFarewellAndTerminate()` and cleared immediately after being consumed, so the window is narrow. But if the hangup detector fires between a previous utterance's text-send and its `isFinal`, this bug surfaces.

**Test scenario that would reveal it**: user says "I hear you, but gotta go" mid-persona-response. The detector fires on "gotta go" (assuming generateResponse is already running for that turn), speak(farewell) sends text, and if the interrupted previous utterance's `isFinal` arrives before the farewell's, we'd resolve too early.

**Fix if needed**: track an `utteranceId` counter and only resolve when `isFinal` matches the expected ID. Not implementing now because the detector runs at the TOP of `generateResponse()` (before any `speak()` for the current turn), so in practice the race is unlikely.

### 3. Hardcoded farewell still "Alright, take care!"

Prior NSL flagged this — still hardcoded. Phrasing not persona-specific (Brad vs Alex vs Sarah all say the same line in different voices). Remedy options unchanged from prior NSL:
- Add `personas.farewell_line` column with null default.
- Or generate a one-shot persona-consistent farewell via cheap LLM call.

### 4. `user_credits.max_call_duration_minutes = 10` still caps verified users at 10 min

Prior NSL item #5 — `VERIFIED_USER_MAX_MINUTES = 12` is a ceiling but the row-level cap is 10 for dave.melshman@gmail.com. User can `UPDATE user_credits SET max_call_duration_minutes = 12 WHERE user_id = 'user_01KAJKFCJ2DNS5AKP478BS0G4R';` to get the full 12-min test window.

### 5. BrowserPipeline class (~line 2758+) unchanged

The browser test path has its own copy of `sendAudioToTwilio`/`forceTerminate`/`totalAudioDurationMs` and does NOT use the Twilio mark mechanism. If we ever wire hangup detection into the browser path, it'll need a simpler Layer-1-only implementation (no Twilio marks available in the browser-direct flow).

### 6. Max-duration 100% termination path NOT using `sayFarewellAndTerminate`

Line 806: `if (percentComplete >= 100) { this.forceTerminate(); }` — this fires after the max-duration timer hits without speaking a custom farewell first. The "final" warning at 96% (`Alright, I've got to let you go now...`) IS spoken, but then at 100% we just close the socket with whatever audio is in flight. Might be fine (the 96% warning already said goodbye), but note that the 4-percentage-point window between "final warning" and "force terminate" might not be enough to play the full warning message on some calls. If user testing reveals cut-off final warnings, use `sayFarewellAndTerminate` at 100% with the final-warning text.

### 7. Mark echo might get filtered if streamSid format differs

We send `streamSid: this.streamSid` — this is set from `message.start.streamSid` at line 2681. Twilio expects the mark's `streamSid` to match the stream's SID exactly. Since we're using the same variable that Twilio itself sent us, this should always match.

---

## Commits This Session

Expected sequence after commit:

```
<NEW> feat(voice-pipeline): two-layer farewell sync — ElevenLabs isFinal + Twilio mark round-trip
<NEW> chore: NSLs for hangup timing tune session (2026-04-19 18:06) + prior session
29925ea feat(voice-pipeline): detect user hangup intent + graceful farewell        (from 14:30 session; not yet on origin)
e8b1387 feat(voice): inbound call policy — trial caps, persona lookup, pretext routing  (from 14:30 session; not yet on origin)
7bcfbab chore: NSLs for Raindrop→self-host migration sessions + gitignore schema dumps  (= current origin/main HEAD)
```

Push command (same SSH prefix as prior NSL):
```bash
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_ed25519 -o IdentitiesOnly=yes" \
  git push git@github.com:melshiD/call-me-back.git main
```

---

## Current Production State

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend https://callbackapp.ai | ✅ No change this session | Prior vercel deploy from earlier today `call-me-back-llpordwjd` is live but was never aliased — may need `vercel alias set` if frontend changes are meant to be live. |
| API Server https://api.callbackapp.ai | ✅ Unchanged this session | No api-server changes. |
| Voice Pipeline wss://voice.callbackapp.ai/stream | ✅ Updated | Restart #11 with two-layer farewell sync. Online. |
| Twilio webhooks | ✅ Unchanged | All 4 numbers still POST to api.callbackapp.ai/api/voice/answer. |

### VPS File Changes This Session

- `/opt/voice-pipeline/index.js` — scp'd directly, syntax-checked, pm2 restarted.
- Backup created at `/opt/voice-pipeline/index.js.bak.pre-hangup-tune-<epoch>`.

### Test Account (unchanged)

- Email: `dave.melshman@gmail.com`
- Password: `Testing123`
- User ID: `user_01KAJKFCJ2DNS5AKP478BS0G4R`
- Phone: `+16196433644` (verified)
- Credits: 1000, `user_credits.max_call_duration_minutes = 10`

### Persona → Number mapping (unchanged)

| Persona | Number |
|---|---|
| Brad (`brad_001`) | `+14633454719` |
| Sarah (`sarah_001`) | `+14632239537` |
| Alex (`alex_001`) | `+17622526613` |
| (unmapped, Brad-for-Dave) | `+14632313462` |

---

## Next Session Priorities

### A. Verify live hangup-timing behavior
- Call an app number, say "bye" / "gotta go" / "I've gotta run."
- Expected log sequence:
  1. `👋 Farewell audio sent: <bytes> bytes (~<ms>ms playback)`
  2. `📍 Sent farewell-end mark to Twilio`
  3. `Received MARK from Twilio: farewell-end`
  4. `Force terminating call (max duration reached)` (actually the log message still says "max duration" even from the farewell path — consider updating message)
- Expected user experience: persona says "Alright, take care!" in full, then call ends cleanly.
- If mark echo never arrives, investigate Twilio's Media Streams mark echoing (check whether Twilio needs the stream to be in a particular state).

### B. Watch-for items inherited from prior NSL
Still outstanding:
- 3-min anonymous trial cap end-to-end verify (real phone call, not curl)
- Unmapped `+14632313462` dial-from-phone verify
- Verified-user 12-min cap verify (or bump user_credits row to 12)
- Speculative draft path (if re-enabled): hangup detector must also run there
- Anonymous-caller abuse enforcement (wire `unknown_caller_attempts.blocked` to return `<Hangup/>` TwiML)

### C. Deferred pile (from prior NSL, carrying forward)
1. Caller dossier Phase 2 (schema + post-call analysis job; blocks on Sonnet routing)
2. Post-call memory reimplementation (shares infra with #1)
3. Phase B inference routing system (multi-model selection)
4. Latency research (Apr 2026 inference-provider comparison)
5. Auth hardening (rate limit login, password reset via Resend, shorter JWTs + refresh, lockout) — must-have before public launch

### D. Miscellaneous
- **JWT_SECRET rotation** — still deferred, ~3 commands.
- **Hardcoded farewell line** — either persona-specific column OR one-shot LLM generation.
- **Max-duration 100% path** — consider routing through `sayFarewellAndTerminate` with a final-warning-flavored farewell.
- **BrowserPipeline hangup support** — if we start testing from the web frontend, need a simpler version of the farewell sync (no Twilio marks).
- **Vercel alias check** — confirm `callbackapp.ai` points at the intended latest deploy.

---

## Docs That Need Updating

Same list as prior NSL, plus:

- `documentation/domain/voice-pipeline.md` — describe the two-layer farewell sync (ElevenLabs isFinal + Twilio mark). NEW DOC (flagged in prior NSLs).
- `documentation/deployment/COMMAND_REFERENCE.md` — Twilio mark round-trip pattern, if we want it documented for future features (pre-recorded announcement playback, mid-call transfers, etc.).

---

## Useful Commands Reference (additions this session)

```bash
# Check whether origin/main is actually up to date before trusting prior NSL claims
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_ed25519 -o IdentitiesOnly=yes" \
  git fetch git@github.com:melshiD/call-me-back.git main
git log origin/main..HEAD --oneline

# Verify voice-pipeline restart picked up the new code
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 status voice-pipeline'
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 50 --nostream'

# Grep for the new farewell sync signals in live logs
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 \
  'pm2 logs voice-pipeline --lines 500 --nostream | grep -E "Farewell audio|farewell-end|Received MARK"'
```
