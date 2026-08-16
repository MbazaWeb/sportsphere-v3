import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../features/profile/presentation/user_profile_sheet.dart';
import '../../features/scores/presentation/team_detail_sheet.dart';
import 'deep_link_service.dart';

/// A widget that wraps the app and listens to [DeepLinkService] for incoming
/// deep link routes, then navigates to the appropriate bottom sheet or screen.
class DeepLinkNavigator extends ConsumerStatefulWidget {
  const DeepLinkNavigator({super.key, required this.child});

  /// The main application widget tree.
  final Widget child;

  @override
  ConsumerState<DeepLinkNavigator> createState() => _DeepLinkNavigatorState();
}

class _DeepLinkNavigatorState extends ConsumerState<DeepLinkNavigator> {
  @override
  void initState() {
    super.initState();
    DeepLinkService().onRoute = _handleRoute;
    DeepLinkService().init();
  }

  @override
  void dispose() {
    DeepLinkService().dispose();
    super.dispose();
  }

  void _handleRoute(DeepLinkRoute route) {
    if (!mounted) return;

    switch (route.type) {
      case DeepLinkType.profile:
        // Small delay to ensure navigator is ready
        Future.delayed(const Duration(milliseconds: 500), () {
          if (!mounted) return;
          final ctx = context;
          showModalBottomSheet(
            context: ctx,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => UserProfileSheet(
              handle: route.id,
              initialName: route.id,
            ),
          );
        });
        break;

      case DeepLinkType.team:
        Future.delayed(const Duration(milliseconds: 500), () {
          if (!mounted) return;
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => TeamDetailSheet(
              teamName: route.id,
            ),
          );
        });
        break;

      case DeepLinkType.post:
        // Navigate to home tab and scroll to post — show snackbar for now
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Opening post ${route.id}...')),
        );
        break;

      case DeepLinkType.match:
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Opening match ${route.id}...')),
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
