# Raindrop Database Analysis - Call Me Back

## IMPORTANT FINDING: We Already Have Everything in Raindrop!

You were absolutely right to check! The app is **already configured** to use Raindrop's SmartSQL database (`call-me-back-db`) for all database operations. We should **NOT** migrate to Vultr PostgreSQL - instead, we should use what's already built into Raindrop.

## Current Database Architecture

### Raindrop SmartSQL Database: `call-me-back-db`
This is where ALL the app's data is stored (or should be):

```
raindrop.manifest:
  smartsql "call-me-back-db" { }
```

### What's Using the SmartSQL Database

Every service has access to `CALL_ME_BACK_DB` via their environment:

1. **auth-manager** - User authentication
   - `SELECT id FROM users WHERE email = ?`
   - `INSERT INTO users (id, email, password_hash, name, phone)`
   - Token blacklist operations

2. **call-orchestrator** - Call management
   - `INSERT INTO calls (...)`
   - `UPDATE calls SET twilio_call_sid = ?`
   - `INSERT INTO scheduled_calls (...)`

3. **voice-pipeline** - During calls
   - `SELECT * FROM personas WHERE id = ?`
   - `SELECT * FROM user_persona_relationships`
   - Cost tracking operations

4. **api-gateway** - Scenario templates
   - `ScenarioTemplateManager(this.env.CALL_ME_BACK_DB)`

## Authentication System Analysis

### Current Implementation (in auth-manager)

1. **Register Flow** (src/auth-manager/index.ts:12-59)
   ```typescript
   async register(input: RegisterInput): Promise<AuthResponse> {
     // Check if user exists in SmartSQL
     const existingUser = await executeSQL(
       this.env.CALL_ME_BACK_DB,
       'SELECT id FROM users WHERE email = ?',
       [input.email]
     );

     // Hash password with bcrypt
     const passwordHash = await utils.hashPassword(input.password);

     // Insert into SmartSQL
     await executeSQL(
       this.env.CALL_ME_BACK_DB,
       'INSERT INTO users (id, email, password_hash, name, phone) VALUES (?, ?, ?, ?, ?)',
       [userId, input.email, passwordHash, input.name, input.phone]
     );

     // Generate JWT token
     const token = await utils.generateToken(userId, input.email, this.env.JWT_SECRET);
   }
   ```

2. **Login Flow** (src/auth-manager/index.ts:61-109)
   ```typescript
   async login(input: LoginInput): Promise<AuthResponse> {
     // Find user in SmartSQL
     const result = await executeSQL(
       this.env.CALL_ME_BACK_DB,
       'SELECT * FROM users WHERE email = ?',
       [input.email]
     );

     // Verify password with bcrypt
     const isValid = await utils.verifyPassword(input.password, user.password_hash);

     // Generate JWT token
     const token = await utils.generateToken(user.id, input.email, this.env.JWT_SECRET);
   }
   ```

3. **Token Validation** (src/auth-manager/index.ts:111-144)
   - Validates JWT signature
   - Checks token blacklist in SmartSQL
   - Returns user info if valid

4. **Logout** (src/auth-manager/index.ts:146-164)
   - Adds token to blacklist in SmartSQL
   - Prevents reuse of logged-out tokens

### JWT Implementation (src/auth-manager/utils.ts)
- Uses `jose` library for JWT operations
- Tokens include: userId, email, tokenId, iat, exp
- 24-hour expiration by default

## The executeSQL Helper

The app uses a helper function to work with SmartSQL:

```typescript
// src/shared/db-helpers.ts
export async function executeSQL(db: SmartSql, sql: string, args?: any[]): Promise<{ rows: any[] }> {
  // Formats SQL with args inline since SmartSQL uses sqlQuery
  let formattedSql = sql;
  if (args && args.length > 0) {
    args.forEach((arg, index) => {
      const value = typeof arg === 'string' ? `'${arg.replace(/'/g, "''")}'` : arg;
      formattedSql = formattedSql.replace('?', String(value));
    });
  }

  const result = await db.executeQuery({ sqlQuery: formattedSql });
  return { rows: result.results ? JSON.parse(result.results) : [] };
}
```

## What Tables Need to be Created in SmartSQL

Since we're using Raindrop's SmartSQL, we need to run migrations THERE, not on Vultr. The tables needed are:

### Core Tables (MUST CREATE)
1. **users** - For authentication
2. **calls** - For tracking calls
3. **scheduled_calls** - For future calls
4. **token_blacklist** - For JWT revocation
5. **user_credits** - For payment/credits
6. **credit_transactions** - Audit trail
7. **user_budget_settings** - Cost limits

### Already Expected Tables (used in code)
8. **personas** - AI personalities (already referenced)
9. **user_persona_relationships** - Customization
10. **call_cost_breakdowns** - Cost tracking
11. **call_scenario_templates** - Templates

## The Problem: Tables Don't Exist Yet!

The code expects these tables but they haven't been created in SmartSQL. That's why calls fail with "Database query failed".

## Solution: Initialize SmartSQL Database

We need to run SQL migrations directly on the SmartSQL database. Raindrop should handle this automatically when deploying if we set up the migrations correctly.

### Option 1: Manual SQL Execution (Quick for Hackathon)
Use Raindrop CLI to execute SQL directly on SmartSQL:
```bash
raindrop sql execute --database call-me-back-db --file migrations/001_create_personas_tables.sql
```

### Option 2: Auto-migrations (Better)
Raindrop SmartSQL should run migrations automatically on deploy if we place them in the right location.

## Advantages of Staying with Raindrop SmartSQL

1. **Simpler Architecture** - No external database needed
2. **Better Performance** - No cross-network calls
3. **Automatic Scaling** - Raindrop handles it
4. **Integrated Auth** - Works with Raindrop's service mesh
5. **Cost Effective** - No separate database costs
6. **Easier Deployment** - Everything in one place

## Immediate Next Steps

1. **Create tables in SmartSQL** (not Vultr!)
   - Run migrations on the SmartSQL database
   - Use Raindrop CLI or API

2. **Test Authentication**
   - Register endpoint: POST /api/auth/register
   - Login endpoint: POST /api/auth/login
   - Should work once users table exists

3. **Fix Call Triggering**
   - Create calls table in SmartSQL
   - Test with demo mode

4. **Verify Everything Works**
   - All data stays in Raindrop
   - No need for Vultr database (except maybe for backup)

## Key Insight

The app architecture is actually MORE sophisticated than we thought:
- It's designed to use Raindrop's native SmartSQL
- The Vultr database was probably added later as a workaround
- We should use Raindrop's infrastructure as intended

## Environment Variables Status

### What's Needed for SmartSQL
- ✅ JWT_SECRET (for auth tokens) - Need to set this!
- ✅ CALL_ME_BACK_DB (automatic from manifest)

### What's NOT Needed (if using SmartSQL)
- ❌ VULTR_DB_API_KEY (only if using external DB)
- ❌ VULTR_DB_API_URL (only if using external DB)

## Summary

**DO NOT MIGRATE TO VULTR!** The app is designed to use Raindrop's SmartSQL. We just need to:
1. Create the tables in SmartSQL
2. Set JWT_SECRET environment variable
3. Test that everything works

This is much simpler and better for the hackathon!