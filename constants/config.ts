import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** UAT API for testing. Set EXPO_PUBLIC_API_URL to use a local backend (e.g. http://192.168.1.78:5113). */
const UAT_API_URL = 'https://testcmsapi.dghub.io';

/** Matches v1 `Properties/launchSettings.json` http profile (port 5113). */
const DEFAULT_DEV_API_PORT = '5113';

/** Host where Metro runs, as seen from the device (LAN IP or 10.0.2.2 on Android emulator). */
function getMetroLanHost(): string | null {
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (typeof hostUri === 'string' && hostUri.length > 0) {
      const host = hostUri.split(':')[0]?.trim();
      if (host && host !== '127.0.0.1' && host !== 'localhost') return host;
    }
    const dbg =
      (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
      (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra?.expoGo
        ?.debuggerHost;
    if (typeof dbg === 'string' && dbg.includes(':')) {
      const host = dbg.split(':')[0]?.trim();
      if (host && host !== '127.0.0.1' && host !== 'localhost') return host;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Backend API base URL.
 * - EXPO_PUBLIC_API_URL: full base URL if set (recommended for odd ports / tunnels).
 * - Dev without env: prefers Metro LAN host + port 5113 (physical device + Expo Go),
 *   then Android emulator loopback (10.0.2.2), then localhost (iOS simulator on same Mac).
 * - Production: UAT.
 */
function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL?.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (__DEV__) {
    const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || DEFAULT_DEV_API_PORT;
    const lan = getMetroLanHost();
    let base: string;
    if (lan) {
      base = `http://${lan}:${port}`;
    } else if (Platform.OS === 'android') {
      base = `http://10.0.2.2:${port}`;
    } else {
      base = `http://localhost:${port}`;
    }
    return base;
  }
  return UAT_API_URL;
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
