import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { colors, spacing } from '@/constants/theme';

type RedirectForm = { action: string; method: string; fields: Record<string, string> };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFormPostHtml(form: RedirectForm): string {
  const action = escapeHtml(form.action);
  const method = (form.method || 'POST').toUpperCase();
  const inputs = Object.entries(form.fields || {})
    .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(String(v))}" />`)
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><form id="npx" method="${method}" action="${action}">${inputs}</form><script>document.getElementById('npx').submit();</script></body></html>`;
}

export default function PaymentWebViewScreen() {
  const { url: paramUrl, bookingId: paramBookingId, redirectForm: paramRedirectForm } = useLocalSearchParams<{ url?: string; bookingId?: string; redirectForm?: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(paramUrl || null);
  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(!paramUrl && !paramRedirectForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paramUrl) {
      setPaymentUrl(paramUrl);
      setLoading(false);
      return;
    }
    if (paramRedirectForm) {
      try {
        const form = JSON.parse(paramRedirectForm) as RedirectForm;
        if (form?.action && form?.fields) {
          setPaymentHtml(buildFormPostHtml(form));
        } else {
          setError('Invalid payment form');
        }
      } catch {
        setError('Invalid payment form');
      }
      setLoading(false);
      return;
    }
    if (paramBookingId && token) {
      const id = Number(paramBookingId);
      if (Number.isNaN(id)) {
        setError('Invalid booking');
        setLoading(false);
        return;
      }
      api.getResumePayment(token, id)
        .then((res) => {
          if (res.redirect_url) {
            setPaymentUrl(res.redirect_url);
          } else if (res.redirect_form && typeof res.redirect_form === 'object' && (res.redirect_form as RedirectForm).action) {
            setPaymentHtml(buildFormPostHtml(res.redirect_form as RedirectForm));
          } else {
            setError('No payment URL');
          }
        })
        .catch(() => setError('Could not load payment'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError('Missing URL or booking');
    }
  }, [paramUrl, paramRedirectForm, paramBookingId, token]);

  const handleNavState = useCallback((navState: { url: string }) => {
    const u = navState?.url || '';
    if (u.includes('payment=success') || u.includes('payment/success')) {
      const bid = paramBookingId || (u.match(/booking[_-]?id=(\d+)/i)?.[1] ?? '');
      router.replace(bid ? { pathname: '/booking/receipt', params: { id: String(bid) } } : '/(tabs)/dashboard');
    } else if (u.includes('payment=failed') || u.includes('payment/failed')) {
      router.back();
    }
  }, [paramBookingId, router]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent[500]} />
        <Text style={styles.loadingText}>Loading payment…</Text>
      </View>
    );
  }
  const hasContent = paymentUrl || paymentHtml;
  if (error || !hasContent) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || 'Missing payment URL'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backHint}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const webViewSource = paymentUrl
    ? { uri: paymentUrl }
    : paymentHtml
      ? { html: paymentHtml }
      : { uri: '' };

  return (
    <WebView
      source={webViewSource}
      style={[styles.webview, { paddingTop: insets.top }]}
      onNavigationStateChange={handleNavState}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent[500]} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] },
  loadingText: { color: colors.text.secondary, marginTop: spacing.md },
  errorText: { color: colors.error },
  backHint: { color: colors.accentAlt[500] },
  backBtn: { marginTop: spacing.md },
  webview: { flex: 1, backgroundColor: '#fff' },
  loadingOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
