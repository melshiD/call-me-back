import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import { ScenarioTemplateManager } from '../shared/scenario-templates';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Twilio voice routes
      if (path.startsWith('/api/voice')) {
        return await this.handleVoiceRoutes(request, path, url);
      }

      // Scenario template routes
      if (path.startsWith('/api/scenario-templates')) {
        return await this.handleScenarioTemplates(request, path);
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

      // Upgrade to WebSocket
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      // Accept the WebSocket connection
      server.accept();

      // Start the voice pipeline in the background
      this.startVoicePipeline(server, callId, userId, personaId);

      return new Response(null, {
        status: 101,
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

  private async getUserIdFromAuth(request: Request): Promise<string | null> {
    // TODO: Extract user ID from JWT token in Authorization header
    // For now, return null to indicate auth is not implemented
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    // Placeholder - implement JWT verification
    return null;
  }
}
