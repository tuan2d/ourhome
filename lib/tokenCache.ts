import { Platform } from 'react-native';
import type { TokenCache } from '@clerk/clerk-expo';

const webCache: TokenCache = {
  async getToken(key: string) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch {}
  },
  async clearToken(key: string) {
    try { localStorage.removeItem(key); } catch {}
  },
};

async function getNativeCache(): Promise<TokenCache> {
  const SecureStore = await import('expo-secure-store');
  return {
    async getToken(key: string) {
      try { return await SecureStore.getItemAsync(key); } catch { return null; }
    },
    async saveToken(key: string, value: string) {
      try { await SecureStore.setItemAsync(key, value); } catch {}
    },
    async clearToken(key: string) {
      try { await SecureStore.deleteItemAsync(key); } catch {}
    },
  };
}

let _cache: TokenCache | null = null;

async function getCache(): Promise<TokenCache> {
  if (_cache) return _cache;
  _cache = Platform.OS === 'web' ? webCache : await getNativeCache();
  return _cache;
}

export const tokenCache: TokenCache = {
  async getToken(key) { return (await getCache()).getToken(key); },
  async saveToken(key, value) { return (await getCache()).saveToken(key, value); },
  async clearToken(key) { return (await getCache()).clearToken(key); },
};
