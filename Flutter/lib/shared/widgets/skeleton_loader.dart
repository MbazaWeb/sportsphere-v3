import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
// Shimmer placeholders while content loads.
// Used in feed, profile, scores, search.

class SkeletonBox extends StatefulWidget {
  const SkeletonBox({super.key, this.width, this.height = 16, this.radius = 8});
  final double? width;
  final double height;
  final double radius;

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
    _anim = Tween<double>(begin: -1, end: 2).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(widget.radius),
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            stops: [
              (_anim.value - 0.3).clamp(0.0, 1.0),
              _anim.value.clamp(0.0, 1.0),
              (_anim.value + 0.3).clamp(0.0, 1.0),
            ],
            colors: [
              Colors.white.withValues(alpha: 0.04),
              Colors.white.withValues(alpha: 0.10),
              Colors.white.withValues(alpha: 0.04),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Post card skeleton ────────────────────────────────────────────────────────
class PostCardSkeleton extends StatelessWidget {
  const PostCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const SkeletonBox(width: 40, height: 40, radius: 20),
            const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SkeletonBox(width: 120, height: 13),
              const SizedBox(height: 5),
              const SkeletonBox(width: 80, height: 11),
            ]),
          ]),
          const SizedBox(height: 12),
          const SkeletonBox(height: 14),
          const SizedBox(height: 6),
          const SkeletonBox(height: 14, width: 240),
          const SizedBox(height: 6),
          const SkeletonBox(height: 14, width: 180),
          const SizedBox(height: 12),
          const SkeletonBox(height: 180, radius: 12),
          const SizedBox(height: 12),
          Row(children: [
            const SkeletonBox(width: 50, height: 13),
            const SizedBox(width: 16),
            const SkeletonBox(width: 50, height: 13),
            const SizedBox(width: 16),
            const SkeletonBox(width: 50, height: 13),
          ]),
          const SizedBox(height: 14),
          Container(height: 1, color: Colors.white.withValues(alpha: 0.05)),
        ],
      ),
    );
  }
}

// ─── Score card skeleton ───────────────────────────────────────────────────────
class ScoreCardSkeleton extends StatelessWidget {
  const ScoreCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(children: [
        Row(children: [const SkeletonBox(width: 100, height: 11), const Spacer(), const SkeletonBox(width: 30, height: 20, radius: 6)]),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: Row(children: [const SkeletonBox(width: 28, height: 28, radius: 6), const SizedBox(width: 8), const SkeletonBox(width: 80, height: 13)])),
          const SkeletonBox(width: 60, height: 22, radius: 4),
          Expanded(child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [const SkeletonBox(width: 80, height: 13), const SizedBox(width: 8), const SkeletonBox(width: 28, height: 28, radius: 6)])),
        ]),
      ]),
    );
  }
}

// ─── User card skeleton ────────────────────────────────────────────────────────
class UserCardSkeleton extends StatelessWidget {
  const UserCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        const SkeletonBox(width: 44, height: 44, radius: 22),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SkeletonBox(width: 130, height: 13),
          const SizedBox(height: 5),
          const SkeletonBox(width: 90, height: 11),
        ]),
        const Spacer(),
        const SkeletonBox(width: 70, height: 30, radius: 10),
      ]),
    );
  }
}

// ─── Feed skeleton list ────────────────────────────────────────────────────────
class FeedSkeleton extends StatelessWidget {
  const FeedSkeleton({super.key, this.count = 3});
  final int count;

  @override
  Widget build(BuildContext context) => ListView.builder(
    physics: const NeverScrollableScrollPhysics(),
    shrinkWrap: true,
    itemCount: count,
    itemBuilder: (_, __) => const PostCardSkeleton(),
  );
}
