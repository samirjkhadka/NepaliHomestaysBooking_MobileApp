import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { api, type Listing } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { AMENITIES_OPTIONS } from '@/constants/facilities';
import { getCached, setCached, cacheKeys } from '@/lib/cache';
import { useTranslation } from '@/lib/i18n';
import { SkeletonListingDetail } from '@/components/Skeleton';
import { ListingBadges } from '@/components/ListingBadges';
import { ListingImage } from '@/components/ListingImage';

const IMG_W = Dimensions.get('window').width;

/** Section labels matching frontend listing display (for dynamic sections). */
const SECTION_LABELS: Record<string, string> = {
  owners_story: "Homestay owner's story",
  history: 'History',
  about_us: 'About us',
  their_community: 'Their community',
  whats_included_in_price: "What's included in the price",
  place_history: 'Place history',
  attractions: 'Attractions',
  homestay_highlights: 'Homestay highlights',
  things_to_do_nearby: 'Things to do near the homestay',
  impact_in_community: 'Impact in the community',
  how_to_get_there: 'How to get there',
  nearby_homestays: 'Nearby homestays',
  faqs: 'FAQs',
};

const TRUST_BADGES = ['Free cancellation for 48 hours', 'Verified homestay host', 'Secure payment process'];

type HostProfile = { id: number; name: string; avatar_url: string | null; bio: string | null; brief_intro?: string | null; superhost?: boolean; local_expert?: boolean; languages_spoken?: string | null; is_primary?: boolean; sort_order?: number };
type ReviewRow = { id: number; rating: number; title: string | null; comment: string | null; reviewer_name?: string; created_at: string };

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

