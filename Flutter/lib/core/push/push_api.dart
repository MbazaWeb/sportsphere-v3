import '../network/api_client.dart';

/// API client for registering / unregistering FCM push tokens with the backend.
///
/// Usage:
/// ```dart
/// final pushApi = PushApi(apiClient);
/// await pushApi.registerToken(fcmToken);
/// await pushApi.unregisterToken(fcmToken);
/// ```
class PushApi {
  PushApi(this._client);
  final ApiClient _client;

  /// POST /api/push/token — register an FCM device token.
  Future<void> registerToken(String fcmToken, {String? platform}) async {
    await _client.postJson('/push/token', body: {
      'token': fcmToken,
      'platform': platform ?? 'android',
    });
  }

  /// POST /api/push/token/unregister — remove an FCM device token.
  ///
  /// Uses POST instead of DELETE so that ApiClient.postJson can carry the
  /// token in the request body (query-string encoding of tokens can be
  /// fragile due to special characters).
  Future<void> unregisterToken(String fcmToken) async {
    await _client.postJson('/push/token/unregister', body: {
      'token': fcmToken,
    });
  }
}
