# Next Session Log — 2026-04-16 21:59 UTC

## Session Summary

**Mission**: Migrate CallbackApp AI off Raindrop (shutting down) to a fully self-hosted stack on the Vultr VPS. Also redesign memory, add multi-model inference, observability, and billing tier support.

**This session accomplished**: Plan 1 (Express API Server migration) fully designed, implemented, deployed to production, and partially tested with a live call. Schema mismatches discovered and being fixed. Voice pipeline switched from Cerebras to OpenAI for inference.

---

## What Got Built

### Design & Planning (committed to disk, gitignored)
- **Spec**: `docs/superpowers/specs/2026-04-13-raindrop-migration-design.md` — Full architecture for all 5 plans (API migration, memory redesign w/ pgvector, multi-model inference w/ tier billing, observability w/ Prometheus+Grafana, frontend migration)
- **Plan 1**: `docs/superpowers/plans/2026-04-13-plan1-express-api-migration.md` — 15-task detailed implementation plan for the API server

### Archive
- **`documentation/tech_manual/archive/2026-04-14-pre-raindrop-migration.tar.gz`** — Full snapshot of all docs before migration changes (2.9MB, 312 files). On disk, gitignored.

### Express API Server (NEW — `/server/` directory)

10 git commits since branch point `a308c4b`. Full stack:

- **Tech**: Hono (HTTP framework), pg (PostgreSQL), ioredis, bcryptjs, jose (JWT), node-cron, @hono/node-server
- **21 TypeScript source files**: 3 infra (db, redis, index), 3 utils (jwt, twilio, utils), 3 middleware (cors, auth, admin), 6 services (auth, persona, call, payment, admin, scheduler), 10 route modules
- **Critical fix**: Hardcoded `lmapp.run` / `ai-tools-marketplace.io` URLs replaced with `process.env.API_BASE_URL` / `VOICE_WS_URL`
- **WorkOS removed**: Pure JWT + bcrypt auth
- **database-proxy eliminated**: Direct pg pool connection instead

### Deployment Infrastructure
- **`server/deploy.sh`** — Tar/scp/pm2 deploy following existing voice-pipeline patterns. Supports `--setup`, `--sync-only`, `--restart`, `--verify`.
- **`server/build-env.sh`** — Assembles `.env` on VPS from existing service `.env` files. Runs entirely server-side, never exposes secrets locally.
- **`server/set-secrets.sh`** + **`set-secrets.template`** — Safely pushes secrets from a local temp file to VPS via SSH stdin (not in command args or shell history). Shreds local file after.
- **`server/ecosystem.config.cjs`** — PM2 config

### Frontend Updates (Vue 3 SPA)
- Replaced all hardcoded `lmapp.run` and `ai-tools-marketplace.io` URLs with `import.meta.env.VITE_API_URL` / `VITE_VOICE_WS_URL`
- **Login.vue**: Email/password form (replaced WorkOS OAuth button)
- **Register.vue**: Full registration form (name, email, phone, password, confirm)
- **router/index.js**: Fixed `/register` to render Register.vue (was redirecting to `/login` from old WorkOS flow)
- **Deployed to Vercel production** (Netlify migration is Plan 5)

---

## Current Production State

### What's Live
| Component | URL | Status |
|-----------|-----|--------|
| API Server | `https://api.callbackapp.ai` | **Healthy** (DB + Redis OK) |
| Voice Pipeline | `wss://voice.callbackapp.ai/stream` | **Running** (OpenAI gpt-4o-mini for LLM) |
| Frontend | `https://callbackapp.ai` + Vercel CDN | **Deployed** |
| PostgreSQL | localhost on VPS | 18 tables, `cmb_user`, db `call_me_back` |
| Redis | localhost on VPS | New install this session |

### VPS (`144.202.15.249`) PM2 Processes
| Name | Status | Port | Path |
|------|--------|------|------|
| api-server | online | 3000 | `/opt/api-server` |
| voice-pipeline | online | 8080 | `/opt/voice-pipeline` |
| db-proxy | stopped | — | `/root/db-proxy` (DEPRECATED, replaced by direct pg) |
| deepgram-proxy | online | varies | `/root/deepgram-proxy` |
| log-query-service | online | 3001 | `/root/log-query-service` (to be replaced by Grafana in Plan 4) |

