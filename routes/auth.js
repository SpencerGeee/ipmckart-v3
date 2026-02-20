// Updated auth.js (routes/auth.js)
const express = require('express');
const logger = require('../logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const passport = require('../passport');
const User = require('../models/User');
const { auth } = require('../middleware/authMiddleware');
const { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail, generateToken } = require('../utils/mailjet');

const router = express.Router();

/**
 * Whitelist of allowed redirect paths/domains to prevent open redirect attacks
 * Only relative paths starting with / or paths to known safe domains are allowed
 */
const ALLOWED_REDIRECT_PATTERNS = [
  /^\/[a-zA-Z0-9\-_./]*\.html(\?.*)?$/,  // Relative paths to .html files
  /^\/dashboard\.html$/,
  /^\/admin\.html$/,
  /^\/login\.html$/,
  /^\/cart\.html$/,
  /^\/checkout\.html$/,
  /^\/$/,  // Root path
];

/**
 * Validates and sanitizes redirect URLs to prevent open redirect attacks
 * @param {string} redirectUrl - The URL to validate
 * @param {string} defaultPath - Default path if validation fails
 * @returns {string} Safe redirect URL
 */
function getSafeRedirectUrl(redirectUrl, defaultPath = '/dashboard.html') {
  if (!redirectUrl || typeof redirectUrl !== 'string') {
    return defaultPath;
  }

  // Trim and decode
  let url = redirectUrl.trim();
  
  // Block protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) {
    return defaultPath;
  }
  
  // Block absolute URLs with protocols (http://, https://, javascript:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
    return defaultPath;
  }
  
  // Ensure it starts with /
  if (!url.startsWith('/')) {
    return defaultPath;
  }
  
  // Block path traversal attempts
  if (url.includes('..') || url.includes('\\')) {
    return defaultPath;
  }
  
  // Check against allowed patterns
  const isAllowed = ALLOWED_REDIRECT_PATTERNS.some(pattern => pattern.test(url));
  if (!isAllowed) {
    // If not matching specific patterns, only allow simple relative paths
    // Must start with / and only contain safe characters
    if (!/^\/[a-zA-Z0-9\-_./]*(\?[a-zA-Z0-9\-_=&]*)?$/.test(url)) {
      return defaultPath;
    }
  }
  
  return url;
}

const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' }
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  name: z.string().optional(),
}).refine((data) => {
  // If name is provided but not firstName/lastName, split it
  if (data.name && (!data.firstName || !data.lastName)) {
    const parts = data.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      data.firstName = parts[0];
      data.lastName = parts.slice(1).join(' ');
    } else {
      data.firstName = parts[0] || '';
      data.lastName = '';
    }
  }
  return data.firstName && data.lastName;
}, {
  message: "Either provide firstName+lastName or name (will be split)"
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: isProd ? process.env.COOKIE_DOMAIN : undefined,
  };
}

function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, cookieOptions());
}

router.post('/register', authLimiter, async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const { email, password, firstName, lastName } = body;

    // Check if user already exists
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({
        message: 'Email already in use. Please try logging in instead.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create full name from first and last names
    const fullName = `${firstName} ${lastName}`;

    // Create and save user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      name: fullName,
      provider: 'local',
      emailVerified: false,
      role: 'customer'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, cookieOptions());

    // Determine redirect based on role
    let redirect = process.env.POST_LOGIN_REDIRECT || '/dashboard.html';
    if (user.role === 'admin') {
      redirect = '/admin.html';
    }

    // Send welcome email (don't await to avoid blocking response)
    sendWelcomeEmail({
      toEmail: user.email,
      userName: user.name || user.firstName || 'there',
    }).catch(error => {
      logger.error('Failed to send welcome email:', error);
      // Don't fail the request if email sending fails
    });

    // Return success response
    res.status(201).json({
      id: user._id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      redirect
    });
    
    // Generate verification token
    const verificationToken = generateToken();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 3600000; // 24 hours
    await user.save();
    
    // Send verification email
    sendVerificationEmail({
      toEmail: user.email,
      userName: user.name,
      verificationToken,
    }).catch(err => logger.error("Failed to send verification email:", err));

  } catch (err) {
    logger.error('Registration error:', err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: err.errors
      });
    }

    res.status(500).json({
      message: 'Registration failed due to server error'
    });
  }
});

