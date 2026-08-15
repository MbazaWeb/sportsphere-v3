import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum AppTab { home, scores, create, activity, profile }

class BottomNav extends StatelessWidget {
  const BottomNav({
    super.key,
    required this.currentTab,
    required this.onTabSelected,
    this.isAuthenticated = false,
    this.onLoginTap,
    this.visible = true,
  });

  final AppTab currentTab;
  final ValueChanged<AppTab> onTabSelected;
  final bool isAuthenticated;
  final VoidCallback? onLoginTap;
  final bool visible;

  // Tabs shown when NOT authenticated (Guest Mode): Home, Scores, Create
  static const _guestTabs = [
    _TabItem(AppTab.home, 'Home', Icons.home_rounded),
    _TabItem(AppTab.scores, 'Scores', Icons.emoji_events_rounded),
    _TabItem(AppTab.create, 'Create', Icons.add_circle_rounded, isCreate: true),
  ];

  // Tabs shown when authenticated: Home, Scores, Create, Activity, Profile
  static const _authTabs = [
    _TabItem(AppTab.home, 'Home', Icons.home_rounded),
    _TabItem(AppTab.scores, 'Scores', Icons.emoji_events_rounded),
    _TabItem(AppTab.create, 'Create', Icons.add_circle_rounded, isCreate: true),
    _TabItem(AppTab.activity, 'Activity', Icons.notifications_active_rounded),
    _TabItem(AppTab.profile, 'Profile', Icons.person_rounded),
  ];

  List<_TabItem> get _tabs => isAuthenticated ? _authTabs : _guestTabs;

  @override
  Widget build(BuildContext context) {
    return AnimatedSlide(
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOutCubic,
      offset: visible ? Offset.zero : const Offset(0, 1.2),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 250),
        opacity: visible ? 1 : 0,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.background.withValues(alpha: 0.95),
            border: Border(
              top: BorderSide(
                color: AppColors.primary.withValues(alpha: 0.12),
                width: 0.5,
              ),
            ),
          ),
          child: SafeArea(
            top: false,
            child: SizedBox(
              height: 60,
              child: Stack(
                children: [
                  // Top gold glow line
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 1,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            AppColors.primary.withValues(alpha: 0.2),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      for (final tab in _tabs)
                        _NavItem(
                          item: tab,
                          isActive: currentTab == tab.id,
                          onTap: () {
                            // For guests, Activity/Profile tabs trigger login
                            if (!isAuthenticated && 
                                (tab.id == AppTab.activity || tab.id == AppTab.profile)) {
                              onLoginTap?.call();
                              return;
                            }
                            onTabSelected(tab.id);
                          },
                        ),
                      // Show Login button only when NOT authenticated
                      if (!isAuthenticated)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: onLoginTap,
                            child: Container(
                              height: 32,
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.25),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.login_rounded, size: 14, color: AppColors.primaryForeground),
                                  SizedBox(width: 6),
                                  Text(
                                    'Login',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primaryForeground,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabItem {
  const _TabItem(this.id, this.label, this.icon, {this.isCreate = false});
  final AppTab id;
  final String label;
  final IconData icon;
  final bool isCreate;
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.item,
    required this.isActive,
    required this.onTap,
  });

  final _TabItem item;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    if (item.isCreate) {
      return GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: SizedBox(
          width: 56,
          height: 60,
          child: Center(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary : AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
                border: isActive
                    ? null
                    : Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.35),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              transform: isActive ? (Matrix4.identity()..scale(1.05)) : Matrix4.identity(),
              child: Icon(
                item.icon,
                size: 22,
                color: isActive ? AppColors.primaryForeground : AppColors.primary,
              ),
            ),
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        height: 60,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary.withValues(alpha: 0.08) : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                item.icon,
                size: isActive ? 22 : 20,
                color: isActive ? AppColors.primary : AppColors.mutedForeground,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              item.label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: isActive ? AppColors.primary : AppColors.mutedForeground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
