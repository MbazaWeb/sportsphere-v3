import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/security/biometric_lock.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import 'edit_profile_sheet.dart';
import 'role_upgrade_sheet.dart';
import 'sports_interests_sheet.dart';
import 'notif_prefs_sheet.dart';
import 'privacy_sheet.dart';
import 'appearance_sheet.dart';

/// Settings — mirrors web SettingsSection groups.
class SettingsSheet extends ConsumerWidget {
  const SettingsSheet({super.key, this.onSignOut});
  final Future<void> Function()? onSignOut;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final isPro = user?.isPro == true;
    final isFan = (user?.role ?? 'fan').toLowerCase() == 'fan';

    return Container(
      height: MediaQuery.sizeOf(context).height * 0.92,
      decoration: const BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
            child: Row(
              children: [
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.chevron_left_rounded)),
                Text('Settings', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
              children: [
                // Pro card
                GlassCard(
                  borderRadius: 16,
                  padding: const EdgeInsets.all(16),
                  glow: isPro,
                  child: Row(
                    children: [
                      Icon(Icons.workspace_premium, color: AppColors.primary, size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isPro ? 'SportSphere Pro' : 'Upgrade to Pro',
                              style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 15),
                            ),
                            Text(
                              isPro ? 'You’re on Pro · full role features' : 'Unlock role upgrades & more',
                              style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                _SectionTitle('Account'),
                GlassCard(
                  borderRadius: 14,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: [
                      _tile(Icons.edit_outlined, 'Edit Profile', () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const EditProfileSheet(),
                        );
                      }),
                      _tile(Icons.favorite_border, 'Sports & Interests', () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const SportsInterestsSheet(),
                        );
                      }),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _SectionTitle('Preferences'),
                GlassCard(
                  borderRadius: 14,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: [
                      _tile(Icons.visibility_outlined, 'Privacy', () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const PrivacySheet(),
                        );
                      }),
                      const _BiometricSettingsTile(),
                      _tile(Icons.notifications_none, 'Notifications', () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const NotifPrefsSheet(),
                        );
                      }),
                      _tile(Icons.palette_outlined, 'Appearance', () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const AppearanceSheet(),
                        );
                      }),
                      if (isFan)
                        _tile(Icons.emoji_events_outlined, 'Role Profile', () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => const RoleUpgradeSheet(),
                          );
                        }),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _SectionTitle('Support'),
                GlassCard(
                  borderRadius: 14,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: [
                      _tile(Icons.help_outline, 'Help', () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Help center — sportssphere.fun')),
                        );
                      }),
                      _tile(Icons.info_outline, 'About', () {
                        showDialog(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            backgroundColor: AppColors.backgroundSecondary,
                            title: Text('SportSphere', style: GoogleFonts.outfit(fontWeight: FontWeight.w800)),
                            content: Text(
                              'The World\'s Biggest Sports Community.\nVersion 3.0 · Flutter mobile\n1:1 with the web app.',
                              style: GoogleFonts.inter(height: 1.4),
                            ),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () async {
                      await onSignOut?.call();
                      if (context.mounted) Navigator.pop(context);
                    },
                    child: Text('Sign out', style: GoogleFonts.inter(color: AppColors.destructive, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _tile(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppColors.mutedForeground),
      title: Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
      onTap: onTap,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        text.toUpperCase(),
        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: AppColors.mutedForeground),
      ),
    );
  }
}

class _BiometricSettingsTile extends StatefulWidget {
  const _BiometricSettingsTile();

  @override
  State<_BiometricSettingsTile> createState() => _BiometricSettingsTileState();
}

class _BiometricSettingsTileState extends State<_BiometricSettingsTile> {
  final _lock = BiometricLock();
  bool _enabled = false;
  bool _available = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final e = await _lock.isEnabled();
    final a = await _lock.canCheck();
    if (mounted) setState(() {
      _enabled = e;
      _available = a;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      secondary: const Icon(Icons.fingerprint, color: AppColors.mutedForeground),
      title: Text('Privacy & Security', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      subtitle: Text(
        _available ? 'Biometric lock' : 'Biometrics unavailable',
        style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground),
      ),
      value: _enabled && _available,
      activeColor: AppColors.primary,
      onChanged: !_available
          ? null
          : (v) async {
              if (v) {
                final ok = await _lock.authenticate(reason: 'Enable biometric lock');
                if (!ok) return;
              }
              await _lock.setEnabled(v);
              if (mounted) setState(() => _enabled = v);
            },
    );
  }
}
