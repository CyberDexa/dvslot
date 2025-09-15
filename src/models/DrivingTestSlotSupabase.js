const { supabase } = require('../../supabase-config');

class DrivingTestSlotSupabase {
  static async findAll(filters = {}) {
    let query = supabase
      .from('driving_test_slots')
      .select(`
        *,
        dvsa_test_centers!inner(
          name,
          postcode,
          address,
          region
        )
      `)
      .eq('available', true)
      .eq('dvsa_test_centers.is_active', true);

    // Apply filters
    if (filters.test_type) {
      query = query.eq('test_type', filters.test_type);
    }

    if (filters.center_ids && Array.isArray(filters.center_ids)) {
      query = query.in('center_id', filters.center_ids);
    }

    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }

    const { data, error } = await query.order('date').order('time');
    
    if (error) {
      throw new Error(`Failed to fetch slots: ${error.message}`);
    }

    // Transform data to match expected format
    return (data || []).map(slot => ({
      slot_id: slot.slot_id,
      center_id: slot.center_id,
      test_type: slot.test_type,
      date: slot.date,
      time: slot.time,
      available: slot.available,
      created_at: slot.created_at,
      updated_at: slot.updated_at,
      last_checked: slot.last_checked,
      center_name: slot.dvsa_test_centers?.name,
      postcode: slot.dvsa_test_centers?.postcode,
      address: slot.dvsa_test_centers?.address,
      region: slot.dvsa_test_centers?.region
    }));
  }

  static async findById(slotId) {
    const { data, error } = await supabase
      .from('driving_test_slots')
      .select(`
        *,
        dvsa_test_centers!inner(
          name,
          postcode,
          address,
          region
        )
      `)
      .eq('slot_id', slotId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch slot: ${error.message}`);
    }

    // Transform data to match expected format
    return {
      slot_id: data.slot_id,
      center_id: data.center_id,
      test_type: data.test_type,
      date: data.date,
      time: data.time,
      available: data.available,
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_checked: data.last_checked,
      center_name: data.dvsa_test_centers?.name,
      postcode: data.dvsa_test_centers?.postcode,
      address: data.dvsa_test_centers?.address,
      region: data.dvsa_test_centers?.region
    };
  }

  static async getRecentlyAvailable(hours = 1) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const { data, error } = await supabase
      .from('driving_test_slots')
      .select(`
        *,
        dvsa_test_centers!inner(
          name,
          postcode,
          region
        )
      `)
      .eq('available', true)
      .gte('updated_at', cutoffTime.toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recent slots: ${error.message}`);
    }

    return (data || []).map(slot => ({
      slot_id: slot.slot_id,
      center_id: slot.center_id,
      test_type: slot.test_type,
      date: slot.date,
      time: slot.time,
      available: slot.available,
      updated_at: slot.updated_at,
      center_name: slot.dvsa_test_centers?.name,
      postcode: slot.dvsa_test_centers?.postcode,
      region: slot.dvsa_test_centers?.region
    }));
  }

  static async getAvailabilityStats() {
    const { data, error } = await supabase
      .from('driving_test_slots')
      .select(`
        test_type,
        available,
        dvsa_test_centers!inner(region)
      `);

    if (error) {
      throw new Error(`Failed to fetch availability stats: ${error.message}`);
    }

    // Group by region and test_type
    const stats = {};
    data.forEach(slot => {
      const region = slot.dvsa_test_centers.region;
      const testType = slot.test_type;
      const key = `${region}-${testType}`;
      
      if (!stats[key]) {
        stats[key] = {
          region,
          test_type: testType,
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
}

module.exports = DrivingTestSlotSupabase;