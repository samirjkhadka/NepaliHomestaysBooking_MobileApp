import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import 'react-native-reanimated';

import { Platform } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LocaleProvider } from '@/lib/i18n';
import { getPathFromNotificationData, getStoredPushToken, registerForPushNotificationsAsync, setupNotificationRedirect } from '@/lib/notifications';
import { api } from '@/lib/api';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <LocaleProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </LocaleProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { token, user } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then((t) => {
      if (t) setPushToken(t);
    });
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    if (pushToken) {
      api.registerPushToken(token, pushToken, platform).catch(() => {});
      return;
    }
    let cancelled = false;
    getStoredPushToken().then((stored) => {
      if (cancelled || !token || !user) return;
      if (stored) api.registerPushToken(token, stored, platform).catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [token, user, pushToken]);

  const cleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    let mounted = true;
    setupNotificationRedirect((data) => {
      if (!mounted) return;
      const path = getPathFromNotificationData(data);
      if (path) setTimeout(() => router.push(path as any), 100);
    }).then((cleanup) => {
      if (mounted) cleanupRef.current = cleanup;
    });
    return () => {
      mounted = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(splash)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(dashboard)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(info)" options={{ headerShown: false }} />
        <Stack.Screen name="listing" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="host" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
