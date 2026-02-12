import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { InputWithIcon } from '@/components/InputWithIcon';
import { validateEmail } from '@/lib/validation';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const err = validateEmail(email);
    if (err) {
      Alert.alert('Invalid email', err);
      return;
    }
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Request failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Logo size="lg" style={styles.logo} />
          <Text style={styles.title}>{t('auth_check_email')}</Text>
          <Text style={styles.subtitle}>{t('auth_reset_sent_to')} {email.trim()}. {t('auth_enter_code_next')}</Text>
          <Pressable style={styles.button} onPress={() => router.replace({ pathname: '/(auth)/reset-password', params: { email: email.trim() } })}>
            <Text style={styles.buttonText}>{t('auth_continue_to_reset')}</Text>
          </Pressable>
          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.link}>
              <Text style={styles.linkText}>{t('auth_back_to_login')}</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.content}>
          <Logo size="lg" style={styles.logo} />
          <Text style={styles.title}>{t('auth_forgot_title')}</Text>
          <Text style={styles.subtitle}>{t('auth_forgot_subtitle')}</Text>
          <View style={styles.field}>
            <InputWithIcon
              icon="mail-outline"
              placeholder={t('auth_email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
          <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="key-outline" size={20} color={colors.text.primary} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>{t('auth_send_reset_code')}</Text>
              </>
            )}
          </Pressable>
          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.link}>
              <Text style={styles.linkText}>{t('auth_back_to_login')}</Text>
            </Pressable>
          </Link>
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
  field: { marginBottom: spacing.lg },
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
});
