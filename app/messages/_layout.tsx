import { Stack } from 'expo-router';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/constants/theme';

export default function MessagesLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.forest[500] },
        headerTintColor: colors.text.onAccent,
        headerTitleStyle: { color: colors.text.onAccent },
      }}
    >
      <Stack.Screen name="[bookingId]" options={{ title: t('nav_conversation') }} />
    </Stack>
  );
}
