import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type {
  GetCallCostRequest,
  GetCallCostResponse,
  GetUserSpendingRequest,
  GetUserSpendingResponse,
  GetUserBudgetRequest,
  GetUserBudgetResponse,
  CompleteCostBreakdown,
  UserSpendingSummary,
  UserBudget
} from './interfaces';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // GET /api/costs/call/:callId - Get cost breakdown for specific call
      if (path.match(/^\/api\/costs\/call\/[^/]+$/) && request.method === 'GET') {
        return await this.handleGetCallCost(request, path);
      }

      // GET /api/costs/user/:userId/spending - Get user spending summary
      if (path.match(/^\/api\/costs\/user\/[^/]+\/spending$/) && request.method === 'GET') {
        return await this.handleGetUserSpending(request, path, url);
      }

      // GET /api/costs/user/:userId/budget - Get user budget status
      if (path.match(/^\/api\/costs\/user\/[^/]+\/budget$/) && request.method === 'GET') {
        return await this.handleGetUserBudget(request, path);
      }

      // Health check
      if (path === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'healthy',
          service: 'cost-analytics',
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      this.env.logger.error('Cost analytics error', { error: String(error) });
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // -------------------------------------------------------------------------
  // Route Handlers
  // -------------------------------------------------------------------------

  private async handleGetCallCost(request: Request, path: string): Promise<Response> {
    const callId = path.split('/').pop()!;

    // Verify user authorization
    const userId = await this.getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user owns this call
    const callOwner = await this.verifyCallOwnership(callId, userId);
    if (!callOwner) {
      return new Response(JSON.stringify({ error: 'Forbidden - call not found or not owned by user' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch cost data from log-query-service
    const costData = await this.fetchCallCostFromLogService(callId);

    const response: GetCallCostResponse = {
      success: true,
      data: costData
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetUserSpending(request: Request, path: string, url: URL): Promise<Response> {
    const userId = path.split('/')[4]; // /api/costs/user/:userId/spending

    // Verify user authorization
    const requestUserId = await this.getUserIdFromRequest(request);
    if (!requestUserId || requestUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse period parameter
    const period = url.searchParams.get('period') || '30d';

    // Calculate spending summary
    const summary = await this.calculateUserSpending(userId, period);

    const response: GetUserSpendingResponse = {
      success: true,
      data: summary
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetUserBudget(request: Request, path: string): Promise<Response> {
    const userId = path.split('/')[4]; // /api/costs/user/:userId/budget

    // Verify user authorization
    const requestUserId = await this.getUserIdFromRequest(request);
    if (!requestUserId || requestUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const budget = await this.getUserBudgetStatus(userId);

    const response: GetUserBudgetResponse = {
      success: true,
      data: budget
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // -------------------------------------------------------------------------
  // Helper Methods
  // -------------------------------------------------------------------------

  private async getUserIdFromRequest(request: Request): Promise<string | null> {
    // Extract JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // Validate JWT and extract userId
    // TODO: Call auth-manager service to validate token
    // For now, we'll decode the JWT manually (TEMPORARY - use auth-manager in production)
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1]));
      return payload.userId || null;
    } catch (error) {
      this.env.logger.error('Failed to parse JWT', { error: String(error) });
      return null;
    }
  }

  private async verifyCallOwnership(callId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.env.DATABASE_PROXY.executeQuery(
        'SELECT user_id FROM calls WHERE id = $1',
        [callId]
      );

      if (!result.rows || result.rows.length === 0) {
        return false;
      }

      return result.rows[0].user_id === userId;
    } catch (error) {
      this.env.logger.error('Failed to verify call ownership', { error: String(error), callId, userId });
      return false;
    }
  }

  private async fetchCallCostFromLogService(callId: string): Promise<CompleteCostBreakdown> {
    // Call log-query-service on Vultr (server-to-server, internal network)
    const logServiceUrl = this.env.LOG_QUERY_SERVICE_URL || 'http://144.202.15.249:3001';

    const response = await fetch(`${logServiceUrl}/api/usage/call/${callId}`);

    if (!response.ok) {
      throw new Error(`Log service returned ${response.status}`);
    }

    const data = await response.json();

    // Transform log service response to our interface format
    // TODO: Map the response properly once log-query-service response format is finalized
    return data as CompleteCostBreakdown;
  }

  private async calculateUserSpending(userId: string, period: string): Promise<UserSpendingSummary> {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let label: string;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        label = 'Last 7 days';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        label = 'Last 30 days';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        label = 'Last 90 days';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        label = 'Last 30 days';
    }

    // Fetch user's calls in period
    const callsResult = await this.env.DATABASE_PROXY.executeQuery(
      `SELECT id, persona_id, duration_seconds, cost_usd, created_at
       FROM calls
       WHERE user_id = $1 AND created_at >= $2 AND status = 'completed'
       ORDER BY created_at DESC`,
      [userId, startDate.toISOString()]
    );

    const calls = callsResult.rows || [];

    // Calculate aggregates
    const totalCalls = calls.length;
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0);
    const totalCost = calls.reduce((sum, call) => sum + (parseFloat(call.cost_usd) || 0), 0);

    // Assume $4.99 per call (TODO: get actual charge from payment records)
    const totalCharged = totalCalls * 4.99;
    const totalNetRevenue = totalCharged - (totalCharged * 0.029 + 0.30 * totalCalls); // Stripe fees
    const totalGrossProfit = totalNetRevenue - totalCost;

    // Top personas
    const personaCounts: Record<string, { calls: number; cost: number }> = {};
    calls.forEach(call => {
      const pid = call.persona_id;
      if (!personaCounts[pid]) {
        personaCounts[pid] = { calls: 0, cost: 0 };
      }
      personaCounts[pid].calls++;
      personaCounts[pid].cost += parseFloat(call.cost_usd) || 0;
    });

    const topPersonas = Object.entries(personaCounts)
      .map(([personaId, stats]) => ({
        personaId,
        calls: stats.calls,
        totalCost: stats.cost
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5);

    const summary: UserSpendingSummary = {
      userId,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        label
      },
      totalCalls,
      totalDuration_seconds: totalDuration,
      averageDuration_seconds: totalCalls > 0 ? totalDuration / totalCalls : 0,
      totalApiCost: totalCost * 0.90, // Estimate: 90% API, 10% infra
      totalInfrastructureCost: totalCost * 0.10,
      totalTransactionCost: totalCharged * 0.029 + 0.30 * totalCalls,
      totalCost,
      averageCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
      totalCharged,
      totalNetRevenue,
      totalGrossProfit,
      averageMarginPercent: totalCharged > 0 ? ((totalGrossProfit / totalCharged) * 100).toFixed(2) + '%' : '0%',
      costByService: {
        twilio: totalCost * 0.16,
        deepgram: totalCost * 0.07,
        cerebras: totalCost * 0.01,
        elevenlabs: totalCost * 0.70,
        raindrop: totalCost * 0.04,
        vultr: totalCost * 0.01,
        vercel: totalCost * 0.005,
        stripe: totalCharged * 0.029 + 0.30 * totalCalls
      },
      topPersonas
    };

    return summary;
  }

  private async getUserBudgetStatus(userId: string): Promise<UserBudget> {
    // Fetch user's budget settings
    const budgetResult = await this.env.DATABASE_PROXY.executeQuery(
      `SELECT daily_limit_usd, monthly_limit_usd, alert_threshold_pct
       FROM user_budget_settings
       WHERE user_id = $1`,
      [userId]
    );

    const budgetSettings = budgetResult.rows?.[0];

    // Calculate current spending (today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailySpendResult = await this.env.DATABASE_PROXY.executeQuery(
      `SELECT COALESCE(SUM(cost_usd), 0) as total
       FROM calls
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, todayStart.toISOString()]
    );

    const currentDailySpend = parseFloat(dailySpendResult.rows?.[0]?.total || '0');

    // Calculate current spending (this month)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlySpendResult = await this.env.DATABASE_PROXY.executeQuery(
      `SELECT COALESCE(SUM(cost_usd), 0) as total
       FROM calls
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, monthStart.toISOString()]
    );

    const currentMonthlySpend = parseFloat(monthlySpendResult.rows?.[0]?.total || '0');

    const dailyLimit = budgetSettings?.daily_limit_usd ? parseFloat(budgetSettings.daily_limit_usd) : null;
    const monthlyLimit = budgetSettings?.monthly_limit_usd ? parseFloat(budgetSettings.monthly_limit_usd) : null;
    const alertThreshold = budgetSettings?.alert_threshold_pct || 80;

    const dailyRemaining = dailyLimit ? dailyLimit - currentDailySpend : null;
    const monthlyRemaining = monthlyLimit ? monthlyLimit - currentMonthlySpend : null;

    const alertTriggered =
      (dailyLimit && currentDailySpend >= dailyLimit * (alertThreshold / 100)) ||
      (monthlyLimit && currentMonthlySpend >= monthlyLimit * (alertThreshold / 100)) ||
      false;

    const budget: UserBudget = {
      userId,
      dailyLimit_usd: dailyLimit,
      monthlyLimit_usd: monthlyLimit,
      alertThreshold_percent: alertThreshold,
      currentDailySpend,
      currentMonthlySpend,
      dailyRemaining,
      monthlyRemaining,
      alertTriggered
    };

    return budget;
  }
}
