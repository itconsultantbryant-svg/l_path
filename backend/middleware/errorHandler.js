const { AuditLog } = require('../models');
const config = require('../config/config');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console in development
  if (config.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = {
      message,
      statusCode: 400
    };
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Resource already exists with this information.';
    error = {
      message,
      statusCode: 409
    };
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Related resource not found.';
    error = {
      message,
      statusCode: 404
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token.';
    error = {
      message,
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired.';
    error = {
      message,
      statusCode: 401
    };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Log to audit log if user is authenticated
  if (req.user) {
    AuditLog.create({
      userId: req.user.id,
      action: 'ERROR',
      description: `Error: ${message}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        url: req.originalUrl,
        method: req.method,
        statusCode
      }
    }).catch(logErr => {
      console.error('Failed to log error to audit log:', logErr);
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};

