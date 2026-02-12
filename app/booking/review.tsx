import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function LeaveReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const bid = bookingId ? Number(bookingId) : NaN;

  async function submit() {
    if (!token || Number.isNaN(bid)) return;
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid', 'Please choose a rating from 1 to 5.');
      return;
    }
    setLoading(true);
    try {
      await api.createReview(token, { booking_id: bid, rating, comment: comment.trim() || undefined });
      Alert.alert('Thanks!', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to submit review';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Rating (1–5 stars)</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Pressable key={s} onPress={() => setRating(s)} style={styles.starBtn}>
            <Text style={styles.star}>{rating >= s ? '★' : '☆'}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Comment (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Share your experience..."
        placeholderTextColor={colors.text.muted}
        value={comment}
        onChangeText={setComment}
        multiline
      />
      <Pressable style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit review</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg },
  label: { color: colors.text.secondary, marginBottom: spacing.sm },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  starBtn: { padding: spacing.sm },
  star: { fontSize: 32, color: colors.accentAlt[500] },
  input: { backgroundColor: colors.surface.input, borderRadius: radius.md, padding: spacing.md, color: colors.text.primary, fontSize: 16 },
  textArea: { minHeight: 100 },
  button: { backgroundColor: colors.accent[500], borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
});
