import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'nh_cache_';
const TTL_DEFAULT_MS = 1000 * 60 * 15; // 15 minutes

type CacheEntry<T> = { data: T; expiresAt: number };

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T, ttlMs: number = TTL_DEFAULT_MS): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export async function invalidateCache(keyPrefix: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((k) => k.startsWith(PREFIX + keyPrefix));
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch {
    // ignore
  }
}

export const cacheKeys = {
  hero: 'listings_hero',
  featured: 'listings_featured',
  listing: (id: number) => `listing_${id}`,
  search: (params: string) => `listings_search_${params}`,
} as const;
