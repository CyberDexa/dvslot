const express = require('express');
const User = require('../models/User');
const UserPreference = require('../models/UserPreference');
const { auth, authorize } = require('../middleware/auth');
const { validateUserUpdate, validateUserPreferences } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/v1/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.getWithPreferences(req.user.user_id);
  
  if (!user) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'User not found',
        details: 'The requested user does not exist.'
      }
    });
  }

  res.json({
    message: 'User profile retrieved successfully',
    data: {
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        is_active: user.is_active,
        preferences: {
          notification_radius: user.notification_radius || 25,
          notification_method: user.notification_method || 'push',
          preferred_test_types: user.preferred_test_types || ['practical'],
          preferred_test_centers: user.preferred_test_centers || [],
          email_notifications: user.email_notifications !== false,
          push_notifications: user.push_notifications !== false
        }
      }
    }
  });
}));

// @route   PUT /api/v1/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', auth, validateUserUpdate, asyncHandler(async (req, res) => {
  const { email, first_name, last_name } = req.body;
  
  // Check if email is already taken by another user
  if (email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.user_id !== req.user.user_id) {
      return res.status(409).json({
        error: {
          code: 409,
          message: 'Email already taken',
          details: 'Another account is already using this email address.'
        }
      });
    }
  }

  const updateData = {};
  if (email) updateData.email = email;
  if (first_name) updateData.first_name = first_name;
  if (last_name) updateData.last_name = last_name;

  const updatedUser = await User.update(req.user.user_id, updateData);

  if (!updatedUser) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'User not found',
        details: 'The user could not be updated.'
      }
    });
  }

  logger.info('User profile updated', {
    userId: req.user.user_id,
    updatedFields: Object.keys(updateData)
  });

  res.json({
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
}));

// @route   PUT /api/v1/users/me/preferences
// @desc    Update user preferences
// @access  Private
router.put('/me/preferences', auth, validateUserPreferences, asyncHandler(async (req, res) => {
  const {
    notification_radius,
    notification_method,
    preferred_test_types,
    preferred_test_centers,
    email_notifications,
    push_notifications
  } = req.body;

  const updateData = {};
  if (notification_radius !== undefined) updateData.notification_radius = notification_radius;
  if (notification_method !== undefined) updateData.notification_method = notification_method;
  if (preferred_test_types !== undefined) updateData.preferred_test_types = JSON.stringify(preferred_test_types);
  if (preferred_test_centers !== undefined) updateData.preferred_test_centers = JSON.stringify(preferred_test_centers);
  if (email_notifications !== undefined) updateData.email_notifications = email_notifications;
  if (push_notifications !== undefined) updateData.push_notifications = push_notifications;

  const updatedPreferences = await UserPreference.upsert(req.user.user_id, updateData);

  logger.info('User preferences updated', {
    userId: req.user.user_id,
    updatedFields: Object.keys(updateData)
  });

  res.json({
    message: 'Preferences updated successfully',
    data: {
      preferences: {
        ...updatedPreferences,
        preferred_test_types: typeof updatedPreferences.preferred_test_types === 'string' 
          ? JSON.parse(updatedPreferences.preferred_test_types) 
          : updatedPreferences.preferred_test_types,
        preferred_test_centers: typeof updatedPreferences.preferred_test_centers === 'string' 
          ? JSON.parse(updatedPreferences.preferred_test_centers) 
          : updatedPreferences.preferred_test_centers
      }
    }
  });
}));

// @route   POST /api/v1/users/me/fcm-token
// @desc    Update FCM token for push notifications
// @access  Private
router.post('/me/fcm-token', auth, asyncHandler(async (req, res) => {
  const { fcm_token } = req.body;

  if (!fcm_token) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'FCM token required',
        details: 'Please provide a valid FCM token.'
      }
    });
  }

  await User.updateFCMToken(req.user.user_id, fcm_token);

  logger.info('FCM token updated', {
    userId: req.user.user_id
  });

  res.json({
    message: 'FCM token updated successfully',
    data: {}
  });
}));

// @route   DELETE /api/v1/users/me
// @desc    Deactivate user account
// @access  Private
router.delete('/me', auth, asyncHandler(async (req, res) => {
  await User.deactivate(req.user.user_id);

  logger.info('User account deactivated', {
    userId: req.user.user_id,
    email: req.user.email
  });

  res.json({
    message: 'Account deactivated successfully',
    data: {}
  });
}));

// Admin routes
// @route   GET /api/v1/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const users = await User.findAll();
  const paginatedUsers = users.slice(offset, offset + limit);

  res.json({
    message: 'Users retrieved successfully',
    data: {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: users.length,
        pages: Math.ceil(users.length / limit)
      }
    }
  });
}));

// @route   GET /api/v1/users/:userId
// @desc    Get user by ID (Admin only)
// @access  Private (Admin)
router.get('/:userId', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.getWithPreferences(userId);

  if (!user) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'User not found',
        details: 'The requested user does not exist.'
      }
    });
  }

  res.json({
    message: 'User retrieved successfully',
    data: { user }
  });
}));

module.exports = router;
