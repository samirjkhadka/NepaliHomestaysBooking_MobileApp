/** UAT API for testing. Set EXPO_PUBLIC_API_URL to use a local backend (e.g. http://192.168.1.78:3000). */
const UAT_API_URL = 'https://testcmsapi.dghub.io';

/**
 * Backend API base URL.
 * - EXPO_PUBLIC_API_URL: use if set (e.g. local: http://192.168.1.78:3000 when testing against your machine).
 * - Otherwise uses UAT (https://testcmsapi.dghub.io).
 */
function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL?.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
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
