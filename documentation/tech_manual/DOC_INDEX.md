# Documentation Index (LOEP - List of Effective Pages)
**Version:** 1.0
**Last Updated:** 2025-11-21
**Purpose:** Central index of all project documentation with audit status

---

## 🚨 MUST READ EVERY SESSION

These documents are critical and should be consulted at the start of every work session:

| Document | Purpose | Last Audited | Status |
|----------|---------|--------------|--------|
| **PCR2.md** | Master project context, architecture, current state | 2025-11-21 | ✅ AUTHORITATIVE (2 days old) |
| **CRITICAL_RAINDROP_RULES.md** | Deployment commands, common mistakes | 2025-11-21 | ⚠️ GOOD (6 findings logged) |
| **SYSTEM_ARCHITECTURE.md** | Infrastructure hierarchy, PM2 processes | 2025-11-21 | ✅ ACCURATE (2 days old) |

---

## 📖 DOMAIN DOCUMENTATION (NEW - Consolidated Reference)

**Location:** `documentation/domain/`
**Created:** 2025-11-21
**Status:** ✅ AUTHORITATIVE - Consolidated from 99 scattered docs

Comprehensive domain-specific documentation replacing scattered markdown files:

| Domain Doc | Purpose | Source Count |
|------------|---------|--------------|
| **deployment.md** | Raindrop, Vercel, Vultr deployment procedures | 4+ docs |
| **vultr.md** | Vultr VPS operations (PM2, Caddy, PostgreSQL) | 4+ docs |
| **voice-pipeline.md** | Complete voice pipeline (5 AI services, debugging) | 8+ docs |
| **debugging.md** | Troubleshooting organized BY SYMPTOM | 7+ docs |
| **database.md** | PostgreSQL architecture, migrations, queries | 3+ docs |
| **raindrop.md** | 10 services + 1 MCP, resources, architecture | 3+ docs |
| **cost-tracking.md** | API costs, profitability, tracking implementation | 3+ docs |
| **api.md** | All API endpoints, request/response formats | 2+ docs |
| **frontend.md** | Vue 3, Pinia, Tailwind CSS, component architecture | 2+ docs |
| **auth.md** | JWT + WorkOS OAuth, admin auth, security | 3+ docs |

**Usage:** For detailed information on any topic, reference the appropriate domain doc instead of scattered files.

---

## 📚 Documentation by Category

### Deployment & Infrastructure (P0 - Critical)

| Document | Status | Notes |
|----------|--------|-------|
| DEPLOYMENT_COMMANDS_EXPLAINED.md | ✅ EXCELLENT | <16hrs old, only 1 minor issue |
| COMPLETE_DEPLOYMENT_GUIDE.md | ❌ DEPRECATED | 9 critical errors, use PCR2 instead |
| VULTR_SETUP.md | ⚠️ OUTDATED | Documents Cloudflare Tunnel (now Caddy) |
| docs/DEPLOYMENT_GUIDE.md | ❌ DEPRECATED | Wrong commands, wrong database |

### Architecture & System Design (P1 - Important)

| Document | Status | Notes |
|----------|--------|-------|
| SYSTEM_ARCHITECTURE.md | ✅ ACCURATE | 2 days old, only service count off by 3 |
| HOW_THIS_APP_WORKS.md | ❌ OUTDATED | Claims SmartSQL (actually PostgreSQL) |
| documentation/HOW_THIS_APP_WORKS.md | ❌ OUTDATED | 13 days old, multiple inaccuracies |

### Voice Pipeline (P1 - Important)

| Document | Status | Notes |
|----------|--------|-------|
| VOICE_PIPELINE_NEXT_STEPS.md | ✅ CURRENT | 1 day old |
| VOICE_PIPELINE_DEBUG_FINDINGS.md | ✅ CURRENT | 4 days old |
| VOICE_PIPELINE_DEBUGGING_AND_TASKS.md | ✅ CURRENT | 4 days old |
| VOICE_PIPELINE_MIGRATION_DECISION.md | ✅ CURRENT | 4 days old |
| WEBSOCKET_DEBUGGING_PROCEDURE.md | ✅ CURRENT | 4 days old |
| CALL_FLOW_DEBUGGING.md | ✅ CURRENT | 4 days old |
| docs/voice-pipeline-*.md | ⚠️ VERIFY | 9 days old, likely has wrong commands |

### Database (P1 - Important)

| Document | Status | Notes |
|----------|--------|-------|
| FINAL_DATABASE_STRATEGY.md | ⚠️ VERIFY | 6 days old, should document PostgreSQL decision |
| DATABASE_MIGRATION_LESSONS.md | ⚠️ VERIFY | 7 days old |
| DATABASE_REQUIREMENTS.md | ⚠️ VERIFY | 6 days old |

### Cost & Pricing (P2 - Reference)

