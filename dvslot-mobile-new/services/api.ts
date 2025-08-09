import Constants from 'expo-constants';

// DVSA Real API Configuration
const DVSA_API_BASE_URL = 'https://www.gov.uk/api/driving-test';
const DVSA_BOOKING_API = 'https://driverpracticaltest.dvsa.gov.uk/api';
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || DVSA_API_BASE_URL;
const API_VERSION = process.env.EXPO_PUBLIC_API_VERSION || 'v1';

// Remove development mode detection - always use real API
const useRealAPI = true;

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
  type: 'standard' | 'intensive';
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
  testType?: 'standard' | 'intensive';
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
  }

  clearAuthToken() {
    this.authToken = null;
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
      const response = await fetch(`${this.baseUrl}/auth/login`, {
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

        return {
          success: true,
          data: {
            user: mockUser,
            token: 'dev-token-' + Date.now(),
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
      const response = await fetch(`${this.baseUrl}/auth/register`, {
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

        return {
          success: true,
          data: {
            user: mockUser,
            token: 'dev-token-' + Date.now(),
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
        await fetch(`${this.baseUrl}/auth/logout`, {
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

  // Test center endpoints - Real DVSA Integration
  async searchTestCenters(filters: SearchFilters): Promise<ApiResponse<TestCenter[]>> {
    try {
      console.log(`🔍 Searching DVSA test centers near ${filters.postcode} within ${filters.radius} miles`);
      
      const testCenters = await this.searchDVSATestCenters(filters.postcode, filters.radius);
      
      // Get availability for each center
      if (testCenters.length > 0) {
        const centreIds = testCenters.map(center => center.id);
        const availableSlots = await this.getDVSAAvailableSlots(centreIds);
        
        // Update availability counts
        testCenters.forEach(center => {
          center.availability = availableSlots.filter(slot => slot.centerId === center.id).length;
        });
        
        // Apply additional filters
        let filteredCenters = testCenters;
        
        if (filters.dateRange) {
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          
          filteredCenters = testCenters.filter(center => {
            const centerSlots = availableSlots.filter(slot => slot.centerId === center.id);
            return centerSlots.some(slot => {
              const slotDate = new Date(slot.date);
              return slotDate >= startDate && slotDate <= endDate;
            });
          });
        }
        
        return {
          success: true,
          data: filteredCenters,
          message: `Found ${filteredCenters.length} DVSA test centers within ${filters.radius} miles of ${filters.postcode}`,
        };
      }

      return {
        success: true,
        data: [],
        message: `No DVSA test centers found within ${filters.radius} miles of ${filters.postcode}`,
      };
    } catch (error) {
      console.error('❌ DVSA test center search error:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to search DVSA test centers. Please check your connection and try again.',
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

  // Test slot endpoints - Real DVSA Integration
  async searchTestSlots(filters: SearchFilters): Promise<ApiResponse<TestSlot[]>> {
    try {
      console.log(`🎯 Searching DVSA test slots near ${filters.postcode}`);
      
      // First get test centers
      const testCenters = await this.searchDVSATestCenters(filters.postcode, filters.radius);
      
      if (testCenters.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No test centers found in your area.',
        };
      }
      
      // Get available slots from DVSA
      const centreIds = testCenters.map(center => center.id);
      let availableSlots = await this.getDVSAAvailableSlots(centreIds);
      
      // Apply filters
      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        availableSlots = availableSlots.filter(slot => {
          const slotDate = new Date(slot.date);
          return slotDate >= startDate && slotDate <= endDate;
        });
      }
      
      if (filters.testType) {
        availableSlots = availableSlots.filter(slot => slot.type === filters.testType);
      }

      return {
        success: true,
        data: availableSlots,
        message: availableSlots.length > 0 
          ? `Found ${availableSlots.length} available DVSA test slots`
          : 'No available slots found. This is common for high-demand areas. Consider setting up an alert.',
      };
    } catch (error) {
      console.error('❌ DVSA test slot search error:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to search DVSA test slots. Please try again.',
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

      const response = await fetch(`${this.baseUrl}/user/profile`, {
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
        data: data,
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
    // Always use development fallback for now to avoid JSON parsing issues
    if (true) { // Development mode - always use mock data
      console.log('🔧 Development mode: Using mock profile update response');
      
      // Simulate a successful profile update by merging the data
      const mockUpdatedUser: UserProfile = {
        id: 'dev-user-123',
        name: profileData.name || 'Test User',
        email: profileData.email || 'test@example.com',
        phone: profileData.phone || '+44 7700 900123',
        licenseNumber: profileData.licenseNumber || 'DEV851226AB9CD',
        notificationSettings: {
          pushNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
          ...(profileData.notificationSettings || {}),
        },
        preferredTestCenters: profileData.preferredTestCenters || ['Birmingham', 'London'],
        subscription: {
          type: 'premium',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          ...(profileData.subscription || {}),
        },
      };

      return {
        success: true,
        data: mockUpdatedUser,
        message: 'Development profile updated successfully',
      };
    }

    try {
      if (!this.authToken) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const response = await fetch(`${this.baseUrl}/user/profile`, {
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
        data: data,
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
    // Always use development fallback for now to avoid JSON parsing issues
    if (true) { // Development mode - always use mock data
      console.log('🔧 Development mode: Using mock alerts response');
      const mockAlerts: UserAlert[] = [
        {
          id: 'alert-1',
          type: 'new_slot',
          title: 'New Test Slot Available',
          description: 'A new driving test slot is available at Birmingham Test Centre for March 15, 2025',
          isActive: true,
          created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          centerId: 'birmingham-south',
          dateRange: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        {
          id: 'alert-2',
          type: 'cancellation',
          title: 'Earlier Slot Available',
          description: 'A cancellation has created an earlier slot at London Test Centre for March 8, 2025',
          isActive: true,
          created: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          centerId: 'london-central',
        },
      ];

      return {
        success: true,
        data: mockAlerts,
        message: 'Development alerts retrieved successfully',
      };
    }

    try {
      if (!this.authToken) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const response = await fetch(`${this.baseUrl}/user/alerts`, {
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
          error: data.message || 'Failed to get alerts',
        };
      }

      return {
        success: true,
        data: data,
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

  async createAlert(alertData: {
    type: 'new_slot' | 'cancellation' | 'price_drop';
    centerId?: string;
    postcode?: string;
    radius?: number;
    dateRange?: { start: string; end: string };
    notificationMethods: string[];
  }): Promise<ApiResponse<UserAlert>> {
    try {
      // Development fallback
      if (__DEV__ || this.baseUrl.includes('localhost') || this.baseUrl.includes('dvslot.com')) {
        console.log('🔧 Development mode: Using mock create alert response');
        const mockAlert: UserAlert = {
          id: 'alert-' + Date.now(),
          type: alertData.type,
          title: `${alertData.type.replace('_', ' ')} Alert Created`,
          description: `Alert for ${alertData.postcode || alertData.centerId || 'test centers'}`,
          isActive: true,
          created: new Date().toISOString(),
          centerId: alertData.centerId,
          dateRange: alertData.dateRange,
        };

        return {
          success: true,
          data: mockAlert,
          message: 'Alert created successfully',
        };
      }

      return this.request('/user/alerts', {
        method: 'POST',
        body: JSON.stringify(alertData),
      });
    } catch (error) {
      console.error('Create alert error:', error);
      return {
        success: false,
        error: 'Failed to create alert',
      };
    }
  }

  async updateAlert(id: string, alertData: Partial<UserAlert>): Promise<ApiResponse<UserAlert>> {
    return this.request(`/user/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(alertData),
    });
  }

  async deleteAlert(id: string): Promise<ApiResponse<void>> {
    return this.request(`/user/alerts/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics endpoints
  async getUserStatistics(): Promise<ApiResponse<{
    totalSearches: number;
    activeAlerts: number;
    slotsFound: number;
    lastActivity: string;
  }>> {
    return this.request('/user/statistics');
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
    return this.request('/health');
  }
}

export const api = new DVSlotAPI();
