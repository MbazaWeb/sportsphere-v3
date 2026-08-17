import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../search/presentation/search_sheet.dart';
import '../notifications/presentation/notifications_sheet.dart';
import '../leaderboard/leaderboard_sheet.dart';
import 'widgets/home_header.dart';
import 'widgets/sportlights_tab.dart';
import 'widgets/trending_tab.dart';
import 'widgets/predictions_tab.dart';
import 'widgets/polls_tab.dart';
import 'widgets/following_tab.dart';

/// Home matching web HomeTab + screenshots (Sportlights / Trending / Predictions / Polls).
class HomeTab extends StatefulWidget {
  const HomeTab({super.key, this.onNeedLogin});

  final VoidCallback? onNeedLogin;

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  String _subTab = 'for-you';

  void _openSearch() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const SearchSheet(),
    );
  }

  void _openNotifications() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => NotificationsSheet(onNeedLogin: widget.onNeedLogin),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        HomeHeader(
          activeSubTab: _subTab,
          onSubTabChanged: (id) => setState(() => _subTab = id),
          onSearch: _openSearch,
          onNotifications: _openNotifications,
          onLeaderboard: () {
            showModalBottomSheet<void>(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => const LeaderboardSheet(),
            );
          },
        ),
        Expanded(
          child: ColoredBox(
            color: AppColors.background,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 150),
              child: KeyedSubtree(
                key: ValueKey(_subTab),
                child: switch (_subTab) {
                  'following' => const FollowingTab(),
                  'trending' => const TrendingTab(),
                  'arena' => const _ArenaTab(),
                  _ => const SportlightsTab(),
                },
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Arena tab — merges Predictions + Polls into one scrollable feed.
class _ArenaTab extends StatefulWidget {
  const _ArenaTab();
  @override
  State<_ArenaTab> createState() => _ArenaTabState();
}

class _ArenaTabState extends State<_ArenaTab> {
  String _sub = 'predictions';

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: Row(
              children: [
                _ArenaSub('predictions', 'Predictions', _sub, (v) => setState(() => _sub = v)),
                _ArenaSub('polls', 'Polls', _sub, (v) => setState(() => _sub = v)),
              ],
            ),
          ),
        ),
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 150),
            child: KeyedSubtree(
              key: ValueKey(_sub),
              child: _sub == 'polls' ? const PollsTab() : const PredictionsTab(),
            ),
          ),
        ),
      ],
    );
  }
}

class _ArenaSub extends StatelessWidget {
  const _ArenaSub(this.id, this.label, this.active, this.onTap);
  final String id, label, active;
  final ValueChanged<String> onTap;

  @override
  Widget build(BuildContext context) {
    final isActive = id == active;
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isActive ? AppColors.primaryForeground : AppColors.mutedForeground,
            ),
          ),
        ),
      ),
    );
  }
}