### Caddy Routes (on VPS)
- `api.callbackapp.ai` → `localhost:3000` ✅ (NEW this session)
- `voice.ai-tools-marketplace.io` → `localhost:8080` (existing, still in use)
- `db.ai-tools-marketplace.io` → `localhost:3000` (now points at new API, harmless)
- `logs.ai-tools-marketplace.io` → `localhost:3001`

### Environment Secrets
All populated in `/opt/api-server/.env` via `build-env.sh` + `set-secrets.sh`:
- DATABASE_URL (URL-encoded password)
- REDIS_URL
- JWT_SECRET (freshly generated, 64-char random)
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_VERIFY_SERVICE_SID
- CEREBRAS_API_KEY, DEEPGRAM_API_KEY, ELEVENLABS_API_KEY
- ANTHROPIC_API_KEY, OPENAI_API_KEY (new)
- STRIPE_SECRET_KEY (standard, NOT restricted), STRIPE_WEBHOOK_SECRET (new endpoint)
- ADMIN_SECRET_TOKEN
- API_BASE_URL, VOICE_WS_URL, FRONTEND_URL

---

## Known Issues (Active)

### 1. Schema Mismatch: `minutes_balance` column doesn't exist
**Impact**: Code referenced `minutes_balance` in 4 places, but live DB uses `available_credits`.

**Fixed in this session** (need redeploy after new changes):
- `server/src/services/auth-service.ts:57` (INSERT)
- `server/src/services/admin-service.ts:22` (SELECT SUM)
- `server/src/services/payment-service.ts:64` (UPDATE)
- `server/src/services/call-service.ts:160` (SELECT, mapped as alias)
- `server/src/routes/calls.ts:17` — uses `balance.minutes_balance` which is now aliased from `available_credits`

**Lesson**: Plan 1 code was written from Raindrop source code, not from live schema. For Plans 2-5, FIRST dump live schema, THEN write queries.

### 2. Voice Pipeline — NO VOICE OUTPUT ON CALLS (root cause found, fix applied mid-session)
**Symptom**: Calls connect, Twilio rings phone, user answers, but hears silence. ElevenLabs times out after 20s of no text input.

**Root cause**: Voice pipeline (`/opt/voice-pipeline/index.js`) was calling Cerebras API but responses weren't being generated (possibly rate-limited or key issue).

**Fix applied**: Swapped Cerebras → OpenAI in voice pipeline:
- API URL: `api.cerebras.ai/v1/chat/completions` → `api.openai.com/v1/chat/completions` (6 occurrences)
- API key: `env.CEREBRAS_API_KEY` → `env.OPENAI_API_KEY` (6 occurrences)
- Model hardcoded to `gpt-4o-mini` overriding persona's `llm_model = 'llama3.1-8b'`
- Backup saved as `/opt/voice-pipeline/index.js.bak.cerebras`

**Status**: Applied, pm2 restarted. **NOT YET TESTED** with new call after OpenAI switch.

### 3. Admin Auth Mismatch on Frontend
**Symptom**: `AdminLogin.vue` still uses OAuth redirect pattern (`<a :href="loginUrl">`).

**Workaround**: Admin users (in `admin_users` table) can log in via regular `/login` with email/password. Admin middleware checks `admin_users` for their email.

**Fix needed**: Update `AdminLogin.vue` to use regular email/password form, OR redirect `/admin/login` to `/login`.

### 4. User Auth Hardening (URGENT, FLAGGED BY USER)
**User quote**: *"to be clear, we MUST come back around to auth hardening"*

Missing pieces:
- No rate limiting on `/api/auth/login` (brute force attack surface)
- No password reset flow (users locked out if forgotten)
- No email verification on registration
- JWT expiry 30 days with no refresh token rotation (large blast radius if leaked)
- No MFA/2FA

