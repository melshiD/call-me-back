# CallbackApp AI

**AI Voice Companions That Call You Back**

A production-ready AI voice calling platform where users receive phone calls from customizable AI personas. Built for the [Raindrop AI Championship Hackathon](https://devpost.com/).

**Live App:** [https://callbackapp.ai](https://callbackapp.ai)

---

## What It Does

Call Me Back enables real-time AI voice conversations over the phone:

- **Schedule calls** from AI personas (Brad the Coach, Sarah the Friend, Alex the Creative)
- **Receive inbound calls** - call your persona directly at their Twilio number
- **Persistent memory** - personas remember facts about you across conversations
- **Per-persona customization** - adjust prompts, voices, and LLM models
- **Real-time transcription** - see live conversation transcripts
- **Cost tracking** - per-call cost breakdown with budget controls

---

## Architecture

![Call Flow Sequence Diagram](eval_images/screenshot_20251130_013719.png)

### Multi-Cloud Design

The system runs across three cloud platforms due to technical constraints:

| Platform | Purpose | Why Here |
|----------|---------|----------|
| **Vercel** | Vue 3 Frontend | Static hosting, global CDN |
| **Raindrop (Cloudflare Workers)** | 12 Microservices | Serverless API, auth, orchestration |
| **Vultr VPS** | Voice Pipeline + PostgreSQL | Workers can't make outbound WebSockets |

### Voice Pipeline Flow

```
User speaks → Twilio (phone) → Voice Pipeline (Vultr)
                                      ↓
                              Deepgram Flux (STT)
                                      ↓
                              Cerebras AI (LLM)
                                      ↓
                              ElevenLabs (TTS)
                                      ↓
                              Twilio → User hears response
```

**Latency:** Sub-1-second responses using Cerebras inference + Deepgram Flux turn-taking

---

## Key Features

### 1. Deepgram Flux Turn-Taking
Native end-of-turn detection using Deepgram's Flux model. No silence-based heuristics - the AI knows when you're done speaking.

- `EndOfTurn` - User finished speaking
- `EagerEndOfTurn` - Speculative early response
- `TurnResumed` - User continued, cancel speculative response

### 2. Per-Persona LLM Model Selection
Choose between speed and intelligence per persona:

| Model | Speed | Cost | Use Case |
|-------|-------|------|----------|
| Llama 3.1 8B | Fastest | $0.10/1M tokens | Quick responses, casual chat |
| Llama 3.3 70B | Fast | $0.60/1M tokens | Complex reasoning, coaching |

### 3. 4-Layer Prompt Architecture
Personas use a composable prompt system:

1. **Core System Prompt** - Base personality and traits
2. **Call Context** - Current call situation and goals
3. **Relationship Context** - History with this user
4. **User Knowledge** - Facts learned about the user

### 4. Cost Tracking
Real-time per-call cost calculation:

- Twilio voice minutes
- Deepgram STT usage
- Cerebras token consumption
- ElevenLabs character usage

### 5. WorkOS Authentication
Enterprise-grade OAuth with:
- Google/GitHub social login
- Email/password authentication
- Secure session management

### 6. Stripe Payments
Production payment processing with:
- Credit-based billing
- Coupon codes (JUDGE2025, HACKATHON2025, DEMO2025)
- Webhook-driven credit allocation

---

## Tech Stack

### Frontend
- **Vue 3** with Composition API
- **Pinia** for state management
- **Tailwind CSS v4** for styling
- **Vite** for build tooling

### Backend (Raindrop)
12 microservices on Cloudflare Workers:

| Service | Purpose |
|---------|---------|
| `api-gateway` | Request routing, CORS, JWT validation |
| `auth-manager` | JWT auth, WorkOS OAuth integration |
| `persona-manager` | Persona CRUD, favorites, customization |
| `call-orchestrator` | Twilio call lifecycle, scheduling |
| `database-proxy` | Bridge to Vultr PostgreSQL |
| `payment-processor` | Stripe integration |
| `webhook-handler` | Twilio/Stripe webhook processing |
| `cost-analytics` | Usage tracking, cost calculation |
| `scheduled-call-executor` | Cron-based call execution |
| `voice-coordinator` | TwiML generation, stream routing |
| `admin-dashboard` | Admin API and OAuth |
| `billing-manager` | Credit management |

### Voice Pipeline (Vultr)
- **Node.js** with WebSocket servers
- **PM2** for process management
- **Caddy** for SSL termination

### External APIs
| Service | Purpose | Model |
|---------|---------|-------|
| **Twilio** | Phone calls, SMS verification | Programmable Voice |
| **Deepgram** | Speech-to-text | Flux (streaming) |
| **Cerebras** | LLM inference | Llama 3.1 8B / 3.3 70B |
| **ElevenLabs** | Text-to-speech | Turbo v2.5 |
| **WorkOS** | Authentication | AuthKit |
| **Stripe** | Payments | Checkout + Webhooks |

### Database
- **PostgreSQL 14** on Vultr VPS
- 12+ tables (users, personas, calls, credits, etc.)
- HTTP proxy for Cloudflare Workers access

---

## Cost Economics

### Per 5-Minute Call Breakdown

| Service | Cost |
|---------|------|
| Twilio (voice) | $0.070 |
| Deepgram (STT) | $0.030 |
| Cerebras (8B model) | $0.005 |
| ElevenLabs (TTS) | $0.300 |
| Infrastructure | $0.020 |
| **Total** | **~$0.43** |

ElevenLabs TTS represents ~70% of per-call costs.

---

## Demo Access

### Test the App
1. Visit [https://callbackapp.ai](https://callbackapp.ai)
2. Sign up with Google/GitHub or email
3. Use coupon code `JUDGE2025` for free credits
4. Schedule a call or add a persona to contacts

### Demo Account
```
Email:    demo@callmeback.ai
Password: demo123
Credits:  100
```

### System Personas
- **Brad** - Your bro who keeps it real (Coach)
- **Sarah** - Warm, empathetic friend (Friend)
- **Alex** - Energetic creative thinker (Creative)

---

## Project Structure

```
call-me-back/
├── src/
│   ├── views/                 # Vue components
│   ├── stores/                # Pinia state management
│   ├── api-gateway/           # Main API router
│   ├── auth-manager/          # Authentication service
│   ├── persona-manager/       # Persona CRUD
│   ├── call-orchestrator/     # Call lifecycle
│   ├── database-proxy/        # PostgreSQL bridge
│   ├── payment-processor/     # Stripe integration
│   └── ...                    # 6 more services
├── voice-pipeline-nodejs/     # Real-time voice (Vultr)
├── vultr-db-proxy/           # Database HTTP API (Vultr)
├── migrations/               # PostgreSQL migrations
├── documentation/
│   ├── domain/               # Technical deep-dives
│   └── session_logs/         # Development history
└── raindrop.manifest         # Service definitions
```

---

## Development

### Prerequisites
- Node.js 18+
- Raindrop CLI (`npm install -g raindrop-cli`)
- Vercel CLI (`npm install -g vercel`)

### Local Development
```bash
# Install dependencies
npm install

# Start frontend dev server
npm run dev

# Deploy backend (Raindrop)
cd services && raindrop build deploy

# Deploy frontend (Vercel)
vercel --prod
```

### Environment Variables
See `CRITICAL_RAINDROP_RULES.md` for complete list. Key secrets:
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `DEEPGRAM_API_KEY`
- `CEREBRAS_API_KEY`
- `ELEVENLABS_API_KEY`
- `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## Documentation

| Document | Purpose |
|----------|---------|
| `PCR2.md` | Complete project context |
| `CRITICAL_RAINDROP_RULES.md` | Deployment rules |
| `documentation/domain/voice-pipeline.md` | Voice architecture |
| `documentation/domain/api.md` | API reference |
| `documentation/domain/cost-tracking.md` | Cost analysis |

---

## Hackathon Submission

**Event:** Raindrop AI Championship (Devpost)

### Raindrop Features Used
- **12 Microservices** - Full serverless backend
- **Environment Variables** - Secure secret management
- **Database Proxy Pattern** - PostgreSQL access from Workers
- **Scheduled Tasks** - Cron-based call execution

### What Makes This Special
1. **Real voice calls** - Not a chatbot, actual phone conversations
2. **Sub-second latency** - Cerebras + Deepgram Flux = natural conversations
3. **Persistent memory** - Personas remember you across calls
4. **Production-ready** - Stripe payments, WorkOS auth, cost tracking

---

## License

MIT

---

Built with Raindrop, Cerebras, Deepgram, ElevenLabs, and Twilio.
