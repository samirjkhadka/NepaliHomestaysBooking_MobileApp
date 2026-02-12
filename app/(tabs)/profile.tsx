import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { PasswordInput } from '@/components/PasswordInput';
import { validateChangePassword } from '@/lib/validation';
import { colors, spacing, radius, typography } from '@/constants/theme';

const BIOMETRIC_STORAGE_KEY = '@nepali_homestays_biometric_enabled';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getProfile(token).then(setProfile).catch(() => setProfile(null)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
        setBiometricEnabled(stored === 'true');
      } catch {
        setBiometricEnabled(false);
      }
      try {
        const mod = await import('expo-local-authentication').catch(() => null);
        if (mod) {
          const [hasHardware, isEnrolled] = await Promise.all([mod.hasHardwareAsync(), mod.isEnrolledAsync()]);
          setBiometricSupported(hasHardware && isEnrolled);
        }
      } catch {
        setBiometricSupported(false);
      } finally {
        setBiometricLoading(false);
      }
    })();
  }, []);

  async function handleBiometricToggle(value: boolean) {
    if (!biometricSupported) return;
    setBiometricEnabled(value);
    await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, value ? 'true' : 'false');
  }

  async function handleChangePassword() {
    const errors = validateChangePassword(currentPassword, newPassword);
    const first = Object.values(errors).find(Boolean);
    if (first) {
      Alert.alert(t('auth_invalid_input'), first);
      return;
    }
    if (!token) return;
    setChanging(true);
    try {
      await api.changePassword(token, currentPassword, newPassword);
      Alert.alert(t('common_success'), t('profile_password_updated'));
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Update failed';
      Alert.alert(t('auth_invalid_input'), message);
    } finally {
      setChanging(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Logo size="sm" />
      </View>

      {/* Account */}
      <Text style={styles.sectionHeader}>{t('profile_section_account')}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>{t('profile_name')}</Text>
        <Text style={styles.value}>{profile?.name ?? user?.email ?? '—'}</Text>
        <Text style={styles.label}>{t('auth_email')}</Text>
        <Text style={styles.value}>{profile?.email ?? user?.email ?? '—'}</Text>
        <Text style={styles.label}>{t('auth_phone')}</Text>
        <Text style={styles.valueLast}>{profile?.phone ?? '—'}</Text>
      </View>

      {/* Security */}
      <Text style={styles.sectionHeader}>{t('profile_section_security')}</Text>
      <View style={styles.card}>
        {!showChangePassword ? (
          <Pressable style={styles.rowAction} onPress={() => setShowChangePassword(true)}>
            <Text style={styles.rowActionText}>{t('profile_change_password')}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t('profile_change_password')}</Text>
            <View style={styles.inputRow}>
              <PasswordInput
                placeholder={t('profile_current_password')}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoComplete="password"
              />
            </View>
            <View style={styles.inputRow}>
              <PasswordInput
                placeholder={t('profile_new_password')}
                value={newPassword}
                onChangeText={setNewPassword}
                autoComplete="password-new"
              />
            </View>
            <View style={styles.row}>
              <Pressable style={styles.buttonSecondary} onPress={() => { setShowChangePassword(false); setCurrentPassword(''); setNewPassword(''); }}>
                <Text style={styles.buttonSecondaryText}>{t('common_cancel')}</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={handleChangePassword} disabled={changing}>
                {changing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>{t('profile_update')}</Text>}
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Preferences */}
      <Text style={styles.sectionHeader}>{t('profile_section_preferences')}</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('profile_language')}</Text>
        <View style={styles.row}>
          <Pressable style={[styles.langBtn, locale === 'en' && styles.langBtnActive]} onPress={() => setLocale('en')}>
            <Text style={[styles.langBtnText, locale === 'en' && styles.langBtnTextActive]}>English</Text>
          </Pressable>
          <Pressable style={[styles.langBtn, locale === 'ne' && styles.langBtnActive]} onPress={() => setLocale('ne')}>
            <Text style={[styles.langBtnText, locale === 'ne' && styles.langBtnTextActive]}>नेपाली</Text>
          </Pressable>
        </View>
      </View>

      {/* Biometric: Enable / Disable */}
      {!biometricLoading && biometricSupported && (
        <>
          <Text style={styles.sectionHeader}>{t('profile_section_biometric')}</Text>
          <View style={styles.card}>
            <View style={styles.biometricRow}>
              <View style={styles.biometricText}>
                <Text style={styles.biometricTitle}>{biometricEnabled ? t('profile_biometric_enabled') : t('profile_biometric_disabled')}</Text>
                <Text style={styles.biometricDesc}>{t('profile_biometric_desc')}</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.surface.input, true: colors.accent[500] }}
                thumbColor={colors.text.primary}
              />
            </View>
          </View>
        </>
      )}

      {/* About & support (footer sections) */}
      <Text style={styles.sectionHeader}>{t('profile_section_info')}</Text>
      <View style={styles.card}>
        <Pressable style={styles.rowAction} onPress={() => router.push('/(info)/about')}>
          <Text style={styles.rowActionText}>{t('profile_about_us')}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.rowAction} onPress={() => router.push('/(info)/contact')}>
          <Text style={styles.rowActionText}>{t('profile_contact')}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.rowAction} onPress={() => router.push('/(info)/blogs')}>
          <Text style={styles.rowActionText}>{t('profile_blogs')}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.rowAction} onPress={() => router.push('/(info)/videos')}>
          <Text style={styles.rowActionText}>{t('profile_videos')}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.rowAction} onPress={() => router.push('/(info)/cms/help')}>
          <Text style={styles.rowActionText}>{t('profile_help')}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.rowAction} onPress={() => router.push('/(info)/cms/privacy')}>
          <Text style={styles.rowActionText}>{t('profile_privacy')}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.rowAction} onPress={() => router.push('/(info)/cms/terms')}>
          <Text style={styles.rowActionText}>{t('profile_terms')}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.logout}
        onPress={() => {
          Alert.alert(t('profile_sign_out'), t('profile_are_you_sure'), [
            { text: t('common_cancel'), style: 'cancel' },
            { text: t('profile_sign_out'), style: 'destructive', onPress: () => logout().then(() => router.replace('/(auth)/login')) },
          ]);
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.text.primary} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>{t('profile_sign_out')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[500] },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  header: { marginBottom: spacing.lg },
  sectionHeader: {
    ...typography.subtitle,
    color: colors.accentAlt[500],
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { color: colors.text.muted, fontSize: 12, marginBottom: 4 },
  value: { color: colors.text.primary, fontSize: 16, marginBottom: spacing.md },
  valueLast: { color: colors.text.primary, fontSize: 16 },
  sectionTitle: { ...typography.subtitle, color: colors.text.primary, marginBottom: spacing.md },
  inputRow: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  rowAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface.input },
  rowActionText: { color: colors.text.primary, fontSize: 16 },
  chevron: { color: colors.text.muted, fontSize: 24 },
  langBtn: { flex: 1, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface.input, alignItems: 'center' },
  langBtnActive: { backgroundColor: colors.accent[500] },
  langBtnText: { color: colors.text.secondary, fontSize: 14 },
  langBtnTextActive: { color: colors.text.primary, fontWeight: '600' },
  button: {
    flex: 1,
    backgroundColor: colors.accent[500],
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonText: { color: colors.text.primary, fontWeight: '600' },
  buttonSecondary: {
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonSecondaryText: { color: colors.accentAlt[500], fontSize: 15 },
  biometricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  biometricText: { flex: 1, marginRight: spacing.md },
  biometricTitle: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  biometricDesc: { ...typography.bodySm, color: colors.text.muted, marginTop: spacing.xs },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface.card,
  },
  logoutIcon: { marginRight: spacing.sm },
  logoutText: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
});
