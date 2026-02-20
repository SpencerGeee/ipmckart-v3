const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// REGISTER
router.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    req.login(user, err => {
      if (err) throw err;
      res.json({ redirect: '/dashboard.html' });
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// LOGIN
router.post('/api/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    req.login(user, err => {
      if (err) return next(err);
      res.json({ redirect: '/dashboard.html' });
    });
  })(req, res, next);
});

module.exports = router;

//DASHBOARD
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ msg: 'Not authenticated' });
}

router.get('/api/user', ensureAuth, (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email,
    createdAt: req.user.createdAt
  });
});

module.exports = router;