import '../../../core/network/api_client.dart';

class CommunityItem {
  CommunityItem({
    required this.id,
    required this.name,
    this.description,
    this.topic,
    this.memberCount = 0,
    this.isMember = false,
  });

  final String id;
  final String name;
  final String? description;
  final String? topic;
  final int memberCount;
  final bool isMember;

  factory CommunityItem.fromJson(Map<String, dynamic> j) => CommunityItem(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        description: j['description']?.toString(),
        topic: j['topic']?.toString(),
        memberCount: (j['memberCount'] as num?)?.toInt() ?? 0,
        isMember: j['isMember'] == true,
      );

  CommunityItem copyWith({bool? isMember, int? memberCount}) => CommunityItem(
        id: id,
        name: name,
        description: description,
        topic: topic,
        memberCount: memberCount ?? this.memberCount,
        isMember: isMember ?? this.isMember,
      );
}

class CommunitiesApi {
  CommunitiesApi(this._client);
  final ApiClient _client;

  Future<List<CommunityItem>> list() async {
    final data = await _client.getJson('/communities');
    final list = data is List ? data : [];
    return list
        .map((e) => CommunityItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  /// POST /api/communities/:id/join
  Future<void> join(String communityId) async {
    await _client.postJson('/communities/$communityId/join', body: {});
  }

  /// POST /api/communities/:id/leave
  Future<void> leave(String communityId) async {
    await _client.postJson('/communities/$communityId/leave', body: {});
  }

  /// GET /api/communities/:id/posts
  Future<List<dynamic>> getFeed(String communityId) async {
    final data = await _client.getJson('/communities/$communityId/posts');
    return data is List ? data : [];
  }
}
