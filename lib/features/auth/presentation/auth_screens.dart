import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nepali_homestays/core/i18n/strings.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';
import 'package:nepali_homestays/features/auth/presentation/auth_controller.dart';
import 'package:nepali_homestays/shared/models/models.dart';
import 'package:nepali_homestays/shared/widgets/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1400), _routeNext);
  }

  Future<void> _routeNext() async {
    if (!mounted) return;
    final auth = ref.read(authControllerProvider);
    if (auth.status == AuthStatus.authenticated) {
      context.go('/home');
      return;
    }
    if (auth.status == AuthStatus.mustChangePassword) {
      context.go('/change-password');
      return;
    }
    if (auth.status == AuthStatus.unknown) return;

    final prefs = await SharedPreferences.getInstance();
    final done = prefs.getBool('onboarding_done') ?? false;
    if (!mounted) return;
    context.go(done ? '/login' : '/onboarding');
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authControllerProvider, (prev, next) {
      if (next.status == AuthStatus.authenticated) {
        context.go('/home');
      } else if (next.status == AuthStatus.mustChangePassword) {
        context.go('/change-password');
      } else if (next.status == AuthStatus.unauthenticated) {
        _routeNext();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/brand/logo_bg.png',
              height: 120,
              fit: BoxFit.contain,
            ),
            const SizedBox(height: 20),
            Text(
              ref.watch(stringsProvider).appName,
              style: Theme.of(context).textTheme.displayLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Homestays across Nepal',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.onSurfaceVariant,
                    fontStyle: FontStyle.italic,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

Widget _brandLogo({double height = 72}) {
  return Image.asset(
    'assets/brand/logo.png',
    height: height,
    fit: BoxFit.contain,
  );
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      final otpEmail = await ref.read(authControllerProvider.notifier).login(
            _email.text.trim(),
            _password.text,
          );
      if (!mounted) return;
      final auth = ref.read(authControllerProvider);
      if (auth.adminBlocked) {
        await showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Admin accounts'),
            content: Text(auth.error ?? 'Admin is available on the web only.'),
            actions: [
              TextButton(
                onPressed: () {
                  ref.read(authControllerProvider.notifier).clearAdminBlocked();
                  Navigator.pop(ctx);
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
        return;
      }
      if (otpEmail != null) {
        context.push('/verify?email=${Uri.encodeComponent(otpEmail)}');
      } else if (auth.status == AuthStatus.mustChangePassword) {
        context.go('/change-password');
      } else if (auth.status == AuthStatus.authenticated) {
        context.go('/home');
      }
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 16),
            Center(child: _brandLogo(height: 88)),
            const SizedBox(height: 20),
            Text(s.appName, style: Theme.of(context).textTheme.displayLarge),
            const SizedBox(height: 8),
            Text(
              'Welcome back',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(labelText: s.email),
            ),
            const SizedBox(height: 12),
            NhPasswordField(controller: _password, label: s.password),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => context.push('/forgot-password'),
                child: Text(s.forgotPassword),
              ),
            ),
            const SizedBox(height: 8),
            NhPrimaryButton(label: s.login, onPressed: _submit, loading: _loading),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => context.push('/signup'),
              child: Text(s.signup),
            ),
          ],
        ),
      ),
    );
  }
}

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  String _role = 'guest';
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_password.text != _confirm.text) {
      showSnack(context, 'Passwords do not match', error: true);
      return;
    }
    if (_password.text.length < 8) {
      showSnack(context, 'Password must be at least 8 characters', error: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(authControllerProvider.notifier).signup(
            email: _email.text.trim(),
            password: _password.text,
            name: _name.text.trim(),
            phone: _phone.text.trim(),
            role: _role,
          );
      if (!mounted) return;
      context.push('/verify?email=${Uri.encodeComponent(_email.text.trim())}');
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.signup)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(child: _brandLogo(height: 72)),
          const SizedBox(height: 20),
          TextField(
            controller: _name,
            decoration: InputDecoration(labelText: s.name),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: s.email),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(labelText: s.phone),
          ),
          const SizedBox(height: 12),
          NhPasswordField(controller: _password, label: s.password),
          const SizedBox(height: 12),
          NhPasswordField(controller: _confirm, label: 'Confirm password'),
          const SizedBox(height: 16),
          Text('I want to join as', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'guest', label: Text(s.guest)),
              ButtonSegment(value: 'host', label: Text(s.host)),
            ],
            selected: {_role},
            onSelectionChanged: (v) => setState(() => _role = v.first),
          ),
          const SizedBox(height: 24),
          NhPrimaryButton(label: s.signup, onPressed: _submit, loading: _loading),
        ],
      ),
    );
  }
}

class VerifyScreen extends ConsumerStatefulWidget {
  const VerifyScreen({super.key, required this.email});
  final String email;

  @override
  ConsumerState<VerifyScreen> createState() => _VerifyScreenState();
}

class _VerifyScreenState extends ConsumerState<VerifyScreen> {
  final _otp = TextEditingController();
  bool _loading = false;
  bool _resending = false;
  int _resendSeconds = 0;
  Timer? _resendTimer;

