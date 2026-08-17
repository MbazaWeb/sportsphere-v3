import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';

/// Post Analysis — select team/player, pick 5+ matches, generate stat graphs.
/// Creates a shareable analysis post with movement charts.
class PostAnalysisSheet extends StatefulWidget {
  const PostAnalysisSheet({super.key, this.onPost});
  final void Function(String summary, List<AnalysisStat> stats)? onPost;

  @override
  State<PostAnalysisSheet> createState() => _PostAnalysisSheetState();
}

class _PostAnalysisSheetState extends State<PostAnalysisSheet>
    with TickerProviderStateMixin {
  final _search = TextEditingController();
  String _entityType = 'team'; // team | player | coach
  String? _selectedEntity;
  String? _selectedEntityName;
  final _selectedMatches = <_MatchEntry>[];
  int _step = 0; // 0=search, 1=matches, 2=preview

  late final AnimationController _slideCtrl;
  late final Animation<Offset> _slideAnim;

  // Sample data — in production these come from /api/matches + /api/players
  final _sampleTeams = [
    'Simba SC', 'Young Africans SC', 'Pamba Jiji FC', 'Dodoma FC',
    'NBC Azam FC', 'Mbeya City FC', 'Singida Big Stars', 'Mtibwa Sugar',
  ];
  final _samplePlayers = [
    'Mbwana Samatta', 'John Bocco', 'Erasto Nyoni', 'Shomari Kapombe',
    'David Martin', 'Hassan Dilunga', 'Lamine Moro',
  ];

  final _sampleMatches = [
    _MatchEntry('Simba SC vs Young Africans', '2-1', 'Aug 10', goals: 2, assists: 0, rating: 8.2),
    _MatchEntry('Simba SC vs Pamba Jiji', '3-0', 'Aug 5', goals: 1, assists: 1, rating: 7.8),
    _MatchEntry('Simba SC vs Dodoma FC', '1-1', 'Aug 1', goals: 0, assists: 1, rating: 6.9),
    _MatchEntry('Simba SC vs Azam FC', '2-2', 'Jul 27', goals: 2, assists: 0, rating: 8.5),
    _MatchEntry('Simba SC vs Mbeya City', '4-1', 'Jul 22', goals: 1, assists: 2, rating: 9.0),
    _MatchEntry('Simba SC vs Mtibwa Sugar', '1-0', 'Jul 18', goals: 0, assists: 0, rating: 7.1),
  ];

  @override
  void initState() {
    super.initState();
    _slideCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 320));
    _slideAnim = Tween<Offset>(begin: const Offset(1, 0), end: Offset.zero)
        .animate(CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOutCubic));
    _slideCtrl.forward();
  }

  @override
  void dispose() {
    _slideCtrl.dispose();
    _search.dispose();
    super.dispose();
  }

  List<String> get _filteredEntities {
    final q = _search.text.toLowerCase();
    final list = _entityType == 'player' ? _samplePlayers : _sampleTeams;
    if (q.isEmpty) return list;
    return list.where((e) => e.toLowerCase().contains(q)).toList();
  }

  void _nextStep() {
    _slideCtrl.reset();
    setState(() => _step++);
    _slideCtrl.forward();
  }

  void _prevStep() {
    setState(() => _step = math.max(0, _step - 1));
  }

  List<AnalysisStat> _computeStats() {
    if (_selectedMatches.isEmpty) return [];
    final goals = _selectedMatches.map((m) => m.goals).toList();
    final assists = _selectedMatches.map((m) => m.assists).toList();
    final ratings = _selectedMatches.map((m) => m.rating).toList();
    final avgRating = ratings.reduce((a, b) => a + b) / ratings.length;
    final totalGoals = goals.reduce((a, b) => a + b);
    final totalAssists = assists.reduce((a, b) => a + b);
    return [
      AnalysisStat('Goals', goals.map((g) => g.toDouble()).toList(), AppColors.primary),
      AnalysisStat('Assists', assists.map((a) => a.toDouble()).toList(), AppColors.accent),
      AnalysisStat('Rating', ratings, const Color(0xFF22C55E)),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
        child: Container(
          height: MediaQuery.of(context).size.height * 0.92,
          decoration: BoxDecoration(
            color: AppColors.backgroundSecondary.withValues(alpha: 0.96),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(color: Colors.white.withValues(alpha: 0.09)),
          ),
          child: Column(
            children: [
              // Handle + header
              _Header(step: _step, onBack: _step > 0 ? _prevStep : null),
              // Step indicator
              _StepIndicator(step: _step),
              Expanded(
                child: SlideTransition(
                  position: _slideAnim,
                  child: _buildStep(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0: return _StepSearch(
          entityType: _entityType,
          onTypeChanged: (t) => setState(() { _entityType = t; _selectedEntity = null; }),
          search: _search,
          entities: _filteredEntities,
          selected: _selectedEntity,
          onSelect: (id, name) { setState(() { _selectedEntity = id; _selectedEntityName = name; }); },
          onNext: _selectedEntity != null ? _nextStep : null,
          onSearchChanged: () => setState(() {}),
        );
      case 1: return _StepMatches(
          entityName: _selectedEntityName ?? '',
          matches: _sampleMatches,
          selected: _selectedMatches,
          onToggle: (m) => setState(() {
            if (_selectedMatches.contains(m)) _selectedMatches.remove(m);
            else _selectedMatches.add(m);
          }),
          onNext: _selectedMatches.length >= 3 ? _nextStep : null,
        );
      case 2: return _StepPreview(
          entityName: _selectedEntityName ?? '',
          matches: _selectedMatches,
          stats: _computeStats(),
          onPost: () => widget.onPost?.call(
            'Performance analysis: $_selectedEntityName — ${_selectedMatches.length} match breakdown',
            _computeStats(),
          ),
        );
      default: return const SizedBox.shrink();
    }
  }
}

// ─── Header ──────────────────────────────────────────────────────────────────
class _Header extends StatelessWidget {
  const _Header({required this.step, this.onBack});
  final int step;
  final VoidCallback? onBack;

  static const _titles = ['Select Team or Player', 'Select Matches', 'Analysis Preview'];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Column(
        children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)))),
          const SizedBox(height: 14),
          Row(
            children: [
              if (onBack != null)
                GestureDetector(
                  onTap: onBack,
                  child: Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withValues(alpha: 0.08))),
                    child: const Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: Colors.white),
                  ),
                )
              else
                const SizedBox(width: 36),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Post Analysis', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
                    Text(_titles[step.clamp(0, 2)], style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.primary.withValues(alpha: 0.3))),
                child: Text('📊 Analysis', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.step});
  final int step;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        children: List.generate(3, (i) => Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: i < 2 ? 6 : 0),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: 3,
              decoration: BoxDecoration(
                color: i <= step ? AppColors.primary : Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        )),
      ),
    );
  }
}

