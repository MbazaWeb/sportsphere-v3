import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppearancePrefs {
  const AppearancePrefs({
    this.theme = 'dark',
    this.fontSize = 'medium',
    this.reducedMotion = false,
    this.highContrast = false,
  });

  final String theme;
  final String fontSize;
  final bool reducedMotion;
  final bool highContrast;

  ThemeMode get themeMode {
    switch (theme) {
      case 'light':
        return ThemeMode.light;
      case 'system':
        return ThemeMode.system;
      default:
        return ThemeMode.dark;
    }
  }

  /// Text scale factor relative to medium.
  double get textScale {
    switch (fontSize) {
      case 'small':
        return 0.9;
      case 'large':
        return 1.12;
      default:
        return 1.0;
    }
  }

  AppearancePrefs copyWith({
    String? theme,
    String? fontSize,
    bool? reducedMotion,
    bool? highContrast,
  }) =>
      AppearancePrefs(
        theme: theme ?? this.theme,
        fontSize: fontSize ?? this.fontSize,
        reducedMotion: reducedMotion ?? this.reducedMotion,
        highContrast: highContrast ?? this.highContrast,
      );
}

class AppearancePrefsNotifier extends StateNotifier<AppearancePrefs> {
  AppearancePrefsNotifier() : super(const AppearancePrefs()) {
    _load();
  }

  Future<void> _load() async {
    final p = await SharedPreferences.getInstance();
    state = AppearancePrefs(
      theme: p.getString('ss_theme') ?? 'dark',
      fontSize: p.getString('ss_fontSize') ?? 'medium',
      reducedMotion: p.getBool('ss_reducedMotion') ?? false,
      highContrast: p.getBool('ss_highContrast') ?? false,
    );
  }

  Future<void> refresh() => _load();

  Future<void> setAll({
    required String theme,
    required String fontSize,
    required bool reducedMotion,
    required bool highContrast,
  }) async {
    final p = await SharedPreferences.getInstance();
    await p.setString('ss_theme', theme);
    await p.setString('ss_fontSize', fontSize);
    await p.setBool('ss_reducedMotion', reducedMotion);
    await p.setBool('ss_highContrast', highContrast);
    state = AppearancePrefs(
      theme: theme,
      fontSize: fontSize,
      reducedMotion: reducedMotion,
      highContrast: highContrast,
    );
  }
}

final appearancePrefsProvider =
    StateNotifierProvider<AppearancePrefsNotifier, AppearancePrefs>((ref) {
  return AppearancePrefsNotifier();
});
