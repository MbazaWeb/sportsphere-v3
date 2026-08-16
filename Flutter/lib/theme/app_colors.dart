import 'package:flutter/material.dart';

/// Exact color tokens ported from the Next.js `globals.css` design system.
/// Premium Sports Palette — navy + gold + orange.
class AppColors {
  AppColors._();

  // ─── Core backgrounds ───────────────────────────────────────────────
  static const Color background = Color(0xFF0A1628);
  static const Color backgroundSecondary = Color(0xFF0F1D3A);
  static const Color backgroundDeep = Color(0xFF030812);

  // ─── Foreground ─────────────────────────────────────────────────────
  static const Color foreground = Color(0xFFFFFFFF);
  static const Color mutedForeground = Color(0x80FFFFFF); // 50% white

  // ─── Primary (Gold) ─────────────────────────────────────────────────
  static const Color primary = Color(0xFFF5C518);
  static const Color primaryForeground = Color(0xFF0A1628);
  static const Color primaryDark = Color(0xFFD4A800);
  static const Color primaryLight = Color(0xFFFFD700);

  // ─── Accent (Vibrant Orange) ────────────────────────────────────────
  static const Color accent = Color(0xFFFF6B35);
  static const Color accentForeground = Color(0xFFFFFFFF);
  static const Color accentGlow = Color(0x33FF6B35); // 20% opacity

  // ─── Glass / Surface ────────────────────────────────────────────────
  static const Color card = Color(0x0DFFFFFF); // 5% white
  static const Color cardHover = Color(0x14FFFFFF); // 8% white
  static const Color cardBorder = Color(0x14FFFFFF); // 8% white
  static const Color surface = Color(0x0DFFFFFF);
  static const Color surfaceElevated = Color(0x12FFFFFF); // ~7%
  static const Color surfaceBorder = Color(0x14FFFFFF);

  // ─── Semantic ───────────────────────────────────────────────────────
  static const Color muted = Color(0x0DFFFFFF);
  static const Color destructive = Color(0xFFFF453A);
  static const Color border = Color(0x14FFFFFF);
  static const Color input = Color(0x14FFFFFF);
  static const Color ring = Color(0xFFF5C518);

  // ─── Gradients (as Color lists for convenience) ─────────────────────
  static const List<Color> gradientGold = [Color(0xFFF5C518), Color(0xFFFF6B35)];
  static const List<Color> gradientHero = [Color(0xFF1A2A4A), Color(0xFF0A1628)];
  static const List<Color> gradientSplash = [
    Color(0xFF0F1D3A),
    Color(0xFF0A1628),
    Color(0xFF030812),
  ];

  // ─── Legacy aliases ─────────────────────────────────────────────────
  static const Color gold = primary;
}
