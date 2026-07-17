import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nepali_homestays/core/debug/agent_debug_log.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/storage/token_store.dart';
import 'package:nepali_homestays/shared/models/models.dart';

enum AuthStatus { unknown, authenticated, unauthenticated, mustChangePassword }

class AuthState {
  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
    this.adminBlocked = false,
  });

  final AuthStatus status;
  final User? user;
  final String? error;
  final bool adminBlocked;

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
    bool clearUser = false,
    bool? adminBlocked,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      error: error,
      adminBlocked: adminBlocked ?? this.adminBlocked,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._api, this._tokens) : super(const AuthState()) {
    bootstrap();
  }

  final ApiRepository _api;
  final TokenStore _tokens;

  Future<void> bootstrap() async {
    final token = await _tokens.getAccessToken();
    if (token == null || token.isEmpty) {
      state = const AuthState(status: AuthStatus.unauthenticated);
      return;
    }
    try {
      final user = await _api.me();
      if (!_acceptUser(user)) return;
      if (user.mustChangePassword) {
        state = AuthState(status: AuthStatus.mustChangePassword, user: user);
      } else {
        state = AuthState(status: AuthStatus.authenticated, user: user);
      }
    } catch (_) {
      await _tokens.clear();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  bool _acceptUser(User user) {
    if (user.isAdmin) {
      _tokens.clear();
      state = const AuthState(
        status: AuthStatus.unauthenticated,
        adminBlocked: true,
        error: 'Admin is available on the web only. Please use the Nepali Homestays website.',
      );
      return false;
    }
    return true;
  }

  Future<void> _persistSession(Map<String, dynamic> data) async {
    final token = data['token']?.toString();
    final refresh = data['refreshToken']?.toString();
    // #region agent log
    await agentDebugLog(
      hypothesisId: 'P5-P6',
      location: 'auth_controller.dart:persist-entry',
      message: 'Auth session persistence started',
      data: {
        'hasAccessToken': token?.isNotEmpty == true,
        'hasRefreshToken': refresh?.isNotEmpty == true,
        'hasUserMap': data['user'] is Map,
      },
    );
    // #endregion
    if (token != null && token.isNotEmpty) {
      await _tokens.saveTokens(access: token, refresh: refresh);
    }
    final userMap = data['user'] as Map<String, dynamic>?;
    if (userMap != null) {
      final user = User.fromJson(userMap);
      if (!_acceptUser(user)) return;
      if (user.mustChangePassword || data['must_change_password'] == true) {
        state = AuthState(status: AuthStatus.mustChangePassword, user: user);
      } else {
        state = AuthState(status: AuthStatus.authenticated, user: user);
      }
      // #region agent log
      await agentDebugLog(
        hypothesisId: 'P6-P8',
        location: 'auth_controller.dart:persist-state',
        message: 'Auth user parsed and state updated',
        data: {
          'userId': user.id,
          'role': user.role,
          'status': state.status.name,
          'adminBlocked': state.adminBlocked,
        },
      );
      // #endregion
    } else {
      await bootstrap();
    }
  }

  /// Returns email if OTP required, null if logged in.
  Future<String?> login(String email, String password) async {
    state = state.copyWith(error: null, adminBlocked: false);
    try {
      final data = await _api.login(email, password);
      if (data['requireOtp'] == true) {
        return data['email']?.toString() ?? email;
      }
      await _persistSession(data);
      return null;
    } catch (error) {
      // #region agent log
      await agentDebugLog(
        hypothesisId: 'P5-P8',
        location: 'auth_controller.dart:post-response-error',
        message: 'Login failed after or during API response processing',
        data: {
          'errorType': error.runtimeType.toString(),
          'error': error.toString(),
          'status': state.status.name,
        },
      );
      // #endregion
      rethrow;
    }
  }

  Future<void> signup({
    required String email,
    required String password,
    required String name,
    required String phone,
    required String role,
  }) async {
    state = state.copyWith(error: null);
    await _api.signup(
      email: email,
      password: password,
      name: name,
      phone: phone,
      role: role == 'host' ? 'host' : 'guest',
    );
  }

  Future<void> verify(String email, String otp) async {
    final data = await _api.verify(email: email, otp: otp);
    await _persistSession(data);
  }

  Future<void> changePassword({
    String? currentPassword,
    required String newPassword,
  }) async {
    await _api.changePassword(currentPassword: currentPassword, newPassword: newPassword);
    await bootstrap();
  }

  Future<void> refreshUser() async {
    final user = await _api.me();
    if (!_acceptUser(user)) return;
    state = AuthState(status: AuthStatus.authenticated, user: user);
  }

  Future<void> becomeHost() async {
    await _api.becomeHost();
    await refreshUser();
  }

  Future<void> logout() async {
    await _api.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void clearAdminBlocked() {
    state = state.copyWith(adminBlocked: false, error: null);
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.watch(apiRepositoryProvider), ref.watch(tokenStoreProvider));
});
