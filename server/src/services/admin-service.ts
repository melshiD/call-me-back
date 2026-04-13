// server/src/services/admin-service.ts
import { query } from '../db.js';

export async function getDashboardData(period: string = '30d') {
  const periodMap: Record<string, string> = {
    '7d': "NOW() - INTERVAL '7 days'",
    '30d': "NOW() - INTERVAL '30 days'",
    '90d': "NOW() - INTERVAL '90 days'",
    'all': "'1970-01-01'",
  };
  const since = periodMap[period] || periodMap['30d'];

  const [callStats, costsByService, revenue, userCredits, recentCalls] = await Promise.all([
    query(`SELECT COUNT(*) as total_calls, COALESCE(SUM(duration_seconds), 0) as total_duration,
           COALESCE(SUM(cost_usd), 0) as total_cost
           FROM calls WHERE created_at >= ${since} AND status = 'completed'`),
    query(`SELECT service, COALESCE(SUM(total_cost), 0) as total
           FROM api_call_events WHERE created_at >= ${since}
           GROUP BY service`),
    query(`SELECT COALESCE(SUM(amount_cents), 0) as total_cents, COUNT(*) as purchase_count
           FROM purchases WHERE created_at >= ${since} AND status = 'completed'`),
    query(`SELECT COALESCE(SUM(minutes_balance), 0) as total_balance, COUNT(*) as user_count
           FROM user_credits`),
    query(`SELECT c.id, c.user_id, c.persona_id, c.duration_seconds, c.cost_usd, c.status, c.direction, c.created_at,
                  p.name as persona_name, u.name as user_name, u.email as user_email
           FROM calls c
           LEFT JOIN personas p ON c.persona_id = p.id
           LEFT JOIN users u ON c.user_id = u.id
           WHERE c.created_at >= ${since}
           ORDER BY c.created_at DESC LIMIT 20`),
  ]);

  const stats = callStats.rows[0] || { total_calls: 0, total_duration: 0, total_cost: 0 };
  const rev = revenue.rows[0] || { total_cents: 0, purchase_count: 0 };
  const credits = userCredits.rows[0] || { total_balance: 0, user_count: 0 };
  const apiCostTotal = costsByService.rows.reduce((sum: number, r: any) => sum + parseFloat(r.total || 0), 0);

  return {
    stats: {
      totalCalls: parseInt(stats.total_calls),
      totalDuration: parseInt(stats.total_duration),
      totalCost: parseFloat(stats.total_cost),
      avgCostPerCall: parseInt(stats.total_calls) > 0 ? parseFloat(stats.total_cost) / parseInt(stats.total_calls) : 0,
      costByService: Object.fromEntries(costsByService.rows.map((r: any) => [r.service, parseFloat(r.total)])),
    },
    revenue: { total: parseInt(rev.total_cents) / 100, period, purchaseCount: parseInt(rev.purchase_count) },
    userCredits: { totalBalance: parseInt(credits.total_balance), userCount: parseInt(credits.user_count) },
    apiCosts: { total: apiCostTotal, period },
    profitability: {
      revenue: parseInt(rev.total_cents) / 100,
      apiCosts: apiCostTotal,
      grossProfit: (parseInt(rev.total_cents) / 100) - apiCostTotal,
      grossMargin: parseInt(rev.total_cents) > 0 ? ((parseInt(rev.total_cents) / 100 - apiCostTotal) / (parseInt(rev.total_cents) / 100)) * 100 : 0,
    },
    recentCalls: recentCalls.rows,
  };
}