---

## Test Account

- Email: `dave.melshman@gmail.com`
- Password: `Testing123` (set directly in DB via bcrypt hash this session — **user should change after testing**)
- User ID: `user_01KAJKFCJ2DNS5AKP478BS0G4R`
- Phone: `+16196433644` (phone_verified = true)
- Credits: 50
- Admin: Yes (in `admin_users` table)

---

## Live Database Schema (NEW — saved this session)

Full schema dump saved at `server/schema-dump.sql` (1158 lines, gitignored).

**18 tables**: admin_sessions, admin_users, api_call_events, call_cost_events, call_logs, calls, credit_transactions, debug_markers, personas, purchases, scheduled_calls, service_pricing, token_blacklist, unknown_caller_attempts, user_budget_settings, user_credits, user_persona_relationships, users

**2 custom functions**: `get_current_price()`, `update_personas_updated_at()`, `update_relationships_updated_at()`

**Missing from the new server code** (not referenced yet, will need attention in Plans 2-4):
- `credit_transactions` table — needs ledger writes on every call
- `call_cost_events` — real-time cost tracking events (used by voice pipeline)
- `call_logs` — separate from `calls` table, tracks cost per service
- `api_call_events` — cost events per external API call
- `service_pricing` with `get_current_price()` function for dynamic pricing

---

## Next Session Priorities (In Order)

### A. FIRST: Verify Voice Pipeline Works
1. Redeploy API server with schema fixes: `cd server && ./deploy.sh --sync-only && ./deploy.sh --restart`
2. User tests a call with the test account (`dave.melshman@gmail.com`, persona Alex or Sarah)
3. Check PM2 logs on VPS if no voice: `ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 50'`
4. If still failing, investigate — may need to look at how persona context is loaded, how the AI "first message" is triggered, or whether there's an initial greeting issue

### B. AUTH HARDENING (user flagged as MUST-HAVE before customers)
New sub-plan needed. Scope:
1. **Rate limiting** on `/api/auth/login` using Redis sliding window (function already exists in `server/src/redis.ts:checkRateLimit`)
2. **Password reset flow** — needs email provider (Resend is cheapest/simplest, ~$20/mo; or SendGrid)
   - Generate reset token, store in Redis with TTL, email link to user
   - New `/api/auth/forgot` + `/api/auth/reset` endpoints
   - New `ForgotPassword.vue` + `ResetPassword.vue` views
3. **Shorter JWT + refresh tokens** — change access token to 15min, add refresh token (30 days, httpOnly cookie)
4. **Account lockout** — after 5 failed login attempts, lock for 15 min
5. **Fix AdminLogin.vue** to use email/password form

### C. PERSONA UPGRADES (user wants to discuss)
User mentioned wanting to discuss "upgrading these personas" after testing works. This likely ties into:
- Better model routing (per-task, per-persona, per-user) — see Plan 3
- Better memory system with pgvector — see Plan 2
- Richer system prompts with more nuance
- Possibly new personas or persona variants at different quality tiers

### D. PLANS 2-5 (can be done in parallel once A-C stabilize)
- **Plan 2**: Memory system redesign (PostgreSQL + pgvector, semantic recall, mid-call recall)
- **Plan 3**: Multi-model inference layer (Cerebras/Anthropic/OpenAI routing, tiered billing, Opus access)
- **Plan 4**: Observability (Prometheus + Grafana, cost dashboards, alerting)
- **Plan 5**: Frontend migration to Netlify Pro (A/B testing) + UI updates for tiers

User has agent teams available (experimental) — could parallelize Plans 2-5.

### E. BILLING TIER UPDATE
Once Plans 2-5 are done, update credit rates to reflect tier multipliers per design spec:
- Standard (Cerebras): 1.0x
- Enhanced (GPT-4o-mini): 1.2x
- Premium (Opus 4.6): 2.1x

---

## Key Architectural Decisions Made This Session

