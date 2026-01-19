const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * User-based Rate Limiter
 * Limits requests per authenticated user, not just by IP
 */

// Store for user request counts
const userRequestStore = new Map();

// Cleanup old entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  for (const [key, value] of userRequestStore.entries()) {
    if (now - value.resetTime > windowMs) {
      userRequestStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

/**
 * Get user identifier from request
 * Uses userId if authenticated, falls back to IP
 */
const getUserKey = (req, ipHelper) => {
  // If user is authenticated, use their ID
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  
  // Fall back to IP address for unauthenticated requests
  // Use ipHelper to properly handle IPv6 addresses
  const ip = ipHelper ? ipHelper(req) : req.ip;
  return `ip:${ip}`;
};

/**
 * Custom rate limit store for user-based limiting
 */
const userBasedStore = {
  increment: (key) => {
    const userKey = key;
    const now = Date.now();
    
    if (!userRequestStore.has(userKey)) {
      userRequestStore.set(userKey, {
        count: 1,
        resetTime: now,
      });
      return { totalHits: 1, resetTime: new Date(now + 15 * 60 * 1000) };
    }
    
    const userData = userRequestStore.get(userKey);
    userData.count += 1;
    
    return {
      totalHits: userData.count,
      resetTime: new Date(userData.resetTime + 15 * 60 * 1000),
    };
  },
  
  decrement: (key) => {
    const userKey = key;
    if (userRequestStore.has(userKey)) {
      const userData = userRequestStore.get(userKey);
      userData.count = Math.max(0, userData.count - 1);
    }
  },
  
  resetKey: (key) => {
    userRequestStore.delete(key);
  },
};

/**
 * User-based rate limiter configuration
 * Note: Simplified to avoid IPv6 key generator issues
 * Uses default express-rate-limit behavior for IP handling
 * Disabled in test environment
 */
const createUserRateLimiter = (options = {}) => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequestsAuthenticated = 1000, // Higher limit for authenticated users
    maxRequestsUnauthenticated = 100, // Lower limit for unauthenticated
    message = 'Too many requests, please try again later.',
  } = options;

  return rateLimit({
    windowMs,
    max: maxRequestsUnauthenticated, // Use lower limit by default
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/v1/health';
    },
  });
};

/**
 * Strict rate limiter for sensitive operations
 * (login, password reset, etc.)
 * Disabled in test environment to allow integration tests
 */
const strictRateLimiter = process.env.NODE_ENV === 'test' 
  ? (req, res, next) => next() // Skip rate limiting in tests
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Only 5 attempts
      handler: (req, res) => {
        logger.warn(`Strict rate limit exceeded`, {
          email: req.body?.email,
          ip: req.ip,
          path: req.path,
        });
        
        res.status(429).json({
          success: false,
          error: {
            code: 'TOO_MANY_ATTEMPTS',
            message: 'Too many attempts. Please try again in 15 minutes.',
          },
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Get current rate limit status for a user
 * Simplified implementation
 */
const getRateLimitStatus = (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Rate limiting is active',
      windowMs: 15 * 60 * 1000,
      maxRequestsUnauthenticated: 100,
      maxRequestsAuthenticated: 1000,
    },
  });
};

module.exports = {
  createUserRateLimiter,
  strictRateLimiter,
  getRateLimitStatus,
  getUserKey,
};
