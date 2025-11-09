# Call Me Back - Documentation Index

**Last Updated:** 2025-01-08
**Purpose:** Guide for developers and AI assistants working on this project

---

## 📚 Quick Navigation

All detailed documentation is located in the `/documentation` folder. This index provides a quick reference to help you find what you need.

---

## 🎯 Start Here

### For New Developers:
1. Read **HOW_THIS_APP_WORKS.md** first - comprehensive technical overview
2. Review **DEPLOYMENT_QUICKSTART.md** - get the app running
3. Check **API_SPECIFICATION.md** - understand the API structure
4. Read **IMPLEMENTATION_PLAN.md** - Next features to build

### For AI Assistants Resuming Work:
1. **HOW_THIS_APP_WORKS.md** - Full system architecture and flow
2. **IMPLEMENTATION_PLAN.md** - Pending implementation tasks
3. **SCENARIO_FEATURE_IMPLEMENTATION.md** - Latest feature status
4. **HARDCODED_COST_VALUES.md** - Where cost constants are located
5. **API_COSTS_AND_PROFITABILITY_2025.md** - Pricing strategy and financials

---

## 📖 Documentation Files

### 🏗️ Architecture & Design

#### **HOW_THIS_APP_WORKS.md** (44KB - Most Important)
**Purpose:** Comprehensive technical reference for the entire application
**Contains:**
- Complete system flow (frontend → backend → external APIs)
- All file structure and organization
- Database schema with all 12 tables
- 4-tier memory system explanation
- Cost tracking system
- Voice pipeline architecture
- Every service's responsibility
- Code patterns and conventions
- Testing strategy

**When to read:**
- Starting work on the project
- Resuming after a break
- Need to understand how pieces fit together
- Debugging cross-service issues

---

#### **PERSONA_MEMORY_ARCHITECTURE.md** (18KB)
**Purpose:** Deep dive into the 4-tier memory system
**Contains:**
- Working Memory (Tier 1) - Real-time call context
- Short-Term Memory (Tier 2) - Recent call summaries
- Long-Term Memory (Tier 3) - Persistent facts and relationships
- Episodic Memory (Tier 4) - Full conversation transcripts
- SmartMemory integration patterns
- Memory lifecycle and cleanup
- User privacy controls

**When to read:**
- Working on persona relationship features
- Implementing memory extraction AI
- Building memory editor UI
- Understanding data persistence

---

#### **COST_TRACKING_ARCHITECTURE.md** (19KB)
**Purpose:** Complete cost tracking system specification
**Contains:**
- Per-service cost breakdowns (Twilio, ElevenLabs, Cerebras, etc.)
- Event-level logging design
- Budget control mechanisms
- Real-time cost accumulation
- Pre-call cost estimation
- User-facing cost projections
- Database schema for cost tables

**When to read:**
- Working on billing features
- Implementing cost warnings
- Building analytics dashboard
- Debugging cost calculation issues

---

### 🚀 Implementation & Features

#### **SCENARIO_FEATURE_IMPLEMENTATION.md** (14KB)
**Purpose:** Pre-call scenario feature - implementation complete
**Status:** ✅ Backend 100% | ⏳ Frontend 95%
**Contains:**
- Database schema updates (call_scenario column + templates table)
- ScenarioTemplateManager service API
- PersonaRelationshipManager updates
- Cost estimation with scenario tokens
- API endpoints for templates
- Frontend integration guide
- Usage examples
- Testing checklist

**When to read:**
- Working on scenario features
- Integrating frontend with scenario API
- Building scenario management UI
- Testing scenario functionality

---

#### **PRE_CALL_CONTEXT_FEATURE.md** (22KB)
**Purpose:** Original feature specification for pre-call scenarios
**Contains:**
- Feature requirements and use cases
- Database schema design
- Frontend UI mockups
- Backend integration points
- Example scenarios
- Implementation checklist (now complete)

**When to read:**
- Understanding the "why" behind scenario feature
- Designing similar features
- Reference for original requirements

---

#### **NEW_SERVICES_SUMMARY.md** (14KB)
**Purpose:** Summary of cost tracking & persona relationship services built
**Status:** Ready for integration
**Contains:**
- Extended database schema (4 new tables)
- CallCostTracker service usage
- PersonaRelationshipManager service usage
- Integration points with existing services
- Example usage flows
- What's ready vs. what needs doing

**When to read:**
- Integrating cost tracking into voice pipeline
- Using PersonaRelationshipManager in call orchestrator
- Understanding what's been scaffolded
- Planning next implementation steps

