const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const config = require('../config/config');
const { STAFF_ROLES, hasPermission: checkPermission } = require('../utils/permissions');

/**
 * Middleware to verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    if (!user.isActive || user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive or suspended. Please contact support.'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.'
    });
  }
};

/**
 * Middleware to check if user has specific role(s)
 */
const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Get user with role
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          as: 'role'
        }]
      });

      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Invalid role.'
        });
      }

      // Check if user has required role
      if (!roles.includes(user.role.name)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error.'
      });
    }
  };
};

/**
 * Middleware to check if user is admin or super_admin
 */
const isAdmin = authorize('admin', 'super_admin');

/**
 * Any staff position (admin panel access)
 */
const isStaff = authorize(...STAFF_ROLES);

/**
 * Middleware to check if user is super_admin only
 */
const isSuperAdmin = authorize('super_admin');

/**
 * Require a specific permission flag on the user's role
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const user = await User.findByPk(req.user.id, {
        include: [{ model: Role, as: 'role' }]
      });

      if (!user?.role || !checkPermission(user.role, permission)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error.'
      });
    }
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (user && user.isActive && !user.isSuspended) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isStaff,
  isSuperAdmin,
  requirePermission,
  optionalAuth
};

