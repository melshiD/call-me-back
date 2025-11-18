# Log Aggregation MCP Server - Design Document

**Created:** 2025-11-18
**Status:** Design Phase
**Priority:** P1 (High Value - Saves massive context and time)

---

## Executive Summary

Build an MCP (Model Context Protocol) server on Raindrop that aggregates logs from all infrastructure components (Raindrop services, Vultr voice pipeline, Vercel frontend, PostgreSQL) and provides intelligent search capabilities. This will eliminate the need to manually run multiple log commands and consume massive context tokens.

**Problem:** Currently spend 200+ lines of context per debugging session fetching logs from:
- Raindrop services (via `raindrop logs tail`)
- Vultr voice pipeline (via SSH + PM2)
- Vultr database proxy (via SSH + PM2)
- Twilio webhooks (via Twilio console/API)
- Frontend errors (via Vercel logs)

**Solution:** MCP server that:
1. Aggregates logs from all sources into centralized storage
2. Provides semantic search across all logs
3. Filters by service, time range, severity, call ID
4. Returns only relevant log entries (not full dumps)

**Value:**
- 🚀 **Saves 80%+ context tokens** during debugging
- ⏱️ **Reduces debugging time** from 10+ commands to 1 MCP call
- 📊 **Enables cost tracking** by aggregating API usage logs
- 🔍 **Better insights** with cross-service log correlation
- 🏆 **Hackathon differentiator** - Shows advanced MCP understanding

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   MCP CLIENT (Claude Code)                      │
│  Tools:                                                         │
│  - search-logs: Search across all logs                         │
│  - get-call-logs: Get all logs for specific call ID            │
│  - tail-logs: Real-time log streaming                          │
│  - aggregate-costs: Extract cost data from logs                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            LOG AGGREGATION MCP (Raindrop Service)               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ MCP Server (mcp_service "log-aggregator")                 │ │
│  │  - Implements MCP protocol                                │ │
│  │  - Provides log search tools                              │ │
│  │  - Caches recent logs in memory                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Log Collection Workers (Task - Cron Jobs)                 │ │
│  │  - Every 1 min: Fetch Raindrop logs                       │ │
│  │  - Every 1 min: Fetch Vultr PM2 logs                      │ │
│  │  - Every 5 min: Fetch Twilio logs                         │ │
│  │  - Store in SmartBucket for persistence                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Log Storage (SmartBucket)                                 │ │
│  │  - logs/raindrop/YYYY-MM-DD/HH-MM.log                     │ │
│  │  - logs/vultr/voice-pipeline/YYYY-MM-DD/HH-MM.log         │ │
│  │  - logs/vultr/db-proxy/YYYY-MM-DD/HH-MM.log               │ │
│  │  - Automatic semantic indexing for search                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOG SOURCES (External)                       │
│  - Raindrop CLI: raindrop logs tail -n 100                     │
│  - Vultr SSH: pm2 logs voice-pipeline --lines 100              │
│  - Vultr SSH: pm2 logs db-proxy --lines 100                    │
│  - Twilio API: /Calls/{CallSid}/Events                         │
│  - (Future) Vercel API: vercel logs                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Basic MCP Server (Week 1) ⭐⭐⭐⭐⭐

### Goal
Get MCP server running with basic log aggregation from Raindrop + Vultr.

### Components

**1. MCP Service Definition**
```hcl
# raindrop.manifest
mcp_service "log-aggregator" {
  public = false  # Protected - only for our use

  tool "search-logs" {
    description = "Search across all Call Me Back logs from all services"
    input_schema = {
      query: "string",           # Search query (e.g., "error", "call_id:abc123")
      service: "string?",        # Filter by service (raindrop, voice-pipeline, db-proxy)
      since: "string?",          # Time filter (e.g., "10m", "1h", "2024-11-18")
      limit: "number?"           # Max results (default 50)
    }
  }

  tool "get-call-logs" {
    description = "Get all logs related to a specific call ID"
    input_schema = {
      call_id: "string",         # Call ID to search for
      include_services: "array?" # Services to include (default all)
    }
  }

  tool "tail-logs" {
    description = "Get most recent logs from specified services"
    input_schema = {
      services: "array",         # Services to tail (raindrop, voice-pipeline, etc.)
      lines: "number?"           # Number of lines (default 50)
    }
  }
}

# SmartBucket for log storage
smartbucket "call-me-back-logs" {
  embedding_model = "text-embedding-ada-002"
}
```

