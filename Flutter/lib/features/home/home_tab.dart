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
                  'trending' => const TrendingTab(),
                  'predictions' => const PredictionsTab(),
                  'polls' => const PollsTab(),
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
