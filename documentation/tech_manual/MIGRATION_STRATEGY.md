# Documentation Migration Strategy
**Version:** 1.0
**Created:** 2025-11-21
**Status:** PENDING APPROVAL

---

## Goal

Consolidate 99+ scattered markdown files into a maintainable domain-based documentation structure while preserving historical context and reducing maintenance burden.

---

## Proposed Structure

```
documentation/
├── tech_manual/                           # Documentation system meta
│   ├── DOC_INDEX.md
│   ├── DOC_AUDIT_TRACKER.md
│   ├── AUDIT_FINDINGS_LOG.md
│   ├── TECH_MANUAL_APPROACH.md
│   └── MIGRATION_STRATEGY.md              # This file
│
├── domain/                                # Domain-specific docs (NEW)
│   ├── deployment.md                      # [deployment] tag
│   ├── voice-pipeline.md                  # [voice-pipeline] tag
│   ├── database.md                        # [database] tag
│   ├── cost-tracking.md                   # [cost-tracking] tag
│   ├── api.md                             # [api] tag
│   ├── frontend.md                        # [frontend] tag
│   ├── auth.md                            # [auth] tag
│   ├── raindrop.md                        # [raindrop] tag
│   ├── vultr.md                           # [vultr] tag
│   └── debugging.md                       # [debugging] tag
│
└── session_logs/                          # Temporal logs (MOVED)
    ├── 2025-11-21_07-45.md
    ├── 2025-11-21_PERSONA_DESIGNER.md
    └── ... (all NEXT_SESSION_LOG_* files)

Root level (PRESERVED):
├── PCR2.md                                # Master context (links to domain docs)
├── SYSTEM_ARCHITECTURE.md                 # Infrastructure overview
├── CRITICAL_RAINDROP_RULES.md             # Must-read operations
└── archive/                               # Old docs (MOVED)
    ├── 2025-11-21/                        # Timestamped by migration date
    │   ├── COMPLETE_DEPLOYMENT_GUIDE.md
    │   ├── VULTR_SETUP.md
    │   ├── HOW_THIS_APP_WORKS.md
    │   └── docs/                          # Entire old docs/ folder
    └── README_ARCHIVE.md                  # Index of what's archived and why
```

---

## Domain Document Mapping

### 1. deployment.md
**Consolidates:**
- ✅ DEPLOYMENT_COMMANDS_EXPLAINED.md (current, excellent)
- ⚠️ CRITICAL_RAINDROP_RULES.md (keep separate but reference)
- ❌ COMPLETE_DEPLOYMENT_GUIDE.md (deprecated, archive)
- ❌ docs/DEPLOYMENT_GUIDE.md (deprecated, archive)
- ⚠️ DEPLOYMENT_SUCCESS.md (historical context, cherry-pick)
- ⚠️ RAINDROP_DEPLOYMENT_BREAKTHROUGH.md (historical, cherry-pick)
- ⚠️ RAINDROP_DEPLOYMENT_ISSUES.md (historical, cherry-pick)
- ⚠️ DASHBOARD_DEPLOYMENT_CHECKLIST.md (evaluate for inclusion)

**Content Structure:**
```markdown
# Deployment Guide

## Quick Reference
- Standard deployment: `raindrop build deploy`
- With secrets: `./set-all-secrets.sh && raindrop build deploy`
- Emergency rollback: [commands]

## Deployment Process (Step-by-Step)
[From DEPLOYMENT_COMMANDS_EXPLAINED.md - already excellent]

## Common Mistakes
[From CRITICAL_RAINDROP_RULES.md - cross-reference]

## Frontend Deployment
[Vercel-specific procedures]

## Troubleshooting
[From various debugging docs]

## Historical Context
[Lessons learned from RAINDROP_DEPLOYMENT_BREAKTHROUGH.md]
```

