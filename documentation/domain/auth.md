# Authentication & Authorization
**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** auth, jwt, workos, oauth, security

---

## Quick Reference

### Current Implementation
- **Primary:** JWT-based authentication
- **Secondary:** WorkOS AuthKit (OAuth) - optional fallback
- **Password Hashing:** bcrypt (cost factor 12+)
- **Token Storage:** localStorage (client), token_blacklist (server)
- **Admin Auth:** Separate admin_users table with admin JWT

### Token Verification
```typescript
// Verify JWT token
const user = await AUTH_MANAGER.verifyToken(token)

// Admin token verification
const admin = await AUTH_MANAGER.verifyAdminToken(adminToken)
```

### Environment Variables
```bash
# JWT Authentication
JWT_SECRET=<32+ character secret>

# WorkOS OAuth (Optional)
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=<32 character random string>
```

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [JWT Authentication (Primary)](#2-jwt-authentication-primary)
3. [WorkOS OAuth (Optional)](#3-workos-oauth-optional)
4. [Admin Authentication](#4-admin-authentication)
5. [Password Security](#5-password-security)
6. [Token Management](#6-token-management)
7. [Database Schema](#7-database-schema)
8. [Security Measures](#8-security-measures)
9. [Implementation Details](#9-implementation-details)

---

## 1. Architecture Overview

### Authentication Flow

```
┌──────────────────────────────────────┐
│          Client (Frontend)           │
│  - Stores JWT in localStorage        │
│  - Sends token in Authorization      │
└──────────────────────────────────────┘
              ↕ HTTPS
┌──────────────────────────────────────┐
│        API Gateway (Workers)         │
│  - Receives auth requests            │
│  - Routes to auth-manager            │
└──────────────────────────────────────┘
              ↕ Internal
┌──────────────────────────────────────┐
│      Auth Manager (Service)          │
│  - Verifies credentials              │
│  - Generates JWT tokens              │
│  - Optional: WorkOS integration      │
└──────────────────────────────────────┘
              ↕ Internal
┌──────────────────────────────────────┐
│    Database Proxy → PostgreSQL       │
│  - users table                       │
│  - admin_users table                 │
│  - token_blacklist table             │
│  - admin_sessions table              │
└──────────────────────────────────────┘
```

### Dual Authentication Strategy

**Primary: JWT (Custom Implementation)**
- Used by default
- Fully functional and tested
- No external dependencies
- Stored in localStorage

**Secondary: WorkOS AuthKit (Optional)**
- Enterprise-grade OAuth provider
- SSO and MFA support
- Hosted UI for login/signup
- Falls back to JWT if not configured

---

## 2. JWT Authentication (Primary)

### Implementation

**Service:** `auth-manager` (Raindrop service)
**Location:** `src/auth-manager/index.ts`

### Registration Flow

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}
```

**Implementation:**
```typescript
async register(input: RegisterInput): Promise<AuthResponse> {
  // 1. Validate password strength
  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  // 2. Check if user exists
  const existingUser = await this.env.DATABASE_PROXY.executeQuery(
    'SELECT id FROM users WHERE email = $1',
    [input.email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('User already exists');
  }

  // 3. Hash password (bcrypt, cost factor 12+)
  const passwordHash = await utils.hashPassword(input.password);

  // 4. Generate user ID
  const userId = crypto.randomUUID();

  // 5. Insert user into database
  await this.env.DATABASE_PROXY.executeQuery(
    'INSERT INTO users (id, email, password_hash, name, phone) VALUES ($1, $2, $3, $4, $5)',
    [userId, input.email, passwordHash, input.name, input.phone]
  );

  // 6. Generate JWT token
  const token = await utils.generateToken(userId, input.email, this.env.JWT_SECRET);

  // 7. Return user + token
  return {
    token,
    user: {
      id: userId,
      email: input.email,
      name: input.name,
      phone: input.phone,
      emailVerified: false,
      phoneVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "emailVerified": false,
    "phoneVerified": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### Login Flow

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Implementation:**
```typescript
async login(input: LoginInput): Promise<AuthResponse> {
  // 1. Get user from database
  const result = await this.env.DATABASE_PROXY.executeQuery(
    'SELECT * FROM users WHERE email = $1',
    [input.email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // 2. Verify password (bcrypt compare)
  const isValid = await utils.verifyPassword(input.password, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // 3. Generate JWT token
  const token = await utils.generateToken(user.id, user.email, this.env.JWT_SECRET);

  // 4. Return user + token
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: Boolean(user.email_verified),
      phoneVerified: Boolean(user.phone_verified),
      stripeCustomerId: user.stripe_customer_id,
      defaultPaymentMethod: user.default_payment_method,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  };
}
```

---

### Token Verification

**Purpose:** Verify JWT token on protected routes

**Implementation:**
```typescript
async verifyToken(token: string): Promise<TokenValidationResult> {
  try {
    // 1. Check if token is blacklisted
    const blacklisted = await this.env.DATABASE_PROXY.executeQuery(
      'SELECT id FROM token_blacklist WHERE token_hash = $1',
      [await utils.hashToken(token)]
    );

    if (blacklisted.rows.length > 0) {
      throw new Error('Token has been revoked');
    }

    // 2. Verify JWT signature and expiration
    const payload = await utils.verifyToken(token, this.env.JWT_SECRET);

    // 3. Get user from database
    const result = await this.env.DATABASE_PROXY.executeQuery(
      'SELECT * FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        emailVerified: Boolean(user.email_verified),
        phoneVerified: Boolean(user.phone_verified),
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token validation failed',
    };
  }
}
```

**Usage in API Gateway:**
```typescript
// In api-gateway/index.ts
const authHeader = request.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');

const validation = await this.env.AUTH_MANAGER.verifyToken(token);

if (!validation.valid) {
  return new Response('Unauthorized', { status: 401 });
}

const user = validation.user;
// Proceed with authenticated request
```

---

### Logout Flow

**Endpoint:** `POST /api/auth/logout`

**Request:**
```
Headers:
  Authorization: Bearer <token>
```

**Implementation:**
```typescript
async logout(token: string): Promise<void> {
  // Hash token and add to blacklist
  const tokenHash = await utils.hashToken(token);

  await this.env.DATABASE_PROXY.executeQuery(
    'INSERT INTO token_blacklist (token_hash, expires_at) VALUES ($1, $2)',
    [tokenHash, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] // 30 days
  );

  // Client clears localStorage
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### JWT Token Structure

**Algorithm:** HS256 (HMAC SHA-256)

**Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "iat": 1640995200,
  "exp": 1643587200
}
```

**Expiration:** 30 days from issuance

**Secret:** Stored in `JWT_SECRET` environment variable (32+ characters)

**Library:** `jose` package for JWT operations

---

## 3. WorkOS OAuth (Optional)

### Overview

**Status:** Configured but optional
**Use Case:** Enterprise SSO, MFA, hosted UI
**Fallback:** JWT authentication if WorkOS not configured

### WorkOS Setup

**Location:** `src/auth-manager/index.ts:28`

**Environment Variables:**
```bash
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=<32 character random string>
```

**AuthKit Subdomain:** `giving-hay-85-staging.authkit.app`

---

### WorkOS Registration

**Implementation:**
```typescript
async register(input: RegisterInput): Promise<AuthResponse> {
  const workos = this.getWorkOS();

  if (workos && this.env.WORKOS_CLIENT_ID) {
    // Use WorkOS for registration
    try {
      // 1. Create user in WorkOS
      const workosUser = await workos.userManagement.createUser({
        email: input.email,
        password: input.password,
        firstName: input.name?.split(' ')[0] || '',
        lastName: input.name?.split(' ').slice(1).join(' ') || '',
        emailVerified: false
      });

      // 2. Store user in database with WorkOS ID
      const userId = workosUser.id;
      await this.env.DATABASE_PROXY.executeQuery(
        'INSERT INTO users (id, email, password_hash, name, phone) VALUES ($1, $2, $3, $4, $5)',
        [userId, input.email, 'workos', input.name, input.phone]
      );

      // 3. Authenticate to get access token
      const authResponse = await workos.userManagement.authenticateWithPassword({
        email: input.email,
        password: input.password,
        clientId: this.env.WORKOS_CLIENT_ID
      });

      // 4. Return WorkOS access token
      return {
        token: authResponse.accessToken,
        user: { ... }
      };
    } catch (workosError) {
      // Fall back to JWT authentication
    }
  }

  // Fallback: JWT authentication
  // ... (JWT registration code)
}
```

---

### WorkOS Login

**Implementation:**
```typescript
async login(input: LoginInput): Promise<AuthResponse> {
  const workos = this.getWorkOS();

  if (workos && this.env.WORKOS_CLIENT_ID) {
    try {
      // 1. Authenticate with WorkOS
      const authResponse = await workos.userManagement.authenticateWithPassword({
        email: input.email,
        password: input.password,
        clientId: this.env.WORKOS_CLIENT_ID
      });

      // 2. Get user from database (or create if doesn't exist)
      let result = await this.env.DATABASE_PROXY.executeQuery(
        'SELECT * FROM users WHERE id = $1',
        [authResponse.user.id]
      );

      if (result.rows.length === 0) {
        // User doesn't exist, create them
        await this.env.DATABASE_PROXY.executeQuery(
          'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
          [authResponse.user.id, authResponse.user.email, 'workos', authResponse.user.firstName || '']
        );
      }

      // 3. Return WorkOS access token
      return {
        token: authResponse.accessToken,
        user: { ... }
      };
    } catch (workosError) {
      // Fall back to JWT authentication
    }
  }

  // Fallback: JWT authentication
  // ... (JWT login code)
}
```

---

### WorkOS OAuth Flow (MCP)

**Purpose:** OAuth for MCP service (log-aggregator)

**Configuration:**
```hcl
# raindrop.manifest
service log-aggregator-mcp {
  ...
  visibility             = "protected"
  authorization_server   = "https://giving-hay-85-staging.authkit.app"
  token_exchange_enabled = true
}
```

**OAuth Discovery Endpoint:**
```bash
curl https://giving-hay-85-staging.authkit.app/.well-known/oauth-authorization-server
```

**Returns:**
- `authorization_endpoint` - Where to redirect for login
- `token_endpoint` - Where to exchange code for token
- `registration_endpoint` - Dynamic Client Registration
- `jwks_uri` - Public keys for token verification

**Redirect URIs (configured in WorkOS dashboard):**
- `https://claude.ai/api/mcp/auth_callback`
- `https://claude.com/api/mcp/auth_callback`

**Status:** Configured but MCP protocol connection issues (see `MCP_DEBUGGING_SESSION.md`)

---

## 4. Admin Authentication

### Overview

**Purpose:** Separate authentication for admin panel
**Storage:** `admin_users` table (separate from regular users)
**Token:** Admin JWT with admin flag

### Admin Users Table

**Migration:** `migrations/009_create_admin_users.sql`

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### Admin Sessions Table

**Purpose:** Track admin sessions for audit and revocation

```sql
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_admin_sessions_user` on `admin_user_id`
- `idx_admin_sessions_expires` on `expires_at`
- `idx_admin_users_email` on `email`

---

### Admin Login

**Endpoint:** `POST /api/admin/login` (or via WorkOS OAuth)

**Implementation:**
```typescript
async adminLogin(email: string, password: string): Promise<AuthResponse> {
  // 1. Get admin user from database
  const result = await this.env.DATABASE_PROXY.executeQuery(
    'SELECT * FROM admin_users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const admin = result.rows[0];

  // 2. Verify password
  const isValid = await utils.verifyPassword(password, admin.password_hash);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // 3. Generate admin JWT token (with admin flag)
  const token = await utils.generateAdminToken(admin.id, admin.email, this.env.JWT_SECRET);

  // 4. Create session record
  const tokenHash = await utils.hashToken(token);
  await this.env.DATABASE_PROXY.executeQuery(
    'INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [admin.id, tokenHash, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
  );

  // 5. Update last_login_at
  await this.env.DATABASE_PROXY.executeQuery(
    'UPDATE admin_users SET last_login_at = NOW() WHERE id = $1',
    [admin.id]
  );

  return {
    token,
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,
    },
  };
}
```

---

### Admin Token Verification

**Implementation:**
```typescript
async verifyAdminToken(token: string): Promise<TokenValidationResult> {
  // 1. Check if session exists and not expired
  const tokenHash = await utils.hashToken(token);
  const session = await this.env.DATABASE_PROXY.executeQuery(
    'SELECT admin_user_id FROM admin_sessions WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash]
  );

  if (session.rows.length === 0) {
    throw new Error('Invalid or expired admin session');
  }

  // 2. Verify JWT signature
  const payload = await utils.verifyToken(token, this.env.JWT_SECRET);

  if (!payload.isAdmin) {
    throw new Error('Not an admin token');
  }

  // 3. Get admin user
  const result = await this.env.DATABASE_PROXY.executeQuery(
    'SELECT * FROM admin_users WHERE id = $1',
    [payload.userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Admin user not found');
  }

  const admin = result.rows[0];

  return {
    valid: true,
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isAdmin: true,
    },
  };
}
```

---

### Admin Routes Protection

**Pattern:** Check admin token on admin routes

```typescript
// In api-gateway/index.ts
if (path.startsWith('/api/admin')) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  const validation = await this.env.AUTH_MANAGER.verifyAdminToken(token);

  if (!validation.valid || !validation.user.isAdmin) {
    return new Response('Forbidden', { status: 403 });
  }

  // Proceed with admin request
}
```

---

## 5. Password Security

### Hashing

**Algorithm:** bcrypt
**Cost Factor:** 12+ (configurable)
**Library:** `bcryptjs` package

**Implementation:**
```typescript
// src/auth-manager/utils.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

---

### Password Requirements

**Minimum Length:** 8 characters

**Complexity Requirements (enforced on registration):**
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Validation:**
```javascript
// Frontend validation (src/stores/auth.js)
const validatePassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain an uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain a lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain a number';
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return 'Password must contain a special character';
  }
  return null;
}
```

---

### Account Lockout

**Purpose:** Prevent brute-force attacks

**Implementation (recommended):**
- Track failed login attempts in database
- Lock account after 10 failed attempts
- Lockout duration: 30 minutes
- Reset counter on successful login

**Schema:**
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
```

**Logic:**
```typescript
async login(input: LoginInput): Promise<AuthResponse> {
  // 1. Check if account is locked
  const user = await this.getUserByEmail(input.email);

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new Error('Account locked. Try again later.');
  }

  // 2. Verify password
  const isValid = await utils.verifyPassword(input.password, user.password_hash);

  if (!isValid) {
    // Increment failed attempts
    const attempts = user.failed_login_attempts + 1;

    if (attempts >= 10) {
      // Lock account for 30 minutes
      await this.env.DATABASE_PROXY.executeQuery(
        'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
        [attempts, new Date(Date.now() + 30 * 60 * 1000), user.id]
      );
      throw new Error('Too many failed attempts. Account locked for 30 minutes.');
    }

    // Update failed attempts
    await this.env.DATABASE_PROXY.executeQuery(
      'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
      [attempts, user.id]
    );

    throw new Error('Invalid credentials');
  }

  // 3. Reset failed attempts on successful login
  await this.env.DATABASE_PROXY.executeQuery(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
    [user.id]
  );

  // ... (generate token and return)
}
```

---

## 6. Token Management

### JWT Token Generation

**Library:** `jose` package

**Implementation:**
```typescript
import { SignJWT } from 'jose';

export async function generateToken(userId: string, email: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const token = await new SignJWT({
    userId,
    email,
    isAdmin: false
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey);

  return token;
}
```

---

### JWT Token Verification

**Implementation:**
```typescript
import { jwtVerify } from 'jose';

export async function verifyToken(token: string, secret: string): Promise<any> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

---

### Token Blacklist

**Purpose:** Revoke tokens on logout

**Table:** `token_blacklist`

```sql
CREATE TABLE token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Token Hashing:**
```typescript
import crypto from 'crypto';

export async function hashToken(token: string): Promise<string> {
  return crypto.createHash('sha256').update(token).digest('hex');
}
```

**Why Hash Tokens:**
- Don't store full tokens in database
- Hash provides lookup capability
- Protects against database leaks

---

### Token Cleanup

**Purpose:** Remove expired tokens from blacklist

**Recommended:** Cron job or scheduled task

**Query:**
```sql
DELETE FROM token_blacklist WHERE expires_at < NOW();
DELETE FROM admin_sessions WHERE expires_at < NOW();
```

---

## 7. Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  default_payment_method VARCHAR(255),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

---

### Token Blacklist Table

```sql
CREATE TABLE token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX idx_token_blacklist_hash ON token_blacklist(token_hash);
```

---

### Admin Users Table

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
```

---

### Admin Sessions Table

```sql
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_sessions_user ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
```

---

## 8. Security Measures

### HTTPS Only

**Requirement:** All API calls must use HTTPS in production

**Implementation:**
- Cloudflare Workers enforce HTTPS
- Redirect HTTP to HTTPS
- HSTS headers

---

### Token Storage

**Client-Side:** localStorage (not sessionStorage or cookies)

**Why localStorage:**
- Persists across browser sessions
- Accessible to JavaScript (required for API calls)
- Cleared on logout

**Security Considerations:**
- Vulnerable to XSS attacks
- Mitigation: Sanitize all user input
- Mitigation: CSP headers

---

### CORS Configuration

**Allow Origins:**
- Production: `https://callmeback.app`
- Development: `http://localhost:3000`

**Headers:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

---

### Input Sanitization

**XSS Prevention:**
- Sanitize all text inputs
- HTML entity encoding
- No `eval()` or `innerHTML`

**SQL Injection Prevention:**
- Use parameterized queries
- Never concatenate user input into SQL

**Example:**
```typescript
// CORRECT: Parameterized query
await this.env.DATABASE_PROXY.executeQuery(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// INCORRECT: Concatenated query (SQL injection risk)
await this.env.DATABASE_PROXY.executeQuery(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

---

### Rate Limiting

**Auth Endpoints:**
- Login: 5 requests/minute per IP
- Register: 3 requests/hour per IP
- Logout: 10 requests/minute per user

**Implementation:**
- Cloudflare Workers rate limiting
- Or custom rate limiting via KV store

---

### Sensitive Data Logging

**Do NOT log:**
- Passwords (plain or hashed)
- Full tokens (hash or redact)
- Credit card numbers
- SSNs or PII

**Example:**
```typescript
// CORRECT: Log email, not password
this.env.logger.info('User login attempt', { email: input.email });

// INCORRECT: Don't log password
this.env.logger.info('User login attempt', { email: input.email, password: input.password });
```

---

## 9. Implementation Details

### Service-to-Service Communication

**Pattern:** Internal Worker-to-Worker calls

**Example:**
```typescript
// In api-gateway/index.ts
const validation = await this.env.AUTH_MANAGER.verifyToken(token);

if (!validation.valid) {
  return new Response('Unauthorized', { status: 401 });
}

const user = validation.user;
```

**See:** `documentation/domain/raindrop.md` for service architecture

---

### Frontend Integration

**Store:** `src/stores/auth.js`

**Login:**
```javascript
const login = async (email, password) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  user.value = data.user;
  token.value = data.token;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
};
```

**Session Persistence:**
```javascript
// On app load (main.js)
const authStore = useAuthStore();

if (authStore.token) {
  await authStore.fetchUser();  // GET /api/auth/me
}
```

**See:** `documentation/domain/frontend.md` for frontend implementation

---

### Testing Authentication

**Manual Test:**
```bash
# Register
curl -X POST https://api.callmeback.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "phone": "+1234567890"
  }'

# Login
curl -X POST https://api.callmeback.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Get current user
curl -X GET https://api.callmeback.app/api/auth/me \
  -H "Authorization: Bearer <token>"

# Logout
curl -X POST https://api.callmeback.app/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

## Sources

**Consolidated from:**
- WORKOS_INTEGRATION_PLAN.md (WorkOS setup, dated 2024-11-19)
- OAUTH_MCP_SESSION_COMPLETE.md (OAuth configuration, dated 2024-11-18)
- documentation/session_logs/OAUTH_SESSION_LOG.md (OAuth debugging)
- src/auth-manager/index.ts (JWT + WorkOS implementation, lines 1-200)
- migrations/009_create_admin_users.sql (admin schema)
- PCR2.md (authentication overview)

**Related Documents:**
- See also: `documentation/domain/api.md` (Auth endpoints)
- See also: `documentation/domain/frontend.md` (Frontend auth integration)
- See also: `documentation/domain/database.md` (User tables schema)
- See also: `documentation/domain/raindrop.md` (auth-manager service)
