import Constants from 'expo-constants';
import { productionApi } from './productionApi';
import { platformStorage } from './storage';

// DVSlot Backend API Configuration (Environment-aware)
const getApiBaseUrl = () => {
  // Check if we're in development environment
  if (typeof window !== 'undefined') {
    // Web development environment detection
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('expo')) {
      return 'http://localhost:3000';
    }
  }
  
  // Check for Expo development
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Production fallback
  return 'https://dvslot-api.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();
const API_VERSION = 'api/v1';
const BACKEND_TOKEN_KEY = 'dvslot_backend_jwt';

// Use production API with 318 UK centers
const useProductionAPI = true;

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
  coordinates: {
    latitude: number;
    longitude: number;
  };
  availability: number;
  distance?: number;
}

export interface TestSlot {
  id: string;
  centerId: string;
  centerName: string;
  date: string;
  time: string;
  type: 'practical' | 'theory';
  price: number;
  available: boolean;
  lastUpdated: string;
}

export interface UserAlert {
  id: string;
  type: 'new_slot' | 'cancellation' | 'price_drop';
  title: string;
  description: string;
  isActive: boolean;
  created: string;
  centerId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  preferredTestCenters: string[];
  notificationSettings: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  subscription: {
    type: 'free' | 'premium';
    expiresAt?: string;
  };
}

export interface SearchFilters {
  postcode: string;
  radius: number;
  dateRange?: {
    start: string;
    end: string;
  };
  testType?: 'practical' | 'theory';
  automaticOnly?: boolean;
}

