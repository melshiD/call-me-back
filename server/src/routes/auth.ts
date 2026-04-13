import { Hono } from 'hono';
import * as authService from '../services/auth-service.js';
import { authMiddleware } from '../middleware/auth.js';

const auth = new Hono();

auth.post('/register', async (c) => {
  const body = await c.req.json();
  const result = await authService.register(body);
  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }
  return c.json(result);
});

auth.post('/login', async (c) => {
  const body = await c.req.json();
  const result = await authService.login(body);
  if (!result.success) {
    return c.json({ error: result.error }, 401);
  }
  return c.json(result);
});

auth.post('/logout', authMiddleware, async (c) => {
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.slice(7);
  await authService.logout(token);
  return c.json({ success: true });
});

auth.get('/validate', authMiddleware, async (c) => {
  return c.json({ valid: true, userId: c.get('userId') });
});

auth.post('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = await authService.getUserProfile(userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json(user);
});

export default auth;
