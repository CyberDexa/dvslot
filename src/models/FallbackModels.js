const mockDataService = require('../services/mockDataService');
const logger = require('../utils/logger');

// Fallback models that use mock data when Supabase is not accessible
class DrivingTestSlotFallback {
  static async findAll(filters = {}) {
    try {
      // Try to import and use Supabase models first
      const SupabaseModel = require('./DrivingTestSlotSupabase');
      return await SupabaseModel.findAll(filters);
    } catch (error) {
      logger.warn('Supabase not available, using mock data:', error.message);
      return await mockDataService.findAllSlots(filters);
    }
  }

  static async findById(slotId) {
    try {
      const SupabaseModel = require('./DrivingTestSlotSupabase');
      return await SupabaseModel.findById(slotId);
    } catch (error) {
      logger.warn('Supabase not available, using mock data:', error.message);
      return await mockDataService.findSlotById(slotId);
    }
  }

  static async getRecentlyAvailable(hours = 1) {
    try {
      const SupabaseModel = require('./DrivingTestSlotSupabase');
      return await SupabaseModel.getRecentlyAvailable(hours);
    } catch (error) {
      logger.warn('Supabase not available, using mock data:', error.message);
      return await mockDataService.getRecentlyAvailable(hours);
    }
  }

  static async getAvailabilityStats() {
    try {
      const SupabaseModel = require('./DrivingTestSlotSupabase');
      return await SupabaseModel.getAvailabilityStats();
    } catch (error) {
      logger.warn('Supabase not available, using mock data:', error.message);
      return await mockDataService.getAvailabilityStats();
    }
  }
}

class TestCenterFallback {
  static async findAll() {
    try {
      const SupabaseModel = require('./TestCenterSupabase');
      return await SupabaseModel.findAll();
    } catch (error) {
      logger.warn('Supabase not available, using mock data:', error.message);
      return await mockDataService.findAllCenters();
    }
  }

  static async findById(centerId) {
    try {
      const SupabaseModel = require('./TestCenterSupabase');
      return await SupabaseModel.findById(centerId);
    } catch (error) {
      logger.warn('Supabase not available, using mock data:', error.message);
      return await mockDataService.findCenterById(centerId);
    }
  }

  static async search(searchTerm) {
    try {
      const SupabaseModel = require('./TestCenterSupabase');
      return await SupabaseModel.search(searchTerm);
    } catch (error) {
      logger.warn('Supabase not available, using mock data:', error.message);
      return await mockDataService.searchCenters(searchTerm);
    }
  }

  static async findByPostcode(postcode) {
    try {
      const SupabaseModel = require('./TestCenterSupabase');
      return await SupabaseModel.findByPostcode(postcode);
    } catch (error) {
      logger.warn('Supabase not available, using mock data:', error.message);
      return await mockDataService.findCentersByPostcode(postcode);
    }
  }

  static async findNearby(latitude, longitude, radiusMiles = 25) {
    try {
      const SupabaseModel = require('./TestCenterSupabase');
      return await SupabaseModel.findNearby(latitude, longitude, radiusMiles);
    } catch (error) {
      logger.warn('Supabase not available, using mock data:', error.message);
      return await mockDataService.findAllCenters(); // Return all for simplicity
    }
  }
}

module.exports = {
  DrivingTestSlot: DrivingTestSlotFallback,
  TestCenter: TestCenterFallback
};