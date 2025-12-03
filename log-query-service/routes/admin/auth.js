const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { WorkOS } = require('@workos-inc/node');
const { pool } = require('../../utils/database');

const router = express.Router();

// Initialize WorkOS
const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID;

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SECRET_TOKEN;
const JWT_EXPIRES_IN = '24h';
const REDIRECT_URI = process.env.WORKOS_REDIRECT_URI || 'https://logs.ai-tools-marketplace.io/api/admin/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://callbackapp.ai';

// Allowed admin emails (add more as needed)
const ALLOWED_ADMIN_EMAILS = [
  'dave.melshman@gmail.com'
];

// GET /login - Redirect to WorkOS AuthKit
router.get('/login', (req, res) => {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId,
    redirectUri: REDIRECT_URI,
  });
  res.redirect(authorizationUrl);
});

// GET /callback - Handle WorkOS callback
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('WorkOS auth error:', error);
    return res.redirect(`${FRONTEND_URL}/admin/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/admin/login?error=no_code`);
  }

  try {
    // Exchange code for user info
    const { user } = await workos.userManagement.authenticateWithCode({
      clientId,
      code,
    });

    const email = user.email.toLowerCase();

    // Check if email is allowed
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      console.warn(`Unauthorized admin login attempt: ${email}`);
      return res.redirect(`${FRONTEND_URL}/admin/login?error=unauthorized`);
    }

    // Upsert admin user in database
    const result = await pool.query(`
      INSERT INTO admin_users (email, name, role, password_hash, last_login_at)
      VALUES ($1, $2, 'admin', 'workos_oauth', NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        last_login_at = NOW()
      RETURNING id, email, name, role
    `, [email, user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : email.split('@')[0]]);

    const admin = result.rows[0];

    // Generate JWT for our app
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role, workosId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Track session
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(`
      INSERT INTO admin_sessions (admin_user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
    `, [admin.id, tokenHash, req.ip, req.headers['user-agent']]);

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/admin/login/callback?token=${token}`);
  } catch (err) {
    console.error('WorkOS callback error:', err);
    res.redirect(`${FRONTEND_URL}/admin/login?error=auth_failed`);
  }
});

// GET /me - Get current admin from token
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      'SELECT id, email, name, role FROM admin_users WHERE id = $1',
      [decoded.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    res.json({ admin: result.rows[0] });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST /logout
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    await pool.query(
      'DELETE FROM admin_sessions WHERE token_hash = $1',
      [tokenHash]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
