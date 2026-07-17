import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:nepali_homestays/core/debug/agent_debug_log.dart';

class TokenStore {
  TokenStore({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _accessKey = 'nh_access_token';
  static const _refreshKey = 'nh_refresh_token';

  Future<String?> getAccessToken() => _storage.read(key: _accessKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshKey);

  Future<void> saveTokens({required String access, String? refresh}) async {
    try {
      // #region agent log
      await agentDebugLog(
        hypothesisId: 'P5',
        location: 'token_store.dart:save-entry',
        message: 'Secure token storage write started',
        data: {
          'hasAccessToken': access.isNotEmpty,
          'hasRefreshToken': refresh?.isNotEmpty == true,
        },
      );
      // #endregion
      await _storage.write(key: _accessKey, value: access);
      // #region agent log
      await agentDebugLog(
        hypothesisId: 'P5',
        location: 'token_store.dart:access-saved',
        message: 'Access token secure storage write completed',
        data: const {},
      );
      // #endregion
      if (refresh != null && refresh.isNotEmpty) {
        await _storage.write(key: _refreshKey, value: refresh);
      }
      // #region agent log
      await agentDebugLog(
        hypothesisId: 'P5-P6',
        location: 'token_store.dart:save-exit',
        message: 'All secure token storage writes completed',
        data: const {},
      );
      // #endregion
    } catch (error) {
      // #region agent log
      await agentDebugLog(
        hypothesisId: 'P5',
        location: 'token_store.dart:save-error',
        message: 'Secure token storage write failed',
        data: {
          'errorType': error.runtimeType.toString(),
          'error': error.toString(),
        },
      );
      // #endregion
      rethrow;
    }
  }

  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}
