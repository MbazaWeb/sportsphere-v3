import '../../../core/network/api_client.dart';

class SocialApi {
  SocialApi(this._client);
  final ApiClient _client;

  /// POST /api/posts
  Future<Map<String, dynamic>> createPost({
    required String content,
    String postType = 'post',
    List<String> mediaUrls = const [],
    Map<String, dynamic>? poll,
    Map<String, dynamic>? prediction,
    bool isBreaking = false,
  }) async {
    final data = await _client.postJson('/posts', body: {
      'content': content,
      'postType': postType,
      if (mediaUrls.isNotEmpty) 'mediaUrls': mediaUrls,
      if (poll != null) 'poll': poll,
      if (prediction != null) 'prediction': prediction,
      'isBreaking': isBreaking,
    });
    return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
  }

  /// POST /api/likes — toggle; returns { liked, likeCount }
  Future<({bool liked, int likeCount})> toggleLike(String postId) async {
    final data = await _client.postJson('/likes', body: {'postId': postId});
    final map = data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
    return (
      liked: map['liked'] == true,
      likeCount: (map['likeCount'] as num?)?.toInt() ?? 0,
    );
  }

  /// GET /api/comments?postId=
  Future<List<Map<String, dynamic>>> getComments(String postId) async {
    final data = await _client.getJson('/comments?postId=${Uri.encodeComponent(postId)}');
    final list = data is List ? data : (data is Map && data['data'] is List ? data['data'] as List : []);
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  /// POST /api/comments
  Future<Map<String, dynamic>> addComment({
    required String postId,
    required String content,
    String? parentId,
  }) async {
    final data = await _client.postJson('/comments', body: {
      'postId': postId,
      'content': content,
      if (parentId != null) 'parentId': parentId,
    });
    return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
  }

  /// GET /api/notifications
  Future<List<Map<String, dynamic>>> getNotifications() async {
    final data = await _client.getJson('/notifications');
    final list = data is List ? data : [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  /// GET /api/users?q=
  Future<List<Map<String, dynamic>>> searchUsers(String q) async {
    final data = await _client.getJson('/users?q=${Uri.encodeComponent(q)}&limit=20');
    final list = data is List
        ? data
        : (data is Map && data['users'] is List)
            ? data['users'] as List
            : (data is Map && data['data'] is List)
                ? data['data'] as List
                : [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }
}
