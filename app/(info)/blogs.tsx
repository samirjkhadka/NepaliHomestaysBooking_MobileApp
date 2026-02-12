import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { api } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type FeedItem = { id: string; title: string; excerpt?: string; url: string; date?: string; category?: string };

export default function BlogsScreen() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getNewsFeed()
      .then((r) => setItems(Array.isArray(r.items) ? r.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {items.length === 0 ? (
        <Text style={styles.empty}>No blog posts yet. Check back later.</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() => item.url && Linking.openURL(item.url)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.excerpt ? <Text style={styles.cardExcerpt} numberOfLines={2}>{item.excerpt}</Text> : null}
            <View style={styles.readRow}>
              <Text style={styles.readText}>Read more</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.accentAlt[500]} />
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  empty: { color: colors.text.muted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.sm },
  cardExcerpt: { ...typography.bodySm, color: colors.text.muted, marginBottom: spacing.sm },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  readText: { color: colors.accentAlt[500], fontSize: 14, fontWeight: '600' },
});
