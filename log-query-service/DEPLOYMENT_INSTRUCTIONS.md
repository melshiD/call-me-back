# Log Query Service - Deployment Instructions

**Status:** ✅ Voice-pipeline integration complete (2025-11-19)
**Ready for:** Production deployment and testing

## Prerequisites

1. **Local Machine:**
   - SSH access to Vultr (144.202.15.249)
   - Root `.env` file with required secrets

2. **Vultr Server:**
   - PM2 installed (already present)
   - PostgreSQL running (already present)
   - Caddy installed (already present)

---

## Deployment Steps

### 1. Deploy the Service

From your local machine in the `log-query-service/` directory:

```bash
# Make deploy script executable (if not already)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

This script will:
- Package the service code
- Upload to Vultr
- Extract and install dependencies
- Setup environment from root .env
- Start with PM2
- Save PM2 configuration

### 2. Configure Caddy Reverse Proxy

SSH to Vultr and edit Caddyfile:

```bash
ssh root@144.202.15.249
sudo nano /etc/caddy/Caddyfile
```

Add this block:

```caddyfile
# Existing routes...
voice.ai-tools-marketplace.io {
    reverse_proxy localhost:8080
}

db.ai-tools-marketplace.io {
    reverse_proxy localhost:3000
}

# NEW: Add log query service
logs.ai-tools-marketplace.io {
    reverse_proxy localhost:3001
}
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

### 3. Verify Deployment

Test the service:

```bash
# Health check (local)
curl http://localhost:3001/health

# Health check (public HTTPS)
curl https://logs.ai-tools-marketplace.io/health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"1.0.0","service":"log-query-service"}
```

Check PM2 status:

```bash
pm2 status
# Should show: log-query-service (online)
```

View logs:

```bash
pm2 logs log-query-service --lines 50
```

---

## Testing the API

### 1. Test Per-Call Cost Calculation

```bash
# Replace CALL_ID with an actual call ID from your database
curl "https://logs.ai-tools-marketplace.io/api/usage/call/CALL_ID_HERE"
```

Expected response:
```json
{
  "callId": "...",
  "usage": {
    "twilio": { "duration_seconds": 300, "duration_minutes": 5, "status": "completed" },
    "deepgram": { "duration_minutes": 5, "transcript_length": 1234 },
    "cerebras": { "prompt_tokens": 100, "completion_tokens": 200, "total_tokens": 300 },
    "elevenlabs": { "total_characters": 500, "request_count": 10 }
  },
  "costs": {
    "twilio": 0.07,
    "deepgram": 0.02945,
    "cerebras": 0.00003,
    "elevenlabs": 0.075
  },
  "subtotal": 0.42,
  "stripeFee": 0.475,
  "totalCost": 0.895,
  "userCharge": 4.99,
  "profit": 4.095,
  "margin": "82.06%"
}
```

### 2. Test Cost Calculation with Database Write

```bash
curl -X POST https://logs.ai-tools-marketplace.io/api/usage/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "YOUR_CALL_ID",
    "userId": "YOUR_USER_ID"
  }'
```

Expected response:
```json
{
  "success": true,
  "callId": "...",
  "costBreakdown": { ... },
  "message": "Cost data written to call_cost_events table"
}
```

### 3. Verify Database Writes

SSH to Vultr and check PostgreSQL:

```bash
ssh root@144.202.15.249
sudo -u postgres psql -d callmeback

# Check if cost events were written
SELECT COUNT(*) FROM call_cost_events;

# View recent cost events
SELECT * FROM call_cost_events ORDER BY created_at DESC LIMIT 10;

# Check call cost summary
SELECT
  service,
  SUM(total_cost) as total
FROM call_cost_events
GROUP BY service;
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check PM2 logs
pm2 logs log-query-service --err

# Common issues:
# 1. Missing .env file
cd /root/log-query-service
ls -la .env
./setup-env.sh

# 2. Database connection error
# Verify PostgreSQL credentials in .env
```

### Can't Reach HTTPS Endpoint

```bash
# Check Caddy status
sudo systemctl status caddy

# Check Caddy logs
sudo journalctl -u caddy -n 50

# Verify Caddyfile syntax
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

### Database Connection Errors

```bash
# Test PostgreSQL connection
psql -h localhost -U your_user -d callmeback

# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in .env match database
```

---

## PM2 Management Commands

```bash
# View status
pm2 status

# Restart service
pm2 restart log-query-service

# Stop service
pm2 stop log-query-service

# Delete service
pm2 delete log-query-service

# View logs (live tail)
pm2 logs log-query-service -f

# View last 100 lines
pm2 logs log-query-service --lines 100

# Save PM2 process list (persist across reboots)
pm2 save
```

---

## Environment Variables

The service requires these environment variables (piped from root .env):

```bash
# Server
PORT=3001
NODE_ENV=production

# Vultr paths
VULTR_VOICE_LOG_PATH=/var/log/pm2/voice-pipeline-out.log
VULTR_DB_LOG_PATH=/var/log/pm2/db-proxy-out.log

# Twilio (for API calls)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=callmeback
POSTGRES_USER=...
POSTGRES_PASSWORD=...

# Cache
CACHE_TTL=300
```

To update environment:

```bash
ssh root@144.202.15.249
cd /root/log-query-service
nano .env
pm2 restart log-query-service
```

---

## Architecture Summary

```
User Request
    ↓
Caddy (Port 443)
    ↓
logs.ai-tools-marketplace.io → localhost:3001
    ↓
Express Server (Node.js)
    ↓
┌──────────────┬──────────────┬──────────────┐
│  Collectors  │   Trackers   │    Routes    │
├──────────────┼──────────────┼──────────────┤
│ • Twilio     │ • Usage      │ • /api/usage │
│ • Vultr      │ • Pricing    │              │
│ • Deepgram   │              │              │
│ • Cerebras   │              │              │
│ • ElevenLabs │              │              │
└──────────────┴──────────────┴──────────────┘
    ↓
PostgreSQL (call_cost_events table)
```

---

## Next Steps

1. ✅ Deploy service
2. ✅ Configure Caddy
3. ✅ Test health endpoint
4. ✅ Test cost calculation
5. ✅ Verify database writes
6. 🔲 Integrate into call-orchestrator (trigger cost calc after calls)
7. 🔲 Build frontend dashboard for cost visibility
8. 🔲 Set up monitoring/alerts

---

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs log-query-service`
2. Check Caddy logs: `sudo journalctl -u caddy -n 50`
3. Review this document
4. Consult PCR2.md and LOG_AND_COST_AGGREGATION_SERVICE_PLAN.md
