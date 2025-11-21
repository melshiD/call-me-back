# Frontend Architecture
**Last Updated:** 2025-11-21
**Status:** Living Document
**Tags:** frontend, vue, vite, pinia, tailwind, ui

---

## Quick Reference

### Development Commands
```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# Opens at http://localhost:3000

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
npm run test:watch
```

### Tech Stack
- **Vue 3.4.21** - Composition API
- **Vite 5.2.0** - Build tool
- **Vue Router 4.3.0** - Routing
- **Pinia 2.1.7** - State management
- **Tailwind CSS 4.1.17** - Utility-first CSS

### Environment Variables
```bash
# .env.local
VITE_API_URL=https://api.callmeback.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Project URLs
- **Development:** http://localhost:3000
- **Production (Vercel):** https://callmeback.app

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Core Technologies](#3-core-technologies)
4. [State Management (Pinia)](#4-state-management-pinia)
5. [Routing](#5-routing)
6. [Views & Pages](#6-views--pages)
7. [Components](#7-components)
8. [Styling System](#8-styling-system)
9. [API Integration](#9-api-integration)
10. [Authentication Flow](#10-authentication-flow)
11. [Payment Integration](#11-payment-integration)
12. [Development Workflow](#12-development-workflow)

---

## 1. Architecture Overview

### Frontend Stack

```
┌─────────────────────────────────────┐
│          Browser (Client)           │
├─────────────────────────────────────┤
│     Vue 3 (Composition API)         │
│  - Single Page Application (SPA)    │
│  - Reactive components              │
│  - Client-side rendering            │
├─────────────────────────────────────┤
│        Vue Router (Routing)         │
│  - /dashboard, /schedule, etc.      │
│  - Navigation guards                │
│  - Protected routes                 │
├─────────────────────────────────────┤
│       Pinia (State Management)      │
│  - auth store (user, token)         │
│  - calls store (call history)       │
│  - personas store (personas, contacts)│
│  - user store (billing, usage)      │
├─────────────────────────────────────┤
│        Tailwind CSS (Styling)       │
│  - Utility-first approach           │
│  - Responsive design                │
│  - Custom theme colors              │
└─────────────────────────────────────┘
            ↕ HTTPS
┌─────────────────────────────────────┐
│    Raindrop Backend (Workers)       │
│       api.callmeback.app            │
└─────────────────────────────────────┘
```

### Design Philosophy

**Component-Based Architecture:**
- Vue components using `<script setup>` syntax
- Composition API with reactive refs and computed properties
- Reusable UI components
- Clear separation of concerns

**Mobile-First Design:**
- Responsive from 320px to 1920px
- Touch-friendly interactions
- Optimized for all devices

**Progressive Enhancement:**
- Works without JavaScript (basic HTML)
- Enhanced with Vue reactivity
- Graceful degradation

---

## 2. Project Structure

```
call-me-back/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css          # Global styles + Tailwind
│   ├── components/               # Reusable Vue components
│   │   ├── CallCard.vue
│   │   ├── PersonaCard.vue
│   │   └── ... (other components)
│   ├── router/
│   │   └── index.js             # Vue Router configuration
│   ├── stores/
│   │   ├── auth.js              # Authentication state
│   │   ├── calls.js             # Call management
│   │   ├── personas.js          # Persona management
│   │   └── user.js              # User/billing
│   ├── views/
│   │   ├── Home.vue             # Landing page
│   │   ├── Login.vue            # Login page
│   │   ├── Register.vue         # Registration
│   │   ├── Dashboard.vue        # Main dashboard
│   │   ├── Schedule.vue         # Call scheduling
│   │   ├── Contacts.vue         # Saved personas
│   │   ├── Personas.vue         # Browse personas
│   │   ├── PersonaDesigner.vue  # Create/edit personas
│   │   ├── Profile.vue          # User profile & billing
│   │   ├── Pricing.vue          # Pricing page
│   │   ├── AdminLogin.vue       # Admin login
│   │   ├── AdminDashboard.vue   # Admin panel
│   │   ├── PersonaAdmin.vue     # Admin persona management
│   │   └── PersonaConfig.vue    # Persona configuration
│   ├── App.vue                  # Root component
│   └── main.js                  # Application entry point
├── index.html                   # HTML entry point
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS v4 config
├── postcss.config.js           # PostCSS config
├── package.json                # Dependencies
└── README.md                   # Project documentation
```

---

## 3. Core Technologies

### Vue 3 (Composition API)

**Version:** 3.4.21

**Key Features:**
- `<script setup>` syntax for cleaner components
- Reactive refs and computed properties
- Component lifecycle hooks
- v-model, v-if, v-for directives

**Example Component:**
```vue
<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