### 2. voice-pipeline.md
**Consolidates:**
- ✅ VOICE_PIPELINE_NEXT_STEPS.md (1 day old)
- ✅ VOICE_PIPELINE_DEBUG_FINDINGS.md (4 days old)
- ✅ VOICE_PIPELINE_DEBUGGING_AND_TASKS.md (4 days old)
- ✅ VOICE_PIPELINE_MIGRATION_DECISION.md (4 days old)
- ✅ WEBSOCKET_DEBUGGING_PROCEDURE.md (4 days old)
- ✅ CALL_FLOW_DEBUGGING.md (4 days old)
- ⚠️ SILERO_VAD_IMPLEMENTATION_STATUS.md (feature status)
- ⚠️ SILERO_VAD_RESEARCH_ANALYSIS.md (research)
- ⚠️ ELEVENLABS_CONSIDERATIONS_2025-11-20.md (research)
- ❌ docs/voice-pipeline-*.md (9 days old, deprecated)

**Content Structure:**
```markdown
# Voice Pipeline

## Architecture
[Why Vultr, WebSocket flow, component diagram]

## Services
- Twilio Media Streams
- Deepgram STT
- Cerebras LLM
- ElevenLabs TTS
- Silero VAD (status: researching)

## Debugging
[Common issues, WebSocket troubleshooting, call flow]

## Performance
[Latency targets, optimization strategies]

## Research & Future Work
[VAD implementation, ElevenLabs alternatives]
```

### 3. database.md
**Consolidates:**
- ⚠️ FINAL_DATABASE_STRATEGY.md (6 days old)
- ⚠️ DATABASE_MIGRATION_LESSONS.md (7 days old)
- ⚠️ DATABASE_REQUIREMENTS.md (6 days old)
- ⚠️ RAINDROP_DATABASE_ANALYSIS.md (old)

**Content Structure:**
```markdown
# Database

## Architecture Decision
[Why PostgreSQL on Vultr, why NOT SmartSQL]

## Schema
[Tables, relationships, indexes]

## Migrations
[How to run, where they live, lessons learned]

## Access Patterns
[Via db-proxy service, connection details]

## Common Queries
[Frequently used queries with examples]
```

### 4. vultr.md
**Consolidates:**
- ⚠️ VULTR_SETUP.md (7 days old, has errors)
- ✅ TROUBLESHOOTING_VULTR_CONNECTIVITY.md (1 day old)
- ✅ SYSTEM_ARCHITECTURE.md sections (reference, not duplicate)
- ⚠️ WHERE_TO_BACKUP_VULTR_SERVERS_INDEX_FILES.md (2 days old)

**Content Structure:**
```markdown
# Vultr VPS Operations

## Server Details
- IP: 144.202.15.249
- Services: voice-pipeline, db-proxy, log-query-service
- Reverse Proxy: Caddy (NOT Cloudflare Tunnel)

## PM2 Process Management
[From SYSTEM_ARCHITECTURE.md]

## Deployment to Vultr
[SSH commands, service restarts, logs]

## Caddy Configuration
[Reverse proxy setup, SSL, domains]

## Troubleshooting
[Connectivity, service health checks]
```

### 5. cost-tracking.md
**Consolidates:**
- ✅ COST_OBSERVABILITY_PLAN.md (2 days old)
- ✅ DYNAMIC_PRICING_STRATEGY.md (3 days old)
- ⚠️ API_COSTS_AND_PROFITABILITY_2025.md (13 days old)
- ⚠️ documentation/COST_TRACKING_ARCHITECTURE.md (old)
- ⚠️ documentation/HARDCODED_COST_VALUES.md (old)

**Content Structure:**
```markdown
# Cost Tracking & Pricing

## Current Costs (2025 Verified)
[From PCR2.md lines 978-1006]

## Pricing Strategy
[Current tiers, planned tiers]

## Cost Tracking Implementation
[Log query service, collectors, database tables]

## Profitability Analysis
[Break-even, margins, scenarios]
```

