import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { api, type Booking } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { useTranslation } from '@/lib/i18n';

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) {
      setLoading(false);
      return;
    }
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      setLoading(false);
      return;
    }
    api.getBookings(token).then((res) => {
      const b = (res.bookings ?? []).find((x) => x.id === numId);
      setBooking(b ?? null);
    }).catch(() => setBooking(null)).finally(() => setLoading(false));
  }, [id, token]);

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
        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/dashboard')}>
          <Text style={styles.buttonText}>Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  const homestayName = (booking as { listing_title?: string }).listing_title ?? booking.listing?.title ?? 'Homestay';
  const total = booking.total_amount ?? 0;
  const status = booking.status ?? '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.receipt}>
        <View style={styles.receiptHeader}>
          <Ionicons name="receipt-outline" size={40} color={colors.accent[500]} />
          <Text style={styles.receiptTitle}>Payment Receipt</Text>
          <Text style={styles.receiptSubtitle}>Nepali Homestays</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Booking ID</Text>
          <Text style={styles.value}>#{booking.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, styles.statusPaid]}>{status}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Booking details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Homestay</Text>
          <Text style={[styles.value, styles.valueWrap]} numberOfLines={2}>{homestayName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('booking_check_in')}</Text>
          <Text style={styles.value}>{booking.check_in}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('booking_check_out')}</Text>
          <Text style={styles.value}>{booking.check_out}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('booking_guests')}</Text>
          <Text style={styles.value}>{booking.guests}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.labelTotal}>Total amount</Text>
          <Text style={styles.amount}>{t('listing_rs')} {total.toLocaleString()}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your booking.</Text>
          <Text style={styles.footerText}>For support, contact us via the app.</Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={() => router.replace(`/booking/${booking.id}`)}>
        <Ionicons name="document-text-outline" size={20} color={colors.text.primary} style={styles.btnIcon} />
        <Text style={styles.buttonText}>View booking</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)/dashboard')}>
        <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  empty: { color: colors.text.muted, marginBottom: spacing.md },
  receipt: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptHeader: { alignItems: 'center', marginBottom: spacing.md },
  receiptTitle: { ...typography.title, color: colors.text.primary, marginTop: spacing.sm },
  receiptSubtitle: { color: colors.text.muted, fontSize: 14, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  sectionTitle: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  label: { color: colors.text.muted, fontSize: 14 },
  value: { color: colors.text.primary, fontSize: 14, fontWeight: '500' },
  valueWrap: { flex: 1, textAlign: 'right' },
  labelTotal: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
  amount: { color: colors.accent[500], fontSize: 18, fontWeight: '700' },
  statusPaid: { color: colors.success },
  footer: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  footerText: { color: colors.text.muted, fontSize: 12, textAlign: 'center', marginBottom: 4 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent[500],
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  btnIcon: { marginRight: spacing.sm },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
  secondaryBtn: { alignItems: 'center', padding: spacing.md },
  secondaryBtnText: { color: colors.accentAlt[500] },
});
