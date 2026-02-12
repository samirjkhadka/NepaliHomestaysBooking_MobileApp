import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { api, type Listing } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { useTranslation } from '@/lib/i18n';

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NewBookingScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [listing, setListing] = useState<Listing | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'checkIn' | 'checkOut' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (!listingId) return;
    const id = Number(listingId);
    if (Number.isNaN(id)) return;
    api.getListing(id).then(setListing).catch(() => setListing(null));
  }, [listingId]);

  function openDatePicker(mode: 'checkIn' | 'checkOut') {
    const current = mode === 'checkIn' && checkIn ? new Date(checkIn + 'T12:00:00') : mode === 'checkOut' && checkOut ? new Date(checkOut + 'T12:00:00') : new Date();
    setTempDate(current);
    setDatePickerMode(mode);
  }

  function onDateChange(_: unknown, date?: Date) {
    if (Platform.OS === 'android') setDatePickerMode(null);
    if (!date) return;
    setTempDate(date);
    const str = toYMD(date);
    if (datePickerMode === 'checkIn') {
      setCheckIn(str);
      if (checkOut && str >= checkOut) setCheckOut('');
    } else if (datePickerMode === 'checkOut') {
      setCheckOut(str);
    }
  }

  function confirmDate() {
    const str = toYMD(tempDate);
    if (datePickerMode === 'checkIn') {
      setCheckIn(str);
      if (checkOut && str >= checkOut) setCheckOut('');
    } else if (datePickerMode === 'checkOut') setCheckOut(str);
    setDatePickerMode(null);
  }

  async function handleBook() {
    if (!listing || !token) return;
    const g = parseInt(guests, 10);
    if (!checkIn || !checkOut || !g || g < 1) {
      Alert.alert(t('common_error') || 'Invalid input', 'Please select check-in, check-out and at least 1 guest.');
      return;
    }
    if (checkOut <= checkIn) {
      Alert.alert(t('common_error') || 'Invalid', 'Check-out must be after check-in.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.initiatePayment(token, {
        listing_id: listing.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: g,
        message: message.trim() || undefined,
      });
      const bookingId = (res as { booking_id?: number }).booking_id ?? res.booking?.id;
      if (res.redirect_url) {
        router.push({
          pathname: '/booking/pay',
          params: { url: res.redirect_url, bookingId: bookingId ? String(bookingId) : '' },
        });
      } else if (res.redirect_form && typeof res.redirect_form === 'object' && res.redirect_form.action) {
        router.push({
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
      setLoading(false);
    }
  }

  if (!listing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.meta}>{t('listing_rs')} {listing.price_per_night}/night</Text>

      <Text style={styles.label}>{t('booking_check_in')}</Text>
      <Pressable style={styles.inputRow} onPress={() => openDatePicker('checkIn')}>
        <Ionicons name="calendar-outline" size={20} color={colors.text.muted} />
        <Text style={[styles.input, styles.dateText]}>{checkIn || t('booking_check_in')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
      </Pressable>

      <Text style={styles.label}>{t('booking_check_out')}</Text>
      <Pressable style={styles.inputRow} onPress={() => openDatePicker('checkOut')}>
        <Ionicons name="calendar-outline" size={20} color={colors.text.muted} />
        <Text style={[styles.input, styles.dateText]}>{checkOut || t('booking_check_out')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
      </Pressable>

      <Text style={styles.label}>{t('booking_guests')}</Text>
      <View style={styles.inputRow}>
        <Ionicons name="people-outline" size={20} color={colors.text.muted} />
        <TextInput
          style={[styles.input, styles.inputFlex]}
          value={guests}
          onChangeText={setGuests}
          keyboardType="number-pad"
          placeholderTextColor={colors.text.muted}
        />
      </View>

      <Text style={styles.label}>{t('booking_message_to_host')}</Text>
      <View style={styles.inputRow}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.text.muted} style={styles.iconTop} />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder={t('booking_message_to_host')}
          placeholderTextColor={colors.text.muted}
          multiline
        />
      </View>

      <Pressable style={styles.button} onPress={handleBook} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            <Ionicons name="card-outline" size={20} color={colors.text.primary} style={styles.btnIcon} />
            <Text style={styles.buttonText}>{t('booking_pay')}</Text>
          </>
        )}
      </Pressable>

      {datePickerMode && (
        Platform.OS === 'android' ? (
          <DateTimePicker
            value={tempDate}
            mode="date"
            minimumDate={datePickerMode === 'checkOut' && checkIn ? new Date(checkIn + 'T12:00:00') : new Date()}
            display="default"
            onChange={onDateChange}
          />
        ) : (
          <Modal visible transparent animationType="slide">
            <Pressable style={styles.modalOverlay} onPress={() => setDatePickerMode(null)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  minimumDate={datePickerMode === 'checkOut' && checkIn ? new Date(checkIn + 'T12:00:00') : new Date()}
                  display="default"
                  onChange={(_, d) => d && setTempDate(d)}
                />
                <View style={styles.modalButtons}>
                  <Pressable style={styles.modalBtn} onPress={() => setDatePickerMode(null)}>
                    <Text style={styles.modalBtnTextCancel}>{t('common_cancel')}</Text>
                  </Pressable>
                  <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={confirmDate}>
                    <Text style={styles.modalBtnText}>OK</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  title: { ...typography.subtitle, color: colors.text.primary, marginBottom: 4 },
  meta: { color: colors.text.muted, marginBottom: spacing.lg },
  label: { color: colors.text.secondary, fontSize: 14, marginBottom: 4 },
  input: { backgroundColor: colors.surface.input, borderRadius: radius.md, padding: spacing.md, color: colors.text.primary, fontSize: 16, marginBottom: spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.input, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  inputFlex: { flex: 1, marginBottom: 0 },
  dateText: { flex: 1, marginBottom: 0 },
  iconTop: { alignSelf: 'flex-start', marginTop: spacing.md },
  textArea: { flex: 1, minHeight: 80, marginBottom: 0 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent[500], borderRadius: radius.md, padding: spacing.md },
  btnIcon: { marginRight: spacing.sm },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: colors.surface.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, minHeight: 320 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  modalBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  modalBtnPrimary: { backgroundColor: colors.accent[500], borderRadius: radius.md },
  modalBtnText: { color: colors.text.primary, fontWeight: '600' },
  modalBtnTextCancel: { color: colors.text.muted },
});
