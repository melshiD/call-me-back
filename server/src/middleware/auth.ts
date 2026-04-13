import { Context, Next } from 'hono';
import { verifyJwt, JwtPayload } from '../lib/jwt.js';
import { isTokenBlacklisted } from '../redis.js';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
    jwtPayload: JwtPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJwt(token);

    if (!payload.userId) {
      return c.json({ error: 'Invalid token: missing userId' }, 401);
    }

    if (payload.jti && await isTokenBlacklisted(payload.jti)) {
      return c.json({ error: 'Token has been revoked' }, 401);
    }

    c.set('userId', payload.userId);
    c.set('userEmail', payload.email || '');
    c.set('jwtPayload', payload);

    await next();
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}
