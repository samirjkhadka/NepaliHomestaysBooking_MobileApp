/**
 * Store initial deep link URL so that after auth/navigation we can navigate to the target.
 * Example: mobile://listing/123 -> /listing/123
 */
let pendingDeepLinkUrl: string | null = null;

export function setPendingDeepLink(url: string | null) {
  pendingDeepLinkUrl = url;
}

export function consumePendingDeepLink(): string | null {
  const u = pendingDeepLinkUrl;
  pendingDeepLinkUrl = null;
  return u;
}

/** Parse URL to app path. Supports listing/123, booking/456, booking/456/confirmation. */
export function getPathFromDeepLink(url: string): string | null {
  const path = url.replace(/^[^:]+:\/\//, '').replace(/^\//, '').trim();
  if (!path) return null;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'listing' && parts[1]) return `/listing/${parts[1]}`;
  if (parts[0] === 'booking' && parts[1]) {
    if (parts[2] === 'confirmation') return `/booking/${parts[1]}`;
    return `/booking/${parts[1]}`;
  }
  return null;
}
