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

      // Extract userId and personaId from query params or default
      // For now, use a default persona - later we'll do phone number lookup
      const userId = 'demo_user'; // TODO: Lookup user by phone number
      const personaId = 'brad_001'; // TODO: Get from user preferences or call context
      const callPretext = ''; // TODO: Get from call trigger request (e.g., "Save me from a bad date")

      // Build WebSocket URL for Media Streams (without query parameters)
      // Twilio Stream URLs do NOT support query parameters - use <Parameter> elements instead
      // CRITICAL: Voice pipeline now runs on Vultr (voice.ai-tools-marketplace.io) not on Workers
      // Workers cannot make outbound WebSocket connections, so we moved voice pipeline to Node.js on Vultr
      // DNS: voice.ai-tools-marketplace.io must point to 144.202.15.249 (A record)
      const streamUrl = `wss://voice.ai-tools-marketplace.io/stream`;

      this.env.logger.info('Generated stream URL (Vultr voice pipeline)', { streamUrl, callSid, userId, personaId, callPretext });

      // Generate TwiML response with Media Streams
      // Use <Parameter> elements to pass custom data (sent in WebSocket "start" message)
      // Voice pipeline will fetch full persona metadata from database using these IDs
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting you now.</Say>
    <Connect>
        <Stream url="${streamUrl}">
            <Parameter name="callId" value="${callSid}" />
            <Parameter name="userId" value="${userId}" />
            <Parameter name="personaId" value="${personaId}" />
            <Parameter name="callPretext" value="${callPretext}" />
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
    try {
      // Get user ID from auth token
      const userId = await this.getUserIdFromAuth(request);
      if (!userId) {
        return new Response('Unauthorized', { status: 401 });
      }

      // GET /api/contacts - Get user's contacts
      if (request.method === 'GET' && path === '/api/contacts') {
        this.env.logger.info('Fetching contacts for user', { userId });
        const contacts = await this.env.PERSONA_MANAGER.getContacts(userId!);
        return new Response(JSON.stringify(contacts), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // POST /api/contacts - Add a contact
      if (request.method === 'POST' && path === '/api/contacts') {
        const body = await request.json() as { personaId: string };
        if (!body.personaId) {
          return new Response(JSON.stringify({ error: 'personaId is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        this.env.logger.info('Adding contact', { userId, personaId: body.personaId });
        const contact = await this.env.PERSONA_MANAGER.addContact({
          userId: userId!,
          personaId: body.personaId
        });
        return new Response(JSON.stringify(contact), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // DELETE /api/contacts/:personaId - Remove a contact
      const deleteMatch = path.match(/^\/api\/contacts\/(.+)$/);
      if (request.method === 'DELETE' && deleteMatch && deleteMatch[1]) {
        const personaId = deleteMatch[1];
        this.env.logger.info('Removing contact', { userId, personaId });
        await this.env.PERSONA_MANAGER.removeContact({ userId: userId!, personaId });
        return new Response(JSON.stringify({ message: 'Contact removed' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      this.env.logger.error('Contact route error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
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
    // POST /api/calls/trigger - Initiate an outbound call
    if (request.method === 'POST' && path === '/api/calls/trigger') {
      return await this.handleCallTrigger(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle call trigger - initiate outbound call via Twilio
   */
  private async handleCallTrigger(request: Request): Promise<Response> {
    try {
      const body = await request.json() as {
        phoneNumber: string;
        personaId?: string;
        userId?: string;
        paymentIntentId?: string; // For one-time Stripe payments
        useCredits?: boolean; // To use account credits instead
      };

      if (!body.phoneNumber) {
        return new Response(JSON.stringify({ error: 'Phone number is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // For now, use demo user - TODO: implement proper auth
      const userId = body.userId || 'demo_user';
      const personaId = body.personaId || 'brad_001';

      // Determine payment method
      let paymentMethod = 'demo'; // Default for testing
      let paymentIntentId: string | undefined = undefined;
      let paymentStatus = 'pending';

      if (body.paymentIntentId) {
        // Using Stripe payment
        paymentMethod = 'stripe';
        paymentIntentId = body.paymentIntentId;
        // TODO: Verify payment intent with Stripe
        // For now, assume it's valid
        paymentStatus = 'paid';
      } else if (body.useCredits) {
        // Using account credits
        paymentMethod = 'credit';
        // TODO: Check user credits balance
        // For now, assume they have credits
        paymentStatus = 'credit_used';
      } else if (userId === 'demo_user') {
        // Demo mode - free calls for testing
        paymentMethod = 'demo';
        paymentStatus = 'paid';
      } else {
        // No payment method provided
        return new Response(JSON.stringify({ 
          error: 'Payment method required. Please provide paymentIntentId or set useCredits to true' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      this.env.logger.info('Triggering call', { 
        phoneNumber: body.phoneNumber, 
        userId, 
        personaId,
        paymentMethod,
        paymentStatus
      });

      // Call the call-orchestrator service to initiate the call
      const result = await this.env.CALL_ORCHESTRATOR.initiateCall({
        userId,
        personaId,
        phoneNumber: body.phoneNumber,
        paymentMethod,
        paymentIntentId,
        paymentStatus
      });

      return new Response(JSON.stringify({
        success: true,
        callId: result.id,
        status: result.status,
        paymentMethod,
        message: 'Call initiated successfully. You should receive a call shortly.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
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
        headers: { 'Content-Type': 'application/json' }
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
}
