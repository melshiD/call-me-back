# Session Plan: Log Aggregation MCP Implementation

**Date:** 2025-11-18
**Status:** Ready to Start
**Priority:** P0 (Highest immediate value)

---

## Context & Motivation

### What Just Happened:
1. Voice calls were failing silently (no audio)
2. Spent 30+ minutes and 200+ lines of logs debugging
3. **Root cause:** ElevenLabs quota exceeded (2 credits left, need 50 per request)
4. Error message was buried in logs: `"quota_exceeded"`

### The Problem This Solves:
- **Manual log fetching:** Currently requires 5+ commands across multiple services
- **Context waste:** Each debugging session burns 2000+ tokens on log dumps
- **No visibility:** Can't see API quota/error status at a glance
- **Reactive debugging:** Only find problems after they break things

### Why Now:
We literally just experienced the exact pain point this MCP solves. If we had implemented this earlier, we would have immediately seen:
```
mcp.search-logs("error OR quota")
→ "ElevenLabs: quota_exceeded - 2/10000 credits remaining"
```

---

## Session Goal

**Primary Objective:**
Implement Phase 1 of Log Aggregation MCP - basic log search across all services.

**Success Criteria:**
1. ✅ MCP server responds to `search-logs` tool
2. ✅ Can fetch logs from Raindrop + Vultr (voice-pipeline, db-proxy)
3. ✅ Returns relevant logs (not 500+ line dumps)
4. ✅ Saves 80%+ context tokens vs manual log fetching
5. ✅ Search returns results in <2 seconds

**Out of Scope (for this session):**
- Automated log collection (Phase 2)
- Cost tracking integration (Phase 3)
- Real-time alerts (Phase 4)

---

## Current Project Status

### What's Working ✅
- Voice pipeline stable (timeout fixes deployed)
- Database on Vultr PostgreSQL
- Authentication working (JWT-based)
- Personas loading correctly
- Frontend deployed to Vercel
- Backend deployed to Raindrop

### What's Blocked ⚠️
- **Voice calls:** ElevenLabs quota exceeded (need credits to test)
- **Audio generation:** 2/10,000 characters remaining

### What's Not Implemented ❌
- WorkOS authentication (hackathon requirement)
- SmartMemory integration
- Scheduled calls cron job
- Cost tracking
- **Log aggregation** ← This session's focus

---

## Architecture Overview

### Log Sources (What we're aggregating):
1. **Raindrop Services** (Cloudflare Workers)
   - Command: `raindrop logs tail -n 100 --application call-me-back`
   - Services: api-gateway, auth-manager, persona-manager, call-orchestrator

2. **Vultr Voice Pipeline** (Node.js/PM2)
   - Command: `ssh root@144.202.15.249 'pm2 logs voice-pipeline --lines 100 --nostream'`
   - Critical for debugging voice issues

3. **Vultr DB Proxy** (Node.js/PM2)
   - Command: `ssh root@144.202.15.249 'pm2 logs db-proxy --lines 100 --nostream'`
   - Database connection issues

4. **Future:** Twilio webhooks, Vercel frontend logs

### MCP Server Design:

```
┌─────────────────────────────────────────┐
│  MCP SERVER (log-aggregator service)   │
│  ┌───────────────────────────────────┐ │
│  │ MCP Tools:                        │ │
│  │ - search-logs(query, service)     │ │
│  │ - get-call-logs(call_id)          │ │
│  │ - tail-logs(services, lines)      │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Log Collectors:                   │ │
│  │ - RaindropLogCollector            │ │
│  │ - VultrLogCollector               │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Storage (SmartBucket):            │ │
│  │ - Semantic indexing               │ │
│  │ - Quick search                    │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Implementation Plan (Phase 1)

### Step 1: Create Service Structure (30 min)
```bash
mkdir -p src/log-aggregator
touch src/log-aggregator/index.ts
```

**Files to create:**
- `src/log-aggregator/index.ts` - Main MCP service
- `src/log-aggregator/collectors/raindrop.ts` - Raindrop log fetcher
- `src/log-aggregator/collectors/vultr.ts` - Vultr log fetcher
- `src/log-aggregator/types.ts` - TypeScript interfaces

### Step 2: Add MCP Service to Manifest (15 min)
```hcl
# raindrop.manifest
mcp_service "log-aggregator" {
  public = false  # Protected - only for our use

  tool "search-logs" {
    description = "Search across all Call Me Back logs from all services"
  }

  tool "get-call-logs" {
    description = "Get all logs for a specific call ID"
  }

  tool "tail-logs" {
    description = "Get most recent logs from specified services"
  }
}

