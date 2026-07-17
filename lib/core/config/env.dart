class Env {
  Env._();

  static const String appName = 'Nepali Homestays';
  static const String deepLinkScheme = 'nepalhomestays';
  static const String defaultDevPort = '5113';
  static const String defaultApiBaseUrl = 'https://testcmsapi.dghub.io';
  static const String stripePublishableKey =
      String.fromEnvironment('STRIPE_PUBLISHABLE_KEY');

  /// Default LAN host for physical Android devices (USB debugging + Wi‑Fi).
  /// Override: `--dart-define=DEV_HOST=10.0.2.2` (emulator)
  /// or `--dart-define=DEV_HOST=127.0.0.1` after `adb reverse tcp:5113 tcp:5113`
  /// or full `--dart-define=API_BASE_URL=http://host:5113`
  static const String defaultPhysicalHost = '192.168.1.100';

  static String get apiBaseUrl {
    const fromDefine = String.fromEnvironment('API_BASE_URL');
    if (fromDefine.trim().isNotEmpty) {
      return fromDefine.replaceAll(RegExp(r'/$'), '');
    }

    const devHost = String.fromEnvironment('DEV_HOST');
    if (devHost.trim().isNotEmpty) {
      return 'http://${devHost.trim()}:$defaultDevPort';
    }

    return defaultApiBaseUrl;
  }

  static String imageUrl(String? path) {
    if (path == null || path.trim().isEmpty) return '';
    final trimmed = path.trim();
    if (trimmed.startsWith('http')) return trimmed;
    final base = apiBaseUrl;
    final p = trimmed.startsWith('/') ? trimmed : '/images/$trimmed';
    return '$base$p';
  }
}
