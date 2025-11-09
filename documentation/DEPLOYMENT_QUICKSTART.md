# Call Me Back - Deployment Quickstart Guide

**Last Updated:** 2025-01-07
**Backend Status:** ✅ Deployed and Running
**Session ID:** `01k9dd97njbexcbqtkcy93z98t`

---

## 🎯 Current Status

Your backend is **live** with all 7 services and 4 resources running on Raindrop platform. The architecture is complete, but needs configuration and testing.

### What's Running:
- ✅ **7 Services**: api-gateway, auth-manager, persona-manager, call-orchestrator, payment-processor, voice-pipeline, webhook-handler
- ✅ **Database**: SmartSQL with schema for users, calls, personas, contacts, payment methods
- ✅ **Storage**: SmartBuckets for call transcripts
- ✅ **Memory**: SmartMemory for conversation context
- ✅ **Caches**: KV stores for token blacklist and rate limiting

### What's Needed:
1. Get the API base URL
2. Configure environment variables (API keys)
3. Test authentication flow
4. Seed system personas
5. Connect frontend

---

## 📍 Step 1: Get Your API Base URL

Run this command to find your deployed API endpoint:

```bash
cd /usr/code/ai_championship/call-me-back
pnpm raindrop info
```

**Your API Base URL:**
```
https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run
```

**Save this URL** - you'll use it for all API calls.

---

## 🔑 Step 2: Understanding JWT Authentication

### What is JWT?
JWT (JSON Web Token) is a secure way to authenticate users. Think of it like a movie ticket:
- You buy the ticket once (login)
- You show it every time you enter the theater (make API calls)
- It has an expiration date (30 days in our case)

### How Our Auth Flow Works:

#### **A. Register a New User** (No authentication needed)

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+15551234567"
}
```

**Password Requirements:**
- At least 8 characters
- Must have uppercase letter
- Must have lowercase letter
- Must have number
- Must have special character

**Phone Format:**
- Must be E.164 format: `+[country code][number]`
- Examples: `+15551234567` (US), `+442071234567` (UK)

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc-123-xyz",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+15551234567",
    "emailVerified": false,
    "phoneVerified": false,
    "createdAt": "2025-01-07T10:30:00Z",
    "updatedAt": "2025-01-07T10:30:00Z"
  }
}
```

**Save the `token` value!** You'll need it for all other API calls.

---

#### **B. Login (If User Already Exists)**

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { /* same user object */ }
}
```

---

#### **C. Using Your Token for Protected Endpoints**

Once you have a token, include it in the `Authorization` header for **all other API calls**:

**Header Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example with cURL:**
```bash
curl -X GET https://your-api-url.raindrop.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example with JavaScript/Fetch:**
```javascript
const response = await fetch('https://your-api-url.raindrop.app/api/calls', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Example with Axios:**
```javascript
const response = await axios.get('https://your-api-url.raindrop.app/api/calls', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

#### **D. Check If Token Is Valid**

**Endpoint:** `GET /api/auth/me`
**Auth Required:** ✅ Yes

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "id": "abc-123-xyz",
  "email": "john@example.com",
  "name": "John Doe",
  "phone": "+15551234567",
  "emailVerified": false,
  "phoneVerified": false,
  "createdAt": "2025-01-07T10:30:00Z"
}
```

---

#### **E. Logout**

**Endpoint:** `POST /api/auth/logout`
**Auth Required:** ✅ Yes

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

**What happens:** Your token gets blacklisted and won't work anymore. You'll need to login again to get a new token.

---

## 🧪 Step 3: Test Authentication Flow

### Quick Test Script (JavaScript/Node.js):

```javascript
const API_BASE = 'https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run';

// 1. Register a new user
const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'SecurePass123!',
    phone: '+15551234567'
  })
});

const { token, user } = await registerResponse.json();
console.log('Got token:', token);
console.log('User ID:', user.id);

