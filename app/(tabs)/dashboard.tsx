import { useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { GuestDashboardContent } from '@/components/dashboard/GuestDashboardContent';
import { HostDashboardContent } from '@/components/dashboard/HostDashboardContent';
import { View, ActivityIndicator, StyleSheet, Pressable, Text } from 'react-native';
import { colors, spacing, radius } from '@/constants/theme';

export default function DashboardTab() {
  const { user, token, loading } = useAuth();
  const { t } = useTranslation();
  const [hostMode, setHostMode] = useState(true);
  const role = user?.role?.toLowerCase();
  const isHost = role === 'host';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
      </View>
    );
  }
  if (!token || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isHost) {
    return (
      <View style={styles.wrap}>
        <View style={styles.roleSwitch}>
          <Pressable
            style={[styles.roleChip, hostMode && styles.roleChipActive]}
            onPress={() => setHostMode(true)}
            accessibilityRole="tab"
            accessibilityState={{ selected: hostMode }}
          >
            <Text style={[styles.roleChipText, hostMode && styles.roleChipTextActive]}>{t('dashboard_tab_host')}</Text>
          </Pressable>
          <Pressable
            style={[styles.roleChip, !hostMode && styles.roleChipActive]}
            onPress={() => setHostMode(false)}
            accessibilityRole="tab"
            accessibilityState={{ selected: !hostMode }}
          >
            <Text style={[styles.roleChipText, !hostMode && styles.roleChipTextActive]}>{t('dashboard_tab_guest_trips')}</Text>
          </Pressable>
        </View>
        {hostMode ? <HostDashboardContent /> : <GuestDashboardContent />}
      </View>
    );
  }

  return <GuestDashboardContent />;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  roleSwitch: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  roleChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface.input,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: { backgroundColor: colors.forest[500], borderColor: colors.forest[500] },
  roleChipText: { fontWeight: '600', color: colors.text.secondary },
  roleChipTextActive: { color: colors.text.onAccent },
});
