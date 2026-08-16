import '../../../core/network/api_client.dart';

class CommunityItem {
  CommunityItem({
    required this.id,
    required this.name,
    this.description,
    this.topic,
    this.memberCount = 0,
  });

  final String id;
  final String name;
  final String? description;
  final String? topic;
  final int memberCount;

  factory CommunityItem.fromJson(Map<String, dynamic> j) => CommunityItem(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        description: j['description']?.toString(),
        topic: j['topic']?.toString(),
        memberCount: (j['memberCount'] as num?)?.toInt() ?? 0,
      );
}

class CommunitiesApi {
  CommunitiesApi(this._client);
  final ApiClient _client;

  Future<List<CommunityItem>> list() async {
    final data = await _client.getJson('/communities');
    final list = data is List ? data : [];
    return list.map((e) => CommunityItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  /// POST /api/communities/:id/join — join a community
  Future<void> join(String communityId) async {
    await _client.postJson('/communities/$communityId/join', body: {});
  }

  /// POST /api/communities/:id/leave — leave a community
  Future<void> leave(String communityId) async {
    await _client.postJson('/communities/$communityId/leave', body: {});
  }
}
