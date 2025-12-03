# Session Log: Vultr Upgrade & Raindrop Deploy
**Date:** 2025-12-03 03:11 EST
**Focus:** Infrastructure upgrade, deployment automation, financial audit

---

## Summary

Upgraded Vultr server ($6 → $20/mo), deployed Raindrop services, redeployed voice pipeline, fixed Caddy/nginx conflict, and audited admin dashboard financial calculations.

---

## What Was Done

### 1. Vultr Server Upgrade
- Upgraded `call-me-back-db` from 1 vCPU/2GB ($6/mo) to **2 vCPU/4GB ($20/mo)**
- Created production backup snapshot before upgrade
- Server now has headroom for: PostgreSQL + Voice Pipeline + n8n + automations

### 2. Build Server Snapshot Created
- Created reusable Vultr snapshot with Node.js, Raindrop CLI, TypeScript pre-installed
- Snapshot ID saved to `.env` as `VULTR_BUILD_SNAPSHOT_ID`
- Enables fast ephemeral builds via `deploy-fast.sh`

### 3. Fixed Deploy Scripts
- **Bug fixed:** `deploy-via-vultr.sh` was syncing `src/` contents to wrong location
- Changed rsync to properly sync `src/` → `$VULTR_PATH/src/`
- All 12 Raindrop handlers now build successfully

### 4. Raindrop Services Deployed
- All 23 modules running and converged
- API Gateway: `svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run`

### 5. Voice Pipeline Redeployed
- Synced latest code to `/opt/voice-pipeline/`
- Restarted via pm2
- All services online: voice-pipeline, db-proxy, deepgram-proxy, log-query-service

### 6. Fixed Caddy/Nginx Conflict
- After server upgrade, nginx started instead of Caddy
- nginx was blocking ports 80/443, causing SSL cert errors
- **Fix:** Stopped nginx, disabled it, started Caddy
- SSL certs now regenerating via Let's Encrypt

### 7. Financial Audit of Admin Dashboard
- **CRITICAL BUG FOUND:** `projectedNetProfit` ignores `apiCosts.period`
- Current formula: `revenue - liability` (WRONG)
- Correct formula: `revenue - apiCosts - liability`
- Hardcoded cost estimates ($0.071/min, $0.101/min) are questionable
- Missing: Stripe costs, infrastructure costs tracking

---

## Files Modified

| File | Change |
|------|--------|
| `deploy-via-vultr.sh` | Fixed rsync to sync src/ correctly |
| `.env` | Updated `VULTR_BUILD_SNAPSHOT_ID` |

---

## Key Learnings

### Infrastructure
1. **Vultr server upgrades** may change which services auto-start (nginx vs Caddy)
2. **Always check port conflicts** after server changes: `lsof -i :443`
3. **Ephemeral build servers** are cool but snapshot boot times are slow (~3-5 min)
4. **Permanent server approach** is simpler for frequent deploys during hackathon

### Financial
1. **Admin dashboard profit calculations have bugs** - need fixing before trusting
2. **Stripe fees are 53% of total costs** - bigger than all APIs combined!
3. **Per-minute cost is ~$0.085** (documented) vs $0.086 (code estimate) - close but methodology is wrong

---

## Cost Reference (Verified)

| Service | Rate | Per 5-min | % of API |
|---------|------|-----------|----------|
| Twilio | $0.014/min | $0.070 | 16.5% |
| Deepgram | $0.0059/min | $0.030 | 7.0% |
| Cerebras 8B | $0.10/1M tokens | $0.005 | 1.2% |
| ElevenLabs | $0.15/1K chars | $0.300 | 70.6% |
| Raindrop | $20/mo fixed | $0.020 | 4.7% |
| **API Subtotal** | | **$0.425** | 100% |
| Stripe | 3.4% + $0.30 | $0.475 | - |
| **TOTAL** | | **$0.900** | |

---

## Next Session Priorities

