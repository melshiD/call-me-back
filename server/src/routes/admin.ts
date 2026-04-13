// server/src/routes/admin.ts
import { Hono } from 'hono';
import { adminMiddleware } from '../middleware/admin.js';
import * as adminService from '../services/admin-service.js';
import * as personaService from '../services/persona-service.js';
import { query } from '../db.js';

const admin = new Hono();

admin.use('/*', adminMiddleware);

admin.get('/dashboard', async (c) => {
  const period = c.req.query('period') || '30d';
  const data = await adminService.getDashboardData(period);
  return c.json(data);
});

admin.get('/users', async (c) => {
  const result = await query('SELECT id, email, name, phone, phone_verified, created_at FROM users ORDER BY created_at DESC LIMIT 100');
  return c.json(result.rows);
});

admin.patch('/personas/:id', async (c) => {
  const personaId = c.req.param('id');
  const updates = await c.req.json();
  await personaService.updatePersona(personaId, updates);
  return c.json({ success: true });
});

export default admin;
