const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const crypto = require('crypto');

/**
 * General API rate limiter
 * Disabled in development mode to prevent issues during testing
 */
const apiLimiter = config.NODE_ENV === 'development' 
  ? (req, res, next) => next() // Bypass rate limiting in development
  : rateLimit({
      windowMs: config.security.rateLimitWindowMs,
      // Shared IPs (Render/NAT) can cause users to be rate limited together.
      // This limiter is meant for abuse protection, not to block real users.
      max: config.NODE_ENV === 'development' ? config.security.rateLimitMaxRequests : 500,
      // Most user traffic is safe GETs; rate limiting GETs on shared IPs can lock out
      // valid users and break the app loading. Keep limiter for non-GET requests.
      skip: (req) => req.method === 'GET',
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      // Avoid strict proxy validations in some reverse-proxy setups.
      validate: false,
      // Key by user token when available; otherwise fall back to IP.
      // This prevents different users behind the same NAT IP from sharing a bucket.
      keyGenerator: (req) => {
        const auth = req.headers?.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        if (token) {
          const hash = crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
          return `api:token:${hash}`;
        }
        return `api:ip:${req.ip}`;
      }
    });

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: config.NODE_ENV === 'development' ? 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in prod
  // Production shared IPs (Render/NAT) + occasional retried requests can otherwise
  // lock out real users. Keep dev strict, but raise prod capacity.
  max: config.NODE_ENV === 'development' ? 50 : 300,
  // Avoid strict validation issues with reverse proxies (Render, CDNs).
  validate: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Key by email/phone (when available) + IP, so different users don't share the same auth limiter bucket.
  keyGenerator: (req) => {
    const email = (req.body?.email ?? '').toString().trim().toLowerCase();
    const phone = (req.body?.phone ?? '').toString().trim();
    const identifier = email || phone;
    return identifier ? `auth:${identifier}` : `auth:anon:${req.ip}`;
  }
});

/**
 * Rate limiter for withdrawal requests
 */
const withdrawalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 withdrawals per hour
  message: {
    success: false,
    message: 'Too many withdrawal requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for task completion
 */
const taskCompletionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 task completions per hour
  message: {
    success: false,
    message: 'Too many task completion requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  withdrawalLimiter,
  taskCompletionLimiter
};

