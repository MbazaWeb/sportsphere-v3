import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/providers/app_providers.dart';
import '../../shared/models/match.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';
import '../../shared/widgets/ss_refresh.dart';
import '../../core/realtime/scores_live.dart';
import 'presentation/team_detail_sheet.dart';
import 'presentation/match_detail_sheet.dart';
import '../../../core/constants/api_config.dart';


String _resolveUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final base = ApiConfig.baseUrl;
  return url.startsWith('/') ? '\$base\$url' : '\$base/\$url';
}


/// Scores tab — live matches + standings from API

class ScoresTab extends ConsumerStatefulWidget {
  const ScoresTab({super.key});

  @override
  ConsumerState<ScoresTab> createState() => _ScoresTabState();
}

class _ScoresTabState extends ConsumerState<ScoresTab> {
  String _sub = 'live'; // live | today | upcoming | results | standings
  final _live = ScoresLiveClient();
  String _liveStatus = 'idle';
  String? _selectedLeague;
  DateTime? _selectedDate;

  static const _subs = [
    ('live', 'Live'),
    ('today', 'Today'),
    ('upcoming', 'Upcoming'),
    ('results', 'Results'),
    ('standings', 'Standings'),
  ];

  MatchesKey get _currentKey {
    final status = _mapStatus(_sub);
    final dateStr = _selectedDate?.toIso8601String().split('T').first;
    // Don't send date for 'live' — live matches are always now
    return MatchesKey(
      status: status,
      date: (status == 'live') ? null : dateStr,
    );
  }

  @override
  void initState() {
    super.initState();
    _live.connect(onUpdate: (payload) {
      // Soft refresh match lists on any live event
      ref.invalidate(matchesProvider(const MatchesKey(status: 'live')));
      ref.invalidate(matchesProvider(const MatchesKey(status: 'today')));
      if (payload['type'] == 'match_update') {
        ref.invalidate(matchesProvider(const MatchesKey()));
      }
    });
    _live.status$.listen((s) {
      if (mounted) setState(() => _liveStatus = s);
    });
  }

