const db = require('../config/database');

class TestCenter {
  static async findAll() {
    return await db('dvsa_test_centers')
      .select('*')
      .where('is_active', true)
      .orderBy('name');
  }

  static async findById(centerId) {
    return await db('dvsa_test_centers')
      .where('center_id', centerId)
      .first();
  }

  static async findByPostcode(postcode) {
    return await db('dvsa_test_centers')
      .where('postcode', postcode)
      .where('is_active', true);
  }

  static async findByRegion(region) {
    return await db('dvsa_test_centers')
      .where('region', region)
      .where('is_active', true)
      .orderBy('name');
  }

  static async findNearby(latitude, longitude, radiusMiles = 25) {
    // Using Haversine formula to calculate distance
    const radiusKm = radiusMiles * 1.60934;
    
    return await db('dvsa_test_centers')
      .select('*')
      .select(db.raw(`
        ( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) 
        * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) 
        * sin( radians( latitude ) ) ) ) AS distance_km
      `, [latitude, longitude, latitude]))
      .where('is_active', true)
      .havingRaw('distance_km <= ?', [radiusKm])
      .orderBy('distance_km');
  }

  static async create(centerData) {
    const [center] = await db('dvsa_test_centers')
      .insert({
        ...centerData,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('*');
    
    return center;
  }

  static async update(centerId, updateData) {
    const [center] = await db('dvsa_test_centers')
      .where('center_id', centerId)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    return center;
  }

  static async search(searchTerm) {
    return await db('dvsa_test_centers')
      .where('is_active', true)
      .where(function() {
        this.where('name', 'ilike', `%${searchTerm}%`)
            .orWhere('postcode', 'ilike', `%${searchTerm}%`)
            .orWhere('address', 'ilike', `%${searchTerm}%`)
            .orWhere('region', 'ilike', `%${searchTerm}%`);
      })
      .orderBy('name');
  }

  static async getRegions() {
    return await db('dvsa_test_centers')
      .distinct('region')
      .where('is_active', true)
      .orderBy('region');
  }

  static async getTestCenterStats() {
    return await db('dvsa_test_centers')
      .select('region')
      .count('center_id as total_centers')
      .where('is_active', true)
      .groupBy('region')
      .orderBy('region');
  }
}

module.exports = TestCenter;
