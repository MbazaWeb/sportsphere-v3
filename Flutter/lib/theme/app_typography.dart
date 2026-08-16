import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Typography system matching Inter (body) + Outfit (display/headings).
class AppTypography {
  AppTypography._();

  static TextTheme textTheme = TextTheme(
    // Display / Headings — Outfit
    displayLarge: GoogleFonts.outfit(
      fontSize: 40,
      fontWeight: FontWeight.w700,
      color: AppColors.foreground,
      letterSpacing: -0.5,
    ),
    displayMedium: GoogleFonts.outfit(
      fontSize: 32,
      fontWeight: FontWeight.w700,
      color: AppColors.foreground,
    ),
    displaySmall: GoogleFonts.outfit(
      fontSize: 28,
      fontWeight: FontWeight.w700,
      color: AppColors.foreground,
    ),
    headlineLarge: GoogleFonts.outfit(
      fontSize: 24,
      fontWeight: FontWeight.w700,
      color: AppColors.foreground,
    ),
    headlineMedium: GoogleFonts.outfit(
      fontSize: 20,
      fontWeight: FontWeight.w700,
      color: AppColors.foreground,
    ),
    headlineSmall: GoogleFonts.outfit(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: AppColors.foreground,
    ),

    // Body — Inter
    titleLarge: GoogleFonts.inter(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: AppColors.foreground,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: AppColors.foreground,
    ),
    titleSmall: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: AppColors.foreground,
    ),
    bodyLarge: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      color: AppColors.foreground,
      height: 1.5,
    ),
    bodyMedium: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      color: AppColors.foreground,
      height: 1.5,
    ),
    bodySmall: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      color: AppColors.mutedForeground,
    ),
    labelLarge: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: AppColors.foreground,
    ),
    labelMedium: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      color: AppColors.foreground,
    ),
    labelSmall: GoogleFonts.inter(
      fontSize: 10,
      fontWeight: FontWeight.w700,
      color: AppColors.mutedForeground,
      letterSpacing: 0.2,
    ),
  );

  /// Gold gradient text style helper
  static TextStyle goldGradient({
    double fontSize = 16,
    FontWeight fontWeight = FontWeight.w700,
  }) {
    return GoogleFonts.outfit(
      fontSize: fontSize,
      fontWeight: fontWeight,
      foreground: Paint()
        ..shader = const LinearGradient(
          colors: AppColors.gradientGold,
        ).createShader(const Rect.fromLTWH(0, 0, 200, 70)),
    );
  }
}
