<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║  📋 DAVID'S TODO - DELETE THIS SECTION BEFORE SUBMISSION                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [ ] Demo video URL - replace <!-- VIDEO_URL -->                             ║
║  [ ] Video thumbnail - replace <!-- VIDEO_THUMBNAIL --> (or use hero image)  ║
║  [ ] Email address - replace <!-- EMAIL --> in Judges Letter                 ║
║  [ ] Verify coupon code DEVPOSTJUDGE2025 works and has 50 min credit         ║
║  [ ] Review closing thoughts - personalize if desired                        ║
║  [ ] Delete this TODO block                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
-->

# CallbackApp AI

**Your AI companion, just a phone call away.**

---

[![Built for AI Champion Ship](https://img.shields.io/badge/Hackathon-AI_Champion_Ship_2025-gold?style=for-the-badge)](https://liquidmetal.devpost.com/)

**Built for the [AI Champion Ship Hackathon](https://liquidmetal.devpost.com/) by LiquidMetal.AI + Vultr**

---

![CallbackApp AI Homepage](submission_docs/images/hero_section.png)
*AI companions you can actually call—and who remember you.*

**Platform**
[![Raindrop](https://img.shields.io/badge/Backend-Raindrop-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://raindrop.run)
[![Vultr](https://img.shields.io/badge/DB\/VPS-Vultr-007BFC?style=for-the-badge&logo=vultr&logoColor=white)](https://www.vultr.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Cloudflare](https://img.shields.io/badge/DNS-Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)

**AI & Voice**
[![Cerebras](https://img.shields.io/badge/Inference-Cerebras-FF6B00?style=for-the-badge)](https://cerebras.ai/)
[![Deepgram](https://img.shields.io/badge/STT-Deepgram-13EF93?style=for-the-badge)](https://deepgram.com/)
[![ElevenLabs](https://img.shields.io/badge/TTS-ElevenLabs-000000?style=for-the-badge)](https://elevenlabs.io/)
[![Twilio](https://img.shields.io/badge/Telephony-Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white)](https://www.twilio.com/)

**Services**
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![WorkOS](https://img.shields.io/badge/Auth-WorkOS-6363F1?style=for-the-badge)](https://workos.com/)

*Engineered with [Claude Code](https://claude.ai/code)*

---

## The Problem

**Sometimes you need a call... and no one's available.** Loneliness affects between 20-60% of adults worldwide. But beyond that, life happens at inconvenient times. The 3am anxiety. The pep talk before a big interview. The moment you need to think out loud.

**People need to talk through things:**
- Practice difficult conversations—job interviews, salary negotiations, tough talks with family
- Accountability check-ins for goals and habits (from someone who actually calls)
- Social anxiety practice with low-stakes
- Thinking out loud with a partner who listens and responds

**Life doesn't fit a schedule:**
- Night shift workers, remote workers, travelers across time zones
- Elderly users who struggle with apps but can answer a phone
- Escape calls—"save me from this awkward date"

**Existing solutions forget you.** Every conversation starts from zero. No relationship, no continuity, no one who remembers your dog's name or that you're interviewing at Google next week.

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

New users sign up through a production-ready WorkOS authentication flow (email/password, Google, or GitHub OAuth). Once authenticated, they're ready to verify their phone number and start building relationships with AI personas.

![User Flow - From contacts to call to transcript](submission_docs/images/user_flow.png)
*The complete user journey: Configure your relationship → Schedule a call → Receive the call → Review transcripts*

---

## Under the Hood

### Architecture Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Vercel + Vue 3 | SPA with real-time call UI |
| **Backend** | Raindrop (Cloudflare Workers) | API Gateway, KV Cache for user context, SmartMemory for config |
| **Voice Pipeline** | Vultr VPS | Real-time WebSocket orchestration (Twilio ↔ Deepgram ↔ Cerebras ↔ ElevenLabs) |
| **Scheduler** | Vultr Cron Service | Triggers scheduled calls (daily check-ins, reminders, wake-up calls) |
| **Database** | Vultr PostgreSQL | Personas, users, call history, cost tracking |

**Why multi-cloud?** Cloudflare Workers can't make outbound WebSocket connections—required for real-time voice streaming. The voice pipeline runs on Vultr while Raindrop handles the API layer at the edge.

[View full documentation catalog →](submission_docs/CATALOG.md)

---

### The Voice Pipeline

This core innovation brings us **sub-1000ms voice-to-voice latency** through streaming everything.  Liquidmetal's Raindrop at the edge with Cerebras inference is FAST!

![Voice Call Flow](submission_docs/images/voice_call_flow_complete.png)
*Complete call flow: From button click through Twilio, Voice Pipeline, Deepgram STT, Cerebras inference, ElevenLabs TTS, and back to the user's phone*

The sequence diagram above shows the full journey of a call:
1. **Call Initiation** — User clicks "Call Now", API Gateway routes to Call Orchestrator, credits checked, Twilio initiates outbound call
2. **WebSocket Establishment** — Phone answers, Twilio connects media stream to Voice Pipeline on Vultr
3. **Real-Time Voice Loop** — Audio streams to Deepgram for transcription, Cerebras generates response in <1 second, ElevenLabs streams audio back
4. **Call Termination** — Hang up triggers cleanup, credits deducted, call logged to PostgreSQL

**Key insight:** We use Deepgram Flux for its native turn-taking *events* (`EagerEndOfTurn`, `EndOfTurn`), not just transcription. This enables **speculative response generation**—the AI starts thinking before you finish speaking.

[Deep dive: Voice Pipeline →](submission_docs/voice-pipeline.md)

#### Prompt Assembly (5-Layer Context Injection)

Before each AI response, we assemble a rich system prompt from multiple data sources. This isn't a static prompt—it's dynamically built for each call based on who's calling, why they're calling, and everything the AI knows about them.  Some elements of the prompt are injected on a per-request basis, allowing the call context to develop purposefully during a single call.

<img src="submission_docs/images/prompt_compilation_and_injection.png" alt="Prompt Compilation and Injection Architecture">

The 5 layers combine to create contextual, personalized responses:
- **Layer 1 (Core Identity):** The persona's personality, speaking style, and behavioral guidelines
- **Layer 2 (Call Context):** Why the user is calling right now ("I need help practicing for a job interview")
- **Layer 3 (Relationship):** How long they've known each other, the nature of their relationship
- **Layer 4 (User Knowledge):** Facts extracted from previous conversations (job, family, hobbies, ongoing situations)
- **Layer 5 (Guidelines):** Phone-specific rules like brevity, natural speech patterns, handling interruptions
- **Additional Layers:** Varous prompt elements can be injected during a single conversation.  For example, when a call is approaching the user's max-call duration, the app has the persona tell the user "Hey, we're about done with our time".  That information will be fed into the persona's context so that the persona can maintain a most accurate assessment of what the user and persona are experiencing together.

---

### The Persona Designer (Admin Tool)

Beyond the user-facing app, we built a comprehensive admin tool for designing and debugging personas. This is where the prompt engineering happens.

![Persona Designer Dashboard](submission_docs/images/persona_designer.png)
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
| `mcp-query-service` | AI-assisted log analysis (Currently unutilized)|

[Full documentation →](submission_docs/CATALOG.md)

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

[Full documentation →](submission_docs/CATALOG.md)

---

## Cost Economics

We optimized for **real business viability**.

| Component | Cost per Minute | % of Total |
|-----------|-----------------|------------|
| ElevenLabs (TTS) | $0.059 | 70% |
| Deepgram (STT) | $0.015 | 18% |
| Cerebras (LLM) | $0.002 | 2% |
| Twilio (Voice) | $0.009 | 10% |
| **Total** | **$0.085/min** | 100% |

**At $0.15/min retail pricing = 54% gross margin**

Cerebras is the hero here—sub-second inference at $0.10/1M tokens makes the entire architecture viable.

---

## Hardships & Breakthroughs

Building this wasn't smooth. Here's the real story:

### The WebSocket Audio Nightmare
**12 hours** debugging μ-law audio encoding between Twilio and our pipeline was a slog. Turned out to be a sample rate mismatch that produced nothing but static. Breakthrough: raw PCM inspection with `ffprobe`.

### The Raindrop ↔ PostgreSQL Bridge
Workers can't connect to external databases directly. We built a `database-proxy` service on Vultr that accepts HTTP requests and translates them to SQL. It currently handles 100% of our DB traffic.

[See full documentation →](submission_docs/CATALOG.md)

### The Turn-Taking Puzzle
Early versions had awful timing—AI would talk over users or wait too long. Deepgram Flux's turn-taking events solved this. We now start generating responses at `EagerEndOfTurn` and abort if the user keeps talking.

[See voice pipeline documentation →](submission_docs/voice-pipeline.md)

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

## Letter to the Judges

Building CallbackApp AI has been a six-week journey that made me a better engineer.

Every design decision I made was informed and thought out, and the result of intensive research in many cases.  Getting familiar with all of the partenered tech was exciting, and that barley scratches the surface of what's been required to bring an app like this into the light.  What I'm REALLY looking forward to is dialing in the personas with the prompt scaffoling I've built, and do so with the limited context window of the Llama 8b model (before I start experimenting with larger models and context windows)

Having to move one service off Raindrop got me thinking like an engineer about *every* resource in this hackathon. Vultr isn't just hosting my voice pipeline and PostgreSQL database—it's now where I build and deploy Raindrop services (after 5 weeks of the `raindrop build` command trying to burn down my laptop). The VPS has become my development workhorse.

This experience opened my eyes to future possibilities. I'm planning to use Cerebras and Vultr together to generate synthetic training data for LoRA fine-tuning of the 8B models my personas use. Cerebras inference is so fast it's worth keeping in the stack for data generation, while Vultr can handle the actual training workloads.

No certificate course on cloud engineering or AI could have offered the lab-time I've enjoyed experimenting with these services. The documentation methodology I developed to wrangle the vast research and documentation we (Claude and I) produced into an activly-updated set of useful technical documents and references is its own innovation story that I'm hoping to refine upon independently at a later time.

As far as the app exists current... we're in "hands-off" mode, the included PUNCHLIST doesn't even scratch the surface of what I'd like to do with this app, and the running list of features and possible use-cases keeps getting longer.

Thanks for taking the time to consider and review my app for the 2025 AI Champion Ship Hackathon!  I'm looking forward to seeing everyone else's submission and to getting back to CallbackApp.AI once we've all had a good rest.

### For Demo Access

| Resource | Link |
|----------|------|
| **Live App** | [callbackapp.ai](https://callbackapp.ai) (5 free minutes) |
| **Judge Coupon** | `DEVPOSTJUDGE2025` (50 free minutes) |
Please only use the judge coupon if you are actually a Devpost judge for this hackathon.  Thank you.

---

## Documentation

This project includes 160+ documentation files developed during the hackathon. Selected technical documentation is available in the [submission_docs/](submission_docs/CATALOG.md) folder:

The documentation represents 6 weeks of engineering work across 100+ logged sessions.

| Topic | Document |
|-------|----------|
| **Full Documentation Catalog** | [submission_docs/CATALOG.md](submission_docs/CATALOG.md) |
| **Voice Pipeline** | [submission_docs/voice-pipeline.md](submission_docs/voice-pipeline.md) |
| **Cost Tracking** | [submission_docs/cost-tracking.md](submission_docs/cost-tracking.md) |
| **Punchlist (Roadmap)** | [submission_docs/PUNCHLIST.md](submission_docs/PUNCHLIST.md) |
| **Session Log: WebSocket Fixed** | [submission_docs/session_logs/NEXT_SESSION_LOG_2025-11-22_WEBSOCKET_FIXED.md](submission_docs/session_logs/NEXT_SESSION_LOG_2025-11-22_WEBSOCKET_FIXED.md) |
| **Session Log: Cost Tracking** | [submission_docs/session_logs/NEXT_SESSION_LOG_2025-11-20_COST_TRACKING_IMPLEMENTATION.md](submission_docs/session_logs/NEXT_SESSION_LOG_2025-11-20_COST_TRACKING_IMPLEMENTATION.md) |
| **Session Log: Layer 4 & Turn-Taking** | [submission_docs/session_logs/NEXT_SESSION_LOG_2025-11-26_LAYER4_AND_TURN_TAKING.md](submission_docs/session_logs/NEXT_SESSION_LOG_2025-11-26_LAYER4_AND_TURN_TAKING.md) |
| **Session Log: KV Migration & Strategy** | [submission_docs/session_logs/NEXT_SESSION_LOG_2025-11-26_KV_MIGRATION_COMPLETE_AND_HACKATHON_STRATEGY.md](submission_docs/session_logs/NEXT_SESSION_LOG_2025-11-26_KV_MIGRATION_COMPLETE_AND_HACKATHON_STRATEGY.md) |

---

## Acknowledgments

Built with support from the AI Champion Ship partners:

| Partner | Contribution |
|---------|--------------|
| [**LiquidMetal.AI**](https://liquidmetal.ai) | Raindrop platform, hackathon sponsorship |
| [**Vultr**](https://www.vultr.com/) | Cloud compute, PostgreSQL hosting |
| [**Cerebras**](https://cerebras.ai/) | Lightning-fast LLM inference |
| [**Deepgram**](https://deepgram.com/) | Real-time STT with turn-taking |
| [**ElevenLabs**](https://elevenlabs.io/) | Natural voice synthesis |
| [**Twilio**](https://www.twilio.com/) | Programmable voice infrastructure |
| [**Stripe**](https://stripe.com/) | Payment processing |
| [**WorkOS**](https://workos.com/) | Authentication |
| [**Cloudflare**](https://cloudflare.com/) | DNS, domains, edge network |

### Development Approach

This is a **vibe-coding hackathon submission**—built with AI assistance from start to finish.

The backend was scaffolded using the **Raindrop MCP workflow**, which provided a solid foundation for the API gateway, smart component bindings, and database proxy patterns. From there, [Claude Code](https://claude.ai/code) served as my engineering partner throughout development.  Claude aided in research, planning, designing architecture, debugging real-time WebSocket issues, and iterating on the voice pipeline.

Over 100 session logs helped me document and structure my time and expertly inform Claude's context during the AI-assisted development process.

---
## Closing Thoughts

This started as a hackathon project to experience what I could do with access to the partnered tech, and the project quickly became something I genuinely want to exist in the world.

Loneliness is real, people need access to cognizant interlocutors, and voice creates connection in a way text can't. The engineering challenges were significant; multi-cloud architecture, sub-second latency, designing and compiling persona memory; but the goal was simple: **make it feel talking with someon who listens, can take direction and can hold a conversation.**

As we lay this app down for a small respite during the hands-off period, I'm excited to know I'm a much more relevant engineer than when I arrived to the project (I was relatively new to claude code).

### A note on speed ###
I've never built or engineered anything before with such a continued increase in velocity; What I experienced collaborating with Claude during this hackathon is profound.

For most of my life I had held the since that technology passed from one generation to the next as a sort of baton.  During many turnovers, the baton shines far brighter than when it was last turned over; more brilliant and luminsecent, and providing an ever greater means for clarity and knowledge in the future; but always a baton.

Now, as I find the baton coming nearly in-hand, I see clearly that it's no longer a baton giving light, but a rocket; a brilliant, incendary rocket.  Decide where to point it and find a way to hold on tight.  You'll end up somewhere incredible, and hopefully agreeable and a benefit to all.  

Keep buildilng.  Stay creative and positive.  Thanks for checking out my app.

— David

---

## Author

**David Melsheimer**

- GitHub: [melshiD](https://github.com/melshiD)
- LinkedIn: [David Melsheimer](https://www.linkedin.com/in/david-melsheimer-72a0a4137)

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>CallbackApp AI</b> — Because sometimes you just need someone to talk to.
  <br><br>
  <a href="https://callbackapp.ai">🚀 Try the Live App →</a>
  <br><br>
  <b>Share this project:</b>
  <br><br>
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20CallbackApp%20AI%20-%20AI%20companions%20you%20can%20actually%20call%20%F0%9F%93%9E&url=https://callbackapp.ai">
    <img src="https://img.shields.io/badge/Twitter-Share-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Share on Twitter">
  </a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://callbackapp.ai">
    <img src="https://img.shields.io/badge/LinkedIn-Share-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="Share on LinkedIn">
  </a>
  <a href="https://www.facebook.com/sharer/sharer.php?u=https://callbackapp.ai">
    <img src="https://img.shields.io/badge/Facebook-Share-1877F2?style=for-the-badge&logo=facebook&logoColor=white" alt="Share on Facebook">
  </a>
</p>

<p align="center">
  <img src="public/og-image.png" alt="CallbackApp AI - Your AI companion, just a phone call away" width="600" style="border-radius: 12px;">
</p>
