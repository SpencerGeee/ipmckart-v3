// routes/_authMiddleware.js
const jwt = require('jsonwebtoken');

function parseToken(req) {
  const token = req.cookies?.token;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
}

function requireAuth(req, res, next) {
  const payload = parseToken(req);
  if (!payload) return res.status(401).json({ message: 'Unauthorized' });
  req.user = { id: payload.sub, role: payload.role };
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { requireAuth, requireRole, parseToken };
