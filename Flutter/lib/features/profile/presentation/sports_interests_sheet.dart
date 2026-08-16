import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';

const _kInterests = [
  'Transfers', 'Statistics', 'Fantasy', 'Highlights', 'Live Scores',
  'Sports Business', 'Coaching', 'Fitness', 'Betting News', 'Analysis',
  'Youth Academy', "Women's Sports", 'Local Football', 'International Football',
];

/// Sports & Interests — PUT sportsFollowing + interests (web EditProfile sports tab).
class SportsInterestsSheet extends ConsumerStatefulWidget {
  const SportsInterestsSheet({super.key});

  @override
  ConsumerState<SportsInterestsSheet> createState() => _SportsInterestsSheetState();
}

class _SportsInterestsSheetState extends ConsumerState<SportsInterestsSheet> {
  List<String> _sports = [];
  List<String> _availableSports = [];
  Set<String> _selectedSports = {};
  Set<String> _selectedInterests = {};
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final user = ref.read(authProvider).user;
    _selectedSports = {...(user?.sportsFollowing ?? const [])};
    _selectedInterests = {...(user?.interests ?? const [])};
    try {
      final data = await ref.read(apiClientProvider).getJson('/sports');
      final list = data is List ? data : [];
      _availableSports = list
          .map((e) => (e is Map ? e['name']?.toString() : null) ?? '')
          .where((s) => s.isNotEmpty)
          .toList();
      if (_availableSports.isEmpty) {
        _availableSports = ['Football', 'Basketball', 'Tennis', 'Athletics', 'Rugby', 'Cricket'];
      }
    } catch (_) {
      _availableSports = ['Football', 'Basketball', 'Tennis', 'Athletics', 'Rugby', 'Cricket'];
    }
    if (!mounted) return;
    setState(() => _loading = false);
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final updated = await ref.read(profileApiProvider).updateProfile(
            sportsFollowing: _selectedSports.toList()..sort(),
            interests: _selectedInterests.toList()..sort(),
          );
      await ref.read(authProvider.notifier).applyUser(updated);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sports & interests saved')));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.9,
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
                  child: Text('Sports & Interests', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17)),
                ),
                TextButton(
                  onPressed: _saving || _loading ? null : _save,
                  child: Text('Save', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppColors.primary)),
                ),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(_error!, style: GoogleFonts.inter(color: AppColors.destructive, fontSize: 13)),
            ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text('SPORTS YOU FOLLOW', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: AppColors.primary)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _availableSports.map((s) {
                          final on = _selectedSports.contains(s);
                          return FilterChip(
                            label: Text(s),
                            selected: on,
                            onSelected: (v) => setState(() {
                              if (v) {
                                _selectedSports.add(s);
                              } else {
                                _selectedSports.remove(s);
                              }
                            }),
                            selectedColor: AppColors.primary.withValues(alpha: 0.25),
                            checkmarkColor: AppColors.primary,
                            labelStyle: GoogleFonts.inter(
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                              color: on ? AppColors.primary : AppColors.mutedForeground,
                            ),
                            side: BorderSide(color: on ? AppColors.primary : AppColors.border),
                            backgroundColor: AppColors.surface,
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 24),
                      Text('INTERESTS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: AppColors.primary)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _kInterests.map((s) {
                          final on = _selectedInterests.contains(s);
                          return FilterChip(
                            label: Text(s),
                            selected: on,
                            onSelected: (v) => setState(() {
                              if (v) {
                                _selectedInterests.add(s);
                              } else {
                                _selectedInterests.remove(s);
                              }
                            }),
                            selectedColor: const Color(0xFFA855F7).withValues(alpha: 0.2),
                            checkmarkColor: const Color(0xFFA855F7),
                            labelStyle: GoogleFonts.inter(
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                              color: on ? const Color(0xFFA855F7) : AppColors.mutedForeground,
                            ),
                            side: BorderSide(color: on ? const Color(0xFFA855F7) : AppColors.border),
                            backgroundColor: AppColors.surface,
                          );
                        }).toList(),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
