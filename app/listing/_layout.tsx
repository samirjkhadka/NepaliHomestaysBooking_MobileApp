import { Stack } from 'expo-router';
import { useTranslation } from '@/lib/i18n';

export default function ListingLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#0F233E' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="[id]" options={{ title: t('nav_homestay') }} />
    </Stack>
  );
}
