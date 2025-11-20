import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';

export default class extends Service<Env> {

  // Validate admin token
  private isAdmin(request: Request): boolean {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    return token === this.env.ADMIN_SECRET_TOKEN;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // All admin endpoints require authentication
    if (!this.isAdmin(request)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Proxy to log-query-service
    if (url.pathname.startsWith('/dashboard')) {
      return this.getDashboard(request);
    }

    if (url.pathname.startsWith('/logs')) {
      return this.getLogs(request);
    }

    if (url.pathname.startsWith('/users/top')) {
      return this.getTopUsers(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  private async getDashboard(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const period = url.searchParams.get('period') || '30d';

      const response = await fetch(
        `${this.env.LOG_QUERY_SERVICE_URL}/api/admin/dashboard?period=${period}`
      );

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async getLogs(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const params = new URLSearchParams(url.search);

      const response = await fetch(
        `${this.env.LOG_QUERY_SERVICE_URL}/api/admin/logs?${params.toString()}`
      );

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async getTopUsers(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const limit = url.searchParams.get('limit') || '10';
      const period = url.searchParams.get('period') || '30d';

      const response = await fetch(
        `${this.env.LOG_QUERY_SERVICE_URL}/api/admin/users/top?limit=${limit}&period=${period}`
      );

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching top users:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch top users',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
