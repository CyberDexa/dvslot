const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const UserPreference = require('../models/UserPreference');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role_id: user.role_id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      error: {
        code: 409,
        message: 'User already exists',
        details: 'An account with this email address already exists.'
      }
    });
  }

  // Hash password
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser = await User.create({
    email,
    password_hash,
    first_name,
    last_name,
    role_id: 2 // Default to 'user' role
  });

  // Create default user preferences
  await UserPreference.create({
    user_id: newUser.user_id,
    notification_radius: 25,
    notification_method: 'push',
    preferred_test_types: ['practical'],
    email_notifications: true,
    push_notifications: true
  });

  // Generate token
  const token = generateToken(newUser);

  logger.info('New user registered', {
    userId: newUser.user_id,
    email: newUser.email,
    ip: req.ip
  });

  res.status(201).json({
    message: 'User registered successfully',
    data: {
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        created_at: newUser.created_at
      },
      token
    }
  });
}));

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, asyncHandler(async (req, res) => {
  const { email, password, fcm_token } = req.body;

  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(401).json({
      error: {
        code: 401,
        message: 'Invalid credentials',
        details: 'Email or password is incorrect.'
      }
    });
  }

  // Check if user is active
  if (!user.is_active) {
    return res.status(401).json({
      error: {
        code: 401,
        message: 'Account deactivated',
        details: 'This account has been deactivated. Please contact support.'
      }
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: {
        code: 401,
        message: 'Invalid credentials',
        details: 'Email or password is incorrect.'
      }
    });
  }

  // Update last login and FCM token if provided
  await User.updateLastLogin(user.user_id);
  if (fcm_token) {
    await User.updateFCMToken(user.user_id, fcm_token);
  }

  // Generate token
  const token = generateToken(user);

  logger.info('User logged in', {
    userId: user.user_id,
    email: user.email,
    ip: req.ip
  });

  res.json({
    message: 'Login successful',
    data: {
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        last_login: new Date().toISOString()
      },
      token
    }
  });
}));

// @route   POST /api/v1/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', asyncHandler(async (req, res) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 401,
        message: 'No token provided',
        details: 'Authorization header with Bearer token is required.'
      }
    });
  }

  const token = authHeader.substring(7);

  try {
    // Verify the old token (even if expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.user_id);
    if (!user || !user.is_active) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Invalid token',
          details: 'User not found or inactive.'
        }
      });
    }

    // Generate new token
    const newToken = generateToken(user);

    res.json({
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    });

  } catch (error) {
    return res.status(401).json({
      error: {
        code: 401,
        message: 'Invalid token',
        details: 'Token verification failed.'
      }
    });
  }
}));

// @route   POST /api/v1/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Email required',
        details: 'Please provide your email address.'
      }
    });
  }

  const user = await User.findByEmail(email);
  
  // Always return success to prevent email enumeration
  res.json({
    message: 'If an account with that email exists, a password reset link has been sent.',
    data: {}
  });

  // Only send email if user exists
  if (user && user.is_active) {
    // TODO: Implement email sending logic
    logger.info('Password reset requested', {
      userId: user.user_id,
      email: user.email,
      ip: req.ip
    });
  }
}));

module.exports = router;
