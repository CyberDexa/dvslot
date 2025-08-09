import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, UserProfile } from './api';

const AUTH_TOKEN_KEY = 'dvslot_auth_token';
const USER_PROFILE_KEY = 'dvslot_user_profile';

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  // Initialize auth service
  async initialize(): Promise<AuthState> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);

      if (token && userProfile) {
        const user = JSON.parse(userProfile);
        this.authState = {
          isAuthenticated: true,
          user,
          token,
        };
        
        // Set token in API service
        api.setAuthToken(token);
        
        // Verify token is still valid
        const profileResponse = await api.getUserProfile();
        if (!profileResponse.success) {
          // Token is invalid, clear auth
          await this.logout();
        } else if (profileResponse.data) {
          // Update user profile with latest data
          this.authState.user = profileResponse.data;
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileResponse.data));
        }
      }

      this.notifyListeners();
      return this.authState;
    } catch (error) {
      console.error('Error initializing auth service:', error);
      await this.logout();
      return this.authState;
    }
  }

  // Login user
  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store auth data
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
        
        // Update state
        this.authState = {
          isAuthenticated: true,
          user,
          token,
        };
        
        // Set token in API service
        api.setAuthToken(token);
        
        this.notifyListeners();
        
        return { success: true };
      } else {
        return { success: false, message: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  }

  // Register user
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.register(userData);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store auth data
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
        
        // Update state
        this.authState = {
          isAuthenticated: true,
          user,
          token,
        };
        
        // Set token in API service
        api.setAuthToken(token);
        
        this.notifyListeners();
        
        return { success: true };
      } else {
        return { success: false, message: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout API if authenticated
      if (this.authState.isAuthenticated) {
        await api.logout();
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      
      // Clear API token
      api.clearAuthToken();
      
      // Update state
      this.authState = {
        isAuthenticated: false,
        user: null,
        token: null,
      };
      
      this.notifyListeners();
    }
  }

  // Update user profile
  async updateProfile(profileData: Partial<UserProfile>): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.authState.isAuthenticated) {
        return { success: false, message: 'Not authenticated' };
      }

      const response = await api.updateUserProfile(profileData);
      
      if (response.success && response.data) {
        // Update local state
        this.authState.user = response.data;
        
        // Update AsyncStorage
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(response.data));
        
        this.notifyListeners();
        
        return { success: true };
      } else {
        return { success: false, message: response.error || 'Profile update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  }

  // Get current auth state
  getAuthState(): AuthState {
    return this.authState;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  // Get current user
  getCurrentUser(): UserProfile | null {
    return this.authState.user;
  }

  // Add auth state listener
  addListener(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.authState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  // Guest login (for demo/trial purposes)
  async guestLogin(): Promise<void> {
    const guestUser: UserProfile = {
      id: 'guest_user',
      name: 'Guest User',
      email: 'guest@example.com',
      preferredTestCenters: [],
      notificationSettings: {
        pushNotifications: false,
        emailNotifications: false,
        smsNotifications: false,
      },
      subscription: {
        type: 'free',
      },
    };

    this.authState = {
      isAuthenticated: true,
      user: guestUser,
      token: 'guest_token',
    };

    this.notifyListeners();
  }
}

export const authService = new AuthService();
