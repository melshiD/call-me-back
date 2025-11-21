// Admin authentication middleware
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SECRET_TOKEN;

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!JWT_SECRET) {
    console.error('JWT_SECRET not set in environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Verify JWT token from WorkOS auth flow
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // Attach admin info to request
    next();
  } catch (err) {
    // Fallback: check if it's the static admin token (for backwards compatibility)
    if (token === process.env.ADMIN_SECRET_TOKEN) {
      next();
    } else {
      return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
    }
  }
};

module.exports = authMiddleware;
