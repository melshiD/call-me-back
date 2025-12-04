# Start Here - CallbackApp AI Quick Context

**Purpose:** Minimal context to get started. Read domain docs as needed for your specific task.

---

## What Is This App?

AI voice calling service. Users schedule calls from AI personas (Brad, Sarah, Alex). The AI calls them back and has conversations based on persona settings.

*CRITICAL NOTES:*
- DO NOT reveal keys or secrets. Use the script pattern detailed in these documents.
- DO NOT perform git operations other than checking the status and diffs.  You DO NOT perform git add or git commit commands.
- ALWAYS include full timestamps (YYYY-MM-DD HH:MM TZ) in documentation. Run `date "+%Y-%m-%d %H:%M %Z"` first.
- Session logs MUST use format: `NEXT_SESSION_LOG_YYYY-MM-DD_HH-MM_DESCRIPTION.md` (24-hour time, no colons)
- See `documentation/technical/TIME_DOCUMENTATION_STANDARDS.md` for complete timestamp requirements

**Tech Stack:** Vue 3 frontend (Vercel) + Raindrop backend (10 microservices) + Vultr VPS (voice pipeline)

---

## Architecture (30 Second Version)

```
User → Frontend (Vercel) → API Gateway (Raindrop) → Services (Raindrop)
                                ↓
                         Voice Pipeline (Vultr VPS)
                                ↓
                    Twilio → Deepgram → Cerebras → ElevenLabs
```

**Key Services:**
- **Frontend:** Vue 3 app at `frontend/`
- **API Gateway:** Routes all requests (Raindrop service)
- **Voice Pipeline:** Node.js on Vultr, handles real-time voice (5 AI services)
- **Database:** PostgreSQL on Vultr + database-proxy for Cloudflare Workers access

---

## Quick Navigation

**Need to understand X? Read this:**

| Task | Read This First |
|------|----------------|
| Deploy anything | `documentation/domain/deployment.md` |
| Debug a problem | `documentation/domain/debugging.md` (organized BY SYMPTOM) |
| Add/modify API | `documentation/domain/api.md` |
| Frontend changes | `documentation/domain/frontend.md` |
| Database changes | `documentation/domain/database.md` |
| Voice pipeline work | `documentation/domain/voice-pipeline.md` |
| Understand costs | `documentation/domain/cost-tracking.md` |
| Raindrop services | `documentation/domain/raindrop.md` |
| Vultr VPS operations | `documentation/domain/vultr.md` |
| Authentication | `documentation/domain/auth.md` |

**High-level overview:** `PCR2.md` (read this to understand the why and how of this app)

---

## Critical Rules (Don't Skip!)

Read `CRITICAL_RAINDROP_RULES.md` before deploying anything. Key points:

1. **Never `raindrop run build` in root** - Run from `services/` directory
2. **Always check environment** - `raindrop env get` before troubleshooting
3. **Workers can't connect to Vultr directly** - Use database-proxy service
4. **Voice pipeline runs on Vultr** - Not in Raindrop/Workers

---

## Common Debugging Pattern

**Problem:** "Feature X isn't working"

**Steps:**
1. **Identify symptom** - What's the exact error/behavior?
2. **Check `debugging.md`** - Find your symptom (organized BY SYMPTOM)
3. **Follow checklist** - Run the copy-paste commands
4. **Read domain doc** - If you need deeper understanding of that area

**Example:** "Call button not working"
→ Open `documentation/domain/debugging.md`
→ Find "Call Not Connecting?" section
→ Follow the 7-step checklist
→ If needed, read `voice-pipeline.md` for architecture

---

## Repository Structure (Just Enough)

```
call-me-back/
├── frontend/              # Vue 3 app (Vercel)
├── services/              # 10 Raindrop services
│   ├── api-gateway/       # Main API entry point
│   ├── persona-manager/   # Persona CRUD
│   ├── voice-coordinator/ # Twilio integration
│   └── ...                # 7 more services
├── vultr-voice-pipeline/  # Real-time voice (Node.js on Vultr)
├── migrations/            # PostgreSQL migrations
└── documentation/domain/  # READ THESE for details
```

---

## Environment Variables (Where to Look)

**Frontend:** `frontend/.env` (or Vercel dashboard)
**Raindrop:** Stored in Raindrop cloud - `raindrop env list` to see them
**Vultr:** `/root/voice-pipeline/.env` on VPS

**Common issue:** Missing env vars. Check `deployment.md` for complete list.

---

## How to Get Help from This Codebase

**❌ Don't do this:**
"Read me all the documentation so I understand everything"

**✅ Do this instead:**
1. "I need to debug the call button on admin dashboard"
2. Bot reads `debugging.md` (symptom-based)
3. Bot reads `api.md` (just the call trigger endpoint)
4. Bot reads `frontend.md` (just the admin dashboard view)
5. Bot has 90% of what it needs, didn't read 11,000 lines

**The domain docs are comprehensive but you only read what you need.**

---

## Task-Specific Starting Points