**2. Log Collection Service**
```typescript
// src/log-aggregator/collectors/raindrop-collector.ts
export class RaindropLogCollector {
  async fetchLogs(lines: number = 100): Promise<LogEntry[]> {
    // Execute: raindrop logs tail -n {lines} --application call-me-back
    // Parse output into structured LogEntry objects
    const output = await executeCommand(`raindrop logs tail -n ${lines} --application call-me-back`);
    return this.parseRaindropLogs(output);
  }
}

// src/log-aggregator/collectors/vultr-collector.ts
export class VultrLogCollector {
  async fetchVoicePipelineLogs(lines: number = 100): Promise<LogEntry[]> {
    // Execute: ssh root@144.202.15.249 'pm2 logs voice-pipeline --lines {lines} --nostream'
    const output = await executeSSHCommand(
      '144.202.15.249',
      `pm2 logs voice-pipeline --lines ${lines} --nostream`
    );
    return this.parseVultrLogs(output, 'voice-pipeline');
  }

  async fetchDbProxyLogs(lines: number = 100): Promise<LogEntry[]> {
    const output = await executeSSHCommand(
      '144.202.15.249',
      `pm2 logs db-proxy --lines ${lines} --nostream`
    );
    return this.parseVultrLogs(output, 'db-proxy');
  }
}
```

**3. Log Storage & Indexing**
```typescript
// src/log-aggregator/storage.ts
export class LogStorage {
  private bucket: SmartBucket;

  async storeLogs(logs: LogEntry[], service: string) {
    const timestamp = new Date().toISOString();
    const key = `logs/${service}/${timestamp}.json`;

    // Store raw logs in SmartBucket (automatic semantic indexing!)
    await this.bucket.put(key, JSON.stringify(logs));
  }

  async searchLogs(query: string, filters: LogFilters): Promise<LogEntry[]> {
    // Use SmartBucket semantic search
    const results = await this.bucket.search({
      input: query,
      filters: {
        service: filters.service,
        timestamp_gte: filters.since
      },
      limit: filters.limit || 50
    });

    return results.map(r => JSON.parse(r.content));
  }
}
```

**4. MCP Server Implementation**
```typescript
// src/log-aggregator/index.ts
import { McpService } from '@raindrop/mcp';

export class LogAggregatorMCP extends McpService {
  private storage: LogStorage;
  private collectors: LogCollectors;

  async searchLogs(params: SearchLogsParams): Promise<LogSearchResult> {
    // If query contains "call_id:", extract and use get-call-logs
    if (params.query.includes('call_id:')) {
      const callId = params.query.match(/call_id:(\S+)/)?.[1];
      if (callId) {
        return this.getCallLogs({ call_id: callId });
      }
    }

    // Otherwise do semantic search
    const logs = await this.storage.searchLogs(params.query, {
      service: params.service,
      since: params.since,
      limit: params.limit
    });

    return {
      total: logs.length,
      logs: logs,
      query: params.query,
      filters: params
    };
  }

  async getCallLogs(params: GetCallLogsParams): Promise<CallLogsResult> {
    // Search for call ID across all services
    const services = params.include_services || ['raindrop', 'voice-pipeline', 'db-proxy'];
    const allLogs: LogEntry[] = [];

    for (const service of services) {
      const logs = await this.storage.searchLogs(
        `call_id:${params.call_id} OR callId:${params.call_id} OR ${params.call_id}`,
        { service, limit: 1000 }
      );
      allLogs.push(...logs);
    }

    // Sort by timestamp
    allLogs.sort((a, b) => a.timestamp - b.timestamp);

    return {
      call_id: params.call_id,
      total_logs: allLogs.length,
      services: services,
      logs: allLogs,
      timeline: this.buildTimeline(allLogs)
    };
  }

  async tailLogs(params: TailLogsParams): Promise<TailLogsResult> {
    // Fetch fresh logs from each service
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
      logs_by_service: results,
      total_logs: Object.values(results).reduce((sum, logs) => sum + logs.length, 0)
    };
  }
}
```

