import { Stack } from 'expo-router';

export default function InfoLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F233E' },
        headerTintColor: '#fff',
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