// ─── Step 0: Search Entity ────────────────────────────────────────────────────
class _StepSearch extends StatelessWidget {
  const _StepSearch({required this.entityType, required this.onTypeChanged, required this.search, required this.entities, required this.selected, required this.onSelect, required this.onNext, required this.onSearchChanged});
  final String entityType;
  final ValueChanged<String> onTypeChanged;
  final TextEditingController search;
  final List<String> entities;
  final String? selected;
  final void Function(String id, String name) onSelect;
  final VoidCallback? onNext;
  final VoidCallback onSearchChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 16),
        // Type selector
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.04), borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.white.withValues(alpha: 0.07))),
            child: Row(
              children: [
                _TypeBtn('Team', 'team', entityType, onTypeChanged),
                _TypeBtn('Player', 'player', entityType, onTypeChanged),
                _TypeBtn('Coach', 'coach', entityType, onTypeChanged),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Search
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Container(
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.white.withValues(alpha: 0.08))),
            child: TextField(
              controller: search,
              onChanged: (_) => onSearchChanged(),
              style: GoogleFonts.inter(fontSize: 14, color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search ${entityType}s...',
                hintStyle: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded, color: AppColors.mutedForeground, size: 20),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        // List
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
            itemCount: entities.length,
            separatorBuilder: (_, __) => const SizedBox(height: 6),
            itemBuilder: (context, i) {
              final name = entities[i];
              final isSelected = selected == name;
              return GestureDetector(
                onTap: () => onSelect(name, name),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: isSelected ? AppColors.primary.withValues(alpha: 0.4) : Colors.white.withValues(alpha: 0.07), width: isSelected ? 1.5 : 1),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                        child: Center(child: Text(entityType == 'player' ? '⚽' : entityType == 'coach' ? '👨‍🏫' : '👥', style: const TextStyle(fontSize: 16))),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: isSelected ? AppColors.primary : Colors.white))),
                      if (isSelected) const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 20),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        if (selected != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            child: GoldButton(label: 'Select Matches →', onTap: onNext ?? () {}, icon: Icons.arrow_forward_rounded),
          ),
      ],
    );
  }
}

