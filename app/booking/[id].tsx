import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api, type Booking } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const isHost = user?.role?.toLowerCase() === 'host';

  async function loadBooking() {
    if (!id || !token) return;
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      setLoading(false);
      return;
    }
    api.getBookings(token).then((res) => {
      const b = (res.bookings ?? []).find((x) => x.id === numId);
      setBooking(b ?? null);
    }).catch(() => setBooking(null)).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBooking();
  }, [id, token]);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
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

  const homestayName = (booking as { listing_title?: string }).listing_title ?? booking.listing?.title ?? 'Homestay';
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>Homestay</Text>
        <Text style={styles.title}>{homestayName}</Text>
        <Text style={styles.bookingId}>Booking #{booking.id}</Text>
        <Text style={styles.meta}>Check-in: {booking.check_in}</Text>
        <Text style={styles.meta}>Check-out: {booking.check_out}</Text>
        <Text style={styles.meta}>Guests: {booking.guests}</Text>
        <Text style={styles.meta}>Status: {booking.status}</Text>
      </View>
      <Pressable style={styles.linkBtn} onPress={() => router.push(`/messages/${booking.id}`)}>
        <Text style={styles.linkBtnText}>Message</Text>
      </Pressable>
      {isHost ? (
        booking.status === 'pending' && (
          <View style={styles.row}>
            <Pressable style={[styles.button, styles.approveBtn]} onPress={handleApprove} disabled={updating}>
              <Text style={styles.buttonText}>{updating ? '…' : 'Approve'}</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.declineBtn]} onPress={handleDecline} disabled={updating}>
              <Text style={styles.buttonText}>Decline</Text>
            </Pressable>
          </View>
        )
      ) : (
        <>
          {(booking.status === 'pending' || booking.status === 'approved') && (
            <Pressable style={styles.button} onPress={handlePay}>
              <Text style={styles.buttonText}>Pay / Resume payment</Text>
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
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  empty: { color: colors.text.muted },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  label: { color: colors.text.muted, fontSize: 12, marginBottom: 2 },
  title: { ...typography.subtitle, color: colors.text.primary, marginBottom: 4 },
  bookingId: { color: colors.text.muted, fontSize: 14, marginBottom: spacing.sm },
  meta: { color: colors.text.secondary, marginBottom: 4 },
  button: { flex: 1, backgroundColor: colors.accent[500], borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  approveBtn: { backgroundColor: colors.success },
  declineBtn: { backgroundColor: colors.error },
  linkBtn: { alignItems: 'center', marginBottom: spacing.sm },
  linkBtnText: { color: colors.accentAlt[500] },
});
