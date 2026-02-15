import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api, type Booking, type FavoriteRow } from '@/lib/api';
import { ListingImage } from '@/components/ListingImage';
import { colors, spacing, radius, typography } from '@/constants/theme';

/** Format date string to YYYY-MM-DD */
function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function GuestDashboardContent() {
  const router = useRouter();
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const [bookingsRes, favRes] = await Promise.all([
        api.getBookings(token),
        api.getFavorites(token),
      ]);
      setBookings(bookingsRes.bookings ?? []);
      setFavorites(favRes.favorites ?? []);
    } catch {
      setBookings([]);
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accentAlt[500]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>My Bookings</Text>
        <Text style={styles.subWelcome}>Manage your stays and wishlist</Text>
      </View>
      <Text style={styles.sectionTitle}>Upcoming & past</Text>
      {bookings.length === 0 ? (
        <Text style={styles.empty}>No bookings yet. Explore homestays and book your stay.</Text>
      ) : (
        bookings.map((b) => (
          <View key={b.id} style={styles.card}>
            <Text style={styles.cardLabel}>Homestay</Text>
            <Text style={styles.cardTitle}>{b.listing?.title ?? `Booking #${b.id}`}</Text>
            <Text style={styles.cardMeta}>
              Check-in: {formatDate(b.check_in)} · Check-out: {formatDate(b.check_out)}
            </Text>
            <Text style={styles.cardMeta}>
              {b.guests} guests · {b.status}
            </Text>
            {b.total_amount != null && (
              <Text style={styles.cardMeta}>Total: Rs {b.total_amount}</Text>
            )}
            <View style={styles.row}>
              <Pressable style={styles.smallBtn} onPress={() => router.push(`/listing/${b.listing_id}`)}>
                <Text style={styles.smallBtnText}>View listing</Text>
              </Pressable>
              <Pressable style={styles.smallBtn} onPress={() => router.push(`/messages/${b.id}`)}>
                <Text style={styles.smallBtnText}>Message</Text>
              </Pressable>
              {(b.status === 'pending' || b.status === 'approved') && (
                <Pressable style={[styles.smallBtn, styles.primaryBtn]} onPress={() => router.push(`/booking/${b.id}`)}>
                  <Text style={styles.smallBtnText}>Pay / Details</Text>
                </Pressable>
              )}
              {(b.status === 'paid' || b.status === 'partial_paid') && (
                <Pressable style={styles.smallBtn} onPress={() => router.push({ pathname: '/booking/review', params: { bookingId: String(b.id) } })}>
                  <Text style={styles.smallBtnText}>Review</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))
      )}
      <Text style={styles.sectionTitle}>Wishlist</Text>
      {favorites.length === 0 ? (
        <Text style={styles.empty}>No saved listings yet. Tap the heart on a listing to add one.</Text>
      ) : (
        favorites.map((item) => (
          <View key={item.id} style={styles.card}>
            <Pressable onPress={() => router.push(`/listing/${item.listing_id}`)}>
              <View style={styles.thumbWrap}>
                <ListingImage uri={item.image_url} style={styles.thumb} resizeMode="cover" />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.listing_title}</Text>
                <Text style={styles.cardMeta}>{item.listing_location || 'Nepal'}</Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.smallBtn, styles.removeBtn]}
              onPress={() => {
                api.removeFavorite(token, item.listing_id).then(() => {
                  setFavorites((prev) => prev.filter((f) => f.listing_id !== item.listing_id));
                }).catch(() => {});
              }}
            >
              <Text style={styles.smallBtnText}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  header: { marginBottom: spacing.lg },
  welcome: { ...typography.title, color: colors.text.primary, marginBottom: spacing.xs },
  subWelcome: { ...typography.bodySm, color: colors.text.muted },
  sectionTitle: { ...typography.subtitle, color: colors.accentAlt[500], marginBottom: spacing.md },
  empty: { color: colors.text.muted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardLabel: { color: colors.text.muted, fontSize: 12, marginBottom: 2 },
  cardTitle: { color: colors.text.primary, fontWeight: '600', marginBottom: 4 },
  cardMeta: { color: colors.text.muted, fontSize: 14, marginBottom: 2 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  smallBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.input,
  },
  primaryBtn: { backgroundColor: colors.accent[500] },
  removeBtn: { marginTop: spacing.sm },
  smallBtnText: { color: colors.text.primary, fontSize: 14, fontWeight: '500' },
  thumbWrap: { position: 'relative', marginBottom: spacing.sm },
  thumb: { width: '100%', height: 100, borderRadius: radius.sm },
  badge: { position: 'absolute', top: spacing.xs, left: spacing.xs },
  cardBody: {},
});
