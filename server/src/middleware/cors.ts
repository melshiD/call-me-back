import { Context, Next } from 'hono';

const ALLOWED_ORIGINS = [
  'https://callbackapp.ai',
  'https://www.callbackapp.ai',
  'http://localhost:5173',
  'http://localhost:4173',
];

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.netlify.app');

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  await next();

  c.header('Access-Control-Allow-Origin', isAllowed ? origin : ALLOWED_ORIGINS[0]);
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
