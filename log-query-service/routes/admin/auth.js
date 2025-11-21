const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../../utils/database');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SECRET_TOKEN;
const JWT_EXPIRES_IN = '24h';

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Find admin by email
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const admin = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update last login
    await pool.query(
      'UPDATE admin_users SET last_login_at = NOW() WHERE id = $1',
      [admin.id]
    );

    // Track session
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(`
      INSERT INTO admin_sessions (admin_user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
    `, [admin.id, tokenHash, req.ip, req.headers['user-agent']]);

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
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

// Get current admin
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

// Change password
router.post('/change-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      'SELECT * FROM admin_users WHERE id = $1',
      [decoded.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(current_password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, admin.id]
    );

    res.json({ success: true });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