const increment = () => {
  count.value++
}
</script>

<template>
  <button @click="increment">
    Count: {{ count }} (Doubled: {{ doubled }})
  </button>
</template>

<style scoped>
button {
  padding: 0.5rem 1rem;
}
</style>
```

---

### Vite

**Version:** 5.2.0

**Configuration:** `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  }
})
```

**Features:**
- Hot Module Replacement (HMR)
- Fast dev server startup
- Optimized production builds
- Native ES modules

**Build Output:**
- Located in `dist/` directory
- Minified and optimized
- Ready for Vercel deployment

---

### Tailwind CSS

**Version:** 4.1.17

**Configuration Files:**
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS plugins
- `src/assets/styles/main.css` - Global styles

**Custom Theme Colors:**
```css
/* src/assets/styles/main.css */
@import "tailwindcss";

@theme {
  --color-primary: #667eea;
  --color-primary-dark: #5568d3;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-info: #17a2b8;
  --color-muted: #6c757d;
}
```

**Usage Examples:**
```vue
<!-- Button with Tailwind utilities -->
<button class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all">
  Click me
</button>

<!-- Card -->
<div class="bg-white rounded-xl p-6 shadow-md mb-4">
  <h2 class="text-xl font-semibold mb-2">Title</h2>
  <p class="text-gray-600">Content</p>
</div>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Items -->
</div>
```

**See:** `design/TAILWIND_USAGE_EXAMPLES.md` for more examples

---

## 4. State Management (Pinia)

**Version:** 2.1.7

### Store Architecture

**Pattern:** Composition API style stores

```javascript
// stores/example.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useExampleStore = defineStore('example', () => {
  // State (reactive refs)
  const count = ref(0)

  // Getters (computed properties)
  const doubled = computed(() => count.value * 2)

  // Actions (methods)
  const increment = () => {
    count.value++
  }

  return { count, doubled, increment }
})
```

---

### Auth Store

**Location:** `src/stores/auth.js`

**Purpose:** User authentication and session management

**State:**
```javascript
const user = ref(null)              // Current user object
const token = ref(localStorage.getItem('token') || null)  // JWT token
```

**Getters:**
```javascript
const isAuthenticated = computed(() => !!user.value && !!token.value)
```

**Actions:**
- `login(email, password)` - Authenticate user
- `register(name, email, password, phone)` - Create account
- `logout()` - Clear session
- `fetchUser()` - Get current user (GET /api/auth/me)

**Implementation:**
```javascript
const login = async (email, password) => {
  const apiUrl = import.meta.env.VITE_API_URL

  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const data = await response.json()

  user.value = data.user
  token.value = data.token
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))

  return data
}
```

**See:** `documentation/domain/api.md` for API endpoints

---

### Calls Store

**Location:** `src/stores/calls.js`

**Purpose:** Call history and scheduling

**State:**
```javascript
const calls = ref([])               // Call history
const scheduledCalls = ref([])      // Upcoming scheduled calls
```

**Actions:**
- `fetchCalls(page, limit, status, sort)` - Get call history
- `triggerCall(phoneNumber, personaId, paymentIntentId, scenario)` - Immediate call
- `scheduleCall(phoneNumber, personaId, scheduledTime, paymentIntentId, scenario)` - Schedule future call
- `cancelScheduledCall(callId)` - Cancel scheduled call
- `fetchScheduledCalls(status, sort)` - Get scheduled calls

**Example:**
```javascript
// In Schedule.vue
const callsStore = useCallsStore()

