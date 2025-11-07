# Product Requirements Document: Call Me Back

## Executive Summary

Call Me Back delivers AI-powered phone companionship through on-demand and scheduled calls with customizable personas. Users facing awkward social situations or seeking conversational support can trigger authentic phone calls where AI personas engage in natural, real-time dialogue with sub-3-second response latency. The application addresses the need for immediate, believable social rescue mechanisms and emotional support through telephony-based AI interaction. Built for a Vue.js frontend, this backend API orchestrates Twilio voice infrastructure, Cerebras inference, ElevenLabs text-to-speech, Stripe payments, and Raindrop's unified memory and storage platform to create seamless conversational experiences indistinguishable from human interaction.

## Requirements

### Functional Requirements

- User authentication with JWT tokens, password security, and session management
- Immediate phone call triggering with persona selection and payment pre-authorization
- Real-time bidirectional voice conversations through WebSocket-based media streaming
- Speech-to-text transcription of user audio input
- AI response generation using Cerebras with sub-1-second inference time
- Text-to-speech conversion using ElevenLabs with natural voice quality
- Conversation context persistence throughout call duration
- Scheduled call management with future date/time selection and automatic execution
- Custom persona creation with name, description, voice selection, and system prompts
- System-provided default personas for common use cases
- Contact favorites management for quick persona access
- Call history with pagination, filtering, and transcript access
- Payment processing with pre-authorization and actual cost capture
- Usage analytics showing total calls, minutes, and spending
- Webhook processing for Twilio call status and Stripe payment events
- Call transcript storage with automatic cleanup

### Non-Functional Requirements

- Total conversational response time under 3 seconds
- AI inference latency under 1 second using Cerebras
- Call connection success rate above 90%
- Payment processing success rate above 95%
- API response times with p95 under 500ms
- Operating cost under $0.25 per minute of conversation
- Support for concurrent calls across multiple users
- Horizontal scaling through stateless service architecture
- JWT token expiration and revocation handling
- Rate limiting per endpoint with configurable thresholds
- Input validation and sanitization for all user data
- Secure webhook signature verification for external services
- Encrypted storage of sensitive data at rest
- Comprehensive error handling with meaningful client messages

## Architecture Approach

The architecture employs a microservices pattern using Raindrop's service-to-service communication model to achieve separation of concerns while maintaining low latency. The public-facing api-gateway service handles all HTTP endpoints, authentication, and rate limiting, delegating specialized operations to private services through type-safe environment bindings. This approach enables independent scaling, isolated failure domains, and clear ownership boundaries for each functional area.

The voice pipeline operates as a separate service managing WebSocket connections, audio buffering, and the STT→AI→TTS flow, ensuring real-time processing doesn't block HTTP request handling. SmartMemory provides conversation context storage during active calls, allowing the AI to maintain coherent dialogue across multiple conversational turns. SmartSQL handles structured data with automatic query optimization, while SmartBuckets stores call transcripts with semantic search capabilities for future retrieval.

Critical technical decisions include using Cerebras for sub-second AI inference with OpenAI fallback, ElevenLabs Turbo v2 model for optimized streaming latency, Stripe manual capture for pay-as-you-go pricing, and Twilio Media Streams for bidirectional audio. The WebSocket architecture enables parallel processing where TTS generation begins before AI response completion, achieving the aggressive 3-second response target.

### Component-to-Requirement Mapping

| Component | Type | Addresses Requirements | Solution Approach |
|-----------|------|------------------------|-------------------|
| api-gateway | service | HTTP endpoints, authentication, rate limiting | Hono router with JWT middleware, Zod validation, and rate limit tracking via KV cache |
| voice-pipeline | service | Real-time voice processing, sub-3s response | WebSocket server managing STT, Cerebras inference, ElevenLabs TTS with streaming and parallel processing |
| auth-manager | service | User registration, login, JWT validation | Bcrypt password hashing, JWT generation/verification, token blacklist via KV cache |
| call-orchestrator | service | Call lifecycle, scheduling, Twilio integration | Twilio client for call initiation, TwiML generation, SmartMemory for context, scheduled execution queue |
| persona-manager | service | Persona CRUD, system personas, contacts | SmartSQL storage, ElevenLabs voice validation, system persona seeding, contact relationship management |
| payment-processor | service | Payment pre-auth, capture, billing | Stripe PaymentIntent with manual capture, cost calculation ($0.25 + $0.40/min), refund processing |
| webhook-handler | service | External event processing | Twilio and Stripe signature verification, async call status updates, payment event handling |
| call-me-back-db (SmartSQL) | resource | Structured data storage | Tables for users, calls, scheduled_calls, personas, contacts, payment_methods with proper indexes |
| conversation-memory (SmartMemory) | resource | Conversation context during calls | Working memory sessions for active calls, automatic context retrieval for AI prompts |
| call-transcripts (SmartBuckets) | resource | Transcript storage and retrieval | S3-compatible storage with semantic search for past conversation analysis |
| token-blacklist (KV Cache) | resource | JWT revocation | Fast token lookup for logout functionality with automatic expiration |
| rate-limit-cache (KV Cache) | resource | Rate limiting enforcement | Per-user and per-IP counters with sliding window implementation |

The integration pattern follows an orchestration model where api-gateway coordinates service calls based on endpoint requirements, avoiding tight coupling while maintaining transaction consistency through explicit error handling. Voice-pipeline operates independently once a call is established, using SmartMemory as shared state for conversation context. Webhook-handler processes external events asynchronously, updating SmartSQL and triggering payment capture through payment-processor, ensuring eventual consistency without blocking webhook responses.

## Detailed Artifacts

### Architecture
- [Interface Design](./architecture/interface_design.md) - Complete API endpoint specifications
- [Component Design](./architecture/component_design.md) - Service architecture and communication patterns
- [Database Design](./architecture/database_design.md) - SQL schema definitions and relationships
- [Deployment Configuration](./architecture/deployment_config.md) - Environment variables and secrets

### Specifications
- [Feature Specifications](./specifications/feature_specs.md) - User-facing features with acceptance criteria
- [API Definitions](./specifications/api_definitions.md) - Detailed request/response examples with validation rules
- [Dependencies](./specifications/dependencies.md) - Required packages and external services

### Implementation
- [Tentative Manifest](./tentative_manifest.txt) - Raindrop manifest file defining application structure
