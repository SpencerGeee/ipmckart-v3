const express = require('express');
const router = express.Router();

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ msg: 'Not authenticated' });
}

router.get('/api/user', ensureAuth, (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email,
    createdAt: req.user.createdAt,
    // Add any other fields you want to show on the dashboard
  });
});

module.exports = router;