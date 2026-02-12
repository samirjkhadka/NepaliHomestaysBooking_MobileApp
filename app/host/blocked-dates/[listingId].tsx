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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function BlockedDatesScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { token } = useAuth();
  const [dates, setDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const lid = listingId ? Number(listingId) : NaN;

  async function load() {
    if (Number.isNaN(lid)) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getBlockedDates(lid);
      setDates(res.blocked_dates ?? []);
    } catch {
      setDates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [lid]);

  async function addDate() {
    if (!token || Number.isNaN(lid)) return;
    const d = newDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format.');
      return;
    }
    setSaving(true);
    try {
      await api.blockDates(token, lid, [d]);
      setNewDate('');
      await load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to block date';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Blocked dates</Text>
      <Text style={styles.meta}>Listing #{lid}. Add dates when the homestay is unavailable.</Text>
      <Text style={styles.label}>Add date</Text>
      <View style={styles.row}>
        <Pressable style={styles.dateInputRow} onPress={() => { setTempDate(newDate ? new Date(newDate + 'T12:00:00') : new Date()); setShowPicker(true); }}>
          <Ionicons name="calendar-outline" size={20} color={colors.text.muted} />
          <Text style={[styles.input, styles.dateInputText]}>{newDate || 'Pick date'}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </Pressable>
        <Pressable style={styles.button} onPress={addDate} disabled={saving || !newDate.trim()}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="ban-outline" size={18} color={colors.text.primary} style={styles.btnIcon} /><Text style={styles.buttonText}>Block</Text></>}
        </Pressable>
      </View>
      {showPicker && (
        Platform.OS === 'android' ? (
          <DateTimePicker
            value={tempDate}
            mode="date"
            minimumDate={new Date()}
            display="default"
            onChange={(_, d) => { if (d) { setNewDate(toYMD(d)); setShowPicker(false); } }}
          />
        ) : (
          <Modal visible transparent animationType="slide">
            <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <DateTimePicker value={tempDate} mode="date" minimumDate={new Date()} display="default" onChange={(_, d) => d && setTempDate(d)} />
                <View style={styles.modalButtons}>
                  <Pressable style={styles.modalBtn} onPress={() => setShowPicker(false)}><Text style={styles.modalBtnTextCancel}>Cancel</Text></Pressable>
                  <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => { setNewDate(toYMD(tempDate)); setShowPicker(false); }}><Text style={styles.modalBtnText}>OK</Text></Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        )
      )}
      <Text style={styles.sectionTitle}>Blocked ({dates.length})</Text>
      {dates.length === 0 ? (
        <Text style={styles.empty}>No blocked dates.</Text>
      ) : (
        dates.map((d) => (
          <View key={d} style={styles.card}>
            <Text style={styles.dateText}>{d}</Text>
          </View>
        ))
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
  label: { color: colors.text.secondary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  input: { flex: 1, backgroundColor: colors.surface.input, borderRadius: radius.md, padding: spacing.md, color: colors.text.primary },
  dateInputRow: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.input, borderRadius: radius.md, paddingHorizontal: spacing.md },
  dateInputText: { flex: 1, marginBottom: 0 },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent[500], borderRadius: radius.md, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  btnIcon: { marginRight: spacing.xs },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: colors.surface.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, minHeight: 320 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  modalBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  modalBtnPrimary: { backgroundColor: colors.accent[500], borderRadius: radius.md },
  modalBtnText: { color: colors.text.primary, fontWeight: '600' },
  modalBtnTextCancel: { color: colors.text.muted },
  sectionTitle: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.md },
  empty: { color: colors.text.muted },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  dateText: { color: colors.text.primary },
});
