# Database Architecture
**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** #database #postgresql #vultr #architecture #migrations

---

## Quick Reference

### Connection Quick Start
```bash
# SSH to Vultr server
ssh root@144.202.15.249

# Connect to PostgreSQL
psql -U postgres -d callmeback

# Check database status
systemctl status postgresql
```

### Common Queries
```sql
-- Get all personas
SELECT * FROM personas WHERE is_active = true ORDER BY created_at DESC;

-- Get user's call history
SELECT * FROM calls WHERE user_id = 'USER_ID' ORDER BY created_at DESC LIMIT 10;

-- Check user credits
SELECT * FROM user_credits WHERE user_id = 'USER_ID';

-- Get scheduled calls
SELECT * FROM scheduled_calls WHERE status = 'scheduled' AND scheduled_time <= NOW();
```

### Migration Commands
```bash
# Apply all migrations (from project root)
./apply-migrations.sh

# Check applied migrations
psql -U postgres -d callmeback -c "SELECT * FROM schema_migrations ORDER BY version;"

# Create new migration
# Create file: migrations/XXX_description.sql
# Include: DROP TABLE IF EXISTS, CREATE TABLE IF NOT EXISTS
```

---

## Table of Contents

1. [Architecture Decision: PostgreSQL vs SmartSQL](#1-architecture-decision-postgresql-vs-smartsql)
2. [Database Location & Access](#2-database-location--access)
3. [Schema Overview](#3-schema-overview)
4. [Core Tables](#4-core-tables)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Payment & Credits](#6-payment--credits)
7. [Call Management](#7-call-management)
8. [Cost Tracking](#8-cost-tracking)
9. [Migrations](#9-migrations)
10. [Access Patterns](#10-access-patterns)
11. [Performance Optimization](#11-performance-optimization)
12. [Backup & Recovery](#12-backup--recovery)
13. [Common Queries](#13-common-queries)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Architecture Decision: PostgreSQL vs SmartSQL

### Why PostgreSQL on Vultr (Not SmartSQL)

**The Problem with SmartSQL:**
- SmartSQL is SQLite-based and lacks PostgreSQL features
- Missing JSONB data types (needed for persona voice_settings, conversation history)
- No triggers support (needed for updated_at timestamps)
- No advanced functions (needed for complex queries)
- Limited JOIN capabilities
- "Invalid input or query execution error" on complex queries

**Decision:** Use full PostgreSQL 14 on Vultr VPS (144.202.15.249)

**Trade-offs:**
- ❌ **Lost:** Automatic PII detection from SmartSQL
- ✅ **Gained:** Full PostgreSQL compatibility
- ✅ **Gained:** JSONB support for persona customization
- ✅ **Gained:** Triggers for timestamp automation
- ✅ **Gained:** Advanced query capabilities
- ✅ **Gained:** Better scalability for production

**Cost:** $6/month for Vultr PostgreSQL managed instance (already running on existing VPS)

**Reference:** See `FINAL_DATABASE_STRATEGY.md` for the complete discovery process.

---

## 2. Database Location & Access

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Cloudflare Workers (Raindrop Services)                 │
│  ┌────────────────────────────────────────────────┐   │
│  │ auth-manager, persona-manager, call-orchestrator│   │
│  │   ↓                                             │   │
│  │ this.env.DATABASE_PROXY.executeQuery(...)      │   │
│  └────────────────┬───────────────────────────────┘   │
│                   │ Internal Worker-to-Worker call    │
│                   ↓                                    │
│  ┌────────────────────────────────────────────────┐   │
│  │ database-proxy (CRITICAL SERVICE)              │   │
│  │   Makes external HTTPS call                     │   │
│  └────────────────┬───────────────────────────────┘   │
└───────────────────┼────────────────────────────────────┘
                    │ HTTPS
                    ↓
┌─────────────────────────────────────────────────────────┐
│ DNS: db.ai-tools-marketplace.io → 144.202.15.249       │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Vultr VPS (144.202.15.249)                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Caddy (Port 443) - Reverse Proxy                │ │
│  │   ↓                                              │ │
│  │ Express API Proxy (Port 3000)                   │ │
│  │   POST /query - Execute SQL with bearer auth    │ │
│  │   ↓                                              │ │
│  │ PostgreSQL 14 (localhost:5432)                  │ │
│  │   Database: callmeback                           │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Problem:** Cloudflare Workers cannot fetch external URLs directly (Error 1003)
- ❌ Cannot fetch IP addresses: `fetch('http://144.202.15.249')`
- ❌ Cannot fetch tunnel domains: `fetch('https://*.trycloudflare.com')`
- ✅ Can only fetch proper domains: `fetch('https://db.ai-tools-marketplace.io')`

**Solution:** Database-Proxy Worker Pattern
1. **All services** call `database-proxy` via internal Worker-to-Worker communication
2. **Only `database-proxy`** makes external HTTPS calls to Vultr
3. **Completely bypasses** Cloudflare's external URL restrictions

**Security Layers:**
1. Bearer token authentication (`VULTR_DB_API_KEY`)
2. HTTPS/TLS encryption via Caddy + Let's Encrypt
3. PostgreSQL access only from localhost (not exposed publicly)
4. Express proxy validates all queries before execution

### Connection Configuration

**In Raindrop Services (src/*/index.ts):**
```typescript
// ✅ CORRECT - Use database-proxy service
const rows = await this.env.DATABASE_PROXY.executeQuery(
  'SELECT * FROM personas WHERE id = $1',
  [personaId]
);

// ❌ WRONG - Cannot call external URLs from Workers
const result = await executeSQL(
  this.env.CALL_ME_BACK_DB,  // This is SmartSQL, doesn't work
  query,
  params
);
```

**In database-proxy service (src/database-proxy/index.ts):**
```typescript
const dbConfig: VultrDbConfig = {
  apiUrl: 'https://db.ai-tools-marketplace.io',
  apiKey: this.env.VULTR_DB_API_KEY
};

const result = await executeSQL(dbConfig, query, parameters);
```

**Environment Variables Required:**
- `VULTR_DB_API_KEY` (secret, bearer token for db-proxy API)
- `VULTR_DB_PASSWORD` (PostgreSQL password, used by Express proxy)

---

## 3. Schema Overview

### Current State: 12 Tables

**Core Tables:**
1. `personas` - AI personality definitions
2. `user_persona_relationships` - User-specific persona customization
3. `users` - User accounts (auth)
4. `token_blacklist` - JWT revocation list

**Call Management:**
5. `calls` - Call session records with payment tracking
6. `scheduled_calls` - Future/recurring calls
7. `call_logs` - Detailed call history with metrics

**Payment & Credits:**
8. `user_credits` - User balance and subscription
9. `credit_transactions` - Audit trail for credit changes

**Cost Tracking:**
10. `call_cost_breakdowns` - Per-call cost breakdown (Twilio/Deepgram/Cerebras/ElevenLabs)
11. `call_cost_events` - Granular cost tracking events
12. `user_budget_settings` - Per-user spending limits

**Templates:**
13. `call_scenario_templates` - Pre-built conversation scenarios

### Database Size (as of 2025-11-14)
```bash
# Check database size
psql -U postgres -d callmeback -c "\l+"

# Result: ~15 MB (mostly seed data for Brad, Sarah, Alex)
```

---

## 4. Core Tables

### 4.1 Personas Table

**Purpose:** Store base AI personality definitions shared across all users

**Schema:**
```sql
CREATE TABLE personas (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Core personality (shared across all users)
  core_system_prompt TEXT NOT NULL,

  -- Default voice settings (can be overridden per user)
  default_voice_id VARCHAR(100),
  default_voice_settings JSONB DEFAULT '{
    "stability": 0.5,
    "similarity_boost": 0.75,
    "speed": 1.0,
    "style": 0.0
  }',

  -- Metadata
  avatar_url TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_system_persona BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_personas_active ON personas(is_active);
CREATE INDEX idx_personas_category ON personas(category);
```

**Seed Data:** Brad, Sarah, Alex (loaded from `migrations/002_seed_initial_personas.sql`)

**Usage Example:**
```sql
-- Get all active personas
SELECT id, name, description, category
FROM personas
WHERE is_active = true
ORDER BY created_at DESC;

-- Get persona with voice settings
SELECT id, name, default_voice_id, default_voice_settings
FROM personas
WHERE id = 'brad';
```

**Access Pattern:**
- `GET /api/personas` → `persona-manager` → `database-proxy` → PostgreSQL
- Frontend displays persona cards (name, description, avatar)
- User selects persona → Passes persona_id to call trigger

---

### 4.2 User Persona Relationships Table

**Purpose:** Store user-specific customizations and relationship context

**Schema:**
```sql
CREATE TABLE user_persona_relationships (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  persona_id VARCHAR(100) NOT NULL,

  -- Relationship type (e.g., "friend", "coach", "therapist", "mentor")
  relationship_type VARCHAR(100) DEFAULT 'friend',

  -- User-specific system prompt augmentation
  custom_system_prompt TEXT,

  -- User-specific voice customization
  voice_id VARCHAR(100),
  voice_settings JSONB DEFAULT '{
    "stability": 0.5,
    "similarity_boost": 0.75,
    "speed": 1.0,
    "style": 0.0
  }',

  -- Usage statistics
  total_calls INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  last_call_at TIMESTAMP,

  -- Preferences
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
  UNIQUE(user_id, persona_id)
);

-- Indexes
CREATE INDEX idx_relationships_user ON user_persona_relationships(user_id);
CREATE INDEX idx_relationships_persona ON user_persona_relationships(persona_id);
CREATE INDEX idx_relationships_user_persona ON user_persona_relationships(user_id, persona_id);
CREATE INDEX idx_relationships_favorite ON user_persona_relationships(user_id, is_favorite) WHERE is_favorite = true;
```

**Use Cases:**
1. **User marks persona as favorite** → Set `is_favorite = true`
2. **User customizes persona voice** → Store custom `voice_id` and `voice_settings`
3. **User defines relationship** → "Brad is my workout buddy" → `relationship_type = 'coach'`, `custom_system_prompt = 'You are my workout accountability partner...'`
4. **Track usage** → Increment `total_calls`, update `last_call_at` after each call

**Query Example:**
```sql
-- Get user's favorite personas with their custom settings
SELECT p.id, p.name, p.description,
       upr.relationship_type, upr.custom_system_prompt,
       upr.total_calls, upr.last_call_at
FROM personas p
INNER JOIN user_persona_relationships upr ON p.id = upr.persona_id
WHERE upr.user_id = 'user_123' AND upr.is_favorite = true
ORDER BY upr.last_call_at DESC;
```

---

## 5. Authentication & Authorization

### 5.1 Users Table

**Purpose:** Store user account information

**Schema:**
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

**Security:**
- Passwords hashed with bcrypt (12 rounds)
- Email must be unique
- JWT tokens generated on login (stored in frontend localStorage)

**Registration Flow:**
```
Frontend → POST /api/auth/register
→ API Gateway → auth-manager
→ database-proxy.executeQuery('INSERT INTO users...')
→ Return JWT token
```

**Login Flow:**
```
Frontend → POST /api/auth/login
→ API Gateway → auth-manager
→ database-proxy.executeQuery('SELECT * FROM users WHERE email = $1')
→ Verify password_hash with bcrypt.compare()
→ Check token_blacklist for revoked tokens
→ Generate JWT token (expires in 7 days)
→ Return token
```

---

### 5.2 Token Blacklist Table

**Purpose:** Revoke JWT tokens (logout, account compromise)

**Schema:**
```sql
CREATE TABLE token_blacklist (
  token_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_token_blacklist_user ON token_blacklist(user_id);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
```

**Usage:**
```sql
-- Add token to blacklist (logout)
INSERT INTO token_blacklist (token_id, user_id, expires_at)
VALUES ('jti_12345', 'user_123', '2025-11-28 12:00:00');

-- Check if token is revoked (on every authenticated request)
SELECT 1 FROM token_blacklist
WHERE token_id = 'jti_12345' AND expires_at > NOW();

-- Cleanup expired tokens (run daily via cron)
DELETE FROM token_blacklist WHERE expires_at < NOW();
```

**JWT Structure:**
```json
{
  "jti": "unique_token_id",  // Token ID (stored in blacklist)
  "sub": "user_123",          // User ID
  "email": "user@example.com",
  "iat": 1700000000,          // Issued at
  "exp": 1700604800           // Expires at (7 days)
}
```

---

## 6. Payment & Credits

### 6.1 User Credits Table

**Purpose:** Track user account balance and subscription status

**Schema:**
```sql
CREATE TABLE user_credits (
  user_id VARCHAR(255) PRIMARY KEY,
  available_credits INTEGER DEFAULT 0,

  -- Subscription info
  subscription_tier VARCHAR(50) DEFAULT 'free',  -- free, basic, premium, unlimited
  subscription_status VARCHAR(50),  -- active, canceled, expired
  subscription_stripe_id VARCHAR(255),
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  monthly_credit_allowance INTEGER DEFAULT 0,

  -- Limits
  max_calls_per_day INTEGER DEFAULT 3,
  max_call_duration_seconds INTEGER DEFAULT 600,  -- 10 minutes

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Credit System:**
- 1 credit ≈ 1 minute of call time
- Credits never expire
- Subscription adds monthly credits (auto-refill on billing cycle)

**Pricing Tiers (2025):**
- **Free:** 3 calls/day, max 5 minutes each, no credits
- **Basic ($9.99/mo):** 100 credits/month, 10 calls/day, 10 minutes each
- **Premium ($29.99/mo):** 500 credits/month, unlimited calls, 30 minutes each
- **Unlimited ($99.99/mo):** Unlimited credits, unlimited calls, 60 minutes each

**Usage Example:**
```sql
-- Check user balance before call
SELECT available_credits, subscription_tier, max_call_duration_seconds
FROM user_credits
WHERE user_id = 'user_123';

-- Deduct credits after call (5 minutes = 5 credits)
UPDATE user_credits
SET available_credits = available_credits - 5
WHERE user_id = 'user_123';

-- Add credits (purchase or subscription refill)
UPDATE user_credits
SET available_credits = available_credits + 100
WHERE user_id = 'user_123';
```

---

### 6.2 Credit Transactions Table

**Purpose:** Audit trail for all credit changes

**Schema:**
```sql
CREATE TABLE credit_transactions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,  -- Positive = add, negative = deduct
  type VARCHAR(50) NOT NULL,  -- purchase, subscription_refill, call_deduction, refund, admin_adjustment

  -- References
  call_id VARCHAR(255),  -- If type = call_deduction
  payment_intent_id VARCHAR(255),  -- If type = purchase

  -- Metadata
  description TEXT,
  balance_before INTEGER,
  balance_after INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);
```

**Usage Example:**
```sql
-- Log credit deduction for call
INSERT INTO credit_transactions (id, user_id, amount, type, call_id, description, balance_before, balance_after)
VALUES (
  'txn_12345',
  'user_123',
  -5,  -- Negative = deduction
  'call_deduction',
  'call_67890',
  'Call with Brad - 5 minutes',
  100,  -- Balance before
  95    -- Balance after
);

-- Get user transaction history
SELECT type, amount, description, balance_after, created_at
FROM credit_transactions
WHERE user_id = 'user_123'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 7. Call Management

### 7.1 Calls Table

**Purpose:** Track active and historical call sessions with payment info

**Schema:**
```sql
CREATE TABLE calls (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  persona_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  twilio_call_sid VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'initiating',

  -- Payment tracking
  payment_method VARCHAR(50),  -- 'stripe', 'credit', 'subscription'
  payment_intent_id VARCHAR(255),  -- Stripe PaymentIntent ID if applicable
  payment_status VARCHAR(50),  -- 'pending', 'paid', 'failed', 'credit_used'
  estimated_cost_cents INTEGER,
  actual_cost_cents INTEGER,
  credits_used INTEGER,

  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (persona_id) REFERENCES personas(id)
);

-- Indexes
CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_persona_id ON calls(persona_id);
CREATE INDEX idx_calls_status ON calls(status);
```

**Call Status Flow:**
1. `initiating` - Call created in database
2. `calling` - Twilio call initiated
3. `connected` - Call answered, WebSocket connected
4. `in_progress` - Conversation active
5. `completed` - Call ended successfully
6. `failed` - Error occurred (see `error_message`)
7. `no_answer` - User didn't pick up
8. `busy` - User's phone was busy

**Usage Example:**
```sql
-- Create call record
INSERT INTO calls (id, user_id, persona_id, phone_number, status, payment_method, estimated_cost_cents)
VALUES ('call_12345', 'user_123', 'brad', '+15551234567', 'initiating', 'credit', 500);

-- Update status when Twilio call starts
UPDATE calls
SET status = 'calling', twilio_call_sid = 'CA1234567890abcdef'
WHERE id = 'call_12345';

-- Update after call ends
UPDATE calls
SET status = 'completed',
    end_time = NOW(),
    duration_seconds = 300,
    credits_used = 5,
    actual_cost_cents = 487
WHERE id = 'call_12345';

-- Get user's recent calls
SELECT c.id, c.status, c.duration_seconds, c.credits_used, c.created_at,
       p.name as persona_name
FROM calls c
INNER JOIN personas p ON c.persona_id = p.id
WHERE c.user_id = 'user_123'
ORDER BY c.created_at DESC
LIMIT 10;
```

---

### 7.2 Scheduled Calls Table

**Purpose:** Store future/recurring calls (needs cron job implementation)

**Schema:**
```sql
CREATE TABLE scheduled_calls (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  persona_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  executed_at TIMESTAMP,
  call_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (persona_id) REFERENCES personas(id),
  FOREIGN KEY (call_id) REFERENCES calls(id)
);

-- Indexes
CREATE INDEX idx_scheduled_calls_user_id ON scheduled_calls(user_id);
CREATE INDEX idx_scheduled_calls_scheduled_time ON scheduled_calls(scheduled_time);
```

**Status Flow:**
1. `scheduled` - Waiting for scheduled_time
2. `executing` - Cron job picked up, triggering call
3. `executed` - Call triggered successfully (call_id set)
4. `failed` - Failed to trigger call
5. `canceled` - User canceled before execution

**Cron Job Logic (NOT YET IMPLEMENTED):**
```sql
-- Query to run every minute
SELECT id, user_id, persona_id, phone_number
FROM scheduled_calls
WHERE status = 'scheduled'
  AND scheduled_time <= NOW()
ORDER BY scheduled_time ASC
LIMIT 10;

-- For each result:
-- 1. Call trigger_call() to create call
-- 2. Update scheduled_calls with call_id and status = 'executed'
```

---

### 7.3 Call Logs Table

**Purpose:** Detailed call history with conversation metrics

**Schema:**
```sql
CREATE TABLE call_logs (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  persona_id VARCHAR(100) NOT NULL,

  -- Call details
  twilio_call_sid VARCHAR(100),
  phone_number VARCHAR(50),
  duration_seconds INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'initiated',  -- initiated, connected, completed, failed
  error_message TEXT,

  -- Costs (in cents)
  cost_stt INTEGER DEFAULT 0,
  cost_llm INTEGER DEFAULT 0,
  cost_tts INTEGER DEFAULT 0,
  cost_twilio INTEGER DEFAULT 0,
  cost_total INTEGER DEFAULT 0,

  -- Conversation metrics
  turn_count INTEGER DEFAULT 0,
  interrupt_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,

  -- Timestamps
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_calls_user ON call_logs(user_id);
CREATE INDEX idx_calls_persona ON call_logs(persona_id);
CREATE INDEX idx_calls_user_persona ON call_logs(user_id, persona_id);
CREATE INDEX idx_calls_started_at ON call_logs(started_at DESC);
CREATE INDEX idx_calls_status ON call_logs(status);
```

**Metrics Tracked:**
- `turn_count` - Number of back-and-forth exchanges
- `interrupt_count` - How many times user interrupted AI
- `avg_response_time_ms` - Average AI response latency

**Usage Example:**
```sql
-- Get call analytics for user
SELECT
  COUNT(*) as total_calls,
  AVG(duration_seconds) as avg_duration,
  SUM(cost_total) as total_cost_cents,
  AVG(turn_count) as avg_turns,
  AVG(avg_response_time_ms) as avg_latency_ms
FROM call_logs
WHERE user_id = 'user_123'
  AND started_at >= NOW() - INTERVAL '30 days';
```

---

## 8. Cost Tracking

### 8.1 Call Cost Breakdowns Table

**Purpose:** Per-call cost breakdown by service (Twilio/Deepgram/Cerebras/ElevenLabs)

**Schema:**
```sql
CREATE TABLE call_cost_breakdowns (
  id VARCHAR(255) PRIMARY KEY,
  call_id VARCHAR(255) NOT NULL,

  -- Service costs (in cents)
  twilio_cost_cents NUMERIC(10, 2) DEFAULT 0,
  deepgram_cost_cents NUMERIC(10, 2) DEFAULT 0,
  cerebras_cost_cents NUMERIC(10, 2) DEFAULT 0,
  elevenlabs_cost_cents NUMERIC(10, 2) DEFAULT 0,

  -- Usage metrics
  twilio_duration_seconds INTEGER DEFAULT 0,
  deepgram_audio_seconds NUMERIC(10, 2) DEFAULT 0,
  cerebras_input_tokens INTEGER DEFAULT 0,
  cerebras_output_tokens INTEGER DEFAULT 0,
  elevenlabs_characters INTEGER DEFAULT 0,

  -- Calculated total
  total_cost_cents NUMERIC(10, 2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_cost_breakdowns_call ON call_cost_breakdowns(call_id);
CREATE INDEX idx_cost_breakdowns_created ON call_cost_breakdowns(created_at DESC);
```

**Cost Calculation (2025 Rates):**
```typescript
// Twilio: $0.0130/min outbound
twilio_cost_cents = (duration_seconds / 60) * 1.30

// Deepgram Nova-2: $0.0043/min
deepgram_cost_cents = (audio_seconds / 60) * 0.43

// Cerebras Llama-3.1-8B: $0.10/1M input, $0.10/1M output
cerebras_cost_cents = ((input_tokens + output_tokens) / 1_000_000) * 10

// ElevenLabs Turbo v2.5: $0.15/1K characters
elevenlabs_cost_cents = (characters / 1000) * 15

// Total
total_cost_cents = sum(all above)
```

**Usage Example:**
```sql
-- Insert cost breakdown after call
INSERT INTO call_cost_breakdowns (
  id, call_id,
  twilio_cost_cents, deepgram_cost_cents, cerebras_cost_cents, elevenlabs_cost_cents,
  twilio_duration_seconds, deepgram_audio_seconds, cerebras_input_tokens, cerebras_output_tokens, elevenlabs_characters,
  total_cost_cents
) VALUES (
  'cost_12345', 'call_67890',
  6.50, 2.15, 0.08, 4.50,  -- Costs
  300, 300, 800, 1200, 300,  -- Usage
  13.23  -- Total
);

-- Get total costs by service (last 30 days)
SELECT
  SUM(twilio_cost_cents) as twilio_total,
  SUM(deepgram_cost_cents) as deepgram_total,
  SUM(cerebras_cost_cents) as cerebras_total,
  SUM(elevenlabs_cost_cents) as elevenlabs_total,
  SUM(total_cost_cents) as grand_total
FROM call_cost_breakdowns
WHERE created_at >= NOW() - INTERVAL '30 days';
```

---

### 8.2 User Budget Settings Table

**Purpose:** Per-user spending limits and warnings

**Schema:**
```sql
CREATE TABLE user_budget_settings (
  user_id VARCHAR(255) PRIMARY KEY,
  max_cost_per_call_cents INTEGER DEFAULT 1000,  -- $10
  max_monthly_spend_cents INTEGER DEFAULT 10000,  -- $100
  warn_at_percent_per_call INTEGER DEFAULT 75,  -- Warn at 75% of max_cost_per_call
  enable_auto_cutoff BOOLEAN DEFAULT TRUE,  -- Automatically end call at limit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Usage Example:**
```sql
-- Check budget before call
SELECT max_cost_per_call_cents, max_monthly_spend_cents
FROM user_budget_settings
WHERE user_id = 'user_123';

-- Check monthly spend
SELECT SUM(total_cost_cents) as monthly_spend
FROM call_cost_breakdowns ccb
INNER JOIN calls c ON ccb.call_id = c.id
WHERE c.user_id = 'user_123'
  AND c.created_at >= DATE_TRUNC('month', NOW());

-- During call: Check if approaching limit
-- (Voice pipeline queries this every 30 seconds)
SELECT
  ubs.max_cost_per_call_cents,
  ccb.total_cost_cents as current_cost,
  (ccb.total_cost_cents::FLOAT / ubs.max_cost_per_call_cents) * 100 as percent_used
FROM user_budget_settings ubs
INNER JOIN calls c ON c.user_id = ubs.user_id
INNER JOIN call_cost_breakdowns ccb ON ccb.call_id = c.id
WHERE c.id = 'call_12345';

-- If percent_used >= 75: Send warning to user
-- If percent_used >= 100 and enable_auto_cutoff = true: End call
```

---

## 9. Migrations

### Migration Strategy

**Location:** `migrations/` directory at project root

**Naming Convention:** `XXX_description.sql`
- `001_create_personas_tables.sql`
- `002_seed_initial_personas.sql`
- `003_seed_personas_simplified.sql`
- `004_create_calls_table.sql`
- `005_create_user_credits_table.sql`
- `006_create_users_and_auth_tables.sql`
- `008_add_persona_ai_params.sql`
- `009_create_admin_users.sql`

**Best Practices:**
1. Always use `CREATE TABLE IF NOT EXISTS`
2. Always use `DROP TABLE IF EXISTS` before `CREATE TABLE` (for idempotency)
3. Include indexes in the same migration as table creation
4. Add comments for complex columns
5. Use transactions (migrations are wrapped in BEGIN/COMMIT by apply script)

**Apply Migrations:**
```bash
# From project root
./apply-migrations.sh

# What it does:
# 1. SSHs to Vultr server
# 2. Reads all .sql files from migrations/
# 3. Applies them in order to PostgreSQL
# 4. Tracks applied migrations in schema_migrations table
```

**Check Applied Migrations:**
```bash
ssh root@144.202.15.249
psql -U postgres -d callmeback

SELECT * FROM schema_migrations ORDER BY version;
```

### Creating a New Migration

**Step 1: Create file**
```bash
# Determine next number
ls migrations/ | grep -E '^[0-9]+' | sort -n | tail -1
# Result: 009_create_admin_users.sql

# Create next migration
touch migrations/010_add_user_preferences.sql
```

**Step 2: Write SQL**
```sql
-- migrations/010_add_user_preferences.sql
-- Description: Add user preferences table for notification settings

BEGIN;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  call_reminder_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_preferences_email ON user_preferences(email_notifications) WHERE email_notifications = true;

COMMIT;
```

**Step 3: Apply migration**
```bash
./apply-migrations.sh
```

**Step 4: Verify**
```bash
ssh root@144.202.15.249
psql -U postgres -d callmeback -c "\d user_preferences"
```

---

## 10. Access Patterns

### 10.1 Common Query Patterns

**Pattern 1: Get User's Favorite Personas**
```sql
SELECT p.id, p.name, p.description, p.avatar_url,
       upr.relationship_type, upr.total_calls, upr.last_call_at
FROM personas p
INNER JOIN user_persona_relationships upr ON p.id = upr.persona_id
WHERE upr.user_id = $1 AND upr.is_favorite = true
ORDER BY upr.last_call_at DESC;
```
**Index Used:** `idx_relationships_favorite`

---

**Pattern 2: Get User Call History with Persona Names**
```sql
SELECT c.id, c.status, c.duration_seconds, c.credits_used, c.created_at,
       p.name as persona_name, p.avatar_url
FROM calls c
INNER JOIN personas p ON c.persona_id = p.id
WHERE c.user_id = $1
ORDER BY c.created_at DESC
LIMIT 20;
```
**Index Used:** `idx_calls_user_id`

---

**Pattern 3: Check if User Can Afford Call**
```sql
-- Check credits
SELECT available_credits, max_calls_per_day, subscription_tier
FROM user_credits
WHERE user_id = $1;

-- Check today's call count
SELECT COUNT(*) as calls_today
FROM calls
WHERE user_id = $1
  AND DATE(created_at) = CURRENT_DATE;

-- If credits >= estimated_cost AND calls_today < max_calls_per_day: Allow call
```
**Indexes Used:** `idx_calls_user_id`, primary key on `user_credits`

---

**Pattern 4: Get Scheduled Calls Due Now**
```sql
SELECT id, user_id, persona_id, phone_number, scheduled_time
FROM scheduled_calls
WHERE status = 'scheduled'
  AND scheduled_time <= NOW()
ORDER BY scheduled_time ASC
LIMIT 10;
```
**Index Used:** `idx_scheduled_calls_scheduled_time`

---

**Pattern 5: Get User Monthly Spend**
```sql
SELECT
  SUM(ccb.total_cost_cents) as total_spend_cents,
  COUNT(c.id) as total_calls,
  AVG(c.duration_seconds) as avg_duration_seconds
FROM calls c
LEFT JOIN call_cost_breakdowns ccb ON c.id = ccb.call_id
WHERE c.user_id = $1
  AND c.created_at >= DATE_TRUNC('month', NOW())
  AND c.status = 'completed';
```
**Index Used:** `idx_calls_user_id`

---

## 11. Performance Optimization

### 11.1 Existing Indexes

**Personas:**
- `idx_personas_active` - Speeds up active persona lookups
- `idx_personas_category` - Category filtering

**User Persona Relationships:**
- `idx_relationships_user` - User's persona list
- `idx_relationships_persona` - Persona's user list
- `idx_relationships_user_persona` - Composite for specific relationships
- `idx_relationships_favorite` - Partial index for favorites only

**Calls:**
- `idx_calls_user_id` - User's call history
- `idx_calls_persona_id` - Persona's call history
- `idx_calls_status` - Filter by status

**Call Logs:**
- `idx_calls_user` - User analytics
- `idx_calls_persona` - Persona analytics
- `idx_calls_user_persona` - User-persona analytics
- `idx_calls_started_at` - Time-based queries
- `idx_calls_status` - Status filtering

**Scheduled Calls:**
- `idx_scheduled_calls_user_id` - User's scheduled calls
- `idx_scheduled_calls_scheduled_time` - Cron job queries

### 11.2 Query Performance Tips

**Use EXPLAIN ANALYZE:**
```sql
EXPLAIN ANALYZE
SELECT * FROM calls WHERE user_id = 'user_123' ORDER BY created_at DESC LIMIT 10;
```

**Monitor Slow Queries:**
```sql
-- Enable slow query logging (in postgresql.conf)
log_min_duration_statement = 1000  -- Log queries > 1 second

-- Or query pg_stat_statements
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Add Missing Indexes:**
```sql
-- If you notice slow queries on a specific column
CREATE INDEX idx_table_column ON table(column);
```

### 11.3 Connection Pooling

**Current Setup:** Express proxy creates pool at startup
```javascript
// vultr-db-proxy/server.js
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'callmeback',
  user: 'postgres',
  password: process.env.VULTR_DB_PASSWORD,
  max: 20,  // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Monitoring:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check connection limits
SHOW max_connections;  -- Default: 100
```

---

## 12. Backup & Recovery

### 12.1 Manual Backup

**Create Backup:**
```bash
ssh root@144.202.15.249

# Full database dump
pg_dump -U postgres -d callmeback > /root/backups/callmeback_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -U postgres -d callmeback | gzip > /root/backups/callmeback_$(date +%Y%m%d_%H%M%S).sql.gz

# Specific table backup
pg_dump -U postgres -d callmeback -t personas > /root/backups/personas_$(date +%Y%m%d).sql
```

**Restore Backup:**
```bash
ssh root@144.202.15.249

# Restore full database
psql -U postgres -d callmeback < /root/backups/callmeback_20251121_120000.sql

# Restore from compressed backup
gunzip -c /root/backups/callmeback_20251121_120000.sql.gz | psql -U postgres -d callmeback

# Restore specific table
psql -U postgres -d callmeback < /root/backups/personas_20251121.sql
```

### 12.2 Automated Backup (TODO)

**Cron Job Setup:**
```bash
# Add to crontab on Vultr server
crontab -e

# Daily backup at 3 AM
0 3 * * * pg_dump -U postgres -d callmeback | gzip > /root/backups/callmeback_$(date +\%Y\%m\%d).sql.gz

# Weekly full backup on Sundays at 2 AM
0 2 * * 0 pg_dump -U postgres -d callmeback > /root/backups/weekly/callmeback_$(date +\%Y\%m\%d).sql

# Cleanup old backups (keep 30 days)
0 4 * * * find /root/backups -name "callmeback_*.sql.gz" -mtime +30 -delete
```

### 12.3 Disaster Recovery

**Scenario 1: Database Corrupted**
```bash
# 1. Stop services
pm2 stop all

# 2. Drop and recreate database
psql -U postgres -c "DROP DATABASE callmeback;"
psql -U postgres -c "CREATE DATABASE callmeback;"

# 3. Restore from latest backup
gunzip -c /root/backups/callmeback_latest.sql.gz | psql -U postgres -d callmeback

# 4. Restart services
pm2 restart all
```

**Scenario 2: Accidental Data Deletion**
```bash
# 1. Create temporary database
psql -U postgres -c "CREATE DATABASE callmeback_temp;"

# 2. Restore backup to temp database
psql -U postgres -d callmeback_temp < /root/backups/callmeback_latest.sql

# 3. Extract specific data
psql -U postgres -d callmeback_temp -c "SELECT * FROM personas WHERE id = 'brad';"

# 4. Copy data back to production
psql -U postgres -d callmeback -c "INSERT INTO personas SELECT * FROM callmeback_temp.personas WHERE id = 'brad';"

# 5. Drop temp database
psql -U postgres -c "DROP DATABASE callmeback_temp;"
```

---

## 13. Common Queries

### User Management

```sql
-- Get user details with credit balance
SELECT u.id, u.email, u.name, u.phone,
       uc.available_credits, uc.subscription_tier,
       u.created_at
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE u.email = 'user@example.com';

-- Get users with low credits (< 10)
SELECT u.id, u.email, uc.available_credits, uc.subscription_tier
FROM users u
INNER JOIN user_credits uc ON u.id = uc.user_id
WHERE uc.available_credits < 10
ORDER BY uc.available_credits ASC;
```

### Call Analytics

```sql
-- Get today's call volume
SELECT COUNT(*) as total_calls,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
       AVG(duration_seconds) as avg_duration
FROM calls
WHERE DATE(created_at) = CURRENT_DATE;

-- Get top personas by usage (last 30 days)
SELECT p.name, COUNT(c.id) as call_count, SUM(c.duration_seconds) as total_duration
FROM calls c
INNER JOIN personas p ON c.persona_id = p.id
WHERE c.created_at >= NOW() - INTERVAL '30 days'
  AND c.status = 'completed'
GROUP BY p.id, p.name
ORDER BY call_count DESC
LIMIT 10;

-- Get revenue by day (last 7 days)
SELECT DATE(c.created_at) as call_date,
       COUNT(c.id) as total_calls,
       SUM(ccb.total_cost_cents) as revenue_cents
FROM calls c
LEFT JOIN call_cost_breakdowns ccb ON c.id = ccb.call_id
WHERE c.created_at >= NOW() - INTERVAL '7 days'
  AND c.status = 'completed'
GROUP BY DATE(c.created_at)
ORDER BY call_date DESC;
```

### Cost Analysis

```sql
-- Get cost breakdown by service (last 30 days)
SELECT
  ROUND(SUM(twilio_cost_cents) / 100.0, 2) as twilio_total_usd,
  ROUND(SUM(deepgram_cost_cents) / 100.0, 2) as deepgram_total_usd,
  ROUND(SUM(cerebras_cost_cents) / 100.0, 2) as cerebras_total_usd,
  ROUND(SUM(elevenlabs_cost_cents) / 100.0, 2) as elevenlabs_total_usd,
  ROUND(SUM(total_cost_cents) / 100.0, 2) as grand_total_usd
FROM call_cost_breakdowns
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Get most expensive calls
SELECT c.id, c.user_id, c.duration_seconds,
       ccb.total_cost_cents,
       p.name as persona_name,
       c.created_at
FROM calls c
INNER JOIN call_cost_breakdowns ccb ON c.id = ccb.call_id
INNER JOIN personas p ON c.persona_id = p.id
WHERE c.created_at >= NOW() - INTERVAL '7 days'
ORDER BY ccb.total_cost_cents DESC
LIMIT 10;
```

---

## 14. Troubleshooting

### Issue: "Database query failed"

**Symptom:** API returns 500 error with "Database query failed"

**Check:**
```bash
# 1. Check database-proxy is running
ssh root@144.202.15.249
pm2 status
# Should show: db-proxy | online

# 2. Check PostgreSQL is running
systemctl status postgresql
# Should show: active (running)

# 3. Test database connection
psql -U postgres -d callmeback -c "SELECT 1;"
# Should return: 1

# 4. Check db-proxy logs
pm2 logs db-proxy --lines 50
# Look for connection errors

# 5. Test HTTP endpoint
curl -X POST https://db.ai-tools-marketplace.io/query \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1", "parameters": []}'
# Should return: {"rows":[{"?column?":1}]}
```

**Fix:**
```bash
# Restart db-proxy if crashed
pm2 restart db-proxy

# Restart PostgreSQL if crashed
systemctl restart postgresql
```

---

### Issue: "Too many connections"

**Symptom:** Error: "FATAL: sorry, too many clients already"

**Check:**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check max connections
SHOW max_connections;  -- Default: 100

-- Find idle connections
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state = 'idle'
ORDER BY state_change;
```

**Fix:**
```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '10 minutes';

-- Or increase max_connections (requires restart)
-- Edit /etc/postgresql/14/main/postgresql.conf
-- max_connections = 200
-- Then: systemctl restart postgresql
```

---

### Issue: "Slow queries"

**Symptom:** API requests taking > 1 second

**Check:**
```sql
-- Enable slow query logging
ALTER DATABASE callmeback SET log_min_duration_statement = 1000;

-- Check slow queries (if pg_stat_statements enabled)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.5;
```

**Fix:**
```sql
-- Add missing index
CREATE INDEX idx_table_column ON table(column);

-- Analyze table statistics
ANALYZE table;

-- Vacuum if needed
VACUUM ANALYZE table;
```

---

### Issue: "Migration failed"

**Symptom:** `./apply-migrations.sh` exits with error

**Check:**
```bash
# Check error message in terminal output
# Common errors:
# - Syntax error in SQL
# - Missing foreign key reference
# - Duplicate column name
# - Permission denied

# Check PostgreSQL logs
ssh root@144.202.15.249
tail -50 /var/log/postgresql/postgresql-14-main.log
```

**Fix:**
```bash
# 1. Fix SQL syntax in migration file
nano migrations/010_failing_migration.sql

# 2. Test migration locally
ssh root@144.202.15.249
psql -U postgres -d callmeback < /path/to/migration.sql

# 3. If migration already partially applied, rollback manually
psql -U postgres -d callmeback
DROP TABLE IF EXISTS problematic_table;

# 4. Re-run migrations
./apply-migrations.sh
```

---

### Issue: "Foreign key constraint violation"

**Symptom:** Error: "insert or update violates foreign key constraint"

**Example:**
```sql
INSERT INTO calls (id, user_id, persona_id, phone_number)
VALUES ('call_123', 'user_999', 'brad', '+15551234567');
-- Error: Key (user_id)=(user_999) is not present in table "users"
```

**Fix:**
```sql
-- Check if referenced record exists
SELECT id FROM users WHERE id = 'user_999';
-- If empty, create user first or use existing user_id

-- If persona doesn't exist
SELECT id FROM personas WHERE id = 'brad';
-- If empty, check persona name or create persona
```

---

## Sources

**Consolidated from:**
- `FINAL_DATABASE_STRATEGY.md` (2025-11-14) - PostgreSQL vs SmartSQL decision
- `DATABASE_MIGRATION_LESSONS.md` (2025-11-14) - 4-hour debugging journey, Worker restrictions
- `DATABASE_REQUIREMENTS.md` (2025-11-15) - App flows, table requirements, testing checklist
- `PCR2.md` (2025-11-20, lines 173-175, 286-320) - Infrastructure architecture, data flow
- `migrations/001_create_personas_tables.sql` - Persona schema
- `migrations/004_create_calls_table.sql` - Call tracking schema

**Related Documents:**
- See `documentation/domain/deployment.md` for deployment procedures
- See `documentation/domain/vultr.md` for PostgreSQL server management
- See `documentation/domain/voice-pipeline.md` for call cost tracking implementation
- See `CRITICAL_RAINDROP_RULES.md` for database-proxy service deployment rules

---

**End of Database Documentation**
