// server/src/routes/scenarios.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db.js';
import { generateId, getCurrentTimestamp } from '../lib/utils.js';

const scenarios = new Hono();

scenarios.use('/*', authMiddleware);

scenarios.get('/', async (c) => {
  const userId = c.get('userId');
  const result = await query(
    'SELECT * FROM scenario_templates WHERE user_id = $1 ORDER BY usage_count DESC, created_at DESC',
    [userId]
  );
  return c.json(result.rows);
});

scenarios.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const id = generateId();
  const now = getCurrentTimestamp();

  await query(
    `INSERT INTO scenario_templates (id, user_id, name, scenario_text, icon, usage_count, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 0, $6, $6)`,
    [id, userId, body.name, body.scenarioText, body.icon || null, now]
  );
  return c.json({ id, success: true });
});

scenarios.get('/popular', async (c) => {
  const userId = c.get('userId');
  const result = await query(
    'SELECT * FROM scenario_templates WHERE user_id = $1 ORDER BY usage_count DESC LIMIT 5',
    [userId]
  );
  return c.json(result.rows);
});

scenarios.get('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await query('SELECT * FROM scenario_templates WHERE id = $1', [id]);
  if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
  return c.json(result.rows[0]);
});

scenarios.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  await query(
    'UPDATE scenario_templates SET name = $1, scenario_text = $2, icon = $3, updated_at = $4 WHERE id = $5',
    [body.name, body.scenarioText, body.icon || null, getCurrentTimestamp(), id]
  );
  return c.json({ success: true });
});

scenarios.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await query('DELETE FROM scenario_templates WHERE id = $1', [id]);
  return c.json({ success: true });
});

export default scenarios;
