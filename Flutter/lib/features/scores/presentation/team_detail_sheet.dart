import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/match.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../../../core/constants/api_config.dart';


String _resolveUrl(String url) => ApiConfig.resolveUrl(url);


class TeamDetailSheet extends ConsumerStatefulWidget {
  const TeamDetailSheet({
    super.key,
    required this.teamName,
    this.teamBadge,
    this.teamId,
    this.league,
  });
  final String teamName;
  final String? teamBadge;
  final String? teamId;
  final String? league;

  @override
  ConsumerState<TeamDetailSheet> createState() => _TeamDetailSheetState();
}

class _TeamDetailSheetState extends ConsumerState<TeamDetailSheet>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;
  List<MatchItem> _teamMatches = [];
  List<StandingRow> _nearbyRows = [];
  bool _loading = true;
  String? _error;
  int _played = 0, _won = 0, _drawn = 0;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _loadAll();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ref.read(apiClientProvider);
      final results = await Future.wait([
        api.getJson('/matches?status=live'),
        api.getJson('/matches?status=today'),
        api.getJson('/matches?status=upcoming'),
        api.getJson('/matches?status=finished'),
        api.getJson('/standings'),
      ]);
      final allMatches = <MatchItem>[
        for (int i = 0; i < 4; i++)
          if (results[i] is List)
            for (final j in results[i] as List)
              if (j is Map<String, dynamic>) MatchItem.fromJson(j),
      ];
      final tn = widget.teamName.toLowerCase();
      _teamMatches = allMatches.where(
        (m) => m.homeTeam.toLowerCase() == tn || m.awayTeam.toLowerCase() == tn,
      ).toList();
      int played = 0, won = 0, drawn = 0;
      for (final m in _teamMatches) {
        if (!m.isFinished) continue;
        played++;
        final isHome = m.homeTeam.toLowerCase() == tn;
        final mine = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0;
        final theirs = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0;
        if (mine > theirs) won++;
        else if (mine == theirs) drawn++;
      }
      _played = played; _won = won; _drawn = drawn;
      final allRows = <StandingRow>[
        if (results[4] is List)
          for (final j in results[4] as List)
            if (j is Map<String, dynamic>) StandingRow.fromJson(j),
      ];
      final idx = allRows.indexWhere((r) => r.team.toLowerCase() == tn);
      if (idx >= 0) {
        final s = (idx - 3).clamp(0, allRows.length);
        final e = (idx + 4).clamp(0, allRows.length);
        _nearbyRows = allRows.sublist(s, e);
      } else {
        _nearbyRows = [];
      }
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) setState(() { _loading = false; _error = e.toString(); });
    }
  }

  String _relTime(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    try {
      final dt = DateTime.parse(iso).toLocal();
      final d = DateTime.now().difference(dt);
      if (d.inMinutes < 1) return 'Now';
      if (d.inMinutes < 60) return '${d.inMinutes}m ago';
      if (d.inHours < 24) return '${d.inHours}h ago';
      if (d.inDays < 7) return '${d.inDays}d ago';
      return '${dt.day}/${dt.month}';
    } catch (_) { return ''; }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.92,
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(children: [
        const SizedBox(height: 10),
        Center(child: Container(width: 40, height: 4,
          decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)))),
        _header(),
        _statsRow(),
        _tabBar(),
        Expanded(child: _content()),
      ]),
    );
  }

  Widget _header() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(children: [
        GestureDetector(onTap: () => Navigator.of(context).pop(),
          child: Icon(Icons.arrow_back_rounded, color: AppColors.mutedForeground, size: 22)),
        const SizedBox(width: 14),
        CircleAvatar(radius: 22, backgroundColor: AppColors.surface,
          backgroundImage: (widget.teamBadge != null && widget.teamBadge!.isNotEmpty)
              ? NetworkImage(_resolveUrl(widget.teamBadge!)) : null,
          child: (widget.teamBadge == null || widget.teamBadge!.isEmpty)
              ? Text(widget.teamName.isNotEmpty ? widget.teamName[0].toUpperCase() : '?',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20, color: AppColors.primary))
              : null),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(widget.teamName, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20, color: AppColors.foreground),
              maxLines: 1, overflow: TextOverflow.ellipsis),
          if (widget.league != null && widget.league!.isNotEmpty)
            Text(widget.league!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground, fontWeight: FontWeight.w500),
                maxLines: 1, overflow: TextOverflow.ellipsis),
        ])),
      ]),
    );
  }

  Widget _statsRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(children: [
        _statChip('Played', '$_played', AppColors.foreground),
        const SizedBox(width: 10),
        _statChip('Won', '$_won', const Color(0xFF22C55E)),
        const SizedBox(width: 10),
        _statChip('Drawn', '$_drawn', AppColors.mutedForeground),
      ]),
    );
  }

  Widget _statChip(String label, String value, Color valueColor) {
    return Expanded(child: GlassCard(borderRadius: 12,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8), enableHover: false,
      child: Column(children: [
        Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20, color: valueColor)),
        const SizedBox(height: 2),
        Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.mutedForeground)),
      ])));
  }

  Widget _tabBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
      child: Container(
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
        child: TabBar(
          controller: _tabCtrl,
          indicatorSize: TabBarIndicatorSize.tab,
          indicator: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
          dividerColor: Colors.transparent,
          labelColor: AppColors.primaryForeground,
          unselectedLabelColor: AppColors.mutedForeground,
          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
          padding: const EdgeInsets.all(3),
          tabs: const ['Matches', 'Standings', 'Info'].map((t) => Tab(text: t)).toList(),
        ),
      ),
    );
  }

  Widget _content() {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2));
    if (_error != null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text('Something went wrong', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.mutedForeground)),
      const SizedBox(height: 4),
      Padding(padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Text(_error!, style: GoogleFonts.inter(fontSize: 12,
          color: AppColors.mutedForeground.withValues(alpha: 0.6)), textAlign: TextAlign.center)),
      const SizedBox(height: 12),
      TextButton(onPressed: _loadAll,
        child: Text('Retry', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.primary))),
    ]));
    return TabBarView(controller: _tabCtrl, children: [
      _matchesTab(),
      _standingsTab(),
      _infoTab(),
    ]);
  }

  // ── Matches ─────────────────────────────────────────────────────

  Widget _matchesTab() {
    if (_teamMatches.isEmpty) return RefreshIndicator(color: AppColors.primary, onRefresh: _loadAll,
      child: CustomScrollView(physics: const AlwaysScrollableScrollPhysics(), slivers: [
        SliverFillRemaining(hasScrollBody: false, child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.sports_soccer_rounded, size: 44, color: AppColors.mutedForeground.withValues(alpha: 0.4)),
          const SizedBox(height: 12),
          Text('No matches found for this team', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
        ]))),
      ]));
    return RefreshIndicator(color: AppColors.primary, onRefresh: _loadAll,
      child: ListView.separated(physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        itemCount: _teamMatches.length, separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) => _matchCard(_teamMatches[i])));
  }

  Widget _matchCard(MatchItem m) {
    final tn = widget.teamName.toLowerCase();
    final isHome = m.homeTeam.toLowerCase() == tn;
    final opponent = isHome ? m.awayTeam : m.homeTeam;
    final oppBadge = isHome ? m.awayBadge : m.homeBadge;
    final mine = isHome ? m.homeScore : m.awayScore;
    final theirs = isHome ? m.awayScore : m.homeScore;
    final scoreText = (m.isLive || m.isFinished) ? '${mine ?? 0} - ${theirs ?? 0}' : 'vs';
    final isWin = m.isFinished && mine != null && theirs != null && mine > theirs;
    final isLoss = m.isFinished && mine != null && theirs != null && mine < theirs;
    return GlassCard(borderRadius: 14, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      borderColor: isWin ? const Color(0xFF22C55E).withValues(alpha: 0.3)
          : isLoss ? AppColors.destructive.withValues(alpha: 0.3) : null,
      child: Row(children: [
        if (oppBadge != null && oppBadge.isNotEmpty)
          ClipRRect(borderRadius: BorderRadius.circular(6),
            child: Image.network(_resolveUrl(oppBadge), width: 28, height: 28,
              errorBuilder: (_, __, ___) => const SizedBox(width: 28, height: 28)))
        else
          Container(width: 28, height: 28, alignment: Alignment.center,
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(6)),
            child: Text(opponent.isNotEmpty ? opponent[0].toUpperCase() : '?',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.mutedForeground))),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(opponent, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
          if (m.league != null) Text(m.league!, style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground)),
        ])),
        Text(scoreText, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18,
          color: m.isLive ? AppColors.primary : AppColors.foreground)),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          _statusBadge(m),
          const SizedBox(height: 4),
          Text(_relTime(m.kickoff), style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground)),
        ]),
      ]));
  }

  Widget _statusBadge(MatchItem m) {
    final (label, bg, fg) = m.isLive
        ? (m.minute != null ? "${m.minute}'" : 'LIVE', AppColors.primary.withValues(alpha: 0.15), AppColors.primary)
        : m.isFinished
            ? ('FT', AppColors.surface, AppColors.mutedForeground)
            : ((m.kickoff ?? m.status).toUpperCase(), AppColors.primary.withValues(alpha: 0.08), AppColors.primary);
    return Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: fg)));
  }

  // ── Standings ───────────────────────────────────────────────────

  Widget _standingsTab() {
    if (_nearbyRows.isEmpty) return RefreshIndicator(color: AppColors.primary, onRefresh: _loadAll,
      child: CustomScrollView(physics: const AlwaysScrollableScrollPhysics(), slivers: [
        SliverFillRemaining(hasScrollBody: false, child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.emoji_events_rounded, size: 44, color: AppColors.mutedForeground.withValues(alpha: 0.4)),
          const SizedBox(height: 12),
          Text('No standings data available', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
        ]))),
      ]));
    return RefreshIndicator(color: AppColors.primary, onRefresh: _loadAll,
      child: SingleChildScrollView(physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        child: GlassCard(borderRadius: 14, padding: const EdgeInsets.all(12),
          child: Column(children: [
            _stdHeader(),
            const Divider(height: 16, color: AppColors.border),
            ..._nearbyRows.map((r) => _stdRow(r)),
          ]))));
  }

  Widget _stdHeader() {
    final s = GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.mutedForeground);
    return Row(children: [
      SizedBox(width: 28, child: Text('#', style: s)),
      const Expanded(child: Text('Team', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.mutedForeground))),
      SizedBox(width: 28, child: Text('P', textAlign: TextAlign.center, style: s)),
      SizedBox(width: 28, child: Text('W', textAlign: TextAlign.center, style: s)),
      SizedBox(width: 28, child: Text('D', textAlign: TextAlign.center, style: s)),
      SizedBox(width: 28, child: Text('L', textAlign: TextAlign.center, style: s)),
      SizedBox(width: 36, child: Text('Pts', textAlign: TextAlign.center, style: s)),
    ]);
  }

  Widget _stdRow(StandingRow r) {
    final tn = widget.teamName.toLowerCase();
    final isThis = r.team.toLowerCase() == tn;
    final st = GoogleFonts.inter(fontSize: 12,
      fontWeight: isThis ? FontWeight.w800 : FontWeight.w600,
      color: isThis ? AppColors.foreground : AppColors.mutedForeground);
    return Container(margin: const EdgeInsets.symmetric(vertical: 3),
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
      decoration: isThis ? BoxDecoration(color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.primary.withValues(alpha: 0.2))) : null,
      child: Row(children: [
        SizedBox(width: 28, child: Text('${r.pos}', style: GoogleFonts.inter(
          fontWeight: FontWeight.w800, color: r.pos <= 3 ? AppColors.primary : AppColors.mutedForeground))),
        Expanded(child: Row(children: [
          if (r.badge != null && r.badge!.isNotEmpty)
            Padding(padding: const EdgeInsets.only(right: 8),
              child: Image.network(_resolveUrl(r.badge!), width: 20, height: 20,
                errorBuilder: (_, __, ___) => const SizedBox(width: 20))),
          Flexible(child: Text(r.team, overflow: TextOverflow.ellipsis, style: st)),
        ])),
        SizedBox(width: 28, child: Text('${r.played}', textAlign: TextAlign.center, style: st)),
        SizedBox(width: 28, child: Text('${r.won}', textAlign: TextAlign.center, style: st)),
        SizedBox(width: 28, child: Text('${r.drawn}', textAlign: TextAlign.center, style: st)),
        SizedBox(width: 28, child: Text('${r.lost}', textAlign: TextAlign.center, style: st)),
        SizedBox(width: 36, child: Text('${r.pts}', textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primary))),
      ]));
  }

  // ── Info ─────────────────────────────────────────────────────────

  Widget _infoTab() {
    return RefreshIndicator(color: AppColors.primary, onRefresh: _loadAll,
      child: SingleChildScrollView(physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _infoRow(Icons.shield_rounded, 'Team', widget.teamName), const SizedBox(height: 8),
          _infoRow(Icons.emoji_events_rounded, 'League', widget.league ?? 'Unknown'), const SizedBox(height: 8),
          _infoRow(Icons.sports_rounded, 'Stadium', '—'), const SizedBox(height: 8),
          _infoRow(Icons.flag_rounded, 'Country', '—'), const SizedBox(height: 8),
          _infoRow(Icons.people_rounded, 'Matches Played', '$_played'), const SizedBox(height: 8),
          _infoRow(Icons.check_circle_rounded, 'Wins', '$_won'), const SizedBox(height: 8),
          _infoRow(Icons.remove_circle_outline_rounded, 'Draws', '$_drawn'),
          const SizedBox(height: 16),
          Text('More details coming soon.', style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground)),
        ])));
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return GlassCard(borderRadius: 12, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      enableHover: false,
      child: Row(children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 12),
        Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.mutedForeground)),
        const Spacer(),
        Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.foreground)),
      ]));
  }
}
