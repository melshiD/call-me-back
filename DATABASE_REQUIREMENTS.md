# Call Me Back - Database Requirements & App Flows

## App Premise
"Call Me Back" is an AI voice calling service where users can:
1. Schedule calls from AI personas (Brad, Sarah, Alex, etc.)
2. Pay per call or use subscription credits
3. Customize personas and relationships
4. Track call history and costs

## Current Database Tables

### ✅ Implemented Tables

1. **personas** - Base AI personalities
   - id, name, voice_id, description, traits, etc.
   - Status: ✅ Working (Brad, Sarah, Alex loaded)

2. **calls** - Phone call records
   - id, user_id, persona_id, phone_number, status
   - payment_method, payment_intent_id, payment_status
   - estimated_cost_cents, actual_cost_cents, credits_used
   - Status: ✅ Created, needs testing

3. **scheduled_calls** - Future calls
   - id, user_id, persona_id, phone_number, scheduled_time
   - Status: ✅ Created, needs cron job implementation

4. **user_credits** - User account balance/subscription
   - available_credits, subscription info, limits
   - Status: ✅ Created, needs integration

5. **credit_transactions** - Audit trail
   - transaction history for credits
   - Status: ✅ Created, needs integration

6. **user_persona_relationships** - User-specific persona customization
   - Custom prompts, voice settings, relationship type
   - Status: ✅ Exists, partially integrated

7. **call_cost_breakdowns** - Detailed cost tracking
   - Twilio, ElevenLabs, Cerebras, OpenAI costs
   - Status: ✅ Exists, needs integration

8. **call_scenario_templates** - Pre-built conversation scenarios
   - User templates for common calls
   - Status: ✅ Exists, needs UI

### ❌ Missing Tables (Need to Create)

