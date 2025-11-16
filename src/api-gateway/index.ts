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

      // Build WebSocket URL for Media Streams (without query parameters)
      // Twilio Stream URLs do NOT support query parameters - use <Parameter> elements instead
      const baseUrl = new URL(request.url).origin;
      const streamUrl = `${baseUrl.replace('http', 'ws')}/api/voice/stream`;

      this.env.logger.info('Generated stream URL', { streamUrl, baseUrl, callSid, userId, personaId });

      // Generate TwiML response with Media Streams
      // Use <Parameter> elements to pass custom data (sent in WebSocket "start" message)
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting you now.</Say>
    <Connect>
        <Stream url="${streamUrl}">
            <Parameter name="callId" value="${callSid}" />
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

      // Accept the WebSocket connection (required for Cloudflare Workers)
      (server as any).accept();

      // Start the voice pipeline in the background
      // Parameters will be extracted from Twilio's "start" message
      this.startVoicePipeline(server as WebSocket);

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
   * Start the voice pipeline (runs in background)
   * Parameters (callId, userId, personaId) will be extracted from Twilio's "start" message
   * NOTE: We instantiate VoicePipelineOrchestrator HERE instead of calling the service
   * because WebSocket objects cannot be serialized across service boundaries in Cloudflare Workers
   */
  private async startVoicePipeline(ws: WebSocket): Promise<void> {
    try {
      this.env.logger.info('WebSocket connection established, waiting for start message');

      // Wait for the "start" message from Twilio to get parameters
      const startMessage = await this.waitForStartMessage(ws);

      this.env.logger.info('Start message received', { startMessage });

      const callId = startMessage.customParameters.callId;
      const userId = startMessage.customParameters.userId;
      const personaId = startMessage.customParameters.personaId;

      this.env.logger.info('Extracted parameters from start message', { callId, userId, personaId });

      // TODO: Cost tracker needs to be refactored to use DATABASE_PROXY instead of SmartSQL
      // For now, skip cost tracking to get the voice pipeline working
      // const costTracker = new CallCostTracker(callId, userId, this.env.CALL_ME_BACK_DB);
      // await costTracker.initialize();
      const costTracker = null as any; // Temporarily disabled

      // Load persona from database
      const persona = await this.loadPersona(personaId);
      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }

      // Load or create user-persona relationship
      const relationship = await this.loadOrCreateRelationship(userId, personaId);

      // Extract voice configuration from relationship
      const voiceId = relationship.voice_id || persona.default_voice_id || 'JBFqnCBsd6RMkjVDRZzb';
      const voiceSettings = relationship.voice_settings || {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
        speed: 1.0
      };

      // Create pipeline configuration
      const config: VoicePipelineConfig = {
        elevenLabsApiKey: this.env.ELEVENLABS_API_KEY || '',
        cerebrasApiKey: this.env.CEREBRAS_API_KEY || '',
        voiceId,
        voiceSettings,
        callId,
        userId,
        personaId
      };

      // Create and start pipeline with SmartMemory
      const pipeline = new VoicePipelineOrchestrator(
        config,
        costTracker,
        this.env.CONVERSATION_MEMORY,  // SmartMemory binding
        persona,
        relationship
      );
      await pipeline.start(ws);

      this.env.logger.info('Voice pipeline started', { callId, personaId });
    } catch (error) {
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
   * Wait for and parse the "start" message from Twilio Media Streams
   */
  private async waitForStartMessage(ws: WebSocket): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for start message'));
      }, 10000); // 10 second timeout

      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data as string);

          if (message.event === 'start') {
            clearTimeout(timeout);
            this.env.logger.info('Received start message', {
              callSid: message.start.callSid,
              customParameters: message.start.customParameters
            });
            resolve(message.start);
          }
        } catch (error) {
          this.env.logger.error('Error parsing WebSocket message', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });

      ws.addEventListener('error', (event) => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error before start message'));
      });

      ws.addEventListener('close', (event) => {
        clearTimeout(timeout);
        reject(new Error('WebSocket closed before start message'));
      });
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
