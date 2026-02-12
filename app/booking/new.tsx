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
  type PreviewRes = {
    nights: number;
    subtotal_room: number;
    extra_services_lines?: { name: string; amount: number }[];
    extra_services_total?: number;
    subtotal: number;
    fee_label: string | null;
    fee_amount: number;
    total: number;
  };
  const [preview, setPreview] = useState<PreviewRes | null>(null);
  const [datePickerMode, setDatePickerMode] = useState<'checkIn' | 'checkOut' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  type ExtraServiceRow = { id: number; name: string; price_npr: number; unit: string };
  const listingExtras = (listing as { extra_services?: ExtraServiceRow[] })?.extra_services ?? [];
  const [extraQuantities, setExtraQuantities] = useState<Record<number, number>>({});
  const selectedExtraServices = Object.entries(extraQuantities)
    .filter(([, q]) => q > 0)
    .map(([id, quantity]) => ({ extra_service_id: Number(id), quantity }));

  useEffect(() => {
    if (!listingId) return;
    const id = Number(listingId);
    if (Number.isNaN(id)) return;
    api.getListing(id).then(setListing).catch(() => setListing(null));
  }, [listingId]);

  useEffect(() => {
    if (!listing?.id || !checkIn || !checkOut || checkOut <= checkIn) {
      setPreview(null);
      return;
    }
    const id = Number(listingId);
    if (Number.isNaN(id)) return;
    const g = parseInt(guests, 10) || 1;
    const extras = Object.entries(extraQuantities)
      .filter(([, q]) => q > 0)
      .map(([id, quantity]) => ({ extra_service_id: Number(id), quantity }));
    api.getBookingPreview(id, checkIn, checkOut, g >= 1 ? g : undefined, extras.length ? extras : undefined)
      .then((p) => setPreview(p as PreviewRes))
      .catch(() => setPreview(null));
  }, [listing?.id, listingId, checkIn, checkOut, guests, extraQuantities]);

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

  function goToConfirm() {
    const g = parseInt(guests, 10);
    if (!listing || !checkIn || !checkOut || !g || g < 1) {
      Alert.alert(t('common_error') || 'Invalid input', 'Please select check-in, check-out and at least 1 guest.');
      return;
    }
    if (checkOut <= checkIn) {
      Alert.alert(t('common_error') || 'Invalid', 'Check-out must be after check-in.');
      return;
    }
    router.push({
      pathname: '/booking/confirm',
      params: {
        listingId: String(listing.id),
        checkIn,
        checkOut,
        guests: String(g),
        message: (message ?? '').trim().slice(0, 300),
        extra_services: selectedExtraServices.length ? JSON.stringify(selectedExtraServices) : '',
      },
    });
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

      {listingExtras.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Extra services (optional)</Text>
          {listingExtras.map((s) => (
            <View key={s.id} style={styles.extraRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.extraName}>{s.name}</Text>
                <Text style={styles.extraMeta}>NPR {Number(s.price_npr).toLocaleString()} · {s.unit === 'per_person' ? 'Per person' : s.unit === 'per_group' ? 'Per group' : 'Fixed'}</Text>
              </View>
              <TextInput
                style={styles.extraQtyInput}
                value={String(extraQuantities[s.id] ?? 0)}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/\D/g, ''), 10) || 0;
                  setExtraQuantities((prev) => ({ ...prev, [s.id]: Math.min(99, n) }));
                }}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.text.muted}
              />
            </View>
          ))}
        </>
      )}

      <Text style={styles.label}>{t('booking_message_to_host')}</Text>
      <View style={[styles.inputRow, styles.inputRowMultiline]}>
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

      {preview && (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Price summary</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Rs {listing?.price_per_night} × {preview.nights} night{preview.nights !== 1 ? 's' : ''}</Text>
            <Text style={styles.previewValue}>Rs {(preview.subtotal_room ?? preview.subtotal ?? 0).toFixed(2)}</Text>
          </View>
          {preview.extra_services_lines && preview.extra_services_lines.length > 0 && preview.extra_services_total !== undefined && preview.extra_services_total > 0 && (
            <>
              {preview.extra_services_lines.map((line, i) => (
                <View key={i} style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{line.name}</Text>
                  <Text style={styles.previewValue}>Rs {line.amount.toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Extra services</Text>
                <Text style={styles.previewValue}>Rs {preview.extra_services_total.toFixed(2)}</Text>
              </View>
            </>
          )}
          {preview.fee_label && preview.fee_amount !== 0 && (
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{preview.fee_label}</Text>
              <Text style={[styles.previewValue, preview.fee_amount < 0 && styles.previewDiscount]}>
                {preview.fee_amount < 0 ? '−' : '+'} Rs {Math.abs(preview.fee_amount).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.previewRow, styles.previewTotalRow]}>
            <Text style={styles.previewTotalLabel}>Total</Text>
            <Text style={styles.previewTotalValue}>Rs {preview.total.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <Pressable style={styles.button} onPress={goToConfirm}>
        <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.text.primary} style={styles.btnIcon} />
        <Text style={styles.buttonText}>Continue to confirmation</Text>
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
  sectionTitle: { ...typography.subtitle, color: colors.accentAlt[500], marginTop: spacing.md, marginBottom: spacing.sm },
  extraRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.input, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  extraName: { color: colors.text.primary, fontWeight: '600', marginBottom: 2 },
  extraMeta: { color: colors.text.muted, fontSize: 13 },
  extraQtyInput: { width: 48, backgroundColor: colors.surface.card, borderRadius: radius.sm, padding: spacing.sm, color: colors.text.primary, fontSize: 16, textAlign: 'center', marginLeft: spacing.md },
  label: { color: colors.text.secondary, fontSize: 14, marginBottom: 4 },
  input: { flex: 1, color: colors.text.primary, fontSize: 16, paddingVertical: spacing.sm, minHeight: 24 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.input, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  inputFlex: { flex: 1, marginBottom: 0 },
  dateText: { flex: 1, marginBottom: 0 },
  iconTop: { alignSelf: 'flex-start', marginTop: spacing.md },
  textArea: { flex: 1, minHeight: 80, marginBottom: 0, paddingTop: spacing.sm },
  inputRowMultiline: { alignItems: 'flex-start' },
  previewBox: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  previewTitle: { ...typography.subtitle, color: colors.accentAlt[500], marginBottom: spacing.sm },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  previewLabel: { color: colors.text.secondary, fontSize: 14 },
  previewValue: { color: colors.text.primary, fontSize: 14 },
  previewDiscount: { color: colors.accentAlt[500] },
  previewTotalRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surface.input },
  previewTotalLabel: { fontWeight: '600', color: colors.text.primary },
  previewTotalValue: { fontWeight: '700', color: colors.text.primary },
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