1. **users** - User accounts
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
   ```

2. **token_blacklist** - JWT token revocation
   ```sql
   CREATE TABLE token_blacklist (
     token_id VARCHAR(255) PRIMARY KEY,
     user_id VARCHAR(255) NOT NULL,
     expires_at TIMESTAMP NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **user_budget_settings** - Cost limits per user
   ```sql
   CREATE TABLE user_budget_settings (
     user_id VARCHAR(255) PRIMARY KEY,
     max_cost_per_call_cents INTEGER DEFAULT 1000,
     max_monthly_spend_cents INTEGER DEFAULT 10000,
     warn_at_percent_per_call INTEGER DEFAULT 75,
     enable_auto_cutoff BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. **call_cost_events** - Granular cost tracking
   ```sql
   CREATE TABLE call_cost_events (
     id VARCHAR(255) PRIMARY KEY,
     call_id VARCHAR(255) NOT NULL,
     call_cost_breakdown_id VARCHAR(255),
     event_type VARCHAR(50),
     service VARCHAR(50),
     tokens_input INTEGER,
     tokens_output INTEGER,
     characters INTEGER,
     duration_seconds NUMERIC,
     calculated_cost_cents NUMERIC,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (call_id) REFERENCES calls(id)
   );
   ```

## Application Flows & Database Integration

### 1. User Registration Flow
```
Frontend → API Gateway → Auth Manager → Database
```
**Required:**
- ❌ Create `users` table
- ❌ Implement registration endpoint
- ❌ Password hashing with bcrypt
- ❌ Generate JWT tokens

### 2. User Login Flow
```
Frontend → API Gateway → Auth Manager → Database
```
**Required:**
- ❌ Verify credentials against `users` table
- ❌ Check `token_blacklist` for revoked tokens
- ❌ Return JWT token

### 3. Call Triggering Flow (Current Focus)
```
Frontend → API Gateway → Call Orchestrator → Database + Twilio
```
**Status:**
- ✅ API endpoint created
- ✅ Payment handling added (stripe, credits, demo)
- ✅ Database insert to `calls` table
- ⚠️ Demo mode works without Twilio
- ❌ Need to configure Twilio credentials
- ❌ Need to deduct credits from `user_credits`
- ❌ Need to check user budget settings

### 4. Voice Pipeline Flow
```
Twilio WebSocket → Voice Pipeline → ElevenLabs/Cerebras → Database
```
**Required:**
- ✅ Voice pipeline orchestrator exists
- ❌ Need to track costs in `call_cost_events`
- ❌ Need to update `call_cost_breakdowns`
- ❌ Need to check budget limits during call

### 5. Payment Flow
```
Frontend → Stripe → Payment Processor → Database
```
**Required:**
- ❌ Stripe webhook handling
- ❌ Update `user_credits` on purchase
- ❌ Record in `credit_transactions`
- ❌ Handle subscription renewals

### 6. Scheduled Calls Flow
```
Cron Job → Call Orchestrator → Database
```
**Required:**
- ❌ Implement cron job to check `scheduled_calls`
- ❌ Trigger calls at scheduled time
- ❌ Update status after execution

### 7. Persona Management Flow
```
Frontend → API Gateway → Persona Manager → Database
```
**Status:**
- ✅ Get personas endpoint working
- ✅ `user_persona_relationships` table exists
- ❌ Need endpoints for customization
- ❌ Need to save custom prompts

## Immediate Next Steps

1. **Create missing users table** (Critical for auth)
   ```bash
   # Create migration file: migrations/006_create_users_table.sql
   ```

2. **Fix call trigger to work in demo mode**
   - Test with simulated calls
   - Add proper logging
   - Return meaningful status

3. **Configure Twilio (when ready)**
   - Set environment variables:
     - TWILIO_ACCOUNT_SID
     - TWILIO_AUTH_TOKEN
     - TWILIO_PHONE_NUMBER

4. **Implement credit deduction**
   - Check user credits before call
   - Deduct estimated cost
   - Refund difference after call

5. **Add authentication to endpoints**
   - Validate JWT tokens
   - Extract user_id from token
   - Use real user_id instead of 'demo_user'

## Testing Checklist

### Current Status
- ✅ Personas API returns Brad, Sarah, Alex
- ✅ Frontend displays personas correctly
- ⚠️ Call trigger returns 500 (database issue)
- ❌ Authentication not implemented
- ❌ Payment processing not connected
- ❌ Voice pipeline not tested
- ❌ Scheduled calls not implemented

### What Works Now
1. Persona retrieval from database
2. Frontend navigation and UI
3. Database connection via proxy
4. CORS enabled for API access

### What Needs Work
1. User authentication system
2. Call triggering (demo mode first)
3. Payment integration
4. Voice pipeline configuration
5. Scheduled call system
6. Cost tracking and limits

## Environment Variables Needed

### Currently Set
- ✅ VULTR_DB_API_KEY
- ✅ VULTR_DB_PASSWORD
- ✅ VITE_API_URL (frontend)

### Still Needed
- ❌ TWILIO_ACCOUNT_SID
- ❌ TWILIO_AUTH_TOKEN
- ❌ TWILIO_PHONE_NUMBER
- ❌ STRIPE_SECRET_KEY
- ❌ STRIPE_WEBHOOK_SECRET
- ❌ ELEVENLABS_API_KEY
- ❌ CEREBRAS_API_KEY
- ❌ OPENAI_API_KEY
- ❌ DEEPGRAM_API_KEY
- ❌ JWT_SECRET

## Database Connection Architecture
```
Frontend (Vercel)
    ↓
API Gateway (Raindrop)
    ↓
Service (Auth/Call/Persona)
    ↓
Database Proxy (Raindrop Service)
    ↓
PostgreSQL (Vultr)
```

This architecture bypasses Cloudflare Workers' external URL restrictions.

## Summary

The app has a solid foundation with:
- ✅ Database structure mostly complete
- ✅ Service architecture in place
- ✅ Frontend connected to backend
- ✅ Personas loading from database

Main gaps to address:
1. **Users table** - Critical for auth
2. **Authentication flow** - Login/register
3. **Call triggering** - Get demo mode working
4. **Payment flow** - Credits and Stripe
5. **Voice pipeline** - Twilio/ElevenLabs integration

Recommended approach:
1. Create users table first
2. Get demo calls working without Twilio
3. Implement basic auth
4. Add payment handling
5. Configure external services last