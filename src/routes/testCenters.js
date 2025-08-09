const express = require('express');
const TestCenter = require('../models/TestCenter');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/v1/test-centers
// @desc    Get all test centers
// @access  Public
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { region, search, page = 1, limit = 50 } = req.query;
  
  let testCenters;
  
  if (search) {
    testCenters = await TestCenter.search(search);
  } else if (region) {
    testCenters = await TestCenter.findByRegion(region);
  } else {
    testCenters = await TestCenter.findAll();
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const paginatedCenters = testCenters.slice(offset, offset + limitNum);

  res.json({
    message: 'Test centers retrieved successfully',
    data: {
      test_centers: paginatedCenters,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: testCenters.length,
        pages: Math.ceil(testCenters.length / limitNum)
      }
    }
  });
}));

// @route   GET /api/v1/test-centers/:centerId
// @desc    Get test center by ID
// @access  Public
router.get('/:centerId', optionalAuth, asyncHandler(async (req, res) => {
  const { centerId } = req.params;

  if (!centerId || isNaN(centerId)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Invalid center ID',
        details: 'Please provide a valid numeric center ID.'
      }
    });
  }

  const testCenter = await TestCenter.findById(centerId);

  if (!testCenter) {
    return res.status(404).json({
      error: {
        code: 404,
        message: 'Test center not found',
        details: 'The requested test center does not exist.'
      }
    });
  }

  res.json({
    message: 'Test center retrieved successfully',
    data: {
      test_center: testCenter
    }
  });
}));

// @route   GET /api/v1/test-centers/nearby
// @desc    Get nearby test centers
// @access  Public
router.get('/nearby', optionalAuth, asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 25 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Missing location parameters',
        details: 'Please provide both latitude and longitude.'
      }
    });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const radiusNum = parseInt(radius);

  if (isNaN(lat) || isNaN(lng) || isNaN(radiusNum)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Invalid parameters',
        details: 'Latitude, longitude, and radius must be valid numbers.'
      }
    });
  }

  const nearbyTestCenters = await TestCenter.findNearby(lat, lng, radiusNum);

  res.json({
    message: 'Nearby test centers retrieved successfully',
    data: {
      test_centers: nearbyTestCenters,
      search_criteria: {
        latitude: lat,
        longitude: lng,
        radius_miles: radiusNum
      }
    }
  });
}));

// @route   GET /api/v1/test-centers/regions
// @desc    Get all available regions
// @access  Public
router.get('/regions', optionalAuth, asyncHandler(async (req, res) => {
  const regions = await TestCenter.getRegions();

  res.json({
    message: 'Regions retrieved successfully',
    data: {
      regions: regions.map(r => r.region)
    }
  });
}));

// @route   GET /api/v1/test-centers/stats
// @desc    Get test center statistics
// @access  Public
router.get('/stats', optionalAuth, asyncHandler(async (req, res) => {
  const stats = await TestCenter.getTestCenterStats();

  res.json({
    message: 'Test center statistics retrieved successfully',
    data: {
      statistics: stats
    }
  });
}));

// @route   POST /api/v1/test-centers/search
// @desc    Advanced test center search
// @access  Public
router.post('/search', optionalAuth, asyncHandler(async (req, res) => {
  const { 
    location, 
    radius = 25, 
    regions = [], 
    search_term,
    page = 1, 
    limit = 50 
  } = req.body;

  let testCenters = [];

  try {
    if (location && location.latitude && location.longitude) {
      // Location-based search
      testCenters = await TestCenter.findNearby(
        location.latitude, 
        location.longitude, 
        radius
      );
    } else if (regions.length > 0) {
      // Region-based search
      const regionPromises = regions.map(region => TestCenter.findByRegion(region));
      const regionResults = await Promise.all(regionPromises);
      testCenters = regionResults.flat();
    } else if (search_term) {
      // Text search
      testCenters = await TestCenter.search(search_term);
    } else {
      // Get all centers
      testCenters = await TestCenter.findAll();
    }

    // Apply additional text filtering if provided
    if (search_term && (location || regions.length > 0)) {
      testCenters = testCenters.filter(center =>
        center.name.toLowerCase().includes(search_term.toLowerCase()) ||
        center.postcode.toLowerCase().includes(search_term.toLowerCase()) ||
        center.address?.toLowerCase().includes(search_term.toLowerCase()) ||
        center.region.toLowerCase().includes(search_term.toLowerCase())
      );
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedCenters = testCenters.slice(offset, offset + limitNum);

    res.json({
      message: 'Test centers search completed successfully',
      data: {
        test_centers: paginatedCenters,
        search_criteria: {
          location,
          radius,
          regions,
          search_term
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: testCenters.length,
          pages: Math.ceil(testCenters.length / limitNum)
        }
      }
    });

  } catch (error) {
    logger.error('Test center search error:', error);
    throw error;
  }
}));

module.exports = router;
