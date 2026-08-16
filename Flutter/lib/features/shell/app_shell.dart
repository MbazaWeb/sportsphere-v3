import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/bottom_nav.dart';
import '../auth/login_sheet.dart';
import '../auth/register_sheet.dart';
import '../auth/forgot_password_sheet.dart';
import '../auth/reset_password_sheet.dart';
import '../home/home_tab.dart';
import '../scores/scores_tab.dart';
import '../create/create_tab.dart';
import '../activity/activity_tab.dart';
import '../profile/profile_tab.dart';

class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  AppTab _current = AppTab.home;
  bool _showLogin = false;
  bool _showRegister = false;
  bool _showForgot = false;
  bool _showReset = false;

  void _openLogin() => setState(() {
        _showLogin = true;
        _showRegister = false;
        _showForgot = false;
        _showReset = false;
      });

  void _openRegister() => setState(() {
        _showRegister = true;
        _showLogin = false;
        _showForgot = false;
        _showReset = false;
      });

  void _closeAuth() => setState(() {
        _showLogin = false;
        _showRegister = false;
        _showForgot = false;
        _showReset = false;
      });

  void _openForgot() => setState(() {
        _showForgot = true;
        _showLogin = false;
        _showRegister = false;
        _showReset = false;
      });

  void _openReset() => setState(() {
        _showReset = true;
        _showForgot = false;
        _showLogin = false;
        _showRegister = false;
      });

  void _onAuthSuccess() => setState(() {
        _showLogin = false;
        _showRegister = false;
        _current = AppTab.home; // Go to home after login
      });

  // Handle tab selection - prevent guests from accessing hidden tabs
  void _handleTabSelection(AppTab tab) {
    // If not authenticated and trying to access restricted tabs
    if (!ref.read(authProvider).isAuthenticated) {
      if (tab == AppTab.activity || tab == AppTab.profile) {
        _openLogin();
        return;
      }
    }
    
    if (tab == AppTab.create) {
      _openCreateSheet();
      return;
    }
    setState(() => _current = tab);
  }

  void _openCreateSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
          child: DraggableScrollableSheet(
            initialChildSize: 0.88,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) {
              return Container(
                decoration: const BoxDecoration(
                  color: AppColors.backgroundSecondary,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 10),
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    Expanded(
                      child: CreateTab(
                        onNeedLogin: () {
                          Navigator.of(context).pop();
                          _openLogin();
                        },
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final isAuthed = auth.isAuthenticated;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.topCenter,
                radius: 1.4,
                colors: [AppColors.backgroundSecondary, AppColors.background],
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: _buildTabContent(isAuthed),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: BottomNav(
              currentTab: _current == AppTab.create ? AppTab.home : _current,
              isAuthenticated: isAuthed,
              visible: true,
              onTabSelected: _handleTabSelection,
              onLoginTap: _openLogin,
            ),
          ),
          if (_showLogin)
            LoginSheet(
              onClose: _closeAuth,
              onSuccess: _onAuthSuccess,
              onOpenRegister: _openRegister,
              onOpenForgot: _openForgot,
            ),
          if (_showRegister)
            RegisterSheet(
              onClose: _closeAuth,
              onSuccess: _onAuthSuccess,
              onOpenLogin: _openLogin,
            ),
          if (_showForgot)
            ForgotPasswordSheet(
              onClose: _closeAuth,
              onOpenLogin: _openLogin,
              onOpenReset: _openReset,
            ),
          if (_showReset)
            ResetPasswordSheet(
              onClose: _closeAuth,
              onOpenLogin: _openLogin,
            ),
        ],
      ),
    );
  }

  Widget _buildTabContent(bool isAuthed) {
    switch (_current) {
      case AppTab.home:
        return HomeTab(onNeedLogin: _openLogin);
      case AppTab.scores:
        return const ScoresTab();
      case AppTab.create:
        return HomeTab(onNeedLogin: _openLogin);
      case AppTab.activity:
        return ActivityTab(onSignIn: _openLogin);
      case AppTab.profile:
        return ProfileTab(
          isAuthenticated: isAuthed,
          onSignIn: _openLogin,
          onSignOut: () async {
            await ref.read(authProvider.notifier).logout();
            if (mounted) setState(() => _current = AppTab.home); // Redirect to home after logout
          },
        );
    }
  }
}
