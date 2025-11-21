const express = require('express');
const router = express.Router();
const Database = require('../../utils/database');
const { getCachedData, setCachedData } = require('../../utils/cache');
const authMiddleware = require('../../middleware/auth');

const db = new Database();

// GET /api/admin/dashboard
// Returns aggregated system-wide metrics
router.get('/', authMiddleware, async (req, res) => {
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
        COALESCE(SUM(duration_seconds), 0) as total_duration_seconds,
        COALESCE(SUM(actual_cost_cents), 0) / 100.0 as total_cost_usd,
        COALESCE(SUM(estimated_cost_cents), 0) / 100.0 as estimated_cost_usd,
        COALESCE(AVG(actual_cost_cents), 0) / 100.0 as avg_cost_per_call,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_calls,
        COUNT(CASE WHEN status = 'initiating' THEN 1 END) as initiating_calls,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN actual_cost_cents END), 0) / 100.0 as failed_call_costs,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN estimated_cost_cents END), 0) / 100.0 as failed_call_estimated_costs,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN actual_cost_cents END), 0) / 100.0 as completed_call_costs
      FROM calls
      WHERE created_at > NOW() - INTERVAL '${periodDays} days'
    `);

    const stats = statsQuery.rows[0];

    // Cost breakdown by service
    const costByServiceQuery = await db.pool.query(`
      SELECT
        service,
        COALESCE(SUM(calculated_cost_cents), 0) / 100.0 as total_cost,
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

    // Calculate failed call costs (use actual if available, otherwise estimated)
    const failedCallCostTotal = parseFloat(stats.failed_call_costs) > 0
      ? parseFloat(stats.failed_call_costs)
      : parseFloat(stats.failed_call_estimated_costs || 0);

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
        inProgressCalls: parseInt(stats.in_progress_calls || 0),
        initiatingCalls: parseInt(stats.initiating_calls || 0),
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
        estimatedCost: parseFloat(stats.estimated_cost_usd || 0).toFixed(2),
        failedCallCosts: failedCallCostTotal.toFixed(2),
        completedCallCosts: parseFloat(stats.completed_call_costs || 0).toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        marginPercent: marginPercent + '%',
        avgCostPerCall: parseFloat(stats.avg_cost_per_call || 0).toFixed(4)
      },
      callStatusBreakdown: {
        completed: parseInt(stats.completed_calls),
        failed: parseInt(stats.failed_calls),
        inProgress: parseInt(stats.in_progress_calls || 0),
        initiating: parseInt(stats.initiating_calls || 0),
        completedPercent: stats.total_calls > 0
          ? ((parseInt(stats.completed_calls) / parseInt(stats.total_calls)) * 100).toFixed(1) + '%'
          : '0%',
        failedPercent: stats.total_calls > 0
          ? ((parseInt(stats.failed_calls) / parseInt(stats.total_calls)) * 100).toFixed(1) + '%'
          : '0%',
        inProgressPercent: stats.total_calls > 0
          ? ((parseInt(stats.in_progress_calls || 0) / parseInt(stats.total_calls)) * 100).toFixed(1) + '%'
          : '0%'
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

// GET /api/admin/dashboard/recent-calls
// Returns recent calls with cost breakdown for the Persona Designer widget
router.get('/recent-calls', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const callsQuery = await db.pool.query(`
      SELECT
        c.id,
        c.twilio_call_sid,
        c.persona_id,
        p.name as persona_name,
        c.status,
        c.duration_seconds,
        c.actual_cost_cents,
        c.estimated_cost_cents,
        c.created_at,
        c.ended_at
      FROM calls c
      LEFT JOIN personas p ON c.persona_id = p.id
      ORDER BY c.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    // Get cost breakdown per call
    const callIds = callsQuery.rows.map(c => c.id);
    let costBreakdowns = {};

    if (callIds.length > 0) {
      const costsQuery = await db.pool.query(`
        SELECT
          call_id,
          service,
          SUM(calculated_cost_cents) / 100.0 as cost_usd,
          SUM(usage_amount) as total_usage,
          usage_unit
        FROM call_cost_events
        WHERE call_id = ANY($1)
        GROUP BY call_id, service, usage_unit
      `, [callIds]);

      costsQuery.rows.forEach(row => {
        if (!costBreakdowns[row.call_id]) {
          costBreakdowns[row.call_id] = [];
        }
        costBreakdowns[row.call_id].push({
          service: row.service,
          cost: parseFloat(row.cost_usd).toFixed(4),
          usage: parseFloat(row.total_usage).toFixed(2),
          unit: row.usage_unit
        });
      });
    }

    const recentCalls = callsQuery.rows.map(call => ({
      id: call.id,
      callSid: call.twilio_call_sid,
      personaId: call.persona_id,
      personaName: call.persona_name || 'Unknown',
      status: call.status,
      durationSeconds: call.duration_seconds || 0,
      costCents: call.actual_cost_cents || call.estimated_cost_cents || 0,
      costUsd: ((call.actual_cost_cents || call.estimated_cost_cents || 0) / 100).toFixed(4),
      createdAt: call.created_at,
      endedAt: call.ended_at,
      costBreakdown: costBreakdowns[call.id] || []
    }));

    res.json({ calls: recentCalls });
  } catch (error) {
    console.error('Error fetching recent calls:', error);
    res.status(500).json({ error: 'Failed to fetch recent calls', message: error.message });
  }
});

module.exports = router;
