/**
 * Push notifications: request permission, get Expo push token, persist it.
 * Lazy-loads expo-notifications so the app runs in Expo Go (where it was removed in SDK 53).
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PUSH_TOKEN_KEY = '@nepali_homestays_push_token';

/** Lazy load expo-notifications (returns null in Expo Go / when unavailable). */
async function getNotifications(): Promise<typeof import('expo-notifications') | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // ignore
  }

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch {
      // ignore
    }
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

/**
 * Build in-app path from notification data. Backend can send:
 * - data.url: full path e.g. '/listing/123'
 * - data.listingId: number → /listing/:id
 * - data.bookingId: number → /booking/:id
 */
export function getPathFromNotificationData(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const url = data.url;
  if (typeof url === 'string' && url.startsWith('/')) return url;
  const listingId = data.listingId;
  if (typeof listingId === 'number' || (typeof listingId === 'string' && listingId)) {
    return `/listing/${listingId}`;
  }
  const bookingId = data.bookingId;
  if (typeof bookingId === 'number' || (typeof bookingId === 'string' && bookingId)) {
    return `/booking/${bookingId}`;
  }
  return null;
}

/**
 * Set up notification redirect (last response + listener). No-op in Expo Go.
 */
export async function setupNotificationRedirect(
  onNotification: (data: Record<string, unknown> | undefined) => void
): Promise<() => void> {
  const Notifications = await getNotifications();
  if (!Notifications) return () => {};

  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response?.notification?.request?.content?.data) {
      onNotification(response.notification.request.content.data as Record<string, unknown>);
    }
  } catch {
    // ignore
  }

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification?.request?.content?.data as Record<string, unknown> | undefined;
    if (data) onNotification(data);
  });
  return () => sub.remove();
}
