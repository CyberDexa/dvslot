import { supabase } from './supabase';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TestCenter {
  id: string;
  name: string;
  address: string;
  postcode: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  is_active: boolean;
  availability?: number;
  distance?: number;
}

export interface TestSlot {
  id: string;
  test_center_id: string;
  centerName?: string;
  date: string;
  time: string;
  is_available: boolean;
  test_type: 'practical' | 'theory';
  price: number;
  last_checked_at: string;
}

export interface SearchFilters {
  postcode?: string;
  radius?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  region?: string;
  city?: string;
}

export interface UserAlert {
  id: string;
  user_id: string;
  test_center_id?: string;
  preferred_dates?: string[];
  preferred_times?: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

class DVSlotSupabaseAPI {
  // Test Centers
  async getAllTestCenters(): Promise<ApiResponse<TestCenter[]>> {
    try {
      const { data, error } = await supabase
        .from('test_centers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
        message: `Found ${data?.length || 0} test centers across the UK`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async searchTestCenters(filters: SearchFilters): Promise<ApiResponse<TestCenter[]>> {
    try {
      let query = supabase
        .from('test_centers')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.region) {
        query = query.eq('region', filters.region);
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.postcode) {
        // For postcode search, we'll search by city or region since exact postcode matching is complex
        const postcodePrefix = filters.postcode.substring(0, 2).toUpperCase();
        query = query.or(`postcode.ilike.${postcodePrefix}%,city.ilike.%${filters.postcode}%`);
      }

      const { data, error } = await query.order('name');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Get availability for each center
      const centersWithAvailability = await Promise.all(
        (data || []).map(async (center) => {
          const { data: slots, error: slotsError } = await supabase
            .from('driving_test_slots')
            .select('id')
            .eq('test_center_id', center.id)
            .eq('is_available', true)
            .gte('date', new Date().toISOString().split('T')[0]);

          return {
            ...center,
            availability: slotsError ? 0 : (slots?.length || 0),
          };
        })
      );

      return {
        success: true,
        data: centersWithAvailability,
        message: `Found ${centersWithAvailability.length} test centers`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test Slots
  async getAvailableSlots(filters: SearchFilters): Promise<ApiResponse<TestSlot[]>> {
    try {
      let query = supabase
        .from('driving_test_slots')
        .select(`
          *,
          test_centers!inner (
            id,
            name,
            city,
            region,
            postcode
          )
        `)
        .eq('is_available', true)
        .gte('date', new Date().toISOString().split('T')[0]);

      // Apply date range filter
      if (filters.dateRange?.start) {
        query = query.gte('date', filters.dateRange.start);
      }
      if (filters.dateRange?.end) {
        query = query.lte('date', filters.dateRange.end);
      }

      // Apply location filters
      if (filters.region) {
        query = query.eq('test_centers.region', filters.region);
      }
      
      if (filters.city) {
        query = query.ilike('test_centers.city', `%${filters.city}%`);
      }

      const { data, error } = await query
        .order('date')
        .order('time')
        .limit(100); // Limit results for performance

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Transform data to include center name
      const transformedData = (data || []).map((slot: any) => ({
        ...slot,
        centerName: slot.test_centers?.name || 'Unknown Center',
      }));

      return {
        success: true,
        data: transformedData,
        message: `Found ${transformedData.length} available slots`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTestCenterSlots(testCenterId: string): Promise<ApiResponse<TestSlot[]>> {
    try {
      const { data, error } = await supabase
        .from('driving_test_slots')
        .select(`
          *,
          test_centers (name)
        `)
        .eq('test_center_id', testCenterId)
        .eq('is_available', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('time')
        .limit(50);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
        message: `Found ${data?.length || 0} available slots`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Regions and Statistics
  async getRegionSummary(): Promise<ApiResponse<{
    region: string;
    test_centers_count: number;
    available_slots: number;
    total_slots: number;
  }[]>> {
    try {
      const { data, error } = await supabase
        .from('slots_by_region')
        .select('*');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
        message: `Found statistics for ${data?.length || 0} regions`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Advanced search with materialized view
  async searchAvailableSlots(filters: SearchFilters): Promise<ApiResponse<{
    test_center_id: string;
    test_center_name: string;
    city: string;
    region: string;
    postcode: string;
    date: string;
    time: string;
    price: number;
    days_from_now: number;
  }[]>> {
    try {
      let query = supabase
        .from('mv_available_slots')
        .select('*');

      if (filters.region) {
        query = query.eq('region', filters.region);
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.dateRange?.start) {
        query = query.gte('date', filters.dateRange.start);
      }

      if (filters.dateRange?.end) {
        query = query.lte('date', filters.dateRange.end);
      }

      const { data, error } = await query
        .order('date')
        .order('time')
        .limit(200);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
        message: `Found ${data?.length || 0} available slots using optimized search`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // User Alerts (if user is authenticated)
  async createAlert(alertData: {
    test_center_id?: string;
    preferred_dates?: string[];
    preferred_times?: string[];
  }): Promise<ApiResponse<UserAlert>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const { data, error } = await supabase
        .from('alerts')
        .insert({
          user_id: user.id,
          ...alertData,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data,
        message: 'Alert created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getUserAlerts(): Promise<ApiResponse<UserAlert[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const { data, error } = await supabase
        .from('user_alerts')
        .select(`
          *,
          test_centers (
            name,
            city,
            region
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
        message: `Found ${data?.length || 0} alerts`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Delete user alert
  async deleteUserAlert(alertId: string): Promise<ApiResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id); // Security: only delete own alerts

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Alert deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Database health and stats
  async getDatabaseStats(): Promise<ApiResponse<{
    totalCenters: number;
    totalSlots: number;
    availableSlots: number;
    regionsCount: number;
    lastUpdated: string;
  }>> {
    try {
      const [centersResult, slotsResult, availableSlotsResult, regionsResult] = await Promise.all([
        supabase.from('test_centers').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('driving_test_slots').select('id', { count: 'exact' }),
        supabase.from('driving_test_slots').select('id', { count: 'exact' }).eq('is_available', true).gte('date', new Date().toISOString().split('T')[0]),
        supabase.from('test_centers').select('region', { count: 'exact' }).eq('is_active', true)
      ]);

      const stats = {
        totalCenters: centersResult.count || 0,
        totalSlots: slotsResult.count || 0,
        availableSlots: availableSlotsResult.count || 0,
        regionsCount: new Set(regionsResult.data?.map(r => r.region)).size || 0,
        lastUpdated: new Date().toISOString(),
      };

      return {
        success: true,
        data: stats,
        message: 'Database statistics retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const supabaseApi = new DVSlotSupabaseAPI();