const handleSchedule = async () => {
  await callsStore.triggerCall(
    phoneNumber.value,
    selectedPersona.value.id,
    paymentIntentId.value,
    scenario.value  // Optional scenario text
  )
}
```

---

### Personas Store

**Location:** `src/stores/personas.js`

**Purpose:** Persona browsing and contact management

**State:**
```javascript
const personas = ref([])            // Available personas
const contacts = ref([])            // User's saved personas
```

**Actions:**
- `fetchPersonas(page, limit, search, tags, isPublic, sort)` - Browse personas
- `createPersona(personaData)` - Create custom persona
- `updatePersona(id, personaData)` - Update persona
- `deletePersona(id)` - Delete persona
- `fetchContacts()` - Get saved contacts
- `addToContacts(personaId)` - Save persona
- `removeFromContacts(personaId)` - Remove persona

**Persona Object:**
```javascript
{
  id: 'uuid',
  name: 'Best Friend',
  description: 'Your supportive best friend...',
  voice: 'rachel',              // ElevenLabs voice ID
  system_prompt: 'You are...',
  is_public: true,
  created_by: 'system',         // 'system' or user_id
  tags: ['friendly', 'supportive'],
  created_at: '2024-01-01T00:00:00Z',
  use_count: 1523
}
```

---

### User Store

**Location:** `src/stores/user.js`

**Purpose:** User profile, billing, and usage statistics

**State:**
```javascript
const billing = ref({
  payment_methods: [],
  balance: 0,
  currency: 'usd'
})
const usage = ref({
  total_calls: 0,
  total_minutes: 0,
  total_spent: 0,
  current_month: {},
  monthly_breakdown: []
})
```

**Actions:**
- `fetchBilling()` - Get payment methods
- `addPaymentMethod(paymentMethodId)` - Add card
- `removePaymentMethod(id)` - Remove card
- `setDefaultPaymentMethod(id)` - Set default card
- `fetchUsage(months)` - Get usage statistics
- `createPaymentIntent(estimatedDuration)` - Pre-authorize payment
- `updateProfile(name, email, phone)` - Update user info

---

## 5. Routing

**Location:** `src/router/index.js`

### Route Configuration

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // Public routes
  { path: '/', name: 'home', component: () => import('@/views/Home.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue') },
  { path: '/register', name: 'register', component: () => import('@/views/Register.vue') },
  { path: '/pricing', name: 'pricing', component: () => import('@/views/Pricing.vue') },

  // Protected routes (require authentication)
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: () => import('@/views/Schedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: () => import('@/views/Contacts.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/personas',
    name: 'personas',
    component: () => import('@/views/Personas.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },

  // Admin routes
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/AdminLogin.vue')
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: () => import('@/views/AdminDashboard.vue'),
    meta: { requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for protected routes
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if not authenticated
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
```

### Route Protection

**Pattern:** Navigation guards check authentication before allowing access to protected routes.

**Example Flow:**
1. User tries to access `/dashboard`
2. `router.beforeEach` checks `authStore.isAuthenticated`
3. If not authenticated, redirect to `/login?redirect=/dashboard`
4. After login, redirect back to original destination

---

## 6. Views & Pages

### Public Pages

#### Home.vue
**Route:** `/`
**Description:** Landing page with app overview and CTA
**Authentication:** None

**Features:**
- Hero section with app description
- Feature highlights
- Pricing preview
- CTA buttons (Login, Sign Up)

---

#### Login.vue
**Route:** `/login`
**Description:** User login page
**Authentication:** None (redirects if already logged in)

**Form Fields:**
- Email (required, valid format)
- Password (required)

**Actions:**
- Calls `authStore.login(email, password)`
- Stores JWT token in localStorage
- Redirects to dashboard or original destination

---

#### Register.vue
**Route:** `/register`
**Description:** New user registration
**Authentication:** None

**Form Fields:**
- Name (1-100 chars)
- Email (unique, valid format)
- Password (min 8 chars, complexity requirements)
- Phone (E.164 format)

