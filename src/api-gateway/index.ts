import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import { ScenarioTemplateManager } from '../shared/scenario-templates';

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
    // POST /api/voice/answer - Return TwiML for incoming calls
    if (request.method === 'POST' && path === '/api/voice/answer') {
      return await this.handleVoiceAnswer(request);
    }

    // WebSocket /api/voice/stream - Handle Twilio Media Streams
    if (path === '/api/voice/stream') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      return await this.handleVoiceStream(request, url);
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle incoming call - Return TwiML with Media Streams
   */
  private async handleVoiceAnswer(request: Request): Promise<Response> {
    try {
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

      // Build WebSocket URL for Media Streams
      const baseUrl = new URL(request.url).origin;
      const streamUrl = `${baseUrl.replace('http', 'ws')}/api/voice/stream?callId=${callSid}&userId=${userId}&personaId=${personaId}`;

      // Generate TwiML response with Media Streams
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting you now.</Say>
    <Connect>
        <Stream url="${streamUrl}" />
    </Connect>
</Response>`;

      return new Response(twiml, {
        headers: {
          'Content-Type': 'text/xml'
        }
      });
    } catch (error) {
      this.env.logger.error('Voice answer error', {
        error: error instanceof Error ? error.message : String(error)
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
      // Extract parameters from query string
      const callId = url.searchParams.get('callId');
      const userId = url.searchParams.get('userId');
      const personaId = url.searchParams.get('personaId');

      if (!callId || !userId || !personaId) {
        return new Response('Missing required parameters', { status: 400 });
      }

      this.env.logger.info('WebSocket connection request', { callId, userId, personaId });

      // Upgrade to WebSocket (Cloudflare Workers API)
      const pair = new (WebSocket as any).WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      // Start the voice pipeline in the background
      this.startVoicePipeline(server as WebSocket, callId, userId, personaId);

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
   */
  private async startVoicePipeline(
    ws: WebSocket,
    callId: string,
    userId: string,
    personaId: string
  ): Promise<void> {
    try {
      // Call the voice-pipeline service
      const result = await this.env.VOICE_PIPELINE.handleConnection(
        ws,
        callId,
        userId,
        personaId
      );

      this.env.logger.info('Voice pipeline started', { callId, status: result.status });
    } catch (error) {
      this.env.logger.error('Failed to start voice pipeline', {
        callId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Close WebSocket on error
      ws.close(1011, 'Internal error');
    }
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
