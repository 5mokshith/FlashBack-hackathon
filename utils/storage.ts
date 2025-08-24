import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PHONE: 'user_phone',
  USER_SELFIE: 'user_selfie',
  SELFIE_COMPLETED: 'selfie_completed',
};

export class SecureStorage {
  // Store authentication token
  static async storeAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw error;
    }
  }

  // Get authentication token
  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Store refresh token
  static async storeRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw error;
    }
  }

  // Get refresh token
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  // Store user phone number
  static async storeUserPhone(phone: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PHONE, phone);
    } catch (error) {
      console.error('Error storing user phone:', error);
      throw error;
    }
  }

  // Get user phone number
  static async getUserPhone(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_PHONE);
    } catch (error) {
      console.error('Error getting user phone:', error);
      return null;
    }
  }

  // Store user selfie URL
  static async storeUserSelfie(selfieUrl: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SELFIE, selfieUrl);
    } catch (error) {
      console.error('Error storing user selfie:', error);
      throw error;
    }
  }

  // Get user selfie URL
  static async getUserSelfie(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_SELFIE);
    } catch (error) {
      console.error('Error getting user selfie:', error);
      return null;
    }
  }

  // Store selfie completion status
  static async storeSelfieCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELFIE_COMPLETED, completed.toString());
    } catch (error) {
      console.error('Error storing selfie completion status:', error);
      throw error;
    }
  }

  // Get selfie completion status
  static async getSelfieCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.SELFIE_COMPLETED);
      return completed === 'true';
    } catch (error) {
      console.error('Error getting selfie completion status:', error);
      return false;
    }
  }

  // Clear all stored data (logout)
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_PHONE,
        STORAGE_KEYS.USER_SELFIE,
        STORAGE_KEYS.SELFIE_COMPLETED,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return token !== null;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

}
