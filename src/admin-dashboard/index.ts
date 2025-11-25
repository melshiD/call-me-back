import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';

/**
 * Admin Dashboard Service
 *
 * REFACTORED 2025-11-24: Changed from fetch() pattern to direct method calls
 * REASON: ServiceStub.fetch() has "Illegal invocation" binding issues in Cloudflare Workers
 * SOLUTION: Follow Raindrop pattern - expose public methods called directly from api-gateway
 * REFERENCE: documentation/domain/raindrop.md lines 274-298
 */
export default class extends Service<Env> {

  /**
   * Get dashboard data for admin UI
   * PUBLIC METHOD - Called directly from api-gateway via this.env.ADMIN_DASHBOARD.getDashboardData()
   */
  async getDashboardData(period: string = '30d'): Promise<any> {
    console.log('[ADMIN-DASHBOARD] getDashboardData() called, period:', period);

    try {
      const dbProxy = this.env.DATABASE_PROXY;

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          startDate = new Date(0);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Fetch aggregate stats from database
      let stats = { total_calls: 0, total_duration: 0, total_cost: 0 };

      try {
        const statsQuery = `
          SELECT
            COUNT(*) as total_calls,
            COALESCE(SUM(duration_seconds), 0) as total_duration,
            COALESCE(SUM(cost_usd), 0) as total_cost
          FROM calls
          WHERE created_at >= $1 AND status = 'completed'
        `;

        const statsResult = await dbProxy.executeQuery(statsQuery, [startDate.toISOString()]);
        stats = statsResult.rows?.[0] || stats;
      } catch (error) {
        console.error('Could not fetch call stats:', error instanceof Error ? error.message : String(error));
      }

      // Fetch cost breakdown by service
      const costByService: any = {
        twilio: 0,
        deepgram: 0,
        cerebras: 0,
        elevenlabs: 0,
        stripe: 0,
        raindrop: 0,
        vultr: 0,
        vercel: 0
      };

      try {
        const costByServiceQuery = `
          SELECT
            service,
            COALESCE(SUM(total_cost), 0) as total
          FROM api_call_events
          WHERE created_at >= $1
          GROUP BY service
        `;

        const costByServiceResult = await dbProxy.executeQuery(costByServiceQuery, [startDate.toISOString()]);

        costByServiceResult.rows?.forEach((row: any) => {
          if (row.service && costByService.hasOwnProperty(row.service)) {
            costByService[row.service] = parseFloat(row.total) || 0;
          }
        });
      } catch (error) {
        console.warn('Could not fetch cost breakdown:', error instanceof Error ? error.message : String(error));
      }

      // Fetch recent calls
      let recentCallsRows: any[] = [];

      try {
        const recentCallsQuery = `
          SELECT
            c.id,
            c.persona_id,
            c.duration_seconds,
            c.cost_usd,
            c.status,
            c.created_at,
            p.name as persona_name
          FROM calls c
          LEFT JOIN personas p ON c.persona_id = p.id
          WHERE c.created_at >= $1
          ORDER BY c.created_at DESC
          LIMIT 20
        `;

        const recentCallsResult = await dbProxy.executeQuery(recentCallsQuery, [startDate.toISOString()]);
        recentCallsRows = recentCallsResult.rows || [];
      } catch (error) {
        console.error('Could not fetch recent calls:', error instanceof Error ? error.message : String(error));
      }

      const totalCalls = parseInt(String(stats.total_calls)) || 0;
      const totalDuration = parseInt(String(stats.total_duration)) || 0;
      const totalCost = parseFloat(String(stats.total_cost)) || 0;

      return {
        stats: {
          totalCalls,
          totalDuration,
          totalCost,
          avgCostPerCall: totalCalls > 0 ? (totalCost / totalCalls) : 0,
          costByService
        },
        recentCalls: recentCallsRows
      };
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  }

  /**
   * Minimal fetch() method - REQUIRED by Raindrop Service base class
   * Not used for service-to-service calls (use getDashboardData instead)
   * But must exist for the service to be a valid Worker
   */
  async fetch(request: Request): Promise<Response> {
    return new Response(JSON.stringify({
      error: 'Direct HTTP access not supported. This service should be called via api-gateway.'
    }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /* ============================================================================
   * OLD FETCH-BASED APPROACH - COMMENTED OUT 2025-11-24
   *
   * REASON: ServiceStub.fetch() causes "Illegal invocation" errors in Cloudflare Workers
   * The .fetch() method loses its `this` binding when called across service boundaries.
   *
   * REPLACED WITH: Direct public method calls (getDashboardData above)
   *
   * KEEPING FOR REFERENCE: In case we need to restore fetch() pattern or understand
   * the original implementation approach.
   * ============================================================================ */

  /*
  // Validate admin token
  // BINDING FIX: Store env reference to avoid "this" binding issues with ServiceStub
  private isAdmin(request: Request): boolean {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return false;

    const env = this.env; // Store reference before comparison
    const token = authHeader.replace('Bearer ', '');
    return token === env.ADMIN_SECRET_TOKEN;
  }

  async fetch(request: Request): Promise<Response> {
    console.log('[ADMIN-DASHBOARD] fetch() called, pathname:', new URL(request.url).pathname);

    const url = new URL(request.url);

    // Test endpoint - no auth, no database, just basic ServiceStub test
    if (url.pathname === '/test') {
      return new Response(JSON.stringify({
        status: 'ok',
        test: true,
        message: 'Admin dashboard is accessible via ServiceStub'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // All admin endpoints require authentication
    console.log('[ADMIN-DASHBOARD] About to check admin auth');
    if (!this.isAdmin(request)) {
      console.log('[ADMIN-DASHBOARD] Auth failed');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log('[ADMIN-DASHBOARD] Auth passed');

    // Proxy to log-query-service
    if (url.pathname.startsWith('/dashboard')) {
      console.log('[ADMIN-DASHBOARD] Calling getDashboard()');
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
    console.log('[ADMIN-DASHBOARD] getDashboard() entered');
    try {
      const url = new URL(request.url);
      const period = url.searchParams.get('period') || '30d';
      console.log('[ADMIN-DASHBOARD] Period:', period);

      // Store proxy reference to avoid "this" binding issues
      console.log('[ADMIN-DASHBOARD] About to access this.env.DATABASE_PROXY');
      const dbProxy = this.env.DATABASE_PROXY;
      console.log('[ADMIN-DASHBOARD] DATABASE_PROXY reference obtained');

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Fetch aggregate stats from database
      let stats = { total_calls: 0, total_duration: 0, total_cost: 0 };

      try {
        const statsQuery = `
          SELECT
            COUNT(*) as total_calls,
            COALESCE(SUM(duration_seconds), 0) as total_duration,
            COALESCE(SUM(cost_usd), 0) as total_cost
          FROM calls
          WHERE created_at >= $1 AND status = 'completed'
        `;

        const statsResult = await dbProxy.executeQuery(statsQuery, [startDate.toISOString()]);
        stats = statsResult.rows?.[0] || stats;
      } catch (error) {
        console.error('Could not fetch call stats:', error instanceof Error ? error.message : String(error));
        // Continue with default values
      }

      // Fetch cost breakdown by service (with fallback if table doesn't exist)
      const costByService: any = {
        twilio: 0,
        deepgram: 0,
        cerebras: 0,
        elevenlabs: 0,
        stripe: 0,
        raindrop: 0,
        vultr: 0,
        vercel: 0
      };

      try {
        const costByServiceQuery = `
          SELECT
            service,
            COALESCE(SUM(total_cost), 0) as total
          FROM api_call_events
          WHERE created_at >= $1
          GROUP BY service
        `;

        const costByServiceResult = await dbProxy.executeQuery(costByServiceQuery, [startDate.toISOString()]);

        costByServiceResult.rows?.forEach((row: any) => {
          if (row.service && costByService.hasOwnProperty(row.service)) {
            costByService[row.service] = parseFloat(row.total) || 0;
          }
        });
      } catch (error) {
        // Table might not exist yet - that's okay, we'll show zeros
        console.warn('Could not fetch cost breakdown (table might not exist yet):', error instanceof Error ? error.message : String(error));
      }

      // Fetch recent calls
      let recentCallsRows: any[] = [];

      try {
        const recentCallsQuery = `
          SELECT
            c.id,
            c.persona_id,
            c.duration_seconds,
            c.cost_usd,
            c.status,
            c.created_at,
            p.name as persona_name
          FROM calls c
          LEFT JOIN personas p ON c.persona_id = p.id
          WHERE c.created_at >= $1
          ORDER BY c.created_at DESC
          LIMIT 20
        `;

        const recentCallsResult = await dbProxy.executeQuery(recentCallsQuery, [startDate.toISOString()]);
        recentCallsRows = recentCallsResult.rows || [];
      } catch (error) {
        console.error('Could not fetch recent calls:', error instanceof Error ? error.message : String(error));
        // Continue with empty array
      }

      const totalCalls = parseInt(String(stats.total_calls)) || 0;
      const totalDuration = parseInt(String(stats.total_duration)) || 0;
      const totalCost = parseFloat(String(stats.total_cost)) || 0;

      const data = {
        stats: {
          totalCalls,
          totalDuration,
          totalCost,
          avgCostPerCall: totalCalls > 0 ? (totalCost / totalCalls) : 0,
          costByService
        },
        recentCalls: recentCallsRows
      };

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
  */
}
