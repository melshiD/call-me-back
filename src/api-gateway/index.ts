import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import { ScenarioTemplateManager } from '../shared/scenario-templates';
import { VoicePipelineOrchestrator, VoicePipelineConfig } from '../voice-pipeline/voice-pipeline-orchestrator';
import { CallCostTracker } from '../shared/cost-tracker';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Persona routes
      if (path.startsWith('/api/personas')) {
        return await this.handlePersonaRoutes(request, path);
      }

      // Contacts routes
      if (path.startsWith('/api/contacts')) {
        return await this.handleContactRoutes(request, path);
      }

      // Auth routes
      if (path.startsWith('/api/auth')) {
        return await this.handleAuthRoutes(request, path);
      }

      // Call trigger routes
      if (path.startsWith('/api/calls')) {
        return await this.handleCallRoutes(request, path);
      }

      // Twilio voice routes
      if (path.startsWith('/api/voice')) {
        return await this.handleVoiceRoutes(request, path, url);
      }

      // Scenario template routes
      if (path.startsWith('/api/scenario-templates')) {
        return await this.handleScenarioTemplates(request, path);
      }

      // Admin routes
      if (path.startsWith('/api/admin')) {
        return await this.handleAdminRoutes(request, path);
      }

      // Payment routes (Stripe checkout, webhooks, purchase history)
      if (path.startsWith('/api/payments')) {
        return await this.handlePaymentRoutes(request, path);
      }

      // KV userdata routes - must be checked BEFORE /api/user to avoid prefix collision
      // Also handles SmartMemory routes for PersonaDesigner context persistence
      if (path.startsWith('/api/userdata') || path.startsWith('/api/memory')) {
        return await this.handleMemoryRoutes(request, path);
      }

      // User routes (usage stats, billing, balance, etc.)
      if (path.startsWith('/api/user')) {
        return await this.handleUserRoutes(request, path);
      }

      // Cerebras models endpoint - proxy to Cerebras API to list available models
      if (path === '/api/cerebras/models') {
        return await this.handleCerebrasModels(request);
      }

      // Debug endpoint - check env vars
      if (path === '/api/debug/env') {
        return new Response(JSON.stringify({
          hasVultrUrl: !!this.env.VULTR_DB_API_URL,
          hasVultrKey: !!this.env.VULTR_DB_API_KEY,
          vultrUrl: this.env.VULTR_DB_API_URL || 'NOT_SET'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // WebSocket echo test endpoint
      if (path === '/api/debug/ws-echo') {
        const upgradeHeader = request.headers.get('Upgrade');
        if (upgradeHeader !== 'websocket') {
          return new Response('Expected WebSocket', { status: 426 });
        }
        return await this.handleEchoWebSocket(request);
      }

      // Temporary seed endpoint - REMOVE AFTER USE
      if (request.method === 'POST' && path === '/api/seed-personas') {
        return await this.handleSeedPersonas(request);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      this.env.logger.error('API Gateway error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  /**
   * Handle Twilio voice routes
   */
  private async handleVoiceRoutes(request: Request, path: string, url: URL): Promise<Response> {
    this.env.logger.info('handleVoiceRoutes called', {
      path,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });

    // POST /api/voice/answer - Return TwiML for incoming calls
    if (request.method === 'POST' && path === '/api/voice/answer') {
      return await this.handleVoiceAnswer(request);
    }

    // POST /api/voice/status - Handle Twilio call status callbacks
    if (request.method === 'POST' && path === '/api/voice/status') {
      return await this.handleVoiceStatus(request, url);
    }

    // WebSocket /api/voice/stream - Handle Twilio Media Streams
    if (path === '/api/voice/stream') {
      const upgradeHeader = request.headers.get('Upgrade');
      this.env.logger.info('WebSocket stream request', {
        upgradeHeader,
        method: request.method,
        path
      });

      if (upgradeHeader !== 'websocket') {
        this.env.logger.warn('Missing WebSocket upgrade header', { upgradeHeader });
        return new Response('Expected WebSocket', { status: 426 });
      }

      return await this.handleVoiceStream(request, url);
    }

    this.env.logger.warn('Voice route not found', { path, method: request.method });
    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle incoming call - Return TwiML with Media Streams
   */
  private async handleVoiceAnswer(request: Request): Promise<Response> {
    try {
      this.env.logger.info('handleVoiceAnswer called', { url: request.url });

      // Parse Twilio request body (form-encoded)
      const formData = await request.formData();
      const callSid = formData.get('CallSid') as string;
      const from = formData.get('From') as string;
      const to = formData.get('To') as string;

      this.env.logger.info('Incoming call', { callSid, from, to });

      // Extract callId, userId and personaId from query params (passed by call-orchestrator)
      const url = new URL(request.url);
      const callId = url.searchParams.get('callId') || callSid; // Use our internal callId, fallback to Twilio SID
      const userId = url.searchParams.get('userId') || 'demo_user';
      const personaId = url.searchParams.get('personaId') || 'brad_001';

      // Build WebSocket URL for Media Streams (without query parameters)
      // Twilio Stream URLs do NOT support query parameters - use <Parameter> elements instead
      // CRITICAL: Voice pipeline now runs on Vultr (voice.ai-tools-marketplace.io) not on Workers
      // Workers cannot make outbound WebSocket connections, so we moved voice pipeline to Node.js on Vultr
      // DNS: voice.ai-tools-marketplace.io must point to 144.202.15.249 (A record)
      const streamUrl = `wss://voice.ai-tools-marketplace.io/stream`;

      this.env.logger.info('Generated stream URL (Vultr voice pipeline)', { streamUrl, callId, callSid, userId, personaId });

      // Generate TwiML response with Media Streams
      // Use <Parameter> elements to pass custom data (sent in WebSocket "start" message)
      // Voice pipeline will fetch full persona/call data from database using callId
      // NOTE: Call context (pretext, scenario, etc.) is NOT passed via TwiML because <Parameter> has 500 char limit
      //       Voice pipeline fetches context from calls table using callId
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${streamUrl}">
            <Parameter name="callId" value="${callId}" />
            <Parameter name="twilioCallSid" value="${callSid}" />
            <Parameter name="userId" value="${userId}" />
            <Parameter name="personaId" value="${personaId}" />
        </Stream>
    </Connect>
</Response>`;

      this.env.logger.info('Returning TwiML', { twiml });

      return new Response(twiml, {
        headers: {
          'Content-Type': 'text/xml'
        }
      });
    } catch (error) {
      this.env.logger.error('Voice answer error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Return error TwiML
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Sorry, we encountered an error. Please try again later.</Say>
    <Hangup/>
</Response>`;

      return new Response(errorTwiml, {
        headers: {
          'Content-Type': 'text/xml'
        }
      });
    }
  }

  /**
   * Handle Twilio call status callbacks
   * Twilio sends status updates: initiated, ringing, answered, completed (with CallStatus)
   * CallStatus can be: queued, ringing, in-progress, completed, busy, failed, no-answer, canceled
   */
  private async handleVoiceStatus(request: Request, url: URL): Promise<Response> {
    try {
      // Get callId from query params
      const callId = url.searchParams.get('callId');
      if (!callId) {
        this.env.logger.warn('Voice status callback missing callId');
        return new Response('OK', { status: 200 }); // Still return 200 to Twilio
      }

      // Parse Twilio form data
      const formData = await request.formData();
      const callStatus = formData.get('CallStatus') as string;
      const callSid = formData.get('CallSid') as string;
      const callDuration = formData.get('CallDuration') as string;

      this.env.logger.info('Voice status callback', { callId, callSid, callStatus, callDuration });

      // Map Twilio status to our status
      let ourStatus: string;
      switch (callStatus) {
        case 'queued':
        case 'ringing':
          ourStatus = 'ringing';
          break;
        case 'in-progress':
          ourStatus = 'in-progress';
          break;
        case 'completed':
          // Only update to completed if voice pipeline hasn't already done it
          // Voice pipeline sets completed with duration/cost, we don't want to overwrite
          ourStatus = 'completed';
          break;
        case 'busy':
          ourStatus = 'busy';
          break;
        case 'failed':
          ourStatus = 'failed';
          break;
        case 'no-answer':
          ourStatus = 'no-answer';
          break;
        case 'canceled':
          ourStatus = 'cancelled';
          break;
        default:
          ourStatus = callStatus || 'unknown';
      }

      // For terminal states (busy, failed, no-answer, canceled), always update
      // For completed, only update if there's no duration_seconds set (voice pipeline handles that)
      if (['busy', 'failed', 'no-answer', 'cancelled'].includes(ourStatus)) {
        await this.env.DATABASE_PROXY.executeQuery(
          `UPDATE calls
           SET status = $1,
               error_message = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [ourStatus, `Call ended with status: ${callStatus}`, callId]
        );
        this.env.logger.info('Updated call status to terminal state', { callId, status: ourStatus });
      } else if (ourStatus === 'completed') {
        // Only update to completed if voice pipeline hasn't set duration
        await this.env.DATABASE_PROXY.executeQuery(
          `UPDATE calls
           SET status = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND duration_seconds IS NULL`,
          [ourStatus, callId]
        );
      } else if (ourStatus === 'ringing') {
        // Update to ringing status
        await this.env.DATABASE_PROXY.executeQuery(
          `UPDATE calls SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [ourStatus, callId]
        );
      }

      // Return 200 OK to Twilio (required)
      return new Response('OK', { status: 200 });
    } catch (error) {
      this.env.logger.error('Voice status callback error', {
        error: error instanceof Error ? error.message : String(error)
      });
      // Still return 200 to Twilio to prevent retries
      return new Response('OK', { status: 200 });
    }
  }

  /**
   * Handle WebSocket connection for Twilio Media Streams
   */
  private async handleVoiceStream(request: Request, url: URL): Promise<Response> {
    try {
      this.env.logger.info('WebSocket upgrade request received', {
        url: request.url
      });

      // Upgrade to WebSocket (Cloudflare Workers API)
      // @ts-ignore - WebSocketPair is a Cloudflare Workers global
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Cast to WebSocket for typing
      const serverWs = server as WebSocket;

      // Accept the WebSocket connection (required for Cloudflare Workers)
      (serverWs as any).accept();
      console.log('[API Gateway] WebSocket accept() called, readyState:', serverWs.readyState);

      console.log('[API Gateway] Setting up event listeners SYNCHRONOUSLY...');

      // CRITICAL: Event listeners must be added INLINE/SYNCHRONOUSLY in Cloudflare Workers
      // Cannot be in a separate method call as that creates a context switch
      const startMessageHandler = async (event: any) => {
        console.log('[API Gateway] ===== WebSocket message event fired =====');
        try {
          const message = JSON.parse(event.data as string);
          console.log('[API Gateway] Parsed WebSocket message, event:', message.event);

          if (message.event === 'start') {
            console.log('[API Gateway] START message received!');
            // Remove this listener since we only need it once
            serverWs.removeEventListener('message', startMessageHandler);
            await this.handleStartMessage(serverWs, message.start);
            console.log('[API Gateway] Pipeline initialized, TwilioMediaStreamHandler now handling messages');
          }
        } catch (error) {
          console.log('[API Gateway] Error parsing WebSocket message:', error);
          this.env.logger.error('WebSocket message error', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      };

      serverWs.addEventListener('message', startMessageHandler);

      serverWs.addEventListener('error', (event: any) => {
        console.log('[API Gateway] ===== WebSocket ERROR event fired =====');
        this.env.logger.error('WebSocket error event');
      });

      serverWs.addEventListener('close', (event: any) => {
        console.log('[API Gateway] ===== WebSocket CLOSE event fired =====', event.code, event.reason);
        this.env.logger.info('WebSocket closed', {
          code: event.code,
          reason: event.reason
        });
      });

      console.log('[API Gateway] Event listeners set up, waiting for messages from Twilio...');

      return new Response(null, {
        status: 101,
        // @ts-ignore - Cloudflare Workers WebSocket API
        webSocket: client
      });
    } catch (error) {
      this.env.logger.error('Voice stream error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  /**
   * Set up WebSocket event listeners
   * CRITICAL: Must be called BEFORE accept() in Cloudflare Workers
   * Parameters (callId, userId, personaId) will be extracted from Twilio's "start" message
   * NOTE: We instantiate VoicePipelineOrchestrator HERE instead of calling the service
   * because WebSocket objects cannot be serialized across service boundaries in Cloudflare Workers
   */
  private setupWebSocketEventListeners(ws: WebSocket): void {
    console.log('[API Gateway] setupWebSocketEventListeners called');
    this.env.logger.info('Setting up WebSocket event listeners');

    // Set up event listeners to handle messages as they arrive
    // Don't use await - just process events directly
    console.log('[API Gateway] Setting up WebSocket event listeners...');

    // Only listen for the 'start' message to initialize the pipeline
    // After initialization, the VoicePipelineOrchestrator's TwilioMediaStreamHandler
    // will take over and handle all messages (media, stop, etc.)
    const startMessageHandler = async (event: any) => {
      console.log('[API Gateway] ===== WebSocket message event fired =====');
      try {
        const message = JSON.parse(event.data as string);
        console.log('[API Gateway] Parsed WebSocket message, event:', message.event);

        if (message.event === 'start') {
          console.log('[API Gateway] START message received!');
          // Remove this listener since we only need it once
          ws.removeEventListener('message', startMessageHandler);
          await this.handleStartMessage(ws, message.start);
          console.log('[API Gateway] Pipeline initialized, TwilioMediaStreamHandler now handling messages');
        }
        // Note: we don't handle 'media' or 'stop' here - the pipeline's TwilioHandler does that
      } catch (error) {
        console.log('[API Gateway] Error parsing WebSocket message:', error);
        this.env.logger.error('WebSocket message error', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    ws.addEventListener('message', startMessageHandler);

    ws.addEventListener('error', (event: any) => {
      console.log('[API Gateway] ===== WebSocket ERROR event fired =====');
      this.env.logger.error('WebSocket error event');
    });

    ws.addEventListener('close', (event: any) => {
      console.log('[API Gateway] ===== WebSocket CLOSE event fired =====', event.code, event.reason);
      this.env.logger.info('WebSocket closed', {
        code: event.code,
        reason: event.reason
      });
    });

    console.log('[API Gateway] Event listeners set up, waiting for messages from Twilio...');
  }

  /**
   * Handle the "start" message from Twilio and initialize the voice pipeline
   */
  private async handleStartMessage(ws: WebSocket, startMessage: any): Promise<void> {
    try {
      console.log('[API Gateway] handleStartMessage called');
      this.env.logger.info('Start message received', { startMessage });

      const callId = startMessage.customParameters.callId;
      const userId = startMessage.customParameters.userId;
      const personaId = startMessage.customParameters.personaId;

      console.log('[API Gateway] Extracted parameters:', { callId, userId, personaId });
      this.env.logger.info('Extracted parameters from start message', { callId, userId, personaId });

      // TODO: Cost tracker needs to be refactored to use DATABASE_PROXY instead of SmartSQL
      // For now, skip cost tracking to get the voice pipeline working
      // const costTracker = new CallCostTracker(callId, userId, this.env.CALL_ME_BACK_DB);
      // await costTracker.initialize();
      const costTracker = null as any; // Temporarily disabled
      console.log('[API Gateway] Cost tracker bypassed');

      // Load persona from database
      console.log('[API Gateway] Loading persona...');
      const persona = await this.loadPersona(personaId);
      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }
      console.log('[API Gateway] Persona loaded:', persona.name);

      // Load or create user-persona relationship
      console.log('[API Gateway] Loading relationship...');
      const relationship = await this.loadOrCreateRelationship(userId, personaId);
      console.log('[API Gateway] Relationship loaded');

      // Extract voice configuration from relationship
      const voiceId = relationship.voice_id || persona.default_voice_id || 'JBFqnCBsd6RMkjVDRZzb';
      const voiceSettings = relationship.voice_settings || {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
        speed: 1.0
      };

      console.log('[API Gateway] Voice config:', { voiceId, voiceSettings });

      // Create pipeline configuration
      const config: VoicePipelineConfig = {
        deepgramApiKey: this.env.DEEPGRAM_API_KEY || '',
        elevenLabsApiKey: this.env.ELEVENLABS_API_KEY || '',
        cerebrasApiKey: this.env.CEREBRAS_API_KEY || '',
        voiceId,
        voiceSettings,
        callId,
        userId,
        personaId,
        logger: this.env.logger,  // Pass logger for visibility in Raindrop logs
        databaseProxy: this.env.DATABASE_PROXY  // Pass database proxy for debug markers
      };

      console.log('[API Gateway] Pipeline config created, API keys present:', {
        deepgram: !!this.env.DEEPGRAM_API_KEY,
        elevenlabs: !!this.env.ELEVENLABS_API_KEY,
        cerebras: !!this.env.CEREBRAS_API_KEY
      });

      // Create and start pipeline with SmartMemory
      this.env.logger.info('[API Gateway] Creating VoicePipelineOrchestrator...');
      const pipeline = new VoicePipelineOrchestrator(
        config,
        costTracker,
        this.env.CONVERSATION_MEMORY,  // SmartMemory binding
        persona,
        relationship
      );
      this.env.logger.info('[API Gateway] VoicePipelineOrchestrator created, calling start()...');

      // OBSERVABLE MARKER: Insert debug marker before pipeline.start()
      try {
        await this.env.DATABASE_PROXY.executeQuery(
          `INSERT INTO debug_markers (call_id, marker_name, created_at)
           VALUES ($1, $2, NOW())`,
          [callId, 'BEFORE_PIPELINE_START']
        );
      } catch (e) {
        // Table might not exist, create it
        await this.env.DATABASE_PROXY.executeQuery(
          `CREATE TABLE IF NOT EXISTS debug_markers (
            id SERIAL PRIMARY KEY,
            call_id TEXT NOT NULL,
            marker_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          )`,
          []
        );
        await this.env.DATABASE_PROXY.executeQuery(
          `INSERT INTO debug_markers (call_id, marker_name) VALUES ($1, $2)`,
          [callId, 'BEFORE_PIPELINE_START']
        );
      }

      await pipeline.start(ws);

      // OBSERVABLE MARKER: Insert debug marker after pipeline.start() returns
      await this.env.DATABASE_PROXY.executeQuery(
        `INSERT INTO debug_markers (call_id, marker_name) VALUES ($1, $2)`,
        [callId, 'AFTER_PIPELINE_START']
      );

      this.env.logger.info('[API Gateway] pipeline.start() RETURNED SUCCESSFULLY');

      this.env.logger.info('Voice pipeline started', { callId, personaId });
    } catch (error) {
      console.error('[API Gateway] startVoicePipeline error:', error);
      console.error('[API Gateway] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      this.env.logger.error('Failed to start voice pipeline', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Close WebSocket on error
      try {
        ws.close(1011, 'Internal error');
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }

  /**
   * MINIMAL WebSocket echo test - to verify events fire at all
   */
  private async handleEchoWebSocket(request: Request): Promise<Response> {
    console.log('[Echo] Creating WebSocketPair...');

    // @ts-ignore - WebSocketPair is a Cloudflare Workers global
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const serverWs = server as WebSocket;

    console.log('[Echo] Calling accept()...');
    (serverWs as any).accept();
    console.log('[Echo] WebSocket accepted, readyState:', serverWs.readyState);

    console.log('[Echo] Setting up event listeners SYNCHRONOUSLY...');

    // Set up listeners SYNCHRONOUSLY, immediately after accept()
    serverWs.addEventListener('message', (event: any) => {
      console.log('[Echo] ===== MESSAGE EVENT FIRED =====');
      console.log('[Echo] Received:', event.data);

      try {
        // Echo back
        serverWs.send(`Echo: ${event.data}`);
        console.log('[Echo] Sent echo response');
      } catch (error) {
        console.error('[Echo] Error sending:', error);
      }
    });

    serverWs.addEventListener('error', (event: any) => {
      console.log('[Echo] ===== ERROR EVENT FIRED =====');
      console.error('[Echo] WebSocket error');
    });

    serverWs.addEventListener('close', (event: any) => {
      console.log('[Echo] ===== CLOSE EVENT FIRED =====', event.code, event.reason);
    });

    console.log('[Echo] Event listeners set up, returning 101 response');

    return new Response(null, {
      status: 101,
      // @ts-ignore - Cloudflare Workers WebSocket API
      webSocket: client
    });
  }

  /**
   * Load persona from database (using DATABASE_PROXY to Vultr PostgreSQL)
   */
  private async loadPersona(personaId: string): Promise<any> {
    const result = await this.env.DATABASE_PROXY.executeQuery(
      'SELECT * FROM personas WHERE id = $1',
      [personaId]
    );

    if (!result || !result.rows || result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Load or create user-persona relationship (using DATABASE_PROXY to Vultr PostgreSQL)
   */
  private async loadOrCreateRelationship(userId: string, personaId: string): Promise<any> {
    // Try to load existing relationship
    const result = await this.env.DATABASE_PROXY.executeQuery(
      'SELECT * FROM user_persona_relationships WHERE user_id = $1 AND persona_id = $2',
      [userId, personaId]
    );

    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new relationship with defaults
    const relationshipId = crypto.randomUUID();
    await this.env.DATABASE_PROXY.executeQuery(
      `INSERT INTO user_persona_relationships
       (id, user_id, persona_id, relationship_type, custom_system_prompt, voice_id, voice_settings, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        relationshipId,
        userId,
        personaId,
        'friend',  // Default relationship type
        '',        // No custom prompt initially
        null,      // Will use persona default
        JSON.stringify({
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 1.0,
          style: 0.0
        }),
        new Date().toISOString()
      ]
    );

    // Load the newly created relationship
    const newResult = await this.env.DATABASE_PROXY.executeQuery(
      'SELECT * FROM user_persona_relationships WHERE user_id = $1 AND persona_id = $2',
      [userId, personaId]
    );

    return newResult.rows[0];
  }

  /**
   * Handle persona routes
   */
  private async handlePersonaRoutes(request: Request, path: string): Promise<Response> {
    // GET /api/personas - List all public personas
    if (request.method === 'GET' && path === '/api/personas') {
      try {
        this.env.logger.info('Calling PERSONA_MANAGER.getPersonas()');
        const personas = await this.env.PERSONA_MANAGER.getPersonas();
        this.env.logger.info('Got personas', { count: personas.length });
        return new Response(JSON.stringify(personas), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        this.env.logger.error('Failed to fetch personas', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        return new Response(JSON.stringify({
          error: error instanceof Error ? error.message : String(error)
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle contact routes (user's favorited personas)
   */
  private async handleContactRoutes(request: Request, path: string): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || 'https://call-me-back.vercel.app',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Get user ID from auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // GET /api/contacts - Get user's contacts
      if (request.method === 'GET' && path === '/api/contacts') {
        this.env.logger.info('Fetching contacts for user', { userId });
        const contacts = await this.env.PERSONA_MANAGER.getContacts(userId!);
        return new Response(JSON.stringify(contacts), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/contacts - Add a contact
      if (request.method === 'POST' && path === '/api/contacts') {
        const body = await request.json() as { personaId: string };
        if (!body.personaId) {
          return new Response(JSON.stringify({ error: 'personaId is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        this.env.logger.info('Adding contact', { userId, personaId: body.personaId });
        const contact = await this.env.PERSONA_MANAGER.addContact({
          userId: userId!,
          personaId: body.personaId
        });
        return new Response(JSON.stringify(contact), {
          status: 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // DELETE /api/contacts/:personaId - Remove a contact
      const deleteMatch = path.match(/^\/api\/contacts\/(.+)$/);
      if (request.method === 'DELETE' && deleteMatch && deleteMatch[1]) {
        const personaId = deleteMatch[1];
        this.env.logger.info('Removing contact', { userId, personaId });
        await this.env.PERSONA_MANAGER.removeContact({ userId: userId!, personaId });
        return new Response(JSON.stringify({ message: 'Contact removed' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      this.env.logger.error('Contact route error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  private async handleScenarioTemplates(request: Request, path: string): Promise<Response> {
    const userId = await this.getUserIdFromAuth(request);
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const manager = new ScenarioTemplateManager(this.env.CALL_ME_BACK_DB);

    // GET /api/scenario-templates - List all templates
    if (request.method === 'GET' && path === '/api/scenario-templates') {
      const templates = await manager.getTemplates(userId);
      return new Response(JSON.stringify(templates), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /api/scenario-templates - Create new template
    if (request.method === 'POST' && path === '/api/scenario-templates') {
      const body = await request.json() as { name: string; scenario_text: string; icon?: string };
      const template = await manager.createTemplate(
        userId,
        body.name,
        body.scenario_text,
        body.icon
      );
      return new Response(JSON.stringify(template), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/scenario-templates/:id - Get specific template
    const getMatch = path.match(/^\/api\/scenario-templates\/([^/]+)$/);
    if (request.method === 'GET' && getMatch) {
      const templateId = getMatch[1];
      if (!templateId) {
        return new Response('Invalid template ID', { status: 400 });
      }
      const template = await manager.getTemplate(userId, templateId);
      if (!template) {
        return new Response('Not Found', { status: 404 });
      }
      return new Response(JSON.stringify(template), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // PUT /api/scenario-templates/:id - Update template
    const putMatch = path.match(/^\/api\/scenario-templates\/([^/]+)$/);
    if (request.method === 'PUT' && putMatch) {
      const templateId = putMatch[1];
      if (!templateId) {
        return new Response('Invalid template ID', { status: 400 });
      }
      const body = await request.json() as {
        name?: string;
        scenario_text?: string;
        icon?: string;
      };
      await manager.updateTemplate(userId, templateId, body);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // DELETE /api/scenario-templates/:id - Delete template
    const deleteMatch = path.match(/^\/api\/scenario-templates\/([^/]+)$/);
    if (request.method === 'DELETE' && deleteMatch) {
      const templateId = deleteMatch[1];
      if (!templateId) {
        return new Response('Invalid template ID', { status: 400 });
      }
      await manager.deleteTemplate(userId, templateId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/scenario-templates/popular - Get popular templates
    if (request.method === 'GET' && path === '/api/scenario-templates/popular') {
      const templates = await manager.getPopularTemplates(userId, 5);
      return new Response(JSON.stringify(templates), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle call trigger routes
   */
  private async handleCallRoutes(request: Request, path: string): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || 'https://call-me-back.vercel.app',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // GET /api/calls/history - Get user's call history
    if (request.method === 'GET' && path === '/api/calls/history') {
      return await this.handleGetCallHistory(request, corsHeaders);
    }

    // POST /api/calls/trigger - Initiate an outbound call
    if (request.method === 'POST' && path === '/api/calls/trigger') {
      return await this.handleCallTrigger(request, corsHeaders);
    }

    // POST /api/calls/schedule - Schedule a future call
    if (request.method === 'POST' && path === '/api/calls/schedule') {
      return await this.handleScheduleCall(request, corsHeaders);
    }

    // GET /api/calls/scheduled - List user's scheduled calls
    if (request.method === 'GET' && path === '/api/calls/scheduled') {
      return await this.handleListScheduledCalls(request, corsHeaders);
    }

    // DELETE /api/calls/schedule/:id - Cancel a scheduled call
    if (request.method === 'DELETE' && path.startsWith('/api/calls/schedule/')) {
      return await this.handleCancelScheduledCall(request, path, corsHeaders);
    }

    // PATCH /api/calls/schedule/:id - Update a scheduled call's time
    if (request.method === 'PATCH' && path.startsWith('/api/calls/schedule/')) {
      return await this.handleUpdateScheduledCall(request, path, corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }

  /**
   * Handle call trigger - initiate outbound call via Twilio
   */
  private async handleCallTrigger(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json() as {
        phoneNumber: string;
        personaId?: string;
        paymentIntentId?: string; // For one-time Stripe payments
        useCredits?: boolean; // To use account credits instead
        callPretext?: string; // Optional scenario/context for this specific call
        adminBypass?: boolean; // Admin token bypass for testing
      };

      if (!body.phoneNumber) {
        return new Response(JSON.stringify({ error: 'Phone number is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Check for admin bypass FIRST (for testing/demos)
      const authHeader = request.headers.get('Authorization');
      let isAdminToken = body.adminBypass || false;
      let adminUserId: string | null = null;

      // Check if this is an admin JWT (has adminId in payload)
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const parts = token.split('.');
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.adminId) {
              isAdminToken = true;
              adminUserId = payload.adminId;
              this.env.logger.info('Admin JWT detected', { adminId: payload.adminId });
            }
          }
        } catch (e) {
          // Not a valid JWT, continue with normal auth
        }
      }

      // Get userId from JWT auth token OR use admin bypass
      let userId: string | null = null;
      if (isAdminToken) {
        // Admin bypass - use admin user ID from token or fallback
        userId = adminUserId || 'admin_demo_user';
        this.env.logger.info('Admin token bypass used for call trigger', { userId });
      } else {
        userId = await this.getUserIdFromAuth(request);
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      const personaId = body.personaId || 'brad_001';

      // Check user's minutes balance before allowing call (skip for admin)
      let availableMinutes = 0;
      if (!isAdminToken) {
        const balanceResult = await this.env.DATABASE_PROXY.executeQuery(
          `SELECT available_credits FROM user_credits WHERE user_id = $1`,
          [userId]
        );
        availableMinutes = balanceResult.rows?.[0]?.available_credits
          ? parseInt(balanceResult.rows[0].available_credits)
          : 0;
      } else {
        availableMinutes = 999; // Admin has unlimited
      }

      // Determine payment method and validate
      let paymentMethod = 'credits';
      let paymentIntentId: string | undefined = undefined;
      let paymentStatus = 'pending';

      if (isAdminToken) {
        // Admin bypass for testing
        paymentMethod = 'admin_bypass';
        paymentStatus = 'paid';
        this.env.logger.info('Admin bypass used for call', { userId, personaId });
      } else if (body.paymentIntentId) {
        // Using Stripe payment
        paymentMethod = 'stripe';
        paymentIntentId = body.paymentIntentId;
        // TODO: Verify payment intent with Stripe
        paymentStatus = 'paid';
      } else if (availableMinutes >= 1) {
        // User has sufficient minutes balance
        paymentMethod = 'credits';
        paymentStatus = 'credit_reserved';
        // Note: Actual deduction happens after call ends based on duration
      } else {
        // Insufficient balance - return error with purchase link
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient minutes balance',
          minutes_available: availableMinutes,
          minutes_required: 1,
          purchase_url: '/profile#purchase',
          message: 'You need at least 1 minute of balance to make a call. Purchase minutes to continue.'
        }), {
          status: 402, // Payment Required
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      this.env.logger.info('Triggering call', {
        phoneNumber: body.phoneNumber,
        userId,
        personaId,
        paymentMethod,
        paymentStatus,
        availableMinutes,
        hasCallPretext: !!body.callPretext
      });

      // Call the call-orchestrator service to initiate the call
      const initiateCallInput: any = {
        userId,
        personaId,
        phoneNumber: body.phoneNumber,
        paymentMethod,
        paymentIntentId,
        paymentStatus
      };

      // Add callPretext if provided
      if (body.callPretext) {
        initiateCallInput.callPretext = body.callPretext;
      }

      const result = await this.env.CALL_ORCHESTRATOR.initiateCall(initiateCallInput);

      return new Response(JSON.stringify({
        success: true,
        callId: result.id,
        status: result.status,
        paymentMethod,
        minutes_available: availableMinutes,
        message: 'Call initiated successfully. You should receive a call shortly.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Call trigger error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate call'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Temporary seed endpoint to populate personas - REMOVE AFTER USE
   */
  private async handleSeedPersonas(request: Request): Promise<Response> {
    try {
      const personas = [
        {
          name: 'Brad',
          description: 'Your bro who keeps it real and helps you get stuff done',
          systemPrompt: 'You are Brad, a decisive and confident friend who speaks directly and honestly.',
          voice: 'pNInz6obpgDQGcFmaJgB',
          tags: ['coach']
        },
        {
          name: 'Sarah',
          description: 'A warm, empathetic friend who really listens and understands',
          systemPrompt: 'You are Sarah, a warm and empathetic friend who creates a safe space for people to share.',
          voice: 'EXAVITQu4vr4xnSDxMaL',
          tags: ['friend']
        },
        {
          name: 'Alex',
          description: 'An energetic creative who helps you think outside the box',
          systemPrompt: 'You are Alex, an energetic and creative friend who helps people see new possibilities.',
          voice: 'pNInz6obpgDQGcFmaJgB',
          tags: ['creative']
        }
      ];

      const results = [];
      for (const persona of personas) {
        try {
          // Note: isPublic controls is_system_persona in the database
          const created = await this.env.PERSONA_MANAGER.createPersona({
            name: persona.name,
            description: persona.description,
            systemPrompt: persona.systemPrompt,
            voice: persona.voice,
            isPublic: false, // This actually doesn't matter since createPersona always sets is_system_persona to false
            tags: persona.tags
          });
          results.push({ success: true, persona: created });
        } catch (error: any) {
          results.push({ success: false, name: persona.name, error: error.message });
        }
      }

      return new Response(JSON.stringify({ 
        message: 'Seed complete',
        results 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Seed personas error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to seed personas'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle authentication routes
   */
  private async handleAuthRoutes(request: Request, path: string): Promise<Response> {
    try {
      // GET /api/auth/login/oauth - Redirect to WorkOS AuthKit for OAuth login
      if (request.method === 'GET' && path === '/api/auth/login/oauth') {
        if (!this.env.WORKOS_API_KEY || !this.env.WORKOS_CLIENT_ID) {
          return new Response(JSON.stringify({ error: 'OAuth not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Build WorkOS authorization URL
        // Using authkit provider which shows all configured auth methods (Google, GitHub, email/password, etc.)
        const redirectUri = this.env.WORKOS_USER_REDIRECT_URI || 'https://callmeback.ai/auth/callback';
        const authUrl = new URL('https://api.workos.com/user_management/authorize');
        authUrl.searchParams.set('client_id', this.env.WORKOS_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('provider', 'authkit');

        return Response.redirect(authUrl.toString(), 302);
      }

      // GET /api/auth/callback - Handle WorkOS OAuth callback
      if (request.method === 'GET' && path === '/api/auth/callback') {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        const frontendUrl = this.env.FRONTEND_URL || 'https://callmeback.ai';

        if (error) {
          console.error('[API-GATEWAY] WorkOS OAuth error:', error);
          return Response.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error)}`, 302);
        }

        if (!code) {
          return Response.redirect(`${frontendUrl}/login?error=no_code`, 302);
        }

        try {
          // Exchange code for tokens using WorkOS API
          // Per WorkOS docs: client_secret goes in the body, NOT in Authorization header
          const tokenResponse = await fetch('https://api.workos.com/user_management/authenticate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: this.env.WORKOS_CLIENT_ID,
              client_secret: this.env.WORKOS_API_KEY,
              code: code,
              grant_type: 'authorization_code',
            }),
          });

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('[API-GATEWAY] WorkOS token exchange failed:', {
              status: tokenResponse.status,
              statusText: tokenResponse.statusText,
              error: errorText,
              hasClientId: !!this.env.WORKOS_CLIENT_ID,
              hasApiKey: !!this.env.WORKOS_API_KEY,
              codeLength: code?.length || 0
            });
            return Response.redirect(`${frontendUrl}/login?error=auth_failed`, 302);
          }

          const tokenData = await tokenResponse.json() as any;
          const workosUser = tokenData.user;
          const accessToken = tokenData.access_token;

          // Upsert user in our database
          const userId = workosUser.id;
          const email = workosUser.email;
          const name = workosUser.first_name
            ? `${workosUser.first_name} ${workosUser.last_name || ''}`.trim()
            : email.split('@')[0];

          // Upsert by email - user may have registered via email/password previously
          // On conflict, update their ID to the WorkOS ID for unified auth
          await this.env.DATABASE_PROXY.executeQuery(`
            INSERT INTO users (id, email, password_hash, name, email_verified)
            VALUES ($1, $2, 'workos_oauth', $3, $4)
            ON CONFLICT (email) DO UPDATE SET
              id = EXCLUDED.id,
              password_hash = 'workos_oauth',
              name = COALESCE(EXCLUDED.name, users.name),
              email_verified = EXCLUDED.email_verified,
              updated_at = NOW()
          `, [userId, email, name, workosUser.email_verified || false]);

          // Give new users 5 free trial minutes (only if they don't have credits yet)
          // available_credits represents minutes, so 5 = 5 minutes free trial
          const FREE_TRIAL_MINUTES = 5;
          await this.env.DATABASE_PROXY.executeQuery(`
            INSERT INTO user_credits (id, user_id, available_credits, subscription_tier, max_call_duration_minutes)
            VALUES (gen_random_uuid()::text, $1, $2, 'free_trial', $2)
            ON CONFLICT (user_id) DO NOTHING
          `, [userId, FREE_TRIAL_MINUTES]);

          console.log('[API-GATEWAY] User authenticated via WorkOS OAuth:', { userId, email, freeTrialMinutes: FREE_TRIAL_MINUTES });

          // Redirect to frontend with the WorkOS access token
          // The frontend will store this and use it for API calls
          return Response.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`, 302);
        } catch (err) {
          console.error('[API-GATEWAY] OAuth callback error:', err);
          return Response.redirect(`${frontendUrl}/login?error=auth_failed`, 302);
        }
      }

      // POST /api/auth/register - User registration
      if (request.method === 'POST' && path === '/api/auth/register') {
        const body = await request.json() as any;
        const result = await this.env.AUTH_MANAGER.register(body);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // POST /api/auth/login - User login
      if (request.method === 'POST' && path === '/api/auth/login') {
        const body = await request.json() as any;
        const result = await this.env.AUTH_MANAGER.login(body);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // POST /api/auth/logout - User logout
      if (request.method === 'POST' && path === '/api/auth/logout') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response('Unauthorized', { status: 401 });
        }
        const token = authHeader.substring(7);
        await this.env.AUTH_MANAGER.logout(token);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // GET /api/auth/validate - Validate token
      if (request.method === 'GET' && path === '/api/auth/validate') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response('Unauthorized', { status: 401 });
        }
        const token = authHeader.substring(7);
        const result = await this.env.AUTH_MANAGER.validateToken(token);
        if (!result.valid) {
          return new Response(JSON.stringify(result), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // POST /api/auth/me - Get current user profile (POST for security - no caching/logging)
      if (request.method === 'POST' && path === '/api/auth/me') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.substring(7);
        const validation = await this.env.AUTH_MANAGER.validateToken(token);

        if (!validation.valid || !validation.userId) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Fetch user from database
        const result = await this.env.DATABASE_PROXY.executeQuery(
          'SELECT id, email, name, phone, email_verified, phone_verified, stripe_customer_id, created_at, updated_at FROM users WHERE id = $1',
          [validation.userId]
        );

        if (result.rows.length === 0) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const dbUser = result.rows[0] as any;
        return new Response(JSON.stringify({
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            phone: dbUser.phone,
            emailVerified: Boolean(dbUser.email_verified),
            phoneVerified: Boolean(dbUser.phone_verified),
            stripeCustomerId: dbUser.stripe_customer_id,
            createdAt: dbUser.created_at,
            updatedAt: dbUser.updated_at
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      this.env.logger.error('Auth route error', {
        error: error instanceof Error ? error.message : String(error),
        path
      });
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Authentication error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async getUserIdFromAuth(request: Request): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    try {
      const validation = await this.env.AUTH_MANAGER.validateToken(token);
      if (validation.valid && validation.userId) {
        return validation.userId;
      }
    } catch (error) {
      this.env.logger.error('Token validation error', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return null;
  }

  /**
   * Handle admin routes - call admin-dashboard service methods directly
   * REFACTORED 2025-11-24: Changed from .fetch() to direct method calls (Raindrop pattern)
   */
  private async handleAdminRoutes(request: Request, path: string): Promise<Response> {
    try {
      console.log('[API-GATEWAY] handleAdminRoutes called, path:', path, 'method:', request.method);

      // Allowed origins for admin routes (production + local dev)
      const allowedOrigins = [
        'https://call-me-back.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
      ];

      const origin = request.headers.get('Origin') || '';
      const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': allowOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
            'Vary': 'Origin'
          }
        });
      }

      // Validate JWT token
      const authHeader = request.headers.get('Authorization');
      console.log('[API-GATEWAY] Got auth header:', !!authHeader);

      if (!authHeader) {
        console.log('[API-GATEWAY] No auth header provided');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowOrigin,
            'Vary': 'Origin'
          }
        });
      }

      const token = authHeader.replace('Bearer ', '');
      console.log('[API-GATEWAY] Validating JWT token, length:', token.length);

      // Decode JWT to get payload (WorkOS JWT has adminId, regular JWT has userId)
      let payload: any;
      try {
        const parts = token.split('.');
        if (parts.length !== 3 || !parts[1]) {
          throw new Error('Invalid JWT format');
        }
        payload = JSON.parse(atob(parts[1]));
        console.log('[API-GATEWAY] JWT payload fields:', Object.keys(payload));
      } catch (e) {
        console.log('[API-GATEWAY] Failed to decode JWT:', e);
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token format' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Determine if this is a WorkOS token (has adminId or workosId field)
      const isWorkOSToken = !!(payload.adminId || payload.workosId);

      // For non-WorkOS tokens, validate signature using AUTH_MANAGER
      // For WorkOS tokens, skip signature validation since they're signed by WorkOS
      if (!isWorkOSToken) {
        const validation = await this.env.AUTH_MANAGER.validateToken(token);

        if (!validation.valid) {
          console.log('[API-GATEWAY] JWT validation failed:', validation.error);
          return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Get user ID (WorkOS uses adminId, regular auth uses userId)
      const userId = payload.adminId || payload.userId;
      const userEmail = payload.email;

      console.log('[API-GATEWAY] JWT validated, userId:', userId, 'email:', userEmail, 'isWorkOS:', isWorkOSToken);

      // Check if user is an admin by checking admin_users table
      const adminCheck = await this.env.DATABASE_PROXY.executeQuery(
        'SELECT id, email, role FROM admin_users WHERE id = $1 OR email = $2',
        [userId, userEmail]
      );

      if (!adminCheck.rows || adminCheck.rows.length === 0) {
        console.log('[API-GATEWAY] User is not an admin. userId:', userId, 'email:', userEmail);
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log('[API-GATEWAY] Admin access confirmed for user:', userId);

      // Parse URL to get query params
      const url = new URL(request.url);

      console.log('[API-GATEWAY] Checking path:', path);

      // Route to dashboard endpoint
      if (path === '/api/admin/dashboard' || path.startsWith('/api/admin/dashboard')) {
        const period = url.searchParams.get('period') || '30d';
        console.log('[API-GATEWAY] Calling ADMIN_DASHBOARD.getDashboardData(), period:', period);

        const data = await this.env.ADMIN_DASHBOARD.getDashboardData(period);

        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin'
          }
        });
      }

      // PATCH/PUT /api/admin/personas/:id - Update persona
      const personaUpdateMatch = path.match(/^\/api\/admin\/personas\/([^/]+)$/);
      if ((request.method === 'PATCH' || request.method === 'PUT') && personaUpdateMatch && personaUpdateMatch[1]) {
        const personaId = personaUpdateMatch[1];
        console.log('[API-GATEWAY] Updating persona:', personaId);

        const body = await request.json() as {
          core_system_prompt?: string;
          systemPrompt?: string;
          default_voice_id?: string;
          voice?: string;
          temperature?: number;
          max_tokens?: number;
          max_call_duration?: number;
        };

        // Normalize field names - accept both API names and database names
        const updates: any = {};

        if (body.systemPrompt !== undefined || body.core_system_prompt !== undefined) {
          updates.systemPrompt = body.systemPrompt || body.core_system_prompt;
        }
        if (body.voice !== undefined || body.default_voice_id !== undefined) {
          updates.voice = body.voice || body.default_voice_id;
        }
        if (body.temperature !== undefined) {
          updates.temperature = body.temperature;
        }
        if (body.max_tokens !== undefined) {
          updates.max_tokens = body.max_tokens;
        }
        if (body.max_call_duration !== undefined) {
          updates.max_call_duration = body.max_call_duration;
        }

        await this.env.PERSONA_MANAGER.updatePersona(personaId, updates);

        return new Response(JSON.stringify({ success: true, personaId }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Vary': 'Origin'
          }
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Admin route error:', error instanceof Error ? error.message : String(error), 'path:', path);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Admin error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle schedule call - schedule a future call
   */
  private async handleScheduleCall(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json() as {
        phoneNumber: string;
        personaId: string;
        scheduledTime: string;
        callPretext?: string;
        callScenario?: string;
        customInstructions?: string;
        maxDurationMinutes?: number;
        voiceId?: string;
        aiParameters?: Record<string, any>;
      };

      if (!body.phoneNumber) {
        return new Response(JSON.stringify({ error: 'Phone number is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (!body.scheduledTime) {
        return new Response(JSON.stringify({ error: 'Scheduled time is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get userId from JWT auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Validate scheduled time
      const scheduledTime = new Date(body.scheduledTime);
      const now = new Date();
      const minTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 min minimum (cron runs every minute)
      const maxTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days max

      if (scheduledTime < minTime) {
        return new Response(JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Must schedule at least 1 minute in advance'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (scheduledTime > maxTime) {
        return new Response(JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Cannot schedule more than 30 days in advance'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const personaId = body.personaId || 'brad_001';

      this.env.logger.info('Scheduling call', {
        userId,
        personaId,
        scheduledTime: body.scheduledTime,
        hasPretext: !!body.callPretext
      });

      const result = await this.env.CALL_ORCHESTRATOR.scheduleCall({
        userId,
        personaId,
        phoneNumber: body.phoneNumber,
        scheduledTime: body.scheduledTime,
        callPretext: body.callPretext,
        callScenario: body.callScenario,
        customInstructions: body.customInstructions,
        maxDurationMinutes: body.maxDurationMinutes,
        voiceId: body.voiceId,
        aiParameters: body.aiParameters
      });

      return new Response(JSON.stringify({
        success: true,
        scheduled_call: result,
        message: `Call scheduled for ${scheduledTime.toISOString()}`
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Schedule call error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule call'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Handle list scheduled calls - get user's pending scheduled calls
   */
  private async handleListScheduledCalls(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      // Get userId from JWT auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const result = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT sc.*, p.name as persona_name
         FROM scheduled_calls sc
         JOIN personas p ON sc.persona_id = p.id
         WHERE sc.user_id = $1 AND sc.status = 'scheduled'
         ORDER BY sc.scheduled_time ASC`,
        [userId]
      );

      return new Response(JSON.stringify({
        success: true,
        scheduled_calls: result.rows || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('List scheduled calls error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list scheduled calls'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Handle cancel scheduled call - cancel a pending scheduled call
   */
  private async handleCancelScheduledCall(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const callId = path.split('/').pop();

      if (!callId) {
        return new Response(JSON.stringify({ error: 'Call ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get userId from JWT auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Verify ownership and get scheduled call
      const existing = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT * FROM scheduled_calls WHERE id = $1 AND user_id = $2`,
        [callId, userId]
      );

      if (!existing.rows || existing.rows.length === 0) {
        return new Response(JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Scheduled call not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const scheduledCall = existing.rows[0];

      // Check if already cancelled or executed
      if (scheduledCall.status !== 'scheduled') {
        return new Response(JSON.stringify({
          error: 'INVALID_STATUS',
          message: `Cannot cancel call with status: ${scheduledCall.status}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Check if too close to scheduled time
      const scheduledTime = new Date(scheduledCall.scheduled_time);
      const minCancelTime = new Date(Date.now() + 1 * 60 * 1000);

      if (scheduledTime < minCancelTime) {
        return new Response(JSON.stringify({
          error: 'CANCELLATION_DENIED',
          message: 'Cannot cancel within 1 minute of scheduled time'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Cancel the scheduled call
      await this.env.DATABASE_PROXY.executeQuery(
        `UPDATE scheduled_calls SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [callId]
      );

      this.env.logger.info('Scheduled call cancelled', { callId, userId });

      return new Response(JSON.stringify({
        success: true,
        message: 'Scheduled call cancelled successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Cancel scheduled call error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel scheduled call'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Handle update scheduled call - reschedule a pending call to a new time
   * PATCH /api/calls/schedule/:id
   */
  private async handleUpdateScheduledCall(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const callId = path.split('/').pop();

      if (!callId) {
        return new Response(JSON.stringify({ error: 'Call ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get userId from JWT auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Parse request body
      const body = await request.json() as { scheduledTime: string };

      if (!body.scheduledTime) {
        return new Response(JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'scheduledTime is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Validate new scheduled time
      const newScheduledTime = new Date(body.scheduledTime);
      if (isNaN(newScheduledTime.getTime())) {
        return new Response(JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Invalid datetime format. Use ISO 8601'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const now = new Date();
      const minTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 min minimum
      const maxTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days max

      if (newScheduledTime < minTime) {
        return new Response(JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Must schedule at least 1 minute in advance'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (newScheduledTime > maxTime) {
        return new Response(JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Cannot schedule more than 30 days in advance'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Verify ownership and get scheduled call
      const existing = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT * FROM scheduled_calls WHERE id = $1 AND user_id = $2`,
        [callId, userId]
      );

      if (!existing.rows || existing.rows.length === 0) {
        return new Response(JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Scheduled call not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const scheduledCall = existing.rows[0];

      // Check if call is still in 'scheduled' status
      if (scheduledCall.status !== 'scheduled') {
        return new Response(JSON.stringify({
          error: 'INVALID_STATUS',
          message: `Cannot update call with status: ${scheduledCall.status}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Update the scheduled time
      const updateResult = await this.env.DATABASE_PROXY.executeQuery(
        `UPDATE scheduled_calls
         SET scheduled_time = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [newScheduledTime.toISOString(), callId]
      );

      const updatedCall = updateResult.rows?.[0];

      this.env.logger.info('Scheduled call updated', {
        callId,
        userId,
        oldTime: scheduledCall.scheduled_time,
        newTime: newScheduledTime.toISOString()
      });

      return new Response(JSON.stringify({
        success: true,
        scheduled_call: updatedCall,
        message: `Call rescheduled to ${newScheduledTime.toISOString()}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Update scheduled call error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update scheduled call'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Get user's call history with pagination
   * GET /api/calls/history?page=1&limit=20
   */
  private async handleGetCallHistory(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      // Get userId from JWT auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const url = new URL(request.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT COUNT(*) as total FROM calls WHERE user_id = $1`,
        [userId]
      );
      const total = parseInt(countResult.rows?.[0]?.total || '0');

      // Get paginated calls with persona name
      const result = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT 
          c.id,
          c.user_id,
          c.persona_id,
          p.name as persona_name,
          c.status,
          c.start_time,
          c.end_time,
          c.duration_seconds as duration,
          c.cost_usd as cost,
          c.twilio_call_sid as sid,
          c.error_message
        FROM calls c
        LEFT JOIN personas p ON c.persona_id = p.id
        WHERE c.user_id = $1
        ORDER BY c.start_time DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return new Response(JSON.stringify({
        success: true,
        calls: result.rows || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Get call history error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch call history'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }


  /**
   * Handle user routes (usage stats, billing, etc.)
   */
  private async handleUserRoutes(request: Request, path: string): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || 'https://call-me-back.vercel.app',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // GET /api/user/balance - Get minutes balance
    if (request.method === 'GET' && path === '/api/user/balance') {
      return await this.handleGetBalance(request, corsHeaders);
    }

    // GET /api/user/usage - Get usage statistics
    if (request.method === 'GET' && path === '/api/user/usage') {
      return await this.handleGetUsageStats(request, corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }

  /**
   * Get user's usage statistics
   * GET /api/user/usage?months=3
   */
  private async handleGetUsageStats(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      // Get userId from JWT auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const url = new URL(request.url);
      const months = Math.min(12, Math.max(1, parseInt(url.searchParams.get('months') || '3')));

      // Get overall totals
      const totalsResult = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT 
          COUNT(*) as total_calls,
          COALESCE(SUM(duration_seconds), 0) as total_seconds,
          COALESCE(SUM(cost_usd), 0) as total_spent
        FROM calls 
        WHERE user_id = $1 AND status = 'completed'`,
        [userId]
      );
      const totals = totalsResult.rows?.[0] || { total_calls: 0, total_seconds: 0, total_spent: 0 };

      // Get current month stats
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const currentMonthResult = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT 
          COUNT(*) as calls,
          COALESCE(SUM(duration_seconds), 0) as seconds,
          COALESCE(SUM(cost_usd), 0) as spent
        FROM calls 
        WHERE user_id = $1 AND status = 'completed' AND start_time >= $2`,
        [userId, firstOfMonth]
      );
      const currentMonth = currentMonthResult.rows?.[0] || { calls: 0, seconds: 0, spent: 0 };

      // Get monthly breakdown
      const monthsAgo = new Date(now.getFullYear(), now.getMonth() - months + 1, 1).toISOString();
      
      const breakdownResult = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT 
          TO_CHAR(start_time, 'Mon YYYY') as month,
          COUNT(*) as calls,
          COALESCE(SUM(duration_seconds), 0) as seconds,
          COALESCE(SUM(cost_usd), 0) as spent
        FROM calls 
        WHERE user_id = $1 AND status = 'completed' AND start_time >= $2
        GROUP BY TO_CHAR(start_time, 'Mon YYYY'), DATE_TRUNC('month', start_time)
        ORDER BY DATE_TRUNC('month', start_time) DESC`,
        [userId, monthsAgo]
      );

      const monthlyBreakdown = (breakdownResult.rows || []).map((row: any) => ({
        month: row.month,
        calls: parseInt(row.calls),
        minutes: Math.round(parseInt(row.seconds) / 60),
        spent: parseFloat(row.spent)
      }));

      return new Response(JSON.stringify({
        success: true,
        usage: {
          total_calls: parseInt(totals.total_calls),
          total_minutes: Math.round(parseInt(totals.total_seconds) / 60),
          total_spent: parseFloat(totals.total_spent),
          current_month: {
            calls: parseInt(currentMonth.calls),
            minutes: Math.round(parseInt(currentMonth.seconds) / 60),
            spent: parseFloat(currentMonth.spent)
          },
          monthly_breakdown: monthlyBreakdown
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Get usage stats error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch usage statistics'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }


  /**
   * GET /api/user/balance - Get user's minutes balance
   * Returns available minutes and last updated timestamp
   */
  private async handleGetBalance(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      // Get userId from JWT auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Query user_credits table for balance
      // available_credits = minutes (1 credit = 1 minute per pricing model)
      const result = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT available_credits, updated_at 
         FROM user_credits 
         WHERE user_id = $1`,
        [userId]
      );

      // If no credits record exists, return 0 minutes
      const row = result.rows?.[0];
      const minutes = row ? parseInt(row.available_credits) || 0 : 0;
      const lastUpdated = row?.updated_at ? new Date(row.updated_at).toISOString() : null;

      return new Response(JSON.stringify({
        success: true,
        minutes: minutes,
        lastUpdated: lastUpdated
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Get balance error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }


  /**
   * Payment routes handler
   * POST /api/payments/create-checkout-session - Create Stripe checkout session
   * POST /api/payments/webhook - Handle Stripe webhooks
   * GET /api/payments/history - Get user's purchase history
   */
  private async handlePaymentRoutes(request: Request, path: string): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || 'https://call-me-back.vercel.app',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // POST /api/payments/create-checkout-session
      if (request.method === 'POST' && path === '/api/payments/create-checkout-session') {
        return await this.handleCreateCheckoutSession(request, corsHeaders);
      }

      // POST /api/payments/webhook - Stripe webhook (no auth required, uses signature verification)
      if (request.method === 'POST' && path === '/api/payments/webhook') {
        return await this.handleStripeWebhook(request, corsHeaders);
      }

      // GET /api/payments/history
      if (request.method === 'GET' && path === '/api/payments/history') {
        return await this.handleGetPurchaseHistory(request, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      this.env.logger.error('Payment routes error', {
        error: error instanceof Error ? error.message : String(error),
        path
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Payment error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Create Stripe Checkout session for minutes purchase
   */
  private async handleCreateCheckoutSession(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      // Get userId from JWT auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const body = await request.json() as { sku: string };
      
      // Map SKU to price ID and minutes (Price IDs configured in raindrop.manifest)
      // New pricing tiers: Starter 25min/$14.99, Basic 50min/$24.99, Plus 100min/$44.99
      const skuMap: Record<string, { priceId: string; minutes: number }> = {
        'minutes_25': { priceId: this.env.STRIPE_PRICE_TWENTY_FIVE_MIN, minutes: 25 },
        'minutes_50': { priceId: this.env.STRIPE_PRICE_FIFTY_MIN, minutes: 50 },
        'minutes_100': { priceId: this.env.STRIPE_PRICE_ONE_HUNDRED_MIN, minutes: 100 },
      };

      const skuInfo = skuMap[body.sku];
      if (!skuInfo) {
        return new Response(JSON.stringify({ 
          error: 'Invalid SKU',
          valid_skus: Object.keys(skuMap)
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Get user email for Stripe
      const userResult = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT email FROM users WHERE id = $1`,
        [userId]
      );
      const userEmail = userResult.rows?.[0]?.email;

      // Create Stripe Checkout session via Stripe API
      const stripeSecretKey = this.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Use configured frontend URL - don't trust Origin header (could be spoofed)
      const frontendUrl = this.env.FRONTEND_URL || 'https://call-me-back.vercel.app';

      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'mode': 'payment',
          'line_items[0][price]': skuInfo.priceId,
          'line_items[0][quantity]': '1',
          'success_url': `${frontendUrl}/pricing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          'cancel_url': `${frontendUrl}/pricing?payment=cancelled`,
          'client_reference_id': userId,
          'allow_promotion_codes': 'true',
          'metadata[sku]': body.sku,
          'metadata[minutes]': String(skuInfo.minutes),
          'metadata[user_id]': userId,
          ...(userEmail ? { 'customer_email': userEmail } : {}),
        }),
      });

      if (!stripeResponse.ok) {
        const errorText = await stripeResponse.text();
        this.env.logger.error('Stripe checkout session creation failed', { errorText });
        return new Response(JSON.stringify({ 
          error: 'Failed to create checkout session',
          details: errorText
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const session = await stripeResponse.json() as { id: string; url: string };

      // Store pending purchase record
      const purchaseId = crypto.randomUUID();
      await this.env.DATABASE_PROXY.executeQuery(
        `INSERT INTO purchases (id, user_id, stripe_session_id, sku, minutes, amount_cents, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [purchaseId, userId, session.id, body.sku, skuInfo.minutes, 0] // amount_cents will be updated by webhook
      );

      return new Response(JSON.stringify({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Create checkout session error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Verify Stripe webhook signature using HMAC-SHA256
   * Returns the raw body if valid, throws if invalid
   */
  private async verifyStripeSignature(request: Request, webhookSecret: string): Promise<{ body: string; event: any }> {
    const signature = request.headers.get('Stripe-Signature');
    if (!signature) {
      throw new Error('Missing Stripe-Signature header');
    }

    const body = await request.text();

    // Parse signature header (format: t=timestamp,v1=signature)
    const sigParts: Record<string, string> = {};
    for (const part of signature.split(',')) {
      const eqIndex = part.indexOf('=');
      if (eqIndex > 0) {
        const key = part.substring(0, eqIndex);
        const value = part.substring(eqIndex + 1);
        sigParts[key] = value;
      }
    }

    const timestamp = sigParts['t'];
    const expectedSig = sigParts['v1'];

    if (!timestamp || !expectedSig) {
      throw new Error('Invalid Stripe-Signature format');
    }

    // Check timestamp is within tolerance (5 minutes)
    const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (timestampAge > 300) {
      throw new Error('Webhook timestamp too old');
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison
    if (computedSig.length !== expectedSig.length) {
      throw new Error('Invalid webhook signature');
    }
    let match = true;
    for (let i = 0; i < computedSig.length; i++) {
      if (computedSig[i] !== expectedSig[i]) match = false;
    }
    if (!match) {
      throw new Error('Invalid webhook signature');
    }

    return { body, event: JSON.parse(body) };
  }

  /**
   * Handle Stripe webhook events
   * Primary event: checkout.session.completed
   *
   * Key features:
   * - Signature verification for security
   * - Idempotency check to prevent duplicate credit additions
   * - Proper error handling (500 for transient errors to allow retries)
   */
  private async handleStripeWebhook(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const webhookSecret = this.env.STRIPE_WEBHOOK_SECRET;

    // Verify signature if webhook secret is configured
    let event: {
      id: string;
      type: string;
      data: {
        object: {
          id: string;
          client_reference_id?: string;
          metadata?: { sku?: string; minutes?: string; user_id?: string };
          amount_total?: number;
          payment_intent?: string;
          customer?: string;
        };
      };
    };

    try {
      if (webhookSecret) {
        const verified = await this.verifyStripeSignature(request, webhookSecret);
        event = verified.event;
        this.env.logger.info('Stripe webhook signature verified');
      } else {
        // Development fallback - log warning but process anyway
        this.env.logger.warn('Stripe webhook signature verification skipped - STRIPE_WEBHOOK_SECRET not configured');
        event = await request.json() as typeof event;
      }
    } catch (error) {
      this.env.logger.error('Stripe webhook signature verification failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    this.env.logger.info('Stripe webhook received', {
      eventId: event.id,
      type: event.type,
      sessionId: event.data.object.id
    });

    // Only process checkout.session.completed events
    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true, processed: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const session = event.data.object;
    const userId = session.client_reference_id || session.metadata?.user_id;
    const minutes = parseInt(session.metadata?.minutes || '0');
    const sku = session.metadata?.sku;
    const amountCents = session.amount_total || 0;

    // Validate required data
    if (!userId || !minutes) {
      this.env.logger.error('Missing userId or minutes in checkout session', {
        sessionId: session.id,
        userId,
        minutes
      });
      // Return 200 for data errors - retrying won't help
      return new Response(JSON.stringify({ received: true, error: 'Missing required metadata' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    try {
      // IDEMPOTENCY CHECK: Check if this session was already processed
      const existingPurchase = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT id, status FROM purchases WHERE stripe_session_id = $1`,
        [session.id]
      );

      if (existingPurchase.rows?.[0]?.status === 'completed') {
        this.env.logger.info('Webhook already processed (idempotent)', { sessionId: session.id });
        return new Response(JSON.stringify({ received: true, already_processed: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Update purchase record to completed
      await this.env.DATABASE_PROXY.executeQuery(
        `UPDATE purchases
         SET status = 'completed',
             amount_cents = $1,
             stripe_payment_intent = $2,
             stripe_customer_id = $3,
             completed_at = CURRENT_TIMESTAMP
         WHERE stripe_session_id = $4`,
        [amountCents, session.payment_intent, session.customer, session.id]
      );

      // Add minutes to user's balance
      // First, try to update existing record
      const updateResult = await this.env.DATABASE_PROXY.executeQuery(
        `UPDATE user_credits
         SET available_credits = available_credits + $1,
             lifetime_credits_purchased = lifetime_credits_purchased + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2
         RETURNING id`,
        [minutes, userId]
      );

      // If no record existed, create one
      if (!updateResult.rows?.length) {
        const creditId = crypto.randomUUID();
        await this.env.DATABASE_PROXY.executeQuery(
          `INSERT INTO user_credits (id, user_id, available_credits, lifetime_credits_purchased)
           VALUES ($1, $2, $3, $3)`,
          [creditId, userId, minutes]
        );
      }

      // Record the credit transaction
      const transactionId = crypto.randomUUID();

      // Get the new balance for the transaction record
      const balanceResult = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT available_credits FROM user_credits WHERE user_id = $1`,
        [userId]
      );
      const newBalance = balanceResult.rows?.[0]?.available_credits || minutes;

      await this.env.DATABASE_PROXY.executeQuery(
        `INSERT INTO credit_transactions (id, user_id, transaction_type, credits_amount, balance_after, description, reference_id)
         VALUES ($1, $2, 'purchase', $3, $4, $5, $6)`,
        [transactionId, userId, minutes, newBalance, `Purchased ${minutes} minutes (${sku})`, session.id]
      );

      this.env.logger.info('Minutes added to user balance', {
        userId,
        minutes,
        newBalance,
        sessionId: session.id
      });

      return new Response(JSON.stringify({ received: true, processed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (error) {
      this.env.logger.error('Stripe webhook processing error', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: session.id,
        userId
      });

      // Return 500 for transient errors - Stripe will retry
      // This ensures the user gets their credits even if there's a temporary DB issue
      return new Response(JSON.stringify({
        error: 'Processing failed, will retry'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Get user's purchase history
   */
  private async handleGetPurchaseHistory(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      // Get userId from JWT auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const result = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT id, sku, minutes, amount_cents, currency, coupon_code, discount_cents, status, created_at, completed_at
         FROM purchases 
         WHERE user_id = $1 
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );

      const purchases = (result.rows || []).map((row: any) => ({
        id: row.id,
        sku: row.sku,
        minutes: parseInt(row.minutes),
        amount: (parseInt(row.amount_cents) || 0) / 100,
        currency: row.currency || 'usd',
        couponCode: row.coupon_code,
        discount: (parseInt(row.discount_cents) || 0) / 100,
        status: row.status,
        createdAt: row.created_at,
        completedAt: row.completed_at
      }));

      return new Response(JSON.stringify({
        success: true,
        purchases
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Get purchase history error', {
        error: error instanceof Error ? error.message : String(error)
      });

      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch purchase history'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Handle Cerebras models endpoint - proxy to Cerebras API to list available models
   */
  private async handleCerebrasModels(request: Request): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || 'https://call-me-back.vercel.app',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Fetch models from Cerebras API
      const response = await fetch('https://api.cerebras.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.env.CEREBRAS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        this.env.logger.error('Cerebras API error', { error });
        return new Response(JSON.stringify({ error: 'Failed to fetch models' }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (err) {
      this.env.logger.error('Error fetching Cerebras models', { error: String(err) });
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * Handle SmartMemory routes - for PersonaDesigner context persistence
   * Used by admin dashboard to save/load relationship context, user facts, call pretext, etc.
   */
  private async handleMemoryRoutes(request: Request, path: string): Promise<Response> {
    try {
      // CORS headers for admin dashboard
      const allowedOrigins = [
        'https://call-me-back.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
      ];
      const origin = request.headers.get('Origin') || '';
      const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

      const corsHeaders = {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin'
      };

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // Validate admin auth (reuse pattern from handleAdminRoutes)
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // GET /api/memory/semantic/:objectId - Get semantic memory document
      const getMatch = path.match(/^\/api\/memory\/semantic\/(.+)$/);
      if (request.method === 'GET' && getMatch && getMatch[1]) {
        const objectId = decodeURIComponent(getMatch[1]);
        this.env.logger.info('Getting semantic memory', { objectId });

        const result = await this.env.CONVERSATION_MEMORY.getSemanticMemory(objectId);

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // PUT /api/memory/semantic - Store semantic memory document
      if (request.method === 'PUT' && path === '/api/memory/semantic') {
        const body = await request.json() as { objectId: string; document: any };

        if (!body.objectId || !body.document) {
          return new Response(JSON.stringify({ error: 'objectId and document are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        this.env.logger.info('Storing semantic memory', { objectId: body.objectId });

        const result = await this.env.CONVERSATION_MEMORY.putSemanticMemory({
          objectId: body.objectId,
          document: body.document
        });

        return new Response(JSON.stringify({ success: true, result }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/memory/session/end - End a working memory session (flush to episodic)
      if (request.method === 'POST' && path === '/api/memory/session/end') {
        const body = await request.json() as { sessionId: string; flush?: boolean; systemPrompt?: string };

        if (!body.sessionId) {
          return new Response(JSON.stringify({ error: 'sessionId is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        this.env.logger.info('Ending memory session', { sessionId: body.sessionId, flush: body.flush });

        // Get the working memory session first, then end it
        const workingMemory = await this.env.CONVERSATION_MEMORY.getWorkingMemorySession(body.sessionId);
        await workingMemory.endSession(body.flush ?? false);

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // DELETE /api/memory/semantic/:objectId - Delete semantic memory
      const deleteMatch = path.match(/^\/api\/memory\/semantic\/(.+)$/);
      if (request.method === 'DELETE' && deleteMatch && deleteMatch[1]) {
        const objectId = decodeURIComponent(deleteMatch[1]);
        this.env.logger.info('Deleting semantic memory', { objectId });

        // SmartMemory doesn't have a direct delete, so we store an empty document
        await this.env.CONVERSATION_MEMORY.putSemanticMemory({
          objectId,
          document: { deleted: true, deletedAt: new Date().toISOString() }
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // ============================================
      // User Data KV Storage Endpoints
      // Stores: user facts, persona context, long-term memory
      // Key patterns:
      //   - long_term:{adminId}:{personaId} -> user facts (Layer 4)
      //   - admin_context:{personaId} -> persona context (Layers 2/3)
      // ============================================

      // GET /api/userdata/:key - Get user data by key
      const userDataGetMatch = path.match(/^\/api\/userdata\/(.+)$/);
      if (request.method === 'GET' && userDataGetMatch && userDataGetMatch[1]) {
        const key = decodeURIComponent(userDataGetMatch[1]);
        this.env.logger.info('UserData get', { key });

        const value = await this.env.USER_DATA.get(key, 'json');

        if (value === null) {
          return new Response(JSON.stringify({ success: false, error: 'Key not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify({ success: true, data: value }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // PUT /api/userdata - Store user data with key
      if (request.method === 'PUT' && path === '/api/userdata') {
        const body = await request.json() as { key: string; value: any };

        if (!body.key || body.value === undefined) {
          return new Response(JSON.stringify({ error: 'key and value are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        this.env.logger.info('UserData put', { key: body.key });

        await this.env.USER_DATA.put(body.key, JSON.stringify(body.value));

        return new Response(JSON.stringify({ success: true, key: body.key }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // DELETE /api/userdata/:key - Delete user data by key
      const userDataDeleteMatch = path.match(/^\/api\/userdata\/(.+)$/);
      if (request.method === 'DELETE' && userDataDeleteMatch && userDataDeleteMatch[1]) {
        const key = decodeURIComponent(userDataDeleteMatch[1]);
        this.env.logger.info('UserData delete', { key });

        await this.env.USER_DATA.delete(key);

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      this.env.logger.error('Memory route error', {
        error: error instanceof Error ? error.message : String(error),
        path
      });

      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Memory operation failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