**Validation:**
- Client-side validation before submission
- Shows field-specific error messages
- Password strength indicator

---

#### Pricing.vue
**Route:** `/pricing`
**Description:** Pricing information and plans
**Authentication:** None

**Content:**
- Connection fee: $0.25
- Per-minute rate: $0.40/minute
- Example calculations
- FAQ section

---

### Protected Pages (Require Authentication)

#### Dashboard.vue
**Route:** `/dashboard`
**Authentication:** Required

**Sections:**
1. **Usage Statistics Card**
   - Total calls this month
   - Total minutes
   - Total spent
   - Monthly trend chart

2. **Recent Calls**
   - Last 5 calls
   - Status indicators
   - Duration and cost
   - Scenario badge (if applicable)
   - Link to full history

3. **Quick Actions**
   - Schedule New Call button
   - Manage Contacts button
   - Explore Personas button

4. **Upcoming Scheduled Calls**
   - List of scheduled calls
   - Countdown timers
   - Cancel buttons

**Data Sources:**
- `callsStore.fetchCalls()` - Recent calls
- `callsStore.fetchScheduledCalls()` - Scheduled calls
- `userStore.fetchUsage()` - Usage statistics

---

#### Schedule.vue
**Route:** `/schedule`
**Authentication:** Required

**Form Sections:**

1. **Persona Selection**
   - Dropdown of available personas
   - Preview: name, description, voice
   - Option to browse more personas

2. **Phone Number**
   - Input field (E.164 format)
   - Validation indicator
   - Auto-format as user types

3. **Scenario Input** (Optional)
   - Textarea for call context
   - Template quick-select chips (3 default templates)
   - Token count estimation
   - "Save as template" checkbox

4. **Timing**
   - Radio buttons: "Call Now" or "Schedule for Later"
   - Date/time picker (if scheduling)
   - Validation: min 5 minutes in future

5. **Cost Estimate**
   - Connection fee: $0.25
   - Per-minute estimate based on scenario length
   - Total estimate
   - Warning for long scenarios (>500 tokens)

6. **Payment**
   - Payment method selection
   - Pre-authorization notice
   - Terms acceptance checkbox

**Calculations:**
```javascript
// Token estimation (rough approximation)
const estimateTokens = (text) => {
  return Math.ceil(text.length / 4)
}

// Cost calculation
const estimatedDuration = Math.ceil(estimateTokens(scenario.value) / 100)
const cost = 0.25 + (0.40 * estimatedDuration)
```

**Actions:**
- Calls `callsStore.triggerCall()` or `callsStore.scheduleCall()`
- Creates Stripe PaymentIntent via `userStore.createPaymentIntent()`
- Redirects to dashboard on success

---

#### Contacts.vue
**Route:** `/contacts`
**Authentication:** Required

**Features:**
- Grid of saved personas
- Quick call button on each card
- Remove from contacts button
- Empty state if no contacts

**Actions:**
- `personasStore.fetchContacts()` - Load contacts
- `personasStore.removeFromContacts(personaId)` - Remove contact
- Navigate to `/schedule` with pre-selected persona

---

#### Personas.vue
**Route:** `/personas`
**Authentication:** Required

**Features:**

1. **Search & Filter**
   - Search by name/description
   - Filter by tags (friendly, professional, supportive, etc.)
   - Filter by creator (system, me, all)
   - Sort options (name, created date)

2. **Persona Grid**
   - Cards showing: name, description, voice, tags, use count
   - "Add to Contacts" button
   - "Call Now" button
   - "Edit" button (if owned by user)

3. **Create Custom Persona**
   - Button opens PersonaDesigner

**Actions:**
- `personasStore.fetchPersonas(search, tags, filters)` - Browse
- `personasStore.addToContacts(personaId)` - Save persona
- Navigate to `/schedule` with pre-selected persona

---

#### PersonaDesigner.vue
**Route:** `/personas/designer` (or modal)
**Authentication:** Required

