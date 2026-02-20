const { body, query, param, validationResult } = require('express-validator');
const logger = require('../logger');

/**
 * Sanitize and validate request inputs
 * Protects against XSS, NoSQL injection, and header injection
 */
function sanitizeInput(value) {
  if (value === null || value === undefined) return value;
  
  // If it's an object or array, sanitize recursively
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(sanitizeInput);
    }
    const sanitized = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(value[key]);
      }
    }
    return sanitized;
  }
  
  // Convert to string if not already
  const str = String(value);
  
  // Remove null bytes
  let sanitized = str.replace(/\0/g, '');
  
  // Remove common XSS patterns
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Remove HTTP header injection patterns
  sanitized = sanitized.replace(/(\r\n|\n|\r)/g, '');
  
  // Remove potential NoSQL injection operators
  const noSqlPatterns = [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$in/gi,
    /\$nin/gi,
    /\$or/gi,
    /\$and/gi,
    /\$not/gi,
    /\$exists/gi,
    /\$regex/gi,
    /\$size/gi,
    /\$type/gi,
    /\$all/gi,
    /\$elemMatch/gi
  ];
  
  for (const pattern of noSqlPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Middleware to sanitize all request inputs
 */
function sanitizeMiddleware(req, res, next) {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeInput(req.body);
    }

    // Don't sanitize query parameters for API routes - they use standard query strings
    // Query parameters are handled by Express URL parsing safely

    // Sanitize URL parameters (route params like :slug, :id) - these are strings, not objects
    if (req.params && typeof req.params === 'object') {
      for (const key in req.params) {
        if (Object.prototype.hasOwnProperty.call(req.params, key) && typeof req.params[key] === 'string') {
          req.params[key] = sanitizeInput(req.params[key]);
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Sanitization middleware error:', error);
    return res.status(400).json({
      message: 'Invalid request data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Validation middleware for specific fields
 * Use this after the sanitization middleware
 */
function validateRequest(validationRules) {
  return async (req, res, next) => {
    // Apply validation rules
    await Promise.all([
      body().custom((value, { req }) => {
        if (!validationRules.body) return true;
        return validationRules.body(value, req);
      }),
      query().custom((value, { req }) => {
        if (!validationRules.query) return true;
        return validationRules.query(value, req);
      }),
      param().custom((value, { req }) => {
        if (!validationRules.params) return true;
        return validationRules.params(value, req);
      })
    ]);
    
    // Check for validation errors
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    next();
  };
}

/**
 * Common validation rules
 */
const commonValidators = {
  email: body('email').isEmail().normalizeEmail().trim(),
  password: body('password').isLength({ min: 8, max: 128 }).trim(),
  name: body('name').isLength({ min: 1, max: 100 }).trim().escape(),
  phoneNumber: body('phone').isMobilePhone('any').trim(),
  productId: param('id').isMongoId().trim()
};

module.exports = {
  sanitizeInput,
  sanitizeMiddleware,
  validateRequest,
  commonValidators
};
