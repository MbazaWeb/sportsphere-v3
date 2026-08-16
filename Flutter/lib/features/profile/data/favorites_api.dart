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
    required String targetId,
    String? targetName,
    String? targetHandle,
  }) async {
    final data = await _client.postJson('/profile/favorites', body: {
      'targetType': targetType,
      'targetId': targetId,
      if (targetName != null) 'targetName': targetName,
      if (targetHandle != null) 'targetHandle': targetHandle,
    });
    return FavoriteItem.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> remove(String id) async {
    await _client.deleteJson('/profile/favorites?id=${Uri.encodeComponent(id)}');
  }

  /// Convenience: remove by targetId (used when we don't have the favorite record id)
  Future<void> removeByTarget(String targetType, String targetId) async {
    // Fetch all favorites and find the one to remove
    final items = await list();
    final match = items.where((f) => f.targetType == targetType && f.targetId == targetId);
    for (final f in match) {
      await remove(f.id);
    }
  }
}
