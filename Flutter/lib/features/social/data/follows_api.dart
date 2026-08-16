import '../../../core/network/api_client.dart';

class FollowsApi {
  FollowsApi(this._client);
  final ApiClient _client;

  /// POST /api/follows — { targetUserId } toggle
  Future<Map<String, dynamic>> toggle(String targetUserId) async {
    final data = await _client.postJson('/follows', body: {'targetUserId': targetUserId});
    return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
  }
}
