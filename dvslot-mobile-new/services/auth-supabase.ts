import { platformStorage } from './storage';
import { supabase } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

const USER_PROFILE_KEY = 'dvslot_user_profile';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  role: 'user' | 'admin' | 'premium';
  is_premium: boolean;
  preferences: Record<string, any>;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    session: null,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (session?.user) {
        await this.handleAuthStateChange(session);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        if (session) {
          await this.handleAuthStateChange(session);
        } else {
          await this.clearAuthState();
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  private async handleAuthStateChange(session: Session) {
    try {
      // Get user profile from our custom table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          await this.createUserProfile(session.user);
          return;
        }
      }

      const userProfile: UserProfile = {
        id: session.user.id,
        email: session.user.email || '',
        full_name: profile?.full_name || null,
        phone_number: profile?.phone_number || null,
        role: profile?.role || 'user',
        is_premium: profile?.is_premium || false,
        preferences: profile?.preferences || {},
      };

      this.authState = {
        isAuthenticated: true,
        user: userProfile,
        session,
      };

      // Store user profile locally
      await platformStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error handling auth state change:', error);
    }
  }

  private async createUserProfile(user: User) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          phone_number: user.user_metadata?.phone_number || null,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Created user profile:', data);
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  private async clearAuthState() {
    this.authState = {
      isAuthenticated: false,
      user: null,
      session: null,
    };

    await platformStorage.multiRemove([USER_PROFILE_KEY]);
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  public async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  public async signUp(email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Registration failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  public async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  public async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim());
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  public async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authState.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: updates.full_name,
          phone_number: updates.phone_number,
          preferences: updates.preferences,
        })
        .eq('id', this.authState.user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local state
      this.authState.user = {
        ...this.authState.user,
        ...updates,
      };

      await platformStorage.setItem(USER_PROFILE_KEY, JSON.stringify(this.authState.user));
      this.notifyListeners();

      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const authService = new AuthService();