smartbucket "call-me-back-logs" {
  embedding_model = "text-embedding-ada-002"
}
```

### Step 3: Implement Log Collectors (1 hour)

**Challenge:** Cloudflare Workers can't SSH to Vultr or run shell commands.

**Solution:** Add log fetch endpoint to db-proxy (which runs on Vultr):

```javascript
// On Vultr db-proxy: Add endpoint to fetch PM2 logs
app.post('/logs/fetch', async (req, res) => {
  const { service, lines } = req.body;
  const { exec } = require('child_process');

  exec(`pm2 logs ${service} --lines ${lines} --nostream`, (error, stdout) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ logs: stdout });
  });
});
```

**Then from Raindrop:**
```typescript
// src/log-aggregator/collectors/vultr.ts
async fetchVultrLogs(service: string, lines: number) {
  const response = await fetch('https://db.ai-tools-marketplace.io/logs/fetch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.env.VULTR_DB_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ service, lines })
  });

  const data = await response.json();
  return this.parseVultrLogs(data.logs, service);
}
```

### Step 4: Implement SmartBucket Storage (30 min)
```typescript
// src/log-aggregator/storage.ts
export class LogStorage {
  private bucket: SmartBucket;

  async storeLogs(logs: LogEntry[], service: string) {
    const timestamp = new Date().toISOString();
    const key = `logs/${service}/${timestamp}.json`;

    // SmartBucket automatically indexes for semantic search
    await this.bucket.put(key, JSON.stringify(logs));
  }

  async searchLogs(query: string, filters: LogFilters): Promise<LogEntry[]> {
    const results = await this.bucket.search({
      input: query,
      filters: { service: filters.service },
      limit: filters.limit || 50
    });

    return results.map(r => JSON.parse(r.content));
  }
}
```

### Step 5: Implement MCP Tools (45 min)
```typescript
// src/log-aggregator/index.ts
export class LogAggregatorMCP extends McpService {

  async searchLogs(params: SearchLogsParams): Promise<LogSearchResult> {
    // Fetch fresh logs from all services
    const raindropLogs = await this.collectors.raindrop.fetchLogs(100);
    const voiceLogs = await this.collectors.vultr.fetchVoicePipelineLogs(100);
    const dbLogs = await this.collectors.vultr.fetchDbProxyLogs(100);

    const allLogs = [...raindropLogs, ...voiceLogs, ...dbLogs];

    // Store in SmartBucket
    await this.storage.storeLogs(allLogs, 'all');

    // Search
    const results = await this.storage.searchLogs(params.query, {
      service: params.service,
      limit: params.limit || 20
    });

    return {
      total: results.length,
      query: params.query,
      logs: results
    };
  }

  async getCallLogs(params: GetCallLogsParams): Promise<CallLogsResult> {
    // Search for call ID across all logs
    const results = await this.searchLogs({
      query: `call_id:${params.call_id} OR callId:${params.call_id}`,
      limit: 1000
    });

    // Sort by timestamp
    results.logs.sort((a, b) => a.timestamp - b.timestamp);

    return {
      call_id: params.call_id,
      total_logs: results.logs.length,
      logs: results.logs,
      timeline: this.buildTimeline(results.logs)
    };
  }

  async tailLogs(params: TailLogsParams): Promise<TailLogsResult> {
    const results: Record<string, LogEntry[]> = {};

    for (const service of params.services) {
      switch(service) {
        case 'raindrop':
          results[service] = await this.collectors.raindrop.fetchLogs(params.lines);
          break;
        case 'voice-pipeline':
          results[service] = await this.collectors.vultr.fetchVoicePipelineLogs(params.lines);
          break;
        case 'db-proxy':
          results[service] = await this.collectors.vultr.fetchDbProxyLogs(params.lines);
          break;
      }
    }

    return {
      services: params.services,
      logs_by_service: results
    };
  }
}
```

### Step 6: Deploy & Test (30 min)
```bash
# Deploy to Raindrop
raindrop build deploy