### "Debug the voice pipeline"
→ Read `voice-pipeline.md` + `debugging.md` (WebSocket/audio sections)

### "Add a new API endpoint"
→ Read `api.md` (patterns section) + `raindrop.md` (api-gateway service)

### "Change the frontend UI"
→ Read `frontend.md` (component structure + Tailwind CSS section)

### "Deploy to production"
→ Read `deployment.md` + `CRITICAL_RAINDROP_RULES.md`

### "Modify database schema"
→ Read `database.md` (migrations section)

### "Understand costs/pricing"
→ Read `cost-tracking.md` (API cost breakdown)

### "Fix authentication issue"
→ Read `auth.md` (JWT or OAuth section as needed)

### "SSH into Vultr and fix something"
→ Read `vultr.md` (PM2 processes + troubleshooting)

---

## Example Session Pattern

**User says:** "This session, work on debugging the websocket call button on the admin personas dashboard"

**Bot should:**
1. ✅ Read `frontend.md` - Find admin dashboard structure (AdminDashboard.vue, PersonaConfig.vue)
2. ✅ Read `api.md` - Find call trigger endpoint (`POST /api/calls/trigger`)
3. ✅ Read `debugging.md` - Find WebSocket troubleshooting section
4. ✅ Read relevant source files - The actual Vue components and API service
5. ✅ Start debugging with context

**Bot should NOT:**
- ❌ Read all 10 domain docs (11,675 lines)
- ❌ Read PCR2.md (high-level, not needed for specific debugging)
- ❌ Read voice-pipeline.md (not relevant to admin dashboard button)
- ❌ Read deployment.md (not deploying anything)

**Result:** Bot has targeted context, ready to work efficiently.

---

## Mental Model for This Codebase

**Think of it like layers:**

1. **User clicks button** (Frontend - Vue 3)
2. **API request** (API Gateway - Raindrop)
3. **Service processes** (Specific service - Raindrop)
4. **Data storage** (PostgreSQL via database-proxy)
5. **Voice call** (Voice pipeline on Vultr → Twilio → AI services)

**Most bugs happen at layer boundaries.** Check:
- CORS (frontend ↔ API)
- Auth tokens (frontend → API)
- Service communication (gateway → services)
- Database access (Workers → database-proxy → PostgreSQL)
- WebSocket connection (Twilio → voice pipeline)

---

## Red Flags (Common Mistakes)

🚨 **"I'll use SmartSQL for this"** → NO! We use PostgreSQL on Vultr (see `database.md` for why)

🚨 **"Let me run the voice pipeline in Cloudflare Workers"** → NO! Workers can't make outbound WebSocket connections

🚨 **"I'll connect directly to PostgreSQL from Workers"** → NO! Use database-proxy service

🚨 **"I'll deploy without reading CRITICAL_RAINDROP_RULES.md"** → NO! Read it first!

---

## When You're Stuck

**Check these in order:**

1. **Logs** - See `debugging.md` for log commands
   - Raindrop: `raindrop logs tail [service-name]`
   - Vultr: `pm2 logs [process-name]`
   - Frontend: Browser console

2. **Environment** - Are env vars set?
   - `raindrop env list` (backend)
   - Check Vercel dashboard (frontend)
   - `cat /root/voice-pipeline/.env` (Vultr)

3. **Services running?** - On Vultr: `pm2 status`

4. **Domain docs** - Read the relevant section

5. **Ask for help** - With specific error messages and what you've tried

---

## That's It!

**You now know:**
- ✅ What the app does
- ✅ Basic architecture
- ✅ Where to look for specific topics
- ✅ How to avoid common mistakes
- ✅ Debugging pattern

**Don't read everything. Read what you need when you need it.**

**When coding, the domain docs have your back when you need details.**

---

## One-Line Summary for Bots

"CallbackApp AI" is a Vue 3 + Raindrop + Vultr app for AI voice calls. Read domain docs in `documentation/domain/` on-demand for your specific task. Start with `debugging.md` if debugging (organized by symptom), or the relevant domain doc for your area of work.

Now that you have an understanding of what this app is and how to navigate youself to the resoures you need to work on it, return to the user to ask them what they want to focus on this session.  The user will have a primary focus, but may have a secondary and terciary as well.  He will tell you if this is the case, or you can infer from his answer.

## BEFORE CREATING ANY DOCUMENTATION:
1. Run `date "+%Y-%m-%d %H:%M %Z"` to get current timestamp
2. Use format `NEXT_SESSION_LOG_YYYY-MM-DD_HH-MM_DESCRIPTION.md` for session logs
3. Include full timestamps in all document headers
4. Never use relative time references ("yesterday", "recently")
5. Read `documentation/technical/TIME_DOCUMENTATION_STANDARDS.md` if unclear

When you return to the user, follow this procedure:
### You DO understand the purpose and procedures explained in this (START_HERE.md) file ###
- Ask the user "what would you like to focus on this session?"
- Wait for the user's reply

### You DO NOT understand the purpose and procedures explained in this (START_HERE.md) file ###
- Ask the user a question designed to help you orient yourself and find understanding of the project and task.