**5. Log Entry Schema**
```typescript
interface LogEntry {
  timestamp: Date;
  service: string;           // 'raindrop', 'voice-pipeline', 'db-proxy'
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  call_id?: string;          // Extracted if present
  user_id?: string;          // Extracted if present
  persona_id?: string;       // Extracted if present
  metadata?: Record<string, any>; // Additional structured data
  raw?: string;              // Original log line
}

interface LogFilters {
  service?: string;
  level?: string;
  since?: string;            // ISO timestamp or relative (10m, 1h, 1d)
  limit?: number;
}
```

---

## Phase 2: Automated Collection (Week 2) ⭐⭐⭐⭐

### Goal
Automate log collection with cron jobs, so logs are always available without manual fetching.

**Implementation:**
```hcl
# raindrop.manifest
task "collect_raindrop_logs" {
  schedule = "* * * * *"  # Every minute
  service = "log-aggregator"
  function = "collectRaindropLogs"
}

task "collect_vultr_logs" {
  schedule = "* * * * *"  # Every minute
  service = "log-aggregator"
  function = "collectVultrLogs"
}

task "collect_twilio_logs" {
  schedule = "*/5 * * * *"  # Every 5 minutes
  service = "log-aggregator"
  function = "collectTwilioLogs"
}
```

**Benefits:**
- Logs always available instantly (no fetch delay)
- Historical log retention (30 days in SmartBucket)
- Can correlate events across time
- Enables alerting on error patterns

---

## Phase 3: Cost Tracking Integration (Week 3) ⭐⭐⭐⭐

### Goal
Extract cost-relevant data from logs for dynamic pricing.

**New MCP Tool:**
```typescript
async aggregateCosts(params: AggregateCostsParams): Promise<CostAggregation> {
  // Search logs for cost-relevant events
  const logs = await this.storage.searchLogs(
    'Deepgram OR Cerebras OR ElevenLabs OR Twilio',
    { since: params.since || '24h' }
  );

  // Parse cost data from logs
  const costs = this.extractCostData(logs);

  // Aggregate by service, call, user
  return {
    total_cost: costs.reduce((sum, c) => sum + c.amount, 0),
    by_service: this.groupByService(costs),
    by_call: this.groupByCall(costs),
    by_user: this.groupByUser(costs),
    period: params.since
  };
}
```

**Log Patterns to Extract:**
```
[VoicePipeline abc123] Deepgram connected
→ Track Deepgram usage duration

[VoicePipeline abc123] User said: "hello there"
→ Track STT characters

[VoicePipeline abc123] AI response length: 45 chars
→ Track Cerebras tokens (estimate)

[VoicePipeline abc123] Speaking: "Hey, how are you?"
→ Track ElevenLabs characters

[Twilio] Call duration: 125 seconds
→ Track Twilio minutes
```

---

## Phase 4: Advanced Features (Week 4+) ⭐⭐⭐

### Real-Time Alerts
```typescript
async setupAlerts() {
  // Monitor logs for error patterns
  setInterval(async () => {
    const errors = await this.searchLogs('error OR failed', { since: '5m' });
    if (errors.length > 10) {
      await this.sendAlert('High error rate detected', errors);
    }
  }, 60000); // Every minute
}
```

### Log Analytics Dashboard
```typescript
async getLogAnalytics(since: string): Promise<LogAnalytics> {
  const logs = await this.storage.getAllLogs({ since });

  return {
    total_logs: logs.length,
    by_level: this.groupByLevel(logs),
    by_service: this.groupByService(logs),
    error_rate: this.calculateErrorRate(logs),
    top_errors: this.getTopErrors(logs, 10),
    call_volume: this.getCallVolume(logs),
    avg_call_duration: this.calculateAvgDuration(logs)
  };
}
```

### Correlation Engine
```typescript
async correlateCallEvents(callId: string): Promise<CallCorrelation> {
  const logs = await this.getCallLogs({ call_id: callId });

  return {
    call_id: callId,
    start_time: logs[0].timestamp,
    end_time: logs[logs.length - 1].timestamp,
    duration: this.calculateDuration(logs),
    services_involved: this.getServicesInvolved(logs),
    errors: logs.filter(l => l.level === 'error'),
    cost_breakdown: this.extractCostBreakdown(logs),
    timeline: this.buildDetailedTimeline(logs)
  };
}
```

