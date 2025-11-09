# Call Me Back - Complete API Specification

**Version:** 1.0.0
**Base URL:** `https://api.callmeback.app` (or your configured base URL)
**Protocol:** HTTPS required in production

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Call Management](#2-call-management)
3. [Persona Management](#3-persona-management)
4. [Contact Management](#4-contact-management)
5. [User & Profile](#5-user--profile)
6. [Billing & Payments](#6-billing--payments)
7. [Webhooks](#7-webhooks)
8. [Error Handling](#8-error-handling)
9. [Rate Limiting](#9-rate-limiting)
10. [Security Considerations](#10-security-considerations)

---

## 1. Authentication & Authorization

### 1.1 Login

```
POST /api/auth/login
```

**Authentication:** None (public endpoint)
**Rate Limit:** 5 requests/minute per IP

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` VALIDATION_ERROR - Invalid input format
- `401` INVALID_CREDENTIALS - Wrong email/password
- `429` RATE_LIMIT_EXCEEDED - Too many attempts
- `500` SERVER_ERROR - Server error

**Validation:**
- email: Valid email format, max 255 chars
- password: Required, any length

**Security:**
- Bcrypt with cost factor 12+
- Account lockout after 10 failed attempts (30 min)
- Don't reveal if email exists

---

### 1.2 Register

```
POST /api/auth/register
```

**Authentication:** None (public endpoint)
**Rate Limit:** 3 requests/hour per IP

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}
```

**Success Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` VALIDATION_ERROR - Invalid input
- `409` EMAIL_EXISTS - Email already registered
- `409` PHONE_EXISTS - Phone already registered
- `429` RATE_LIMIT_EXCEEDED - Too many attempts

**Validation:**
- name: 1-100 chars, letters/spaces/hyphens/apostrophes only
- email: Valid format, unique, lowercase
- password: Min 8 chars, must include uppercase, lowercase, number, special char
- phone: E.164 format (+1234567890)

---

### 1.3 Logout

```
POST /api/auth/logout
```

**Authentication:** Required (JWT Bearer token)
**Rate Limit:** 10 requests/minute per user

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401` UNAUTHORIZED - Invalid/expired token

**Implementation:**
- Add token to revocation list
- Client clears localStorage

---

### 1.4 Get Current User

```
GET /api/auth/me
```

**Authentication:** Required (JWT Bearer token)
**Rate Limit:** 30 requests/minute per user

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "created_at": "2024-01-01T00:00:00Z",
    "email_verified": true,
    "phone_verified": true
  }
}
```

**Error Responses:**
- `401` UNAUTHORIZED - Invalid token
- `401` INVALID_TOKEN - Expired token
- `401` TOKEN_REVOKED - Token revoked

---

## 2. Call Management

### 2.1 Fetch Call History

```
GET /api/calls?page=1&limit=20&status=completed&sort=date_desc
```

**Authentication:** Required
**Rate Limit:** 60 requests/minute per user

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Items per page
- `status` (string, optional): completed | failed | in-progress | initiated
- `sort` (string, default: date_desc): date_desc | date_asc | cost_desc | cost_asc
- `from_date` (ISO 8601, optional): Filter from date
- `to_date` (ISO 8601, optional): Filter to date

**Success Response (200):**
```json
{
  "calls": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "persona_id": "uuid",
      "persona_name": "Best Friend",
      "status": "completed",
      "start_time": "2024-01-01T12:00:00Z",
      "end_time": "2024-01-01T12:05:30Z",
      "duration": 330,
      "cost": 2.45,
      "sid": "CA1234567890abcdef",
      "transcript": "Call transcript...",
      "error_message": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "pages": 3
  }
}
```

**Error Responses:**
- `400` VALIDATION_ERROR - Invalid parameters
- `401` UNAUTHORIZED - Auth required

**Implementation:**
- Only return authenticated user's calls
- Index on: user_id, status, start_time
- Cache for 30 seconds

---

### 2.2 Trigger Immediate Call

```
POST /api/call
```

**Authentication:** Required
**Rate Limit:** 5 requests/minute per user

**Request:**
```json
{
  "phone_number": "+1234567890",
  "persona_id": "uuid",
  "payment_intent_id": "pi_..."
}
```

**Success Response (200):**
```json
{
  "call": {
    "id": "uuid",
    "sid": "CA1234567890",
    "status": "initiated",
    "persona_id": "uuid",
    "phone_number": "+1234567890",
    "created_at": "2024-01-01T12:00:00Z",
    "estimated_cost": 2.25
  }
}
```

**Error Responses:**
- `400` VALIDATION_ERROR - Invalid phone/persona
- `401` UNAUTHORIZED - Auth required
- `402` PAYMENT_REQUIRED - No payment method
- `402` PAYMENT_FAILED - Payment declined
- `403` PHONE_NOT_VERIFIED - Phone verification required
- `429` CONCURRENT_CALLS - Already in call
- `500` TWILIO_ERROR - Twilio API error

**Validation:**
- phone_number: E.164 format (10-15 digits with +)
- persona_id: Must exist and be accessible
- payment_intent_id: Valid Stripe PaymentIntent in 'requires_capture' status

**Implementation:**
- Verify payment has sufficient pre-auth
- Create Twilio call via Programmable Voice
- Store call record immediately
- Send webhook URL to Twilio for status updates
- Check for concurrent calls (max 1 per user)
- Pricing: $0.25 connection + $0.40/minute

---

### 2.3 Schedule Future Call

```
POST /api/calls/schedule
```

**Authentication:** Required
**Rate Limit:** 10 requests/hour per user

**Request:**
```json
{
  "phone_number": "+1234567890",
  "persona_id": "uuid",
  "scheduled_time": "2024-01-02T15:00:00Z",
  "payment_intent_id": "pi_..."
}
```

**Success Response (201):**
```json
{
  "scheduled_call": {
    "id": "uuid",
    "user_id": "uuid",
    "persona_id": "uuid",
    "phone_number": "+1234567890",
    "scheduled_time": "2024-01-02T15:00:00Z",
    "status": "scheduled",
    "created_at": "2024-01-01T12:00:00Z",
    "estimated_cost": 2.25
  }
}
```

**Error Responses:**
- `400` VALIDATION_ERROR - Invalid inputs
- `401` UNAUTHORIZED - Auth required
- `402` PAYMENT_REQUIRED - No payment method
- `429` MAX_SCHEDULED - Max 50 active scheduled calls

**Validation:**
- scheduled_time: At least 5 minutes in future, max 30 days
- Must be ISO 8601 format

**Implementation:**
- Use cron job/queue for scheduled execution
- Pre-authorize payment at schedule time
- Send reminder 5 minutes before call
- Limit to 50 active scheduled calls per user

---

### 2.4 Cancel Scheduled Call

```
DELETE /api/calls/schedule/:id
```

**Authentication:** Required
**Rate Limit:** 20 requests/minute per user

**Success Response (200):**
```json
{
  "message": "Scheduled call cancelled successfully",
  "refund": {
    "amount": 0.25,
    "status": "refunded",
    "refund_id": "re_..."
  }
}
```

**Error Responses:**
- `400` CANCELLATION_DENIED - Too close to scheduled time (< 5 min)
- `403` FORBIDDEN - Not your call
- `404` NOT_FOUND - Call not found
- `500` REFUND_FAILED - Refund failed

**Implementation:**
- Verify user owns the call
- Process full refund via Stripe
- Remove from scheduling queue
- Cannot cancel if < 5 minutes before scheduled time

---

### 2.5 Fetch Scheduled Calls

```
GET /api/calls/scheduled?status=scheduled&sort=time_asc
```

**Authentication:** Required
**Rate Limit:** 60 requests/minute per user

**Query Parameters:**
- `status` (string, optional): scheduled | cancelled
- `sort` (string, default: time_asc): time_asc | time_desc

**Success Response (200):**
```json
{
  "scheduled_calls": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "persona_id": "uuid",
      "persona_name": "Best Friend",
      "phone_number": "+1234567890",
      "scheduled_time": "2024-01-02T15:00:00Z",
      "status": "scheduled",
      "created_at": "2024-01-01T12:00:00Z",
      "estimated_cost": 2.25
    }
  ]
}
```

---

## 3. Persona Management

### 3.1 Fetch Personas

```
GET /api/personas?page=1&limit=20&search=friend&tags=friendly,supportive
```

**Authentication:** Optional (authenticated users see private personas)
**Rate Limit:** 60/min (anonymous), 120/min (authenticated)

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Items per page
- `search` (string, min: 2 chars): Search name/description
- `tags` (string, comma-separated): Filter by tags
- `is_public` (boolean): Filter public/private
- `created_by` (string): Filter by creator (user_id or 'system')
- `sort` (string): name_asc | name_desc | created_asc | created_desc

**Success Response (200):**
```json
{
  "personas": [
    {
      "id": "uuid",
      "name": "Best Friend",
      "description": "Your supportive best friend...",
      "voice": "rachel",
      "system_prompt": "You are a supportive best friend...",
      "is_public": true,
      "created_by": "system",
      "tags": ["friendly", "supportive", "casual"],
      "created_at": "2024-01-01T00:00:00Z",
      "use_count": 1523
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

**Validation:**
- search: Min 2 chars, max 100 chars, alphanumeric + spaces
- tags: Max 10 tags, each max 30 chars

**Implementation:**
- Anonymous: Only public personas
- Authenticated: Public + user's private personas
- Cache public list for 5 minutes
- Index on: is_public, created_by, tags

---

### 3.2 Create Persona

```
POST /api/personas
```

**Authentication:** Required
**Rate Limit:** 20 requests/hour per user

**Request:**
```json
{
  "name": "My Custom Persona",
  "description": "A custom persona for...",
  "voice": "rachel",
  "system_prompt": "You are a...",
  "is_public": false,
  "tags": ["friendly", "custom"]
}
```

**Success Response (201):**
```json
{
  "persona": {
    "id": "uuid",
    "name": "My Custom Persona",
    "description": "A custom persona for...",
    "voice": "rachel",
    "system_prompt": "You are a...",
    "is_public": false,
    "created_by": "user_uuid",
    "tags": ["friendly", "custom"],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400` VALIDATION_ERROR - Invalid fields
- `400` DUPLICATE_NAME - Name already used by this user
- `402` PAYMENT_REQUIRED - Premium required for custom personas
- `429` MAX_PERSONAS - Max 50 personas (or 10 for free users)
- `500` VOICE_API_ERROR - ElevenLabs API error

**Validation:**
- name: 3-50 chars, alphanumeric + spaces/hyphens/apostrophes, unique per user
- description: 10-500 chars
- voice: Must be valid ElevenLabs voice ID
- system_prompt: 20-2000 chars
- tags: Max 10, each 2-30 chars, lowercase alphanumeric + hyphens

**Implementation:**
- Verify voice ID with ElevenLabs API
- Sanitize all text to prevent XSS
- Optional: content moderation for system_prompt
- Free users: 10 custom personas
- Premium users: 50 custom personas

---

### 3.3 Update Persona

```
PUT /api/personas/:id
```

**Authentication:** Required
**Rate Limit:** 30 requests/hour per user

**Request:** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "voice": "adam",
  "system_prompt": "Updated prompt",
  "is_public": true,
  "tags": ["updated", "tag"]
}
```

**Success Response (200):**
```json
{
  "persona": {
    "id": "uuid",
    ...
  }
}
```

**Error Responses:**
- `400` VALIDATION_ERROR - Invalid fields
- `401` UNAUTHORIZED - Auth required
- `403` FORBIDDEN - Cannot edit system personas / not your persona
- `404` NOT_FOUND - Persona not found

**Implementation:**
- Verify user owns persona (created_by must match user_id)
- System personas (created_by='system') cannot be edited
- Changing is_public to true may require moderation

---

### 3.4 Delete Persona

```
DELETE /api/personas/:id
```

**Authentication:** Required
**Rate Limit:** 20 requests/hour per user

**Success Response (200):**
```json
{
  "message": "Persona deleted successfully"
}
```

**Error Responses:**
- `401` UNAUTHORIZED - Auth required
- `403` FORBIDDEN - Cannot delete system personas / not your persona
- `404` NOT_FOUND - Persona not found

**Implementation:**
- Verify user owns persona
- System personas cannot be deleted
- Cascade delete: remove from all users' contacts
- Cannot delete if in active scheduled calls

---

## 4. Contact Management

### 4.1 Fetch Contacts

```
GET /api/contacts
```

**Authentication:** Required
**Rate Limit:** 60 requests/minute per user

**Success Response (200):**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "persona_id": "uuid",
      "persona": {
        "id": "uuid",
        "name": "Best Friend",
        ...
      },
      "added_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Implementation:**
- Return only authenticated user's contacts
- Include full persona object via join
- Sort by added_at desc
- Cache for 1 minute

---

### 4.2 Add to Contacts

```
POST /api/contacts
```

**Authentication:** Required
**Rate Limit:** 30 requests/minute per user

**Request:**
```json
{
  "persona_id": "uuid"
}
```

**Success Response (201):**
```json
{
  "contact": {
    "id": "uuid",
    "persona_id": "uuid",
    "added_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400` ALREADY_EXISTS - Already in contacts
- `404` NOT_FOUND - Persona not found
- `429` MAX_CONTACTS - Max 50 contacts

**Implementation:**
- Check persona exists and is accessible (public or owned by user)
- Prevent duplicates (unique constraint on user_id + persona_id)
- Limit to 50 contacts per user

---

### 4.3 Remove from Contacts

```
DELETE /api/contacts/:personaId
```

**Authentication:** Required
**Rate Limit:** 30 requests/minute per user

**Success Response (200):**
```json
{
  "message": "Removed from contacts"
}
```

---

## 5. User & Profile

### 5.1 Update Profile

```
PUT /api/user/profile
```

**Authentication:** Required
**Rate Limit:** 10 requests/minute per user

**Request:** (all fields optional)
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "phone": "+1234567890"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Updated Name",
    "email": "newemail@example.com",
    "phone": "+1234567890",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

**Error Responses:**
- `400` VALIDATION_ERROR - Invalid format
- `409` EMAIL_EXISTS - Email taken

**Validation:**
- name: 1-100 chars
- email: Valid format, unique
- phone: E.164 format

---

### 5.2 Fetch Usage Statistics

```
GET /api/user/usage?months=3
```

**Authentication:** Required
**Rate Limit:** 60 requests/minute per user

**Query Parameters:**
- `months` (number, default: 3): Number of months in breakdown

**Success Response (200):**
```json
{
  "total_calls": 47,
  "total_minutes": 142,
  "total_spent": 67.45,
  "current_month": {
    "calls": 12,
    "minutes": 38,
    "spent": 16.75
  },
  "monthly_breakdown": [
    {
      "month": "Nov 2024",
      "calls": 12,
      "minutes": 38,
      "spent": 16.75
    }
  ]
}
```

---

## 6. Billing & Payments

### 6.1 Fetch Billing Info

```
GET /api/user/billing
```

**Authentication:** Required
**Rate Limit:** 30 requests/minute per user

**Success Response (200):**
```json
{
  "payment_methods": [
    {
      "id": "pm_...",
      "type": "card",
      "last4": "4242",
      "brand": "visa",
      "exp_month": 12,
      "exp_year": 2025,
      "is_default": true
    }
  ],
  "balance": 0,
  "currency": "usd"
}
```

---

### 6.2 Add Payment Method

```
POST /api/user/payment-method
```

**Authentication:** Required
**Rate Limit:** 10 requests/hour per user

**Request:**
```json
{
  "payment_method_id": "pm_...",
  "set_as_default": true
}
```

**Success Response (201):**
```json
{
  "payment_method": {
    "id": "pm_...",
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "exp_month": 12,
    "exp_year": 2025,
    "is_default": true
  }
}
```

**Error Responses:**
- `400` VALIDATION_ERROR - Invalid payment method

**Implementation:**
- payment_method_id comes from Stripe.js client-side tokenization
- Attach PaymentMethod to Stripe Customer
- Store in database

---

### 6.3 Remove Payment Method

```
DELETE /api/user/payment-method/:id
```

**Authentication:** Required
**Rate Limit:** 20 requests/minute per user

**Success Response (200):**
```json
{
  "message": "Payment method removed"
}
```

**Error Responses:**
- `400` CANNOT_REMOVE_DEFAULT - Cannot remove default (set another first)

---

### 6.4 Set Default Payment Method

```
PUT /api/user/payment-method/:id/default
```

**Authentication:** Required
**Rate Limit:** 20 requests/minute per user

**Success Response (200):**
```json
{
  "message": "Default payment method updated"
}
```

---

### 6.5 Create Payment Intent

```
POST /api/user/create-payment-intent
```

**Authentication:** Required
**Rate Limit:** 10 requests/minute per user

**Request:**
```json
{
  "estimated_duration": 5
}
```

**Success Response (200):**
```json
{
  "payment_intent_id": "pi_...",
  "client_secret": "pi_...secret...",
  "amount": 225,
  "currency": "usd"
}
```

**Error Responses:**
- `400` NO_PAYMENT_METHOD - No payment method on file
- `402` PAYMENT_FAILED - Payment declined
- `402` CARD_DECLINED - Card declined
- `402` INSUFFICIENT_FUNDS - Insufficient funds
- `500` STRIPE_ERROR - Stripe API error

**Validation:**
- estimated_duration: 1-30 minutes

**Implementation:**
- Amount: $0.25 + ($0.40 × estimated_duration) in cents
- Create Stripe PaymentIntent with capture_method='manual'
- Use default payment method
- Capture actual amount after call based on real duration
- Metadata: user_id, call_type, estimated_duration

---

## 7. Webhooks

### 7.1 Twilio Status Callback

```
POST /api/twilio/callback
```

**Authentication:** Twilio signature verification
**Rate Limit:** No limit (webhook)

**Request:** (Twilio sends form data)
```
CallSid=CA...
CallStatus=completed
CallDuration=330
```

**Implementation:**
- Verify Twilio signature
- Update call record with final status and duration
- Calculate actual cost: $0.25 + ($0.40 × duration_minutes)
- Capture Stripe PaymentIntent with actual amount
- Store transcript if available

---

### 7.2 Stripe Webhook

```
POST /api/stripe/webhook
```

**Authentication:** Stripe signature verification
**Rate Limit:** No limit (webhook)

**Request:** Stripe webhook event

**Implementation:**
- Verify Stripe signature
- Handle events:
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - payment_method.attached
  - payment_method.detached
- Update database accordingly

---

## 8. Error Handling

### Standard Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "retry_after": 60,
  "details": {}
}
```

### Common Error Codes

**4xx Client Errors:**
- `VALIDATION_ERROR` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Authentication required
- `INVALID_TOKEN` (401) - Token invalid/expired
- `TOKEN_REVOKED` (401) - Token revoked
- `FORBIDDEN` (403) - Not authorized for resource
- `NOT_FOUND` (404) - Resource not found
- `EMAIL_EXISTS` (409) - Email already registered
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests

**Payment Errors:**
- `PAYMENT_REQUIRED` (402) - Payment method required
- `PAYMENT_FAILED` (402) - Payment declined
- `CARD_DECLINED` (402) - Card declined
- `INSUFFICIENT_FUNDS` (402) - Insufficient funds

**5xx Server Errors:**
- `SERVER_ERROR` (500) - Internal server error
- `TWILIO_ERROR` (500) - Twilio API error
- `STRIPE_ERROR` (500) - Stripe API error
- `SERVICE_UNAVAILABLE` (503) - Service unavailable

---

## 9. Rate Limiting

**Headers Included in Response:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

**Rate Limits by Endpoint Type:**
- Authentication: 5-10/min per IP
- Read operations: 60-120/min per user
- Write operations: 10-30/min per user
- Call triggering: 5/min per user
- Webhooks: No limit

**Rate Limit Response (429):**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "retry_after": 60
}
```

---

## 10. Security Considerations

### Authentication
- **JWT Tokens:** Expire in 30 days
- **Token Storage:** Store securely, never in URL
- **Token Revocation:** Maintain revocation list
- **HTTPS Only:** All API calls must use HTTPS in production

### Password Security
- **Hashing:** Bcrypt with cost factor 12+
- **Requirements:** Min 8 chars, uppercase, lowercase, number, special char
- **Lockout:** 10 failed attempts = 30 min lockout

### Input Validation
- **Sanitization:** All text inputs sanitized for XSS
- **E.164 Format:** All phone numbers normalized
- **Email Validation:** Proper format validation
- **SQL Injection:** Use parameterized queries

### Payment Security
- **PCI Compliance:** Never store card details
- **Stripe Elements:** Use for card collection
- **Manual Capture:** Pre-authorize, capture after call
- **Webhook Verification:** Verify Stripe/Twilio signatures

### API Security
- **CORS:** Configure allowed origins
- **Rate Limiting:** Prevent abuse
- **Request Size:** Limit to 1MB
- **Timeout:** 30 second timeout

### Data Privacy
- **Authorization:** Users only see their own data
- **Phone Numbers:** Mask in logs (show last 4 digits)
- **Transcripts:** Encrypted at rest
- **GDPR:** Support data export/deletion

---

## Appendix A: Pricing Model

**Connection Fee:** $0.25 per call
**Per-Minute Rate:** $0.40/minute

**Example Calculation:**
- 5-minute call: $0.25 + ($0.40 × 5) = $2.25
- 10-minute call: $0.25 + ($0.40 × 10) = $4.25

**Payment Flow:**
1. Pre-authorize estimated amount
2. Complete call
3. Capture actual amount based on real duration
4. Release unused pre-authorization

---

## Appendix B: Database Schema Recommendations

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Calls Table
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  persona_id UUID REFERENCES personas(id),
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER,
  cost DECIMAL(10,2),
  sid VARCHAR(50),
  transcript TEXT,
  error_message TEXT,
  payment_intent_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_calls_user_status ON calls(user_id, status);
CREATE INDEX idx_calls_start_time ON calls(start_time DESC);
```

### Personas Table
```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  voice VARCHAR(50) NOT NULL,
  system_prompt TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(50) NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_personas_public ON personas(is_public);
CREATE INDEX idx_personas_tags ON personas USING GIN(tags);
```

---

**End of API Specification**

For implementation details, see individual store files:
- `src/stores/auth.js` - Authentication endpoints
- `src/stores/calls.js` - Call management endpoints
- `src/stores/personas.js` - Persona management endpoints
- `src/stores/user.js` - User and billing endpoints
