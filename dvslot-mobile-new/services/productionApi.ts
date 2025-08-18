import { supabase as sharedSupabase } from './supabase';
import { platformStorage } from './storage';

// Always reuse the shared Supabase client to avoid multiple auth clients on web
const supabase = sharedSupabase;

// API Configuration - HARDCODED to fix environment variable issue
const API_BASE_URL = 'https://dvslot-api.onrender.com';

// Consider only slots updated within this window to reduce stale results
const FRESHNESS_HOURS = 2;
const freshnessIso = () => new Date(Date.now() - FRESHNESS_HOURS * 60 * 60 * 1000).toISOString();
const DEFAULT_TIMEOUT_MS = 12000; // 12s network guard on web

function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS, label = 'operation'): Promise<T> {
  let timeoutId: any;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeout])
    .finally(() => clearTimeout(timeoutId));
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, ms = DEFAULT_TIMEOUT_MS, label = 'fetch') {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal });
    return res;
  } catch (e) {
    console.error(`${label} error:`, e);
    throw e;
  } finally {
    clearTimeout(id);
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TestCenter {
  id: string;
  center_code: string;
  name: string;
  address: string;
  postcode: string;
  city: string;
  region: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  availability: number;
  distance?: number;
  is_active: boolean;
}

export interface TestSlot {
  id: string;
  center_id: string;
  center_name: string;
  test_type: 'practical' | 'theory';
  date: string;
  time: string;
  available: boolean;
  last_checked: string;
  created_at: string;
  updated_at?: string;
}

export interface UserAlert {
  id: string;
  user_id: string;
  subscription_id: string;
  message: string;
  sent: boolean;
  sent_at: string | null;
  notification_method: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  role_id: number;
}

export interface SearchFilters {
  postcode: string;
  radius: number;
  dateRange?: {
    start: string;
    end: string;
  };
  testType?: 'practical' | 'theory';
  maxResults?: number;
}

class DVSlotProductionAPI {
  private currentUser: any = null;

  constructor() {
    console.log('🚀 DVSlot Production API initialized with 318 UK centers');
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      console.log(`Auth event: ${event}`, this.currentUser?.email);
    });
  }

  // Helper function to calculate distance between two points
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Helper function to get coordinates from postcode
  private async getCoordinatesFromPostcode(postcode: string): Promise<{latitude: number, longitude: number} | null> {
    try {
      // First try using our backend API as a proxy to bypass CSP issues
      try {
        const backendUrl = `${API_BASE_URL}/postcode/${encodeURIComponent(postcode)}`;
        console.log('🔍 Trying backend postcode API:', backendUrl);
        const response = await fetchWithTimeout(backendUrl, undefined, 8000, 'backend postcode lookup');
        const data = await response.json();
        
        if (data.success && data.latitude && data.longitude) {
          console.log('✅ Backend postcode lookup successful');
          return {
            latitude: data.latitude,
            longitude: data.longitude
          };
        }
      } catch (backendError) {
        console.log('⚠️ Backend postcode lookup failed, trying direct API:', backendError);
      }

      // Fallback to direct postcodes.io API (may be blocked by CSP)
      const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`;
      const response = await fetchWithTimeout(url, undefined, 8000, 'postcodes.io lookup');
      const data = await response.json();
      
      if (data.status === 200 && data.result) {
        return {
          latitude: data.result.latitude,
          longitude: data.result.longitude
        };
      }
      // Fallback for some Scottish/Northern Ireland formats: try stripping spaces
      if (postcode.includes(' ')) {
        const compact = postcode.replace(/\s+/g, '');
        const r2 = await fetchWithTimeout(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`, undefined, 6000, 'postcodes.io compact lookup');
        const d2 = await r2.json();
        if (d2.status === 200 && d2.result) {
          return { latitude: d2.result.latitude, longitude: d2.result.longitude };
        }
      }
    } catch (error) {
      console.error('Postcode lookup error:', error);
    }
    return null;
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      this.currentUser = data.user;

      return {
        success: true,
        data: {
          user: data.user,
          token: data.session?.access_token || '',
        },
        message: 'Login successful',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    }
  }

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: {
          user: data.user,
          token: data.session?.access_token || '',
        },
        message: 'Registration successful',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      // Clear any cached profile
      try { await platformStorage.multiRemove(['dvslot_user_profile']); } catch {}
      this.currentUser = null;
      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Logout failed',
      };
    }
  }

  // Test center methods - using our 318 UK centers database
  async searchTestCenters(filters: SearchFilters): Promise<ApiResponse<TestCenter[]>> {
    try {
      console.log(`🔍 Searching 318 UK test centers near ${filters.postcode} within ${filters.radius} miles`);

      // Get coordinates for the postcode
      const coords = await this.getCoordinatesFromPostcode(filters.postcode);
      if (!coords) {
        return {
          success: false,
          error: 'Invalid postcode. Please enter a valid UK postcode.',
        };
      }

      // Query our database for all active centers
      let query = supabase
        .from('dvsa_test_centers')
        .select(`
          center_id,
          center_code,
          name,
          address,
          postcode,
          city,
          region,
          latitude,
          longitude,
          is_active
        `)
        .eq('is_active', true);

      // Apply limit if specified
      if (filters.maxResults) {
        query = query.limit(filters.maxResults);
      }

  const { data: centers, error } = await query;

      if (error) {
        console.error('Database query error:', error);
        return {
          success: false,
          error: 'Failed to search test centers',
        };
      }

      if (!centers || centers.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No test centers found',
        };
      }

      // Calculate distances and filter by radius if coords found; otherwise return prefix-matched set without distance
      let centersWithDistance: TestCenter[] = [];

      if (coords) {
        centersWithDistance = centers
          .map((center: any) => {
            const distance = this.calculateDistance(
              coords.latitude,
              coords.longitude,
              parseFloat(center.latitude as any),
              parseFloat(center.longitude as any)
            );

            return {
              id: center.center_id.toString(),
              center_code: center.center_code,
              name: center.name,
              address: center.address || '',
              postcode: center.postcode,
              city: center.city || '',
              region: center.region || '',
              coordinates: {
                latitude: parseFloat(center.latitude as any),
                longitude: parseFloat(center.longitude as any),
              },
              distance: Math.round(distance * 10) / 10,
              availability: 0,
              is_active: center.is_active,
            } as TestCenter;
          })
          .filter((center: TestCenter) => (center.distance ?? Infinity) <= filters.radius)
          .sort((a: TestCenter, b: TestCenter) => (a.distance || 0) - (b.distance || 0));
      } else {
        // Fallback: filter centers by postcode outward code prefix
        const outward = (filters.postcode || '').trim().toUpperCase().split(' ')[0];
        const filtered = (centers as any[]).filter(c => (c.postcode || '').toUpperCase().startsWith(outward));
        centersWithDistance = (filtered.length ? filtered : centers).map((center: any) => ({
          id: center.center_id.toString(),
          center_code: center.center_code,
          name: center.name,
          address: center.address || '',
          postcode: center.postcode,
          city: center.city || '',
          region: center.region || '',
          coordinates: {
            latitude: parseFloat(center.latitude as any),
            longitude: parseFloat(center.longitude as any),
          },
          // distance unknown in fallback
          availability: 0,
          is_active: center.is_active,
        }));
      }

      // Get availability counts for these centers
      if (centersWithDistance.length > 0) {
        const centerIds = centersWithDistance.map(c => parseInt(c.id));
        
  let slotQuery = supabase
          .from('driving_test_slots')
          .select('center_id')
          .in('center_id', centerIds)
          .eq('available', true)
          .gte('date', new Date().toISOString().split('T')[0]) // Today or later
          .gte('updated_at', freshnessIso()); // Only recently updated

        // Apply test type filter if specified
        if (filters.testType) {
          slotQuery = slotQuery.eq('test_type', filters.testType);
        }

        // Apply date range filter if specified
        if (filters.dateRange) {
          slotQuery = slotQuery
            .gte('date', filters.dateRange.start)
            .lte('date', filters.dateRange.end);
        }

  const { data: slots } = await slotQuery;

        if (slots) {
          // Count slots per center
          const slotCounts: { [key: string]: number } = {};
          slots.forEach((slot: any) => {
            const centerId = slot.center_id.toString();
            slotCounts[centerId] = (slotCounts[centerId] || 0) + 1;
          });

          // Update availability counts
          centersWithDistance.forEach((center: any) => {
            center.availability = slotCounts[center.id] || 0;
          });
        }
      }

      return {
        success: true,
        data: centersWithDistance,
        message: `Found ${centersWithDistance.length} test centers within ${filters.radius} miles of ${filters.postcode}`,
      };
    } catch (error) {
      console.error('Search test centers error:', error);
      return {
        success: false,
        error: 'Failed to search test centers. Please try again.',
      };
    }
  }

  async getTestCenter(id: string): Promise<ApiResponse<TestCenter>> {
    try {
      const { data: center, error } = await supabase
        .from('dvsa_test_centers')
        .select(`
          center_id,
          center_code,
          name,
          address,
          postcode,
          city,
          region,
          latitude,
          longitude,
          is_active
        `)
        .eq('center_id', parseInt(id))
        .single();

      if (error || !center) {
        return {
          success: false,
          error: 'Test center not found',
        };
      }

      // Get availability count
      const { data: slots } = await supabase
        .from('driving_test_slots')
        .select('slot_id')
        .eq('center_id', center.center_id)
        .eq('available', true)
        .gte('date', new Date().toISOString().split('T')[0]);

      const testCenter: TestCenter = {
        id: center.center_id.toString(),
        center_code: center.center_code,
        name: center.name,
        address: center.address || '',
        postcode: center.postcode,
        city: center.city || '',
        region: center.region || '',
        coordinates: {
          latitude: parseFloat(center.latitude as any),
          longitude: parseFloat(center.longitude as any),
        },
        availability: slots?.length || 0,
        is_active: center.is_active,
      };

      return {
        success: true,
        data: testCenter,
        message: 'Test center retrieved successfully',
      };
    } catch (error) {
      console.error('Get test center error:', error);
      return {
        success: false,
        error: 'Failed to get test center details',
      };
    }
  }

  // Test slot methods
  async searchTestSlots(filters: SearchFilters): Promise<ApiResponse<TestSlot[]>> {
    try {
      console.log(`🎯 Searching test slots near ${filters.postcode}`);

      // First get test centers within radius
      const centersResponse = await this.searchTestCenters({
        ...filters,
        maxResults: 50, // Limit centers for performance
      });

      if (!centersResponse.success || !centersResponse.data || centersResponse.data.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No test centers found in your area',
        };
      }

      const centerIds = centersResponse.data.map(c => parseInt(c.id));

      // Query slots for these centers
  let slotQuery = supabase
        .from('driving_test_slots')
        .select(`
          slot_id,
          center_id,
          test_type,
          date,
          time,
          available,
          last_checked,
          created_at,
          updated_at
        `)
        .in('center_id', centerIds)
        .eq('available', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .gte('updated_at', freshnessIso())
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(100); // Limit results for performance

      // Apply test type filter
      if (filters.testType) {
        slotQuery = slotQuery.eq('test_type', filters.testType);
      }

      // Apply date range filter
      if (filters.dateRange) {
        slotQuery = slotQuery
          .gte('date', filters.dateRange.start)
          .lte('date', filters.dateRange.end);
      }

  const { data: slots, error } = await slotQuery;

      if (error) {
        console.error('Slots query error:', error);
        return {
          success: false,
          error: 'Failed to search test slots',
        };
      }

      if (!slots || slots.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No available slots found. Consider widening your search criteria or setting up an alert.',
        };
      }

      // Map center names to slots
      const centerMap = new Map(centersResponse.data.map(c => [parseInt(c.id), c.name]));

      const testSlots: TestSlot[] = (slots as any[])
        // Extra client-side freshness guard in case some rows miss updated_at
        .filter((s: any) => {
          const updated = s.updated_at || s.last_checked || s.created_at;
          return updated && new Date(updated) >= new Date(freshnessIso());
        })
        .map((slot: any) => ({
        id: slot.slot_id.toString(),
        center_id: slot.center_id.toString(),
        center_name: centerMap.get(slot.center_id) || 'Unknown Center',
        test_type: slot.test_type as 'practical' | 'theory',
        date: slot.date,
        time: slot.time,
        available: slot.available,
        last_checked: slot.last_checked || slot.created_at,
        created_at: slot.created_at,
      }));

      return {
        success: true,
        data: testSlots,
        message: `Found ${testSlots.length} available test slots`,
      };
    } catch (error) {
      console.error('Search test slots error:', error);
      return {
        success: false,
        error: 'Failed to search test slots. Please try again.',
      };
    }
  }

  async getAvailableSlots(filters: SearchFilters): Promise<ApiResponse<TestSlot[]>> {
    return this.searchTestSlots(filters);
  }

  // User profile methods
  async getUserProfile(): Promise<ApiResponse<any>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          created_at: user.created_at,
        },
        message: 'Profile retrieved successfully',
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: 'Failed to get user profile',
      };
    }
  }

  // Alert methods
  async getUserAlerts(): Promise<ApiResponse<UserAlert[]>> {
    try {
      if (!this.currentUser) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const { data: alerts, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get alerts error:', error);
        return {
          success: false,
          error: 'Failed to get alerts',
        };
      }

      return {
        success: true,
        data: alerts || [],
        message: 'Alerts retrieved successfully',
      };
    } catch (error) {
      console.error('Get user alerts error:', error);
      return {
        success: false,
        error: 'Failed to get alerts',
      };
    }
  }

  // Statistics methods
  async getSystemStatistics(): Promise<ApiResponse<{
    totalCenters: number;
    totalSlots: number;
    availableSlots: number;
    regions: number;
    lastUpdated: string;
  }>> {
    try {
      // Get center statistics
      const { data: centerStats } = await supabase
        .from('dvsa_test_centers')
        .select('center_id, region, updated_at')
        .eq('is_active', true);

      // Get slot statistics
      const { data: slotStats } = await supabase
        .from('driving_test_slots')
        .select('slot_id, available, updated_at')
        .gte('date', new Date().toISOString().split('T')[0]);

      const totalCenters = centerStats?.length || 0;
      const regions = new Set(centerStats?.map(c => c.region).filter(Boolean)).size;
      const totalSlots = slotStats?.length || 0;
      const availableSlots = slotStats?.filter(s => s.available).length || 0;

      // Get last updated timestamp
      const lastUpdated = slotStats?.reduce((latest, slot) => {
        const slotDate = new Date(slot.updated_at);
        return slotDate > latest ? slotDate : latest;
      }, new Date(0))?.toISOString() || new Date().toISOString();

      return {
        success: true,
        data: {
          totalCenters,
          totalSlots,
          availableSlots,
          regions,
          lastUpdated,
        },
        message: 'Statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Get system statistics error:', error);
      return {
        success: false,
        error: 'Failed to get statistics',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; centers: number }>> {
    try {
      const { data: centers, error } = await supabase
        .from('dvsa_test_centers')
        .select('center_id')
        .eq('is_active', true)
        .limit(1);

      if (error) {
        return {
          success: false,
          error: 'Database connection failed',
        };
      }

      const { count: totalCenters } = await supabase
        .from('dvsa_test_centers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      return {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          centers: totalCenters || 0,
        },
        message: 'DVSlot API is running with 318 UK centers',
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        success: false,
        error: 'Health check failed',
      };
    }
  }
}

export const productionApi = new DVSlotProductionAPI();
export default productionApi;
