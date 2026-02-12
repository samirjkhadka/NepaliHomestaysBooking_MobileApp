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
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { PasswordInput } from '@/components/PasswordInput';
import { validateResetPassword } from '@/lib/validation';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { t } = useTranslation();
  const email = (params.email ?? '').trim();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const errors = validateResetPassword(otp, newPassword);
    const first = Object.values(errors).find(Boolean);
    if (first) {
      Alert.alert(t('auth_invalid_input'), first);
      return;
    }
    if (!email) {
      Alert.alert(t('auth_invalid_input'), t('auth_email_missing'));
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(email, otp.trim(), newPassword);
      Alert.alert(t('auth_password_reset_title'), t('auth_password_reset_success'), [
        { text: t('common_ok'), onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('auth_reset_failed');
      Alert.alert(t('auth_reset_failed'), message);
    } finally {
      setLoading(false);
    }
  }

  if (!email) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.error}>{t('auth_email_missing')}</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/(auth)/forgot-password')}>
            <Text style={styles.buttonText}>{t('auth_request_new_code')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo size="lg" style={styles.logo} />
          <Text style={styles.title}>{t('auth_set_new_password')}</Text>
          <Text style={styles.subtitle}>{t('auth_set_new_password_sub')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth_6digit_code')}
            placeholderTextColor={colors.text.muted}
            value={otp}
            onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
          <View style={styles.passwordWrap}>
            <PasswordInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('auth_new_password')}
              autoComplete="password-new"
            />
          </View>
          <Pressable style={styles.button} onPress={handleSubmit} disabled={loading || otp.length !== 6 || !newPassword}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="key-outline" size={20} color={colors.text.primary} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>{t('auth_reset_password_btn')}</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.link} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.linkText}>{t('auth_back_to_login')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  logo: { alignSelf: 'center', marginBottom: spacing.xl },
  title: { ...typography.title, color: colors.text.primary, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface.input,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  passwordWrap: { marginBottom: spacing.md },
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
