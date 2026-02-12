import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { InputWithIcon } from '@/components/InputWithIcon';
import { PasswordInput } from '@/components/PasswordInput';
import { validateLogin } from '@/lib/validation';
import { colors, spacing, radius, typography } from '@/constants/theme';

const INPUT_SPACING = spacing.lg;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit() {
    const errs = validateLogin(email, password);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Alert.alert(t('auth_invalid_input'), Object.values(errs)[0]);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result?.requireOtp) {
        router.replace({ pathname: '/(auth)/verify', params: { email: result.email ?? email.trim() } });
        return;
      }
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('auth_login_failed');
      Alert.alert(t('auth_login_failed'), message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.content}>
          <Logo size="lg" style={styles.logo} />
          <Text style={styles.title}>{t('auth_welcome_back')}</Text>
          <Text style={styles.subtitle}>{t('auth_sign_in_to')}</Text>

          <View style={styles.field}>
            <InputWithIcon
              icon="mail-outline"
              placeholder={t('auth_email')}
              value={email}
              onChangeText={(val) => { setEmail(val); setErrors((e) => ({ ...e, email: undefined })); }}
              keyboardType="email-address"
              autoComplete="email"
              error={!!errors.email}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.field}>
            <PasswordInput
              placeholder={t('auth_password')}
              value={password}
              onChangeText={(val) => { setPassword(val); setErrors((e) => ({ ...e, password: undefined })); }}
              autoComplete="password"
              error={!!errors.password}
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color={colors.text.primary} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>{t('auth_sign_in')}</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.linkText}>{t('auth_forgot_password')}</Text>
          </Pressable>
          <Link href="/(auth)/signup" asChild>
            <Pressable style={styles.link}>
              <Text style={styles.linkText}>{t('auth_no_account')}</Text>
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
  title: { ...typography.title, color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: INPUT_SPACING },
  field: { marginBottom: INPUT_SPACING },
  errorText: { color: colors.error, fontSize: 12, marginTop: spacing.xs },
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
  forgotLink: { alignSelf: 'flex-end', marginTop: spacing.md },
  link: { marginTop: INPUT_SPACING, alignItems: 'center' },
  linkText: { color: colors.accentAlt[500], fontSize: 15 },
});