---

### 🛠️ Development & Operations

#### **DEPLOYMENT_QUICKSTART.md** (13KB)
**Purpose:** Get the application running quickly
**Contains:**
- Prerequisites checklist
- Step-by-step deployment instructions
- JWT authentication explanation
- Testing deployed endpoints
- Environment variable setup
- Troubleshooting common issues
- API base URL configuration

**When to read:**
- First time deploying the app
- Setting up a new environment
- Troubleshooting deployment issues
- Configuring authentication

---

#### **API_SPECIFICATION.md** (24KB)
**Purpose:** Complete API endpoint reference
**Contains:**
- All REST endpoints with request/response examples
- Authentication flow
- Call management endpoints
- Persona management endpoints
- Payment processing endpoints
- Webhook endpoints
- Error response formats
- Rate limiting information

**When to read:**
- Building frontend API integrations
- Testing endpoints with cURL/Postman
- Understanding authentication requirements
- Debugging API issues

---

### ⚙️ Configuration & Maintenance

#### **HARDCODED_COST_VALUES.md** (6KB)
**Purpose:** Audit of all hardcoded API pricing values
**Contains:**
- All 16 locations where costs are hardcoded
- Backend cost values (11 locations)
- Frontend cost values (5 locations)
- Current pricing for each service
- Recommendations for centralization
- Instructions for updating when pricing changes

**When to read:**
- API pricing changes
- Updating cost calculations
- Refactoring to centralized config
- Debugging cost estimation issues

**⚠️ CRITICAL:** When Twilio, ElevenLabs, Cerebras, OpenAI, Deepgram, or Stripe change pricing, update all locations listed in this file!

---

#### **FRONTEND_WITHOUT_ENV.md** (7KB)
**Purpose:** What can be built without environment variables
**Contains:**
- Breakdown of frontend work (95% works without .env)
- What requires .env settings (5%)
- Mock data development strategy
- Phase 1: UI building (no .env)
- Phase 2: Backend integration (needs .env)
- Parallel development workflow

**When to read:**
- Starting frontend development
- Don't have API keys yet
- Want to work on UI while backend is being built
- Setting up local development environment

---

### 💼 Business & Financial

#### **API_COSTS_AND_PROFITABILITY_2025.md** (65KB)
**Purpose:** Complete cost analysis and profitability model
**Contains:**
- Current 2025 API pricing for all services
- Cost per call breakdown (actual: $0.895)
- Three-phase pricing strategy (Launch → Proven → Scale)
- Subscription tier pricing ($9.99 - $99.99/mo)
- Real-world profitability scenarios
- Year 1 financial projections (Conservative/Moderate/Aggressive)
- Break-even analysis
- Customer acquisition strategies
- Managing "unlimited" plans without losses
- Call duration pricing strategy
- Quarterly revenue progression
- Monthly cohort analysis

**When to read:**
- Planning pricing strategy
- Pitching to investors
- Understanding unit economics
- Updating pricing tiers
- Calculating profitability
- Setting subscription limits

**⭐ CRITICAL:** Reference this for ALL pricing decisions!

---

### 🛠️ Implementation Guides

#### **IMPLEMENTATION_PLAN.md** (48KB - Action Ready)
**Purpose:** Step-by-step implementation guide for next features
**Status:** ⏳ Ready to Execute
**Contains:**
- **Phase 1:** Duration Selector UX (complete component code)
- **Phase 2:** SMS Scheduling Backend (full service implementation)
- **Phase 3:** Integration & Testing (50+ test scenarios)
- Detailed pricing logic for all subscription tiers
- Copy-paste ready code for Vue components
- Backend service implementation (SMS handler)
- Twilio setup instructions
- Database migrations needed
- Testing checklists (frontend, backend, integration)
- Deployment steps
- Success metrics

**When to read:**
- Implementing duration selector UI
- Adding SMS scheduling feature
- Need tier-based pricing logic
- Setting up Twilio integration
- Testing new features
- Deploying new functionality

**Timeline:** 2-3 weeks for both features

**Features Covered:**
1. Visual duration picker (3/5/10/15 min options)
2. Tier-based pricing display
3. SMS-to-schedule ("BRAD NOW", "EMMA 5PM")
4. Call duration enforcement
5. Subscription limit checking

---

## 🗺️ Common Tasks → Documentation Map

