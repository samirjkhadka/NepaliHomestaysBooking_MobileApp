import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { consumePendingDeepLink, getPathFromDeepLink } from '@/lib/deep-link';
import { useTranslation } from '@/lib/i18n';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const url = consumePendingDeepLink();
    if (url) {
      const path = getPathFromDeepLink(url);
      if (path) setTimeout(() => router.push(path as any), 100);
    }
    const sub = Linking.addEventListener('url', ({ url }) => {
      const p = getPathFromDeepLink(url);
      if (p) router.push(p as any);
    });
    return () => sub.remove();
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accentAlt[500],
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: { backgroundColor: colors.primary[600], borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.primary[500] },
        headerTintColor: colors.text.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav_home'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('nav_search'),
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('nav_dashboard'),
          tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('nav_messages'),
          tabBarIcon: ({ color }) => <TabBarIcon name="envelope" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav_profile'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
