import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nepali_homestays/core/config/env.dart';
import 'package:nepali_homestays/core/i18n/strings.dart';
import 'package:nepali_homestays/core/router/app_router.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';

class NepaliHomestaysApp extends ConsumerWidget {
  const NepaliHomestaysApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final locale = ref.watch(localeProvider);
    // Material/Cupertino do not ship Nepali (`ne`); keep AppStrings on `ne`.
    final materialLocale = locale.languageCode == 'ne' ? const Locale('en') : locale;

    return MaterialApp.router(
      title: Env.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      locale: materialLocale,
      supportedLocales: AppStrings.supported,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      localeResolutionCallback: (_, __) => materialLocale,
      routerConfig: router,
    );
  }
}
