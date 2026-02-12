import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, type Listing } from '@/lib/api';
import { ListingImage } from '@/components/ListingImage';
import { Logo } from '@/components/Logo';
import { ListingBadges } from '@/components/ListingBadges';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { getCached, setCached, cacheKeys } from '@/lib/cache';
import { useTranslation } from '@/lib/i18n';
import { SkeletonListingCard } from '@/components/Skeleton';

const CARD_WIDTH = Dimensions.get('window').width - spacing.lg * 2;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [hero, setHero] = useState<Listing[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(forceRefresh = false) {
    if (!forceRefresh) {
      const [cachedHero, cachedFeatured] = await Promise.all([
        getCached<Listing[]>(cacheKeys.hero),
        getCached<Listing[]>(cacheKeys.featured),
      ]);
      if (cachedHero?.length !== undefined) setHero(cachedHero);
      if (cachedFeatured?.length !== undefined) setFeatured(cachedFeatured);
    }
    setError(null);
    try {
      const [heroRes, featuredRes] = await Promise.all([api.getHero(), api.getFeatured()]);
      const h = heroRes.listings ?? [];
      const f = featuredRes.listings ?? [];
      setHero(h);
      setFeatured(f);
      await Promise.all([
        setCached(cacheKeys.hero, h),
        setCached(cacheKeys.featured, f),
      ]);
    } catch {
      setError(t('home_error_load'));
      if (forceRefresh) {
        setHero([]);
        setFeatured([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const showSkeleton = loading && hero.length === 0 && featured.length === 0;

  if (showSkeleton) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Logo size="md" />
        </View>
        <Text style={styles.sectionTitle}>{t('home_discover')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heroScroll} style={styles.heroContainer}>
          {[1, 2].map((i) => (
            <View key={i} style={[styles.heroCard, { width: CARD_WIDTH }]}>
              <SkeletonListingCard />
            </View>
          ))}
        </ScrollView>
        <Text style={styles.sectionTitle}>{t('home_featured')}</Text>
        {[1, 2, 3].map((i) => (
          <SkeletonListingCard key={i} />
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(true);
          }}
          tintColor={colors.accentAlt[500]}
        />
      }
    >
      <View style={styles.header}>
        <Logo size="md" />
      </View>
      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load(true)}>
            <Text style={styles.retryBtnText}>{t('home_retry')}</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.sectionTitle}>{t('home_discover')}</Text>
      {hero.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.heroScroll}
          style={styles.heroContainer}
        >
          {hero.map((item) => {
            const imgUrl =
              (item as { image_url?: string | null }).image_url ??
              (item as { images?: { url: string }[] }).images?.[0]?.url ??
              item.image_urls?.[0];
            const badge = (item as { badge?: string }).badge ?? null;
            return (
              <Pressable
                key={item.id}
                style={styles.heroCard}
                onPress={() => router.push(`/listing/${item.id}`)}
              >
                <ListingImage uri={imgUrl} style={styles.heroImage} resizeMode="cover" />
                {badge ? <View style={styles.heroBadge}><ListingBadges badge={badge} compact /></View> : null}
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.heroPrice}>{t('listing_rs')} {item.price_per_night}{t('home_per_night')}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <Text style={styles.sectionTitle}>{t('home_featured')}</Text>
      {featured.length === 0 ? (
        <Text style={styles.empty}>{t('home_empty_featured')}</Text>
      ) : (
        <View style={styles.featuredGrid}>
          {featured.map((item) => {
            const imgUrl =
              (item as { image_url?: string | null }).image_url ??
              (item as { images?: { url: string }[] }).images?.[0]?.url ??
              item.image_urls?.[0];
            const badge = (item as { badge?: string }).badge ?? null;
            return (
              <Pressable
                key={item.id}
                style={styles.featuredCard}
                onPress={() => router.push(`/listing/${item.id}`)}
              >
                <View style={styles.featuredImageWrap}>
                  <ListingImage uri={imgUrl} style={styles.featuredImage} resizeMode="cover" />
                  {badge ? <View style={styles.featuredBadge}><ListingBadges badge={badge} compact /></View> : null}
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.featuredMeta}>
                    {item.location || 'Nepal'} · {t('listing_rs')} {item.price_per_night}{t('home_per_night')}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      <Pressable style={styles.searchCta} onPress={() => router.push('/(tabs)/search')}>
        <Text style={styles.searchCtaText}>{t('home_search_cta')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  errorBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: 'rgba(239,68,68,0.2)' },
  errorText: { color: colors.error, fontSize: 14 },
  retryBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  retryBtnText: { color: colors.accentAlt[500], fontWeight: '600' },
  sectionTitle: { ...typography.subtitle, color: colors.text.primary, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  heroScroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.md },
  heroContainer: { maxHeight: 260 },
  heroCard: { width: CARD_WIDTH, marginRight: spacing.md, borderRadius: radius.lg, overflow: 'hidden' },
  heroImage: { width: '100%', height: 220 },
  heroBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.5)' },
  heroTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  heroPrice: { color: colors.accentAlt[500], fontSize: 14, marginTop: 4 },
  featuredGrid: { paddingHorizontal: spacing.lg, gap: spacing.md },
  featuredCard: { backgroundColor: colors.surface.card, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  featuredImageWrap: { position: 'relative' },
  featuredImage: { width: '100%', height: 160 },
  featuredBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  featuredInfo: { padding: spacing.md },
  featuredTitle: { color: colors.text.primary, fontWeight: '600', fontSize: 16 },
  featuredMeta: { color: colors.text.muted, fontSize: 14, marginTop: 4 },
  empty: { color: colors.text.muted, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchCta: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.accent[500],
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  searchCtaText: { color: colors.text.primary, fontWeight: '600', fontSize: 16 },
});
