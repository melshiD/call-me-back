# Next Session Log — 2026-04-18 00:58 UTC

## Session Summary

**Mission**: Unblock the voice pipeline end-to-end after the Raindrop → self-hosted migration. Diagnose every layer (frontend, API, WS, persona, LLM, TTS) and fix bugs one by one until a real test call speaks back.

**This session accomplished**: Went from "frontend white screen / 0-credit UI / immediate hangup / silent AI" → a working voice call with Alex responding in real time. Six distinct root-cause bugs identified and fixed. Two temp shims (DB fetch intercept, OpenAI error guard) in place as bridges to Phase B.

**End state**: Voice calls work. AI responds. There are two follow-ups the user flagged (see Next Session Priorities) and a substantial refactor ahead in Phase B.

---

## What Got Fixed (in order)

### 1. Frontend white screen on https://callbackapp.ai
**Symptom**: Site served HTML but blank body; Vue mount crashed at boot.
**Root cause**: `src/stores/auth.js:7` did `JSON.parse(localStorage.getItem('user'))` with no guard. A previous buggy code path had stored the literal string `"undefined"`, which is truthy but not valid JSON → `SyntaxError: "undefined" is not valid JSON` during Pinia store init → Vue setup throws → empty `<div id="app">`.
**Fix**: Added `safeParseUser()` helper that handles `"undefined"`, `"null"`, empty, and malformed JSON gracefully, clearing corrupt entries from localStorage. Applied to the initial load + the two fetch-refresh paths inside the auth store.
**Deploy gotcha**: Vercel's remote build was producing different bundles than our local `npx vite build`, and CLI `vercel --prod` was creating deployments that didn't auto-alias to `callbackapp.ai`. Resolved by using `vercel deploy --prebuilt --prod` from the locally-built `dist/` and then `vercel alias set <deployment> callbackapp.ai` explicitly. **This is the current deploy path for the frontend until Plan 5 (Netlify migration).**

### 2. `server/set-secrets.template` had live production secrets in the working tree
**Impact**: Stripe live key, Anthropic, OpenAI, Twilio SID, webhook secret were in the uncommitted diff. Not pushed (committed version was blank).
**Fix**: Copied filled values to `server/set-secrets.local` (gitignored via `*.local`), reverted `set-secrets.template` to the blank version in HEAD. No rotation needed since secrets never left local disk.

### 3. Schema mismatch: `minutes_balance` column didn't exist
**Symptom**: Historic api-server error log showed `column "minutes_balance" does not exist` at `getUserBalance`.
**Fix (from prior session, deployed this session)**: 4 files updated to query `available_credits` instead of `minutes_balance`, with `getUserBalance` returning a shape that still includes `minutes_balance` as an alias for backward compat. Deployed via `server/deploy.sh --sync-only && ./deploy.sh --restart`. Verified live endpoint returns `{"available_credits":1000,"minutes_balance":1000,…}` correctly.

### 4. Profile page + Pricing page showed "0" despite API returning correct balance
**Symptom**: UI credits display always 0.
**Root cause**: Frontend expected the legacy Raindrop response shape `{minutes, lastUpdated}`; new api-server returns `{available_credits, minutes_balance, subscription_tier, max_call_duration_minutes}`. `data.minutes ?? 0` fell through to 0.
**Fix**: Both `Profile.vue:fetchBalance` and `Pricing.vue:fetchBalance` now handle both shapes: `data.minutes_balance ?? data.available_credits ?? data.minutes ?? 0`. Other balance-shape call sites weren't inventoried — **any component that surfaces balance and was written against the Raindrop API shape may still be broken**.