class _TypeBtn extends StatelessWidget {
  const _TypeBtn(this.label, this.value, this.current, this.onTap);
  final String label, value, current;
  final ValueChanged<String> onTap;

  @override
  Widget build(BuildContext context) {
    final active = value == current;
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(color: active ? AppColors.primary : Colors.transparent, borderRadius: BorderRadius.circular(10)),
          alignment: Alignment.center,
          child: Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: active ? AppColors.primaryForeground : AppColors.mutedForeground)),
        ),
      ),
    );
  }
}

// ─── Step 1: Select Matches ───────────────────────────────────────────────────
class _StepMatches extends StatelessWidget {
  const _StepMatches({required this.entityName, required this.matches, required this.selected, required this.onToggle, required this.onNext});
  final String entityName;
  final List<_MatchEntry> matches;
  final List<_MatchEntry> selected;
  final ValueChanged<_MatchEntry> onToggle;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(
            children: [
              Text('Select at least 3 matches', style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                child: Text('${selected.length} selected', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
            itemCount: matches.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = matches[i];
              final isSelected = selected.contains(m);
              return GestureDetector(
                onTap: () => onToggle(m),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withValues(alpha: 0.10) : Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isSelected ? AppColors.primary.withValues(alpha: 0.4) : Colors.white.withValues(alpha: 0.07), width: isSelected ? 1.5 : 1),
                  ),
                  child: Row(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        width: 22, height: 22,
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: isSelected ? AppColors.primary : Colors.white.withValues(alpha: 0.2)),
                        ),
                        child: isSelected ? const Icon(Icons.check_rounded, size: 14, color: AppColors.primaryForeground) : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(m.title, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                            Text('${m.date} · Score: ${m.score}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                          ],
                        ),
                      ),
                      // Mini stats
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('${m.goals}G ${m.assists}A', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
                          Text('${m.rating.toStringAsFixed(1)} ★', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF22C55E))),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        if (selected.length >= 3)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            child: GoldButton(label: 'Generate Analysis →', onTap: onNext ?? () {}, icon: Icons.auto_graph_rounded),
          ),
      ],
    );
  }
}

// ─── Step 2: Preview + Chart ──────────────────────────────────────────────────
class _StepPreview extends StatelessWidget {
  const _StepPreview({required this.entityName, required this.matches, required this.stats, required this.onPost});
  final String entityName;
  final List<_MatchEntry> matches;
  final List<AnalysisStat> stats;
  final VoidCallback onPost;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Preview card
          GlassCard(
            goldAccent: true,
            borderRadius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(width: 36, height: 36, decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)), child: const Center(child: Text('📊', style: TextStyle(fontSize: 18)))),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(entityName, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16, letterSpacing: -0.3)),
                          Text('${matches.length}-match analysis', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.primary.withValues(alpha: 0.3))),
                      child: Text('ANALYSIS', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 0.8)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Charts
                ...stats.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _StatChart(stat: s, matchCount: matches.length),
                )),
                // Match list
                const Divider(color: Colors.white12),
                const SizedBox(height: 8),
                Text('Matches included', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                ...matches.map((m) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.sports_soccer, size: 12, color: AppColors.mutedForeground),
                      const SizedBox(width: 6),
                      Expanded(child: Text(m.title, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground))),
                      Text(m.score, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary)),
                    ],
                  ),
                )),
              ],
            ),
          ),
          const SizedBox(height: 20),
          GoldButton(label: 'Post Analysis', onTap: onPost, icon: Icons.send_rounded),
        ],
      ),
    );
  }
}

