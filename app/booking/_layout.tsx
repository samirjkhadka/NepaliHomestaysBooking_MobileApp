import { Stack } from 'expo-router';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/constants/theme';

export default function BookingLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.forest[500] },
        headerTintColor: colors.text.onAccent,
        headerTitleStyle: { color: colors.text.onAccent },
      }}
    >
      <Stack.Screen name="[id]" options={{ title: t('nav_booking') }} />
      <Stack.Screen name="new" options={{ title: t('nav_new_booking') }} />
      <Stack.Screen name="confirm" options={{ title: 'Confirm booking' }} />
      <Stack.Screen name="review" options={{ title: t('nav_leave_review') }} />
      <Stack.Screen name="pay" options={{ title: 'Payment' }} />
      <Stack.Screen name="receipt" options={{ title: 'Receipt' }} />
    </Stack>
  );
}
