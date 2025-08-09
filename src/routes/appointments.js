const express = require('express');
const DrivingTestSlot = require('../models/DrivingTestSlot');
const TestCenter = require('../models/TestCenter');
const { optionalAuth } = require('../middleware/auth');
const { validateAppointmentSearch } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/v1/appointments/driving-tests
// @desc    Get available driving test slots
// @access  Public
router.get('/driving-tests', optionalAuth, asyncHandler(async (req, res) => {
  const {
    test_type,
    location,
    radius = 25,
    date_from,
    date_to,
    center_ids,
    page = 1,
    limit = 50
  } = req.query;

  // Validate test_type
  if (!test_type || !['practical', 'theory'].includes(test_type)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Invalid test type',
        details: 'Test type must be either practical or theory.'
      }
    });
  }

  let filters = { test_type };

  // Handle location-based filtering
  if (location) {
    let testCenters = [];
    
    // Check if location is a postcode pattern
    const postcodePattern = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
    if (postcodePattern.test(location.trim())) {
      testCenters = await TestCenter.findByPostcode(location.trim().toUpperCase());
    } else {
      // Treat as search term
      testCenters = await TestCenter.search(location);
    }

    if (testCenters.length === 0) {
      return res.json({
        message: 'No test centers found for the specified location',
        data: {
          appointments: [],
          search_criteria: { test_type, location, radius },
          pagination: { page: 1, limit: 0, total: 0, pages: 0 }
        }
      });
    }

    filters.center_ids = testCenters.map(center => center.center_id);
  }

  // Handle specific center IDs
  if (center_ids) {
    const centerIdArray = Array.isArray(center_ids) 
      ? center_ids 
      : center_ids.split(',').map(id => parseInt(id.trim()));
    
    filters.center_ids = filters.center_ids 
      ? filters.center_ids.filter(id => centerIdArray.includes(id))
      : centerIdArray;
  }

  // Handle date filtering
  if (date_from) {
    filters.date_from = new Date(date_from).toISOString().split('T')[0];
  }
  if (date_to) {
    filters.date_to = new Date(date_to).toISOString().split('T')[0];
  }

  // Get available slots
  const slots = await DrivingTestSlot.findAll(filters);

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const paginatedSlots = slots.slice(offset, offset + limitNum);

  res.json({
    message: 'Available driving test appointments retrieved successfully',
    data: {
      appointments: paginatedSlots.map(slot => ({
        slot_id: slot.slot_id,
        test_type: slot.test_type,
        date: slot.date,
        time: slot.time,
        center: {
          center_id: slot.center_id,
          name: slot.center_name,
          postcode: slot.postcode,
          address: slot.address,
          region: slot.region
        },
        available: slot.available,
        last_checked: slot.last_checked
      })),
      search_criteria: {
        test_type,
        location,
        radius: parseInt(radius),
        date_from,
        date_to,
        center_ids
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: slots.length,
        pages: Math.ceil(slots.length / limitNum)
      }
    }
  });
}));