---

## Implementation Plan

### Week 1: Basic MCP Server
- [x] Voice pipeline stability fixes (COMPLETED!)
- [ ] Create log-aggregator service structure
- [ ] Implement RaindropLogCollector
- [ ] Implement VultrLogCollector
- [ ] Set up SmartBucket for log storage
- [ ] Implement basic search-logs MCP tool
- [ ] Test with Claude Code

**Effort:** 2-3 days
**Value:** HIGH - Immediate context savings

### Week 2: Automated Collection
- [ ] Add Task definitions for cron jobs
- [ ] Implement automated log collection workers
- [ ] Add log retention policy (30 days)
- [ ] Add get-call-logs MCP tool
- [ ] Add tail-logs MCP tool
- [ ] Test automated collection

**Effort:** 2-3 days
**Value:** MEDIUM - Convenience + historical data

### Week 3: Cost Tracking Integration
- [ ] Add aggregate-costs MCP tool
- [ ] Implement cost extraction patterns
- [ ] Build cost aggregation logic
- [ ] Test cost tracking accuracy
- [ ] Integrate with pricing-manager service

**Effort:** 3-4 days
**Value:** HIGH - Enables dynamic pricing

### Week 4: Polish & Advanced Features
- [ ] Add real-time alerts
- [ ] Build analytics dashboard
- [ ] Implement correlation engine
- [ ] Add log visualization
- [ ] Performance optimization

**Effort:** 3-5 days
**Value:** MEDIUM - Nice-to-have features

---

## Usage Examples

### Example 1: Debug a Failed Call
```typescript
// Instead of running 5+ commands and consuming 500 lines of context:
// - raindrop logs tail -n 100
// - ssh pm2 logs voice-pipeline --lines 100
// - ssh pm2 logs db-proxy --lines 100
// - search through logs manually
// - copy/paste relevant sections

// With MCP server:
const result = await mcp.getCallLogs({
  call_id: 'abc123',
  include_services: ['raindrop', 'voice-pipeline', 'db-proxy']
});

// Returns:
{
  call_id: 'abc123',
  total_logs: 45,
  services: ['raindrop', 'voice-pipeline', 'db-proxy'],
  logs: [
    { timestamp: '2025-11-18T10:00:01Z', service: 'raindrop', message: 'Call triggered', ... },
    { timestamp: '2025-11-18T10:00:02Z', service: 'voice-pipeline', message: 'Deepgram connected', ... },
    { timestamp: '2025-11-18T10:00:05Z', service: 'voice-pipeline', level: 'error', message: 'Turn evaluation timeout', ... },
  ],
  timeline: [
    '10:00:01 - Call initiated',
    '10:00:02 - Voice pipeline started',
    '10:00:05 - ERROR: Turn evaluation timeout',
    '10:00:06 - Call ended'
  ]
}
```

### Example 2: Search for Recent Errors
```typescript
const result = await mcp.searchLogs({
  query: 'error OR failed',
  since: '1h',
  limit: 20
});

// Returns only relevant error logs from last hour across ALL services
```

### Example 3: Get Cost Breakdown
```typescript
const costs = await mcp.aggregateCosts({
  since: '24h'
});

// Returns:
{
  total_cost: 12.45,
  by_service: {
    deepgram: 2.10,
    cerebras: 0.05,
    elevenlabs: 4.20,
    twilio: 6.10
  },
  by_call: {
    'abc123': 2.50,
    'def456': 3.75,
    // ...
  }
}
```

---

## Technical Considerations

### 1. SSH Access from Raindrop (Cloudflare Workers)
**Challenge:** Cloudflare Workers can't make SSH connections directly.

**Solution:** Use Vultr db-proxy as relay:
```typescript
// Add log endpoint to db-proxy
app.post('/logs/fetch', async (req, res) => {
  const { service, lines } = req.body;
  const output = await exec(`pm2 logs ${service} --lines ${lines} --nostream`);
  res.json({ logs: output });
});

// Call from Raindrop log-aggregator
const response = await fetch('https://db.ai-tools-marketplace.io/logs/fetch', {
  method: 'POST',
  body: JSON.stringify({ service: 'voice-pipeline', lines: 100 })
});
```

