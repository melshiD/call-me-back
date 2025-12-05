<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║  📋 DAVID'S TODO - DELETE THIS SECTION BEFORE SUBMISSION                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [ ] Demo video URL - replace <!-- VIDEO_URL -->                             ║
║  [ ] Video thumbnail - replace <!-- VIDEO_THUMBNAIL --> (or use hero image)  ║
║  [ ] GitHub username - replace <!-- GITHUB_USERNAME --> (3 places)           ║
║  [ ] LinkedIn URL - replace <!-- LINKEDIN_URL --> (2 places)                 ║
║  [ ] Email address - replace <!-- EMAIL --> in Judges Letter                 ║
║  [ ] Verify coupon code DEVPOSTJUDGE2025 works and has 50 min credit         ║
║  [ ] Review closing thoughts - personalize if desired                        ║
║  [ ] Delete this TODO block                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
-->

# CallbackApp AI

**Your AI companion, just a phone call away.**

---

[![Built for AI Championship](https://img.shields.io/badge/Hackathon-AI_Championship_2025-gold?style=for-the-badge)](https://liquidmetal.devpost.com/)

[![Cloudflare Raindrop](https://img.shields.io/badge/Built_with-Raindrop-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://raindrop.run)
[![Vultr](https://img.shields.io/badge/Powered_by-Vultr-007BFC?style=for-the-badge&logo=vultr&logoColor=white)](https://www.vultr.com/)
[![Cerebras](https://img.shields.io/badge/Inference-Cerebras-FF6B00?style=for-the-badge)](https://cerebras.ai/)
[![Deepgram](https://img.shields.io/badge/STT-Deepgram-13EF93?style=for-the-badge)](https://deepgram.com/)
[![ElevenLabs](https://img.shields.io/badge/TTS-ElevenLabs-000000?style=for-the-badge)](https://elevenlabs.io/)
[![Twilio](https://img.shields.io/badge/Voice-Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white)](https://www.twilio.com/)

**Built for and submitted to the [AI Championship Hackathon](https://liquidmetal.devpost.com/) by LiquidMetal.AI + Vultr**

---

![CallbackApp AI Homepage](eval_images/hero_section.png)
*AI companions you can actually call—and who remember you.*

---

## The Problem

**Loneliness is an epidemic.** 60% of US adults report feeling lonely. People need someone to talk to—not type at.

**Chat isn't enough.** Text-based AI feels transactional. Voice creates presence, warmth, connection.

**Existing solutions forget you.** Every conversation starts from zero. There's no relationship, no continuity, no one who knows your dog's name.

---

## The Solution

**CallbackApp AI** gives you AI companions you can actually *call*—and who *remember* you.

| Feature | Description |
|---------|-------------|
| **Real phone calls** | Your phone rings. You answer. You talk. |
| **Persistent memory** | The AI remembers your life—your job, your family, your ongoing situations |
| **Scheduled callbacks** | Daily check-ins, wake-up calls, accountability reminders |
| **Custom personas** | Create AI friends with the personality you want |
| **Sub-second responses** | Natural conversation flow powered by Cerebras |

---

## See It In Action

<!-- VIDEO: Replace with your demo video thumbnail when ready -->
[![Watch the Demo Video](<!-- VIDEO_THUMBNAIL -->)](<!-- VIDEO_URL -->)

*3-minute walkthrough of the complete experience*

---

## The User Experience

![User Flow - From contacts to call to transcript](eval_images/user_flow.png)
*The complete user journey: Configure your relationship → Schedule a call → Receive the call → Review transcripts*

---

## Under the Hood

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CALLBACKAPP AI ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐     ┌──────────────────────────────────────────────┐    │
│   │   VERCEL     │     │         CLOUDFLARE RAINDROP                  │    │
│   │   Vue 3 SPA  │────▶│  12 Microservices + SmartSQL + KV Cache      │    │
│   └──────────────┘     └──────────────────────────────────────────────┘    │
│                                         │                                   │
│                                         ▼                                   │
│                        ┌────────────────────────────────┐                  │
│                        │         VULTR VPS              │                  │
│                        │  ┌─────────────────────────┐   │                  │
│                        │  │    Voice Pipeline       │   │                  │
│                        │  │  Twilio ↔ Deepgram ↔    │   │                  │
│                        │  │  Cerebras ↔ ElevenLabs  │   │                  │
│                        │  └─────────────────────────┘   │                  │
│                        │  ┌─────────────────────────┐   │                  │
│                        │  │    PostgreSQL 14        │   │                  │
│                        │  └─────────────────────────┘   │                  │
│                        └────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why multi-cloud?** Cloudflare Workers can't make outbound WebSocket connections—required for real-time voice streaming. We run the voice pipeline on Vultr VPS while keeping the API layer on Raindrop for edge performance.

[View full architecture diagram →](documentation/diagrams/architecture-diagram.mmd)

---

### The Voice Pipeline

This core innovation brings us **sub-1000ms voice-to-voice latency** through streaming everything.

![Voice Call Flow](documentation/diagrams/voice_call_flow_complete.png)
*Complete call flow: From button click through Twilio, Voice Pipeline, Deepgram STT, Cerebras inference, ElevenLabs TTS, and back to the user's phone*

The sequence diagram above shows the full journey of a call:
1. **Call Initiation** — User clicks "Call Now", API Gateway routes to Call Orchestrator, credits checked, Twilio initiates outbound call
2. **WebSocket Establishment** — Phone answers, Twilio connects media stream to Voice Pipeline on Vultr
3. **Real-Time Voice Loop** — Audio streams to Deepgram for transcription, Cerebras generates response in <1 second, ElevenLabs streams audio back
4. **Call Termination** — Hang up triggers cleanup, credits deducted, call logged to PostgreSQL

**Key insight:** We use Deepgram Flux for its native turn-taking *events* (`EagerEndOfTurn`, `EndOfTurn`), not just transcription. This enables **speculative response generation**—the AI starts thinking before you finish speaking.

[Deep dive: Voice Pipeline →](documentation/domain/voice-pipeline.md)

#### Prompt Assembly (5-Layer Context Injection)

Before each AI response, we assemble a rich system prompt from multiple data sources. This isn't a static prompt—it's dynamically built for each call based on who's calling, why they're calling, and everything the AI knows about them.

<img src="documentation/diagrams/prompt_injection.svg" alt="Prompt Injection Architecture" width="600">

The 5 layers combine to create contextual, personalized responses:
- **Layer 1 (Core Identity):** The persona's personality, speaking style, and behavioral guidelines
- **Layer 2 (Call Context):** Why the user is calling right now ("I need help practicing for a job interview")
- **Layer 3 (Relationship):** How long they've known each other, the nature of their relationship
- **Layer 4 (User Knowledge):** Facts extracted from previous conversations (job, family, hobbies, ongoing situations)
- **Layer 5 (Guidelines):** Phone-specific rules like brevity, natural speech patterns, handling interruptions

---

### The Persona Designer (Admin Tool)

Beyond the user-facing app, we built a comprehensive admin tool for designing and debugging personas. From this panel, site admins can quickly modify aspects of a persona.  An admin can engineer new core persona prompts, edit the contents of a persona's "User Knowledge" store, and set the standard call configurations as well as additional "AI parameteres".

Once the site admin has a configuration they want to test, they can call the persona through Twilio (as all user call are handled) or through a separate web audio pipeline.

![Persona Designer Dashboard](eval_images/persona_designer.png)
*The Persona Designer showing Alex's configuration: core prompt editor, live "Compiled Final Prompt" preview, and 43 extracted user facts*

**What makes this powerful:**
- **Real-time preview:** See exactly what system prompt the AI receives, including all injected context
- **Layer visibility:** Expand/collapse each layer to understand how context flows
- **Fact inspection:** View all facts the AI has learned about a user across conversations
- **Parameter tuning:** Adjust temperature and token limits per-persona for different conversation styles
- **Multi-persona switching:** Quickly compare how different personas handle the same user context

---

### The 12 Microservices

All running on Cloudflare Raindrop:

| Service | Purpose |
|---------|---------|
| `api-gateway` | Request routing, CORS, JWT validation |
| `auth-manager` | User registration, WorkOS OAuth |
| `persona-manager` | Persona CRUD, favorites |
| `call-orchestrator` | Trigger calls, track status |
| `userdata-manager` | KV-backed user preferences |
| `payment-processor` | Stripe checkout sessions |
| `webhook-handler` | Twilio + Stripe webhooks |
| `database-proxy` | HTTP → PostgreSQL bridge |
| `log-ingest` | Call logs and analytics |
| `cost-analytics` | Usage dashboards |
| `scheduled-call-executor` | Cron-triggered callbacks |
| `mcp-query-service` | AI-assisted log analysis |

[Full service documentation →](documentation/domain/raindrop.md)

---

### Data & Memory Architecture

**PostgreSQL on Vultr** — 12 tables including:
- `users`, `personas`, `calls`, `credits`
- `user_persona_context` — Per-relationship memory
- `persona_facts` — Extracted knowledge about users

**Raindrop KV Cache** — 4 namespaces:
- `user_context:{userId}:{personaId}` — Hot memory for calls
- `rate-limit-cache` — API protection
- `token-blacklist` — JWT revocation
- `call-state` — In-progress call tracking

[Database architecture →](documentation/domain/database.md)

---

## Cost Economics

We optimized for **real business viability**, not just a demo.

| Component | Cost per Minute | % of Total |
|-----------|-----------------|------------|
| ElevenLabs (TTS) | $0.059 | 70% |
| Deepgram (STT) | $0.015 | 18% |
| Cerebras (LLM) | $0.002 | 2% |
| Twilio (Voice) | $0.009 | 10% |
| **Total** | **$0.085/min** | 100% |

**At $0.15/min retail pricing = 54% gross margin**

Cerebras is the hero here—sub-second inference at $0.10/1M tokens makes the entire architecture viable.

[Full cost analysis →](documentation/domain/cost-tracking.md)

---

## Hardships & Breakthroughs

Building this wasn't smooth. Here's the real story:

### The WebSocket Audio Nightmare
**12 hours** debugging μ-law audio encoding between Twilio and our pipeline. Turned out to be a sample rate mismatch that produced nothing but static. Breakthrough: raw PCM inspection with `ffprobe`.

### The Raindrop ↔ PostgreSQL Bridge
Workers can't connect to external databases directly. We built a `database-proxy` service on Vultr that accepts HTTP requests and translates them to SQL. Now it handles 100% of our DB traffic.

[The full debugging story →](documentation/raindrop/RAINDROP_DEPLOYMENT_BREAKTHROUGH.md)

### The Turn-Taking Puzzle
Early versions had awful timing—AI would talk over users or wait too long. Deepgram Flux's turn-taking events solved this. We now start generating responses at `EagerEndOfTurn` and abort if the user keeps talking.

[Interruption fix documentation →](documentation/features/INTERRUPTION_FIX_2025-11-22.md)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Vue 3, Pinia, Tailwind CSS | SPA on Vercel |
| **API** | Cloudflare Raindrop (Hono) | 12 edge microservices |
| **Database** | PostgreSQL 14 on Vultr | Persistent storage |
| **Cache** | Raindrop KV | Hot data, rate limiting |
| **Voice** | Vultr VPS (Node.js) | WebSocket streaming |
| **STT** | Deepgram Flux | Real-time transcription + turn-taking |
| **LLM** | Cerebras (Llama 3.1 8B) | Sub-200ms inference |
| **TTS** | ElevenLabs (turbo_v2.5) | Natural voice synthesis |
| **Telephony** | Twilio | Outbound/inbound calls |
| **Auth** | WorkOS | OAuth + session management |
| **Payments** | Stripe | Subscriptions + credits |

---

## For Hackathon Judges

Thank you for reviewing this submission.

I've prepared a **[Letter to the Judges](documentation/submission/JUDGES_LETTER.md)** with:
- A demo coupon code for **50 free minutes**
- Links to all technical documentation
- The honest roadmap of what's next
- A request for feedback (win or lose)

The documentation represents 6 weeks of engineering work across 100+ logged sessions. I have pushed this app to as close production ready as I could before the hands-off for submission.

---

## Try It Live

| Resource | Link |
|----------|------|
| **Live App** | [callbackapp.ai](https://callbackapp.ai) |
| **Demo Video** | [Watch Demo](<!-- VIDEO_URL -->) |
| **Judge Coupon** | See [Letter to Judges](documentation/submission/JUDGES_LETTER.md) |

---

## Documentation Index

| Topic | Document |
|-------|----------|
| **Voice Pipeline** | [documentation/domain/voice-pipeline.md](documentation/domain/voice-pipeline.md) |
| **Database Schema** | [documentation/domain/database.md](documentation/domain/database.md) |
| **API Reference** | [documentation/domain/api.md](documentation/domain/api.md) |
| **Raindrop Services** | [documentation/domain/raindrop.md](documentation/domain/raindrop.md) |
| **Cost Tracking** | [documentation/domain/cost-tracking.md](documentation/domain/cost-tracking.md) |
| **Deployment** | [documentation/domain/deployment.md](documentation/domain/deployment.md) |
| **Auth System** | [documentation/domain/auth.md](documentation/domain/auth.md) |
| **Debugging Guide** | [documentation/domain/debugging.md](documentation/domain/debugging.md) |
| **Tech Manual Index** | [documentation/tech_manual/DOC_INDEX.md](documentation/tech_manual/DOC_INDEX.md) |

---

## Quick Start (Local Development)

```bash
# Clone
git clone https://github.com/<!-- GITHUB_USERNAME -->/call-me-back.git
cd call-me-back

# Install
npm install

# Run frontend
npm run dev

# Open http://localhost:3000
```

[Full deployment guide →](documentation/domain/deployment.md)

---

## Closing Thoughts

This started as a hackathon project and became something I genuinely want to exist in the world.

Loneliness is real, and voice creates connection in a way text can't. The engineering challenge was significant—multi-cloud architecture, sub-second latency, persistent memory—but the goal was simple: **make it feel like calling a friend.**

Whether this wins or not, I'm going to keep building it.

— David

---

## Acknowledgments

Built with support from the AI Championship partners:

| Partner | Contribution |
|---------|--------------|
| [**LiquidMetal.AI**](https://liquidmetal.ai) | Raindrop platform, hackathon sponsorship |
| [**Vultr**](https://www.vultr.com/) | Cloud compute, PostgreSQL hosting |
| [**Cerebras**](https://cerebras.ai/) | Lightning-fast LLM inference |
| [**Deepgram**](https://deepgram.com/) | Real-time STT with turn-taking |
| [**ElevenLabs**](https://elevenlabs.io/) | Natural voice synthesis |
| [**Twilio**](https://www.twilio.com/) | Programmable voice infrastructure |

---

## Author

**David Melsheimer**

- GitHub: [<!-- GITHUB_USERNAME -->](https://github.com/<!-- GITHUB_USERNAME -->)
- LinkedIn: [<!-- LINKEDIN_URL -->](<!-- LINKEDIN_URL -->)

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>CallbackApp AI</b> — Because sometimes you just need someone to talk to.
  <br><br>
  <a href="https://callbackapp.ai">Try the Live Demo →</a>
</p>