// ─── Stat Chart (movement line graph) ─────────────────────────────────────────
class _StatChart extends StatelessWidget {
  const _StatChart({required this.stat, required this.matchCount});
  final AnalysisStat stat;
  final int matchCount;

  @override
  Widget build(BuildContext context) {
    final max = stat.values.reduce(math.max);
    final safeMax = max == 0 ? 1.0 : max;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(width: 10, height: 10, decoration: BoxDecoration(color: stat.color, borderRadius: BorderRadius.circular(3))),
            const SizedBox(width: 6),
            Text(stat.label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: stat.color)),
            const Spacer(),
            Text('avg ${(stat.values.reduce((a, b) => a + b) / stat.values.length).toStringAsFixed(1)}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 64,
          child: CustomPaint(
            painter: _LinePainter(values: stat.values, color: stat.color, max: safeMax),
            child: const SizedBox.expand(),
          ),
        ),
      ],
    );
  }
}

class _LinePainter extends CustomPainter {
  const _LinePainter({required this.values, required this.color, required this.max});
  final List<double> values;
  final Color color;
  final double max;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) return;
    final n = values.length;
    final pts = List.generate(n, (i) {
      final x = n == 1 ? size.width / 2 : i * size.width / (n - 1);
      final y = size.height - (values[i] / max) * size.height * 0.85 - size.height * 0.05;
      return Offset(x, y);
    });

    // Area fill
    final fillPath = Path()..moveTo(pts.first.dx, size.height);
    for (final p in pts) fillPath.lineTo(p.dx, p.dy);
    fillPath..lineTo(pts.last.dx, size.height)..close();
    canvas.drawPath(fillPath, Paint()..shader = LinearGradient(
      begin: Alignment.topCenter, end: Alignment.bottomCenter,
      colors: [color.withValues(alpha: 0.3), color.withValues(alpha: 0.02)],
    ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))..style = PaintingStyle.fill);

    // Line
    final linePaint = Paint()..color = color..strokeWidth = 2..style = PaintingStyle.stroke..strokeCap = StrokeCap.round;
    final linePath = Path()..moveTo(pts.first.dx, pts.first.dy);
    for (var i = 1; i < pts.length; i++) {
      final cp1 = Offset((pts[i - 1].dx + pts[i].dx) / 2, pts[i - 1].dy);
      final cp2 = Offset((pts[i - 1].dx + pts[i].dx) / 2, pts[i].dy);
      linePath.cubicTo(cp1.dx, cp1.dy, cp2.dx, cp2.dy, pts[i].dx, pts[i].dy);
    }
    canvas.drawPath(linePath, linePaint);

    // Dots
    for (final p in pts) {
      canvas.drawCircle(p, 4, Paint()..color = color);
      canvas.drawCircle(p, 2.5, Paint()..color = Colors.white);
    }

    // Grid lines
    final gridPaint = Paint()..color = Colors.white.withValues(alpha: 0.06)..strokeWidth = 0.5;
    for (var i = 0; i <= 3; i++) {
      final y = size.height * i / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
  }

  @override
  bool shouldRepaint(_LinePainter old) => old.values != values;
}

// ─── Data models ──────────────────────────────────────────────────────────────
class _MatchEntry {
  const _MatchEntry(this.title, this.score, this.date, {required this.goals, required this.assists, required this.rating});
  final String title, score, date;
  final int goals, assists;
  final double rating;
}

class AnalysisStat {
  const AnalysisStat(this.label, this.values, this.color);
  final String label;
  final List<double> values;
  final Color color;
}
