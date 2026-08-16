import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';

/// Privacy — PUT privacySettings (web PrivacyTab).
class PrivacySheet extends ConsumerStatefulWidget {
  const PrivacySheet({super.key});

  @override
  ConsumerState<PrivacySheet> createState() => _PrivacySheetState();
}

class _PrivacySheetState extends ConsumerState<PrivacySheet> {
  late Map<String, bool> _privacy;
  bool _saving = false;

  static const _items = [
    ('showProfile', 'Public Profile', 'Anyone can view your profile'),
    ('allowFollow', 'Allow Follow', 'Anyone can follow you'),
    ('allowMessages', 'Allow Messages', 'Anyone can send you DMs'),
    ('allowMention', 'Allow Mentions', 'Anyone can @mention you'),
    ('allowTag', 'Allow Tags', 'Anyone can tag you in posts'),
    ('showActivity', 'Show Activity', 'Your activity feed is visible'),
    ('showOnline', 'Online Status', 'Show when you’re active'),
    ('showLocation', 'Show Location', 'Display your city/region'),
    ('showPhone', 'Show Phone', 'Phone visible on profile'),
    ('showEmail', 'Show Email', 'Email visible on profile'),
  ];

  @override
  void initState() {
    super.initState();
    final u = ref.read(authProvider).user;
    _privacy = Map<String, bool>.from(u?.privacySettings ?? {});
    for (final i in _items) {
      _privacy.putIfAbsent(i.$1, () => true);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final updated = await ref.read(profileApiProvider).updateProfile(privacySettings: _privacy);
      await ref.read(authProvider.notifier).applyUser(updated);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Privacy settings saved')));
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.88,
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
                  child: Text('Privacy', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17)),
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
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              children: [
                GlassCard(
                  borderRadius: 14,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: _items.map((item) {
                      return SwitchListTile(
                        title: Text(item.$2, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        subtitle: Text(item.$3, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                        value: _privacy[item.$1] != false,
                        activeColor: AppColors.primary,
                        onChanged: (v) => setState(() => _privacy[item.$1] = v),
                      );
                    }).toList(),
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
