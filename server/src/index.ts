// server/src/index.ts
import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { corsMiddleware } from './middleware/cors.js';
import { shutdownPool } from './db.js';
import { shutdownRedis, getRedis } from './redis.js';
import { startScheduler } from './services/scheduler.js';

// Route imports
import authRoutes from './routes/auth.js';
import personaRoutes from './routes/personas.js';
import callRoutes from './routes/calls.js';
import voiceRoutes from './routes/voice.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import scenarioRoutes from './routes/scenarios.js';
import userRoutes from './routes/user.js';
import healthRoutes from './routes/health.js';

const app = new Hono();

// Global middleware
app.use('*', corsMiddleware);

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/personas', personaRoutes);
app.route('/api/calls', callRoutes);
app.route('/api/voice', voiceRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/costs', analyticsRoutes);
app.route('/api/scenario-templates', scenarioRoutes);
app.route('/api/user', userRoutes);
app.route('/api/contacts', personaRoutes);  // Contacts share persona routes
app.route('/health', healthRoutes);

// Catch-all 404
app.all('*', (c) => c.json({ error: 'Not found' }, 404));

// Start server
const port = parseInt(process.env.PORT || '3000', 10);

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[API] Server running on port ${info.port}`);
});

// Connect Redis eagerly so health check works immediately
getRedis().connect().catch((err) => {
  console.warn('[Redis] Initial connection failed, will retry:', err.message);
});

// Start scheduled call executor
startScheduler();

// Graceful shutdown
async function shutdown() {
  console.log('[API] Shutting down...');
  server.close();
  await shutdownPool();
  await shutdownRedis();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
