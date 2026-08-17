import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/constants/api_config.dart';
import '../../../shared/models/match.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';

String _resolveUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final base = ApiConfig.baseUrl;
  return url.startsWith('/') ? '$base$url' : '$base/$url';
}

// ─── Match Detail Bottom Sheet ─────────────────────────────────────────────────
// Shows: score header, events timeline, lineups, stats
class MatchDetailSheet extends ConsumerStatefulWidget {
  const MatchDetailSheet({super.key, required this.match});
  final MatchItem match;

  static Future<void> open(BuildContext context, MatchItem match) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MatchDetailSheet(match: match),
    );
  }

  @override
  ConsumerState<MatchDetailSheet> createState() => _MatchDetailSheetState();
}

class _MatchDetailSheetState extends ConsumerState<MatchDetailSheet>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Map<String, dynamic>? _detail;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _loadDetail();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _loadDetail() async {
    try {
      final data = await ref.read(apiClientProvider)
          .getJson('/matches/${widget.match.id}');
      if (!mounted) return;
      setState(() { _detail = data is Map<String, dynamic> ? data : {}; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final m = widget.match;
    final score = (m.isFinished || m.isLive)
        ? '${m.homeScore ?? 0}  –  ${m.awayScore ?? 0}'
        : 'vs';
    final statusLabel = m.isLive
        ? (m.minute != null ? "${m.minute}'" : 'LIVE')
        : m.isFinished ? 'FT' : m.status.toUpperCase();

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, ctrl) => Container(
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          children: [
            // Handle
            const SizedBox(height: 10),
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)))),
            const SizedBox(height: 12),

            // League header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Icon(Icons.emoji_events_outlined, size: 14, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text(m.league ?? 'Match',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.mutedForeground)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: m.isLive ? AppColors.primary.withValues(alpha: 0.15) : AppColors.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: m.isLive ? AppColors.primary.withValues(alpha: 0.4) : AppColors.border),
                    ),
                    child: Text(statusLabel,
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800,
                            color: m.isLive ? AppColors.primary : AppColors.mutedForeground)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Score row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Expanded(child: _TeamCol(name: m.homeTeam, badgeUrl: m.homeBadge)),
                  Text(score,
                      style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w900,
                          color: m.isLive ? AppColors.primary : AppColors.foreground, letterSpacing: -1)),
                  Expanded(child: _TeamCol(name: m.awayTeam, badgeUrl: m.awayBadge, right: true)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Tab bar
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
              ),
              child: TabBar(
                controller: _tabs,
                indicator: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: AppColors.primaryForeground,
                unselectedLabelColor: AppColors.mutedForeground,
                labelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                tabs: const [Tab(text: 'Events'), Tab(text: 'Lineups'), Tab(text: 'Stats')],
              ),
            ),
            const SizedBox(height: 8),

            // Tab content
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                  : TabBarView(
                      controller: _tabs,
                      children: [
                        _EventsTab(events: m.events, detail: _detail),
                        _LineupsTab(detail: _detail, homeTeam: m.homeTeam, awayTeam: m.awayTeam),
                        _StatsTab(detail: _detail, homeTeam: m.homeTeam, awayTeam: m.awayTeam),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Team column in score header ──────────────────────────────────────────────
class _TeamCol extends StatelessWidget {
  const _TeamCol({required this.name, this.badgeUrl, this.right = false});
  final String name;
  final String? badgeUrl;
  final bool right;

  @override
  Widget build(BuildContext context) {
    final badge = badgeUrl != null && badgeUrl!.isNotEmpty
        ? ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(_resolveUrl(badgeUrl!), width: 52, height: 52, fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Icon(Icons.shield_outlined, size: 40, color: AppColors.mutedForeground)),
          )
        : const Icon(Icons.shield_outlined, size: 48, color: AppColors.mutedForeground);

    return Column(
      children: right
          ? [
              Text(name, textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 8),
              badge,
            ]
          : [
              badge,
              const SizedBox(height: 8),
              Text(name, textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
    );
  }
}

// ─── Events tab ───────────────────────────────────────────────────────────────
class _EventsTab extends StatelessWidget {
  const _EventsTab({required this.events, this.detail});
  final List<MatchEvent> events;
  final Map<String, dynamic>? detail;

  @override
  Widget build(BuildContext context) {
    final allEvents = [...events];
    // Also pull from detail if available
    if (detail?['events'] is List) {
      final extra = (detail!['events'] as List)
          .whereType<Map>()
          .map((e) => MatchEvent.fromJson(Map<String, dynamic>.from(e)))
          .where((e) => !allEvents.any((ex) => ex.minute == e.minute && ex.player == e.player))
          .toList();
      allEvents.addAll(extra);
    }
    allEvents.sort((a, b) => (a.minute ?? 0).compareTo(b.minute ?? 0));

    if (allEvents.isEmpty) {
      return Center(child: Text('No events recorded', style: GoogleFonts.inter(color: AppColors.mutedForeground)));
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
      itemCount: allEvents.length,
      itemBuilder: (context, i) => _EventRow(event: allEvents[i]),
    );
  }
}

class _EventRow extends StatelessWidget {
  const _EventRow({required this.event});
  final MatchEvent event;

  @override
  Widget build(BuildContext context) {
    final type = event.type ?? 'event';
    final icon = _iconFor(type);
    final color = _colorFor(type);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 36,
              child: Text("${event.minute ?? ''}′",
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary), textAlign: TextAlign.right)),
          const SizedBox(width: 10),
          Container(width: 30, height: 30,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(icon, size: 16, color: color)),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(event.player ?? event.detail ?? type,
                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
            if (event.team != null)
              Text(event.team!, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
          ])),
        ],
      ),
    );
  }

  IconData _iconFor(String type) {
    switch (type.toLowerCase()) {
      case 'goal': case 'match_goal': return Icons.sports_soccer;
      case 'yellow_card': return Icons.square_rounded;
      case 'red_card': return Icons.square_rounded;
      case 'substitution': return Icons.swap_horiz;
      case 'penalty': return Icons.sports_soccer;
      case 'var': return Icons.monitor;
      default: return Icons.circle;
    }
  }

  Color _colorFor(String type) {
    switch (type.toLowerCase()) {
      case 'goal': case 'match_goal': return AppColors.primary;
      case 'yellow_card': return const Color(0xFFEAB308);
      case 'red_card': return const Color(0xFFEF4444);
      case 'substitution': return const Color(0xFF10B981);
      default: return AppColors.mutedForeground;
    }
  }
}

