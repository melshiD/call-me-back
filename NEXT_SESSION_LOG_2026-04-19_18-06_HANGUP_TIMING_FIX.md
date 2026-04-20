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

## Production Readiness Roadmap (NEW — discussed end of session)

### Reframing: This product is opt-in-only

Earlier session planning treated consent-withdrawal ("don't call me") as a TCPA/legal concern. User clarified: **the product only works for scheduled callers** — everyone is opted-in. That changes the calculus:

- TCPA-exit detection is NOT a high priority for outbound (users scheduled the call).
- The 3-min anonymous trial path (inbound to app-owned numbers) is a separate edge case with its own economics, not a legal risk.
- **Hangup matcher as-is is probably sufficient for MVP launch.** People who scheduled a call want to talk.
- Parallel sentiment detection (discussed) is deferred to the caller-dossier work — no separate infra build.

### Production blocker inventory (ranked by risk reduction per effort)

**Round 1 — foundation (unblocks everything else)**
1. **CI/CD pipeline** — every change currently hand-`scp`'d to `/opt/voice-pipeline/` and hand-`pm2 restart`ed. No safety net, no rollback, no pre-flight checks. User explicitly flagged this.
2. **Observability (Prometheus + Grafana)** — user wants unified dashboard across disparate apps. See dedicated section below.
3. **Auth hardening + JWT_SECRET rotation** — rate-limited login, password reset (Resend), JWT refresh tokens, account lockout. One session, same blast radius.

**Round 2 — correctness**
4. **Inbound billing audit** — prior NSL flagged `updateCallStatus` was written for outbound. Inbound cost tracking may be under-reporting; 3-min trials may not be debited from anywhere.
5. **Scheduled-call reliability** — the core product promise. Is there a job runner? If VPS reboots, do queued calls still fire? Is there a retry policy for transient Twilio failures?
6. **DB backups + DR** — is `/opt/api-server` Postgres being backed up? RPO/RTO if the VPS dies?
7. **Error recovery in voice-pipeline** — 11 restarts so far. If it crashes mid-call, does the caller hear silence or a recorded error? Does Twilio's statusCallback fire correctly to avoid double-billing?

**Round 3 — polish for launch**
8. **Caller experience of failures** — what does Twilio play if `/api/voice/answer` errors? Dead air or "we're sorry, try again"?
9. **Payment flow end-to-end** — do credits actually buy minutes? What happens when a user runs out mid-call?
10. **Persona quality floor** — gpt-4o-mini is cheap but inconsistent. Need kill-switch fallback to a different model if complaints spike, OR Phase B inference routing done first.
11. **TOS + privacy + call recording disclosure** — if we store transcripts, the persona must disclose at call start (state laws vary).
12. **STIR/SHAKEN attestation** — carriers are aggressive about outbound verification. Even opt-in calls from a fleet of numbers may need this.

### Sequencing recommendation

