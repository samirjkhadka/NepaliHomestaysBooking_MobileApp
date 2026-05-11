import { useState, useEffect, useMemo } from 'react';
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
import { StatusBadge } from '@/components/ui/StatusBadge';
import { bookingStatusNorm, canSendMessagesForBookingStatus } from '@/lib/booking-messaging';

const GUEST_SECTIONS = ['bookings', 'wishlist', 'payments'] as const;
type GuestSection = (typeof GUEST_SECTIONS)[number];

const BOOKING_STATUSES = ['all', 'upcoming', 'pending', 'pending_payment', 'approved', 'partial_paid', 'paid', 'completed', 'declined', 'cancelled'] as const;
type BookingStatusFilter = (typeof BOOKING_STATUSES)[number];

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

function needsPaymentAction(status: string | undefined): boolean {
  const s = bookingStatusNorm(status);
  return ['pending', 'pending_payment', 'approved', 'partial_paid'].includes(s);
}

export type GuestDashboardContentProps = {
  /** Show links to Profile / Messages tabs (stack “My bookings” screen). */
  showAccountLinks?: boolean;
};

export function GuestDashboardContent({ showAccountLinks }: GuestDashboardContentProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [section, setSection] = useState<GuestSection>('bookings');
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('all');
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

  const upcomingStatuses = useMemo(() => new Set(['pending', 'pending_payment', 'approved', 'partial_paid', 'paid']), []);

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    if (statusFilter === 'upcoming') {
      return bookings.filter((b) => upcomingStatuses.has(bookingStatusNorm(b.status)));
    }
    return bookings.filter((b) => bookingStatusNorm(b.status) === statusFilter);
  }, [bookings, statusFilter, upcomingStatuses]);

  const paidBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const s = bookingStatusNorm(b.status);
        return s === 'paid' || s === 'completed' || s === 'partial_paid';
      }),
    [bookings]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} accessibilityLabel="Loading dashboard" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      nestedScrollEnabled
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accentAlt[500]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome} accessibilityRole="header">My dashboard</Text>
        <Text style={styles.subWelcome}>Bookings, wishlist, and payment history</Text>
      </View>

      <View style={styles.quickLinks}>
        <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel="Open profile tab">
          <Text style={styles.quickLinkText}>{showAccountLinks ? 'Account & profile' : 'Profile'}</Text>
        </Pressable>
        <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/messages')} accessibilityRole="button" accessibilityLabel="Open messages tab">
          <Text style={styles.quickLinkText}>Messages</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {GUEST_SECTIONS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, section === t && styles.tabActive]}
            onPress={() => setSection(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: section === t }}
          >
            <Text style={[styles.tabText, section === t && styles.tabTextActive]}>
              {t === 'payments' ? 'Payment history' : t === 'bookings' ? 'Bookings' : 'Wishlist'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {section === 'bookings' && (
        <>
          <Text style={styles.sectionTitle}>Filter by status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {BOOKING_STATUSES.map((st) => (
              <Pressable
                key={st}
                style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                onPress={() => setStatusFilter(st)}
                accessibilityRole="button"
                accessibilityState={{ selected: statusFilter === st }}
              >
                <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                  {st === 'all' ? 'All' : st === 'pending_payment' ? 'Pending pay' : st.replace(/_/g, ' ')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {filteredBookings.length === 0 ? (
            <Text style={styles.empty}>No bookings match this filter.</Text>
          ) : (
            filteredBookings.map((b) => (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{b.listing?.title ?? `Booking #${b.id}`}</Text>
                  <StatusBadge status={b.status} />
                </View>
                <Text style={styles.cardMeta}>
                  Check-in: {formatDate(b.check_in)} · Check-out: {formatDate(b.check_out)}
                </Text>
                <Text style={styles.cardMeta}>{b.guests} guests</Text>
                {b.total_amount != null && <Text style={styles.cardMeta}>Total: Rs {b.total_amount}</Text>}
                <View style={styles.row}>
                  <Pressable style={styles.smallBtn} onPress={() => router.push(`/listing/${b.listing_id}`)}>
                    <Text style={styles.smallBtnText}>View listing</Text>
                  </Pressable>
                  {canSendMessagesForBookingStatus(b.status) ? (
                    <Pressable style={styles.smallBtn} onPress={() => router.push(`/messages/${b.id}`)}>
                      <Text style={styles.smallBtnText}>Message</Text>
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.smallBtn} onPress={() => router.push(`/booking/${b.id}`)}>
                    <Text style={styles.smallBtnText}>Details</Text>
                  </Pressable>
                  {needsPaymentAction(b.status) ? (
                    <Pressable style={[styles.smallBtn, styles.primaryBtn]} onPress={() => router.push(`/booking/${b.id}`)}>
                      <Text style={[styles.smallBtnText, styles.smallBtnTextOnAccent]}>Pay / Details</Text>
                    </Pressable>
                  ) : null}
                  {(bookingStatusNorm(b.status) === 'paid' || bookingStatusNorm(b.status) === 'partial_paid') && (
                    <Pressable
                      style={styles.smallBtn}
                      onPress={() => router.push({ pathname: '/booking/review', params: { bookingId: String(b.id) } })}
                    >
                      <Text style={styles.smallBtnText}>Review</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </>
      )}

      {section === 'wishlist' && (
        <>
          <Text style={styles.sectionTitle}>Saved homestays</Text>
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
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.listing_title}
                    </Text>
                    <Text style={styles.cardMeta}>{item.listing_location || 'Nepal'}</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.smallBtn, styles.removeBtn]}
                  onPress={() => {
                    if (!token) return;
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
        </>
      )}

      {section === 'payments' && (
        <>
          <Text style={styles.sectionTitle}>Paid stays</Text>
          {paidBookings.length === 0 ? (
            <Text style={styles.empty}>No payment history yet.</Text>
          ) : (
            paidBookings.map((b) => (
              <View key={b.id} style={styles.card}>
                <Text style={styles.cardTitle}>{b.listing?.title ?? `Booking #${b.id}`}</Text>
                <Text style={styles.cardMeta}>
                  {formatDate(b.check_in)} – {formatDate(b.check_out)}
                </Text>
                {b.total_amount != null && <Text style={styles.cardMeta}>Rs {b.total_amount}</Text>}
                <StatusBadge status={b.status} />
                <View style={styles.row}>
                  <Pressable style={styles.smallBtn} onPress={() => router.push(`/listing/${b.listing_id}`)}>
                    <Text style={styles.smallBtnText}>View listing</Text>
                  </Pressable>
                  <Pressable style={styles.smallBtn} onPress={() => router.push(`/booking/${b.id}`)}>
                    <Text style={styles.smallBtnText}>Receipt / details</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { marginBottom: spacing.md },
  welcome: { ...typography.title, color: colors.text.primary, marginBottom: spacing.xs },
  subWelcome: { ...typography.bodySm, color: colors.text.muted },
  quickLinks: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  quickLink: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickLinkText: { color: colors.accent[500], fontWeight: '600', fontSize: 14 },
  tabRow: { gap: spacing.sm, marginBottom: spacing.lg, paddingVertical: spacing.xs },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface.input,
    marginRight: spacing.sm,
  },
  tabActive: { backgroundColor: colors.forest[500] },
  tabText: { color: colors.text.secondary, fontWeight: '600', fontSize: 14, textTransform: 'capitalize' },
  tabTextActive: { color: colors.text.onAccent },
  sectionTitle: { ...typography.subtitle, color: colors.accentAlt[500], marginBottom: spacing.sm },
  filterRow: { gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface.input,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.accent[100], borderColor: colors.accent[500] },
  filterChipText: { fontSize: 12, color: colors.text.secondary, textTransform: 'capitalize' },
  filterChipTextActive: { color: colors.accent[600], fontWeight: '600' },
  empty: { color: colors.text.muted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  cardLabel: { color: colors.text.muted, fontSize: 12, marginBottom: 2 },
  cardTitle: { flex: 1, color: colors.text.primary, fontWeight: '600', marginBottom: 4 },
  cardMeta: { color: colors.text.muted, fontSize: 14, marginBottom: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  smallBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.input,
  },
  primaryBtn: { backgroundColor: colors.accent[500] },
  removeBtn: { marginTop: spacing.sm },
  smallBtnText: { color: colors.text.primary, fontSize: 14, fontWeight: '500' },
  smallBtnTextOnAccent: { color: colors.text.onAccent },
  thumbWrap: { position: 'relative', marginBottom: spacing.sm },
  thumb: { width: '100%', height: 100, borderRadius: radius.sm },
  cardBody: {},
});