// 2. Test the token by fetching user info
const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const currentUser = await meResponse.json();
console.log('Token is valid! User:', currentUser);

// 3. Get call history (will be empty for new user)
const callsResponse = await fetch(`${API_BASE}/api/calls`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const calls = await callsResponse.json();
console.log('Call history:', calls);
```

### Quick Test Script (cURL):

```bash
# 1. Register
TOKEN=$(curl -X POST https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "phone": "+15551234567"
  }' | jq -r '.token')

echo "Token: $TOKEN"

# 2. Test token
curl -X GET https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Get call history
curl -X GET https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/calls \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Step 4: Configure Environment Variables

Your backend needs these API keys to function. Set them in Raindrop:

```bash
# JWT Secret (generate a random string)
pnpm raindrop env set JWT_SECRET "your-super-secret-random-string-here"

# Twilio (for phone calls)
pnpm raindrop env set TWILIO_ACCOUNT_SID "your-twilio-sid"
pnpm raindrop env set TWILIO_AUTH_TOKEN "your-twilio-token"
pnpm raindrop env set TWILIO_PHONE_NUMBER "+15551234567"

# ElevenLabs (for text-to-speech)
pnpm raindrop env set ELEVENLABS_API_KEY "your-elevenlabs-key"

# Cerebras (for AI inference)
pnpm raindrop env set CEREBRAS_API_KEY "your-cerebras-key"

# Stripe (for payments)
pnpm raindrop env set STRIPE_SECRET_KEY "sk_test_..."
pnpm raindrop env set STRIPE_WEBHOOK_SECRET "whsec_..."

# OpenAI (fallback for AI)
pnpm raindrop env set OPENAI_API_KEY "sk-..."
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📝 Step 5: Database Initialization

The database schema is defined but tables need to be created. Run the SQL schema:

```bash
# The schema is in src/sql/call-me-back-db.ts
# You may need to manually execute it via Raindrop dashboard or CLI
```

**Schema includes:**
- `users` - User accounts
- `calls` - Call history
- `scheduled_calls` - Future scheduled calls
- `personas` - AI personas (both system and custom)
- `contacts` - User's favorite personas
- `payment_methods` - Stripe payment methods

---

## 🎭 Step 6: Seed System Personas

Create default personas that all users can use:

**System Personas to Create:**

1. **Best Friend** - Supportive companion for emotional support
2. **Boss** - Professional caller for work emergencies
3. **Partner** - Romantic partner for relationship scenarios
4. **Parent** - Family member for family situations
5. **Agent** - Professional agent for business calls

**Example API Call:**
```javascript
await fetch(`${API_BASE}/api/personas`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Best Friend',
    description: 'Your supportive best friend who always has your back',
    voice: 'rachel', // ElevenLabs voice ID
    system_prompt: 'You are a warm, supportive best friend. Be empathetic, understanding, and help your friend get out of uncomfortable situations naturally.',
    is_public: true,
    tags: ['friend', 'supportive', 'casual']
  })
});
```

---

## 🔗 Step 7: Connect Your Frontend

Update your Vue.js frontend `.env` file:

```bash
# In /usr/code/ai_championship/call-me-back/.env
VITE_API_BASE_URL=https://your-api-url.raindrop.app
```

Your frontend stores (in `src/stores/`) are already configured to use this base URL and handle JWT tokens automatically via Pinia.

---

## 🚀 Step 8: Full API Endpoint Reference

### Authentication (No token needed)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Authentication (Token required)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Calls (Token required)
- `GET /api/calls` - Get call history
- `POST /api/call` - Trigger immediate call
- `GET /api/calls/scheduled` - Get scheduled calls
- `POST /api/calls/schedule` - Schedule future call
- `DELETE /api/calls/schedule/:id` - Cancel scheduled call

### Personas (Token required for create/edit)
- `GET /api/personas` - List all personas (public + your private ones)
- `POST /api/personas` - Create custom persona
- `PUT /api/personas/:id` - Update your persona
- `DELETE /api/personas/:id` - Delete your persona

### Contacts (Token required)
- `GET /api/contacts` - Get your favorite personas
- `POST /api/contacts` - Add persona to favorites
- `DELETE /api/contacts/:personaId` - Remove from favorites

### User & Billing (Token required)
- `PUT /api/user/profile` - Update profile
- `GET /api/user/billing` - Get payment methods
- `POST /api/user/payment-method` - Add payment method
- `DELETE /api/user/payment-method/:id` - Remove payment method
- `PUT /api/user/payment-method/:id/default` - Set default payment
- `GET /api/user/usage` - Get usage statistics
- `POST /api/user/create-payment-intent` - Pre-authorize payment

---

## 🐛 Common Issues & Solutions

### "401 Unauthorized" Error
- **Problem:** Token is missing, expired, or invalid
- **Solution:** Get a new token by logging in again

### "Token is blacklisted" Error
- **Problem:** You logged out and the token was revoked
- **Solution:** Login again to get a fresh token

### "Invalid credentials" Error
- **Problem:** Wrong email or password
- **Solution:** Double-check credentials or register new account

### "User already exists" Error
- **Problem:** Email is already registered
- **Solution:** Use login endpoint instead of register

### Token Expires
- **When:** After 30 days
- **Solution:** Frontend should detect 401 errors and redirect to login
- **Best Practice:** Store token in localStorage and check expiration

---

## 💡 Frontend Integration Tips

### Store Token in Frontend:
```javascript
// After successful login/register
localStorage.setItem('auth_token', token);
localStorage.setItem('user', JSON.stringify(user));

