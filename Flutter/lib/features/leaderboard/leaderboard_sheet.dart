import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/network/api_client.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';

/// Full rankings sheet — GET /api/leaderboard
class LeaderboardSheet extends ConsumerStatefulWidget {
  const LeaderboardSheet({super.key});

  @override
  ConsumerState<LeaderboardSheet> createState() => _LeaderboardSheetState();
}

class _LeaderboardSheetState extends ConsumerState<LeaderboardSheet> {
  String _dimension = 'overall';
  String _role = 'all';
  List<Map<String, dynamic>> _entries = [];
  bool _loading = true;
  String? _error;

  static const _dims = [
    ('overall', 'Overall'),
    ('form', 'Form'),
    ('improvement', 'Improve'),
    ('consistency', 'Steady'),
  ];
  static const _roles = [
    ('all', 'All'),
    ('player', 'Players'),
    ('coach', 'Coaches'),
    ('team', 'Teams'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final client = ref.read(apiClientProvider);
      final qs = 'dimension=$_dimension&role=$_role&limit=25';
      final data = await client.getJson('/leaderboard?$qs');
      final list = data is List
          ? data
          : (data is Map && data['data'] is List)
              ? data['data'] as List
              : [];
      if (!mounted) return;
      setState(() {
        _entries = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
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
            padding: const EdgeInsets.fromLTRB(16, 14, 8, 8),
            child: Row(
              children: [
                Text('Leaderboard', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800)),
                const Spacer(),
                IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh_rounded)),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
              ],
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _dims.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (context, i) {
                final (id, label) = _dims[i];
                final active = _dimension == id;
                return GestureDetector(
                  onTap: () {
                    setState(() => _dimension = id);
                    _load();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: active ? AppColors.primary : Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: active ? AppColors.primaryForeground : AppColors.mutedForeground,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _roles.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (context, i) {
                final (id, label) = _roles[i];
                final active = _role == id;
                return GestureDetector(
                  onTap: () {
                    setState(() => _role = id);
                    _load();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: active ? AppColors.primary : AppColors.border),
                      color: active ? AppColors.primary.withValues(alpha: 0.12) : Colors.transparent,
                    ),
                    child: Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: active ? AppColors.primary : AppColors.mutedForeground,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                        ),
                      )
                    : _entries.isEmpty
                        ? Center(child: Text('No rankings yet', style: GoogleFonts.inter(color: AppColors.mutedForeground)))
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                            itemCount: _entries.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (context, i) {
                              final e = _entries[i];
                              final rank = (e['rank'] as num?)?.toInt() ?? (i + 1);
                              final name = e['name']?.toString() ?? '—';
                              final handle = e['handle']?.toString() ?? '';
                              final points = (e['points'] as num?)?.toDouble() ??
                                  (e['performanceScore'] as num?)?.toDouble() ??
                                  0;
                              final tier = e['tier']?.toString() ?? '';
                              final avatar = e['avatarUrl']?.toString();
                              final gold = rank <= 3;
                              return GlassCard(
                                borderRadius: 14,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                glow: rank == 1,
                                child: Row(
                                  children: [
                                    SizedBox(
                                      width: 28,
                                      child: Text(
                                        '#$rank',
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14,
                                          color: gold ? AppColors.primary : AppColors.mutedForeground,
                                        ),
                                      ),
                                    ),
                                    CircleAvatar(
                                      radius: 18,
                                      backgroundColor: AppColors.surfaceElevated,
                                      backgroundImage: avatar != null && avatar.isNotEmpty ? NetworkImage(avatar) : null,
                                      child: avatar == null || avatar.isEmpty
                                          ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: GoogleFonts.inter(fontWeight: FontWeight.w700))
                                          : null,
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                                          Text(
                                            [
                                              if (handle.isNotEmpty) (handle.startsWith('@') ? handle : '@$handle'),
                                              if (tier.isNotEmpty) tier,
                                            ].join(' · '),
                                            style: GoogleFonts.inter(fontSize: 11.5, color: AppColors.mutedForeground),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      points.toStringAsFixed(points == points.roundToDouble() ? 0 : 1),
                                      style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.primary),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
