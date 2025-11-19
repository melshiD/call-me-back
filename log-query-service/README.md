# Log Query & Cost Aggregation Service

**Version:** 1.0.0
**Purpose:** Real-time cost tracking and log aggregation for Call Me Back
**Status:** Production Ready

---

## Overview

This service aggregates logs from multiple sources (Twilio, Vultr voice-pipeline, AI services) and calculates per-call costs for the Call Me Back application. It writes cost data to PostgreSQL for profitability analysis.

### Key Features

- ✅ **Multi-Source Log Aggregation:** Twilio API + Vultr PM2 logs
- ✅ **AI Service Cost Tracking:** Deepgram, Cerebras, ElevenLabs (parsed from voice-pipeline logs)
- ✅ **Real-Time Cost Calculation:** Per-call cost breakdowns with profit/margin
- ✅ **Database Integration:** Writes to `call_cost_events` table
- ✅ **Caching:** 5-minute cache for frequently accessed data
- ✅ **REST API:** Simple HTTP endpoints for cost queries

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│ PRIMARY DATA SOURCE: Vultr Voice Pipeline      │
│ /var/log/pm2/voice-pipeline-out.log           │
│                                                │
│ Contains ALL AI service usage:                 │
│ • Deepgram STT transcripts & duration         │
│ • Cerebras inference token counts              │
│ • ElevenLabs TTS character counts              │
└─────────────────────────────────────────────────┘
                    ↓
         ┌──────────────────────┐
         │   Log Collectors     │
         ├──────────────────────┤
         │ • VultrCollector     │ ← PRIMARY (reads PM2 logs)
         │ • TwilioCollector    │ ← Calls Twilio API
         │ • DeepgramCollector  │ ← Parses Vultr logs
         │ • CerebrasCollector  │ ← Parses Vultr logs
         │ • ElevenLabsCollector│ ← Parses Vultr logs
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │   Usage Tracker      │
         ├──────────────────────┤
         │ • Aggregates usage   │
         │ • Calculates costs   │
         │ • Applies pricing    │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │   REST API Endpoints │
         ├──────────────────────┤
         │ GET  /api/usage/call/:id       │
         │ POST /api/usage/calculate      │
         │ GET  /health                   │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │   PostgreSQL DB      │
         ├──────────────────────┤
         │ • call_cost_events   │
         │ • calls (update)     │
         └──────────────────────┘
```

---

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T...",
  "version": "1.0.0",
  "service": "log-query-service"
}
```

### GET /api/usage/call/:callId
Get cost breakdown for a specific call

**Parameters:**
- `callId` (path): Call ID from database

**Response:**
```json
{
  "callId": "uuid-here",
  "usage": {
    "twilio": { "duration_seconds": 300, "duration_minutes": 5 },
    "deepgram": { "duration_minutes": 5, "transcript_length": 1234 },
    "cerebras": { "total_tokens": 5000 },
    "elevenlabs": { "total_characters": 2000 }
  },
  "costs": {
    "twilio": 0.07,
    "deepgram": 0.02945,
    "cerebras": 0.0005,
    "elevenlabs": 0.30
  },
  "subtotal": 0.40,
  "totalCost": 0.875,
  "profit": 4.115,
  "margin": "82.47%"
}
```

### POST /api/usage/calculate
Calculate costs and write to database

**Body:**
```json
{
  "callId": "uuid-here",
  "userId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "callId": "uuid-here",
  "costBreakdown": { ... },
  "message": "Cost data written to call_cost_events table"
}
```

---

## Installation

### Local Development

```bash
npm install
./setup-env.sh  # Creates .env from root .env
npm start
```

### Vultr Deployment

```bash
./deploy.sh
```

See [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) for full deployment guide.

---

## Cost Breakdown (Per 5-min Call)

Based on 2025-01 pricing:

| Service     | Cost/Call | % of Total |
|-------------|-----------|------------|
| Twilio      | $0.070    | 16%        |
| Deepgram    | $0.030    | 7%         |
| Cerebras    | $0.005    | 1%         |
| ElevenLabs  | $0.300    | 70%  ⭐    |
| Raindrop    | $0.020    | 5%         |
| **Subtotal**| **$0.425**| **100%**   |
| Stripe      | $0.475    | (payment)  |
| **Total**   | **$0.900**|            |

**User Charge:** $4.99
**Profit:** $4.09
**Margin:** 82%

**Key Insight:** ElevenLabs TTS is 70% of API costs - primary optimization target.

---

## Environment Variables

