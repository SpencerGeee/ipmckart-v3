// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  let token = req.cookies.token; // Primary: Check cookie

  // Fallback: Check Authorization header (e.g., Bearer <token>) for flexibility in API clients
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    console.log('Authentication failed: No token provided in cookie or header');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Load full user object from database for role checks
    const user = await User.findById(decoded.sub).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user; // Full user object with all fields
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied' });
  }
};

module.exports = { isAuthenticated, requireRole };