class DVSlotAPI {
  private baseUrl: string;
  private apiVersion: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiVersion = API_VERSION;
  }

  // Authentication methods
  setAuthToken(token: string) {
    this.authToken = token;
  try { platformStorage.setItem(BACKEND_TOKEN_KEY, token); } catch {}
  }

  clearAuthToken() {
    this.authToken = null;
    try { platformStorage.removeItem(BACKEND_TOKEN_KEY); } catch {}
  }

  async restoreAuthFromStorage() {
    try {
      const token = await platformStorage.getItem(BACKEND_TOKEN_KEY);
      if (token) {
        this.authToken = token;
      }
    } catch {}
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check if response is actually JSON before trying to parse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If it's not JSON, throw an error instead of trying to parse
        throw new Error(`Server returned non-JSON response: ${contentType || 'unknown content type'}`);
      }

      const text = await response.text();
      if (!text.trim()) {
        throw new Error('Server returned empty response');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Real DVSA API Integration
  private async searchDVSATestCenters(postcode: string, radius: number): Promise<TestCenter[]> {
    try {
      // DVSA Find a theory test centre API
      const response = await fetch(`https://www.gov.uk/api/driving-test-centres.json?postcode=${encodeURIComponent(postcode)}&radius=${radius}`);
      
      if (!response.ok) {
        throw new Error(`DVSA API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.centres?.map((centre: any) => ({
        id: centre.centre_id || centre.id,
        name: centre.name,
        address: centre.address,
        postcode: centre.postcode,
        city: centre.town || centre.city,
        coordinates: {
          latitude: centre.latitude,
          longitude: centre.longitude,
        },
        availability: 0, // Will be fetched separately
        distance: centre.distance,
      })) || [];
    } catch (error) {
      console.error('DVSA test centers API error:', error);
      return [];
    }
  }

  private async getDVSAAvailableSlots(centreIds: string[]): Promise<TestSlot[]> {
    const slots: TestSlot[] = [];
    
    for (const centreId of centreIds) {
      try {
        // DVSA book a practical driving test API
        const response = await fetch(`https://driverpracticaltest.dvsa.gov.uk/api/v1/slots/${centreId}/available`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.available_slots) {
            data.available_slots.forEach((slot: any) => {
              slots.push({
                id: `${centreId}-${slot.date}-${slot.time}`,
                centerId: centreId,
                centerName: slot.centre_name || 'Unknown Centre',
                date: slot.date,
                time: slot.time,
                type: slot.test_type || 'standard',
                price: slot.price || 62,
                available: true,
                lastUpdated: new Date().toISOString(),
              });
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching slots for centre ${centreId}:`, error);
      }
    }
    
    return slots;
  }

  // Authentication endpoints - Development-friendly with fallbacks
  async login(email: string, password: string): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Login failed',
        };
      }

  // Persist token
  const token = data?.data?.token || data.token;
  if (token) this.setAuthToken(token);

  return {
        success: true,
        data: data,
        message: 'Login successful',
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Development fallback - return mock successful login
  if (__DEV__ || this.baseUrl.includes('localhost') || this.baseUrl.includes('dvslot.com')) {
        console.log('🔧 Development mode: Using mock login response');
        const mockUser: UserProfile = {
          id: 'dev-user-123',
          name: email.split('@')[0] || 'Test User',
          email: email,
          phone: '+44 7700 900123',
          licenseNumber: 'DEV851226AB9CD',
          notificationSettings: {
            pushNotifications: true,
            emailNotifications: true,
            smsNotifications: false,
          },
          preferredTestCenters: ['Birmingham', 'London'],
          subscription: {
            type: 'premium',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        };

    const token = 'dev-token-' + Date.now();
    this.setAuthToken(token);
    return {
          success: true,
          data: {
            user: mockUser,
      token,
          },
          message: 'Development login successful',
        };
      }

      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    try {
  const response = await fetch(`${this.baseUrl}/${this.apiVersion}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Registration failed',
        };
      }

  const token = data?.data?.token || data.token;
  if (token) this.setAuthToken(token);
  return {
        success: true,
        data: data,
        message: 'Account created successfully',
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Development fallback - return mock successful registration
      if (__DEV__ || this.baseUrl.includes('localhost') || this.baseUrl.includes('dvslot.com')) {
        console.log('🔧 Development mode: Using mock registration response');
        const mockUser: UserProfile = {
          id: 'dev-user-' + Date.now(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '+44 7700 900123',
          licenseNumber: 'NEW' + Date.now().toString().slice(-8),
          notificationSettings: {
            pushNotifications: true,
            emailNotifications: true,
            smsNotifications: false,
          },
          preferredTestCenters: [],
          subscription: {
            type: 'free',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        };

    const token = 'dev-token-' + Date.now();
    this.setAuthToken(token);
    return {
          success: true,
          data: {
            user: mockUser,
      token,
          },
          message: 'Development account created successfully',
        };
      }

      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      if (this.authToken) {
  await fetch(`${this.baseUrl}/${this.apiVersion}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API error (non-critical):', error);
    } finally {
      this.clearAuthToken();
    }

    return {
      success: true,
      data: undefined,
      message: 'Logged out successfully',
    };
  }

  // Test center endpoints - Production API with 318 UK centers
  async searchTestCenters(filters: SearchFilters): Promise<ApiResponse<TestCenter[]>> {
    try {
      console.log(`🔍 Searching production database: 318 UK centers near ${filters.postcode}`);
      
      // Use production API with our 318 centers database
      const response = await productionApi.searchTestCenters({
        postcode: filters.postcode,
        radius: filters.radius,
        dateRange: filters.dateRange,
        testType: filters.testType,
        maxResults: 50,
      });

      if (response.success && response.data) {
        // Map to expected format
        const mappedCenters: TestCenter[] = response.data.map(center => ({
          id: center.center_code || center.id,
          name: center.name,
          address: center.address,
          postcode: center.postcode,
          city: center.city,
          coordinates: center.coordinates,
          availability: center.availability,
          distance: center.distance,
        }));

        return {
          success: true,
          data: mappedCenters,
          message: response.message || `Found ${mappedCenters.length} centers from production database`,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to search test centers',
        data: [],
      };
    } catch (error) {
      console.error('❌ Production API search error:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to search test centers. Please check your connection.',
      };
    }
  }

  async getTestCenter(id: string): Promise<ApiResponse<TestCenter>> {
    return this.request(`/test-centers/${id}`);
  }

  async getNearbyTestCenters(
    latitude: number,
    longitude: number,
    radius: number = 25
  ): Promise<ApiResponse<TestCenter[]>> {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      radius: radius.toString(),
    });

    return this.request(`/test-centers/nearby?${params.toString()}`);
  }

  // Test slot endpoints - Production API with 318 UK centers
  async searchTestSlots(filters: SearchFilters): Promise<ApiResponse<TestSlot[]>> {
    try {
      console.log(`🎯 Searching production database slots near ${filters.postcode}`);
      
      // Use production API
      const response = await productionApi.searchTestSlots({
        postcode: filters.postcode,
        radius: filters.radius,
        dateRange: filters.dateRange,
        testType: filters.testType,
      });

      if (response.success && response.data) {
        // Map to expected format
        const mappedSlots: TestSlot[] = response.data.map(slot => ({
          id: slot.id,
          centerId: slot.center_id,
          centerName: slot.center_name,
          date: slot.date,
          time: slot.time,
          type: slot.test_type,
          price: 62, // Standard DVSA test price
          available: slot.available,
          lastUpdated: slot.last_checked,
        }));

        return {
          success: true,
          data: mappedSlots,
          message: response.message || `Found ${mappedSlots.length} available slots`,
        };
      }

      return {
        success: false,
        data: [],
        error: response.error || 'Failed to search test slots',
      };
    } catch (error) {
      console.error('❌ Production API slot search error:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to search test slots. Please try again.',
      };
    }
  }

  async getAvailableSlots(filters: SearchFilters): Promise<ApiResponse<TestSlot[]>> {
    // Use the same logic as searchTestSlots for consistency
    return this.searchTestSlots(filters);
  }

  async getTestSlot(id: string): Promise<ApiResponse<TestSlot>> {
    return this.request(`/test-slots/${id}`);
  }

  async bookTestSlot(slotId: string, userDetails: any): Promise<ApiResponse<{ bookingId: string }>> {
    return this.request('/test-slots/book', {
      method: 'POST',
      body: JSON.stringify({ slotId, userDetails }),
    });
  }

  // User profile endpoints - Real backend integration
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      if (!this.authToken) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to get user profile',
        };
      }

      return {
        success: true,
        data: data?.data?.user || data.user || data,
        message: 'Profile retrieved successfully',
      };
    } catch (error) {
      console.error('Get profile error:', error);
      
      // Development fallback
      if (__DEV__ || this.baseUrl.includes('localhost') || this.baseUrl.includes('dvslot.com')) {
        console.log('🔧 Development mode: Using mock profile response');
        const mockUser: UserProfile = {
          id: 'dev-user-123',
          name: 'Test User',
          email: 'test@example.com',
          phone: '+44 7700 900123',
          licenseNumber: 'DEV851226AB9CD',
          notificationSettings: {
            pushNotifications: true,
            emailNotifications: true,
            smsNotifications: false,
          },
          preferredTestCenters: ['Birmingham', 'London'],
          subscription: {
            type: 'premium',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        };

        return {
          success: true,
          data: mockUser,
          message: 'Development profile retrieved successfully',
        };
      }

      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      if (!this.authToken) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to update profile',
        };
      }

      return {
        success: true,
        data: data?.data?.user || data.user || data,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      console.error('Update profile error:', error);
      
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Alert endpoints
  async getUserAlerts(): Promise<ApiResponse<UserAlert[]>> {
    try {
      if (!this.authToken) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      // Backend: GET /api/v1/alerts/history
      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/alerts/history`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || data.message || 'Failed to get alerts',
        };
      }

      const alerts = (data.data?.alerts || data.alerts || []).map((a: any) => ({
        id: a.alert_id || a.id,
        type: a.type || 'new_slot',
        title: a.center_name ? `Slot at ${a.center_name}` : 'DVSA Slot Alert',
        description: `${a.center_name || ''} ${a.postcode || ''} ${a.date || ''} ${a.time || ''}`.trim(),
        isActive: a.sent ? false : true,
        created: a.created_at,
        centerId: a.center_id?.toString(),
      })) as UserAlert[];

      return {
        success: true,
        data: alerts,
        message: 'Alerts retrieved successfully',
      };
    } catch (error) {
      console.error('Get alerts error:', error);
      
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Alert subscriptions (manage active rules)
  async getAlertSubscriptions(): Promise<ApiResponse<any[]>> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Authentication required' };
      }
      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/alerts/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error?.message || data.message || 'Failed to get subscriptions' };
      }
      const list = data?.data?.subscriptions || data.subscriptions || [];
      return { success: true, data: list };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createAlert(alertData: {
    test_type: 'practical' | 'theory' | 'both';
    location: string; // postcode or city
    radius?: number;
    preferred_centers?: number[];
    date_from?: string;
    date_to?: string;
    preferred_times?: string[];
  }): Promise<ApiResponse<any>> {
    try {
      if (!this.authToken) {
        return { success: false, error: 'Authentication required' };
      }
      return this.request(`/alerts/subscribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.authToken}` },
        body: JSON.stringify(alertData),
      });
    } catch (error) {
      console.error('Create alert error:', error);
      return { success: false, error: 'Failed to create alert' };
    }
  }

  async updateAlert(id: string, alertData: Partial<UserAlert>): Promise<ApiResponse<UserAlert>> {
    if (!this.authToken) return { success: false, error: 'Authentication required' } as any;
    return this.request(`/alerts/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.authToken}` },
      body: JSON.stringify(alertData),
    });
  }

  async deleteSubscription(subscriptionId: string): Promise<ApiResponse<void>> {
    if (!this.authToken) return { success: false, error: 'Authentication required' };
    return this.request(`/alerts/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
  }

  // Statistics endpoints
  async getUserStatistics(): Promise<ApiResponse<{
    totalSearches: number;
    activeAlerts: number;
    slotsFound: number;
    lastActivity: string;
  }>> {
    if (!this.authToken) return { success: false, error: 'Authentication required' } as any;
    const res = await this.request<{ statistics: any }>(`/alerts/stats`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    });
    if (res.success && res.data && (res as any).data.statistics) {
      // Normalize
      return { success: true, data: (res as any).data.statistics } as any;
    }
    return res as any;
  }

  // Support endpoints
  async submitSupportRequest(data: {
    subject: string;
    message: string;
    category: 'bug' | 'feature' | 'support' | 'feedback';
  }): Promise<ApiResponse<{ ticketId: string }>> {
    return this.request('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return { success: true, data };
    } catch (e) {
      return { success: false, error: 'Health check failed' };
    }
  }
}

export const api = new DVSlotAPI();