  @override
  void dispose() {
    _live.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _Header(
          sub: _sub,
          liveStatus: _liveStatus,
          selectedDate: _selectedDate,
          onChanged: (s) {
            setState(() {
              _sub = s;
              _selectedDate = null; // reset date filter on tab change
            });
          },
          onFilterTap: _showLeagueFilter,
          onDateSelected: (d) => setState(() => _selectedDate = d),
        ),
        Expanded(
          child: _sub == 'standings'
              ? const _StandingsView()
              : _MatchesView(key: ValueKey(_currentKey), matchesKey: _currentKey, selectedLeague: _selectedLeague),
        ),
      ],
    );
  }

  String? _mapStatus(String sub) {
    switch (sub) {
      case 'live':
        return 'live';
      case 'today':
        return 'today';
      case 'upcoming':
        return 'upcoming';
      case 'results':
        return 'results';
      default:
        return null;
    }
  }

  void _showLeagueFilter() {
    // Extract unique leagues from currently loaded matches
    final matchesAsync = ref.read(matchesProvider(_currentKey));
    final leagues = <String>{};
    matchesAsync.whenData((matches) {
      for (final m in matches) {
        if (m.league != null && m.league!.isNotEmpty) leagues.add(m.league!);
      }
    });
    if (leagues.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No leagues available to filter')),
      );
      return;
    }
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.backgroundSecondary,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Text('Filter by league', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            ),
            ListTile(
              leading: const Icon(Icons.clear_all_rounded, size: 20),
              title: Text('All leagues', style: GoogleFonts.inter(fontWeight: _selectedLeague == null ? FontWeight.w700 : FontWeight.w500)),
              trailing: _selectedLeague == null ? const Icon(Icons.check_rounded, color: AppColors.primary) : null,
              onTap: () { Navigator.pop(ctx); setState(() => _selectedLeague = null); },
            ),
            ...leagues.map((league) => ListTile(
              leading: const Icon(Icons.sports_rounded, size: 20),
              title: Text(league, style: GoogleFonts.inter(fontWeight: _selectedLeague == league ? FontWeight.w700 : FontWeight.w500)),
              trailing: _selectedLeague == league ? const Icon(Icons.check_rounded, color: AppColors.primary) : null,
              onTap: () { Navigator.pop(ctx); setState(() => _selectedLeague = league); },
            )),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.sub, required this.onChanged, this.liveStatus = 'idle', this.onFilterTap, this.selectedDate, this.onDateSelected});
  final String sub;
  final String liveStatus;
  final ValueChanged<String> onChanged;
  final VoidCallback? onFilterTap;
  final DateTime? selectedDate;
  final ValueChanged<DateTime?>? onDateSelected;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dates = List.generate(7, (i) => now.subtract(Duration(days: 3 - i)));

    return Container(
      decoration: BoxDecoration(
        color: AppColors.background.withValues(alpha: 0.88),
        border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            SizedBox(
              height: 52,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Row(
                      children: [
                        Text('Scores', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: liveStatus == 'connected'
                                ? const Color(0xFF22C55E).withValues(alpha: 0.15)
                                : Colors.white.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            liveStatus == 'connected' ? 'LIVE' : liveStatus.toUpperCase(),
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: liveStatus == 'connected' ? const Color(0xFF22C55E) : AppColors.mutedForeground,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    if (selectedDate != null)
                      GestureDetector(
                        onTap: () => onDateSelected?.call(null),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.close_rounded, size: 12, color: AppColors.primary),
                              const SizedBox(width: 4),
                              Text(
                                '${selectedDate!.day}/${selectedDate!.month}',
                                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: onFilterTap,
                      child: Icon(Icons.tune_rounded, color: AppColors.mutedForeground, size: 22),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(
              height: 42,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                itemCount: _ScoresTabState._subs.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, i) {
                  final (id, label) = _ScoresTabState._subs[i];
                  final active = sub == id;
                  return GestureDetector(
                    onTap: () => onChanged(id),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      curve: Curves.easeOutCubic,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: active ? AppColors.primary : Colors.white.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: active
                            ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.25), blurRadius: 12, offset: const Offset(0, 3))]
                            : null,
                      ),
                      child: Text(
                        label,
                        style: GoogleFonts.inter(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.15,
                          color: active ? AppColors.primaryForeground : AppColors.mutedForeground,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            if (sub != 'standings')
              SizedBox(
                height: 56,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                  itemCount: dates.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final d = dates[i];
                    final isToday = d.year == now.year && d.month == now.month && d.day == now.day;
                    final isSelected = selectedDate != null &&
                        d.year == selectedDate!.year &&
                        d.month == selectedDate!.month &&
                        d.day == selectedDate!.day;
                    final wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d.weekday - 1];
                    final isTapped = isSelected || (selectedDate == null && isToday);
                    return GestureDetector(
                      onTap: () => onDateSelected?.call(isToday ? null : d),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOutCubic,
                        width: 52,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withValues(alpha: 0.25)
                              : isTapped
                                  ? AppColors.primary.withValues(alpha: 0.15)
                                  : Colors.white.withValues(alpha: 0.03),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : isTapped
                                    ? AppColors.primary.withValues(alpha: 0.45)
                                    : Colors.white.withValues(alpha: 0.06),
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(wd, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: isSelected || isTapped ? AppColors.primary : AppColors.mutedForeground)),
                            const SizedBox(height: 2),
                            Text('${d.day}', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: isSelected || isTapped ? AppColors.primary : AppColors.foreground)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _MatchesView extends ConsumerWidget {
  const _MatchesView({required this.matchesKey, this.selectedLeague, super.key});
  final MatchesKey matchesKey;
  final String? selectedLeague;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(matchesProvider(matchesKey));

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
      error: (e, _) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Could not load matches', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            TextButton(onPressed: () => ref.invalidate(matchesProvider(matchesKey)), child: const Text('Retry')),
          ],
        ),
      ),
      data: (matches) {
        final filtered = selectedLeague != null
            ? matches.where((m) => m.league == selectedLeague).toList()
            : matches;
        if (filtered.isEmpty) {
          return SsRefreshScroll(
            onRefresh: () async {
              ref.invalidate(matchesProvider(matchesKey));
              await ref.read(matchesProvider(matchesKey).future);
            },
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.sports_soccer, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.5)),
                    const SizedBox(height: 12),
                    Text(
                      selectedLeague != null
                          ? 'No $selectedLeague matches right now'
                          : (matchesKey.status == 'live' ? 'No live matches right now' : 'No matches found'),
                      style: GoogleFonts.inter(color: AppColors.mutedForeground),
                    ),
                    const SizedBox(height: 8),
                    Text('Pull to refresh', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                  ],
                ),
              ),
            ),
          );
        }
        return SsRefresh(
          onRefresh: () async {
            ref.invalidate(matchesProvider(matchesKey));
            await ref.read(matchesProvider(matchesKey).future);
          },
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            itemCount: filtered.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) => _MatchCard(m: filtered[i]),
          ),
        );
      },
    );
  }
}

