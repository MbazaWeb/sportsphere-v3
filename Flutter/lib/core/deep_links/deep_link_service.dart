import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:app_links/app_links.dart';

/// Supported deep link route types.
enum DeepLinkType {
  profile,
  post,
  match,
  team,
}

/// Parsed representation of an incoming deep link.
class DeepLinkRoute {
  const DeepLinkRoute({required this.type, required this.id});

  /// The kind of destination the link points to.
  final DeepLinkType type;

  /// The identifier (handle, postId, matchId, teamName) extracted from the link.
  final String id;
}

/// Singleton service that listens for incoming deep links and parses them into
/// [DeepLinkRoute] objects.
///
/// The app's domain is `sportssphere.fun` and the API base is
/// `https://sportssphere.fun/sportsphere/api`.
///
/// Usage — call [init] once from `main.dart` after
/// `WidgetsFlutterBinding.ensureInitialized()`, then set [onRoute] to receive
/// parsed routes.
class DeepLinkService {
  static final DeepLinkService _instance = DeepLinkService._();
  factory DeepLinkService() => _instance;
  DeepLinkService._();

  final _appLinks = AppLinks();
  StreamSubscription? _sub;
  bool _initialized = false;

  /// Callback invoked with a parsed [DeepLinkRoute] when the app receives a link.
  void Function(DeepLinkRoute route)? onRoute;

  /// Initialize — listen for incoming deep links.
  ///
  /// Call once from `main.dart` after `WidgetsFlutterBinding.ensureInitialized()`.
  Future<void> init() async {
    // Only on native platforms, and only once
    if (kIsWeb || _initialized) return;
    _initialized = true;
    try {
      // Listen for incoming links while the app is running
      _sub = _appLinks.uriLinkStream.listen((Uri? uri) {
        if (uri != null) {
          final route = _parse(uri);
          if (route != null) onRoute?.call(route);
        }
      }, onError: (err) {
        debugPrint('DeepLink error: $err');
      });

      // Check for initial link (cold start)
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        final route = _parse(initialUri);
        if (route != null) onRoute?.call(route);
      }
    } catch (e) {
      debugPrint('DeepLink init error: $e');
    }
  }

  /// Cancel the underlying stream subscription.
  void dispose() {
    _sub?.cancel();
  }

  /// Parse a [Uri] into a [DeepLinkRoute].
  ///
  /// Supported paths:
  /// - `sportssphere.fun/profile/<handle>`
  /// - `sportssphere.fun/post/<postId>`
  /// - `sportssphere.fun/match/<matchId>`
  /// - `sportssphere.fun/team/<teamName>`
  /// - `sportssphere.fun/sportsphere/mobile/profile/<handle>` (mobile subpath)
  DeepLinkRoute? _parse(Uri uri) {
    final path = uri.path;
    final segments = path.split('/').where((s) => s.isNotEmpty).toList();

    // Remove 'sportsphere' and 'mobile' prefixes if present
    int start = 0;
    if (start < segments.length && segments[start] == 'sportsphere') start++;
    if (start < segments.length && segments[start] == 'mobile') start++;
    final remaining = segments.sublist(start);

    if (remaining.isEmpty) return null;

    switch (remaining.first.toLowerCase()) {
      case 'profile':
        if (remaining.length >= 2) {
          return DeepLinkRoute(type: DeepLinkType.profile, id: remaining[1]);
        }
        break;
      case 'post':
        if (remaining.length >= 2) {
          return DeepLinkRoute(type: DeepLinkType.post, id: remaining[1]);
        }
        break;
      case 'match':
        if (remaining.length >= 2) {
          return DeepLinkRoute(type: DeepLinkType.match, id: remaining[1]);
        }
        break;
      case 'team':
        if (remaining.length >= 2) {
          return DeepLinkRoute(type: DeepLinkType.team, id: remaining[1]);
        }
        break;
    }
    return null;
  }
}
