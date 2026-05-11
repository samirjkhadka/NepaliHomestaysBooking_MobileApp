import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { Stack } from 'expo-router';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/constants/theme';

export default function DashboardLayout() {
  const { user, token } = useAuth();
  const { t } = useTranslation();

  if (!token || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.forest[500] },
        headerTintColor: colors.text.onAccent,
        headerTitleStyle: { color: colors.text.onAccent },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="guest" options={{ title: t('nav_my_bookings') }} />
      <Stack.Screen name="host" options={{ title: t('nav_host_dashboard') }} />
    </Stack>
  );
}