class _MatchCard extends StatelessWidget {
  const _MatchCard({required this.m});
  final MatchItem m;

  void _openDetail(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.backgroundSecondary,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => _MatchDetailSheet(m: m),
    );
  }

  void _openTeamDetail(BuildContext context, String teamName, String? badge, String? league) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => TeamDetailSheet(
        teamName: teamName,
        teamBadge: badge,
        league: league,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final score = m.isFinished || m.isLive
        ? '${m.homeScore ?? 0}  -  ${m.awayScore ?? 0}'
        : 'vs';
    final statusLabel = m.isLive
        ? (m.minute != null ? "${m.minute}'" : 'LIVE')
        : m.isFinished
            ? 'FT'
            : (m.kickoff ?? m.status).toUpperCase();

    return GlassCard(
      borderRadius: 14,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      onTap: () => _openDetail(context),
      child: Column(
        children: [
          Row(
            children: [
              if (m.league != null)
                Text(m.league!, style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground, fontWeight: FontWeight.w600)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: m.isLive
                      ? AppColors.primary.withValues(alpha: 0.15)
                      : AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  statusLabel,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: m.isLive ? AppColors.primary : AppColors.mutedForeground,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              // Home team
              Expanded(
                child: GestureDetector(
                  onTap: () => _openTeamDetail(context, m.homeTeam, m.homeBadge, m.league),
                  child: Row(
                    children: [
                      _TeamLogo(url: m.homeBadge),
                      const SizedBox(width: 8),
                      Flexible(child: Text(m.homeTeam, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13), overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  score,
                  style: GoogleFonts.outfit(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: m.isLive ? AppColors.primary : AppColors.foreground,
                  ),
                ),
              ),
              // Away team
              Expanded(
                child: GestureDetector(
                  onTap: () => _openTeamDetail(context, m.awayTeam, m.awayBadge, m.league),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Flexible(child: Text(m.awayTeam, textAlign: TextAlign.right, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13), overflow: TextOverflow.ellipsis)),
                      const SizedBox(width: 8),
                      _TeamLogo(url: m.awayBadge),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}


class _TeamLogo extends StatelessWidget {
  const _TeamLogo({this.url, this.size = 28});
  final String? url;
  final double size;

  @override
  Widget build(BuildContext context) {
    if (url != null && url!.isNotEmpty) {
      final resolved = _resolveUrl(url!);
      return ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: Image.network(
          resolved,
          width: size,
          height: size,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => _fallback(),
        ),
      );
    }
    return _fallback();
  }

  Widget _fallback() => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(6),
    ),
    child: Icon(Icons.shield_outlined, size: size * 0.6, color: AppColors.mutedForeground),
  );
}

class _StandingsView extends ConsumerWidget {
  const _StandingsView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(standingsProvider);

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
      error: (e, _) => Center(child: TextButton(onPressed: () => ref.invalidate(standingsProvider), child: const Text('Retry'))),
      data: (data) {
        final rows = data.rows;
        return SsRefresh(
          onRefresh: () async {
            ref.invalidate(standingsProvider);
            await ref.read(standingsProvider.future);
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            children: [
              Text(data.league, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              GlassCard(
                borderRadius: 14,
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Column(
                  children: [
                    _StandingsHeader(),
                    const Divider(height: 16, color: AppColors.border),
                    ...rows.map((r) => _StandingRowWidget(r: r, context: context)),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _StandingsHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final style = GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.mutedForeground);
    return Row(
      children: [
        SizedBox(width: 28, child: Text('#', style: style)),
        const Expanded(child: Text('Team', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.mutedForeground))),
        SizedBox(width: 28, child: Text('P', textAlign: TextAlign.center, style: style)),
        SizedBox(width: 28, child: Text('W', textAlign: TextAlign.center, style: style)),
        SizedBox(width: 28, child: Text('D', textAlign: TextAlign.center, style: style)),
        SizedBox(width: 28, child: Text('L', textAlign: TextAlign.center, style: style)),
        SizedBox(width: 36, child: Text('Pts', textAlign: TextAlign.center, style: style)),
      ],
    );
  }
}

class _StandingRowWidget extends StatelessWidget {
  const _StandingRowWidget({required this.r, required this.context});
  final StandingRow r;
  final BuildContext context;

  @override
  Widget build(BuildContext context) {
    final style = GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 28,
            child: Text(
              '${r.pos}',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w800,
                color: r.pos <= 3 ? AppColors.primary : AppColors.mutedForeground,
              ),
            ),
          ),
          Expanded(
            child: Row(
              children: [
                if (r.badge != null && r.badge!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Image.network(_resolveUrl(r.badge!), width: 20, height: 20, errorBuilder: (_, __, ___) => const SizedBox(width: 20)),
                  ),
                Flexible(
                  child: GestureDetector(
                    onTap: () {
                      showModalBottomSheet<void>(
                        context: this.context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => TeamDetailSheet(teamName: r.team, teamBadge: r.badge),
                      );
                    },
                    child: Text(r.team, overflow: TextOverflow.ellipsis, style: style),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 28, child: Text('${r.played}', textAlign: TextAlign.center, style: style)),
          SizedBox(width: 28, child: Text('${r.won}', textAlign: TextAlign.center, style: style)),
          SizedBox(width: 28, child: Text('${r.drawn}', textAlign: TextAlign.center, style: style)),
          SizedBox(width: 28, child: Text('${r.lost}', textAlign: TextAlign.center, style: style)),
          SizedBox(
            width: 36,
            child: Text('${r.pts}', textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primary)),
          ),
        ],
      ),
    );
  }
}

class _MatchDetailSheet extends StatelessWidget {
  const _MatchDetailSheet({required this.m});
  final MatchItem m;

  @override
  Widget build(BuildContext context) {
    final score = m.isFinished || m.isLive
        ? '${m.homeScore ?? 0}  -  ${m.awayScore ?? 0}'
        : 'vs';
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 16),
          if (m.league != null)
            Text(
              m.league!,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.mutedForeground,
              ),
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  m.homeTeam,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
              Text(
                score,
                style: GoogleFonts.outfit(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: m.isLive ? AppColors.primary : AppColors.foreground,
                ),
              ),
              Expanded(
                child: Text(
                  m.awayTeam,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: m.isLive
                  ? AppColors.primary.withValues(alpha: 0.15)
                  : AppColors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              m.isLive
                  ? (m.minute != null ? "LIVE \u00b7 ${m.minute}'" : 'LIVE')
                  : m.isFinished
                      ? 'Full time'
                      : (m.kickoff ?? m.status),
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: m.isLive ? AppColors.primary : AppColors.mutedForeground,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Align(
            alignment: Alignment.centerLeft,
            child: Text('Events', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
          ),
          const SizedBox(height: 8),
          if (m.events.isEmpty)
            Text(
              'No events yet for this match.',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground),
            )
          else
            ...m.events.map((e) {
              final icon = switch (e.type?.toLowerCase()) {
                'goal' => Icons.sports_soccer,
                'yellow' || 'yellow_card' => Icons.style,
                'red' || 'red_card' => Icons.square,
                'sub' || 'substitution' => Icons.swap_horiz,
                _ => Icons.circle,
              };
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    SizedBox(
                      width: 36,
                      child: Text(
                        e.minute != null ? "${e.minute}'" : '—',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.primary),
                      ),
                    ),
                    Icon(icon, size: 16, color: AppColors.mutedForeground),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        [e.player, e.type, e.team, e.detail].where((x) => x != null && x.toString().isNotEmpty).join(' \u00b7 '),
                        style: GoogleFonts.inter(fontSize: 13),
                      ),
                    ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
