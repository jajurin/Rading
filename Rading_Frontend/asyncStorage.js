import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore solo permite [A-Za-z0-9._-]
const sanitizeKey = (key) => key.replace(/[^a-zA-Z0-9._-]/g, '_');

const isWeb = Platform.OS === 'web';

const AsyncStorage = {
  getItem: async (key) => {
    try {
      if (isWeb) {
        return window.localStorage.getItem(sanitizeKey(key));
      }
      return await SecureStore.getItemAsync(sanitizeKey(key));
    } catch (e) {
      console.error('[AsyncStorage] Error leyendo:', e);
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      if (isWeb) {
        window.localStorage.setItem(sanitizeKey(key), String(value));
        return;
      }
      await SecureStore.setItemAsync(sanitizeKey(key), String(value));
    } catch (e) {
      console.error('[AsyncStorage] Error guardando:', e);
    }
  },

  removeItem: async (key) => {
    try {
      if (isWeb) {
        window.localStorage.removeItem(sanitizeKey(key));
        return;
      }
      await SecureStore.deleteItemAsync(sanitizeKey(key));
    } catch {
      // Si no existe, no hacemos nada
    }
  },

  multiGet: async (keys) => {
    const results = [];
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      results.push([key, value]);
    }
    return results;
  },

  multiSet: async (keyValuePairs) => {
    for (const [key, value] of keyValuePairs) {
      await AsyncStorage.setItem(key, value);
    }
  },

  multiRemove: async (keys) => {
    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
  },

  clear: async () => {
    const keys = ['@rading_user_id', '@rading_theme'];
    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
  },
};

export default AsyncStorage;