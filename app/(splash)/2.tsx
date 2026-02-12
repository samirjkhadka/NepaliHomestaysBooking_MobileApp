import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/lib/i18n';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function Splash2() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const id = setTimeout(() => router.replace('/(splash)/3'), 3500);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.skip} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.skipText}>{t('splash_skip')}</Text>
      </Pressable>
      <Image source={require('@/assets/images/hero-2.jpg')} style={styles.hero} resizeMode="cover" />
      <View style={styles.overlay}>
        <Text style={styles.subtitle}>{t('splash_experiences')}</Text>
        <Text style={styles.tagline}>{t('splash_experiences_desc')}</Text>
      </View>
      <Pressable style={styles.next} onPress={() => router.replace('/(splash)/3')}>
        <Text style={styles.nextText}>{t('splash_next')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  skip: { position: 'absolute', top: spacing.lg, right: spacing.lg, zIndex: 10, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  skipText: { color: colors.accentAlt[500], fontWeight: '600', fontSize: 15 },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 120 },
  overlay: { position: 'absolute', bottom: 140, left: 0, right: 0, paddingHorizontal: spacing.lg },
  subtitle: { ...typography.subtitle, color: colors.accentAlt[500], textAlign: 'center', marginBottom: spacing.md },
  tagline: { ...typography.bodySm, color: colors.text.secondary, textAlign: 'center' },
  next: { position: 'absolute', bottom: spacing.xl, alignSelf: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xl, backgroundColor: colors.accent[500], borderRadius: radius.full },
  nextText: { color: colors.text.primary, fontWeight: '600', fontSize: 16 },
});
