const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  logger.error('Error caught by error handler:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: {
      code: 500,
      message: 'Internal server error',
      details: 'An unexpected error occurred. Please try again later.'
    }
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      error: {
        code: 400,
        message: 'Validation error',
        details: error.message
      }
    };
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = {
      error: {
        code: 401,
        message: 'Invalid token',
        details: 'Authentication token is invalid or expired.'
      }
    };
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = {
      error: {
        code: 401,
        message: 'Token expired',
        details: 'Authentication token has expired. Please log in again.'
      }
    };
  } else if (error.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    errorResponse = {
      error: {
        code: 409,
        message: 'Resource already exists',
        details: 'A resource with these details already exists.'
      }
    };
  } else if (error.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    errorResponse = {
      error: {
        code: 400,
        message: 'Invalid reference',
        details: 'Referenced resource does not exist.'
      }
    };
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorResponse = {
      error: {
        code: 503,
        message: 'Service unavailable',
        details: 'Unable to connect to required service. Please try again later.'
      }
    };
  }

  // Don't expose sensitive error details in production
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.error.stack;
    
    // Only show generic error messages in production for 500 errors
    if (statusCode === 500) {
      errorResponse.error.details = 'An unexpected error occurred. Please try again later.';
    }
  } else {
    // Include stack trace in development
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 Not Found handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 404,
      message: 'Resource not found',
      details: `The requested endpoint ${req.originalUrl} does not exist.`
    }
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
