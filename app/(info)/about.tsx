import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '@/lib/api';
import { colors, spacing, typography } from '@/constants/theme';

type Section = { section_key: string; title: string | null; content: string | null };

export default function AboutScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCmsSections('page')
      .then((r) => setSections(r.sections ?? []))
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, []);

  const about = sections.find((s) => s.section_key === 'about_us');
  const team = sections.find((s) => s.section_key === 'our_team');

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {about && (
        <View style={styles.section}>
          <Text style={styles.title}>{about.title || 'About Us'}</Text>
          <Text style={styles.body}>{about.content || 'Content not yet added.'}</Text>
        </View>
      )}
      {team && (
        <View style={styles.section}>
          <Text style={styles.title}>{team.title || 'Our Team'}</Text>
          <Text style={styles.body}>{team.content || 'Content not yet added.'}</Text>
        </View>
      )}
      {!loading && sections.length === 0 && (
        <Text style={styles.muted}>About us content will appear here once added.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  section: { marginBottom: spacing.xl },
  title: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.text.secondary, lineHeight: 24 },
  muted: { color: colors.text.muted, textAlign: 'center', marginTop: spacing.lg },
});
