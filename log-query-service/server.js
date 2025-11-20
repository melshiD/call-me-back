const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Import routes
const usageCallRoute = require('./routes/usage/call');
const usageCalculateRoute = require('./routes/usage/calculate');
const logsTranscriptsRoute = require('./routes/logs/transcripts');

// Import admin routes
const adminDashboardRoute = require('./routes/admin/dashboard');
const adminLogsRoute = require('./routes/admin/logs');
const adminUsersRoute = require('./routes/admin/users');

// Mount routes
app.use('/api/usage/call', usageCallRoute);
app.use('/api/usage/calculate', usageCalculateRoute);
app.use('/api/logs/transcripts', logsTranscriptsRoute);

// Mount admin routes
app.use('/api/admin/dashboard', adminDashboardRoute);
app.use('/api/admin/logs', adminLogsRoute);
app.use('/api/admin/users', adminUsersRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'log-query-service'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Log Query & Cost Aggregation Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      usage: {
        call: '/api/usage/call/:callId',
        calculate: 'POST /api/usage/calculate'
      },
      logs: {
        transcripts: '/api/logs/transcripts?limit=3&sort=longest&since=7d',
        transcript: '/api/logs/transcripts/:callId'
      },
      admin: {
        dashboard: '/api/admin/dashboard?period=30d',
        logs: '/api/admin/logs?service=all&since=1h&query=error&limit=100',
        topUsers: '/api/admin/users/top?limit=10&period=30d'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Bind to localhost only - accessed via Caddy reverse proxy (SECURE PATTERN)
// External access: https://logs.ai-tools-marketplace.io → Caddy → localhost:3001
app.listen(PORT, '127.0.0.1', () => {
  logger.info(`Log Query Service listening on localhost:${PORT} (internal only)`);
  logger.info(`External access: https://logs.ai-tools-marketplace.io (via Caddy proxy)`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Security: SECURE - Bound to localhost, proxied via Caddy with SSL`);
});
