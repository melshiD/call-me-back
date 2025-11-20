// Admin authentication middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const adminToken = process.env.ADMIN_SECRET_TOKEN;

  if (!adminToken) {
    console.error('ADMIN_SECRET_TOKEN not set in environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }

  next();
};

module.exports = authMiddleware;
