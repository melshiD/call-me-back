# Technical Manual System - Approach Document
**Version:** 1.0
**Created:** 2025-11-21
**Status:** In Progress

---

## Purpose

This document describes the documentation management system being implemented for the Call Me Back project. The goal is to create a living technical manual that keeps AI agents and developers informed, reduces wasted time from outdated information, and provides clear revision tracking.

---

## Inspiration: Navy Technical Manual System

The US Navy maintains ship operation and training manuals using a rigorous revision control system:

1. **List of Effective Pages (LOEP)** - A dated, numbered list at the front of each manual showing which pages have been updated and when
2. **Revision History** - A running log of all changes made to the manual
3. **Change Notices** - Formal documentation of updates that affect the manual

This ensures any engineer can verify they're working with current information.

---

## Our Implementation

### Phase 1: Document Audit (COMPLETE - 2025-11-21)

**Goal:** Catalog all existing documentation, assess accuracy, assign priorities.

**Process Used:**
1. Created `DOC_AUDIT_TRACKER.md` listing all 99 markdown files
2. Reviewed files using **age-based triage** combined with detailed verification:
   - **File timestamps** checked first (using `stat -c "%y %n"`)
   - **Detailed review** for high-priority + old docs (>7 days)
   - **Batch review** for recent docs (<3 days old) and low-priority items
   - **Cross-reference** claims against source code, raindrop.manifest, PCR2.md
3. Logged findings in `AUDIT_FINDINGS_LOG.md` with:
   - Exact quotes from documents
   - Source code evidence with line numbers
   - Specific proposed changes
4. Created `DOC_INDEX.md` as navigable index (LOEP equivalent)

**Key Discovery: Document Age Strongly Predicts Accuracy**
- **0-3 days old:** Generally accurate (verify minor details only)
- **4-7 days old:** Mixed accuracy, cross-check against newer sources
- **8+ days old:** High likelihood of critical errors

**Priority Scale:**
- **5.0** - Critical: Incorrect info derails multiple sessions (e.g., deployment commands, architecture decisions)
- **4.0** - High: Incorrect info causes significant debugging (e.g., API endpoints, database schema)
- **3.0** - Medium: Incorrect info causes confusion but recoverable (e.g., feature status)
- **2.0** - Low: Incorrect info causes minor inconvenience (e.g., historical context)
- **1.0** - Minimal: Rarely referenced, low impact if outdated

**Actual Review Method:**
1. **High-priority documents** (5.0-4.0): Read in detail, compare against source code
2. **Medium-priority + old** (>7 days): Scan for common error patterns (wrong commands, wrong database, etc.)
3. **Recent documents** (<3 days): Quick verification against known-good sources
4. **Session logs**: Batch assessed as temporal records, not evergreen docs
5. **Efficiency:** Reviewed 99 documents in <60% context window using batching strategy

### Phase 2: Index Creation (COMPLETE - 2025-11-21)

**Goal:** Create a central index document that serves as the LOEP.

**Actual Structure Created:**
```
DOC_INDEX.md
├── 🚨 MUST READ EVERY SESSION (P0)
│   ├── PCR2.md
│   ├── CRITICAL_RAINDROP_RULES.md
│   └── SYSTEM_ARCHITECTURE.md
├── 📚 Documentation by Category
│   ├── Deployment & Infrastructure (with status flags)
│   ├── Architecture & System Design
│   ├── Voice Pipeline
│   ├── Database
│   ├── Cost & Pricing
│   ├── Admin Dashboard & Personas
│   ├── AI Services Research
│   ├── MCP & Log Aggregation
│   └── Frontend
├── 📋 Session Logs (temporal - keep recent)
├── 🗂️ Subdirectories (batch assessment)
├── 🔄 Revision History
└── 🎯 Quick Decision Matrix (age-based trust rules)
```

