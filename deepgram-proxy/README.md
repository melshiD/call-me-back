# Deepgram WebSocket Proxy

Simple Node.js WebSocket proxy to bridge Cloudflare Workers and Deepgram STT API.

## Quick Deploy to Railway

```bash
cd deepgram-proxy
npm install

# Deploy to Railway (easiest option)
npx @railway/cli@latest init
npx @railway/cli@latest up
npx @railway/cli@latest variables set DEEPGRAM_API_KEY=<your-key-here>
npx @railway/cli@latest domain  # Get your URL
```

## Local Testing

```bash
npm install
cp .env.example .env
# Edit .env and add DEEPGRAM_API_KEY
npm start
```

## What It Does

Accepts WebSocket from Workers → Connects to Deepgram → Proxies bidirectionally

That's it. ~150 lines. Just forwards bytes.