router.post('/request-password-reset', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      const resetToken = generateToken();
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      await sendPasswordResetEmail({
        toEmail: user.email,
        userName: user.name,
        resetToken,
      });
    }

    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    logger.error('Error in /request-password-reset:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/verify', async (req, res) => {
    try {
        const { token, email } = req.query;

        const user = await User.findOne({
            email: email.toLowerCase(),
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).send('Verification link is invalid or has expired. Please register again to get a new link.');
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        
        res.redirect('/email-verified.html');

    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).send('An error occurred during email verification.');
    }
});

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been updated successfully.' });
  } catch (error) {
    logger.error('Error in /reset-password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // After successful login:
    const token = jwt.sign(
      { sub: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Set HTTP-only cookie
    res.cookie('token', token, cookieOptions());
    
    // Check user role for redirection
    const redirect = user.role === 'admin' 
      ? '/admin.html' 
      : (process.env.POST_LOGIN_REDIRECT || '/dashboard.html');
    
    // Send response with user data and token
    res.json({
      success: true,
      id: user._id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token: process.env.NODE_ENV === 'development' ? token : undefined,
      redirect
    });
  } catch (err) {
    logger.error(err);
    res.status(400).json({ message: err.message || 'Login failed' });
  }
});

router.get('/logout', (req, res) => {
  logger.info('Logout endpoint hit');
  
  const isProd = process.env.NODE_ENV === 'production';
  
  // Clear cookie with ALL possible configurations to ensure it's removed
  const clearOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    path: '/',
    domain: isProd ? process.env.COOKIE_DOMAIN : undefined,
    expires: new Date(0), // Expire immediately
  };
  
  // Clear the cookie
  res.clearCookie('token', clearOptions);
  
  // Also try clearing without domain (belt and suspenders approach)
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    path: '/',
    expires: new Date(0),
  });
  
  logger.info('Cookie cleared, redirecting to login');
  
  // Redirect to login with flag
  res.redirect('/login.html?logged_out=true');
});
/**
 * Google OAuth - with redirect parameter support
 */
router.get('/google',
  (req, res, next) => {
    if (req.query.redirect) {
      req.session = req.session || {};
      req.session.oauthRedirect = getSafeRedirectUrl(req.query.redirect);
    }
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false,
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: process.env.FRONTEND_URL + '/login?error=social' 
  }),
  async (req, res) => {
    setAuthCookie(res, { sub: req.user._id, role: req.user.role });
    
    let redirectTo = '/dashboard.html';
    
    if (req.session && req.session.oauthRedirect) {
      redirectTo = getSafeRedirectUrl(req.session.oauthRedirect);
      delete req.session.oauthRedirect;
    } else if (req.user.role === 'admin') {
      redirectTo = '/admin.html';
    } else if (process.env.POST_LOGIN_REDIRECT) {
      redirectTo = getSafeRedirectUrl(process.env.POST_LOGIN_REDIRECT);
    }
    
    res.redirect(redirectTo);
  }
);

router.get('/me', auth, (req, res) => {
  // The 'auth' middleware has already fetched the user and attached it to req.user
  // We just send back the user data (which has the passwordHash selected out)
  res.json(req.user);
});

/**
 * Facebook OAuth (optional) - with redirect parameter support
 */
router.get('/facebook',
  (req, res, next) => {
    if (req.query.redirect) {
      req.session = req.session || {};
      req.session.oauthRedirect = getSafeRedirectUrl(req.query.redirect);
    }
    next();
  },
  passport.authenticate('facebook', {
    scope: ['email'],
    session: false,
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false, 
    failureRedirect: process.env.FRONTEND_URL + '/login?error=social' 
  }),
  async (req, res) => {
    setAuthCookie(res, { sub: req.user._id, role: req.user.role });
    
    let redirectTo = '/dashboard.html';
    
    if (req.session && req.session.oauthRedirect) {
      redirectTo = getSafeRedirectUrl(req.session.oauthRedirect);
      delete req.session.oauthRedirect;
    } else if (req.user.role === 'admin') {
      redirectTo = '/admin.html';
    } else if (process.env.POST_LOGIN_REDIRECT) {
      redirectTo = getSafeRedirectUrl(process.env.POST_LOGIN_REDIRECT);
    }
    
    res.redirect(redirectTo);
  }
);

module.exports = router;