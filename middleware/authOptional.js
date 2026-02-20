// middleware/authOptional.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    console.log('No token in cookies'); // Debug
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug: Check if ID is present
    const user = await User.findById(decoded.sub).select('-passwordHash');
    if (user) {
      req.user = user;
      console.log('User found:', user._id); // Debug
    } else {
      console.log('User not found for ID:', decoded.id); // Debug
    }
  } catch (err) {
    console.error('Token verification error:', err.message); // Debug: e.g., expired, invalid signature
  }
  next();
};