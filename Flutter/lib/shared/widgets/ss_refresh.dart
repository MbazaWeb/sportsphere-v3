import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

/// SportSphere pull-to-refresh — gold indicator matching web PTR.
///
/// Web thresholds: ~72–80px trigger, max pull ~110–120px.
/// Flutter RefreshIndicator handles gesture; we style color/background.
class SsRefresh extends StatelessWidget {
  const SsRefresh({
    super.key,
    required this.onRefresh,
    required this.child,
    this.displacement = 40,
  });

  final Future<void> Function() onRefresh;
  final Widget child;
  final double displacement;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.primary,
      backgroundColor: AppColors.backgroundSecondary,
      strokeWidth: 2.5,
      displacement: displacement,
      edgeOffset: 0,
      triggerMode: RefreshIndicatorTriggerMode.onEdge,
      child: child,
    );
  }
}

/// Ensures a scrollable always has enough extent for pull-to-refresh
/// even when content is shorter than the viewport (empty / few items).
class SsRefreshScroll extends StatelessWidget {
  const SsRefreshScroll({
    super.key,
    required this.onRefresh,
    required this.child,
    this.padding,
    this.physics,
  });

  final Future<void> Function() onRefresh;
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final ScrollPhysics? physics;

  @override
  Widget build(BuildContext context) {
    return SsRefresh(
      onRefresh: onRefresh,
      child: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: physics ??
                const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
            padding: padding,
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: child,
            ),
          );
        },
      ),
    );
  }
}
