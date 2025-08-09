const express = require('express');
const AlertSubscription = require('../models/AlertSubscription');
const UserAlert = require('../models/UserAlert');
const { auth } = require('../middleware/auth');
const { validateAlertSubscription } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/v1/alerts/subscribe
// @desc    Create new alert subscription
// @access  Private
router.post('/subscribe', auth, validateAlertSubscription, asyncHandler(async (req, res) => {
  const {
    test_type,
    location,
    radius = 25,
    preferred_centers = [],
    date_from,
    date_to,
    preferred_times = []
  } = req.body;

  // TODO: Geocode location if it's a text address
  let latitude = null;
  let longitude = null;

  const subscriptionData = {
    user_id: req.user.user_id,
    test_type,
    location,
    latitude,
    longitude,
    radius,
    preferred_centers: JSON.stringify(preferred_centers),
    date_from: date_from ? new Date(date_from) : null,
    date_to: date_to ? new Date(date_to) : null,
    preferred_times: JSON.stringify(preferred_times)
  };

  const subscription = await AlertSubscription.create(subscriptionData);

  logger.info('Alert subscription created', {
    userId: req.user.user_id,
    subscriptionId: subscription.subscription_id,
    testType: test_type,
    location
  });

  res.status(201).json({
    message: 'Alert subscription created successfully',
    data: {
      subscription: {
        ...subscription,
        preferred_centers: JSON.parse(subscription.preferred_centers),
        preferred_times: JSON.parse(subscription.preferred_times)
      }
    }
  });
}));

// @route   GET /api/v1/alerts/subscriptions
// @desc    Get user's alert subscriptions
// @access  Private
router.get('/subscriptions', auth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const subscriptions = await AlertSubscription.findByUserId(
    req.user.user_id,
    parseInt(page),
    parseInt(limit)
  );

  res.json({
    message: 'Alert subscriptions retrieved successfully',
    data: {
      subscriptions: subscriptions.data.map(sub => ({
        ...sub,
        preferred_centers: typeof sub.preferred_centers === 'string' 
          ? JSON.parse(sub.preferred_centers) 
          : sub.preferred_centers,
        preferred_times: typeof sub.preferred_times === 'string' 
          ? JSON.parse(sub.preferred_times) 
          : sub.preferred_times
      })),
      pagination: subscriptions.pagination
    }
  });
}));

// @route   GET /api/v1/alerts/subscriptions/:subscriptionId
// @desc    Get specific alert subscription
// @access  Private
router.get('/subscriptions/:subscriptionId', auth, asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await AlertSubscription.findById(subscriptionId);

  if (!subscription) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'Subscription not found',
        details: 'The requested alert subscription does not exist.'
      }
    });
  }

  // Check ownership
  if (subscription.user_id !== req.user.user_id) {
    return res.status(403).json({
      error: {
        code: 403,
        message: 'Access denied',
        details: 'You can only access your own subscriptions.'
      }
    });
  }

  res.json({
    message: 'Alert subscription retrieved successfully',
    data: {
      subscription: {
        ...subscription,
        preferred_centers: typeof subscription.preferred_centers === 'string' 
          ? JSON.parse(subscription.preferred_centers) 
          : subscription.preferred_centers,
        preferred_times: typeof subscription.preferred_times === 'string' 
          ? JSON.parse(subscription.preferred_times) 
          : subscription.preferred_times
      }
    }
  });
}));

