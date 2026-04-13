// server/src/routes/health.ts
import { Hono } from 'hono';
import { getPool } from '../db.js';
import { getRedis } from '../redis.js';

const health = new Hono();

health.get('/', async (c) => {
  const checks: Record<string, string> = {};

  try {
    await getPool().query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    await getRedis().ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const healthy = Object.values(checks).every(v => v === 'ok');
  return c.json({ status: healthy ? 'healthy' : 'degraded', checks }, healthy ? 200 : 503);
});

export default health;