### 5. Twilio call hung up immediately — DNS / Caddy missing host
**Symptom**: Call SID queued, phone never rang (or rang and dropped instantly). `status = 'queued'` forever.
**Root cause**: TwiML pointed Twilio at `wss://voice.callbackapp.ai/stream` but that hostname had NO DNS record and NO Caddy block. Caddy only served `voice.ai-tools-marketplace.io`.
**Fix**:
- User added A record `voice.callbackapp.ai → 144.202.15.249` in Cloudflare (proxy OFF / gray cloud — important for Let's Encrypt to work, and WebSockets behave better without CF proxy)
- Appended a matching Caddy block for `voice.callbackapp.ai` on the VPS (clone of the ai-tools-marketplace block, pointing at localhost:8001). Cert issued automatically.

### 6. Voice pipeline couldn't load persona (DB calls 404ing)
**Symptom**: Every call logged `[Pricing] Failed to load from DB: {"error":"Not found"}` at startup. Personas never loaded. Persona fetch silently failed.
**Root cause**: `/opt/voice-pipeline/index.js` has 14 call sites that `fetch(\`${env.VULTR_DB_API_URL}/query\`, {body: {sql, params}})` — a raw SQL passthrough that existed on the old Raindrop-era `db-proxy` but NOT on the new api-server. The `VULTR_DB_API_URL` env var was updated to point at the new api-server (port 3000), but the new api-server has route-based endpoints (`/api/calls/*`, `/api/personas/*`), not `/query`.
**Fix (temp, per user direction "we WILL be making this robust and properly once we verify pipeline working")**:
- Added `pg@^8.11.3` dependency to voice-pipeline
- Added `DATABASE_URL` to `/opt/voice-pipeline/.env` (copied from api-server's .env)
- Added a **DB-SHIM at the top of `index.js`** that overrides `globalThis.fetch`: any request to `${env.VULTR_DB_API_URL}/query` is intercepted, the SQL + params are run directly via `pg` against Postgres, and the result is returned in a `Response`-shaped object so the 14 existing call sites work unchanged.
- All 14 query sites now return real data (pricing table loads, persona metadata loads, call-context loads, credit deduction works, conversation persistence works).
- **Tech-debt banner** explicitly in code comments. Phase B / Plan 2-3 will replace the shim with proper REST endpoints like `/api/internal/personas/:id/config` and `/api/internal/calls/:id/context`.

### 7. LLM fallback "Sorry bro, I lost my train of thought" every turn
**Symptom**: Calls connected, Deepgram transcribed user correctly, but every response was the canned fallback. Log showed `TypeError: Cannot read properties of undefined (reading '0')` at `data.choices[0]`.
**Root cause #1**: OpenAI request body was sending `temperature` as a STRING (e.g., `"0.7"`). Postgres returns `NUMERIC` columns as JS strings by default; the code used `row.temperature` directly. OpenAI strictly requires a decimal → `400 Invalid type for 'temperature'`. Response had no `choices` array → crash.
**Root cause #2 (cost bleed)**: Every EagerEndOfTurn was firing a speculative draft LLM call, PLUS the real EndOfTurn call. Post-call fact extraction also hit OpenAI with a conversation dump. System prompt rebuilt from scratch each turn (~1.4k tokens/turn prompt for 100-token reply).
**Fixes deployed together**:
- Coerce `row.temperature` / `row.max_tokens` via `Number()` on DB load with `Number.isFinite` guard
- Added response-shape guard in main `generateResponse()` AND in `evaluateTurnWithLLM()` — if `data.choices` is missing, log raw OpenAI body (truncated 1000 chars) to STDERR and fall through to fallback, no crash
- **Disabled speculative draft** at the EagerEndOfTurn dispatch site (`clearDraft()` only, no `prepareDraftResponse()` call). Saves one LLM call per turn.
- **Disabled post-call fact extraction** (`runPostCallEvaluation` is now a log + return). Saves one LLM call per call.

**Verified working**: After temperature fix, the next call had Alex responding naturally ("What were you saying?" got a real contextual reply).

---

## Current Production State

### What's Live (callbackapp.ai)

| Component | URL / Path | Status | Notes |
|-----------|-----------|--------|-------|
| Frontend | https://callbackapp.ai | ✅ Deployed | Via `vercel deploy --prebuilt --prod` + manual alias. Bundle: `index-CVxada23.js`. |
| API Server | https://api.callbackapp.ai | ✅ Healthy | DB + Redis OK. Up 18h. |
| Voice Pipeline | wss://voice.callbackapp.ai/stream | ✅ Working | OpenAI gpt-4o-mini. DB-SHIM intercepting `/query` calls. Spec draft + fact extract disabled. |
| Caddy | 80/443 on VPS | ✅ | `voice.callbackapp.ai` block added this session. |

### VPS PM2 Processes (after this session)

| Name | Status | Port | Notes |
|------|--------|------|-------|
| api-server | online | 3000 | Up 18h, 5 restarts (stable). |
| voice-pipeline | online | 8001 | Restart #9 this session. pg + DB-SHIM. |
| db-proxy | stopped | — | DEPRECATED, still in PM2 list. Remove at convenience. |
| deepgram-proxy | online | — | Untouched. |
| log-query-service | online | 3001 | Untouched. |

### Caddy Active Host Blocks

```
db.ai-tools-marketplace.io → localhost:3000 (legacy, harmless)
voice.ai-tools-marketplace.io → localhost:8001 (legacy, still works)
logs.ai-tools-marketplace.io → localhost:3001
test.ai-tools-marketplace.io
exact.ai-tools-marketplace.io
api.callbackapp.ai → localhost:3000
voice.callbackapp.ai → localhost:8001  ← NEW THIS SESSION
```

Caddyfile backup at `/etc/caddy/Caddyfile.bak.<timestamp>`.

### Local Files Changed (uncommitted)

- `src/stores/auth.js` — safeParseUser helper + 3 guarded call sites
- `src/views/Profile.vue` — balance shape compat (minutes_balance / available_credits / minutes)
- `src/views/Pricing.vue` — same balance shape compat
- `server/src/services/auth-service.ts` — removed minutes_balance from INSERT (from prior session)
- `server/src/services/admin-service.ts` — SUM available_credits
- `server/src/services/payment-service.ts` — UPDATE available_credits only
- `server/src/services/call-service.ts` — getUserBalance returns aliased shape
- `src/router/index.js` — /register renders Register.vue (not redirect to /login)
- `NEXT_SESSION_LOG_2026-04-16_2159.md` — previous session's log, still untracked
- `server/schema-dump.sql` — DB schema dump (gitignored)
- `server/set-secrets.local` — real secrets (gitignored)

### Server-Side Changes on VPS (not in git)

- `/opt/voice-pipeline/index.js` — DB-SHIM, speculative draft disabled, post-call eval disabled, temperature/maxTokens Number() coercion, OpenAI response-shape guards. Backup at `/opt/voice-pipeline/index.js.bak.pre-dbshim-*`.
- `/opt/voice-pipeline/package.json` — added `pg@^8.11.3`.
- `/opt/voice-pipeline/.env` — `DATABASE_URL` appended.
- `/etc/caddy/Caddyfile` — `voice.callbackapp.ai` block appended.

### Test Account

- Email: `dave.melshman@gmail.com`
- Password: `Testing123`
- User ID: `user_01KAJKFCJ2DNS5AKP478BS0G4R`
- Phone: `+16196433644`
- Credits: **1000** (bumped this session from 50)
- Max call duration: **60 min** (bumped this session from 5)
- Admin: Yes

---

## Known Issues / Tech Debt Accepted This Session

### 1. JWT access token leaked to tool-call history
During diagnosing the 0-credit display, I ran `curl /api/auth/login` → got a JWT → pasted the literal token into the next curl to hit `/api/user/balance`. **User explicitly flagged this as a secret leak.** User said "let's rotate it in a bit... we'll swing back around, I want to test" — so rotation is **deferred, not forgotten**.

**To rotate** (3 commands on VPS; secret never leaves server):
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
NEW=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$NEW|" /opt/api-server/.env
pm2 restart api-server
```
After this, the leaked token is dead; all users need to log in again. Test account password stays the same.

**Behavioral change I committed to for rest of session and future**: never paste a secret literal into a follow-up tool call. Use chained SSH for single-hop token reuse: `ssh vps 'TOKEN=$(curl -s ...login | jq -r .token) && curl -s ... -H "Authorization: Bearer $TOKEN"'`.

### 2. DB-SHIM in voice-pipeline
Gets the call working tonight. Raw SQL over a fetch() polyfill is not the long-term pattern. Replace with proper REST endpoints in Phase B.

### 3. Speculative draft + post-call fact extraction disabled
Both were contributing to token spend. They need to come back but with proper cost controls and the new inference routing system. **User's explicit position: "we will be making this robust and properly once we verify pipeline working"** — so the disable is the correct call for tonight.

### 4. Pricing table keys say `cerebras:*`
Log line at voice-pipeline startup: `[Pricing] No price found for cerebras:gpt-4o-mini`. Harmless for calls themselves but cost tracking is mispricing / missing. User directive: **Cerebras is OUT. All `cerebras*` variable names, pricing keys, tokens tracking field names must be renamed to provider-neutral names (`chatTokens`, `extractionTokens`, etc.) in Phase B.**

### 5. Vercel remote builds produce different bundles than local
`vercel --prod` (without --prebuilt) uses Vercel's build server, which produced bundles that didn't match our local source. Root cause not fully diagnosed. Workaround is to always `npx vite build && vercel deploy --prebuilt --prod && vercel alias set <deployment-url> callbackapp.ai`. Note for Plan 5 Netlify migration.

### 6. 5 files in server/src/services committed to VPS but NOT to local git
The schema fixes we deployed this session are still uncommitted. Commit them **first thing next session** once we verify nothing else needs changing.

---

## Next Session Priorities

### A. FIRST — Commit + Rotate JWT_SECRET

1. Commit this session's changes:
   - Schema fixes (4 server/src/services/*.ts files)
   - Router fix (src/router/index.js)
   - auth.js safeParseUser
   - Profile.vue + Pricing.vue balance shape compat
   - This NSL
   - The prior session's NSL (still untracked)
   - Voice-pipeline index.js + package.json SHOULD be copied to a local `voice-pipeline/` directory in the repo and committed too — right now live server code is the only source of truth for the DB-SHIM
2. Rotate JWT_SECRET (3-line VPS command above).
3. Log back in on frontend to get a fresh token.

### B. User Priority #1 — "Call persona FROM my phone" no longer works

User: *"the feature of calling the persona from my phone, which previously worked on Raindrop, no longer works"*

This is the **inbound / callback** flow: you call the Twilio number, and the persona answers you (rather than the app initiating an outbound call to you). Investigation starts with:

1. Pull Twilio console phone number config: what webhook is set for "A call comes in"? Is it pointing at the old Raindrop URL or the new api-server?
2. Check api-server for an inbound voice handler. Current `/api/voice/answer` handles outbound (takes callId/userId/personaId as query params). An inbound handler would need to:
   - Identify caller by `From` phone number
   - Look up the user → pick persona (their default? last used? need UX)
   - Return TwiML that bridges to voice-pipeline with appropriate params
3. `unknown_caller_attempts` table exists in schema — suggests this was implemented once. Find that code in the raindrop archive and port.
4. Answer-message for anonymous callers (menu? "who are you calling?"?) was probably part of the old UX.

### C. User Priority #2 — Latency research: get back to Raindrop+Cerebras "lightning fast" but with smarter models

User: *"when I had raindrop + cerebras it was LIGHTNING fast, so how can I dial that in while still utilizing smarter inference than the llama3 model I was using"*

Latency budget today: Twilio audio → Deepgram Flux STT (~200ms to first partial) → turn detection + LLM (`gpt-4o-mini` ~500-1500ms to first token) → ElevenLabs TTS streaming (~100-300ms to first audio chunk) → Twilio audio out. End-to-end first-word-after-user-finishes typically 800-2000ms with OpenAI.

Cerebras was 50-150ms to first token (token-per-second >1000 vs GPT's ~100-300). The latency gap is almost entirely the LLM.

Research questions for next session:
1. **Ultra-fast inference providers (April 2026 landscape)** — Groq, Cerebras Cloud (user wants AWAY from), SambaNova, Together AI, Fireworks. Token latency numbers, model catalogs (which top-tier models they host), price per 1M tokens, rate limits.
2. **Speculative decoding at the provider level** — are any providers offering this natively?
3. **Hybrid routing pattern**: small model for turn filler ("hm", "yeah") / backchannel, large model for substantive response. Not a new idea but now realistic with the configurable-inference layer we're about to build.
4. **Streaming TTS providers other than ElevenLabs** — Cartesia (Sonic v2), Deepgram Aura v2, PlayHT. ElevenLabs' 20-sec input-timeout is a real constraint.
5. **"Voice agent" platforms** — LiveKit Agents, Vapi, Retell — do they offer architecture patterns we should steal (not the full platforms)?
6. **The specific low-latency model that's smarter than llama3.1-8b** — user wants this. Candidates to benchmark:
   - Claude Haiku 4.5
   - GPT-4o-mini / GPT-4.1-mini / GPT-5-mini (whatever's current)
   - Gemini 2.5 Flash
   - Grok 4 fast
   - DeepSeek V3.5
   - Qwen 2.5 32B
   - Llama 3.3 70B on Groq (may still be fastest + smarter than 8B)

Recommendation: launch research agent / WebSearch pass into this on session start. Produce a comparison matrix: `provider × model × first-token-latency × tokens/sec × input/output price × context window × availability`. Then decide what to wire into the new inference router.

### D. Phase B — Build configurable inference routing system

User directive: *"I want to be able to have users select (as they can now for extraction) what models they deal with for every aspect of the app's inference"*

Scope (needs brainstorming session before coding):
1. **Schema** for per-user + per-persona + per-task model selection. Probably a new table `inference_preferences (user_id, persona_id NULL, task ENUM('chat','extraction','turn_eval','memory_recall'), provider, model, params JSONB)`.
2. **`resolveModel({userId, personaId, task})`** helper that returns `{provider, model, apiKey, baseUrl, ...}` — central routing point.
3. **`callLLM(messages, resolved)`** — provider-agnostic wrapper that handles OpenAI, Anthropic, Groq, Cerebras, Gemini, whoever. Normalizes `{content, usage}` output.
4. **Admin UI** for global defaults per task.
5. **User UI** in PersonaDesigner / Profile for overrides per persona and per task.
6. **Cost tracking** rewritten to be `{provider}:{model}:{operation}` keys, not `cerebras:*`. `service_pricing` table rewrite.
7. **Rename all `cerebras*` symbols** in codebase to neutral.
8. **Migrate existing data** — current `personas.llm_model` column (string) becomes the "chat" inference preference default.

### E. Plans 2-5 from spec doc (`docs/superpowers/specs/2026-04-13-raindrop-migration-design.md`)

Still on the board. Phase B above addresses a chunk of Plan 3 (multi-model inference). Plan 2 (memory + pgvector), Plan 4 (observability), Plan 5 (Netlify migration) are still pending. Phase B re-enables post-call fact extraction as part of Plan 2 work.

### F. Auth hardening (from prior session's NSL, still outstanding)

User's flagged MUST-HAVE from last session:
- Rate limiting on `/api/auth/login`
- Password reset flow (needs email provider — Resend)
- Shorter JWT + refresh tokens
- Account lockout after N failed attempts
- Fix `AdminLogin.vue` to use email/password form

Goes in before public launch; can be deferred while we iterate.

---

## Commits This Session

None yet. All work is uncommitted (local + on VPS). Commit plan for next session's first action:

```
feat(voice-pipeline): add DB-SHIM bridging fetch(/query) to direct pg calls

Temporary bridge that intercepts the old Raindrop-era db-proxy SQL
passthrough calls and routes them through pg directly. Unblocks voice
pipeline persona/context/credit queries after the API server removed
the /query endpoint. To be replaced by proper REST endpoints in the
Phase B inference-routing refactor.

Also:
- Disabled speculative draft LLM path (cost reduction)
- Disabled post-call fact extraction (pending Plan 2 memory redesign)
- Coerce persona.temperature/max_tokens to Number on load
- Guard OpenAI response-shape and log raw upstream errors

fix(frontend): robust auth localStorage parse + balance shape compat

- safeParseUser handles corrupt/undefined/null localStorage gracefully
  (fixes white-screen after buggy prior write of "undefined" string)
- Profile + Pricing pages now read minutes_balance / available_credits
  in addition to legacy `minutes` key

fix(api-server): use available_credits everywhere (drop minutes_balance column refs)

Live DB uses available_credits; minutes_balance never existed on the
Vultr Postgres instance. 4 service files updated; getUserBalance
returns both keys in response for frontend backcompat.

chore(caddy): add voice.callbackapp.ai block + Cloudflare A record
chore(env): move filled set-secrets.template values to .local
chore(docs): add prior + current NSLs
```

---

## Useful Commands Reference

```bash
# Deploy API
cd server && ./deploy.sh --sync-only && ./deploy.sh --restart

# Deploy Frontend (Vercel remote build is broken for us; always prebuild)
npx vite build && \
  rm -rf .vercel/output/static && cp -r dist .vercel/output/static && \
  DEPLOY_URL=$(vercel deploy --prebuilt --prod 2>&1 | grep -o 'https://call-me-back-[^ ]*') && \
  vercel alias set "$DEPLOY_URL" callbackapp.ai

# Tail voice-pipeline
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 100 --nostream'

# Tail voice-pipeline LIVE (background this in your Bash tool)
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 0 --raw'

# Tail api-server error log
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs api-server --err --lines 50 --nostream'

# Query DB
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "sudo -u postgres psql -d call_me_back -c \"SELECT ...\""

# Reload Caddy after editing Caddyfile
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && systemctl reload caddy'

# Rotate JWT (FIRST THING next session)
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 \
  'NEW=$(node -e "console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))") && \
   sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$NEW|" /opt/api-server/.env && \
   pm2 restart api-server'
```

---

## Docs That Need Updating

All previous NSL callouts still apply. Additional this session:

- `documentation/domain/frontend.md` — references Raindrop API endpoint pattern, Vercel auto-deploy-on-push (both no longer accurate). Mention the prebuilt deploy workflow.
- **NEW doc needed**: `documentation/domain/voice-pipeline.md` — describing the pipeline, the DB-SHIM, disabled code paths, LLM provider config, environment variables.
- **NEW doc needed**: `documentation/phase-b-plan.md` once inference routing spec is written.
- Update `documentation/deployment/COMMAND_REFERENCE.md` with the Vercel prebuilt workflow and the voice.callbackapp.ai Caddy block.
