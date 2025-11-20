const express = require('express');
const router = express.Router();
const Database = require('../../utils/database');
const { getCachedData, setCachedData } = require('../../utils/cache');

const db = new Database();

// GET /api/admin/dashboard
// Returns aggregated system-wide metrics
router.get('/', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const cacheKey = `admin_dashboard_${period}`;

    // Check cache (5 min TTL)
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const periodDays = parseInt(period.replace('d', ''));

    // Aggregate stats from database
    const statsQuery = await db.pool.query(`
      SELECT
        COUNT(*) as total_calls,
        COUNT(DISTINCT user_id) as active_users,
        SUM(duration_seconds) as total_duration_seconds,
        SUM(cost_usd) as total_cost_usd,
        AVG(cost_usd) as avg_cost_per_call,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls
      FROM calls
      WHERE created_at > NOW() - INTERVAL '${periodDays} days'
    `);

    const stats = statsQuery.rows[0];

    // Cost breakdown by service
    const costByServiceQuery = await db.pool.query(`
      SELECT
        service,
        SUM(total_cost) as total_cost,
        SUM(usage_amount) as total_usage,
        COUNT(*) as event_count
      FROM call_cost_events
      WHERE created_at > NOW() - INTERVAL '${periodDays} days'
      GROUP BY service
      ORDER BY total_cost DESC
    `);

    // Revenue calculation (assumes $4.99 per completed call)
    const revenue = parseFloat(stats.completed_calls) * 4.99;
    const totalCost = parseFloat(stats.total_cost_usd || 0);
    const grossProfit = revenue - totalCost;
    const marginPercent = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(2) : 0;

    // Top personas by usage
    const topPersonasQuery = await db.pool.query(`
      SELECT
        persona_id,
        COUNT(*) as call_count,
        SUM(duration_seconds) as total_duration
      FROM calls
      WHERE created_at > NOW() - INTERVAL '${periodDays} days'
      GROUP BY persona_id
      ORDER BY call_count DESC
      LIMIT 5
    `);

    const result = {
      period: {
        label: `Last ${periodDays} days`,
        days: periodDays,
        start: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      summary: {
        totalCalls: parseInt(stats.total_calls),
        activeUsers: parseInt(stats.active_users),
        completedCalls: parseInt(stats.completed_calls),
        failedCalls: parseInt(stats.failed_calls),
        failureRate: stats.total_calls > 0
          ? ((parseInt(stats.failed_calls) / parseInt(stats.total_calls)) * 100).toFixed(2) + '%'
          : '0%',
        totalDuration_seconds: parseInt(stats.total_duration_seconds || 0),
        totalDuration_minutes: Math.round(parseInt(stats.total_duration_seconds || 0) / 60),
        avgCallDuration_seconds: stats.total_calls > 0
          ? Math.round(parseInt(stats.total_duration_seconds || 0) / parseInt(stats.total_calls))
          : 0
      },
      financials: {
        revenue: revenue.toFixed(2),
        totalCost: totalCost.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        marginPercent: marginPercent + '%',
        avgCostPerCall: parseFloat(stats.avg_cost_per_call || 0).toFixed(4)
      },
      costByService: costByServiceQuery.rows.map(row => ({
        service: row.service,
        totalCost: parseFloat(row.total_cost).toFixed(4),
        usageCount: parseInt(row.event_count),
        percentOfTotal: totalCost > 0
          ? ((parseFloat(row.total_cost) / totalCost) * 100).toFixed(2) + '%'
          : '0%'
      })),
      topPersonas: topPersonasQuery.rows
    };

    // Cache for 5 minutes
    setCachedData(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

module.exports = router;
