import '../../../core/network/api_client.dart';

class FavoriteItem {
  FavoriteItem({
    required this.id,
    required this.targetType,
    required this.targetName,
    this.targetHandle,
    this.targetId,
  });

  final String id;
  final String targetType;
  final String targetName;
  final String? targetHandle;
  final String? targetId;

  factory FavoriteItem.fromJson(Map<String, dynamic> j) => FavoriteItem(
        id: j['id']?.toString() ?? '',
        targetType: j['targetType']?.toString() ?? '',
        targetName: j['targetName']?.toString() ?? '',
        targetHandle: j['targetHandle']?.toString(),
        targetId: j['targetId']?.toString(),
      );
}

class FavoritesApi {
  FavoritesApi(this._client);
  final ApiClient _client;

  Future<List<FavoriteItem>> list() async {
    final data = await _client.getJson('/profile/favorites');
    final list = data is List ? data : [];
    return list.map((e) => FavoriteItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<FavoriteItem> add({
    required String targetType,
    required String targetName,
    required String targetId,
    String? targetHandle,
  }) async {
    final data = await _client.postJson('/profile/favorites', body: {
      'targetType': targetType,
      'targetName': targetName,
      'targetId': targetId,
      if (targetHandle != null) 'targetHandle': targetHandle,
    });
    return FavoriteItem.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> remove(String id) async {
    await _client.deleteJson('/profile/favorites?id=${Uri.encodeComponent(id)}');
  }
}