**Status Flags Used:**
- ✅ CURRENT / ACCURATE - Verified recently, safe to use
- ⚠️ VERIFY / OUTDATED - Check against newer sources
- ❌ DEPRECATED - Do not use, contains critical errors
- 🔒 BLOCKED - Feature documented but implementation blocked

### Phase 3: Maintenance Protocol

**Goal:** Establish procedures to keep documentation current.

**End-of-Session Protocol (Every Session):**
1. Check if any files were modified that have documentation implications
2. Update relevant documentation
3. Update DOC_INDEX.md revision history
4. Create NEXT_SESSION_LOG with documentation status

**Weekly Review:**
- Review P5 documents for accuracy
- Verify deployment commands still work
- Check for orphaned documentation

**After Major Changes:**
- Update affected documentation immediately
- Add entry to revision history
- Flag related documents for review

---

## File Organization

```
documentation/
└── tech_manual/
    ├── TECH_MANUAL_APPROACH.md    <- This file
    ├── DOC_INDEX.md               <- Central index (LOEP equivalent)
    ├── DOC_AUDIT_TRACKER.md       <- Audit progress tracker
    └── revision_history/          <- Historical change logs (future)
```

---

## Semantic Tags

To help AI agents quickly find relevant documentation, we'll use tags:

- `[deployment]` - Deployment procedures and commands
- `[voice-pipeline]` - Voice pipeline architecture and debugging
- `[database]` - Schema, migrations, queries
- `[auth]` - Authentication and authorization
- `[cost-tracking]` - Pricing, costs, analytics
- `[raindrop]` - Raindrop framework specifics
- `[vultr]` - Vultr VPS operations
- `[frontend]` - Vue.js frontend
- `[api]` - API endpoints and contracts
- `[debugging]` - Debugging guides and session logs

---

## Integration with CLAUDE.md

The project's CLAUDE.md file should reference this tech_manual system:

```markdown
## Documentation System
Before starting work, consult:
1. documentation/tech_manual/DOC_INDEX.md - Central documentation index
2. PCR2.md - Current project context
3. CRITICAL_RAINDROP_RULES.md - Deployment rules
```

---

## Session Continuity

The `NEXT_SESSION_LOG_<timestamp>.md` system remains critical:
*(<timestamp> to be date AND time for micro-grainular edit tracking)*

1. **Created:** At end of each significant session
2. **Contains:**
   - Work completed this session
   - Documentation created or updated
   - Docs that may need updates
   - Priorities for next session
3. **Location:** Project root (current behavior)
4. **Reference:** DOC_INDEX.md links to recent session logs

---

## Success Criteria

1. **Any engineer (human or AI) can find accurate information within 2 document reads** ✅ ACHIEVED
   - DOC_INDEX.md provides single-read navigation
   - PCR2.md provides comprehensive second read
2. **No debugging sessions caused by outdated documentation** ⚠️ IN PROGRESS
   - 47 findings logged, awaiting approval and implementation
   - Deprecation notices needed for 3 critical docs
3. **Clear audit trail of what changed and when** ✅ ACHIEVED
   - File timestamps captured for all docs
   - AUDIT_FINDINGS_LOG.md provides evidence trail
   - Revision history started in DOC_INDEX.md
4. **Documentation updates are part of the definition of "done"** 🔄 PROCESS DEFINED
   - End-of-session protocol documented
   - Maintenance schedule established

---

## Next Steps

1. ~~Complete DOC_AUDIT_TRACKER.md with full file inventory~~ ✅ DONE
2. ~~Begin systematic review of high-priority documents~~ ✅ DONE (47 findings logged)
3. ~~Create DOC_INDEX.md after audit identifies critical documents~~ ✅ DONE
4. **Review and approve findings** - User to review AUDIT_FINDINGS_LOG.md batches
5. **Implement approved changes** - Apply fixes to documents
6. **Integrate into CLAUDE.md** - Add reference to tech_manual system
7. **Archive outdated docs** - Move deprecated docs to archive/ folder with timestamps

---

**End of Approach Document**
