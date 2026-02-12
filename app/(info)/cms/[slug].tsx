import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useLocalSearchParams } from 'react-native';
import { useNavigation } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, typography } from '@/constants/theme';

const SLUG_TO_KEY: Record<string, string> = {
  privacy: 'privacy_policy',
  terms: 'terms_of_service',
  cookies: 'cookie_policy',
  faqs: 'faqs',
  help: 'help_center',
  safety: 'safety_information',
  cancellation: 'cancellation_policy',
  'our-team': 'our_team',
};

export default function CmsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const key = slug ? (SLUG_TO_KEY[slug] || slug.replace(/-/g, '_')) : '';
  const [section, setSection] = useState<{ title: string | null; content: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    api
      .getCmsSection(key)
      .then((s) => {
        setSection(s);
        navigation.setOptions({ title: s?.title || slug || 'Page' });
      })
      .catch(() => setSection(null))
      .finally(() => setLoading(false));
  }, [key, navigation, slug]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  if (!section) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Page not found.</Text>
      </View>
    );
  }

  const title = section.title || slug || 'Page';
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{section.content || 'Content not yet added.'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  title: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.text.secondary, lineHeight: 24 },
  muted: { color: colors.text.muted },
});
