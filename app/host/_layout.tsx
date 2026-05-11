import { Stack } from 'expo-router';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/constants/theme';

export default function HostLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.forest[500] },
        headerTintColor: colors.text.onAccent,
        headerTitleStyle: { color: colors.text.onAccent },
      }}
    >
      <Stack.Screen name="listings-new" options={{ title: t('nav_add_listing') }} />
      <Stack.Screen name="listings/[id]/edit" options={{ title: t('nav_edit_listing') }} />
      <Stack.Screen name="blocked-dates/[listingId]" options={{ title: t('nav_blocked_dates') }} />
    </Stack>
  );
}
