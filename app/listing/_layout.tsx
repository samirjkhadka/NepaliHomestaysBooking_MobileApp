import { Stack } from 'expo-router';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/constants/theme';

export default function ListingLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.forest[500] },
        headerTintColor: colors.text.onAccent,
        headerTitleStyle: { color: colors.text.onAccent },
      }}
    >
      <Stack.Screen name="[id]" options={{ title: t('nav_homestay') }} />
    </Stack>
  );
}
