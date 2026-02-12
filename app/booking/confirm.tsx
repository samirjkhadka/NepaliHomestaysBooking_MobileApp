import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { api, type Listing } from '@/lib/api';
import { ListingImage } from '@/components/ListingImage';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { useTranslation } from '@/lib/i18n';

type Preview = {
  nights: number;
  price_per_night: number;
  subtotal_room: number;
  extra_services_lines?: { name: string; amount: number }[];
  extra_services_total?: number;
  subtotal: number;
  fee_label: string | null;
  fee_amount: number;
  total: number;
  currency: string;
};

export default function ConfirmBookingScreen() {
  const { listingId, checkIn, checkOut, guests, message, extra_services: extraServicesParam } = useLocalSearchParams<{
    listingId: string;
    checkIn: string;
    checkOut: string;
    guests: string;
    message?: string;
    extra_services?: string;
  }>();
  const extraServices: { extra_service_id: number; quantity: number }[] = (() => {
    if (!extraServicesParam || typeof extraServicesParam !== 'string') return [];
    try {
      const parsed = JSON.parse(extraServicesParam);
      return Array.isArray(parsed)
        ? parsed.filter((p: unknown) => p && typeof (p as { extra_service_id?: number }).extra_service_id === 'number' && typeof (p as { quantity?: number }).quantity === 'number')
        : [];
    } catch {
      return [];
    }
  })();
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [listing, setListing] = useState<Listing | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const lid = listingId ? Number(listingId) : NaN;
  const g = guests ? parseInt(guests, 10) : 0;

  useEffect(() => {
    if (Number.isNaN(lid) || !checkIn || !checkOut) {
      setLoading(false);
      return;
    }
    const g = guests ? parseInt(guests, 10) : 1;
    Promise.all([
      api.getListing(lid),
      api.getBookingPreview(lid, checkIn, checkOut, g >= 1 ? g : undefined, extraServices.length ? extraServices : undefined),
    ])
      .then(([list, pr]) => {
        setListing(list as Listing);
        setPreview(pr as Preview);
      })
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [lid, checkIn, checkOut, guests, extraServicesParam]);

  async function handleConfirmAndPay() {
    if (!listing || !token || !preview) return;
    if (!checkIn || !checkOut || !g || g < 1) {
      Alert.alert(t('common_error') || 'Error', 'Invalid booking details.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.initiatePayment(token, {
        listing_id: listing.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: g,
        message: (message ?? '').trim() || undefined,
        extra_services: extraServices.length ? extraServices : undefined,
      });
      const bookingId = (res as { booking_id?: number }).booking_id ?? res.booking?.id;
      if (res.redirect_url) {
        router.replace({
          pathname: '/booking/pay',
          params: { url: res.redirect_url, bookingId: bookingId ? String(bookingId) : '' },
        });
      } else if (res.redirect_form && typeof res.redirect_form === 'object' && res.redirect_form.action) {
        router.replace({
          pathname: '/booking/pay',
          params: {
            bookingId: bookingId ? String(bookingId) : '',
            redirectForm: JSON.stringify(res.redirect_form),
          },
        });
      } else {
        Alert.alert('Booking created', 'Check your dashboard for payment link.');
        router.replace('/(tabs)/dashboard');
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Booking failed';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }
  if (!listing || !preview) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load booking details.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const imgUrl = (listing as { image_url?: string }).image_url ?? (listing as { images?: { url: string }[] }).images?.[0]?.url ?? listing.image_urls?.[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Booking summary</Text>
      <View style={styles.card}>
        <ListingImage uri={imgUrl} style={styles.thumb} resizeMode="cover" />
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.meta}>{listing.location || 'Nepal'}</Text>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={18} color={colors.text.muted} />
          <Text style={styles.detail}>{checkIn} → {checkOut}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="people-outline" size={18} color={colors.text.muted} />
          <Text style={styles.detail}>{g} guest{g !== 1 ? 's' : ''}</Text>
        </View>
        {message?.trim() ? (
          <View style={styles.messageBlock}>
            <Text style={styles.label}>Message to host</Text>
            <Text style={styles.messageText}>{message.trim()}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Price details</Text>
      <View style={styles.priceCard}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Rs {preview.price_per_night} × {preview.nights} night{preview.nights !== 1 ? 's' : ''}</Text>
          <Text style={styles.priceValue}>Rs {(preview.subtotal_room ?? preview.subtotal ?? 0).toFixed(2)}</Text>
        </View>
        {preview.extra_services_lines && preview.extra_services_lines.length > 0 && (
          <>
            {preview.extra_services_lines.map((line, i) => (
              <View key={i} style={styles.priceRow}>
                <Text style={styles.priceLabel}>{line.name}</Text>
                <Text style={styles.priceValue}>Rs {line.amount.toFixed(2)}</Text>
              </View>
            ))}
            {preview.extra_services_total !== undefined && preview.extra_services_total > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Extra services</Text>
                <Text style={styles.priceValue}>Rs {preview.extra_services_total.toFixed(2)}</Text>
              </View>
            )}
          </>
        )}
        {preview.fee_label && preview.fee_amount !== 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{preview.fee_label}</Text>
            <Text style={[styles.priceValue, preview.fee_amount < 0 && styles.discount]}>
              {preview.fee_amount < 0 ? '−' : '+'} Rs {Math.abs(preview.fee_amount).toFixed(2)}
            </Text>
          </View>
        )}
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total ({preview.currency})</Text>
          <Text style={styles.totalValue}>Rs {preview.total.toFixed(2)}</Text>
        </View>
      </View>

      <Pressable
        style={styles.button}
        onPress={handleConfirmAndPay}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="card-outline" size={20} color={colors.text.primary} style={styles.btnIcon} />
            <Text style={styles.buttonText}>Confirm and pay Rs {preview.total.toFixed(2)}</Text>
          </>
        )}
      </Pressable>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backLink}>← Change dates or details</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  loadingText: { color: colors.text.muted, marginTop: spacing.md },
  errorText: { color: colors.error },
  backBtn: { marginTop: spacing.md },
  backLink: { color: colors.accentAlt[500], fontSize: 16 },
  sectionTitle: { ...typography.subtitle, color: colors.accentAlt[500], marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, overflow: 'hidden' },
  thumb: { width: '100%', height: 160, borderRadius: radius.sm, marginBottom: spacing.md },
  title: { ...typography.subtitle, color: colors.text.primary, marginBottom: 4 },
  meta: { color: colors.text.muted, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  detail: { color: colors.text.secondary, fontSize: 15 },
  label: { color: colors.text.muted, fontSize: 12, marginBottom: 4 },
  messageBlock: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surface.input },
  messageText: { color: colors.text.secondary, fontSize: 14 },
  priceCard: { backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  priceLabel: { color: colors.text.secondary, fontSize: 15 },
  priceValue: { color: colors.text.primary, fontSize: 15 },
  discount: { color: colors.accentAlt[500] },
  totalRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.surface.input },
  totalLabel: { fontWeight: '600', color: colors.text.primary, fontSize: 16 },
  totalValue: { fontWeight: '700', color: colors.text.primary, fontSize: 18 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent[500], borderRadius: radius.md, padding: spacing.md },
  btnIcon: { marginRight: spacing.sm },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
});
