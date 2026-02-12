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
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import { useTranslation } from '@/lib/i18n';
import { InputWithIcon } from '@/components/InputWithIcon';
import { PasswordInput } from '@/components/PasswordInput';
import { validateSignup } from '@/lib/validation';
import { colors, spacing, radius, typography } from '@/constants/theme';

const INPUT_SPACING = spacing.lg;

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; password?: string }>({});

  async function handleSubmit() {
    const errs = validateSignup(name, email, phone, password);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Alert.alert(t('auth_invalid_input'), Object.values(errs)[0]);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      router.replace({ pathname: '/(auth)/verify', params: { email: email.trim() } });
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('common_sign_up_failed');
      Alert.alert(t('common_sign_up_failed'), message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Logo size="lg" style={styles.logo} />
            <Text style={styles.title}>{t('auth_create_account')}</Text>
            <Text style={styles.subtitle}>{t('auth_join')}</Text>

            <View style={styles.field}>
              <InputWithIcon
                icon="person-outline"
                placeholder={t('auth_name')}
                value={name}
                onChangeText={(val) => { setName(val); setErrors((e) => ({ ...e, name: undefined })); }}
                autoCapitalize="words"
                autoComplete="name"
                error={!!errors.name}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

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
              <InputWithIcon
                icon="call-outline"
                placeholder={t('auth_phone')}
                value={phone}
                onChangeText={(val) => { setPhone(val); setErrors((e) => ({ ...e, phone: undefined })); }}
                keyboardType="phone-pad"
                autoComplete="tel"
                error={!!errors.phone}
              />
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            <View style={styles.field}>
              <PasswordInput
                placeholder={t('auth_password_placeholder')}
                value={password}
                onChangeText={(val) => { setPassword(val); setErrors((e) => ({ ...e, password: undefined })); }}
                autoComplete="password-new"
                error={!!errors.password}
              />
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color={colors.text.primary} style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>{t('auth_sign_up')}</Text>
                </>
              )}
            </Pressable>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.link}>
                <Text style={styles.linkText}>{t('auth_have_account')}</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  content: { paddingBottom: spacing.lg },
  logo: { alignSelf: 'center', marginBottom: spacing.lg },
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
  link: { marginTop: INPUT_SPACING, alignItems: 'center' },
  linkText: { color: colors.accentAlt[500], fontSize: 15 },
});
