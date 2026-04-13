import { Hono } from 'hono';
import * as callService from '../services/call-service.js';
import { authMiddleware } from '../middleware/auth.js';

const calls = new Hono();

calls.post('/trigger', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!body.personaId || !body.phoneNumber) {
    return c.json({ error: 'personaId and phoneNumber are required' }, 400);
  }

  // Check balance
  const balance = await callService.getUserBalance(userId);
  if (balance.minutes_balance <= 0 && body.paymentMethod !== 'admin_bypass') {
    return c.json({ error: 'Insufficient minutes balance' }, 402);
  }

  try {
    const result = await callService.initiateCall({ userId, ...body });
    return c.json(result);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to initiate call' }, 500);
  }
});

calls.get('/history', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const history = await callService.getCallHistory(userId);
  return c.json(history);
});

calls.post('/schedule', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!body.personaId || !body.phoneNumber || !body.scheduledTime) {
    return c.json({ error: 'personaId, phoneNumber, and scheduledTime are required' }, 400);
  }

  // Validate scheduled time is in the future
  const scheduledDate = new Date(body.scheduledTime);
  const now = new Date();
  const oneMinuteFromNow = new Date(now.getTime() + 60000);
  if (scheduledDate <= oneMinuteFromNow) {
    return c.json({ error: 'Scheduled time must be at least 1 minute in the future' }, 400);
  }

  const result = await callService.scheduleCall({ userId, ...body });
  return c.json(result);
});

calls.get('/scheduled', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const scheduled = await callService.getScheduledCalls(userId);
  return c.json(scheduled);
});

calls.delete('/schedule/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const callId = c.req.param('id');
  if (!callId) {
    return c.json({ error: 'Call ID is required' }, 400);
  }
  const cancelled = await callService.cancelScheduledCall(userId, callId);
  if (!cancelled) {
    return c.json({ error: 'Scheduled call not found or already executed' }, 404);
  }
  return c.json({ success: true });
});

export default calls;
