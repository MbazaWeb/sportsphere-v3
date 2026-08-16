import '../../../core/network/api_client.dart';

class FollowsApi {
  FollowsApi(this._client);
  final ApiClient _client;

  /// POST /api/follows — toggle follow/fan for a target user.
  /// Returns { following, isFan, fanCount, followerCount, followingCount }.
  Future<Map<String, dynamic>> toggle(String targetUserId) async {
    final data = await _client.postJson('/follows', body: {'targetUserId': targetUserId});
    return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
  }

  /// GET /api/follows?userId=xxx&type=fans — list fans of a user.
  Future<List<Map<String, dynamic>>> getFans(String userId) async {
    final raw = await _client.getJson('/follows?userId=$userId&type=fans');
    if (raw is List) return raw.cast<Map<String, dynamic>>();
    return [];
  }

  /// GET /api/follows?userId=xxx&type=followers — list followers of a user.
  Future<List<Map<String, dynamic>>> getFollowers(String userId) async {
    final raw = await _client.getJson('/follows?userId=$userId&type=followers');
    if (raw is List) return raw.cast<Map<String, dynamic>>();
    return [];
  }

  /// GET /api/follows?userId=xxx&type=following — list users that userId follows.
  Future<List<Map<String, dynamic>>> getFollowing(String userId) async {
    final raw = await _client.getJson('/follows?userId=$userId&type=following');
    if (raw is List) return raw.cast<Map<String, dynamic>>();
    return [];
  }
}