// @route   POST /api/v1/appointments/search
// @desc    Advanced appointment search
// @access  Public
router.post('/search', optionalAuth, asyncHandler(async (req, res) => {
  const {
    test_type,
    location,
    radius = 25,
    date_from,
    date_to,
    preferred_times = [], // Array of time ranges like ["09:00-12:00", "14:00-17:00"]
    center_ids = [],
    page = 1,
    limit = 50
  } = req.body;

  // Validate test_type
  if (!test_type || !['practical', 'theory'].includes(test_type)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Invalid test type',
        details: 'Test type must be either practical or theory.'
      }
    });
  }

  let filters = { test_type };
  let searchCenters = [];

  // Handle location-based search
  if (location && location.latitude && location.longitude) {
    searchCenters = await TestCenter.findNearby(
      location.latitude, 
      location.longitude, 
      radius
    );
  } else if (location && typeof location === 'string') {
    // Text-based location search
    searchCenters = await TestCenter.search(location);
  }

  // Combine with specific center IDs if provided
  if (center_ids.length > 0) {
    if (searchCenters.length > 0) {
      // Intersection of location-based and specified centers
      const locationCenterIds = searchCenters.map(c => c.center_id);
      filters.center_ids = center_ids.filter(id => locationCenterIds.includes(id));
    } else {
      filters.center_ids = center_ids;
    }
  } else if (searchCenters.length > 0) {
    filters.center_ids = searchCenters.map(c => c.center_id);
  }

  // Date filtering
  if (date_from) filters.date_from = date_from;
  if (date_to) filters.date_to = date_to;

  // Get available slots
  let slots = await DrivingTestSlot.findAll(filters);

  // Filter by preferred times if specified
  if (preferred_times.length > 0) {
    slots = slots.filter(slot => {
      const slotTime = slot.time;
      return preferred_times.some(timeRange => {
        const [start, end] = timeRange.split('-');
        return slotTime >= start && slotTime <= end;
      });
    });
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const paginatedSlots = slots.slice(offset, offset + limitNum);

  res.json({
    message: 'Appointment search completed successfully',
    data: {
      appointments: paginatedSlots.map(slot => ({
        slot_id: slot.slot_id,
        test_type: slot.test_type,
        date: slot.date,
        time: slot.time,
        center: {
          center_id: slot.center_id,
          name: slot.center_name,
          postcode: slot.postcode,
          address: slot.address,
          region: slot.region
        },
        available: slot.available,
        last_checked: slot.last_checked
      })),
      search_criteria: {
        test_type,
        location,
        radius,
        date_from,
        date_to,
        preferred_times,
        center_ids
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: slots.length,
        pages: Math.ceil(slots.length / limitNum)
      }
    }
  });
}));

// @route   GET /api/v1/appointments/:slotId
// @desc    Get specific appointment slot
// @access  Public
router.get('/:slotId', optionalAuth, asyncHandler(async (req, res) => {
  const { slotId } = req.params;

  if (!slotId || isNaN(slotId)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Invalid slot ID',
        details: 'Please provide a valid numeric slot ID.'
      }
    });
  }

  const slot = await DrivingTestSlot.findById(slotId);

  if (!slot) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'Appointment slot not found',
        details: 'The requested appointment slot does not exist.'
      }
    });
  }

  res.json({
    message: 'Appointment slot retrieved successfully',
    data: {
      appointment: {
        slot_id: slot.slot_id,
        test_type: slot.test_type,
        date: slot.date,
        time: slot.time,
        center: {
          center_id: slot.center_id,
          name: slot.center_name,
          postcode: slot.postcode,
          address: slot.address,
          region: slot.region
        },
        available: slot.available,
        created_at: slot.created_at,
        last_checked: slot.last_checked
      }
    }
  });
}));

// @route   GET /api/v1/appointments/stats/availability
// @desc    Get appointment availability statistics
// @access  Public
router.get('/stats/availability', optionalAuth, asyncHandler(async (req, res) => {
  const stats = await DrivingTestSlot.getAvailabilityStats();

  res.json({
    message: 'Availability statistics retrieved successfully',
    data: {
      statistics: stats,
      generated_at: new Date().toISOString()
    }
  });
}));

// @route   GET /api/v1/appointments/recent
// @desc    Get recently available appointments
// @access  Public
router.get('/recent', optionalAuth, asyncHandler(async (req, res) => {
  const { hours = 1, test_type, limit = 20 } = req.query;

  let recentSlots = await DrivingTestSlot.getRecentlyAvailable(parseInt(hours));

  // Filter by test type if specified
  if (test_type && ['practical', 'theory'].includes(test_type)) {
    recentSlots = recentSlots.filter(slot => slot.test_type === test_type);
  }

  // Limit results
  const limitedSlots = recentSlots.slice(0, parseInt(limit));

  res.json({
    message: 'Recently available appointments retrieved successfully',
    data: {
      appointments: limitedSlots.map(slot => ({
        slot_id: slot.slot_id,
        test_type: slot.test_type,
        date: slot.date,
        time: slot.time,
        center: {
          center_id: slot.center_id,
          name: slot.center_name,
          postcode: slot.postcode,
          region: slot.region
        },
        updated_at: slot.updated_at
      })),
      criteria: {
        hours_back: parseInt(hours),
        test_type,
        limit: parseInt(limit)
      }
    }
  });
}));

module.exports = router;