### 6. api.md
**Consolidates:**
- ⚠️ documentation/API_SPECIFICATION.md (15 days old)
- Code inspection: src/api-gateway/index.ts
- Store files: src/stores/*.js

**Content Structure:**
```markdown
# API Reference

## Endpoints by Service
[api-gateway routes, auth-manager, persona-manager, etc.]

## Authentication
[JWT flow, token validation]

## Request/Response Formats
[Standard patterns, error codes]

## Rate Limiting
[Current limits, bypass for testing]
```

### 7. frontend.md
**Consolidates:**
- ⚠️ README.md (14 days old, has errors)
- ⚠️ documentation/FRONTEND_WITHOUT_ENV.md (old)
- ⚠️ design/*.md files (design guidelines)

**Content Structure:**
```markdown
# Frontend (Vue.js)

## Architecture
[Vue 3, Vite, Pinia stores, routing]

## Environment
[VITE_API_URL, deployment to Vercel]

## Development
[npm run dev, build process]

## Stores
[auth.js, calls.js, personas.js, user.js patterns]

## Design System
[Tailwind, component patterns]
```

### 8. auth.md
**Consolidates:**
- ⚠️ WORKOS_INTEGRATION_PLAN.md (old)
- ⚠️ OAUTH_SESSION_LOG.md (session log)
- ⚠️ OAUTH_MCP_SESSION_COMPLETE.md (session log)
- Code: src/auth-manager/

**Content Structure:**
```markdown
# Authentication & Authorization

## Current Implementation
[JWT tokens, bcrypt, session handling]

## WorkOS Integration
[Status, plan, OAuth flow]

## Admin Authentication
[ADMIN_SECRET_TOKEN, dashboard access]

## Security
[Token expiry, refresh, blacklist]
```

### 9. raindrop.md
**Consolidates:**
- ⚠️ RAINDROP.md (7 days old)
- ⚠️ RAINDROP_PRD.md (15 days old)
- ✅ CRITICAL_RAINDROP_RULES.md (reference)
- raindrop.manifest

**Content Structure:**
```markdown
# Raindrop Platform Guide

## Services Architecture
[10 services + 1 MCP service]

## Resources
[SmartMemory, SmartBuckets, SmartSQL (unused), KV caches]

## Deployment Commands
[Reference CRITICAL_RAINDROP_RULES.md]

## Environment Variables
[How to set, env: prefix, security]

## Limitations
[Why multi-cloud: WebSocket, SQL complexity]
```

### 10. debugging.md
**Consolidates:**
- ✅ WEBSOCKET_DEBUGGING_PROCEDURE.md (4 days old)
- ✅ CALL_FLOW_DEBUGGING.md (4 days old)
- ✅ TROUBLESHOOTING_VULTR_CONNECTIVITY.md (1 day old)
- Various *_DEBUG_*.md files

**Content Structure:**
```markdown
# Debugging Guide

## By Symptom
- Call doesn't connect: [checklist]
- Audio issues: [checklist]
- Database errors: [checklist]
- Deployment failures: [checklist]

## Tools & Commands
[Logs, health checks, curl tests]

## Common Patterns
[From session logs, recurring issues]
```

---

## Migration Process

### Phase 1: Setup (15 minutes)
1. Create folder structure:
   ```bash
   mkdir -p documentation/domain
   mkdir -p documentation/session_logs
   mkdir -p archive/2025-11-21
   ```

2. Move session logs:
   ```bash
   mv NEXT_SESSION_LOG_*.md documentation/session_logs/
   mv *SESSION*LOG*.md documentation/session_logs/
   ```

### Phase 2: Create Domain Docs (2-3 hours, one at a time)

**For each domain doc:**

1. **Identify source files** (see mapping above)
2. **Read current docs** (focusing on recent/accurate ones)
3. **Extract unique content** (skip duplicates)
4. **Write consolidated doc** with structure:
   ```markdown
   # Domain Name
   **Last Updated:** YYYY-MM-DD
   **Status:** Living Document
   **Tags:** [tag-name]

   ---

   ## Quick Reference
   [Most common commands/info]

   ## [Main sections...]

   ---

   **Sources:**
   - Consolidated from: [list of source files]
   - See also: [related domain docs]
   ```

5. **Add deprecation notices** to source files:
   ```markdown
   # ⚠️ MIGRATED TO documentation/domain/[name].md

   This document has been consolidated into the domain documentation system.

   **New location:** documentation/domain/[name].md
   **Migration date:** 2025-11-21
   **This file:** Moved to archive/2025-11-21/
   ```

6. **Move to archive**:
   ```bash
   mv SOURCE_FILE.md archive/2025-11-21/
   ```

### Phase 3: Update Navigation (30 minutes)

1. **Update DOC_INDEX.md** to point to domain docs
2. **Update PCR2.md** to reference domain docs for details
3. **Update CRITICAL_RAINDROP_RULES.md** if needed

### Phase 4: Archive Cleanup (30 minutes)

1. Create `archive/2025-11-21/README_ARCHIVE.md`:
   ```markdown
   # Archived Documentation - 2025-11-21 Migration

   These documents were consolidated into documentation/domain/ structure.

   ## Why Archived
   - Outdated information (see AUDIT_FINDINGS_LOG.md)
   - Duplicate content across multiple files
   - Superseded by domain docs

   ## What Was Kept
   [List unique historical context that was preserved]

   ## Migration Map
   | Old File | New Location |
   |----------|--------------|
   | COMPLETE_DEPLOYMENT_GUIDE.md | documentation/domain/deployment.md |
   | ... | ... |
   ```

---

## Priority Order for Migration

### High Priority (Do First)
1. **deployment.md** - Most critical for operations
2. **vultr.md** - Required for deployments
3. **voice-pipeline.md** - Core functionality
4. **debugging.md** - Needed when things break

### Medium Priority (Do Second)
5. **database.md** - Reference for schema/queries
6. **raindrop.md** - Platform-specific info
7. **cost-tracking.md** - Business logic

### Lower Priority (Do Last)
8. **api.md** - Mostly in code comments
9. **frontend.md** - Less frequently updated
10. **auth.md** - Stable, less changes

---

## Rollback Plan

If migration causes issues:

1. All source files preserved in `archive/2025-11-21/`
2. Simple restore: `cp archive/2025-11-21/*.md .`
3. Git history preserves pre-migration state

---

## Success Criteria

✅ **All domain docs created** (10 files)
✅ **Session logs moved** (no logs cluttering root)
✅ **Old docs archived** (with deprecation notices)
✅ **DOC_INDEX.md updated** (points to new structure)
✅ **PCR2.md updated** (references domain docs)
✅ **No information lost** (everything either migrated or archived with reason)

---

## Estimated Time

- **Phase 1 (Setup):** 15 minutes
- **Phase 2 (Domain docs):** 2-3 hours (15-20 min per doc × 10 docs)
- **Phase 3 (Navigation):** 30 minutes
- **Phase 4 (Archive):** 30 minutes

**Total:** ~4 hours

Can be done incrementally (1-2 domain docs per session).

---

## Questions for User Review

1. **Folder names OK?** `documentation/domain/` vs `documentation/domains/` vs other?
2. **Domain doc names OK?** `deployment.md` vs `[deployment].md` vs other?
3. **Session logs location OK?** `documentation/session_logs/` vs `session_logs/` (root)?
4. **Archive location OK?** `archive/2025-11-21/` vs `documentation/archive/` vs other?
5. **Migration order OK?** Start with deployment.md, vultr.md, voice-pipeline.md?
6. **Do ALL 10 domains?** Or start with subset (top 5)?

---

**Awaiting approval to proceed...**