# Test with Claude Code (after connecting MCP)
search-logs("error OR quota")
get-call-logs("CA1678fb0732dac8edd1ea929e292743f2")
tail-logs(["voice-pipeline", "raindrop"], 50)
```

---

## Key Technical Decisions

### 1. SSH Access from Cloudflare Workers (Challenge)
**Problem:** Workers can't SSH or run shell commands.

**Solution:** Use db-proxy as relay:
- Add `/logs/fetch` endpoint to db-proxy (runs on Vultr)
- Raindrop MCP calls db-proxy → db-proxy runs PM2 commands
- Returns logs to Raindrop → stores in SmartBucket

### 2. Log Parsing Strategy
**Simple approach for Phase 1:**
- Split logs by newline
- Extract timestamp (if present)
- Extract log level (info, warn, error)
- Extract call_id (if present via regex)
- Store raw line for full context

**Structured format:**
```typescript
interface LogEntry {
  timestamp: Date;
  service: string;           // 'raindrop', 'voice-pipeline', 'db-proxy'
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  call_id?: string;
  raw: string;               // Original log line
}
```

### 3. Storage Strategy (Phase 1)
**For initial implementation:**
- Fetch logs on-demand when MCP tool is called
- Store in SmartBucket for semantic search
- Keep last 100 entries from each service in memory

**Later (Phase 2):**
- Automated collection every 1 minute (cron job)
- 30-day retention in SmartBucket
- Indexed by timestamp, service, call_id

---

## Testing Plan

### Manual Testing (During Development):
1. Deploy db-proxy with `/logs/fetch` endpoint
2. Test endpoint: `curl -X POST https://db.ai-tools-marketplace.io/logs/fetch -d '{"service":"voice-pipeline","lines":10}'`
3. Deploy log-aggregator service
4. Test from Raindrop CLI or API

### Integration Testing (After MCP Connected):
1. **Test search-logs:**
   ```
   search-logs("quota_exceeded")
   → Should return ElevenLabs error from earlier
   ```

2. **Test get-call-logs:**
   ```
   get-call-logs("CA1678fb0732dac8edd1ea929e292743f2")
   → Should return chronological timeline of that call
   ```

3. **Test tail-logs:**
   ```
   tail-logs(["voice-pipeline", "raindrop"], 20)
   → Should return last 20 lines from each service
   ```

### Success Metrics:
- ✅ Response time < 2 seconds
- ✅ Returns relevant results (not 500+ lines)
- ✅ Can find known errors (quota_exceeded, connection errors)
- ✅ Timeline is chronologically sorted
- ✅ 80%+ reduction in context tokens vs manual log fetching

---

## Expected Outcome

### Before (Current State):
```bash
# Terminal 1: Check Raindrop logs
raindrop logs tail -n 100 --application call-me-back
# Scroll through 200+ lines manually...

# Terminal 2: Check voice pipeline logs
ssh root@144.202.15.249 'pm2 logs voice-pipeline --lines 100'
# Scroll through 200+ lines manually...

# Terminal 3: Check db-proxy logs
ssh root@144.202.15.249 'pm2 logs db-proxy --lines 100'
# Scroll through 200+ lines manually...

# Find error: Ctrl+F for "error"
# Copy relevant lines → paste into Claude
# Total context: 2000+ tokens
```

### After (With Log MCP):
```typescript
// In Claude Code
await mcp.searchLogs({
  query: "error OR quota OR failed",
  since: "10m",
  limit: 20
});

// Returns:
{
  total: 3,
  logs: [
    {
      timestamp: "2025-11-18T17:05:12Z",
      service: "voice-pipeline",
      level: "error",
      message: "ElevenLabs error: quota_exceeded",
      call_id: "CA1678fb...",
      raw: "..."
    },
    // ... 2 more relevant entries
  ]
}

// Total context: 200 tokens (90% reduction!)
```

---

## Files to Create/Modify

### New Files:
1. `src/log-aggregator/index.ts` - Main MCP service
2. `src/log-aggregator/collectors/raindrop.ts` - Raindrop collector
3. `src/log-aggregator/collectors/vultr.ts` - Vultr collector
4. `src/log-aggregator/storage.ts` - SmartBucket wrapper
5. `src/log-aggregator/types.ts` - TypeScript interfaces

### Modify Existing:
1. `raindrop.manifest` - Add MCP service definition
2. `db-proxy` (on Vultr) - Add `/logs/fetch` endpoint

### Reference Docs:
- `LOG_AGGREGATION_MCP_DESIGN.md` - Full architecture (already created)
- `MIDTERM_EXAMINATION.md` - Priority matrix (already updated)

---

## Dependencies & Prerequisites

### Required:
- ✅ Raindrop CLI working
- ✅ SmartBucket resource type available
- ✅ MCP service type available
- ✅ Vultr db-proxy accessible
- ✅ SSH access to Vultr server
- ✅ Environment variables set

### External APIs (Not needed for Phase 1):
- ❌ ElevenLabs credits (not needed - just fetching logs)
- ❌ Twilio API (not needed yet)
- ❌ Voice calls (not needed yet)

---

## Estimated Timeline