  @override
  void dispose() {
    _resendTimer?.cancel();
    _otp.dispose();
    super.dispose();
  }

  Future<void> _resend() async {
    if (_resending || _resendSeconds > 0) return;
    setState(() => _resending = true);
    try {
      await ref.read(apiRepositoryProvider).resendOtp(widget.email);
      if (!mounted) return;
      showSnack(context, 'A new verification code was sent.');
      setState(() => _resendSeconds = 60);
      _resendTimer?.cancel();
      _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (!mounted || _resendSeconds <= 1) {
          timer.cancel();
          if (mounted) setState(() => _resendSeconds = 0);
          return;
        }
        setState(() => _resendSeconds--);
      });
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      await ref.read(authControllerProvider.notifier).verify(widget.email, _otp.text.trim());
      if (!mounted) return;
      final auth = ref.read(authControllerProvider);
      if (auth.adminBlocked) {
        showSnack(context, auth.error ?? 'Admin blocked', error: true);
        context.go('/login');
        return;
      }
      if (auth.status == AuthStatus.mustChangePassword) {
        context.go('/change-password');
      } else {
        context.go('/home');
      }
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.verifyOtp)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Enter the code sent to ${widget.email}'),
            const SizedBox(height: 16),
            TextField(
              controller: _otp,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'OTP'),
            ),
            const SizedBox(height: 24),
            NhPrimaryButton(label: s.continueLabel, onPressed: _submit, loading: _loading),
            const SizedBox(height: 8),
            TextButton(
              onPressed:
                  _resending || _resendSeconds > 0 ? null : _resend,
              child: Text(
                _resending
                    ? 'Sending…'
                    : _resendSeconds > 0
                        ? 'Resend code in ${_resendSeconds}s'
                        : 'Resend verification code',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      await ref.read(apiRepositoryProvider).forgotPassword(_email.text.trim());
      if (!mounted) return;
      context.push('/reset-password?email=${Uri.encodeComponent(_email.text.trim())}');
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.forgotPassword)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Center(child: _brandLogo(height: 64)),
            const SizedBox(height: 20),
            TextField(
              controller: _email,
              decoration: InputDecoration(labelText: s.email),
            ),
            const SizedBox(height: 24),
            NhPrimaryButton(label: s.continueLabel, onPressed: _submit, loading: _loading),
          ],
        ),
      ),
    );
  }
}

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key, required this.email});
  final String email;

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _otp = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _otp.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_password.text != _confirm.text) {
      showSnack(context, 'Passwords do not match', error: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(apiRepositoryProvider).resetPassword(
            email: widget.email,
            otp: _otp.text.trim(),
            newPassword: _password.text,
          );
      if (!mounted) return;
      showSnack(context, 'Password updated. Please log in.');
      context.go('/login');
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.changePassword)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(
            controller: _otp,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'OTP'),
          ),
          const SizedBox(height: 12),
          NhPasswordField(controller: _password, label: s.password),
          const SizedBox(height: 12),
          NhPasswordField(controller: _confirm, label: 'Confirm password'),
          const SizedBox(height: 24),
          NhPrimaryButton(label: s.save, onPressed: _submit, loading: _loading),
        ],
      ),
    );
  }
}

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _otp = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;
  bool _sendingOtp = false;

  @override
  void dispose() {
    _otp.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final email = ref.read(authControllerProvider).user?.email;
    if (email == null || email.isEmpty) {
      showSnack(context, 'Missing account email', error: true);
      return;
    }
    setState(() => _sendingOtp = true);
    try {
      await ref.read(apiRepositoryProvider).forgotPassword(email);
      if (mounted) showSnack(context, 'OTP sent to $email');
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _sendingOtp = false);
    }
  }

  Future<void> _submit() async {
    if (_password.text != _confirm.text) {
      showSnack(context, 'Passwords do not match', error: true);
      return;
    }
    final email = ref.read(authControllerProvider).user?.email;
    if (email == null || email.isEmpty) {
      showSnack(context, 'Missing account email', error: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(apiRepositoryProvider).resetPassword(
            email: email,
            otp: _otp.text.trim(),
            newPassword: _password.text,
          );
      if (!mounted) return;
      showSnack(context, 'Password updated.');
      final auth = ref.read(authControllerProvider);
      if (auth.status == AuthStatus.mustChangePassword || auth.status == AuthStatus.authenticated) {
        await ref.read(authControllerProvider.notifier).logout();
      }
      if (mounted) context.go('/login');
    } on AppException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final email = ref.watch(authControllerProvider).user?.email ?? '';
    return Scaffold(
      appBar: AppBar(title: Text(s.changePassword)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (email.isNotEmpty)
            Text('OTP will be sent to $email', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _sendingOtp ? null : _sendOtp,
            child: Text(_sendingOtp ? 'Sending…' : 'Send OTP'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _otp,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'OTP'),
          ),
          const SizedBox(height: 12),
          NhPasswordField(controller: _password, label: s.password),
          const SizedBox(height: 12),
          NhPasswordField(controller: _confirm, label: 'Confirm password'),
          const SizedBox(height: 24),
          NhPrimaryButton(label: s.save, onPressed: _submit, loading: _loading),
        ],
      ),
    );
  }
}
