import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { validateOtp } from '@/lib/validation';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { verifyOtp } = useAuth();
  const { t } = useTranslation();
  const email = (params.email ?? '').trim();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  if (!email) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.error}>{t('auth_email_missing')}</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.buttonText}>{t('auth_back_to_login')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleSubmit() {
    const err = validateOtp(otp);
    if (err) {
      Alert.alert(t('auth_invalid_code'), err);
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otp.trim());
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('auth_verification_failed');
      Alert.alert(t('auth_verification_failed'), message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.content}>
          <Logo size="lg" style={styles.logo} />
          <Text style={styles.title}>{t('auth_check_email')}</Text>
          <Text style={styles.subtitle}>{t('auth_code_sent_to')} {email}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth_enter_code')}
            placeholderTextColor={colors.text.muted}
            value={otp}
            onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          <Pressable style={styles.button} onPress={handleSubmit} disabled={loading || otp.length !== 6}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.primary} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>{t('auth_verify')}</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.link} onPress={() => router.back()}>
            <Text style={styles.linkText}>{t('auth_use_different_email')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  kav: { flex: 1 },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  logo: { alignSelf: 'center', marginBottom: spacing.xl },
  title: { ...typography.title, color: colors.text.primary, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface.input,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent[500],
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  buttonIcon: { marginRight: spacing.sm },
  buttonText: { color: colors.text.primary, fontWeight: '600', fontSize: 16 },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.accentAlt[500], fontSize: 15 },
  error: { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.md },
});
