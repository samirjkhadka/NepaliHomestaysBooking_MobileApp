import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function GuestDashboard() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [bookings, setBookings] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const res = await api.getGuestBookings(token);
      setBookings(res.bookings ?? []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFA101" />
      }
    >
      {loading ? (
        <ActivityIndicator size="large" color="#FB6F08" style={styles.loader} />
      ) : bookings.length === 0 ? (
        <Text style={styles.empty}>No bookings yet. Explore homestays and book your stay.</Text>
      ) : (
        bookings.map((b: unknown, i: number) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>Booking #{i + 1}</Text>
            <Text style={styles.cardText}>{JSON.stringify(b)}</Text>
          </View>
        ))
      )}
      <Pressable style={styles.logout} onPress={() => logout().then(() => router.replace('/(auth)/login'))}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F233E' },
  content: { padding: 24, paddingBottom: 48 },
  loader: { marginTop: 48 },
  empty: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 24, paddingHorizontal: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { color: '#FFA101', fontWeight: '600', marginBottom: 4 },
  cardText: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  logout: { marginTop: 32, alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 24 },
  logoutText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
});
