import { Platform } from 'react-native';

// Platform-aware storage that works on both mobile and web
class PlatformStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage.getItem(key);
        }
        return null;
      } else {
        // Use AsyncStorage for mobile
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        return await AsyncStorage.default.getItem(key);
      }
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, value);
        }
      } else {
        // Use AsyncStorage for mobile
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(key);
        }
      } else {
        // Use AsyncStorage for mobile
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.removeItem(key);
      }
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          keys.forEach(key => localStorage.removeItem(key));
        }
      } else {
        // Use AsyncStorage for mobile
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.multiRemove(keys);
      }
    } catch (error) {
      console.error('Storage multiRemove error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.clear();
        }
      } else {
        // Use AsyncStorage for mobile
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.clear();
      }
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
}

export const platformStorage = new PlatformStorage();