// @route   PUT /api/v1/alerts/subscriptions/:subscriptionId
// @desc    Update alert subscription
// @access  Private
router.put('/subscriptions/:subscriptionId', auth, asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const {
    test_type,
    location,
    radius,
    preferred_centers,
    date_from,
    date_to,
    preferred_times,
    is_active
  } = req.body;

  const subscription = await AlertSubscription.findById(subscriptionId);

  if (!subscription) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'Subscription not found',
        details: 'The requested alert subscription does not exist.'
      }
    });
  }

  // Check ownership
  if (subscription.user_id !== req.user.user_id) {
    return res.status(403).json({
      error: {
        code: 403,
        message: 'Access denied',
        details: 'You can only update your own subscriptions.'
      }
    });
  }

  const updateData = {};
  if (test_type) updateData.test_type = test_type;
  if (location) updateData.location = location;
  if (radius !== undefined) updateData.radius = radius;
  if (preferred_centers) updateData.preferred_centers = JSON.stringify(preferred_centers);
  if (date_from) updateData.date_from = new Date(date_from);
  if (date_to) updateData.date_to = new Date(date_to);
  if (preferred_times) updateData.preferred_times = JSON.stringify(preferred_times);
  if (is_active !== undefined) updateData.is_active = is_active;

  const updatedSubscription = await AlertSubscription.update(subscriptionId, updateData);

  logger.info('Alert subscription updated', {
    userId: req.user.user_id,
    subscriptionId,
    updatedFields: Object.keys(updateData)
  });

  res.json({
    message: 'Alert subscription updated successfully',
    data: {
      subscription: {
        ...updatedSubscription,
        preferred_centers: typeof updatedSubscription.preferred_centers === 'string' 
          ? JSON.parse(updatedSubscription.preferred_centers) 
          : updatedSubscription.preferred_centers,
        preferred_times: typeof updatedSubscription.preferred_times === 'string' 
          ? JSON.parse(updatedSubscription.preferred_times) 
          : updatedSubscription.preferred_times
      }
    }
  });
}));

// @route   DELETE /api/v1/alerts/subscriptions/:subscriptionId
// @desc    Delete alert subscription
// @access  Private
router.delete('/subscriptions/:subscriptionId', auth, asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await AlertSubscription.findById(subscriptionId);

  if (!subscription) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'Subscription not found',
        details: 'The requested alert subscription does not exist.'
      }
    });
  }

  // Check ownership
  if (subscription.user_id !== req.user.user_id) {
    return res.status(403).json({
      error: {
        code: 403,
        message: 'Access denied',
        details: 'You can only delete your own subscriptions.'
      }
    });
  }

  await AlertSubscription.delete(subscriptionId);

  logger.info('Alert subscription deleted', {
    userId: req.user.user_id,
    subscriptionId
  });

  res.json({
    message: 'Alert subscription deleted successfully',
    data: {}
  });
}));

// @route   GET /api/v1/alerts/history
// @desc    Get user's alert history
// @access  Private
router.get('/history', auth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sent_only } = req.query;

  const alerts = await UserAlert.findByUserId(
    req.user.user_id,
    parseInt(page),
    parseInt(limit),
    sent_only === 'true'
  );

  res.json({
    message: 'Alert history retrieved successfully',
    data: {
      alerts: alerts.data,
      pagination: alerts.pagination
    }
  });
}));

// @route   POST /api/v1/alerts/:alertId/clicked
// @desc    Mark alert as clicked
// @access  Private
router.post('/:alertId/clicked', auth, asyncHandler(async (req, res) => {
  const { alertId } = req.params;

  const alert = await UserAlert.findById(alertId);

  if (!alert) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'Alert not found',
        details: 'The requested alert does not exist.'
      }
    });
  }

  // Check ownership
  if (alert.user_id !== req.user.user_id) {
    return res.status(403).json({
      error: {
        code: 403,
        message: 'Access denied',
        details: 'You can only update your own alerts.'
      }
    });
  }

  await UserAlert.markClicked(alertId);

  logger.info('Alert marked as clicked', {
    userId: req.user.user_id,
    alertId
  });

  res.json({
    message: 'Alert marked as clicked',
    data: {}
  });
}));

// @route   GET /api/v1/alerts/stats
// @desc    Get user's alert statistics
// @access  Private
router.get('/stats', auth, asyncHandler(async (req, res) => {
  const stats = await UserAlert.getUserStats(req.user.user_id);

  res.json({
    message: 'Alert statistics retrieved successfully',
    data: {
      statistics: stats
    }
  });
}));

module.exports = router;