### Task: "I need to add a new API endpoint"
**Read:**
1. `API_SPECIFICATION.md` - See existing patterns
2. `HOW_THIS_APP_WORKS.md` - Understand service structure
3. Follow existing endpoint patterns in code

---

### Task: "I need to understand how calls work"
**Read:**
1. `HOW_THIS_APP_WORKS.md` - Section: "Complete Call Flow"
2. `COST_TRACKING_ARCHITECTURE.md` - Cost tracking during calls
3. `PERSONA_MEMORY_ARCHITECTURE.md` - Memory updates after calls

---

### Task: "I'm working on the frontend"
**Read:**
1. `FRONTEND_WITHOUT_ENV.md` - Development strategy
2. `API_SPECIFICATION.md` - Endpoints to integrate with
3. `HOW_THIS_APP_WORKS.md` - Section: "Frontend Structure"

---

### Task: "Persona memory isn't working correctly"
**Read:**
1. `PERSONA_MEMORY_ARCHITECTURE.md` - Understand the 4 tiers
2. `HOW_THIS_APP_WORKS.md` - Section: "Memory System Integration"
3. `NEW_SERVICES_SUMMARY.md` - PersonaRelationshipManager usage

---

### Task: "Cost calculations are wrong"
**Read:**
1. `HARDCODED_COST_VALUES.md` - Find all cost constants
2. `COST_TRACKING_ARCHITECTURE.md` - Understand calculation logic
3. `NEW_SERVICES_SUMMARY.md` - CallCostTracker usage examples

---

### Task: "I need to deploy the app"
**Read:**
1. `DEPLOYMENT_QUICKSTART.md` - Step-by-step guide
2. `.env.example` (in root) - All required environment variables
3. `HOW_THIS_APP_WORKS.md` - Section: "Raindrop Platform Architecture"

---

### Task: "I'm implementing the scenario feature"
**Read:**
1. `SCENARIO_FEATURE_IMPLEMENTATION.md` - Current status and integration guide
2. `PRE_CALL_CONTEXT_FEATURE.md` - Original requirements
3. `HOW_THIS_APP_WORKS.md` - Section: "Call Orchestration Flow"

---

### Task: "I need to implement duration selector or SMS scheduling"
**Read:**
1. `IMPLEMENTATION_PLAN.md` - Complete step-by-step guide
2. `API_COSTS_AND_PROFITABILITY_2025.md` - Pricing logic for all tiers
3. `HOW_THIS_APP_WORKS.md` - System architecture context

---

### Task: "What should we charge for calls?"
**Read:**
1. `API_COSTS_AND_PROFITABILITY_2025.md` - Complete pricing strategy
2. `HARDCODED_COST_VALUES.md` - Current cost constants
3. `COST_TRACKING_ARCHITECTURE.md` - How costs are tracked

---

### Task: "How do we make money / what are our margins?"
**Read:**
1. `API_COSTS_AND_PROFITABILITY_2025.md` - Full financial model
2. Section: "Financial Projections Summary" - Year 1 projections
3. Section: "Real-World Usage Scenarios" - Profitability by scale

---

### Task: "How do I set up SMS scheduling?"
**Read:**
1. `IMPLEMENTATION_PLAN.md` - Phase 2: SMS Scheduling
2. Twilio setup instructions included
3. Complete SMS handler service code provided

---

## 📊 Documentation Statistics

| Document | Size | Complexity | Priority |
|----------|------|------------|----------|
| API_COSTS_AND_PROFITABILITY_2025.md | 65KB | High | 🔴 Critical |
| IMPLEMENTATION_PLAN.md | 48KB | High | 🔴 Critical |
| HOW_THIS_APP_WORKS.md | 44KB | High | 🔴 Critical |
| API_SPECIFICATION.md | 24KB | Medium | 🟠 High |
| PRE_CALL_CONTEXT_FEATURE.md | 22KB | Medium | 🟡 Medium |
| COST_TRACKING_ARCHITECTURE.md | 19KB | High | 🟠 High |
| PERSONA_MEMORY_ARCHITECTURE.md | 18KB | High | 🟠 High |
| NEW_SERVICES_SUMMARY.md | 14KB | Medium | 🟡 Medium |
| SCENARIO_FEATURE_IMPLEMENTATION.md | 14KB | Medium | 🟠 High |
| DEPLOYMENT_QUICKSTART.md | 13KB | Low | 🟠 High |
| FRONTEND_WITHOUT_ENV.md | 7KB | Low | 🟡 Medium |
| HARDCODED_COST_VALUES.md | 6KB | Low | 🟢 Reference |