### 2. Log Volume & Storage Costs
**Estimate:**
- 10 calls/day = ~5000 log lines/day
- ~500KB/day in logs
- SmartBucket: $0.15/GB/month = $0.023/month for 30 days
- **Very affordable!**

### 3. SmartBucket Semantic Search Performance
- Automatic indexing on upload
- Sub-second search across 30 days of logs
- Much faster than grep across multiple servers

### 4. Context Token Savings
**Current:**
- 5 commands × 100 lines each = 500 lines of logs
- ~2000 tokens per debugging session
- 10 debugging sessions/day = 20,000 tokens/day

**With MCP:**
- 1 MCP call returning only relevant 10-20 log lines
- ~100-200 tokens per debugging session
- 10 sessions/day = 1,000-2,000 tokens/day
- **90% reduction in context usage!**

---

## Hackathon Appeal

### Why Judges Will Love This:

1. **Advanced MCP Usage** ⭐⭐⭐⭐⭐
   - Shows deep understanding of MCP protocol
   - Practical, useful implementation
   - Demonstrates AI agent tooling expertise

2. **Multi-Cloud Orchestration** ⭐⭐⭐⭐
   - Aggregates logs from Cloudflare, Vultr, Twilio
   - Shows architectural sophistication
   - Real-world distributed systems challenge

3. **Developer Experience** ⭐⭐⭐⭐
   - Dramatically improves debugging workflow
   - Self-documenting through intelligent search
   - Shows product thinking beyond features

4. **Cost Tracking Foundation** ⭐⭐⭐⭐⭐
   - Enables dynamic pricing (hackathon judges care about business viability)
   - Shows forward-thinking architecture
   - Real production-ready solution

5. **Raindrop Showcase** ⭐⭐⭐⭐⭐
   - Uses SmartBucket (semantic search)
   - Uses MCP services (extensibility)
   - Uses Tasks (automation)
   - **Uses 3 major Raindrop features in one implementation!**

---

## Success Metrics

### Phase 1 Success:
- [ ] MCP server responds to search-logs
- [ ] Can search logs from Raindrop + Vultr
- [ ] Saves 80%+ context tokens vs manual log fetching
- [ ] Returns relevant results in <2 seconds

### Phase 2 Success:
- [ ] Logs collected automatically every minute
- [ ] Can query historical logs (24 hours)
- [ ] get-call-logs returns complete call timeline
- [ ] Zero manual log fetching needed

### Phase 3 Success:
- [ ] aggregate-costs returns accurate cost data
- [ ] Cost data matches actual API bills within 5%
- [ ] Can track costs per call, user, service
- [ ] Enables dynamic pricing calculations

### Overall Success:
- [ ] Hackathon judges impressed by MCP sophistication
- [ ] Debugging time reduced 50%+
- [ ] Context token usage reduced 80%+
- [ ] Production-ready log observability

---

## Priority Recommendation

**PRIORITY: P1 (High Value)**

**Rationale:**
1. **Immediate value** - Saves context/time right now
2. **Hackathon appeal** - Shows advanced MCP understanding
3. **Cost tracking enabler** - Needed for P0 priority feature
4. **Relatively quick** - Phase 1 is only 2-3 days
5. **Compound benefits** - Helps with all future debugging

**Timing:**
- Phase 1: After voice pipeline testing (this week)
- Phase 2: Alongside SmartMemory integration (next week)
- Phase 3: With dynamic pricing implementation (week 3)

**Estimated Total Effort:** 10-15 days across 4 weeks
**Estimated Value:** ⭐⭐⭐⭐⭐ (Exceptional - saves time + enables cost tracking + hackathon differentiator)

---

## Next Steps

1. ✅ Design document created
2. [ ] Add to MIDTERM_EXAMINATION.md
3. [ ] Test call to verify voice pipeline stability fixes
4. [ ] After testing: Start Phase 1 implementation
5. [ ] Create log-aggregator service structure
6. [ ] Implement first MCP tool (search-logs)

---

**End of Design Document**