function openMap(lat: number, lng: number, title?: string): void {
  const label = title ? encodeURIComponent(title) : '';
  const url = Platform.select({
    ios: `maps:?q=${label}@${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${label || 'Location'})`,
    default: `https://www.google.com/maps?q=${lat},${lng}`,
  });
  Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`));
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const numId = id ? Number(id) : NaN;

  async function load(forceRefresh = false) {
    if (!id || Number.isNaN(numId)) {
      setLoading(false);
      return;
    }
    if (!forceRefresh) {
      const cached = await getCached<Listing>(cacheKeys.listing(numId));
      if (cached) setListing(cached);
    }
    setError(null);
    try {
      const [l, revRes] = await Promise.all([
        api.getListing(numId),
        api.getListingReviews(numId).catch(() => ({ reviews: [], total: 0 })),
      ]);
      setListing(l);
      await setCached(cacheKeys.listing(numId), l);
      const revList = Array.isArray((revRes as { reviews?: ReviewRow[] }).reviews) ? (revRes as { reviews: ReviewRow[] }).reviews : [];
      setReviews(revList);
      setReviewsTotal((revRes as { total?: number }).total ?? revList.length);
    } catch {
      setError(t('listing_error_load'));
      if (forceRefresh) setListing(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!token) return;
    api.getFavorites(token).then((res) => {
      const ids = new Set((res.favorites ?? []).map((f) => f.listing_id));
      setFavoriteIds(ids);
    }).catch(() => {});
  }, [token]);

  async function toggleFavorite() {
    if (Number.isNaN(numId)) return;
    if (!token) {
      Alert.alert(t('auth_sign_in'), t('listing_sign_in_to_fav'), [
        { text: t('common_cancel'), style: 'cancel' },
        { text: t('auth_sign_in'), onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    const isFav = favoriteIds.has(numId);
    try {
      if (isFav) {
        await api.removeFavorite(token, numId);
        setFavoriteIds((prev) => { const s = new Set(prev); s.delete(numId); return s; });
      } else {
        await api.addFavorite(token, numId);
        setFavoriteIds((prev) => new Set(prev).add(numId));
      }
    } catch {
      Alert.alert(t('auth_invalid_input'), t('listing_error_load'));
    }
  }

  if (loading && !listing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <SkeletonListingDetail />
      </ScrollView>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centered}>
        {error ? (
          <>
            <Text style={styles.empty}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => load(true)}>
              <Text style={styles.retryBtnText}>{t('home_retry')}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.empty}>{t('listing_not_found')}</Text>
        )}
      </View>
    );
  }

  type ExtraServiceRow = { id: number; name: string; price_npr: number; unit: string; description?: string | null };
  const L = listing as Listing & {
    images?: { url: string }[];
    badge?: string | null;
    way_to_get_there?: string;
    amenities?: string[];
    extra_services?: ExtraServiceRow[];
    sections?: Record<string, string>;
    host?: { id: number; name: string; avatar_url: string | null; bio: string | null };
    hosts?: HostProfile[];
    latitude?: number | null;
    longitude?: number | null;
  };
  const amenityDisplayItems = (L.amenities ?? [])
    .map((id) => {
      const opt = AMENITIES_OPTIONS.find((o) => o.id === id);
      return opt ? { id: opt.id, label: opt.label, icon: opt.icon } : null;
    })
    .filter((x): x is { id: string; label: string; icon: string } => x != null);
  const extraServices = L.extra_services ?? [];
  const unitLabels: Record<string, string> = { per_person: 'Per person', per_group: 'Per group', fixed: 'Fixed' };

  const imageList = L.images?.map((i) => i.url) ?? listing.image_urls ?? [];
  const images = imageList.length ? imageList : [undefined];
  const isFav = favoriteIds.has(listing.id);
  const showBadges = L.badge != null && L.badge !== '';
  const primaryHost = L.hosts?.find((h) => h.is_primary) ?? L.hosts?.[0] ?? L.host;
  const hostName = primaryHost?.name ?? 'Host';
  const hostBio = primaryHost?.bio ?? primaryHost?.brief_intro ?? null;
  const hostLanguages = primaryHost?.languages_spoken?.trim() ?? null;
  const isSuperhost = primaryHost && 'superhost' in primaryHost && Boolean(primaryHost.superhost);
  const isCulturalExpert = primaryHost && 'local_expert' in primaryHost && Boolean(primaryHost.local_expert);
  const coHosts = (L.hosts ?? []).filter((h) => !h.is_primary).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const averageRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const sections = L.sections ?? {};
  const sectionEntries = Object.entries(sections).filter(
    ([key, content]) => key !== 'how_to_get_there' && !key.startsWith('facility_') && (content?.trim() ?? '') !== ''
  );
  const howToGetThere = sections.how_to_get_there?.trim() || L.way_to_get_there?.trim() || null;
  const lat = L.latitude != null ? Number(L.latitude) : null;
  const lng = L.longitude != null ? Number(L.longitude) : null;
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtnSmall} onPress={() => load(true)}>
            <Text style={styles.retryBtnText}>{t('home_retry')}</Text>
          </Pressable>
        </View>
      ) : null}
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
        {images.map((url, i) => (
          <ListingImage
            key={i}
            uri={url}
            style={styles.galleryImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      {showBadges ? (
        <View style={styles.badgeWrap}>
          <ListingBadges badge={L.badge!} compact={false} />
        </View>
      ) : null}
      <Pressable style={styles.favBtn} onPress={toggleFavorite}>
        <Text style={styles.favBtnText}>{isFav ? '♥' : '♡'}</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.title}>{listing.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {t('listing_rs')} {listing.price_per_night}{t('home_per_night')} · {listing.location || 'Nepal'}
          </Text>
          {(averageRating > 0 || reviewsTotal > 0) && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={colors.accentAlt[500]} />
              <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.meta}>({reviewsTotal} reviews)</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>Up to {listing.max_guests ?? '—'} guests</Text>

        {/* Host */}
        <View style={styles.divider} />
        <View style={styles.hostRow}>
          <View style={styles.avatarWrap}>
            <ListingImage uri={primaryHost?.avatar_url} style={styles.avatar} resizeMode="cover" />
          </View>
          <View style={styles.hostInfo}>
            <Text style={styles.hostTitle}>Entire homestay hosted by {hostName}</Text>
            {hostLanguages ? <Text style={styles.meta}>Languages: {hostLanguages}</Text> : null}
            {(isSuperhost || isCulturalExpert) && (
              <View style={styles.hostBadges}>
                {isSuperhost && <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>Superhost</Text></View>}
                {isCulturalExpert && <View style={[styles.miniBadge, styles.miniBadgeAlt]}><Text style={styles.miniBadgeText}>Cultural expert</Text></View>}
              </View>
            )}
            {hostBio ? <Text style={[styles.desc, styles.justified]}>{hostBio}</Text> : null}
          </View>
        </View>

        {/* Co-hosts */}
        {coHosts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Co-hosts</Text>
            <Text style={styles.meta}>Other hosts who help manage this homestay.</Text>
            {coHosts.map((h) => (
              <View key={h.id} style={styles.hostRow}>
                <View style={styles.avatarWrap}>
                  <ListingImage uri={h.avatar_url} style={styles.avatarSmall} resizeMode="cover" />
                </View>
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>{h.name}</Text>
                  {h.languages_spoken?.trim() ? <Text style={styles.meta}>{h.languages_spoken}</Text> : null}
                  {(h.brief_intro || h.bio) ? <Text style={[styles.desc, styles.justified]}>{h.brief_intro || h.bio}</Text> : null}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Highlights */}
        <View style={styles.divider} />
        <View style={styles.highlight}>
          <Ionicons name="calendar-outline" size={22} color={colors.accent[500]} style={styles.highlightIcon} />
          <View style={styles.highlightText}>
            <Text style={styles.highlightTitle}>Free cancellation for 48 hours</Text>
            <Text style={styles.highlightDesc}>Get a full refund if you change your mind within 48 hours of booking.</Text>
          </View>
        </View>
        <View style={styles.highlight}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.accent[500]} style={styles.highlightIcon} />
          <View style={styles.highlightText}>
            <Text style={styles.highlightTitle}>Great communication</Text>
            <Text style={styles.highlightDesc}>Our hosts are committed to responding quickly and helping you plan your stay.</Text>
          </View>
        </View>
        {isSuperhost && (
          <View style={styles.highlight}>
            <Ionicons name="ribbon-outline" size={22} color={colors.accent[500]} style={styles.highlightIcon} />
            <View style={styles.highlightText}>
              <Text style={styles.highlightTitle}>{hostName} is a Superhost</Text>
              <Text style={styles.highlightDesc}>Superhosts are experienced, highly rated hosts committed to providing great stays.</Text>
            </View>
          </View>
        )}

        {/* About this place */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>About this place</Text>
        <Text style={[styles.desc, styles.justified]}>{listing.description || 'No description provided.'}</Text>

        {/* Dynamic sections */}
        {sectionEntries.map(([key, content]) => {
          const label = SECTION_LABELS[key] ?? key.replace(/_/g, ' ');
          if (key === 'faqs') {
            try {
              const faqs = JSON.parse(content) as { q?: string; a?: string }[];
              if (!Array.isArray(faqs) || faqs.length === 0) return null;
              return (
                <View key={key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{label}</Text>
                  {faqs.map((faq, i) => (
                    <View key={i} style={styles.faqItem}>
                      <Text style={styles.faqQ}>{faq.q}</Text>
                      <Text style={[styles.desc, styles.faqA]}>{faq.a}</Text>
                    </View>
                  ))}
                </View>
              );
            } catch {
              return (
                <View key={key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{label}</Text>
                  <Text style={[styles.desc, styles.justified]}>{content}</Text>
                </View>
              );
            }
          }
          return (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>{label}</Text>
              <Text style={[styles.desc, styles.justified]}>{content}</Text>
            </View>
          );
        })}

        {/* Amenities */}
        {amenityDisplayItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenityGrid}>
              {amenityDisplayItems.map((item) => {
                const iconName = `${item.icon}-outline` as keyof typeof Ionicons.glyphMap;
                return (
                  <View key={item.id} style={styles.amenityRow}>
                    <Ionicons name={iconName in Ionicons.glyphMap ? iconName : 'ellipse-outline'} size={20} color={colors.accentAlt[500]} style={styles.amenityRowIcon} />
                    <Text style={styles.amenityRowLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Extra services */}
        {extraServices.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Extra services (paid add-ons)</Text>
            {extraServices.map((s) => (
              <View key={s.id} style={styles.extraServiceCard}>
                <Text style={styles.extraServiceName}>{s.name}</Text>
                <Text style={styles.extraServicePrice}>NPR {Number(s.price_npr).toLocaleString()} ({unitLabels[s.unit] ?? s.unit})</Text>
                {s.description ? <Text style={[styles.desc, styles.justified]}>{s.description}</Text> : null}
              </View>
            ))}
          </>
        )}

        {/* Reviews */}
        <View style={styles.divider} />
        <View style={styles.reviewsHeader}>
          <Ionicons name="star" size={24} color={colors.accentAlt[500]} />
          <Text style={styles.reviewsTitle}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.meta}> · {reviewsTotal} review{reviewsTotal !== 1 ? 's' : ''}</Text>
        </View>
        {reviews.slice(0, 5).map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={[styles.avatarSmall, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetterSmall}>{(r.reviewer_name || 'Guest').charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.reviewerName}>{r.reviewer_name || 'Guest'}</Text>
                <Text style={styles.reviewDate}>{formatReviewDate(r.created_at)}</Text>
              </View>
            </View>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons key={i} name={i <= r.rating ? 'star' : 'star-outline'} size={14} color={colors.accentAlt[500]} />
              ))}
            </View>
            {r.title ? <Text style={styles.reviewTitle}>{r.title}</Text> : null}
            {r.comment ? <Text style={[styles.desc, styles.justified]}>{r.comment}</Text> : null}
          </View>
        ))}
        {reviewsTotal === 0 && <Text style={styles.meta}>No reviews yet.</Text>}

        {/* Location & directions */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Location & directions</Text>
        {hasCoords ? (
          <Pressable style={styles.mapButton} onPress={() => openMap(lat!, lng!, listing.title)}>
            <Ionicons name="map-outline" size={24} color={colors.text.primary} />
            <Text style={styles.mapButtonText}>View on map</Text>
          </Pressable>
        ) : (
          <Text style={styles.meta}>Exact map location not set.</Text>
        )}
        {howToGetThere ? <Text style={[styles.desc, styles.justified]}>{howToGetThere}</Text> : <Text style={styles.meta}>Directions not provided.</Text>}

        {/* Book & trust badges */}
        <View style={styles.divider} />
        {TRUST_BADGES.map((line, i) => (
          <View key={i} style={styles.trustRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.trustText}>{line}</Text>
          </View>
        ))}
        <Pressable
          style={styles.bookBtn}
          onPress={() => {
            if (!token) {
              Alert.alert(t('auth_sign_in'), t('listing_sign_in_to_book'), [
                { text: t('common_cancel'), style: 'cancel' },
                { text: t('auth_sign_in'), onPress: () => router.push('/(auth)/login') },
              ]);
              return;
            }
            router.push(`/booking/new?listingId=${listing.id}`);
          }}
        >
          <Text style={styles.bookBtnText}>{t('listing_book_now')}</Text>
        </Pressable>
        <Text style={styles.bookHint}>You won't be charged yet</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  empty: { color: colors.text.muted, marginBottom: spacing.md },
  errorBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: 'rgba(239,68,68,0.2)' },
  errorText: { color: colors.error, fontSize: 14 },
  retryBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.accent[500], borderRadius: radius.md },
  retryBtnSmall: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  retryBtnText: { color: colors.accentAlt[500], fontWeight: '600' },
  gallery: { maxHeight: 280 },
  galleryImage: { width: IMG_W, height: 280 },
  favBtn: { position: 'absolute', top: spacing.lg, right: spacing.lg, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  favBtnText: { color: '#fff', fontSize: 24 },
  body: { padding: spacing.lg },
  badgeWrap: { position: 'absolute', top: spacing.lg, left: spacing.lg },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  sectionTitle: { ...typography.subtitle, color: colors.text.primary, marginTop: spacing.md, marginBottom: spacing.sm },
  section: { marginBottom: spacing.lg },
  title: { ...typography.title, color: colors.text.primary, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  meta: { color: colors.text.muted, fontSize: 14, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: colors.text.primary, fontWeight: '600', fontSize: 14 },
  desc: { color: colors.text.secondary, marginBottom: spacing.md },
  justified: { textAlign: 'justify' as const },
  hostRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  avatarWrap: { marginRight: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarSmall: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { backgroundColor: colors.surface.card, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: colors.accent[500], fontWeight: '700', fontSize: 22 },
  avatarLetterSmall: { color: colors.accent[500], fontWeight: '600', fontSize: 18 },
  hostInfo: { flex: 1 },
  hostTitle: { ...typography.subtitle, color: colors.text.primary, marginBottom: 4 },
  hostName: { fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  hostBadges: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  miniBadge: { backgroundColor: colors.surface.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  miniBadgeAlt: { backgroundColor: colors.accent[100] },
  miniBadgeText: { fontSize: 12, fontWeight: '600', color: colors.text.primary },
  highlight: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  highlightIcon: { marginRight: spacing.sm },
  highlightText: { flex: 1 },
  highlightTitle: { fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  highlightDesc: { fontSize: 14, color: colors.text.muted },
  faqItem: { marginBottom: spacing.md },
  faqQ: { fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  faqA: { marginBottom: 0 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  reviewsTitle: { ...typography.subtitle, color: colors.text.primary, marginRight: 4 },
  reviewCard: { marginBottom: spacing.lg },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reviewerName: { fontWeight: '600', color: colors.text.primary },
  reviewDate: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  reviewTitle: { fontWeight: '500', color: colors.text.primary, marginBottom: 4 },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  amenityRow: { flexDirection: 'row', alignItems: 'center', width: '48%', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.surface.card },
  amenityRowIcon: { marginRight: spacing.sm },
  amenityRowLabel: { color: colors.text.primary, fontSize: 14, flex: 1 },
  extraServiceCard: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  extraServiceName: { color: colors.text.primary, fontWeight: '600', marginBottom: 2 },
  extraServicePrice: { color: colors.text.muted, fontSize: 13, marginBottom: 4 },
  starRow: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  mapButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface.card, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  mapButtonText: { color: colors.accentAlt[500], fontWeight: '600' },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  trustText: { fontSize: 14, color: colors.text.muted },
  bookBtn: { backgroundColor: colors.accent[500], borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  bookBtnText: { color: colors.text.primary, fontWeight: '600', fontSize: 16 },
  bookHint: { textAlign: 'center', color: colors.text.muted, fontSize: 12, marginTop: spacing.sm },
});
