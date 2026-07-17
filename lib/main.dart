import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nepali_homestays/app.dart';
import 'package:nepali_homestays/core/config/push_registration.dart';
import 'package:nepali_homestays/features/auth/presentation/auth_controller.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:nepali_homestays/core/config/env.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  if (Env.stripePublishableKey.isNotEmpty) {
    Stripe.publishableKey = Env.stripePublishableKey;
  }
  runApp(const ProviderScope(child: _Bootstrap()));
}

class _Bootstrap extends ConsumerWidget {
  const _Bootstrap();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(authControllerProvider, (prev, next) {
      if (next.status == AuthStatus.authenticated) {
        PushRegistration.registerIfEnabled(
          ref,
          platform: Platform.isIOS ? 'ios' : 'android',
        );
      }
    });
    return const NepaliHomestaysApp();
  }
}
