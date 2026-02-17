import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const HERO_CARD_HEIGHT = 280;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [hero, setHero] = useState<Listing[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);
  const heroIndexRef = useRef(0);

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

  useEffect(() => {
    heroIndexRef.current = heroIndex;
  }, [heroIndex]);

  useEffect(() => {
    if (hero.length <= 1) return;
    const interval = setInterval(() => {
      const next = (heroIndexRef.current + 1) % hero.length;
      heroIndexRef.current = next;
      setHeroIndex(next);
      heroScrollRef.current?.scrollTo({
        x: next * (HERO_CARD_WIDTH + spacing.md),
        animated: true,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [hero.length]);

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
            <View key={i} style={[styles.heroCard, { width: HERO_CARD_WIDTH }]}>
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
        <>
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled={false}
            snapToInterval={HERO_CARD_WIDTH + spacing.md}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.heroScroll}
            style={styles.heroContainer}
            onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const i = Math.round(
                e.nativeEvent.contentOffset.x / (HERO_CARD_WIDTH + spacing.md)
              );
              const idx = Math.max(0, Math.min(i, hero.length - 1));
              heroIndexRef.current = idx;
              setHeroIndex(idx);
            }}
          >
            {hero.map((item) => {
              const imgUrl =
                (item as { image_url?: string | null }).image_url ??
                (item as { images?: { url: string }[] }).images?.[0]?.url ??
                item.image_urls?.[0];
              const rating = (item as { average_rating?: number }).average_rating;
              const reviewCount = (item as { review_count?: number }).review_count ?? 0;
              const reviewText =
                reviewCount === 0
                  ? t('no_reviews_yet')
                  : `${Number(rating ?? 0).toFixed(1)} (${reviewCount} ${t('reviews')})`;
              return (
                <View key={item.id} style={styles.heroCard}>
                  <ListingImage uri={imgUrl} style={styles.heroImage} resizeMode="cover" />
                  <View style={styles.heroGradient} />
                  <View style={styles.heroContent}>
                    <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                    {item.location ? (
                      <Text style={styles.heroLocation} numberOfLines={1}>{item.location}</Text>
                    ) : null}
                    <Text style={styles.heroPrice}>
                      {t('listing_rs')} {Number(item.price_per_night ?? 0).toLocaleString()}{t('home_per_night')}
                    </Text>
                    <Text style={styles.heroReviews}>{reviewText}</Text>
                    <View style={styles.heroActions}>
                      <Pressable
                        style={({ pressed }) => [styles.heroBtnPrimary, pressed && styles.heroBtnPressed]}
                        onPress={() => router.push(`/listing/${item.id}`)}
                      >
                        <Text style={styles.heroBtnPrimaryText}>{t('view_homestay')}</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.heroBtnSecondary, pressed && styles.heroBtnPressed]}
                        onPress={() => router.push('/(tabs)/search')}
                      >
                        <Text style={styles.heroBtnSecondaryText}>{t('explore_homestays')}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          {hero.length > 1 && (
            <View style={styles.heroDots}>
              {hero.map((_, i) => (
                <View key={i} style={[styles.heroDot, i === heroIndex && styles.heroDotActive]} />
              ))}
            </View>
          )}
        </>
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
  heroScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  heroContainer: { marginBottom: spacing.sm },
  heroCard: { width: HERO_CARD_WIDTH, height: HERO_CARD_HEIGHT, marginRight: spacing.md, borderRadius: radius.lg, overflow: 'hidden', position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroTitle: { color: '#fff', fontWeight: '700', fontSize: 18, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroLocation: { color: 'rgba(255,255,255,0.95)', fontSize: 14, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  heroPrice: { color: colors.accentAlt[500], fontSize: 15, marginTop: 4, fontWeight: '600' },
  heroReviews: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
  heroActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  heroBtnPrimary: { backgroundColor: colors.accent[500], paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md },
  heroBtnPrimaryText: { color: colors.text.primary, fontWeight: '600', fontSize: 14 },
  heroBtnSecondary: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md },
  heroBtnSecondaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  heroBtnPressed: { opacity: 0.85 },
  heroDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: spacing.md },
  heroDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  heroDotActive: { backgroundColor: colors.accentAlt[500], width: 10, height: 10, borderRadius: 5 },
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
