import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../storage/token_storage.dart';
import '../constants/api_config.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

/// Singleton service that initialises FCM and keeps the backend aware of the
/// current device token.
///
/// Call [init] once from `main.dart` **after**
/// `WidgetsFlutterBinding.ensureInitialized()`.
///
/// Call [onLogin] after a successful authentication so the token is (re-)
/// registered, and [onLogout] when the session ends so it is removed.
class PushService {
  static final PushService _instance = PushService._();
  factory PushService() => _instance;
  PushService._();

  bool _initialized = false;
  String? _currentToken;

  // ---- public API ---------------------------------------------------------

  /// Initialise push notifications.
  ///
  /// Safe to call multiple times — subsequent calls are no-ops.
  /// On web this is intentionally a no-op (FCM web setup differs).
  Future<void> init() async {
    if (_initialized || kIsWeb) return;
    _initialized = true;

    try {
      final messaging = FirebaseMessaging.instance;

      // Request permission (on iOS / Android 13+ this shows a system dialog)
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      // Obtain the FCM token
      final token = await messaging.getToken();
      if (token == null || token.isEmpty) {
        debugPrint('PushService: No FCM token available');
        return;
      }
      _currentToken = token;

      // Listen for token refreshes (e.g. after app update or token rotation)
      messaging.onTokenRefresh.listen((newToken) async {
        _currentToken = newToken;
        await _registerWithBackend(newToken);
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('PushService: Foreground message: ${message.notification?.title}');
        // The notification sheet in the Activity tab polls the API,
        // so no extra handling needed for foreground messages.
      });

      // Handle notification tap when app is in background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('PushService: Message opened from background: ${message.data}');
        // Could navigate based on message.data here in the future.
      });

      // Tell the backend about it
      await _registerWithBackend(token);

      debugPrint('PushService: Initialized with token');
    } catch (e) {
      debugPrint('PushService: Init error: $e');
    }
  }

  /// Call after a successful login to (re-)register the FCM token.
  Future<void> onLogin() async {
    if (_currentToken != null) {
      await _registerWithBackend(_currentToken!);
    } else {
      await init(); // Re-init to obtain token and register
    }
  }

  /// Call on logout to unregister the FCM token from the backend.
  Future<void> onLogout() async {
    if (_currentToken == null) return;

    try {
      final storage = TokenStorage();
      final authToken = await storage.readToken();
      final uri = Uri.parse(ApiConfig.path('/push/token/unregister'));
      await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({'token': _currentToken}),
      );
      debugPrint('PushService: Token unregistered');
    } catch (e) {
      debugPrint('PushService: Unregister error: $e');
    }
  }

  // ---- internals ----------------------------------------------------------

  Future<void> _registerWithBackend(String fcmToken) async {
    try {
      final storage = TokenStorage();
      final authToken = await storage.readToken();
      if (authToken == null || authToken.isEmpty) return;

      final uri = Uri.parse(ApiConfig.path('/push/token'));
      final res = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'token': fcmToken,
          'platform': Platform.isIOS ? 'ios' : 'android',
        }),
      );

      if (res.statusCode >= 200 && res.statusCode < 300) {
        debugPrint('PushService: Token registered with backend');
      } else {
        debugPrint(
            'PushService: Token registration failed: ${res.statusCode}');
      }
    } catch (e) {
      debugPrint('PushService: Backend registration error: $e');
    }
  }
}
