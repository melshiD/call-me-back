const express = require('express');
const router = express.Router();
const Database = require('../../utils/database');

const db = new Database();

// GET /api/admin/users/top
// Get top spending users
router.get('/top', async (req, res) => {
  try {
    const { limit = '10', period = '30d' } = req.query;
    const periodDays = parseInt(period.replace('d', ''));
    const limitNum = parseInt(limit);

    const topUsersQuery = await db.pool.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        COUNT(c.id) as total_calls,
        SUM(c.duration_seconds) as total_duration_seconds,
        SUM(c.cost_usd) as total_cost_usd,
        MAX(c.created_at) as last_call_at
      FROM users u
      LEFT JOIN calls c ON u.id = c.user_id
      WHERE c.created_at > NOW() - INTERVAL '${periodDays} days'
      GROUP BY u.id, u.email, u.name
      ORDER BY total_cost_usd DESC
      LIMIT $1
    `, [limitNum]);

    res.json({
      period: `Last ${periodDays} days`,
      users: topUsersQuery.rows.map(user => ({
        userId: user.id,
        email: user.email,
        name: user.name,
        totalCalls: parseInt(user.total_calls),
        totalDuration_minutes: Math.round(parseInt(user.total_duration_seconds || 0) / 60),
        totalCost_usd: parseFloat(user.total_cost_usd || 0).toFixed(2),
        lastCallAt: user.last_call_at
      }))
    });
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({
      error: 'Failed to fetch top users',
      message: error.message
    });
  }
});

module.exports = router;
