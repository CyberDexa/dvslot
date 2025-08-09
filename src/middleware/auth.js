const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Access denied. No token provided.',
          details: 'Authorization header with Bearer token is required.'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Access denied. Invalid token format.',
          details: 'Bearer token is required.'
        }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user from database to ensure they still exist and are active
      const user = await User.findById(decoded.user_id);
      
      if (!user || !user.is_active) {
        return res.status(401).json({
          error: {
            code: 401,
            message: 'Access denied. Invalid token.',
            details: 'User not found or inactive.'
          }
        });
      }

      // Attach user info to request object
      req.user = {
        user_id: user.user_id,
        email: user.email,
        role_id: user.role_id,
        first_name: user.first_name,
        last_name: user.last_name
      };

      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed:', {
        error: jwtError.message,
        token: token.substring(0, 20) + '...'
      });

      return res.status(401).json({
        error: {
          code: 401,
          message: 'Access denied. Invalid token.',
          details: 'Token verification failed.'
        }
      });
    }

  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    return res.status(500).json({
      error: {
        code: 500,
        message: 'Internal server error during authentication.',
        details: 'Please try again later.'
      }
    });
  }
};

// Optional auth - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  // If token is provided, verify it
  return auth(req, res, next);
};

// Role-based authorization
const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 401,
            message: 'Authentication required.',
            details: 'Please log in to access this resource.'
          }
        });
      }

      // Get user's role
      const user = await User.findById(req.user.user_id);
      const userRole = await require('../config/database')('roles')
        .where('role_id', user.role_id)
        .first();

      if (!userRole || !roles.includes(userRole.role_name)) {
        return res.status(403).json({
          error: {
            code: 403,
            message: 'Access forbidden.',
            details: 'Insufficient permissions to access this resource.'
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      
      return res.status(500).json({
        error: {
          code: 500,
          message: 'Internal server error during authorization.',
          details: 'Please try again later.'
        }
      });
    }
  };
};

module.exports = {
  auth,
  optionalAuth,
  authorize
};
