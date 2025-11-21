// JWT-based admin authentication middleware
const jwt = require('jsonwebtoken');
const { pool } = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SECRET_TOKEN;

const jwtAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify admin still exists
    const result = await pool.query(
      'SELECT id, email, name, role FROM admin_users WHERE id = $1',
      [decoded.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    req.admin = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = jwtAuthMiddleware;
