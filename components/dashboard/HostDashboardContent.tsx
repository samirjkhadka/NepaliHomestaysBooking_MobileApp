import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api, type Listing, type Booking } from '@/lib/api';
import { ListingImage } from '@/components/ListingImage';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { canSendMessagesForBookingStatus } from '@/lib/booking-messaging';
import { formatRs } from '@/lib/format';

const HOST_TABS_ALL = ['overview', 'listings', 'bookings', 'calendar', 'reviews', 'messages', 'profile'] as const;
type HostTab = (typeof HOST_TABS_ALL)[number];

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

function listingStatusLabel(listing: Listing): string {
  const st = (listing.status || (listing.is_active ? 'approved' : 'disabled') || '').toLowerCase();
  if (st === 'pending') return 'Pending review';
  if (st === 'rejected') return 'Rejected';
  if (st === 'approved') return 'Enabled';
  if (st === 'disabled') return 'Disabled';
  return st || '—';
}

export function HostDashboardContent() {
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<{
    current_user_id?: number;
    listings_count?: number;
    bookings_count?: number;
    earnings?: number;
    earnings_currency?: string;
    listings?: Listing[];
    bookings?: Booking[];
  } | null>(null);
  const [hostReviews, setHostReviews] = useState<unknown[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [tab, setTab] = useState<HostTab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [listingStatusId, setListingStatusId] = useState<number | null>(null);
  const [calendarRows, setCalendarRows] = useState<{ listing: Listing; count: number; preview: string }[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const [coHostModalListingId, setCoHostModalListingId] = useState<number | null>(null);
  const [coHostEmail, setCoHostEmail] = useState('');
  const [coHostName, setCoHostName] = useState('');
  const [coHostPhone, setCoHostPhone] = useState('');
  const [coHostAdding, setCoHostAdding] = useState(false);

  const currentUserId = data?.current_user_id;
  const isPrimaryHost = useCallback(
    (listing: Listing) => currentUserId != null && listing.host_id === currentUserId,
    [currentUserId]
  );

  const isCoHostOnly = useMemo(() => {
    const listings = data?.listings ?? [];
    if (!listings.length || currentUserId == null) return false;
    return listings.every((l) => l.host_id !== currentUserId);
  }, [data?.listings, currentUserId]);

  const visibleTabs = useMemo(() => {
    if (isCoHostOnly) return ['overview', 'listings'] as const;
    return HOST_TABS_ALL;
  }, [isCoHostOnly]);

  useEffect(() => {
    if (isCoHostOnly && tab !== 'overview' && tab !== 'listings') {
      setTab('listings');
    }
  }, [isCoHostOnly, tab]);

  async function load() {
    if (!token) return;
    try {
      const [res, reviewsRes] = await Promise.all([
        api.getHostDashboard(token),
        api.getHostReviews(token, 1, 50).catch(() => ({ reviews: [], total: 0 })),
      ]);
      setData(res);
      setHostReviews(reviewsRes.reviews ?? []);
      setReviewsTotal((reviewsRes as { total?: number }).total ?? (reviewsRes.reviews?.length ?? 0));
      setReviewsPage(1);
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

  async function loadMoreReviews() {
    if (!token || reviewsLoadingMore) return;
    const next = reviewsPage + 1;
    setReviewsLoadingMore(true);
    try {
      const res = await api.getHostReviews(token, next, 50);
      const chunk = res.reviews ?? [];
      setHostReviews((prev) => [...prev, ...chunk]);
      setReviewsPage(next);
    } catch {
      /* ignore */
    } finally {
      setReviewsLoadingMore(false);
    }
  }

  async function loadCalendarPreview() {
    const listings = data?.listings ?? [];
    if (!listings.length) {
      setCalendarRows([]);
      return;
    }
    setCalendarLoading(true);
    try {
      const rows = await Promise.all(
        listings.map(async (listing) => {
          try {
            const raw = await api.getBlockedDates(listing.id);
            const dates = Array.isArray(raw) ? raw : raw?.blocked_dates ?? [];
            const preview = dates.slice(0, 3).join(', ') + (dates.length > 3 ? '…' : '');
            return { listing, count: dates.length, preview: preview || '—' };
          } catch {
            return { listing, count: 0, preview: '—' };
          }
        })
      );
      setCalendarRows(rows);
    } finally {
      setCalendarLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'calendar' && data?.listings?.length) {
      loadCalendarPreview();
    }
  }, [tab, data?.listings]);

  function confirmListingStatus(listing: Listing, next: 'approved' | 'disabled') {
    const title = next === 'disabled' ? 'Disable listing?' : 'Enable listing?';
    Alert.alert(title, `“${listing.title}”`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: next === 'disabled' ? 'Disable' : 'Enable',
        style: next === 'disabled' ? 'destructive' : 'default',
        onPress: async () => {
          if (!token) return;
          setListingStatusId(listing.id);
          try {
            await api.setListingStatus(token, listing.id, next);
            await load();
          } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to update.';
            Alert.alert('Error', msg);
          } finally {
            setListingStatusId(null);
          }
        },
      },
    ]);
  }

  async function submitCoHost() {
    if (!token || coHostModalListingId == null || !coHostEmail.trim()) return;
    setCoHostAdding(true);
    try {
      await api.addCoHost(token, coHostModalListingId, {
        email: coHostEmail.trim(),
        name: coHostName.trim() || undefined,
        phone: coHostPhone.trim() || undefined,
      });
      setCoHostModalListingId(null);
      setCoHostEmail('');
      setCoHostName('');
      setCoHostPhone('');
      await load();
      Alert.alert('Success', 'Co-host added.');
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to add co-host.';
      Alert.alert('Error', msg);
    } finally {
      setCoHostAdding(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarInner}>
        {visibleTabs.map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            accessibilityLabel={`Host tab ${t}`}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.replace(/-/g, ' ')}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accentAlt[500]} />
        }
      >
        {!data ? (
          <Text style={styles.empty}>Could not load dashboard. Pull to refresh.</Text>
        ) : (
          <>
            {tab === 'overview' && (
              <>
                <View style={styles.header}>
                  <Text style={styles.welcome}>Host dashboard</Text>
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
                    <Text style={styles.statValue}>
                      {formatRs(data.earnings ?? 0)}
                      {data.earnings_currency ? ` ${data.earnings_currency}` : ''}
                    </Text>
                    <Text style={styles.statLabel}>Earnings</Text>
                  </View>
                </View>
                {!isCoHostOnly && (
                  <Pressable style={styles.addListing} onPress={() => router.push('/host/listings-new')} accessibilityRole="button" accessibilityLabel="Add listing">
                    <Text style={styles.addListingText}>+ Add listing</Text>
                  </Pressable>
                )}
              </>
            )}

            {tab === 'listings' && (
              <>
                <Text style={styles.sectionTitle}>Your listings</Text>
                {!isCoHostOnly && (
                  <Pressable style={styles.addListing} onPress={() => router.push('/host/listings-new')}>
                    <Text style={styles.addListingText}>+ Add listing</Text>
                  </Pressable>
                )}
                {(data.listings ?? []).length === 0 ? (
                  <Text style={styles.empty}>No listings yet.</Text>
                ) : (
                  (data.listings ?? []).map((item) => {
                    const imgUrl =
                      (item as { image_url?: string | null }).image_url ??
                      (item as { images?: { url: string }[] }).images?.[0]?.url ??
                      item.image_urls?.[0];
                    const st = (item.status || '').toLowerCase();
                    const isApproved = st === 'approved' || (st === '' && item.is_active);
                    const isDisabled = st === 'disabled' || st === 'inactive';
                    const disabledByAdmin = Boolean(item.disabled_by_admin);
                    const canToggle = !disabledByAdmin && (isApproved || isDisabled);
                    const primary = isPrimaryHost(item);
                    const coHosts = (item.hosts ?? []).filter((h) => !h.is_primary);

                    return (
                      <View key={item.id} style={styles.card}>
                        <ListingImage uri={imgUrl} style={styles.thumb} resizeMode="cover" />
                        <View style={styles.cardBody}>
                          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                          {item.location ? <Text style={styles.cardMeta}>{item.location}</Text> : null}
                          <Text style={styles.cardMeta}>
                            {formatRs(item.price_per_night)}/night · {listingStatusLabel(item)}
                          </Text>
                          {disabledByAdmin ? (
                            <Text style={styles.warn}>Disabled by admin — contact support to change.</Text>
                          ) : null}
                          <View style={styles.row}>
                            {canToggle ? (
                              isApproved ? (
                                <Pressable
                                  style={[styles.smallBtn, styles.declineBtn]}
                                  disabled={listingStatusId === item.id}
                                  onPress={() => confirmListingStatus(item, 'disabled')}
                                  accessibilityLabel={`Disable ${item.title}`}
                                >
                                  <Text style={[styles.smallBtnText, styles.smallBtnTextOnAccent]}>Disable</Text>
                                </Pressable>
                              ) : (
                                <Pressable
                                  style={[styles.smallBtn, styles.approveBtn]}
                                  disabled={listingStatusId === item.id}
                                  onPress={() => confirmListingStatus(item, 'approved')}
                                  accessibilityLabel={`Enable ${item.title}`}
                                >
                                  <Text style={[styles.smallBtnText, styles.smallBtnTextOnAccent]}>Enable</Text>
                                </Pressable>
                              )
                            ) : null}
                            <Pressable style={styles.smallBtn} onPress={() => router.push(`/host/listings/${item.id}/edit`)}>
                              <Text style={styles.smallBtnText}>Edit</Text>
                            </Pressable>
                            {isApproved ? (
                              <Pressable style={styles.smallBtn} onPress={() => router.push(`/listing/${item.id}`)}>
                                <Text style={styles.smallBtnText}>View</Text>
                              </Pressable>
                            ) : null}
                            <Pressable style={styles.smallBtn} onPress={() => router.push(`/host/blocked-dates/${item.id}`)}>
                              <Text style={styles.smallBtnText}>Block dates</Text>
                            </Pressable>
                          </View>
                          {primary && coHosts.length > 0 ? (
                            <View style={styles.coHostList}>
                              <Text style={styles.coHostTitle}>Co-hosts:</Text>
                              {coHosts.map((h) => (
                                <View key={h.id} style={styles.coHostRow}>
                                  <Text style={styles.cardMeta}>{h.name ?? h.email ?? `User #${h.id}`}</Text>
                                  <Pressable
                                    onPress={() => {
                                      if (!token) return;
                                      Alert.alert('Remove co-host?', 'They will lose access to this listing.', [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                          text: 'Remove',
                                          style: 'destructive',
                                          onPress: async () => {
                                            try {
                                              await api.removeCoHost(token, item.id, h.id);
                                              await load();
                                            } catch (e: unknown) {
                                              const msg =
                                                e && typeof e === 'object' && 'message' in e
                                                  ? String((e as { message: string }).message)
                                                  : 'Failed to remove.';
                                              Alert.alert('Error', msg);
                                            }
                                          },
                                        },
                                      ]);
                                    }}
                                    accessibilityLabel={`Remove co-host ${h.name ?? h.id}`}
                                  >
                                    <Text style={styles.removeLink}>Remove</Text>
                                  </Pressable>
                                </View>
                              ))}
                            </View>
                          ) : null}
                          {primary ? (
                            <Pressable style={styles.linkBtn} onPress={() => { setCoHostModalListingId(item.id); setCoHostEmail(''); setCoHostName(''); setCoHostPhone(''); }}>
                              <Text style={styles.linkBtnText}>+ Add co-host</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </>
            )}

            {tab === 'bookings' && !isCoHostOnly && (
              <>
                <Text style={styles.sectionTitle}>Bookings</Text>
                {(data.bookings ?? []).length === 0 ? (
                  <Text style={styles.empty}>No bookings yet.</Text>
                ) : (
                  (data.bookings ?? []).map((b) => (
                    <View key={b.id} style={styles.card}>
                      <Text style={styles.cardLabel}>Homestay</Text>
                      <Text style={styles.cardTitle}>{b.listing?.title ?? `Booking #${b.id}`}</Text>
                      <Text style={styles.cardMeta}>
                        Check-in: {formatDate(b.check_in)} · Check-out: {formatDate(b.check_out)}
                      </Text>
                      <Text style={styles.cardMeta}>{b.status}</Text>
                      {b.total_amount != null && <Text style={styles.cardMeta}>Total: {formatRs(b.total_amount)}</Text>}
                      <View style={styles.row}>
                        <Pressable style={styles.smallBtn} onPress={() => router.push(`/booking/${b.id}`)}>
                          <Text style={styles.smallBtnText}>Details</Text>
                        </Pressable>
                        {canSendMessagesForBookingStatus(b.status) ? (
                          <Pressable style={styles.smallBtn} onPress={() => router.push(`/messages/${b.id}`)}>
                            <Text style={styles.smallBtnText}>Message</Text>
                          </Pressable>
                        ) : null}
                        {b.status === 'pending' ? (
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
                              <Text style={[styles.smallBtnText, styles.smallBtnTextOnAccent]}>{updatingId === b.id ? '…' : 'Approve'}</Text>
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
                              <Text style={[styles.smallBtnText, styles.smallBtnTextOnAccent]}>Decline</Text>
                            </Pressable>
                          </>
                        ) : null}
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {tab === 'calendar' && !isCoHostOnly && (
              <>
                <Text style={styles.sectionTitle}>Calendar</Text>
                <Text style={styles.cardMeta}>Blocked dates per listing. Tap a row to manage dates.</Text>
                {calendarLoading ? (
                  <ActivityIndicator style={{ marginTop: spacing.md }} color={colors.accent[500]} />
                ) : calendarRows.length === 0 ? (
                  <Text style={styles.empty}>No listings.</Text>
                ) : (
                  calendarRows.map(({ listing, count, preview }) => (
                    <Pressable key={listing.id} style={styles.card} onPress={() => router.push(`/host/blocked-dates/${listing.id}`)}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{listing.title}</Text>
                      <Text style={styles.cardMeta}>{count} blocked date(s)</Text>
                      <Text style={styles.cardMeta} numberOfLines={2}>{preview}</Text>
                    </Pressable>
                  ))
                )}
              </>
            )}

            {tab === 'reviews' && !isCoHostOnly && (
              <>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <Text style={styles.cardMeta}>Guest reviews ({reviewsTotal} total)</Text>
                {hostReviews.length === 0 ? (
                  <Text style={styles.empty}>No reviews yet.</Text>
                ) : (
                  <>
                    {hostReviews.map((r: unknown, i: number) => (
                      <View key={i} style={styles.card}>
                        <Text style={styles.cardMeta}>{(r as { listing_title?: string })?.listing_title ?? 'Listing'}</Text>
                        <Text style={styles.cardTitle}>{(r as { rating?: number })?.rating ?? 0} stars</Text>
                        <Text style={styles.cardMeta} numberOfLines={4}>{(r as { comment?: string })?.comment ?? '—'}</Text>
                      </View>
                    ))}
                    {hostReviews.length < reviewsTotal ? (
                      <Pressable style={styles.smallBtn} onPress={loadMoreReviews} disabled={reviewsLoadingMore}>
                        <Text style={styles.smallBtnText}>{reviewsLoadingMore ? 'Loading…' : 'Load more'}</Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
              </>
            )}

            {tab === 'messages' && !isCoHostOnly && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Messages</Text>
                <Text style={styles.cardMeta}>Open the Messages tab for all conversations.</Text>
                <Pressable style={styles.addListing} onPress={() => router.push('/(tabs)/messages')}>
                  <Text style={styles.addListingText}>Go to messages</Text>
                </Pressable>
              </View>
            )}

            {tab === 'profile' && !isCoHostOnly && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Host profile</Text>
                <Text style={styles.cardMeta}>Account, password, and profile details are in the Profile tab.</Text>
                <Pressable style={styles.addListing} onPress={() => router.push('/(tabs)/profile')}>
                  <Text style={styles.addListingText}>Open profile</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={coHostModalListingId != null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add co-host</Text>
            <Text style={styles.cardMeta}>They can log in and help manage this listing.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              placeholderTextColor={colors.text.muted}
              value={coHostEmail}
              onChangeText={setCoHostEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Name (optional)"
              placeholderTextColor={colors.text.muted}
              value={coHostName}
              onChangeText={setCoHostName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone (optional)"
              placeholderTextColor={colors.text.muted}
              value={coHostPhone}
              onChangeText={setCoHostPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.smallBtn} onPress={() => setCoHostModalListingId(null)}>
                <Text style={styles.smallBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.smallBtn, styles.approveBtn]}
                onPress={submitCoHost}
                disabled={coHostAdding || !coHostEmail.trim()}
              >
                {coHostAdding ? <ActivityIndicator color="#fff" /> : <Text style={[styles.smallBtnText, styles.smallBtnTextOnAccent]}>Add</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabBar: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBarInner: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: spacing.sm, alignItems: 'center' },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface.input,
    marginRight: spacing.sm,
  },
  tabActive: { backgroundColor: colors.forest[500] },
  tabText: { color: colors.text.secondary, fontWeight: '600', textTransform: 'capitalize' },
  tabTextActive: { color: colors.text.onAccent },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { marginBottom: spacing.lg },
  welcome: { ...typography.title, color: colors.text.primary, marginBottom: spacing.xs },
  subWelcome: { ...typography.bodySm, color: colors.text.muted },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.accentAlt[500], textAlign: 'center' },
  statLabel: { fontSize: 12, color: colors.text.muted, marginTop: 4 },
  addListing: {
    backgroundColor: colors.accent[500],
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addListingText: { color: colors.text.onAccent, fontWeight: '600' },
  sectionTitle: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.md },
  empty: { color: colors.text.muted, marginBottom: spacing.lg },
  warn: { color: colors.warning, fontSize: 13, marginTop: spacing.xs },
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  smallBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.input,
  },
  approveBtn: { backgroundColor: colors.success },
  declineBtn: { backgroundColor: colors.error },
  smallBtnText: { color: colors.text.primary, fontSize: 14, fontWeight: '500' },
  smallBtnTextOnAccent: { color: colors.text.onAccent },
  coHostList: { marginTop: spacing.sm },
  coHostTitle: { fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  coHostRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  removeLink: { color: colors.error, fontWeight: '600' },
  linkBtn: { marginTop: spacing.sm },
  linkBtnText: { color: colors.accent[500], fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalBox: { backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing.lg },
  modalTitle: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.sm },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.background,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' },
});
