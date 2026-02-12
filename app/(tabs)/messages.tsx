import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { api, type Conversation } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function MessagesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const res = await api.getMessages(token);
      setConversations(res.conversations ?? []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>{t('messages_empty')}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => String(item.booking_id)}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accentAlt[500]} />
      }
      ListEmptyComponent={<Text style={styles.empty}>No conversations yet.</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/messages/${item.booking_id}`)}
        >
          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={1}>{item.listing_title}</Text>
            <Text style={styles.meta}>With {item.other_name}</Text>
            {item.last_message ? (
              <Text style={styles.preview} numberOfLines={1}>{item.last_message}</Text>
            ) : null}
          </View>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.primary[500] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  empty: { color: colors.text.muted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: { flex: 1, minWidth: 0, marginRight: spacing.sm },
  title: { color: colors.text.primary, fontWeight: '600', marginBottom: 4, fontSize: 16 },
  meta: { color: colors.text.muted, fontSize: 14, marginBottom: 2 },
  preview: { color: colors.text.secondary, fontSize: 14 },
  badge: { backgroundColor: colors.accent[500], borderRadius: radius.full, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
