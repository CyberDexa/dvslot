const db = require('../config/database');

class DrivingTestSlot {
  static async findAll(filters = {}) {
    let query = db('driving_test_slots')
      .select(
        'driving_test_slots.*',
        'dvsa_test_centers.name as center_name',
        'dvsa_test_centers.postcode',
        'dvsa_test_centers.address',
        'dvsa_test_centers.region'
      )
      .join('dvsa_test_centers', 'driving_test_slots.center_id', 'dvsa_test_centers.center_id')
      .where('driving_test_slots.available', true)
      .where('dvsa_test_centers.is_active', true);

    // Apply filters
    if (filters.test_type) {
      query = query.where('driving_test_slots.test_type', filters.test_type);
    }

    if (filters.center_ids && Array.isArray(filters.center_ids)) {
      query = query.whereIn('driving_test_slots.center_id', filters.center_ids);
    }

    if (filters.date_from) {
      query = query.where('driving_test_slots.date', '>=', filters.date_from);
    }

    if (filters.date_to) {
      query = query.where('driving_test_slots.date', '<=', filters.date_to);
    }

    return await query.orderBy('driving_test_slots.date').orderBy('driving_test_slots.time');
  }

  static async findById(slotId) {
    return await db('driving_test_slots')
      .select(
        'driving_test_slots.*',
        'dvsa_test_centers.name as center_name',
        'dvsa_test_centers.postcode',
        'dvsa_test_centers.address',
        'dvsa_test_centers.region'
      )
      .join('dvsa_test_centers', 'driving_test_slots.center_id', 'dvsa_test_centers.center_id')
      .where('driving_test_slots.slot_id', slotId)
      .first();
  }

  static async findByCenter(centerId, testType = null) {
    let query = db('driving_test_slots')
      .where('center_id', centerId)
      .where('available', true);

    if (testType) {
      query = query.where('test_type', testType);
    }

    return await query.orderBy('date').orderBy('time');
  }

  static async create(slotData) {
    try {
      const [slot] = await db('driving_test_slots')
        .insert({
          ...slotData,
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
          last_checked: db.fn.now()
        })
        .returning('*');
      
      return slot;
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return null; // Slot already exists
      }
      throw error;
    }
  }

  static async update(slotId, updateData) {
    const [slot] = await db('driving_test_slots')
      .where('slot_id', slotId)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    return slot;
  }

  static async markUnavailable(slotId) {
    return await this.update(slotId, { 
      available: false,
      last_checked: db.fn.now() 
    });
  }

  static async markAvailable(slotId) {
    return await this.update(slotId, { 
      available: true,
      last_checked: db.fn.now() 
    });
  }

  static async bulkCreate(slotsData) {
    return await db.transaction(async (trx) => {
      const insertPromises = slotsData.map(slot => 
        trx('driving_test_slots')
          .insert({
            ...slot,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now(),
            last_checked: trx.fn.now()
          })
          .onConflict(['center_id', 'test_type', 'date', 'time'])
          .merge(['available', 'updated_at', 'last_checked'])
      );
      
      return await Promise.all(insertPromises);
    });
  }

  static async getRecentlyAvailable(hours = 1) {
    return await db('driving_test_slots')
      .select(
        'driving_test_slots.*',
        'dvsa_test_centers.name as center_name',
        'dvsa_test_centers.postcode',
        'dvsa_test_centers.region'
      )
      .join('dvsa_test_centers', 'driving_test_slots.center_id', 'dvsa_test_centers.center_id')
      .where('driving_test_slots.available', true)
      .where('driving_test_slots.updated_at', '>=', db.raw(`NOW() - INTERVAL '${hours} hours'`))
      .orderBy('driving_test_slots.updated_at', 'desc');
  }

  static async getSlotsByDateRange(centerId, testType, dateFrom, dateTo) {
    return await db('driving_test_slots')
      .where('center_id', centerId)
      .where('test_type', testType)
      .whereBetween('date', [dateFrom, dateTo])
      .where('available', true)
      .orderBy('date')
      .orderBy('time');
  }

  static async getAvailabilityStats() {
    return await db('driving_test_slots')
      .select(
        'dvsa_test_centers.region',
        'driving_test_slots.test_type'
      )
      .count('driving_test_slots.slot_id as total_slots')
      .sum(db.raw('CASE WHEN driving_test_slots.available THEN 1 ELSE 0 END as available_slots'))
      .join('dvsa_test_centers', 'driving_test_slots.center_id', 'dvsa_test_centers.center_id')
      .groupBy('dvsa_test_centers.region', 'driving_test_slots.test_type')
      .orderBy('dvsa_test_centers.region');
  }

  static async cleanupOldSlots() {
    // Remove slots older than 1 day in the past
    return await db('driving_test_slots')
      .where('date', '<', db.raw('CURRENT_DATE'))
      .del();
  }
}

module.exports = DrivingTestSlot;
