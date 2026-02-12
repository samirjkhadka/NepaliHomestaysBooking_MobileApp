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
import { api, type Listing, type Booking } from '@/lib/api';
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

export function HostDashboardContent() {
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<{
    listings_count?: number;
    bookings_count?: number;
    earnings?: number;
    listings?: Listing[];
    bookings?: Booking[];
  } | null>(null);
  const [hostReviews, setHostReviews] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function load() {
    if (!token) return;
    try {
      const [res, reviewsRes] = await Promise.all([
        api.getHostDashboard(token),
        api.getHostReviews(token).catch(() => ({ reviews: [] })),
      ]);
      setData(res);
      setHostReviews(reviewsRes.reviews ?? []);
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
      {data ? (
        <>
          <View style={styles.header}>
            <Text style={styles.welcome}>Host Dashboard</Text>
            <Text style={styles.subWelcome}>Manage listings, bookings & earnings</Text>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{data.listings_count ?? 0}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{data.bookings_count ?? 0}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>Rs {data.earnings ?? 0}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
          <Pressable style={styles.addListing} onPress={() => router.push('/host/listings-new')}>
            <Text style={styles.addListingText}>+ Add listing</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>Your listings</Text>
          {(data.listings ?? []).length === 0 ? (
            <Text style={styles.empty}>No listings yet. Add your first homestay.</Text>
          ) : (
            (data.listings ?? []).map((item) => {
              const imgUrl =
                (item as { image_url?: string | null }).image_url ??
                (item as { images?: { url: string }[] }).images?.[0]?.url ??
                item.image_urls?.[0];
              return (
              <View key={item.id} style={styles.card}>
                <ListingImage uri={imgUrl} style={styles.thumb} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    Rs {item.price_per_night}/night · {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                  <View style={styles.row}>
                    <Pressable style={styles.smallBtn} onPress={() => router.push(`/listing/${item.id}`)}>
                      <Text style={styles.smallBtnText}>View</Text>
                    </Pressable>
                    <Pressable style={[styles.smallBtn, styles.primaryBtn]} onPress={() => router.push(`/host/listings/${item.id}/edit`)}>
                      <Text style={styles.smallBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.smallBtn} onPress={() => router.push(`/host/blocked-dates/${item.id}`)}>
                      <Text style={styles.smallBtnText}>Block dates</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
            })
          )}
          <Text style={styles.sectionTitle}>Recent bookings</Text>
          {(data.bookings ?? []).length === 0 ? (
            <Text style={styles.empty}>No bookings yet.</Text>
          ) : (
            (data.bookings ?? []).slice(0, 10).map((b) => (
              <View key={b.id} style={styles.card}>
                <Text style={styles.cardLabel}>Homestay</Text>
                <Text style={styles.cardTitle}>{b.listing?.title ?? `Booking #${b.id}`}</Text>
                <Text style={styles.cardMeta}>
                  Check-in: {formatDate(b.check_in)} · Check-out: {formatDate(b.check_out)}
                </Text>
                <Text style={styles.cardMeta}>{b.status}</Text>
                {b.total_amount != null && (
                  <Text style={styles.cardMeta}>Total: Rs {b.total_amount}</Text>
                )}
                <View style={styles.row}>
                  <Pressable style={styles.smallBtn} onPress={() => router.push(`/booking/${b.id}`)}>
                    <Text style={styles.smallBtnText}>Details</Text>
                  </Pressable>
                  <Pressable style={styles.smallBtn} onPress={() => router.push(`/messages/${b.id}`)}>
                    <Text style={styles.smallBtnText}>Message</Text>
                  </Pressable>
                  {b.status === 'pending' && (
                    <>
                      <Pressable
                        style={[styles.smallBtn, styles.approveBtn]}
                        disabled={updatingId === b.id}
                        onPress={async () => {
                          if (!token) return;
                          setUpdatingId(b.id);
                          try {
                            await api.updateBookingStatus(token, b.id, 'approved');
                            await load();
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                      >
                        <Text style={styles.smallBtnText}>{updatingId === b.id ? '…' : 'Approve'}</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.smallBtn, styles.declineBtn]}
                        disabled={updatingId === b.id}
                        onPress={async () => {
                          if (!token) return;
                          setUpdatingId(b.id);
                          try {
                            await api.updateBookingStatus(token, b.id, 'declined');
                            await load();
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                      >
                        <Text style={styles.smallBtnText}>Decline</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
          <Text style={styles.sectionTitle}>Reviews</Text>
          {hostReviews.length === 0 ? (
            <Text style={styles.empty}>No reviews yet.</Text>
          ) : (
            hostReviews.slice(0, 5).map((r: unknown, i: number) => (
              <View key={i} style={styles.card}>
                <Text style={styles.cardMeta}>{(r as { listing_title?: string })?.listing_title ?? 'Listing'}</Text>
                <Text style={styles.cardTitle}>{(r as { rating?: number })?.rating ?? 0} stars</Text>
                <Text style={styles.cardMeta} numberOfLines={2}>{(r as { comment?: string })?.comment ?? '—'}</Text>
              </View>
            ))
          )}
        </>
      ) : (
        <Text style={styles.empty}>Could not load dashboard. Pull to refresh.</Text>
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
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface.card, borderRadius: radius.lg },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.accentAlt[500] },
  statLabel: { fontSize: 12, color: colors.text.muted, marginTop: 4 },
  addListing: {
    backgroundColor: colors.accent[500],
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addListingText: { color: colors.text.primary, fontWeight: '600' },
  sectionTitle: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.md },
  empty: { color: colors.text.muted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  thumb: { width: '100%', height: 100, borderRadius: radius.sm, marginBottom: spacing.sm },
  cardBody: {},
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
  approveBtn: { backgroundColor: colors.success },
  declineBtn: { backgroundColor: colors.error },
  smallBtnText: { color: colors.text.primary, fontSize: 14, fontWeight: '500' },
});
