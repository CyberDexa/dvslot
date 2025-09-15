// Mock Data Service for demonstration when Supabase is not accessible
const logger = require('../utils/logger');

class MockDataService {
  constructor() {
    this.testCenters = this.generateMockTestCenters();
    this.drivingTestSlots = this.generateMockSlots();
  }

  generateMockTestCenters() {
    return [
      { center_id: 1, center_code: 'LON001', name: 'London (Barking)', postcode: 'IG11 0HZ', address: 'Thames Road, Barking', region: 'London', is_active: true },
      { center_id: 2, center_code: 'LON002', name: 'London (Barnet)', postcode: 'EN4 8LT', address: 'Lytton Road, New Barnet', region: 'London', is_active: true },
      { center_id: 3, center_code: 'MAN001', name: 'Manchester (Central)', postcode: 'M1 1AB', address: 'City Centre, Manchester', region: 'North West', is_active: true },
      { center_id: 4, center_code: 'BIR001', name: 'Birmingham (Central)', postcode: 'B1 1AA', address: 'City Centre, Birmingham', region: 'West Midlands', is_active: true },
      { center_id: 5, center_code: 'LEE001', name: 'Leeds (Central)', postcode: 'LS1 1AA', address: 'City Centre, Leeds', region: 'Yorkshire', is_active: true },
      { center_id: 6, center_code: 'GLA001', name: 'Glasgow (Central)', postcode: 'G1 1AA', address: 'City Centre, Glasgow', region: 'Scotland', is_active: true },
      { center_id: 7, center_code: 'CAR001', name: 'Cardiff (Central)', postcode: 'CF1 1AA', address: 'City Centre, Cardiff', region: 'Wales', is_active: true },
      { center_id: 8, center_code: 'BEL001', name: 'Belfast (Central)', postcode: 'BT1 1AA', address: 'City Centre, Belfast', region: 'Northern Ireland', is_active: true },
      { center_id: 9, center_code: 'BRI001', name: 'Bristol (Central)', postcode: 'BS1 1AA', address: 'City Centre, Bristol', region: 'South West', is_active: true },
      { center_id: 10, center_code: 'NOT001', name: 'Nottingham (Central)', postcode: 'NG1 1AA', address: 'City Centre, Nottingham', region: 'East Midlands', is_active: true }
    ];
  }

  generateMockSlots() {
    const slots = [];
    const today = new Date();
    let slotId = 1;

    this.testCenters.forEach(center => {
      // Generate 5-15 slots per center for the next 30 days
      const slotsCount = Math.floor(Math.random() * 11) + 5;
      
      for (let i = 0; i < slotsCount; i++) {
        const daysFromNow = Math.floor(Math.random() * 30) + 1;
        const date = new Date(today);
        date.setDate(today.getDate() + daysFromNow);
        
        const hour = 9 + Math.floor(Math.random() * 8); // 9 AM to 4 PM
        const minute = Math.random() > 0.5 ? 0 : 30;
        
        const testType = Math.random() > 0.3 ? 'practical' : 'theory';
        const available = Math.random() > 0.3; // 70% chance of being available
        
        if (available) { // Only include available slots
          slots.push({
            slot_id: slotId++,
            center_id: center.center_id,
            test_type: testType,
            date: date.toISOString().split('T')[0],
            time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_checked: new Date().toISOString(),
            // Include center data for easier querying
            center_name: center.name,
            postcode: center.postcode,
            address: center.address,
            region: center.region
          });
        }
      }
    });

    return slots;
  }

  // Mock implementation of DrivingTestSlot methods
  async findAllSlots(filters = {}) {
    let results = [...this.drivingTestSlots];

    // Apply filters
    if (filters.test_type) {
      results = results.filter(slot => slot.test_type === filters.test_type);
    }

    if (filters.center_ids && Array.isArray(filters.center_ids)) {
      results = results.filter(slot => filters.center_ids.includes(slot.center_id));
    }

    if (filters.date_from) {
      results = results.filter(slot => slot.date >= filters.date_from);
    }

    if (filters.date_to) {
      results = results.filter(slot => slot.date <= filters.date_to);
    }

    // Sort by date and time
    results.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.time.localeCompare(b.time);
    });

    return results;
  }

  async findSlotById(slotId) {
    return this.drivingTestSlots.find(slot => slot.slot_id === parseInt(slotId)) || null;
  }

  async getRecentlyAvailable(hours = 1) {
    // For demo purposes, return some recent slots
    return this.drivingTestSlots.slice(0, 10);
  }

  async getAvailabilityStats() {
    const stats = {};
    
    this.drivingTestSlots.forEach(slot => {
      const key = `${slot.region}-${slot.test_type}`;
      if (!stats[key]) {
        stats[key] = {
          region: slot.region,
          test_type: slot.test_type,
          total_slots: 0,
          available_slots: 0
        };
      }
      stats[key].total_slots++;
      if (slot.available) {
        stats[key].available_slots++;
      }
    });

    return Object.values(stats);
  }

  // Mock implementation of TestCenter methods
  async findAllCenters() {
    return this.testCenters.filter(center => center.is_active);
  }

  async findCenterById(centerId) {
    return this.testCenters.find(center => center.center_id === parseInt(centerId)) || null;
  }

  async searchCenters(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.testCenters.filter(center => 
      center.is_active && (
        center.name.toLowerCase().includes(term) ||
        center.postcode.toLowerCase().includes(term) ||
        center.address.toLowerCase().includes(term) ||
        center.region.toLowerCase().includes(term)
      )
    );
  }

  async findCentersByPostcode(postcode) {
    return this.testCenters.filter(center => 
      center.is_active && center.postcode === postcode
    );
  }

  getSlotStats() {
    const total = this.drivingTestSlots.length;
    const practical = this.drivingTestSlots.filter(s => s.test_type === 'practical');
    const theory = this.drivingTestSlots.filter(s => s.test_type === 'theory');

    return {
      total,
      available: total, // All slots in our mock data are available
      practical: {
        total: practical.length,
        available: practical.length
      },
      theory: {
        total: theory.length,
        available: theory.length
      }
    };
  }
}

module.exports = new MockDataService();