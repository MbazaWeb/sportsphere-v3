import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';

/// Notification prefs — PUT notifPrefs (web NotifsTab).
class NotifPrefsSheet extends ConsumerStatefulWidget {
  const NotifPrefsSheet({super.key});

  @override
  ConsumerState<NotifPrefsSheet> createState() => _NotifPrefsSheetState();
}

class _NotifPrefsSheetState extends ConsumerState<NotifPrefsSheet> {
  late Map<String, bool> _prefs;
  bool _saving = false;

  static const _groups = [
    (
      'Channels',
      [
        ('push', 'Push', 'Device/browser push'),
        ('email', 'Email', 'Send to your email'),
        ('inApp', 'In-App', 'Shown inside the app'),
      ]
    ),
    (
      'Alerts',
      [
        ('matchAlerts', 'Match Alerts', 'Goals, kick-off, full-time'),
        ('transferAlerts', 'Transfers', 'Breaking transfer news'),
        ('breakingNews', 'Breaking News', 'Major sports stories'),
        ('liveScoreAlerts', 'Live Scores', 'Goals from your teams'),
        ('teamUpdates', 'Team Updates', 'Posts from followed teams'),
        ('leagueUpdates', 'League Updates', 'Standings & fixtures'),
      ]
    ),
  ];

  @override
  void initState() {
    super.initState();
    final u = ref.read(authProvider).user;
    _prefs = Map<String, bool>.from(u?.notifPrefs ?? {});
    // defaults true like web (prefs[key] !== false)
    for (final g in _groups) {
      for (final item in g.$2) {
        _prefs.putIfAbsent(item.$1, () => true);
      }
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final updated = await ref.read(profileApiProvider).updateProfile(notifPrefs: _prefs);
      await ref.read(authProvider.notifier).applyUser(updated);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Notification preferences saved')));
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
                  child: Text('Notifications', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17)),
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
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                for (final g in _groups) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 12, bottom: 8),
                    child: Text(
                      g.$1.toUpperCase(),
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: AppColors.primary),
                    ),
                  ),
                  GlassCard(
                    borderRadius: 14,
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Column(
                      children: g.$2.map((item) {
                        return SwitchListTile(
                          title: Text(item.$2, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                          subtitle: Text(item.$3, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                          value: _prefs[item.$1] != false,
                          activeColor: AppColors.primary,
                          onChanged: (v) => setState(() => _prefs[item.$1] = v),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
