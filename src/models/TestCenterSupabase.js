const { supabase } = require('../../supabase-config');

class TestCenterSupabase {
  static async findAll() {
    const { data, error } = await supabase
      .from('dvsa_test_centers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch test centers: ${error.message}`);
    }

    return data || [];
  }

  static async findById(centerId) {
    const { data, error } = await supabase
      .from('dvsa_test_centers')
      .select('*')
      .eq('center_id', centerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch test center: ${error.message}`);
    }

    return data;
  }

  static async findByPostcode(postcode) {
    const { data, error } = await supabase
      .from('dvsa_test_centers')
      .select('*')
      .eq('postcode', postcode)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch test centers by postcode: ${error.message}`);
    }

    return data || [];
  }

  static async search(searchTerm) {
    const { data, error } = await supabase
      .from('dvsa_test_centers')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,postcode.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`)
      .order('name');

    if (error) {
      throw new Error(`Failed to search test centers: ${error.message}`);
    }

    return data || [];
  }

  static async findNearby(latitude, longitude, radiusMiles = 25) {
    // Note: This is a simplified implementation
    // For precise geographic distance calculations, you'd want to use PostGIS functions
    // For now, we'll return all centers and let the frontend handle distance calculations
    
    console.warn('findNearby: Using simplified implementation - returning all centers');
    return await this.findAll();
  }
}

module.exports = TestCenterSupabase;