**Form Fields:**
1. Name (3-50 chars)
2. Description (10-500 chars)
3. Voice selection (dropdown of ElevenLabs voices)
4. System prompt (20-2000 chars) - textarea
5. Tags (max 10 tags)
6. Public/private toggle

**Features:**
- Voice preview button
- System prompt templates
- Tag suggestions
- Character counters

**Actions:**
- `personasStore.createPersona(data)` - Create
- `personasStore.updatePersona(id, data)` - Update (if editing)

**Limits:**
- Free users: 10 custom personas
- Premium users: 50 custom personas

---

#### Profile.vue
**Route:** `/profile`
**Authentication:** Required

**Tabs:**

1. **Profile Information**
   - Edit name, email, phone
   - Email/phone verification status
   - Change password

2. **Payment Methods**
   - List of cards (last 4 digits, brand, expiry)
   - Add new card (Stripe Elements)
   - Set default payment method
   - Remove card

3. **Usage Statistics**
   - Total calls, minutes, spent (lifetime)
   - Current month breakdown
   - Monthly history chart
   - Download CSV option

4. **Call History**
   - Paginated list of all calls
   - Filters: status, date range
   - Sort options
   - View transcript (if available)

**Actions:**
- `userStore.updateProfile(name, email, phone)` - Update profile
- `userStore.addPaymentMethod(pmId)` - Add card
- `userStore.removePaymentMethod(id)` - Remove card
- `userStore.fetchUsage(months)` - Usage stats
- `callsStore.fetchCalls(page, filters)` - Call history

---

### Admin Pages

#### AdminLogin.vue
**Route:** `/admin/login`
**Description:** Admin authentication (WorkOS OAuth)
**Authentication:** None

**Features:**
- WorkOS OAuth login button
- Redirects to `/admin/dashboard` after login
- Separate admin JWT token

**See:** `documentation/domain/auth.md` for admin authentication

---

#### AdminDashboard.vue
**Route:** `/admin/dashboard`
**Authentication:** Admin required

**Features:**
- System health monitoring
- User management
- Call statistics
- Revenue metrics
- Link to PersonaAdmin

---

#### PersonaAdmin.vue
**Route:** `/admin/personas`
**Authentication:** Admin required

**Features:**
- Manage all personas (system + user-created)
- Edit any persona
- Delete personas
- Mark personas as public/featured
- Moderation tools

---

## 7. Components

### Reusable Components

**Pattern:** Small, focused components for reusability

**Examples:**

```vue
<!-- CallCard.vue -->
<template>
  <div class="bg-white rounded-lg p-4 shadow-md">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-semibold">{{ call.persona_name }}</h3>
      <span :class="statusClass">{{ call.status }}</span>
    </div>
    <p class="text-sm text-gray-600">{{ formatDate(call.start_time) }}</p>
    <p class="text-sm">Duration: {{ formatDuration(call.duration) }}</p>
    <p class="text-sm font-semibold">Cost: ${{ call.cost.toFixed(2) }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  call: {
    type: Object,
    required: true
  }
})

const statusClass = computed(() => {
  return {
    'completed': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800',
    'in-progress': 'bg-blue-100 text-blue-800'
  }[props.call.status]
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}
</script>
```

**Other Components:**
- `PersonaCard.vue` - Display persona information
- `ContactCard.vue` - Saved persona card with quick actions
- `UsageChart.vue` - Monthly usage visualization
- `PaymentMethodCard.vue` - Credit card display
- `ScenarioTemplateChip.vue` - Quick-select scenario template

---

## 8. Styling System

### Tailwind CSS v4

**Configuration:** `tailwind.config.js`, `postcss.config.js`

**Custom Theme:**
```css
/* src/assets/styles/main.css */
@import "tailwindcss";

@theme {
  --color-primary: #667eea;
  --color-primary-dark: #5568d3;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-info: #17a2b8;
  --color-muted: #6c757d;
}
```

### Responsive Breakpoints

```
sm:  640px  (tablet portrait)
md:  768px  (tablet landscape)
lg:  1024px (desktop)
xl:  1280px (large desktop)
2xl: 1536px (extra large desktop)
```

