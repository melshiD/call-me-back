# WorkOS Integration Plan

## Overview
Replace custom JWT auth with WorkOS AuthKit for hackathon requirements and better security.

## Architecture
```
Frontend → API Gateway → WorkOS Auth Service → WorkOS API
                      ↓
                   Vultr DB (store user data)
```

## Steps

### 1. Setup (You need to do this)
- [ ] Sign up at https://workos.com
- [ ] Get API Key and Client ID from dashboard
- [ ] Activate AuthKit in dashboard
- [ ] Add redirect URI: `https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/auth/callback`

### 2. Backend Integration (I'll do this)
- [ ] Install @workos-inc/node package
- [ ] Create new auth service using WorkOS SDK
- [ ] Update API gateway routes:
  - `/api/auth/login` → redirect to WorkOS
  - `/api/auth/callback` → handle WorkOS callback
  - `/api/auth/logout` → clear session
  - `/api/auth/me` → get current user
- [ ] Store WorkOS user data in Vultr DB
- [ ] Keep existing database schema

### 3. Frontend Integration
- [ ] Update login button to call `/api/auth/login`
- [ ] Handle redirect back from WorkOS
- [ ] Store session/user data
- [ ] Update protected routes

## Environment Variables Needed
```bash
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD= # 32 char random string
```

## Benefits
- ✅ Meets hackathon "WorkOS authentication" requirement
- ✅ Enterprise-ready (SSO, MFA ready)
- ✅ Simpler than custom JWT
- ✅ Better security out of the box
- ✅ Hosted UI (no login form to build)

## What Changes
- **Auth flow**: WorkOS handles login/signup
- **Sessions**: Encrypted cookies instead of JWT
- **Database**: Still store user data (WorkOS ID + email)
- **Everything else**: No changes needed
