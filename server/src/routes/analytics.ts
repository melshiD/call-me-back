// server/src/routes/analytics.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db.js';

const analytics = new Hono();

analytics.get('/call/:callId', authMiddleware, async (c) => {
  const callId = c.req.param('callId');
  const result = await query(
    'SELECT * FROM api_call_events WHERE call_id = $1 ORDER BY created_at',
    [callId]
  );
  return c.json(result.rows);
});

analytics.get('/user/:userId/spending', authMiddleware, async (c) => {
  const userId = c.req.param('userId');
  const period = c.req.query('period') || '30d';
  const interval = period === '7d' ? '7 days' : period === '90d' ? '90 days' : '30 days';

  const result = await query(
    `SELECT service, COALESCE(SUM(total_cost), 0) as total
     FROM api_call_events WHERE user_id = $1 AND created_at >= NOW() - $2::interval
     GROUP BY service`,
    [userId, interval]
  );
  return c.json(result.rows);
});

analytics.post('/track', async (c) => {
  const body = await c.req.json();
  // Cost event tracking — will be expanded in Plan 4 (observability)
  return c.json({ received: true });
});

export default analytics;