### Common Patterns

**Card:**
```html
<div class="bg-white rounded-xl p-6 shadow-md mb-4">
  ...
</div>
```

**Button:**
```html
<button class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all">
  Button Text
</button>
```

**Form Input:**
```html
<input
  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
/>
```

**Grid Layout:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Items -->
</div>
```

**See:** `design/TAILWIND_USAGE_EXAMPLES.md` for comprehensive examples

---

## 9. API Integration

### Environment Variables

**Location:** `.env.local` (not committed to git)

```bash
# Backend API URL
VITE_API_URL=https://api.callmeback.app

# Stripe publishable key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Usage in Code:**
```javascript
const apiUrl = import.meta.env.VITE_API_URL
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
```

### Fetch Pattern

**Standard API Call:**
```javascript
const response = await fetch(`${apiUrl}/api/endpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token.value}`
  },
  body: JSON.stringify(data)
})

if (!response.ok) {
  const errorData = await response.json()
  throw new Error(errorData.error || 'Request failed')
}

const result = await response.json()
return result
```

### Mock Data for Development

**95% of frontend can be built without backend!**

**Mock Pattern:**
```javascript
// Development mode - use mock data
const fetchCalls = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))

  // Return mock data
  calls.value = [
    {
      id: '1',
      persona_name: 'Best Friend',
      status: 'completed',
      duration: 300,
      cost: 2.25
    }
  ]
}

// Production mode - use real API
const fetchCalls = async () => {
  const apiUrl = import.meta.env.VITE_API_URL
  const response = await fetch(`${apiUrl}/api/calls`, {
    headers: { 'Authorization': `Bearer ${token.value}` }
  })
  const data = await response.json()
  calls.value = data.calls
}
```

**See:** `documentation/FRONTEND_WITHOUT_ENV.md` for full mock development strategy

---

## 10. Authentication Flow

### Login Flow

1. **User enters email + password** (`Login.vue`)
2. **Frontend calls** `authStore.login(email, password)`
3. **Store makes API call** `POST /api/auth/login`
4. **Backend verifies credentials** (bcrypt comparison)
5. **Backend returns** `{ user, token }`
6. **Store saves** token to localStorage, user to state
7. **Router redirects** to `/dashboard` (or original destination)

### Protected Route Access

1. **User navigates to** `/dashboard`
2. **Router guard checks** `authStore.isAuthenticated`
3. **If authenticated:** Allow access
4. **If not authenticated:** Redirect to `/login?redirect=/dashboard`

### Logout Flow

1. **User clicks logout** (`Dashboard.vue` or `Profile.vue`)
2. **Frontend calls** `authStore.logout()`
3. **Store makes API call** `POST /api/auth/logout` (adds token to revocation list)
4. **Store clears** localStorage and state
5. **Router redirects** to `/login`

### Session Persistence

**On Page Load:** (`main.js`)
```javascript
const authStore = useAuthStore()

// Check if token exists in localStorage
if (authStore.token) {
  // Verify token is still valid
  await authStore.fetchUser()  // GET /api/auth/me
}
```

**If token is valid:** User remains logged in
**If token is expired/invalid:** Clear session, redirect to login

---

## 11. Payment Integration

### Stripe Setup

**Install Stripe.js:**
```bash
npm install @stripe/stripe-js
```

**Initialize Stripe:**
```javascript
// In Profile.vue or Schedule.vue
import { loadStripe } from '@stripe/stripe-js'

const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
```

### Payment Flow

1. **User selects payment method** (or adds new card)
2. **Frontend creates PaymentIntent**
   ```javascript
   const { payment_intent_id, client_secret, amount } =
     await userStore.createPaymentIntent(estimatedDuration)
   ```
