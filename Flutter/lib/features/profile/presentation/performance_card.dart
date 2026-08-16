import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../data/performance_api.dart';
import '../../leaderboard/leaderboard_sheet.dart';

/// Live performance rank + points card for player / coach / team profiles.
class PerformanceCard extends ConsumerStatefulWidget {
  const PerformanceCard({
    super.key,
    required this.userId,
    this.compact = false,
  });

  final String userId;
  final bool compact;

  @override
  ConsumerState<PerformanceCard> createState() => _PerformanceCardState();
}

class _PerformanceCardState extends ConsumerState<PerformanceCard> {
  PerformancePayload? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant PerformanceCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userId != widget.userId) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ref.read(performanceApiProvider).getForUser(widget.userId);
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
      return GlassCard(
        borderRadius: 16,
        padding: const EdgeInsets.all(16),
        child: const SizedBox(
          height: 72,
          child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
        ),
      );
    }
    if (_error != null) {
      return GlassCard(
        borderRadius: 16,
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(child: Text('Performance unavailable', style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 13))),
            TextButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      );
    }

    final p = _data?.profile;
    if (p == null) {
      return GlassCard(
        borderRadius: 16,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Performance', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 6),
            Text(
              'No ranked profile yet. Play, post, and verify performances to earn points.',
              style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 13, height: 1.35),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => const LeaderboardSheet(),
                );
              },
              child: Text('View leaderboard', style: GoogleFonts.inter(color: AppColors.primary, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );
    }

    final movement = p.rankMovement ?? 0;
    final moveColor = movement > 0
        ? const Color(0xFF22C55E)
        : movement < 0
            ? const Color(0xFFEF4444)
            : AppColors.mutedForeground;

    return GlassCard(
      borderRadius: 16,
      padding: const EdgeInsets.all(16),
      glow: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Performance', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  p.tier,
                  style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 11, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _Stat(label: 'Points', value: '${p.totalPoints}', accent: true),
              _Stat(label: 'Score', value: p.performanceScore.toStringAsFixed(0)),
              _Stat(
                label: 'Global',
                value: p.rankGlobal != null && p.rankGlobal! > 0 ? '#${p.rankGlobal}' : '—',
              ),
              _Stat(
                label: 'Category',
                value: p.rankCategory != null && p.rankCategory! > 0 ? '#${p.rankCategory}' : '—',
              ),
            ],
          ),
          if (!widget.compact) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                _Mini(label: 'Form', value: p.formScore?.toStringAsFixed(0) ?? '—'),
                _Mini(label: 'Consistency', value: p.consistencyScore?.toStringAsFixed(0) ?? '—'),
                _Mini(label: 'Improve', value: p.improvementScore?.toStringAsFixed(0) ?? '—'),
                _Mini(
                  label: 'Move',
                  value: movement == 0 ? '—' : (movement > 0 ? '+$movement' : '$movement'),
                  color: moveColor,
                ),
              ],
            ),
            if (p.position != null || p.categoryBucket != null) ...[
              const SizedBox(height: 10),
              Text(
                [
                  if (p.position != null && p.position!.isNotEmpty) p.position!,
                  if (p.playerType != null && p.playerType!.isNotEmpty) p.playerType!,
                  if (p.categoryBucket != null && p.categoryBucket!.isNotEmpty) p.categoryBucket!,
                ].join(' · '),
                style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground),
              ),
            ],
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const LeaderboardSheet(),
                  );
                },
                child: Text('Full rankings', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.primary)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, this.accent = false});
  final String label;
  final String value;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w800,
              fontSize: 18,
              color: accent ? AppColors.primary : AppColors.foreground,
            ),
          ),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
        ],
      ),
    );
  }
}

class _Mini extends StatelessWidget {
  const _Mini({required this.label, required this.value, this.color});
  final String label;
  final String value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 13, color: color ?? AppColors.foreground)),
            Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground)),
          ],
        ),
      ),
    );
  }
}
