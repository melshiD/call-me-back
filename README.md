# Call Me Back - Frontend Application

A Vue.js frontend for an AI-powered phone companion that calls you on demand with customizable personas.

## Overview

Call Me Back is a phone-based AI companion app that allows users to:
- Schedule immediate or future AI-powered phone calls
- Choose from pre-built personas (Friend, Boss, Agent, etc.) or create custom ones
- Manage billing and track usage
- View call history and statistics

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend build tool
- **Vue Router** - Official routing library
- **Pinia** - Official state management library
- **Modern CSS** - Mobile-first responsive design

## Project Structure

```
call-me-back/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css          # Global styles
│   ├── components/               # Reusable Vue components
│   ├── router/
│   │   └── index.js             # Vue Router configuration
│   ├── stores/
│   │   ├── auth.js              # Authentication state & API specs
│   │   ├── calls.js             # Call management state & API specs
│   │   ├── personas.js          # Persona management state & API specs
│   │   └── user.js              # User/billing state & API specs
│   ├── views/
│   │   ├── Login.vue            # Login page
│   │   ├── Register.vue         # Registration page
│   │   ├── Dashboard.vue        # Main dashboard
│   │   ├── Schedule.vue         # Call scheduling interface
│   │   ├── Contacts.vue         # User's favorite personas
│   │   ├── Personas.vue         # Browse & create personas
│   │   └── Profile.vue          # User profile & billing
│   ├── App.vue                  # Root component
│   └── main.js                  # Application entry point
├── index.html                   # HTML entry point
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

## Installation

### Prerequisites

- Node.js 16+ and npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Features

### 1. Authentication
- User registration with email, password, name, and phone
- Login/logout functionality
- Protected routes (requires authentication)
- Session persistence via localStorage

### 2. Dashboard
- Usage statistics overview
- Recent call history
- Quick actions to schedule calls, manage contacts, and explore personas
- Upcoming scheduled calls

### 3. Call Scheduling
- **Quick Call**: Immediate call with estimated cost calculation
- **Schedule Future Call**: Set specific date and time
- View and cancel upcoming scheduled calls
- Integration with Stripe for payment pre-authorization

### 4. Personas
- Browse public personas (Friend, Boss, Agent, Doctor, Family Member)
- Create custom personas with:
  - Name and description
  - ElevenLabs voice selection
  - Custom system prompts
  - Tags for organization
  - Public/private visibility
- Edit and delete custom personas
- Search and filter functionality

### 5. Contacts
- Save favorite personas for quick access
- Remove personas from contacts
- Quick call scheduling from contacts

### 6. Profile & Billing
- Edit profile information
- Manage payment methods
- View usage statistics (calls, minutes, costs)
- Monthly breakdown of usage
- Complete call history

## Mock Data

The application uses mock data for demonstration purposes. All API calls are simulated with:
- Realistic delays (300-500ms)
- Mock responses matching expected API formats
- localStorage for session persistence

### Test Credentials

Since authentication is mocked, you can login with any email/password combination:
- Email: `test@example.com`
- Password: `anything`

Or create a new account through registration.

## API Integration Points

All API specifications are documented in the store files with detailed comments. Each API call includes:
- Endpoint URL and HTTP method
- Required headers
- Request body structure with types
- Expected response structure with status codes
- Error response formats

### Key API Endpoints to Implement

#### Authentication (`stores/auth.js`)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Check authentication status

#### Calls (`stores/calls.js`)
- `GET /api/calls` - Fetch call history (paginated)
- `POST /api/call` - Trigger immediate call
- `POST /api/calls/schedule` - Schedule future call
- `GET /api/calls/scheduled` - Fetch scheduled calls
- `DELETE /api/calls/schedule/:id` - Cancel scheduled call

#### Personas (`stores/personas.js`)
- `GET /api/personas` - Fetch public personas (with search/filter)
- `POST /api/personas` - Create custom persona
- `PUT /api/personas/:id` - Update custom persona
- `DELETE /api/personas/:id` - Delete custom persona
- `GET /api/contacts` - Fetch user's contacts
- `POST /api/contacts` - Add persona to contacts
- `DELETE /api/contacts/:personaId` - Remove from contacts

#### User/Billing (`stores/user.js`)
- `GET /api/user/billing` - Fetch billing information
- `POST /api/user/payment-method` - Add payment method
- `DELETE /api/user/payment-method/:id` - Remove payment method
- `PUT /api/user/payment-method/:id/default` - Set default payment
- `GET /api/user/usage` - Fetch usage statistics
- `POST /api/user/create-payment-intent` - Create Stripe PaymentIntent
- `PUT /api/user/profile` - Update user profile

## Backend Integration

To connect this frontend to a real backend:

1. **Update Store Files**: Replace mock implementations with actual API calls using `fetch` or `axios`

2. **Add Base URL**: Create an environment variable for your API base URL:
   ```js
   // .env
   VITE_API_BASE_URL=http://localhost:3001
   ```

3. **Implement Error Handling**: Add proper error handling for network failures

4. **Add Loading States**: The UI already has loading states - connect them to actual API calls

5. **Stripe Integration**:
   - Add Stripe.js to the project
   - Implement Stripe Elements for secure payment collection
   - Replace mock payment collection in Profile.vue

6. **WebSocket for Live Calls**: Add WebSocket connection for real-time call status updates

## Pricing Model

- Connection Fee: $0.25 per call
- Per-Minute Rate: $0.40/minute
- Pre-authorization via Stripe PaymentIntent
- Actual charge based on call duration after completion

## Mobile Responsive

The application is fully responsive and mobile-friendly with:
- Flexible grid layouts
- Touch-friendly buttons and inputs
- Responsive navigation
- Optimized for screens from 320px to 1920px

## Color Scheme

- Primary: Purple gradient (#667eea to #764ba2)
- Success: Green (#28a745)
- Danger: Red (#dc3545)
- Info: Blue (#17a2b8)
- Muted: Gray (#6c757d)

## Next Steps

1. **Backend Development**: Implement the REST API endpoints documented in the store files
2. **Twilio Integration**: Set up Twilio Programmable Voice for outbound calls
3. **AI Pipeline**: Integrate STT, AI model (Cerebras/OpenAI), and ElevenLabs TTS
4. **Stripe Setup**: Configure Stripe for payment processing
5. **WebSocket Server**: Implement real-time call status updates
6. **Production Deployment**: Deploy frontend to Netlify/Vercel and backend to Fly.io

## Development Notes

- All components use Vue 3 Composition API (`<script setup>`)
- State management via Pinia stores
- Route protection via navigation guards
- Mock data allows full UI testing without backend
- All API specs are thoroughly documented in store files

## Support

For questions or issues, please refer to the API documentation in the store files or contact the development team.

---

Built with Vue.js for the Call Me Back hackathon project.
