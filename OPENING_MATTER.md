App: Call Me Back (working title)
Goal: Build a real phone-call–based AI companion that calls a user on demand (or on a timer) and carries out a short, believable conversation—useful for escaping awkward moments or providing comfort.

Core Entities

Users – registration, authentication (optional for MVP), saved phone numbers, billing info.

Calls – outbound Twilio call records (sid, status, start_time, end_time, duration, cost).

Personas – prebuilt AI personalities (“Friend,” “Manager,” “Agent”) with system prompts and voices.

Payments – Stripe PaymentIntent objects for per-call billing (connection + per-minute rate).

Logs – conversation transcripts, durations, errors, usage stats.

Core Features

Trigger/Schedule Call – user enters number + persona → backend calls via Twilio Programmable Voice.

Live Voice Pipeline – Twilio Media Stream → backend WS → STT + AI inference → ElevenLabs TTS → back to Twilio <Play> stream.

Dynamic Persona Prompting – inject persona data and context memory via Raindrop SmartMemory.

Latency Optimization – route inference through Cerebras for sub-second response; fallback to OpenAI Realtime.

Per-Call Billing –

Minimum connection fee ($0.25) + per-minute rate ($0.40).

Pre-auth via Stripe PaymentIntent (manual capture).

Capture actual amount using Twilio’s call duration on completion.

Dashboard – show call history, cost, and duration; admin stats via Raindrop SmartSQL.

API Requirements

REST Endpoints

POST /call – trigger call (requires valid PaymentIntent).

POST /twilio/answer – TwiML to start media stream.

WS /twilio/stream – receive audio, send to AI pipeline.

POST /stripe/webhook – finalize billing.

GET /calls – list user calls (paginated).

Authentication: JWT or session cookie.

Authorization: Users only see their own calls.

Input Validation: phone format, persona key, payment token.

Error Handling: failed call, AI timeout, or payment decline.

Tech Stack

Frontend: Vue.js (mobile-friendly rescue UI).

Backend: Node.js + Express + WebSocket.

Telephony: Twilio Programmable Voice (outbound, media streams).

AI Layer: Raindrop MCP + Claude Code for orchestration; Cerebras inference for replies; fallback OpenAI Realtime.

TTS: ElevenLabs API.

Payments: Stripe (manual capture).

Storage: Raindrop SmartBuckets / S3 for temp audio + logs.

Hosting: Fly.io or Vultr (WebSocket support).

System Flow
User → /call → Stripe pre-auth → Twilio call
Twilio → /twilio/answer → WS stream
WS → STT → AI model → ElevenLabs → Twilio Play
Twilio → status callback → Stripe capture → /calls log

Metrics & Goals

< 3 s response per turn (Cerebras target < 1 s).

90% successful connection rate.

<$0.25/min operating cost.

Hackathon deliverable: working demo, video, README highlighting Raindrop + ElevenLabs + Cerebras usage.

Future Enhancements

Real-time bidirectional streaming.

User-defined voices (ElevenLabs cloning).

Subscription tiers (flat monthly minutes).

Contextual scheduling (calendar integration).

## With that stack and set of requirements in mind, let's build out a plan to use the Raindrop MCP server to build out this whole app.
