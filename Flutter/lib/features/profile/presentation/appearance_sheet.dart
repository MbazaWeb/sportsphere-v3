import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/providers/appearance_prefs.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';

/// Appearance — theme / font / motion (web AppearanceTab + local prefs).
class AppearanceSheet extends ConsumerStatefulWidget {
  const AppearanceSheet({super.key});

  @override
  ConsumerState<AppearanceSheet> createState() => _AppearanceSheetState();
}

class _AppearanceSheetState extends ConsumerState<AppearanceSheet> {
  String _theme = 'dark';
  String _fontSize = 'medium';
  bool _reducedMotion = false;
  bool _highContrast = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final u = ref.read(authProvider).user;
    _theme = u?.theme ?? 'dark';
    _fontSize = u?.fontSize ?? 'medium';
    _reducedMotion = u?.reducedMotion ?? false;
    _highContrast = u?.highContrast ?? false;
    _loadLocal();
  }

  Future<void> _loadLocal() async {
    final p = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _theme = p.getString('ss_theme') ?? _theme;
      _fontSize = p.getString('ss_fontSize') ?? _fontSize;
      _reducedMotion = p.getBool('ss_reducedMotion') ?? _reducedMotion;
      _highContrast = p.getBool('ss_highContrast') ?? _highContrast;
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('ss_theme', _theme);
    await prefs.setString('ss_fontSize', _fontSize);
    await prefs.setBool('ss_reducedMotion', _reducedMotion);
    await prefs.setBool('ss_highContrast', _highContrast);
    await ref.read(appearancePrefsProvider.notifier).setAll(
          theme: _theme,
          fontSize: _fontSize,
          reducedMotion: _reducedMotion,
          highContrast: _highContrast,
        );

    try {
      if (ref.read(authProvider).isAuthenticated) {
        final updated = await ref.read(profileApiProvider).updateProfile(
              theme: _theme,
              fontSize: _fontSize,
              reducedMotion: _reducedMotion,
              highContrast: _highContrast,
            );
        await ref.read(authProvider.notifier).applyUser(updated);
      }
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Appearance applied')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Widget _seg({
    required String label,
    required List<String> options,
    required String value,
    required ValueChanged<String> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13)),
        const SizedBox(height: 8),
        Row(
          children: options.map((o) {
            final on = value == o;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: GestureDetector(
                  onTap: () => onChanged(o),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: on ? AppColors.primary : AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: on ? AppColors.primary : AppColors.border),
                    ),
                    child: Text(
                      o,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: on ? AppColors.primaryForeground : AppColors.mutedForeground,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.75,
      decoration: const BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
            child: Row(
              children: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                Expanded(
                  child: Text('Appearance', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17)),
                ),
                TextButton(
                  onPressed: _saving ? null : _save,
                  child: Text('Save', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppColors.primary)),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                GlassCard(
                  borderRadius: 16,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _seg(
                        label: 'Theme',
                        options: const ['dark', 'light', 'system'],
                        value: _theme,
                        onChanged: (v) => setState(() => _theme = v),
                      ),
                      const SizedBox(height: 18),
                      _seg(
                        label: 'Font size',
                        options: const ['small', 'medium', 'large'],
                        value: _fontSize,
                        onChanged: (v) => setState(() => _fontSize = v),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                GlassCard(
                  borderRadius: 14,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: [
                      SwitchListTile(
                        title: Text('Reduced Motion', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        subtitle: Text('Minimize animations', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                        value: _reducedMotion,
                        activeColor: AppColors.primary,
                        onChanged: (v) => setState(() => _reducedMotion = v),
                      ),
                      SwitchListTile(
                        title: Text('High Contrast', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        subtitle: Text('Increase readability', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                        value: _highContrast,
                        activeColor: AppColors.primary,
                        onChanged: (v) => setState(() => _highContrast = v),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
