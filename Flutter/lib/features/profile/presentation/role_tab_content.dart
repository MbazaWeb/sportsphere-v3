import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../domain/profile_role_registry.dart';

/// Loads /api/profile-data for player (and similar) role tabs.
class RoleTabContent extends ConsumerStatefulWidget {
  const RoleTabContent({
    super.key,
    required this.tabId,
    required this.role,
    this.profileKey,
  });

  final String tabId;
  final String role;
  final String? profileKey;

  @override
  ConsumerState<RoleTabContent> createState() => _RoleTabContentState();
}

class _RoleTabContentState extends ConsumerState<RoleTabContent> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant RoleTabContent oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.tabId != widget.tabId || oldWidget.role != widget.role) {
      _load();
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final type = widget.role.toLowerCase();
      // API currently seeds player keys e.g. rashford; use role as type
      final data = await ref.read(profileDataApiProvider).fetch(
            type: type,
            key: widget.profileKey,
          );
      if (!mounted) return;
      setState(() {
        _data = data;
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
    if (_loading) {
      return const Center(child: Padding(
        padding: EdgeInsets.all(32),
        child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
      ));
    }
    if (_error != null) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GlassCard(
            borderRadius: 16,
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 13)),
                TextButton(onPressed: _load, child: const Text('Retry')),
              ],
            ),
          ),
        ],
      );
    }

    final d = _data ?? {};
    // Unwrap common shapes
    final payload = d['data'] is Map
        ? Map<String, dynamic>.from(d['data'] as Map)
        : d;

    switch (widget.tabId) {
      case 'career':
        return _CareerView(payload);
      case 'statistics':
        return _StatsView(payload);
      case 'achievements':
        return _HonoursView(payload);
      case 'overview':
        return _OverviewExtra(payload);
      default:
        return _KeyValueList(
          title: widget.tabId,
          map: _flatten(payload),
        );
    }
  }

  Map<String, String> _flatten(Map<String, dynamic> m, [String prefix = '']) {
    final out = <String, String>{};
    m.forEach((k, v) {
      final key = prefix.isEmpty ? k : '$prefix.$k';
      if (v is Map) {
        out.addAll(_flatten(Map<String, dynamic>.from(v), key));
      } else if (v is List) {
        out[key] = v.length.toString();
      } else if (v != null) {
        out[key] = v.toString();
      }
    });
    return out;
  }
}

class _CareerView extends StatelessWidget {
  const _CareerView(this.data);
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final timeline = data['careerTimeline'] as List? ?? [];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        if (timeline.isEmpty)
          GlassCard(
            borderRadius: 16,
            padding: const EdgeInsets.all(20),
            child: Text('No career timeline yet', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
          )
        else
          ...timeline.map((e) {
            final row = Map<String, dynamic>.from(e as Map);
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GlassCard(
                borderRadius: 14,
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    SizedBox(
                      width: 72,
                      child: Text(row['season']?.toString() ?? '', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(row['team']?.toString() ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                          Text(
                            'Apps ${row['apps'] ?? '—'} · G ${row['goals'] ?? '—'} · A ${row['assists'] ?? '—'}',
                            style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}

class _StatsView extends StatelessWidget {
  const _StatsView(this.data);
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final season = data['seasonStats'] is Map ? Map<String, dynamic>.from(data['seasonStats'] as Map) : <String, dynamic>{};
    final career = data['careerStats'] is Map ? Map<String, dynamic>.from(data['careerStats'] as Map) : <String, dynamic>{};
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        if (season.isNotEmpty) ...[
          Text('Season ${season['season'] ?? ''}', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 8),
          _grid(season),
          const SizedBox(height: 16),
        ],
        if (career.isNotEmpty) ...[
          Text('Career', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 8),
          _grid(career),
        ],
        if (season.isEmpty && career.isEmpty)
          GlassCard(
            borderRadius: 16,
            padding: const EdgeInsets.all(20),
            child: Text('No statistics payload', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
          ),
      ],
    );
  }

  Widget _grid(Map<String, dynamic> m) {
    final entries = m.entries.where((e) => e.key != 'season').toList();
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: entries.map((e) {
        return SizedBox(
          width: 100,
          child: GlassCard(
            borderRadius: 12,
            padding: const EdgeInsets.all(10),
            child: Column(
              children: [
                Text('${e.value}', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.primary)),
                Text(e.key, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _HonoursView extends StatelessWidget {
  const _HonoursView(this.data);
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final list = data['honours'] as List? ?? [];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: list.isEmpty
          ? [
              GlassCard(
                borderRadius: 16,
                padding: const EdgeInsets.all(20),
                child: Text('No honours listed', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
              ),
            ]
          : list.map((e) {
              final h = Map<String, dynamic>.from(e as Map);
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: GlassCard(
                  borderRadius: 12,
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      const Icon(Icons.emoji_events, color: AppColors.primary, size: 22),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${h['title'] ?? ''} · ${h['year'] ?? ''} (${h['team'] ?? ''})',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
    );
  }
}

class _OverviewExtra extends StatelessWidget {
  const _OverviewExtra(this.data);
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final skills = (data['skills'] as List?)?.map((e) => e.toString()).toList() ?? [];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        if (data['position'] != null)
          GlassCard(
            borderRadius: 14,
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${data['position'] ?? ''} · #${data['number'] ?? '—'}', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 6),
                Text(
                  '${data['currentTeam'] ?? ''} · ${data['nationality'] ?? ''}',
                  style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 13),
                ),
                if (data['marketValue'] != null)
                  Text('Value ${data['marketValue']}', style: GoogleFonts.inter(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        if (skills.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text('Skills', style: GoogleFonts.outfit(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: skills
                .map((s) => Chip(
                      label: Text(s, style: GoogleFonts.inter(fontSize: 11)),
                      backgroundColor: AppColors.surface,
                      side: const BorderSide(color: AppColors.border),
                    ))
                .toList(),
          ),
        ],
      ],
    );
  }
}

class _KeyValueList extends StatelessWidget {
  const _KeyValueList({required this.title, required this.map});
  final String title;
  final Map<String, String> map;

  @override
  Widget build(BuildContext context) {
    final entries = map.entries.take(40).toList();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 8),
        if (entries.isEmpty)
          Text('No data for this section yet', style: GoogleFonts.inter(color: AppColors.mutedForeground))
        else
          ...entries.map(
            (e) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 2, child: Text(e.key, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground))),
                  Expanded(flex: 3, child: Text(e.value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600))),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
