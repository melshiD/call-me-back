Is it required to use all 4 Raindrop features mentioned in the Hackathon reqs, or can we just use what we need (and what works!).  Reason I'm asking is that smartSQL has limitations compared to other SQL services.

Is there some way to get the ElevenLabs STT to work with Cloudflare Workers?

Am I required to implement WorkOS for auth? (I Have it, but I think it's falling back to JWT)

---

## Platform Limitations Encountered During Development

### 1. SmartSQL Limitations
**Issue:** Had to use external Vultr PostgreSQL database with a proxy service (ai-tools-marketplace.io) instead of SmartSQL.

**Why:**
- SmartSQL had limitations for our real-time voice app requirements
- Needed more advanced SQL features and performance

**Current Setup:**
- Database: Vultr PostgreSQL
- Proxy: ai-tools-marketplace.io/query
- Still accessible via Raindrop services through database-proxy service

**Question:** Does this disqualify us from the hackathon requirements? We're using Raindrop for everything else (services, SmartMemory, deployment, etc.)

---

### 2. Cloudflare Workers Outbound WebSocket Limitation
**Issue:** Cloudflare Workers cannot reliably create outbound WebSocket connections to external APIs.

**Impact on Real-Time Voice Apps:**
- Deepgram STT requires WebSocket for streaming audio transcription
- Workers can ACCEPT WebSocket connections (Twilio → Workers works fine)
- Workers CANNOT CREATE outbound WebSocket connections (Workers → Deepgram fails)
- Tried 3 different approaches, all failed with error 1006

**Workaround Required:**
- Built a simple Node.js WebSocket proxy service
- Deployed separately (Railway/Vercel)
- Workers → Proxy → Deepgram
- Only ~150 lines of code, just forwards bytes

**Questions:**
1. Is this a known limitation of Raindrop/Cloudflare Workers for real-time voice apps?
2. Are there plans to add Durable Objects support to handle stateful/long-lived connections?
3. Would a built-in WebSocket proxy resource be useful for Raindrop (similar to SmartSQL, SmartMemory)?
4. Does using this external proxy (and external DB) disqualify us from the hackathon?

**Architecture (What's Actually Running Where):**
- **Raindrop/Cloudflare Workers:**
  - All services (api-gateway, voice-pipeline, auth-manager, etc.)
  - SmartMemory (conversation history)
  - Voice pipeline orchestration
  - Cerebras AI integration
  - ElevenLabs TTS
  - Twilio integration
  - All business logic

- **External Services (Required Workarounds):**
  - Database: Vultr PostgreSQL (via ai-tools-marketplace.io proxy) - SmartSQL limitations
  - STT Proxy: Node.js service (Railway/Vercel) - Workers WebSocket limitations

**Percentage:** ~90% Raindrop, ~10% external workarounds for platform limitations

**Recommendation for Platform:**
Real-time voice/audio applications are increasingly important for AI. Consider:
- Adding Durable Objects support for stateful connections
- Providing built-in WebSocket proxy resources
- Documenting these limitations clearly for voice app developers
- Offering hybrid runtime options (Workers for APIs, Node.js for real-time)

**This was the biggest technical challenge** - spent hours debugging before realizing it's a fundamental platform limitation, not our code.