// ─── Lineups tab ──────────────────────────────────────────────────────────────
class _LineupsTab extends StatelessWidget {
  const _LineupsTab({this.detail, required this.homeTeam, required this.awayTeam});
  final Map<String, dynamic>? detail;
  final String homeTeam, awayTeam;

  @override
  Widget build(BuildContext context) {
    final lineups = detail?['lineups'];
    if (lineups == null) {
      return Center(child: Text('Lineups not available', style: GoogleFonts.inter(color: AppColors.mutedForeground)));
    }

    final home = lineups['home'] is List ? (lineups['home'] as List).cast<Map>() : [];
    final away = lineups['away'] is List ? (lineups['away'] as List).cast<Map>() : [];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
      children: [
        Row(children: [
          Expanded(child: Text(homeTeam, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13))),
          Expanded(child: Text(awayTeam, textAlign: TextAlign.right,
              style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13))),
        ]),
        const SizedBox(height: 10),
        ...List.generate(
          [home.length, away.length].reduce((a, b) => a > b ? a : b),
          (i) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Expanded(child: i < home.length ? _PlayerRow(p: Map<String, dynamic>.from(home[i])) : const SizedBox()),
                const SizedBox(width: 8),
                Expanded(child: i < away.length ? _PlayerRow(p: Map<String, dynamic>.from(away[i]), right: true) : const SizedBox()),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _PlayerRow extends StatelessWidget {
  const _PlayerRow({required this.p, this.right = false});
  final Map<String, dynamic> p;
  final bool right;

  @override
  Widget build(BuildContext context) {
    final num = p['number']?.toString() ?? '';
    final name = p['name']?.toString() ?? '';
    final pos = p['position']?.toString() ?? '';
    return Row(
      mainAxisAlignment: right ? MainAxisAlignment.end : MainAxisAlignment.start,
      children: right
          ? [
              Flexible(child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(name, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                if (pos.isNotEmpty) Text(pos, style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground)),
              ])),
              const SizedBox(width: 6),
              Container(width: 22, height: 22, decoration: BoxDecoration(color: AppColors.surface, shape: BoxShape.circle),
                  child: Center(child: Text(num, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800)))),
            ]
          : [
              Container(width: 22, height: 22, decoration: BoxDecoration(color: AppColors.surface, shape: BoxShape.circle),
                  child: Center(child: Text(num, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800)))),
              const SizedBox(width: 6),
              Flexible(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                if (pos.isNotEmpty) Text(pos, style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground)),
              ])),
            ],
    );
  }
}

// ─── Stats tab ────────────────────────────────────────────────────────────────
class _StatsTab extends StatelessWidget {
  const _StatsTab({this.detail, required this.homeTeam, required this.awayTeam});
  final Map<String, dynamic>? detail;
  final String homeTeam, awayTeam;

  @override
  Widget build(BuildContext context) {
    final stats = detail?['stats'];
    if (stats == null || stats is! List || (stats as List).isEmpty) {
      return Center(child: Text('Stats not available', style: GoogleFonts.inter(color: AppColors.mutedForeground)));
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
      children: [
        Row(children: [
          Expanded(child: Text(homeTeam, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12))),
          const SizedBox(width: 80),
          Expanded(child: Text(awayTeam, textAlign: TextAlign.right,
              style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12))),
        ]),
        const SizedBox(height: 12),
        ...(stats as List).map((s) {
          if (s is! Map) return const SizedBox.shrink();
          final stat = Map<String, dynamic>.from(s);
          final label = stat['label']?.toString() ?? stat['type']?.toString() ?? '';
          final home = double.tryParse(stat['home']?.toString() ?? '0') ?? 0;
          final away = double.tryParse(stat['away']?.toString() ?? '0') ?? 0;
          final total = home + away;
          final homePct = total == 0 ? 0.5 : home / total;
          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Column(children: [
              Row(children: [
                Text('${stat['home'] ?? 0}',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.primary)),
                Expanded(child: Text(label, textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground))),
                Text('${stat['away'] ?? 0}',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: const Color(0xFF3B82F6))),
              ]),
              const SizedBox(height: 6),
              Row(children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(
                      value: homePct,
                      backgroundColor: const Color(0xFF3B82F6).withValues(alpha: 0.3),
                      valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                      minHeight: 5,
                    ),
                  ),
                ),
              ]),
            ]),
          );
        }),
      ],
    );
  }
}
