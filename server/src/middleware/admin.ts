import { Context, Next } from 'hono';
import { verifyJwt, decodeJwt } from '../lib/jwt.js';
import { query } from '../db.js';

declare module 'hono' {
  interface ContextVariableMap {
    adminId: string;
    adminRole: string;
  }
}

export async function adminMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing Authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJwt(token);
    const adminId = payload.adminId || payload.userId;

    if (!adminId) {
      return c.json({ error: 'Forbidden: not an admin' }, 403);
    }

    const result = await query(
      'SELECT id, email, role FROM admin_users WHERE id = $1 OR email = $2',
      [adminId, payload.email]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Forbidden: not an admin' }, 403);
    }

    c.set('adminId', result.rows[0].id);
    c.set('adminRole', result.rows[0].role);

    await next();
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}
