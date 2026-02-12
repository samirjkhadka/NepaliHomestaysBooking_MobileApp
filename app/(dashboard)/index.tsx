import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function DashboardIndex() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  if (role === 'host') {
    return <Redirect href="/(dashboard)/host" />;
  }
  return <Redirect href="/(dashboard)/guest" />;
}