### P0 - MUST DO (Stripe Go-Live)
1. **Switch Stripe to live mode**
   - Get live API keys from Stripe Dashboard
   - Recreate products/prices in live mode (test mode items don't transfer)
   - Update webhook endpoint and get new webhook secret
   - Verify business details in Stripe (required for live payouts)
   - Update `.env` with live keys
   - Redeploy with `./deploy-via-vultr.sh`

2. **Test live payment flow**
   - Make a real $4.99 purchase
   - Verify webhook fires
   - Confirm credits are added to user account

### P1 - Should Do
1. **Fix admin dashboard profit calculations**
   - Fix `projectedNetProfit = revenue - apiCosts - liability`
   - Replace hardcoded cost estimates with actual calculated values
   - Add Stripe fee tracking

2. **Verify cost tracking works**
   - Make a test call
   - Check `api_call_events` table for logged costs
   - Verify Twilio cost estimation for historical data

3. **Test LLM model selection persistence**
   - Select 70B model for a persona
   - Make a call
   - Verify correct model was used

### P2 - Nice to Have
1. Clean up orphaned Vultr instances (if any remain)
2. Document the Vultr upgrade process
3. Consider adding infrastructure costs to admin dashboard

---

## Stripe Go-Live Checklist

```
[ ] Stripe Dashboard: Activate live mode
[ ] Stripe Dashboard: Complete business verification
[ ] Create live products:
    [ ] 25 minutes - $14.99
    [ ] 50 minutes - $24.99
    [ ] 100 minutes - $44.99
[ ] Get live API keys (sk_live_*, pk_live_*)
[ ] Get live webhook secret (whsec_*)
[ ] Update .env:
    [ ] STRIPE_SECRET_KEY
    [ ] STRIPE_PUBLISHABLE_KEY
    [ ] STRIPE_WEBHOOK_SECRET
    [ ] STRIPE_PRICE_* IDs for new products
[ ] Run: raindrop build env set env:STRIPE_SECRET_KEY "sk_live_..."
[ ] Run: ./deploy-via-vultr.sh
[ ] Test: Make real purchase
[ ] Verify: Webhook received, credits added
```

---

## Technical Debt Noted

- Admin dashboard `projectedNetProfit` formula is critically wrong
- Hardcoded cost estimates should use actual historical data
- Stripe fees not tracked in `api_call_events`
- Infrastructure costs (Raindrop, Vultr) not in profitability calculations
- CORS warning: `corsAllowAll` should use specific origins for production

---

## Commands Reference

```bash
# Deploy Raindrop services
./deploy-via-vultr.sh

# Restart voice pipeline
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 restart voice-pipeline"

# Check Caddy status
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "systemctl status caddy"

# Fix if nginx is blocking Caddy
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "systemctl stop nginx && systemctl disable nginx && systemctl start caddy"

# Check pm2 processes
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 list"
```

---

## Bonus: Llama Persona Prompt Research

Conducted deep dive into persona prompting libraries for Llama models.

### Key Resources
- [awesome-llm-role-playing-with-persona](https://github.com/Neph0s/awesome-llm-role-playing-with-persona) - Academic papers (RoleLLM, ChatHaruhi)
- [awesome-llama-prompts](https://github.com/langgptai/awesome-llama-prompts) - Direct Llama templates
- [Roleplay-Hermes-3-Llama-3.1-8B](https://huggingface.co/vicgalle/Roleplay-Hermes-3-Llama-3.1-8B) - DPO-tuned to avoid AI slop
- [Meta Official Guide](https://www.llama.com/docs/how-to-guides/prompting/)

### Key Finding
PromptHub research: Personas don't improve task accuracy, but DO affect voice/style consistency (what we need).

### Best Practices
1. Be specific ("uses contractions, sentences under 15 words") not generic
2. Feed real example responses
3. Add constraints for unknown answers
4. Avoid "assistant slop" phrases

---

**End of Session Log**
