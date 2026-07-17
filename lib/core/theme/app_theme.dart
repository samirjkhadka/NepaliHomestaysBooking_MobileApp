import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Himalayan Hearth tokens from screens/.../himalayan_hearth/DESIGN.md
class AppColors {
  AppColors._();

  static const Color background = Color(0xFFFBF9F4);
  static const Color onBackground = Color(0xFF1B1C19);
  static const Color surface = Color(0xFFFBF9F4);
  static const Color surfaceContainer = Color(0xFFF0EEE9);
  static const Color surfaceContainerHigh = Color(0xFFEAE8E3);
  static const Color surfaceContainerHighest = Color(0xFFE4E2DD);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color onSurface = Color(0xFF1B1C19);
  static const Color onSurfaceVariant = Color(0xFF5A413D);
  static const Color outline = Color(0xFF8E706C);
  static const Color outlineVariant = Color(0xFFE2BEBA);

  static const Color primary = Color(0xFF680003);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFF900A0C);
  static const Color dhakaRed = Color(0xFFB32821);

  static const Color secondary = Color(0xFF9A442D);
  static const Color secondaryContainer = Color(0xFFFD9174);
  static const Color onSecondaryContainer = Color(0xFF752814);

  static const Color tertiary = Color(0xFF003546);
  static const Color tertiaryContainer = Color(0xFF134C61);
  static const Color impactTeal = Color(0xFF316479);

  static const Color error = Color(0xFFBA1A1A);
}

class AppRadii {
  AppRadii._();
  static const double sm = 4;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
}

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.light(
        primary: AppColors.primary,
        onPrimary: AppColors.onPrimary,
        primaryContainer: AppColors.primaryContainer,
        secondary: AppColors.secondary,
        secondaryContainer: AppColors.secondaryContainer,
        tertiary: AppColors.tertiary,
        tertiaryContainer: AppColors.tertiaryContainer,
        error: AppColors.error,
        surface: AppColors.surface,
        onSurface: AppColors.onSurface,
        onSurfaceVariant: AppColors.onSurfaceVariant,
        outline: AppColors.outline,
        outlineVariant: AppColors.outlineVariant,
      ),
      scaffoldBackgroundColor: AppColors.background,
    );

    return base.copyWith(
      textTheme: GoogleFonts.manropeTextTheme(base.textTheme).copyWith(
        displayLarge: GoogleFonts.beVietnamPro(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: AppColors.onBackground,
          height: 1.25,
        ),
        headlineMedium: GoogleFonts.beVietnamPro(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: AppColors.onBackground,
        ),
        titleLarge: GoogleFonts.beVietnamPro(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppColors.onBackground,
        ),
        titleMedium: GoogleFonts.beVietnamPro(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.onBackground,
        ),
        // Explicit colors required: GoogleFonts.copyWith without color wipes
        // ThemeData body ink → Material 3 TextField (bodyLarge) becomes invisible.
        bodyLarge: GoogleFonts.manrope(
          fontSize: 16,
          height: 1.5,
          color: AppColors.onSurface,
        ),
        bodyMedium: GoogleFonts.manrope(
          fontSize: 14,
          height: 1.45,
          color: AppColors.onSurface,
        ),
        bodySmall: GoogleFonts.manrope(
          fontSize: 12,
          height: 1.4,
          color: AppColors.onSurfaceVariant,
        ),
        labelLarge: GoogleFonts.manrope(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.05 * 13,
          color: AppColors.onSurface,
        ),
        labelMedium: GoogleFonts.manrope(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.onSurfaceVariant,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background.withValues(alpha: 0.92),
        foregroundColor: AppColors.onBackground,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.beVietnamPro(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.onBackground,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surfaceContainerLowest,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.xl),
          side: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.35)),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadii.lg)),
          textStyle: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 0.6),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: BorderSide(color: AppColors.primary.withValues(alpha: 0.25)),
          backgroundColor: AppColors.surfaceContainerHighest,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadii.lg)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceContainerLowest,
        labelStyle: GoogleFonts.manrope(color: AppColors.onSurfaceVariant),
        floatingLabelStyle: GoogleFonts.manrope(color: AppColors.dhakaRed),
        hintStyle: GoogleFonts.manrope(color: AppColors.onSurfaceVariant.withValues(alpha: 0.7)),
        prefixStyle: GoogleFonts.manrope(color: AppColors.onSurface),
        suffixStyle: GoogleFonts.manrope(color: AppColors.onSurface),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.6)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.6)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: const BorderSide(color: AppColors.dhakaRed, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      textSelectionTheme: const TextSelectionThemeData(
        cursorColor: AppColors.dhakaRed,
        selectionColor: Color(0x55FD9174),
        selectionHandleColor: AppColors.dhakaRed,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceContainerHigh,
        selectedColor: AppColors.secondaryContainer,
        labelStyle: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600),
        shape: const StadiumBorder(),
        side: BorderSide.none,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surfaceContainerLowest,
        selectedItemColor: AppColors.dhakaRed,
        unselectedItemColor: AppColors.onSurfaceVariant,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      dividerColor: AppColors.outlineVariant.withValues(alpha: 0.4),
    );
  }
}
