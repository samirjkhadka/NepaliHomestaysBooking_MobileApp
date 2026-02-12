import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function HostDashboard() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [data, setData] = useState<{
    listings_count?: number;
    bookings_count?: number;
    earnings?: number;
    listings?: unknown[];
    bookings?: unknown[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const res = await api.getHostDashboard(token);
      setData(res);
    } catch {
      setData(null);
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
      ) : data ? (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="home-outline" size={28} color="#FFA101" style={styles.statIcon} />
              <Text style={styles.statValue}>{data.listings_count ?? 0}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="calendar-outline" size={28} color="#FFA101" style={styles.statIcon} />
              <Text style={styles.statValue}>{data.bookings_count ?? 0}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="cash-outline" size={28} color="#FFA101" style={styles.statIcon} />
              <Text style={styles.statValue}>Rs {data.earnings ?? 0}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
          {(data.listings?.length ?? 0) > 0 && (
            <Text style={styles.sectionTitle}>Your listings</Text>
          )}
          {(data.listings ?? []).map((l: unknown, i: number) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardText}>{JSON.stringify(l)}</Text>
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.empty}>Could not load dashboard. Pull to refresh.</Text>
      )}
      <Pressable style={styles.logout} onPress={() => logout().then(() => router.replace('/(auth)/login'))}>
        <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.9)" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F233E' },
  content: { padding: 24, paddingBottom: 48 },
  loader: { marginTop: 48 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  stat: { alignItems: 'center' },
  statIcon: { marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#FFA101' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  sectionTitle: { color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: 12 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardText: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  empty: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 24 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logoutIcon: { marginRight: 8 },
  logoutText: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600' },
});
