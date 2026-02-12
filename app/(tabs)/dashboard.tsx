import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { GuestDashboardContent } from '@/components/dashboard/GuestDashboardContent';
import { HostDashboardContent } from '@/components/dashboard/HostDashboardContent';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default function DashboardTab() {
  const { user, token, loading } = useAuth();

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
  const role = user.role?.toLowerCase();
  if (role === 'host') {
    return <HostDashboardContent />;
  }
  return <GuestDashboardContent />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
});
