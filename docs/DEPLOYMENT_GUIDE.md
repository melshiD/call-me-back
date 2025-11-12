# Deployment Guide - Call Me Back

## Prerequisites

Before deploying, ensure you have:

1. **Raindrop CLI installed**
   ```bash
   npm install -g @liquidmetal-ai/raindrop-cli
   ```

2. **Environment variables configured** (copy `.env.example` to `.env` and fill in):
   - `ELEVENLABS_API_KEY` - Get from https://elevenlabs.io/
   - `CEREBRAS_API_KEY` - Get from https://cloud.cerebras.ai/
   - `TWILIO_ACCOUNT_SID` - Get from https://console.twilio.com/
   - `TWILIO_AUTH_TOKEN` - Get from https://console.twilio.com/
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (e.g., +15551234567)
   - `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **Twilio account with a phone number**
   - Phone number must be capable of Voice calls
   - Must support Media Streams (check Twilio console)

## Step 1: Database Setup

Run the migration scripts to create tables and seed initial personas:

```bash
# Option A: Using Raindrop CLI (recommended)
raindrop db migrate

# Option B: Manually via SmartSQL dashboard
# Copy and paste the SQL from migrations/*.sql files in order:
# 1. migrations/001_create_personas_tables.sql
# 2. migrations/002_seed_initial_personas.sql
```

Verify tables were created:
- `personas` - 3 demo personas (Brad, Sarah, Alex)
- `user_persona_relationships` - 3 demo relationships for user `demo_user`
- `call_logs` - Empty, ready for call tracking

## Step 2: Deploy to Raindrop

Deploy the application to Raindrop cloud:

```bash
# Build and deploy
raindrop deploy

# Follow the prompts:
# - Confirm deployment
# - Wait for build to complete
# - Note the deployed URL (e.g., https://call-me-back-abc123.raindrop.ai)
```

After deployment, you'll get:
- **Base URL**: `https://call-me-back-abc123.raindrop.ai`
- **API Gateway**: Public service for incoming requests
- **Voice Pipeline**: Private service (called internally)
- **SmartMemory**: Automatically provisioned
- **SmartSQL**: Database ready with migrations

## Step 3: Configure Twilio Webhooks

Configure your Twilio phone number to use the deployed endpoints:

1. Go to **Twilio Console** → **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your phone number
3. Scroll to **Voice Configuration**
4. Set the following:

   **When a call comes in:**
   - Select: `Webhook`
   - URL: `https://call-me-back-abc123.raindrop.ai/api/voice/answer`
   - HTTP Method: `POST`

5. Click **Save**

## Step 4: Test the Voice Pipeline

### Make a Test Call

1. Call your Twilio phone number from any phone
2. You should hear: "Connecting you now."
3. The voice pipeline will connect (Brad persona by default)
4. Try having a conversation!

### Monitor Logs

Watch logs in real-time:

```bash
raindrop logs --follow
```

Look for:
- `Incoming call` - Call received
- `WebSocket connection request` - Stream established
- `Voice pipeline started` - Pipeline initialized
- `Loading memory context` - SmartMemory loading
- `System prompt built` - Composite prompt ready
- `Final transcript` - User speech recognized
- `AI response generated` - Cerebras response
- `TTS generation complete` - Speech synthesized

### Check Call Logs

After a call completes, check the database:

```bash
# Using Raindrop SmartSQL dashboard or direct query
SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 5;
```

You should see:
- Call duration
- Cost breakdown (STT, LLM, TTS, Twilio)
- Turn count and interrupt count
- Average response time

## Step 5: Test Memory Continuity

Make multiple calls to test SmartMemory:

**Call 1:**
- User: "Hey Brad, I'm working on a new startup called TechCo."
- Brad should respond and remember this

**Call 2 (a few minutes later):**
- User: "Hey Brad, how's it going?"
- Brad should remember TechCo and ask about it without being reminded!

**Verify Memory:**

```bash
# Check semantic memory was updated
# Use SmartMemory dashboard or API calls to see:
# - long_term:demo_user:brad_001 (should have "startup: TechCo")
# - recent_calls:demo_user:brad_001 (should have call summary)
```

## Troubleshooting

### No audio or "Connecting you now" but then silence

**Check:**
1. Twilio webhook URL is correct (should be your deployed URL + `/api/voice/answer`)
2. WebSocket URL is accessible (check logs for WebSocket errors)
3. API keys are set correctly (ELEVENLABS_API_KEY, CEREBRAS_API_KEY)

**View logs:**
```bash
raindrop logs --filter="Voice pipeline" --follow
```

### Persona doesn't remember previous calls

**Check:**
1. SmartMemory is provisioned: `raindrop resources list`
2. Memory finalization completed (look for "Memory extraction complete" in logs)
3. Database has entries in `call_logs` with completed status

### High latency or timeouts

**Check:**
1. Cerebras API key is valid and has quota
2. ElevenLabs API key is valid
3. Network connectivity to Twilio/ElevenLabs/Cerebras

**Monitor response times:**
```bash
raindrop logs --filter="Response time" --follow
```

### WebSocket closes immediately

**Check:**
1. Voice Pipeline service has access to SmartMemory binding
2. Database has persona with id `brad_001`
3. No startup errors in voice pipeline service

## Environment-Specific Notes

### Development (Local)
- Use ngrok for local testing: `ngrok http 8787`
- Update Twilio webhook to ngrok URL
- Set `NODE_ENV=development`

### Production
- Set `NODE_ENV=production`
- Use production API keys
- Enable rate limiting and security features
- Monitor costs closely (AI/TTS usage can add up)

## Cost Monitoring

Track costs per call:

```bash
# View average costs
SELECT
  AVG(cost_total) as avg_cost_cents,
  AVG(duration_seconds) as avg_duration_sec,
  COUNT(*) as total_calls
FROM call_logs
WHERE status = 'completed';
```

Expected costs (per 5-minute call with 8 turns):
- STT: ~$0.03
- LLM: ~$0.0002
- TTS: ~$0.0005
- Twilio: ~$0.10
- **Total: ~$0.13 per call**

## Next Steps

1. **Add more personas**: Insert into `personas` table
2. **User phone lookup**: Replace `demo_user` with actual user lookup by phone number
3. **Customize voices**: Update `voice_id` in user_persona_relationships
4. **Memory optimization**: Add token budget management for large memory contexts
5. **Analytics dashboard**: Build UI to visualize call stats and costs

## Quick Reference

### Deployed URLs
- API Gateway: `https://call-me-back-abc123.raindrop.ai`
- TwiML Endpoint: `https://call-me-back-abc123.raindrop.ai/api/voice/answer`
- WebSocket: `wss://call-me-back-abc123.raindrop.ai/api/voice/stream`

### Default Personas
- `brad_001` - Brad (Bro Coach)
- `sarah_001` - Sarah (Empathetic Listener)
- `alex_001` - Alex (Creative Catalyst)

### Useful Commands
```bash
# Deploy
raindrop deploy

# Watch logs
raindrop logs --follow

# Check resources
raindrop resources list

# Run migrations
raindrop db migrate

# Check deployment status
raindrop status
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/anthropics/raindrop/issues
- Documentation: https://docs.liquidmetal.ai/
- Twilio Support: https://support.twilio.com/