| Document | Status | Notes |
|----------|--------|-------|
| COST_OBSERVABILITY_PLAN.md | ✅ CURRENT | 2 days old |
| DYNAMIC_PRICING_STRATEGY.md | ✅ CURRENT | 3 days old |
| API_COSTS_AND_PROFITABILITY_2025.md | ⚠️ VERIFY | 13 days old, cross-check with PCR2 |

### Admin Dashboard & Personas (P2 - Reference)

| Document | Status | Notes |
|----------|--------|-------|
| ADMIN_DASHBOARD_COMPLETE.md | ✅ CURRENT | 1 day old |
| ADMIN_DASHBOARD_IMPLEMENTATION.md | ✅ CURRENT | 2 days old |
| ADMIN_DASHBOARD_GUIDE.md | ✅ CURRENT | 2 days old |
| PERSONA_DEBUGGER_EXTENSION_PLAN.md | ✅ CURRENT | 1 day old |

### AI Services Research (P2 - Reference)

| Document | Status | Notes |
|----------|--------|-------|
| SILERO_VAD_IMPLEMENTATION_STATUS.md | ✅ CURRENT | 1 day old |
| SILERO_VAD_RESEARCH_ANALYSIS.md | ✅ CURRENT | 1 day old |
| ELEVENLABS_CONSIDERATIONS_2025-11-20.md | ✅ CURRENT | 1 day old |

### MCP & Log Aggregation (P2 - Reference)

| Document | Status | Notes |
|----------|--------|-------|
| LOG_AND_COST_AGGREGATION_SERVICE_PLAN.md | ✅ CURRENT | 2 days old |
| MCP_TECHNICAL_ANALYSIS_2025-11-19.md | ✅ CURRENT | 2 days old |
| MCP_DEBUGGING_SESSION_2025-11-19.md | ⚠️ NOTE | Shows "BLOCKED" status |
| LOG_AGGREGATION_MCP_DESIGN.md | ⚠️ NOTE | May be blocked feature |
| LOG_ANALYSIS_GUIDE.md | ✅ CURRENT | 3 days old |

### Frontend (P2 - Reference)

| Document | Status | Notes |
|----------|--------|-------|
| README.md | ⚠️ OUTDATED | 14 days old, claims mock data (now uses real API) |

---

## 📋 Session Logs (Temporal - Keep Recent)

**Recent (< 7 days):**
- NEXT_SESSION_LOG_2025-11-21_*.md ✅
- NEXT_SESSION_LOG_2025-11-20_*.md ✅
- ADMIN_DASHBOARD_SESSION_LOG_2025-11-19.md ✅
- PERSONA_DEBUGGER_SESSION_LOG.md ✅

**Older (> 7 days):** Consider archiving

---

## 🗂️ Subdirectories

### /documentation/
**Status:** 13-15 days old, likely outdated
**Files:** API_SPECIFICATION.md, COST_TRACKING_ARCHITECTURE.md, etc.
**Recommendation:** Verify against PCR2.md before trusting

### /docs/
**Status:** 9 days old, contains wrong commands
**Recommendation:** Deprecated - use root-level docs instead

### /design/
**Status:** Design guidelines, less time-sensitive
**Files:** Tailwind examples, UI generation framework

### /after_midterm/
**Status:** Post-midterm work, likely outdated

---

## 🔄 Revision History

| Date | Change | Updated By |
|------|--------|------------|
| 2025-11-21 | Initial DOC_INDEX created after comprehensive audit | Claude |
| 2025-11-21 | Identified 47+ findings across 99 documents | Claude |

---

## 🎯 Quick Decision Matrix

**When choosing which document to trust:**

1. **Age matters:** Prefer docs <3 days old
2. **Conflicts:** PCR2.md is authoritative source
3. **Commands:** Use CRITICAL_RAINDROP_RULES.md + DEPLOYMENT_COMMANDS_EXPLAINED.md
4. **Architecture:** Use SYSTEM_ARCHITECTURE.md
5. **Deprecated:** Ignore COMPLETE_DEPLOYMENT_GUIDE.md, docs/DEPLOYMENT_GUIDE.md, old HOW_THIS_APP_WORKS.md

**Red flags (document likely outdated):**
- Claims "SmartSQL" database (actually PostgreSQL on Vultr)
- Uses `raindrop deploy` (should be `raindrop build deploy`)
- Uses `raindrop db` commands (don't exist)
- Mentions "Cloudflare Tunnel" for Vultr (now uses Caddy)
- Claims 7 microservices (actually 10 + 1 MCP)
- Says "mock data" in frontend (now uses real API)
- Shows different API Gateway version ID than PCR2

---

## 📞 For Next Session

**Before starting work:**
1. Read PCR2.md (lines 1-299 for overview)
2. Check CRITICAL_RAINDROP_RULES.md if deploying
3. Consult this DOC_INDEX.md for document reliability

**When documentation conflicts:**
- Trust: PCR2.md > SYSTEM_ARCHITECTURE.md > docs <3 days old > docs >7 days old
- Verify: Any doc >7 days old against PCR2.md before following its advice

---

**End of Documentation Index**