**Next session: CI/CD pipeline (Round 1 #1).** It's what unlocks safely doing every other fix.

**Session after: Observability (Round 1 #2).** Get Prometheus/Grafana running so subsequent fixes can be measured.

**Session after that: Auth hardening (Round 1 #3).** Must-have before any public signup.

Then Round 2 items based on what observability reveals as the highest-pain issues.

---

## CI/CD Pipeline — Proposed Spec for Next Session

### Current state of deploys
| Component | Current method | Deploy script |
|---|---|---|
| Frontend | Manual `npx vite build && vercel --prod` | none |
| API Server | tarball scp from `server/src/` → `/opt/api-server/` | `server/deploy.sh` |
| Voice Pipeline | manual scp of `index.js` + pm2 restart | none (we use `scp` + manual commands from prior NSL) |

### Target architecture

**GitHub Actions** triggered on push/PR to main:

| Trigger | Job | Steps |
|---|---|---|
| Any PR | CI — Frontend | `npm ci`, `npm run build` (Vite catches TS errors), `npm test` if tests exist |
| Any PR | CI — API Server | `npm ci`, `npm run build`, `npm test` |
| Any PR | CI — Voice Pipeline | `npm ci`, `node --check index.js`, run hangup-detection tests (currently in `/tmp/test-hangup.mjs` — need to commit into `voice-pipeline-nodejs/test/`) |
| Merge to main | CD — Frontend | `vercel --prebuilt --prod && vercel alias set <url> callbackapp.ai` |
| Merge to main | CD — API Server | SSH to VPS → upload tarball → `pm2 reload api-server` (cluster mode = zero-downtime) |
| Merge to main | CD — Voice Pipeline | SSH to VPS → scp `index.js` → `node --check` → `pm2 reload voice-pipeline` (⚠️ fork mode — see drain note below) |
| Post-deploy | Smoke tests | curl `api.callbackapp.ai/health`, verify WSS handshake succeeds, maybe synthetic call |

### Branch + push strategy changes

Currently `main` = dev = prod, direct pushes allowed. CI/CD requires:
- **Branch protection**: PRs required, CI must pass before merge, no force push to main.
- **Cultural change flag**: the current "scp to VPS then commit whenever" workflow must stop — deploys only happen via merge to main.

### Voice-pipeline drain problem

`pm2 reload` on a fork-mode process = kill + restart = dropped WebSocket connections = mid-call drops.

**Options:**
- (a) **Accept it now** — we have ~zero live traffic, deploy only during low-traffic windows. Tolerable for MVP.
- (b) **Graceful drain** — set a flag, refuse new WebSocket connections, wait for in-flight calls to end (bounded timeout e.g. 15 min = max call duration), then restart. One session of work.
- (c) **Cluster mode** — probably requires Redis-backed session state, major refactor. Defer until traffic warrants.

**Recommendation: (a) now, (b) before public launch.** Note in a follow-up item.

### Secrets management

GitHub Actions repo secrets needed:
- `SSH_PRIVATE_KEY` (separate deploy key, not `vultr_cmb`)
- `VPS_HOST` = `144.202.15.249`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Critical**: the deploy script for voice-pipeline must scp ONLY `index.js`, NOT the whole directory — otherwise it'll overwrite the VPS `.env` (which `load-env.sh` generated and is gitignored). Prior NSL flagged this as a bus-factor risk.

### Rollback strategy
- **Frontend**: Vercel has 1-click rollback built-in.
- **API server**: pm2 cluster mode can `pm2 startOrReload` from previous tarball; keep last N tarballs on disk (`/opt/api-server/releases/<timestamp>.tar.gz`).
- **Voice pipeline**: already have `.bak.<epoch>` files on VPS from our scp-with-backup pattern; formalize a "`pm2 restart voice-pipeline` with previous index.js.bak" script.

### Session scope

**Minimum viable cut (single session):**
- GitHub Actions workflows: CI for all 3 components, CD for all 3
- Commit hangup-detection tests from `/tmp/test-hangup.mjs` into `voice-pipeline-nodejs/test/`
- Branch protection rules
- Update `documentation/deployment/COMMAND_REFERENCE.md` — replace "scp then pm2 restart" with "merge to main, check Actions"

**Stretch:**
- Post-deploy smoke tests
- Slack/email alert on deploy failure
- `.bak` cleanup cron on VPS (prevent disk fill)

**Explicit non-goals for this session:**
- Voice-pipeline graceful drain (defer to follow-up)
- Migration to cluster mode for voice-pipeline (defer indefinitely)

### Pre-session checklist (things to inventory first)
- [ ] What's in `server/deploy.sh` — tarball mechanics, env var handling, `--sync-only`/`--restart` flags
- [ ] Are there existing tests in `server/` or elsewhere
- [ ] GitHub Actions budget (free tier = 2000 min/mo, likely enough but verify)
- [ ] Confirm `vercel` CLI token vs GitHub Actions OIDC (Vercel supports both)

---

## Observability — Prometheus + Grafana Stack

### User ask
Unified dashboard across multiple disparate apps, including call-me-back. User specifically asked: "can I have a main dashboard hook into this app? A dashboard I have that pulls data from many of my disparate apps?" — **yes**, that's the standard Prometheus/Grafana use case.

### Architecture

```
  apps (each expose /metrics)
       │
       ├── call-me-back api-server (Node, prom-client)
       ├── call-me-back voice-pipeline (Node, prom-client)
       ├── OTHER APP A
       └── OTHER APP B
       │
       ▼
  Prometheus (scrapes all endpoints every 15s)
       │
       ▼
  Grafana (queries Prometheus, Loki, Tempo)
       │ ◄── this is your unified UI
       ▼
  User dashboards (per-app + cross-app overview)
```

### Deployment option decision

| Option | Pros | Cons | Cost |
|---|---|---|---|
| (a) Same VPS | cheapest, simple | couples lifecycle with call-me-back; if VPS dies, no postmortem data | $0 extra |
| (b) Separate obs VPS | isolation, survives call-me-back crashes | maintenance overhead | ~$6/mo Vultr |
| (c) **Grafana Cloud (free tier)** | zero-ops, separate failure domain, easy onboarding | 10k series / 14-day retention cap | $0 until scale |

**Recommendation: (c) for v1**, migrate to (b) only if costs or data-privacy constraints demand.

### Metrics to instrument

**voice-pipeline:**
- `voice_active_calls` (gauge) — calls in flight
- `voice_call_duration_seconds` (histogram)
- `voice_hangup_reason_total{reason="user_intent|max_duration|error|caller_disconnected"}` (counter)
- `voice_tts_first_byte_latency_seconds` (histogram) — ElevenLabs
- `voice_stt_first_transcript_latency_seconds` (histogram) — Deepgram
- `voice_llm_response_latency_seconds{model}` (histogram)
- `voice_farewell_mark_echo_duration_seconds` (histogram) — **validates the Layer-2 fix from this session**
- `voice_external_api_errors_total{service="elevenlabs|deepgram|openai|twilio"}` (counter)
- `voice_pipeline_process_up` (gauge, 0/1)

**api-server:**
- Standard HTTP metrics: `http_requests_total{method,path,status}`, `http_request_duration_seconds`
- `db_query_duration_seconds{query_name}` (histogram)
- `auth_login_failures_total{reason="bad_password|account_locked|rate_limited"}` (counter) — ties into auth hardening
- `calls_scheduled_total`, `calls_completed_total`, `calls_failed_total` (counters)

**Business-level (derived, query Postgres from Grafana):**
- Active users, credits consumed per call, cost per call in dollars (ElevenLabs chars × rate + Deepgram secs + OpenAI tokens + Twilio min)

### Logs (Loki — optional but valuable)

Currently we tail `pm2 logs voice-pipeline` by hand. Loki would:
- Ship all pm2/stdout logs to Grafana's UI
- Full-text search with LogQL
- Label-based filtering (`{app="voice-pipeline", call_id="..."}`)

Grafana Cloud's free tier includes 50GB log ingest / 14-day retention.

### Alerts (Round 2)

Grafana Alerting rules:
- `voice_active_calls > 0 for 10m AND voice_pipeline_process_up == 0` → "voice pipeline crashed during live calls"
- `rate(http_requests_total{status=~"5.."}[5m]) > 0.1` → "API 5xx rate elevated"
- `rate(voice_external_api_errors_total{service="elevenlabs"}[5m]) > 2` → "ElevenLabs flaky, consider failover"
- `histogram_quantile(0.95, voice_tts_first_byte_latency_seconds) > 2` → "TTS slow"
- `histogram_quantile(0.95, voice_llm_response_latency_seconds) > 3` → "LLM slow"

Notifications: PagerDuty (paid) or email/Slack for MVP.

### Cross-app dashboard pattern

For the user's "main dashboard pulling data from many disparate apps":
- **Consistent labeling across all apps**: `{env="prod", app="call-me-back", component="voice-pipeline"}`, `{env="prod", app="other-app", component="api"}`, etc.
- **Dashboard variables**: Grafana `$app` dropdown lets one template render any app's metrics.
- **Overview dashboard aggregates**: `sum by (app) (rate(http_requests_total{status=~"5.."}[5m]))` shows error rate per app, side by side.
- **Row per app**: Health, latency, traffic, errors — four panels per app, stacked. You see all apps at a glance.

### Session scope when we tackle observability

**Single session (after CI/CD):**
- Grafana Cloud account + Prometheus remote-write endpoint
- Add `prom-client` to `server/` — instrument HTTP + DB query metrics
- Add `prom-client` to `voice-pipeline-nodejs/` — instrument the voice-specific metrics above
- Expose `/metrics` on a port (e.g. 9100 api-server, 9101 voice-pipeline) — use a Prometheus Agent (lightweight) on VPS to scrape and remote-write to Grafana Cloud
- Build 1 dashboard: "call-me-back overview" with traffic, latency, error rate, active calls
- Set 3 alerts: voice-pipeline down, API 5xx spike, external API errors

**Stretch:**
- Loki pipeline from pm2 logs
- Second app instrumented to validate the cross-app dashboard pattern
- Business-metric queries against Postgres

**Non-goals:**
- Tempo/distributed tracing (deferred)
- Custom metrics for every single business event (start with the critical ones)

---

## Updated Next Session Priorities (REPLACES earlier "Next Session Priorities" above)

### Highest priority — Production path

1. **[NEXT SESSION] CI/CD pipeline** — detailed spec above. Unlocks everything else. User explicitly flagged.
2. **[SESSION +1] Observability: Prometheus + Grafana** — detailed spec above. User explicitly asked for unified cross-app dashboard.
3. **[SESSION +2] Auth hardening + JWT rotation** — rate limit, lockout, refresh tokens, Resend password reset.

### Medium priority — Correctness before public launch

4. Inbound billing audit (prior NSL item #7)
5. Scheduled-call reliability (job runner, retry policy, reboot survival)
6. DB backups + DR
7. Voice-pipeline error recovery (mid-call crash behavior)

### Near-term polish

8. Live test of the hangup-timing fix (this session's Layer-1/Layer-2 work) — real phone call, watch for the expected log sequence
9. Caller-experience-of-failures (Twilio fallback TwiML)
10. Payment flow end-to-end verification
11. gpt-4o-mini quality fallback kill-switch

### Compliance / legal

12. TOS + privacy policy + call recording disclosure in persona opening
13. STIR/SHAKEN attestation for outbound numbers

### Deferred indefinitely (noted, not scheduled)

- Caller dossier Phase 2+ (blocks on Phase B inference routing)
- Post-call memory reimplementation (shares infra with dossier)
- Phase B inference routing itself (multi-model selection)
- Latency research (Apr 2026 inference-provider comparison)
- Parallel sentiment detection for hangup (fits into caller-dossier infra)
- BrowserPipeline hangup support
- Persona-specific farewell lines
- Max-duration 100% path using `sayFarewellAndTerminate`

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
