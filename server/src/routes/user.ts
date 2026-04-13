// server/src/routes/user.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../db.js';
import { sendVerificationCode, checkVerificationCode } from '../lib/twilio.js';
import { getCurrentTimestamp } from '../lib/utils.js';
import * as callService from '../services/call-service.js';

const user = new Hono();

user.use('/*', authMiddleware);

user.get('/balance', async (c) => {
  const userId = c.get('userId');
  const balance = await callService.getUserBalance(userId);
  return c.json(balance);
});

user.get('/usage-stats', async (c) => {
  const userId = c.get('userId');
  const result = await query(
    `SELECT COUNT(*) as total_calls, COALESCE(SUM(duration_seconds), 0) as total_seconds
     FROM calls WHERE user_id = $1 AND status = 'completed'`,
    [userId]
  );
  return c.json(result.rows[0]);
});

user.post('/verify-phone', async (c) => {
  const body = await c.req.json();
  if (body.action === 'send') {
    const result = await sendVerificationCode(body.phoneNumber);
    return c.json(result);
  } else if (body.action === 'check') {
    const result = await checkVerificationCode(body.phoneNumber, body.code);
    if (result.valid) {
      const userId = c.get('userId');
      await query(
        'UPDATE users SET phone = $1, phone_verified = true, updated_at = $2 WHERE id = $3',
        [body.phoneNumber, getCurrentTimestamp(), userId]
      );
    }
    return c.json(result);
  }
  return c.json({ error: 'Invalid action' }, 400);
});

export default user;