```bash
PORT=3001                              # Service port
NODE_ENV=production                     # Environment
VULTR_VOICE_LOG_PATH=/var/log/pm2/...  # Voice pipeline logs
TWILIO_ACCOUNT_SID=...                  # Twilio API
TWILIO_AUTH_TOKEN=...                   # Twilio API
POSTGRES_HOST=localhost                 # Database
POSTGRES_DB=callmeback                  # Database name
POSTGRES_USER=...                       # Database user
POSTGRES_PASSWORD=...                   # Database password
CACHE_TTL=300                           # Cache duration (seconds)
```

---

## Dependencies

```json
{
  "express": "HTTP server",
  "pg": "PostgreSQL client",
  "axios": "HTTP client for Twilio API",
  "winston": "Logging",
  "node-cache": "In-memory caching",
  "dotenv": "Environment variables",
  "cors": "CORS middleware"
}
```

---

## Directory Structure

```
log-query-service/
├── server.js                 # Main Express app
├── package.json              # Dependencies
├── ecosystem.config.js       # PM2 configuration
├── setup-env.sh             # Environment setup script
├── deploy.sh                # Deployment script
├── collectors/              # Log collection modules
│   ├── twilio.js           # Twilio API collector
│   ├── vultr.js            # PM2 log reader (PRIMARY)
│   ├── deepgram.js         # Parses voice-pipeline logs
│   ├── cerebras.js         # Parses voice-pipeline logs
│   └── elevenlabs.js       # Parses voice-pipeline logs
├── trackers/               # Cost calculation
│   ├── pricing-constants.js # API pricing rates
│   └── usage-tracker.js    # Aggregates usage & calculates costs
├── routes/                 # API endpoints
│   └── usage/
│       ├── call.js         # GET /api/usage/call/:id
│       └── calculate.js    # POST /api/usage/calculate
├── utils/                  # Utilities
│   └── database.js         # PostgreSQL integration
└── README.md              # This file
```

---

## Critical Design Decisions

### 1. Why Parse Logs Instead of Direct API Calls?

**Deepgram, Cerebras, ElevenLabs don't provide usage APIs.** The voice-pipeline service logs ALL usage in real-time to PM2 logs. Parsing these logs is:
- ✅ More accurate (captures actual usage)
- ✅ Faster (no external API calls)
- ✅ Cheaper (no API rate limits)
- ✅ Real-time (log-based)

### 2. Why Separate Service Instead of Raindrop MCP?

**Raindrop MCP framework has known limitations** (see MCP_DEBUGGING_SESSION_2025-11-19.md). This HTTP service:
- ✅ Works reliably (proven pattern)
- ✅ Runs on Vultr (can read local PM2 logs)
- ✅ Uses standard Node.js/Express (no framework dependencies)
- ✅ Can be deployed immediately

### 3. Why PostgreSQL Direct Connection?

**Database-proxy adds latency for bulk writes.** Cost tracking needs:
- Transactions (BEGIN/COMMIT)
- Bulk inserts (4+ events per call)
- Real-time updates

Direct PostgreSQL connection is faster and more reliable.

---

## Future Enhancements

- [ ] WebSocket support for real-time cost streaming during calls
- [ ] Dynamic pricing updates (fetch from external APIs)
- [ ] Cost analytics dashboard
- [ ] Alerting system (budget thresholds)
- [ ] Data retention policies
- [ ] Rate limiting & authentication

---

## Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env`
- Test connection: `psql -h localhost -U user -d callmeback`

### "Cannot read log files"
- Check PM2 logs exist: `ls -la /var/log/pm2/voice-pipeline-out.log`
- Verify file permissions
- Check voice-pipeline is running: `pm2 status`

### "No cost data in database"
- Verify `call_cost_events` table exists
- Check service logs: `pm2 logs log-query-service`
- Test POST /api/usage/calculate endpoint

---

## Documentation

- **DEPLOYMENT_INSTRUCTIONS.md** - Full deployment guide
- **PCR2.md** - Project context & architecture
- **LOG_AND_COST_AGGREGATION_SERVICE_PLAN.md** - Original design doc
- **SYSTEM_ARCHITECTURE.md** - Infrastructure overview

---

## Maintenance

### Update Pricing

Edit `trackers/pricing-constants.js` with new rates, then:

```bash
ssh root@144.202.15.249
cd /root/log-query-service
nano trackers/pricing-constants.js
pm2 restart log-query-service
```

### View Logs

```bash
# Live tail
pm2 logs log-query-service -f

# Last 100 lines
pm2 logs log-query-service --lines 100

# Errors only
pm2 logs log-query-service --err
```

### Restart Service

```bash
ssh root@144.202.15.249
pm2 restart log-query-service
```

---

**Status:** ✅ Ready for deployment
**Next Step:** Run `./deploy.sh` to deploy to Vultr