1. **Hono over Express**: Smaller, faster, Workers-compatible API for easier porting
2. **Single monolith** (one Express server, not microservices): 12 Raindrop services → Express route modules
3. **Direct pg over HTTP bridge**: Eliminated database-proxy entirely
4. **Redis for ephemeral state**: Rate limits, token blacklist, call state (replaces Cloudflare KV)
5. **Drop WorkOS**: JWT + bcrypt only. Trade-off: less secure by default, need auth hardening next session
6. **Keep voice pipeline separate**: Real-time WebSocket audio belongs in its own service
7. **Pricing sourced from web searches** (April 2026 verified): Full cost table in spec doc
8. **Payment script safety**: `set-secrets.sh` uses SSH stdin to avoid secrets in process listings / history
9. **Archive docs before editing**: Pre-migration snapshot tarball in `tech_manual/archive/`

---

## Docs That Need Updating (After Plans Complete)

**Live docs that are now stale or wrong** (user said "you'll cover that later"):
- `documentation/domain/deployment.md` — still references Raindrop, set-all-secrets.sh, etc.
- `documentation/domain/vultr.md` — references db-proxy as active service
- `documentation/domain/raindrop.md` — entire doc is obsolete
- `documentation/domain/auth.md` — WorkOS-centric, no longer accurate
- `documentation/domain/api.md` — endpoint list needs update
- `documentation/domain/database.md` — may need updates for new tables (persona_memories, model_routing)
- `vultr-db-proxy/README.md` — service is deprecated

**New docs needed**:
- Express API server README
- Deploy script usage guide
- Auth hardening runbook
- Memory system architecture (after Plan 2)
- Cost tracking & observability guide (after Plan 4)

---

## Commits This Session (since branch point `a308c4b`)

```
f6a6a31 feat: update frontend URLs to new API server and add email/password auth forms
fdbe9f7 feat: add set-secrets.sh for safe VPS secret management
9859bdc feat: add build-env.sh to assemble .env from existing VPS secrets
9d206b1 feat: add API server deploy script for Vultr VPS
e28b413 chore: gitignore docs/superpowers/plans/
55cffcc feat: add API entry point, .env.example, and PM2 config
aa15418 feat: add admin, analytics, scenarios, user, health routes and scheduler
5a88c58 feat: add auth, persona, call, voice, and payment services with routes
4f53b96 feat: add database pool, Redis client, JWT/Twilio/utils helpers, and auth middleware
422e605 feat: scaffold Express API server with dependencies
a308c4b Branch point: pre-migration snapshot before Raindrop removal
```

Uncommitted changes at end of session (not yet committed):
- `server/src/services/auth-service.ts` — removed `minutes_balance` from INSERT
- `server/src/services/admin-service.ts` — changed `SUM(minutes_balance)` → `SUM(available_credits)`
- `server/src/services/payment-service.ts` — removed `minutes_balance` from UPDATE
- `server/src/services/call-service.ts` — `getUserBalance` returns `available_credits` aliased as `minutes_balance`
- `src/router/index.js` — `/register` route no longer redirects to `/login`
- `server/schema-dump.sql` — new file with live DB schema (gitignored)

**Server-side changes on VPS (no git):**
- `/opt/voice-pipeline/index.js` — Cerebras → OpenAI swap, model forced to `gpt-4o-mini`
- `/opt/voice-pipeline/index.js.bak.cerebras` — backup of original
- `/opt/voice-pipeline/.env` — OPENAI_API_KEY added
- `/etc/caddy/Caddyfile` — api.callbackapp.ai block added
- `/opt/api-server/.env` — full new config

---

## Useful Commands Reference

```bash
# Deploy API changes
cd server && ./deploy.sh --sync-only && ./deploy.sh --restart

# Check API health
curl https://api.callbackapp.ai/health

# View API logs
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs api-server --lines 100'

# View voice pipeline logs
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 logs voice-pipeline --lines 100'

# Query DB
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "sudo -u postgres psql -d call_me_back -c 'SELECT ...'"

# Frontend deploy
npx vite build && vercel --prod

# PM2 status
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 'pm2 status'
```
