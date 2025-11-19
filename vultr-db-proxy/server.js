require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error('ERROR: API_KEY environment variable is required');
  process.exit(1);
}

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'call_me_back',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }
  console.log('PostgreSQL connected successfully at', res.rows[0].now);
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// API Key authentication middleware
function authenticateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring(7);

  if (token !== API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

// Health check endpoint (no auth required)
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Main query endpoint
app.post('/query', authenticateApiKey, async (req, res) => {
  const { sql, params = [] } = req.body;

  if (!sql) {
    return res.status(400).json({ error: 'SQL query is required' });
  }

  // Log query (but not params which might contain sensitive data)
  console.log('Executing query:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));

  try {
    const result = await pool.query(sql, params);

    res.json({
      rows: result.rows,
      rowCount: result.rowCount,
      command: result.command
    });
  } catch (error) {
    console.error('Query error:', error.message);

    res.status(500).json({
      error: 'Database query failed',
      message: error.message,
      code: error.code
    });
  }
});

// Batch query endpoint (for migrations)
app.post('/batch', authenticateApiKey, async (req, res) => {
  const { queries } = req.body;

  if (!Array.isArray(queries) || queries.length === 0) {
    return res.status(400).json({ error: 'Queries array is required' });
  }

  console.log(`Executing batch of ${queries.length} queries`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const results = [];
    for (const { sql, params = [] } of queries) {
      const result = await client.query(sql, params);
      results.push({
        command: result.command,
        rowCount: result.rowCount
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      results,
      totalQueries: queries.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Batch query error:', error.message);

    res.status(500).json({
      error: 'Batch query failed',
      message: error.message,
      code: error.code
    });
  } finally {
    client.release();
  }
});

// Log fetch endpoint - for MCP log aggregator
app.post('/logs/fetch', authenticateApiKey, async (req, res) => {
  const { service, lines = 100 } = req.body;

  if (!service) {
    return res.status(400).json({ error: 'Service name is required' });
  }

  // Validate service name to prevent command injection
  const allowedServices = ['voice-pipeline', 'db-proxy'];
  if (!allowedServices.includes(service)) {
    return res.status(400).json({
      error: 'Invalid service name',
      allowed: allowedServices
    });
  }

  // Validate lines is a number
  const numLines = parseInt(lines, 10);
  if (isNaN(numLines) || numLines < 1 || numLines > 1000) {
    return res.status(400).json({
      error: 'Lines must be a number between 1 and 1000'
    });
  }

  console.log(`Fetching ${numLines} lines from ${service} logs`);

  try {
    // Execute PM2 logs command
    const command = `pm2 logs ${service} --lines ${numLines} --nostream`;
    const { stdout, stderr } = await execPromise(command, {
      timeout: 5000, // 5 second timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB max
    });

    // Return logs (stdout + stderr for complete output)
    res.json({
      success: true,
      service,
      lines: numLines,
      logs: stdout + (stderr ? '\n' + stderr : '')
    });
  } catch (error) {
    console.error(`Error fetching ${service} logs:`, error.message);

    res.status(500).json({
      error: 'Failed to fetch logs',
      service,
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end(() => {
    console.log('PostgreSQL pool closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Database proxy listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
