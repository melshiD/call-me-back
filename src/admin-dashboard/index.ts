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

        // Estimate Twilio costs from call duration if not logged in api_call_events
        // Historical calls before 2025-12-03 didn't log Twilio costs
        const TWILIO_PER_MINUTE_RATE = 0.014;
        const totalDurationSeconds = parseFloat(String(stats.total_duration)) || 0;
        if (costByService.twilio === 0 && totalDurationSeconds > 0) {
          const totalMinutes = totalDurationSeconds / 60;
          costByService.twilio = totalMinutes * TWILIO_PER_MINUTE_RATE;
          console.log(`[ADMIN-DASHBOARD] Estimated Twilio cost from call duration: ${totalMinutes.toFixed(2)} min × $${TWILIO_PER_MINUTE_RATE} = $${costByService.twilio.toFixed(4)}`);
        }
      } catch (error) {
        console.warn('Could not fetch cost breakdown:', error instanceof Error ? error.message : String(error));
      }

      // Fetch recent calls
      let recentCallsRows: any[] = [];

      try {
        const recentCallsQuery = `
          SELECT
            c.id,
            c.user_id,
            c.persona_id,
            c.duration_seconds,
            c.cost_usd,
            c.status,
            c.direction,
            c.created_at,
            p.name as persona_name,
            u.name as user_name,
            u.email as user_email
          FROM calls c
          LEFT JOIN personas p ON c.persona_id = p.id
          LEFT JOIN users u ON c.user_id = u.id
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

      // Fetch service pricing from database
      let servicePricing: any[] = [];
      try {
        const pricingQuery = `
          SELECT service, pricing_type, unit_price, metadata
          FROM service_pricing
          WHERE effective_to IS NULL
          ORDER BY service
        `;
        const pricingResult = await dbProxy.executeQuery(pricingQuery, []);
        servicePricing = pricingResult.rows || [];
      } catch (error) {
        console.warn('Could not fetch service pricing:', error instanceof Error ? error.message : String(error));
      }

      // Fetch revenue data from purchases table
      let revenue = { total: 0, period: 0, purchaseCount: 0 };
      try {
        const revenueQuery = `
          SELECT
            COALESCE(SUM(CASE WHEN status = 'completed' THEN amount_cents END), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= $1 THEN amount_cents END), 0) as period_revenue,
            COUNT(CASE WHEN status = 'completed' AND created_at >= $1 THEN 1 END) as period_purchases
          FROM purchases
        `;
        const revenueResult = await dbProxy.executeQuery(revenueQuery, [startDate.toISOString()]);
        if (revenueResult.rows?.[0]) {
          revenue = {
            total: parseFloat(revenueResult.rows[0].total_revenue || 0) / 100, // Convert cents to dollars
            period: parseFloat(revenueResult.rows[0].period_revenue || 0) / 100,
            purchaseCount: parseInt(revenueResult.rows[0].period_purchases || 0)
          };
        }
      } catch (error) {
        console.warn('Could not fetch revenue:', error instanceof Error ? error.message : String(error));
      }

      // Fetch user credits summary
      let userCredits = { totalBalance: 0, userCount: 0 };
      try {
        const creditsQuery = `
          SELECT
            COALESCE(SUM(minutes_balance), 0) as total_balance,
            COUNT(*) as user_count
          FROM user_credits
          WHERE minutes_balance > 0
        `;
        const creditsResult = await dbProxy.executeQuery(creditsQuery, []);
        if (creditsResult.rows?.[0]) {
          userCredits = {
            totalBalance: parseFloat(creditsResult.rows[0].total_balance || 0),
            userCount: parseInt(creditsResult.rows[0].user_count || 0)
          };
        }
      } catch (error) {
        console.warn('Could not fetch user credits:', error instanceof Error ? error.message : String(error));
      }

      // Calculate API costs from api_call_events
      let apiCosts = { total: 0, period: 0 };
      try {
        const apiCostsQuery = `
          SELECT
            COALESCE(SUM(total_cost), 0) as total_cost,
            COALESCE(SUM(CASE WHEN created_at >= $1 THEN total_cost END), 0) as period_cost
          FROM api_call_events
        `;
        const apiCostsResult = await dbProxy.executeQuery(apiCostsQuery, [startDate.toISOString()]);
        if (apiCostsResult.rows?.[0]) {
          apiCosts = {
            total: parseFloat(apiCostsResult.rows[0].total_cost || 0),
            period: parseFloat(apiCostsResult.rows[0].period_cost || 0)
          };
        }
      } catch (error) {
        console.warn('Could not fetch API costs:', error instanceof Error ? error.message : String(error));
      }

      // Calculate profitability metrics
      // Estimated cost per minute (from service_pricing and documented rates)
      const estimatedCostPerMinute8B = 0.071; // $0.071/min for 8B model
      const estimatedCostPerMinute70B = 0.101; // $0.101/min for 70B model
      const avgCostPerMinute = (estimatedCostPerMinute8B + estimatedCostPerMinute70B) / 2; // ~$0.086

      const profitability = {
        revenue: revenue.period,
        apiCosts: apiCosts.period,
        grossProfit: revenue.period - apiCosts.period,
        grossMargin: revenue.period > 0 ? ((revenue.period - apiCosts.period) / revenue.period) * 100 : 0,
        outstandingLiability: userCredits.totalBalance * avgCostPerMinute, // What it would cost to fulfill all credits
        projectedNetProfit: revenue.period - (userCredits.totalBalance * avgCostPerMinute),
        avgCostPerMinute: avgCostPerMinute
      };

      return {
        stats: {
          totalCalls,
          totalDuration,
          totalCost,
          avgCostPerCall: totalCalls > 0 ? (totalCost / totalCalls) : 0,
          costByService
        },
        revenue,
        userCredits,
        apiCosts,
        profitability,
        servicePricing,
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
            c.user_id,
            c.persona_id,
            c.duration_seconds,
            c.cost_usd,
            c.status,
            c.direction,
            c.created_at,
            p.name as persona_name,
            u.name as user_name,
            u.email as user_email
          FROM calls c
          LEFT JOIN personas p ON c.persona_id = p.id
          LEFT JOIN users u ON c.user_id = u.id
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
