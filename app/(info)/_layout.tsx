import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function InfoLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.forest[500] },
        headerTintColor: colors.text.onAccent,
        headerTitleStyle: { color: colors.text.onAccent },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="about" options={{ title: 'About Us' }} />
      <Stack.Screen name="contact" options={{ title: 'Contact' }} />
      <Stack.Screen name="blogs" options={{ title: 'Blogs & News' }} />
      <Stack.Screen name="videos" options={{ title: 'Videos' }} />
      <Stack.Screen name="cms/[slug]" options={{ title: '' }} />
    </Stack>
  );
}
