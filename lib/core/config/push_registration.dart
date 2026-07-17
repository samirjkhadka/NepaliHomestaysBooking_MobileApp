import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';

class PushRegistration {
  static const enabled =
      bool.fromEnvironment('ENABLE_PUSH', defaultValue: true);
  static bool _initialized = false;
  static bool _listeningForRefresh = false;

  static Future<void> registerIfEnabled(WidgetRef ref, {required String platform}) async {
    if (!enabled) return;
    try {
      if (!_initialized) {
        await Firebase.initializeApp();
        _initialized = true;
      }
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      final token = await messaging.getToken();
      if (token != null && token.isNotEmpty) {
        await ref
            .read(apiRepositoryProvider)
            .registerPushToken(token, platform);
      }
      if (!_listeningForRefresh) {
        _listeningForRefresh = true;
        messaging.onTokenRefresh.listen((newToken) async {
          try {
            await ref
                .read(apiRepositoryProvider)
                .registerPushToken(newToken, platform);
          } catch (_) {}
        });
      }
    } catch (error) {
      if (kDebugMode) {
        debugPrint('Push registration unavailable: $error');
      }
    }
  }
}
