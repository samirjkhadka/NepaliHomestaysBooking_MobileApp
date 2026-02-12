import { Stack } from 'expo-router';
import { useTranslation } from '@/lib/i18n';

export default function MessagesLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#0F233E' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="[bookingId]" options={{ title: t('nav_conversation') }} />
    </Stack>
  );
}
