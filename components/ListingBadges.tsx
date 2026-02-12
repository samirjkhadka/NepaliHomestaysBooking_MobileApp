/**
 * Renders listing badges (recommended, featured, new) as separate pills with distinct colours,
 * matching the frontend ListingBadges component.
 * badge can be a comma-separated string from the API (e.g. "recommended,featured").
 */
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

const BADGE_KEYS = ['recommended', 'featured', 'new'] as const;
type BadgeKey = (typeof BADGE_KEYS)[number];

const DEFAULT_LABELS: Record<string, string> = {
  recommended: 'Recommended',
  featured: 'Featured',
  new: 'New',
};

/** Colours per badge type – same as frontend (emerald, blue, amber) */
const BADGE_STYLES: Record<BadgeKey, { bg: string; text: string; border: string }> = {
  recommended: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' }, // emerald
  featured: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },     // blue
  new: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },           // amber
};

function parseBadges(badge: string | null | undefined): BadgeKey[] {
  if (!badge || typeof badge !== 'string') return [];
  return badge
    .split(',')
    .map((b) => b.trim().toLowerCase())
    .filter((b): b is BadgeKey => BADGE_KEYS.includes(b as BadgeKey));
}

type Props = {
  badge: string | null | undefined;
  /** Optional display labels. Keys: recommended, featured, new */
  badgeLabels?: Record<string, string>;
  /** Compact = smaller text and padding for cards. Default false = normal for detail page */
  compact?: boolean;
  style?: ViewStyle;
};

export function ListingBadges({ badge, badgeLabels, compact = false, style }: Props) {
  const badges = parseBadges(badge);
  const labels = badgeLabels ?? DEFAULT_LABELS;
  if (badges.length === 0) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      {badges.map((key) => {
        const s = BADGE_STYLES[key];
        if (!s) return null;
        return (
          <View
            key={key}
            style={[
              styles.pill,
              compact ? styles.pillCompact : styles.pillNormal,
              { backgroundColor: s.bg, borderColor: s.border },
            ]}
          >
            <Text style={[compact ? styles.textCompact : styles.textNormal, { color: s.text }]}>
              {labels[key] ?? key}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  wrapCompact: { gap: 4 },
  pill: { borderWidth: 1, borderRadius: 9999 },
  pillNormal: { paddingHorizontal: 10, paddingVertical: 6 },
  pillCompact: { paddingHorizontal: 8, paddingVertical: 3 },
  textNormal: { fontSize: 14, fontWeight: '600' },
  textCompact: { fontSize: 11, fontWeight: '600' },
});
