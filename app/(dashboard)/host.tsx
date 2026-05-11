import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { colors, spacing } from '@/constants/theme';

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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentAlt[500]} />
      }
    >
      {loading ? (
        <ActivityIndicator size="large" color={colors.accent[500]} style={styles.loader} />
      ) : data ? (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="home-outline" size={28} color={colors.accentAlt[500]} style={styles.statIcon} />
              <Text style={styles.statValue}>{data.listings_count ?? 0}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="calendar-outline" size={28} color={colors.accentAlt[500]} style={styles.statIcon} />
              <Text style={styles.statValue}>{data.bookings_count ?? 0}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="cash-outline" size={28} color={colors.accentAlt[500]} style={styles.statIcon} />
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
        <Ionicons name="log-out-outline" size={20} color={colors.text.primary} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxl },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: { alignItems: 'center' },
  statIcon: { marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.accentAlt[500] },
  statLabel: { fontSize: 12, color: colors.text.muted, marginTop: 4 },
  sectionTitle: { color: colors.text.primary, fontWeight: '600', marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardText: { color: colors.text.secondary, fontSize: 14 },
  empty: { color: colors.text.muted, textAlign: 'center', marginTop: spacing.lg },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface.card,
  },
  logoutIcon: { marginRight: spacing.sm },
  logoutText: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
});
