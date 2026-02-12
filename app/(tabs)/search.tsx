import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  type ListRenderItemInfo,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, type Listing, type Province, type District } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { ListingBadges } from '@/components/ListingBadges';
import { ListingImage } from '@/components/ListingImage';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [location, setLocation] = useState('');
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [guests, setGuests] = useState('');
  const [results, setResults] = useState<Listing[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.getProvinces().then((p) => setProvinces(Array.isArray(p) ? p : [])).catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    if (provinceId) {
      api.getDistricts(provinceId).then((d) => setDistricts(Array.isArray(d) ? d : [])).catch(() => setDistricts([]));
      setDistrictId(null);
    } else {
      setDistricts([]);
      setDistrictId(null);
    }
  }, [provinceId]);

  async function handleSearch() {
    setSearching(true);
    setSearched(true);
    try {
      const res = await api.getListings({
        location: location.trim() || undefined,
        province_id: provinceId ?? undefined,
        district_id: districtId ?? undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        guests: guests ? Number(guests) : undefined,
        limit: 50,
      });
      setResults(res.listings ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function renderItem({ item }: ListRenderItemInfo<Listing>) {
    const imgUrl = (item as { images?: { url: string }[] }).images?.[0]?.url ?? item.image_urls?.[0];
    const badge = (item as { badge?: string }).badge ?? null;
    return (
      <Pressable style={styles.card} onPress={() => router.push(`/listing/${item.id}`)}>
        <View style={styles.cardImageWrap}>
          <ListingImage uri={imgUrl} style={styles.cardImage} resizeMode="cover" />
          {badge ? <View style={styles.cardBadge}><ListingBadges badge={badge} compact /></View> : null}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta}>
            {item.location || 'Nepal'} · {t('listing_rs')} {item.price_per_night}{t('home_per_night')}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Location (text)</Text>
      <View style={styles.inputRow}>
        <Ionicons name="location-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('search_placeholder')}
          placeholderTextColor={colors.text.muted}
          value={location}
          onChangeText={setLocation}
        />
      </View>
      <Text style={styles.label}>Province</Text>
      <View style={styles.row}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Pressable
            style={[styles.chip, !provinceId && styles.chipActive]}
            onPress={() => setProvinceId(null)}
          >
            <Text style={[styles.chipText, !provinceId && styles.chipTextActive]}>Any</Text>
          </Pressable>
          {provinces.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.chip, provinceId === p.id && styles.chipActive]}
              onPress={() => setProvinceId(p.id)}
            >
              <Text style={[styles.chipText, provinceId === p.id && styles.chipTextActive]}>{p.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {districts.length > 0 && (
        <>
          <Text style={styles.label}>District</Text>
          <View style={styles.row}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <Pressable style={[styles.chip, !districtId && styles.chipActive]} onPress={() => setDistrictId(null)}>
                <Text style={[styles.chipText, !districtId && styles.chipTextActive]}>Any</Text>
              </Pressable>
              {districts.map((d) => (
                <Pressable
                  key={d.id}
                  style={[styles.chip, districtId === d.id && styles.chipActive]}
                  onPress={() => setDistrictId(d.id)}
                >
                  <Text style={[styles.chipText, districtId === d.id && styles.chipTextActive]}>{d.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </>
      )}
      <View style={styles.row2}>
        <View style={styles.half}>
          <Text style={styles.label}>Min price (Rs)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="cash-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Max price (Rs)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="cash-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('search_any')}
              placeholderTextColor={colors.text.muted}
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>
      <Text style={styles.label}>Guests</Text>
      <View style={styles.inputRow}>
        <Ionicons name="people-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('search_guests_placeholder')}
          placeholderTextColor={colors.text.muted}
          value={guests}
          onChangeText={setGuests}
          keyboardType="number-pad"
        />
      </View>
      <Pressable style={styles.button} onPress={handleSearch} disabled={searching}>
        {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('search_button')}</Text>}
      </Pressable>
      {searched && (
        <>
          <Text style={styles.resultCount}>{results.length} homestays found</Text>
          {results.length === 0 ? (
            <Text style={styles.empty}>{t('search_no_results')}</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              scrollEnabled={false}
              style={styles.list}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { color: colors.text.secondary, fontSize: 14, marginBottom: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text.primary, fontSize: 16, paddingVertical: spacing.sm, minHeight: 24 },
  row: { marginBottom: spacing.md },
  row2: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  chipScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface.card,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: { backgroundColor: colors.accent[500] },
  chipText: { color: colors.text.secondary, fontSize: 14 },
  chipTextActive: { color: colors.text.primary, fontWeight: '600' },
  button: {
    backgroundColor: colors.accent[500],
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  buttonText: { color: colors.text.primary, fontWeight: '600', fontSize: 16 },
  resultCount: { color: colors.text.secondary, marginBottom: spacing.md },
  empty: { color: colors.text.muted },
  list: { marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 160 },
  cardBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  cardInfo: { padding: spacing.md },
  cardTitle: { color: colors.text.primary, fontWeight: '600', fontSize: 16 },
  cardMeta: { color: colors.text.muted, fontSize: 14, marginTop: 4 },
});