**Total Documentation:** ~300KB of detailed technical documentation

---

## 🔄 Keeping Documentation Updated

### When to Update:

1. **HOW_THIS_APP_WORKS.md**
   - New services added
   - Database schema changes
   - Major architectural changes

2. **API_SPECIFICATION.md**
   - New endpoints added
   - Request/response formats change
   - Authentication changes

3. **HARDCODED_COST_VALUES.md**
   - API pricing changes
   - New cost constants added
   - Cost calculation logic changes

4. **API_COSTS_AND_PROFITABILITY_2025.md**
   - Pricing tiers change
   - API costs change (Twilio, ElevenLabs, etc.)
   - Financial projections need updating
   - Subscription plans modified

5. **IMPLEMENTATION_PLAN.md**
   - Tasks completed (mark with ✅)
   - New tasks added
   - Blockers encountered
   - Timeline adjustments

6. **Feature Implementation Docs**
   - Feature status changes
   - Integration steps completed
   - New blockers discovered

---

## 💡 Tips for AI Assistants

### Context Loading Strategy:
1. **Always start with:** `HOW_THIS_APP_WORKS.md` for full context
2. **If implementing new features:** `IMPLEMENTATION_PLAN.md` has step-by-step guides
3. **If working on pricing:** `API_COSTS_AND_PROFITABILITY_2025.md` for complete strategy
4. **Then read:** Specific feature docs relevant to current task
5. **Finally check:** `HARDCODED_COST_VALUES.md` if working with costs

### Before Making Changes:
- ✅ Read relevant documentation first
- ✅ Check `IMPLEMENTATION_PLAN.md` for ready-to-use code
- ✅ Understand existing patterns
- ✅ Check for hardcoded values that need updating
- ✅ Verify pricing logic against `API_COSTS_AND_PROFITABILITY_2025.md`
- ✅ Update documentation if you change architecture

### When Resuming Work:
1. Check `IMPLEMENTATION_PLAN.md` for pending tasks
2. Read `API_COSTS_AND_PROFITABILITY_2025.md` for pricing context
3. Read `SCENARIO_FEATURE_IMPLEMENTATION.md` for latest feature status
4. Check `HOW_THIS_APP_WORKS.md` for any changes since last session
5. Review task-specific documentation as needed

### When Implementing Features:
1. **First:** Read `IMPLEMENTATION_PLAN.md` - may have complete solution
2. **Second:** Check pricing tiers in `API_COSTS_AND_PROFITABILITY_2025.md`
3. **Third:** Follow code patterns in `HOW_THIS_APP_WORKS.md`

---

## 📞 Project Quick Facts

**Name:** Call Me Back
**Type:** AI-powered phone call service
**Tech Stack:**
- Frontend: Vue 3 + Pinia + Vue Router
- Backend: Raindrop Platform (7 microservices)
- Database: SmartSQL (SQLite-based)
- Memory: SmartMemory (4-tier system)
- External APIs: Twilio, ElevenLabs, Cerebras, OpenAI, Deepgram, Stripe

**Current Status:**
- ✅ Backend: Fully deployed and running
- ✅ Cost tracking: Implemented
- ✅ Persona memory: Implemented
- ✅ Scenario feature: Backend complete
- ⏳ Frontend: 95% complete (needs API integration)

**Application URL:**
`https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run`

**Session ID:** `01k9dd97njbexcbqtkcy93z98t`
**Version:** `@01k9fhfv`

---

## 📁 Documentation Folder Structure

```
/call-me-back
├── DOCUMENTATION_INDEX.md (this file)
├── README.md (user-facing)
├── .env.example (environment variables reference)
└── /documentation
    ├── HOW_THIS_APP_WORKS.md ⭐ Start here
    ├── API_SPECIFICATION.md
    ├── COST_TRACKING_ARCHITECTURE.md
    ├── DEPLOYMENT_QUICKSTART.md
    ├── FRONTEND_WITHOUT_ENV.md
    ├── HARDCODED_COST_VALUES.md
    ├── NEW_SERVICES_SUMMARY.md
    ├── PERSONA_MEMORY_ARCHITECTURE.md
    ├── PRE_CALL_CONTEXT_FEATURE.md
    └── SCENARIO_FEATURE_IMPLEMENTATION.md
```

---

**Happy coding! 🚀**

*For questions or clarifications about the documentation, check the specific file listed above or refer to the source code with the guidance these docs provide.*
