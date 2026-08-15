import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';

/// Premium home header — frosted glass, iOS-tight type.
class HomeHeader extends StatelessWidget {
  const HomeHeader({
    super.key,
    required this.activeSubTab,
    required this.onSubTabChanged,
    this.onSearch,
    this.onNotifications,
    this.onLeaderboard,
  });

  final String activeSubTab;
  final ValueChanged<String> onSubTabChanged;
  final VoidCallback? onSearch;
  final VoidCallback? onNotifications;
  final VoidCallback? onLeaderboard;

  static const subTabs = [
    ('for-you', 'Sportlights'),
    ('trending', 'Trending'),
    ('predictions', 'Predictions'),
    ('polls', 'Polls'),
  ];

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.background.withValues(alpha: 0.72),
            border: Border(
              bottom: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
            ),
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
                        SvgPicture.asset(
                          'assets/images/logo.svg',
                          height: 26,
                          fit: BoxFit.contain,
                          placeholderBuilder: (_) => Text(
                            'S',
                            style: GoogleFonts.outfit(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        const Spacer(),
                        _IconBtn(Icons.emoji_events_outlined, onLeaderboard),
                        const SizedBox(width: 6),
                        _IconBtn(Icons.search_rounded, onSearch),
                        const SizedBox(width: 6),
                        _IconBtn(Icons.notifications_none_rounded, onNotifications),
                      ],
                    ),
                  ),
                ),
                SizedBox(
                  height: 46,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                    itemCount: subTabs.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 6),
                    itemBuilder: (context, i) {
                      final (id, label) = subTabs[i];
                      final active = activeSubTab == id;
                      return GestureDetector(
                        onTap: () => onSubTabChanged(id),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          curve: Curves.easeOutCubic,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: active ? AppColors.primary : Colors.white.withValues(alpha: 0.04),
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(
                              color: active
                                  ? AppColors.primary
                                  : Colors.white.withValues(alpha: 0.06),
                            ),
                            boxShadow: active
                                ? [
                                    BoxShadow(
                                      color: AppColors.primary.withValues(alpha: 0.25),
                                      blurRadius: 16,
                                      offset: const Offset(0, 4),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Text(
                            label,
                            style: GoogleFonts.inter(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w600,
                              letterSpacing: -0.2,
                              color: active
                                  ? AppColors.primaryForeground
                                  : AppColors.mutedForeground,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  const _IconBtn(this.icon, this.onTap);
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.05),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 38,
          height: 38,
          child: Icon(icon, size: 19, color: AppColors.mutedForeground),
        ),
      ),
    );
  }
}
