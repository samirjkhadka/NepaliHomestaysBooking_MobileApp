import { useEffect } from 'react';
import { Linking } from 'react-native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { setPendingDeepLink } from '@/lib/deep-link';

export default function Index() {
  const router = useRouter();
  const { loading, user, token } = useAuth();

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) setPendingDeepLink(url);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (token && user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(splash)/1');
    }
  }, [loading, token, user, router]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FB6F08" />
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F233E',
  },
});
