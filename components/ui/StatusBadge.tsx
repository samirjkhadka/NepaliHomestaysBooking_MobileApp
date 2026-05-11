import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '@/constants/theme';

function norm(s: string | undefined): string {
  return (s || '').toLowerCase().trim();
}

export function statusBadgeStyle(status: string): { bg: string; fg: string } {
  const s = norm(status);
  if (s === 'pending_payment' || s === 'partial_paid') return { bg: '#FEF3C7', fg: '#92400E' };
  if (s === 'paid' || s === 'completed') return { bg: '#DCFCE7', fg: '#166534' };
  if (s === 'approved') return { bg: '#FFEDD5', fg: '#9A3412' };
  if (s === 'declined' || s === 'cancelled') return { bg: '#FEE2E2', fg: '#991B1B' };
  return { bg: colors.surface.elevated, fg: colors.text.secondary };
}

export function StatusBadge({ status }: { status: string }) {
  const { bg, fg } = statusBadgeStyle(status);
  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  text: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});
