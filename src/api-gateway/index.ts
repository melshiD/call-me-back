import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import { ScenarioTemplateManager } from '../shared/scenario-templates';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
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