3. **Pre-authorize payment** (Stripe holds funds, doesn't capture)
4. **Trigger call** with `payment_intent_id`
   ```javascript
   await callsStore.triggerCall(phone, personaId, payment_intent_id, scenario)
   ```
5. **Call completes** (voice pipeline)
6. **Backend captures actual amount** based on real duration
7. **User charged final cost** (connection fee + per-minute rate)

### Adding Payment Method

**Use Stripe Elements:**
```vue
<template>
  <div>
    <div id="card-element"></div>
    <button @click="addCard">Add Card</button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

let cardElement

onMounted(async () => {
  const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  const elements = stripe.elements()
  cardElement = elements.create('card')
  cardElement.mount('#card-element')
})

const addCard = async () => {
  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement
  })

  if (error) {
    console.error(error)
    return
  }

  await userStore.addPaymentMethod(paymentMethod.id)
}
</script>
```

---

## 12. Development Workflow

### Local Development

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:3000
```

**Features:**
- Hot Module Replacement (HMR)
- Fast refresh on file changes
- Vue DevTools support
- Mock data for API calls

### Environment Setup

**Development (.env.local):**
```bash
VITE_API_URL=http://localhost:8787  # Local Raindrop backend
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Production (.env.production):**
```bash
VITE_API_URL=https://api.callmeback.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Building for Production

```bash
# Build optimized bundle
npm run build

# Output: dist/ directory
```

**Build Output:**
- Minified JavaScript
- Optimized CSS
- Compressed assets
- Source maps (for debugging)

### Deployment (Vercel)

**Automatic Deployment:**
1. Push to `main` branch
2. Vercel detects changes
3. Runs `npm run build`
4. Deploys to `callmeback.app`

**Environment Variables in Vercel:**
- Set `VITE_API_URL` in Vercel dashboard
- Set `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel dashboard

**Build Settings:**
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**See:** `documentation/domain/deployment.md` for full deployment procedures

---

### Testing

**Test Framework:** Vitest 4.0.8

```bash
# Run tests once
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

**Test Files:** `*.test.js` or `*.spec.js`

**Example:**
```javascript
// stores/auth.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with no user', () => {
    const store = useAuthStore()
    expect(store.user).toBe(null)
  })

  it('should set user on login', async () => {
    const store = useAuthStore()
    await store.login('test@example.com', 'password')
    expect(store.user).toBeDefined()
    expect(store.isAuthenticated).toBe(true)
  })
})
```

---

### Code Organization Best Practices

**Component Structure:**
```vue
<script setup>
// 1. Imports
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 2. Stores
const router = useRouter()
const authStore = useAuthStore()

// 3. Props & Emits
const props = defineProps({ ... })
const emit = defineEmits(['event'])

// 4. Reactive State
const count = ref(0)

// 5. Computed Properties
const doubled = computed(() => count.value * 2)

// 6. Methods
const increment = () => {
  count.value++
}

// 7. Lifecycle Hooks
onMounted(() => {
  // ...
})
</script>

<template>
  <!-- Template -->
</template>

<style scoped>
/* Component-specific styles (if needed) */
</style>
```

**File Naming:**
- Components: PascalCase (`CallCard.vue`)
- Views: PascalCase (`Dashboard.vue`)
- Stores: camelCase (`auth.js`)
- Utilities: camelCase (`formatDate.js`)

---

## Sources

**Consolidated from:**
- README.md (tech stack, structure, features, dated 2024-11-19)
- documentation/FRONTEND_WITHOUT_ENV.md (mock development strategy, dated 2024-11-20)
- package.json (dependencies, scripts)
- vite.config.js (Vite configuration)
- tailwind.config.js, postcss.config.js (Tailwind v4 setup)
- design/TAILWIND_USAGE_EXAMPLES.md (styling examples)
- design/expert-web-design-guidelines.md (design principles)
- src/stores/*.js (Pinia stores with API specifications)
- src/views/*.vue (View components - 15 total pages)

**Related Documents:**
- See also: `documentation/domain/api.md` (API endpoints and integration)
- See also: `documentation/domain/auth.md` (Authentication implementation)
- See also: `documentation/domain/deployment.md` (Vercel deployment)
- See also: `documentation/domain/raindrop.md` (Backend services)
- See also: `design/TAILWIND_USAGE_EXAMPLES.md` (Tailwind CSS patterns)