| Task | Time | Notes |
|------|------|-------|
| Setup service structure | 30 min | Create files, basic scaffolding |
| Add db-proxy log endpoint | 30 min | SSH to Vultr, add endpoint, test |
| Implement log collectors | 1 hour | RaindropCollector + VultrCollector |
| Implement storage layer | 30 min | SmartBucket integration |
| Implement MCP tools | 45 min | search-logs, get-call-logs, tail-logs |
| Deploy & test | 30 min | Deploy to Raindrop, test tools |
| **Total** | **3-4 hours** | Phase 1 complete |

**Phase 2 (Later):** Automated collection - 2-3 hours
**Phase 3 (Later):** Cost tracking integration - 3-4 hours

---

## Risks & Mitigations

### Risk 1: SSH from Cloudflare Workers
**Risk:** Workers can't execute shell commands or SSH.
**Mitigation:** ✅ Use db-proxy as relay (already solved in design)

### Risk 2: Log Parsing Complexity
**Risk:** Inconsistent log formats across services.
**Mitigation:** Start simple - just extract timestamp, level, message. Can improve parsing later.

### Risk 3: SmartBucket Learning Curve
**Risk:** First time using SmartBucket resource.
**Mitigation:** Start with basic put/get/search. Use Raindrop docs for reference.

### Risk 4: MCP Service Learning Curve
**Risk:** First time building MCP service.
**Mitigation:** Follow Raindrop MCP examples. Start with simple tools, iterate.

---

## Success Definition

**Minimum Viable Product (MVP):**
1. ✅ Can search logs for "error" and get relevant results
2. ✅ Can get logs for a specific call_id
3. ✅ Saves significant context tokens vs manual fetching
4. ✅ Works reliably (no crashes, timeouts)

**Bonus (if time permits):**
- Filter by time range ("last 10m", "last 1h")
- Filter by log level (errors only)
- Highlight matching terms in results
- Count occurrences by service

---

## Next Steps After This Session

### Immediate (Phase 2):
1. Add automated log collection (cron job every 1 min)
2. Implement 30-day retention policy
3. Add historical log search

### Short-term (Phase 3):
1. Integrate cost tracking (parse API usage from logs)
2. Add aggregate-costs MCP tool
3. Build cost breakdown by service/call/user

### Medium-term (Phase 4):
1. Real-time alerts (error rate threshold)
2. Cost analytics dashboard
3. Correlation engine (cross-service event tracking)

---

## Why This Is The Right Choice

### Problem Validation ✅
We literally just spent 30 minutes digging through logs to find "quota_exceeded". This solves a real, immediate pain point.

### Quick Win 💰
Phase 1 is only 3-4 hours but delivers 90% of the value. We get immediate ROI.

### Foundation for More 🏗️
This enables cost tracking (Phase 3), which is a P0 priority for business viability.

### Hackathon Appeal 🏆
Shows advanced MCP usage + multi-cloud orchestration. Judges will be impressed.

### Learning Opportunity 📚
First MCP service + SmartBucket usage. Good for understanding Raindrop's advanced features.

---

## Reference Documents

1. **LOG_AGGREGATION_MCP_DESIGN.md** - Complete architecture (400+ lines)
2. **MIDTERM_EXAMINATION.md** - Feature priority matrix
3. **PROJECT_CONTEXT_REVIEW.md** - Project overview
4. **CRITICAL_RAINDROP_RULES.md** - Deployment commands

---

## Session Checklist

Before starting:
- [ ] Clear context (this document is the fresh start)
- [ ] Review LOG_AGGREGATION_MCP_DESIGN.md (skim for details)
- [ ] Confirm MCP service and SmartBucket available in Raindrop docs
- [ ] SSH access to Vultr working
- [ ] Raindrop CLI working

During implementation:
- [ ] Create service structure
- [ ] Add db-proxy log endpoint
- [ ] Implement collectors
- [ ] Implement storage
- [ ] Implement MCP tools
- [ ] Deploy to Raindrop
- [ ] Test each tool

After completion:
- [ ] Document what works / what doesn't
- [ ] Update MIDTERM_EXAMINATION.md with status
- [ ] Plan Phase 2 (automated collection)

---

## Questions to Answer During Implementation

1. Does Raindrop support `mcp_service` type in manifest? (Check docs)
2. Does SmartBucket support semantic search out of the box? (Check docs)
3. What's the max log size we can store in SmartBucket? (Test)
4. How fast is SmartBucket search? (Benchmark)
5. Can we call external APIs (db-proxy) from MCP service? (Test)

---

**END OF SESSION PLAN**

This document contains everything needed to implement Phase 1 of Log Aggregation MCP. Clear context and start fresh with this plan! 🚀
