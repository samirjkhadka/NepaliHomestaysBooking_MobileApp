import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEV_SERVER_PORT = 3000;

/**
 * Backend API base URL.
 * - EXPO_PUBLIC_API_URL: use if set (e.g. for physical device: http://192.168.1.x:3000).
 * - In dev, Expo Go on a physical device uses the same host as the Metro bundler so API works.
 * - Android emulator: 10.0.2.2 to reach host machine.
 * - iOS simulator: localhost or 127.0.0.1.
 */
function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  // Expo Go on device: use the host your phone uses to reach the dev server (same machine as backend).
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.debuggerHost;
  if (__DEV__ && debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${DEV_SERVER_PORT}`;
    }
  }
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEV_SERVER_PORT}`;
  }
  return `http://127.0.0.1:${DEV_SERVER_PORT}`;
}

export const API_BASE_URL = getApiBaseUrl();

/** Full URL for backend-served images (e.g. listing photos). Backend uses /images/ for uploads. */
export function getImageUrl(path: string | null | undefined): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = trimmed.startsWith('http') ? trimmed : trimmed.startsWith('/') ? trimmed : `/images/${trimmed}`;
  return p.startsWith('http') ? p : `${base}${p}`;
}
