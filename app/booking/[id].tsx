import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api, type Booking } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { bookingFeeDelta, parseAmenityChargesJson } from '@/lib/booking-price-breakdown';
import { formatRs } from '@/lib/format';

function bookingStatusNorm(s: string | undefined): string {
  return (s || '').toLowerCase().trim();
}

function formatPaymentMethod(raw: string | null | undefined): string {
  const s = (raw ?? '').trim().toLowerCase();
  if (s === 'npx') return 'NPX';
  if (s === 'himalpay') return 'N-Cash (HimalPay)';
  if (!s) return '—';
  return (raw ?? '').trim();
}

function canGuestMessage(status: string | undefined): boolean {
  const s = bookingStatusNorm(status);
  return ['pending_payment', 'approved', 'partial_paid', 'paid'].includes(s);
}

function guestCanCancel(status: string | undefined): boolean {
  const s = bookingStatusNorm(status);
  return s === 'pending' || s === 'pending_payment' || s === 'approved';
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const isHost = user?.role?.toLowerCase() === 'host';

  const loadBooking = useCallback(async () => {
    if (!id || !token) return;
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      setLoading(false);
      return;
    }
    try {
      if (isHost) {
        const res = await api.getHostDashboard(token);
        const b = (res.bookings ?? []).find((x) => x.id === numId) ?? null;
        setBooking(b);
      } else {
        const res = await api.getBookings(token);
        const b = (res.bookings ?? []).find((x) => x.id === numId) ?? null;
        setBooking(b);
      }
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [id, token, isHost]);

  useEffect(() => {
    setLoading(true);
    loadBooking();
  }, [loadBooking]);

  function handlePay() {
    if (!booking || !token) return;
    router.push({ pathname: '/booking/pay', params: { bookingId: String(booking.id) } });
  }

  async function handleApprove() {
    if (!booking || !token) return;
    setUpdating(true);
    try {
      await api.updateBookingStatus(token, booking.id, 'approved');
      await loadBooking();
    } finally {
      setUpdating(false);
    }
  }

  async function handleDecline() {
    if (!booking || !token) return;
    Alert.alert('Decline booking', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            await api.updateBookingStatus(token, booking.id, 'declined');
            await loadBooking();
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  }

  async function handleCancelGuest() {
    if (!booking || !token) return;
    Alert.alert('Cancel booking', 'Cancel this reservation? You can only cancel before payment is completed.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            await api.cancelBookingAsGuest(token, booking.id);
            await loadBooking();
          } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Could not cancel';
            Alert.alert('Error', msg);
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  }

  async function hostSetStatus(next: string) {
    if (!booking || !token) return;
    setUpdating(true);
    try {
      await api.updateBookingStatus(token, booking.id, next);
      await loadBooking();
    } catch {
      Alert.alert('Error', 'Could not update booking.');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} accessibilityLabel="Loading booking" />
      </View>
    );
  }
  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Booking not found.</Text>
      </View>
    );
  }

  const homestayName =
    (booking as { listing_title?: string }).listing_title ?? booking.listing?.title ?? 'Homestay';
  const subtotalNpr = (booking as { subtotal_npr?: number | null }).subtotal_npr ?? null;
  const amenityJson = (booking as { amenity_charges_json?: string | null }).amenity_charges_json ?? null;
  const amenityLines = parseAmenityChargesJson(amenityJson);
  const totalAmt = booking.total_amount ?? null;
  const { serviceChargeNpr, discountNpr, preFeeTotalNpr } = bookingFeeDelta(subtotalNpr, amenityLines, totalAmt);
  const paymentProvider = (booking as { payment_provider?: string | null }).payment_provider ?? null;
  const amountPaid = (booking as { amount_paid?: number | null }).amount_paid ?? null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{homestayName}</Text>
          <StatusBadge status={booking.status} />
        </View>
        <Text style={styles.bookingId}>Booking #{booking.id}</Text>
        <Text style={styles.meta}>Check-in: {booking.check_in}</Text>
        <Text style={styles.meta}>Check-out: {booking.check_out}</Text>
        <Text style={styles.meta}>Guests: {booking.guests}</Text>
        {paymentProvider ? <Text style={styles.meta}>Payment method: {formatPaymentMethod(paymentProvider)}</Text> : null}
        {amountPaid != null ? <Text style={styles.meta}>Amount paid: {formatRs(amountPaid)}</Text> : null}
        {booking.message ? <Text style={styles.message}>Note: {booking.message}</Text> : null}
      </View>

      {!isHost && (subtotalNpr != null || amenityLines.length > 0 || totalAmt != null) && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Price breakdown</Text>
          {subtotalNpr != null && <Text style={styles.meta}>Room subtotal: {formatRs(subtotalNpr)}</Text>}
          {amenityLines.map((line, i) => (
            <Text key={i} style={styles.meta}>
              {line.name} × {line.quantity}: {formatRs(line.total)}
            </Text>
          ))}
          {serviceChargeNpr != null && serviceChargeNpr > 0 && (
            <Text style={styles.meta}>Service charge: {formatRs(serviceChargeNpr)}</Text>
          )}
          {discountNpr != null && discountNpr > 0 && (
            <Text style={styles.meta}>Discount: −{formatRs(discountNpr)}</Text>
          )}
          <Text style={styles.metaStrong}>Pre-fee total: {formatRs(preFeeTotalNpr)}</Text>
          {totalAmt != null && <Text style={styles.totalLine}>Total: {formatRs(totalAmt)}</Text>}
        </View>
      )}

      {!isHost && canGuestMessage(booking.status) ? (
        <Pressable style={styles.linkBtn} onPress={() => router.push(`/messages/${booking.id}`)} accessibilityRole="button">
          <Text style={styles.linkBtnText}>Message host</Text>
        </Pressable>
      ) : null}

      {isHost ? (
        <>
          {booking.status === 'pending' && (
            <View style={styles.row}>
              <Pressable style={[styles.button, styles.approveBtn]} onPress={handleApprove} disabled={updating} accessibilityRole="button">
                <Text style={styles.buttonText}>{updating ? '…' : 'Approve'}</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.declineBtn]} onPress={handleDecline} disabled={updating} accessibilityRole="button">
                <Text style={styles.buttonText}>Decline</Text>
              </Pressable>
            </View>
          )}
          {['approved', 'partial_paid', 'paid'].includes(bookingStatusNorm(booking.status)) &&
            bookingStatusNorm(booking.status) !== 'completed' && (
              <View style={styles.rowWrap}>
                <Pressable style={styles.secondaryBtn} onPress={() => hostSetStatus('paid')} disabled={updating}>
                  <Text style={styles.secondaryBtnText}>Mark paid</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={() => hostSetStatus('completed')} disabled={updating}>
                  <Text style={styles.secondaryBtnText}>Mark completed</Text>
                </Pressable>
              </View>
            )}
        </>
      ) : (
        <>
          {['pending', 'pending_payment', 'approved', 'partial_paid'].includes(bookingStatusNorm(booking.status)) && (
            <Pressable style={styles.button} onPress={handlePay} accessibilityRole="button">
              <Text style={styles.buttonText}>Pay / Resume payment</Text>
            </Pressable>
          )}
          {!isHost && guestCanCancel(booking.status) && (
            <Pressable style={styles.cancelOutline} onPress={handleCancelGuest} disabled={updating}>
              <Text style={styles.cancelOutlineText}>Cancel booking</Text>
            </Pressable>
          )}
          <Pressable style={styles.linkBtn} onPress={() => router.push(`/listing/${booking.listing_id}`)}>
            <Text style={styles.linkBtnText}>View listing</Text>
          </Pressable>
          {(booking.status === 'paid' || booking.status === 'partial_paid') && (
            <>
              <Pressable style={styles.linkBtn} onPress={() => router.push({ pathname: '/booking/receipt', params: { id: String(booking.id) } })}>
                <Text style={styles.linkBtnText}>View receipt</Text>
              </Pressable>
              <Pressable style={styles.linkBtn} onPress={() => router.push({ pathname: '/booking/review', params: { bookingId: String(booking.id) } })}>
                <Text style={styles.linkBtnText}>Leave a review</Text>
              </Pressable>
            </>
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
  empty: { color: colors.text.muted },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  sectionHeading: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.sm },
  title: { flex: 1, ...typography.subtitle, color: colors.text.primary },
  bookingId: { color: colors.text.muted, fontSize: 14, marginBottom: spacing.sm },
  meta: { color: colors.text.secondary, marginBottom: 4, fontSize: 15 },
  metaStrong: { color: colors.text.primary, fontWeight: '600', marginTop: spacing.sm },
  totalLine: { color: colors.text.primary, fontWeight: '700', fontSize: 18, marginTop: spacing.sm },
  message: { color: colors.text.secondary, marginTop: spacing.sm, fontStyle: 'italic' },
  button: { backgroundColor: colors.accent[500], borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  buttonText: { color: colors.text.onAccent, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  approveBtn: { flex: 1, backgroundColor: colors.success },
  declineBtn: { flex: 1, backgroundColor: colors.error },
  secondaryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface.input,
  },
  secondaryBtnText: { color: colors.text.primary, fontWeight: '600' },
  cancelOutline: {
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelOutlineText: { color: colors.error, fontWeight: '600' },
  linkBtn: { alignItems: 'center', marginBottom: spacing.sm, minHeight: 44, justifyContent: 'center' },
  linkBtnText: { color: colors.accentAlt[500], fontWeight: '600' },
});
