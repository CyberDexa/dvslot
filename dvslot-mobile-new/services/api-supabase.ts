import { supabase } from './supabase';
import { authService, UserProfile } from './auth-supabase';

// Types
export interface TestCenter {
  id: string;
  name: string;
  address: string;
  postcode: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  phone_number?: string;
  is_active: boolean;
}

export interface DrivingTestSlot {
  id: string;
  test_center_id: string;
  date: string;
  time: string;
  is_available: boolean;
  test_type: string;
  price: number;
  instructor_name?: string;
  test_center?: TestCenter;
}

export interface Alert {
  id: string;
  user_id: string;
  test_center_id: string;
  preferred_dates: string[];
  preferred_times: string[];
  max_price: number;
  status: 'active' | 'paused' | 'completed';
  notification_types: ('email' | 'push' | 'sms')[];
  last_notification_at?: string;
  created_at: string;
  updated_at: string;
  test_center?: TestCenter;
}

export interface UserPreference {
  id: string;
  user_id: string;
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
  alert_frequency: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

class SupabaseAPIService {
  constructor() {
    // Service is ready to use immediately
  }

  // Test Centers
  async getTestCenters(filters?: {
    search?: string;
    region?: string;
    postcode?: string;
  }): Promise<TestCenter[]> {
    try {
      let query = supabase
        .from('test_centers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,postcode.ilike.%${filters.search}%`);
      }

      if (filters?.region) {
        query = query.eq('region', filters.region);
      }

      if (filters?.postcode) {
        query = query.ilike('postcode', `${filters.postcode}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching test centers:', error);
      return [];
    }
  }

  async getTestCenter(id: string): Promise<TestCenter | null> {
    try {
      const { data, error } = await supabase
        .from('test_centers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching test center:', error);
      return null;
    }
  }

  // Driving Test Slots
  async getAvailableSlots(filters?: {
    test_center_id?: string;
    date_from?: string;
    date_to?: string;
    max_price?: number;
  }): Promise<DrivingTestSlot[]> {
    try {
      let query = supabase
        .from('driving_test_slots')
        .select(`
          *,
          test_center:test_centers(*)
        `)
        .eq('is_available', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('time');

      if (filters?.test_center_id) {
        query = query.eq('test_center_id', filters.test_center_id);
      }

      if (filters?.date_from) {
        query = query.gte('date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('date', filters.date_to);
      }

      if (filters?.max_price) {
        query = query.lte('price', filters.max_price);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching slots:', error);
      return [];
    }
  }

  // User Alerts
  async getUserAlerts(): Promise<Alert[]> {
    try {
      const { user } = authService.getAuthState();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          test_center:test_centers(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user alerts:', error);
      return [];
    }
  }

  async createAlert(alertData: {
    test_center_id: string;
    preferred_dates?: string[];
    preferred_times?: string[];
    max_price?: number;
    notification_types?: ('email' | 'push' | 'sms')[];
  }): Promise<Alert | null> {
    try {
      const { user } = authService.getAuthState();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('alerts')
        .insert({
          user_id: user.id,
          test_center_id: alertData.test_center_id,
          preferred_dates: alertData.preferred_dates || [],
          preferred_times: alertData.preferred_times || [],
          max_price: alertData.max_price || 62.00,
          notification_types: alertData.notification_types || ['push'],
          status: 'active'
        })
        .select(`
          *,
          test_center:test_centers(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating alert:', error);
      return null;
    }
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    try {
      const { user } = authService.getAuthState();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('alerts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          test_center:test_centers(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating alert:', error);
      return null;
    }
  }

  async deleteAlert(id: string): Promise<boolean> {
    try {
      const { user } = authService.getAuthState();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting alert:', error);
      return false;
    }
  }

  // User Preferences
  async getUserPreferences(): Promise<UserPreference | null> {
    try {
      const { user } = authService.getAuthState();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no preferences exist, create default ones
      if (!data) {
        return await this.createDefaultPreferences();
      }

      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  private async createDefaultPreferences(): Promise<UserPreference | null> {
    try {
      const { user } = authService.getAuthState();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          notification_email: true,
          notification_push: true,
          notification_sms: false,
          alert_frequency: 15,
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
          timezone: 'Europe/London'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(updates: Partial<UserPreference>): Promise<UserPreference | null> {
    try {
      const { user } = authService.getAuthState();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return null;
    }
  }

  // Real-time subscriptions
  subscribeToNewSlots(callback: (slot: DrivingTestSlot) => void) {
    const channel = supabase
      .channel('new-slots')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driving_test_slots',
          filter: 'is_available=eq.true'
        },
        (payload) => {
          console.log('New slot available:', payload.new);
          callback(payload.new as DrivingTestSlot);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToAlertUpdates(callback: (alert: Alert) => void) {
    const { user } = authService.getAuthState();
    if (!user) return () => {};

    const channel = supabase
      .channel('alert-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Alert updated:', payload);
          callback(payload.new as Alert);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const apiService = new SupabaseAPIService();

// Legacy exports for backward compatibility
export { apiService as api };
export type { UserProfile };