// For every API call
const token = localStorage.getItem('auth_token');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Auto-Logout on Token Error:
```javascript
// In your API client/interceptor
if (response.status === 401) {
  // Token is invalid or expired
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  router.push('/login');
}
```

### Check if User is Logged In:
```javascript
function isLoggedIn() {
  const token = localStorage.getItem('auth_token');
  return token !== null && token !== undefined;
}

// Use in route guards
if (!isLoggedIn()) {
  router.push('/login');
}
```

---

## 📊 Monitoring & Debugging

### View Logs:
```bash
pnpm raindrop logs api-gateway
pnpm raindrop logs auth-manager
pnpm raindrop logs call-orchestrator
```

### Check Deployment Status:
```bash
pnpm raindrop deployment status
```

### Redeploy After Changes:
```bash
pnpm raindrop build deploy --start
```

---

## 🎯 Testing Checklist

- [ ] Register a new user
- [ ] Login with existing user
- [ ] Get user info with token
- [ ] Get call history (empty initially)
- [ ] Get personas list
- [ ] Create custom persona
- [ ] Add persona to contacts
- [ ] Get contacts list
- [ ] Get user usage statistics
- [ ] Logout and verify token is blacklisted

---

## 📞 Next Steps for Live Calls

To enable actual phone calls:

1. **Configure Twilio** - Add credentials and webhook URLs
2. **Configure ElevenLabs** - Add API key for voice generation
3. **Configure Cerebras** - Add API key for AI inference
4. **Configure Stripe** - Add keys for payments
5. **Test call flow** - POST to `/api/call` with persona and phone number
6. **Set up webhooks** - Configure Twilio and Stripe to call your webhook endpoints

---

## 📚 Additional Resources

- **Backend PRD:** See `BACKEND_PRD.md` for complete technical specs
- **Raindrop PRD:** See `RAINDROP_PRD.md` for architecture details
- **API Spec:** See `API_SPECIFICATION.md` for detailed endpoint docs
- **Session Files:** Check `/root/.raindrop/01k9dd97njbexcbqtkcy93z98t/` for workflow artifacts

---

**Your backend is ready to go! Start with authentication testing and work your way up to full call functionality.** 🚀
