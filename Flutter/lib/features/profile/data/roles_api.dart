import '../../../core/network/api_client.dart';

class AppRoleType {
  AppRoleType({required this.id, required this.name, this.slug});
  final String id;
  final String name;
  final String? slug;

  factory AppRoleType.fromJson(Map<String, dynamic> j) => AppRoleType(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? j['label']?.toString() ?? '',
        slug: j['slug']?.toString(),
      );
}

class AppRole {
  AppRole({
    required this.id,
    required this.name,
    required this.slug,
    this.category,
    this.types = const [],
  });

  final String id;
  final String name;
  final String slug;
  final String? category;
  final List<AppRoleType> types;

  factory AppRole.fromJson(Map<String, dynamic> j) => AppRole(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? j['label']?.toString() ?? '',
        slug: j['slug']?.toString() ?? j['name']?.toString()?.toLowerCase() ?? '',
        category: j['category']?.toString(),
        types: (j['types'] as List? ?? [])
            .map((e) => AppRoleType.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}

class RolesApi {
  RolesApi(this._client);
  final ApiClient _client;

  /// GET /api/roles
  Future<List<AppRole>> listRoles() async {
    final data = await _client.getJson('/roles');
    final list = data is List ? data : [];
    return list.map((e) => AppRole.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  /// POST /api/roles/upgrade — { roleId, roleTypeId, roleData? }
  Future<Map<String, dynamic>> upgrade({
    required String roleId,
    required String roleTypeId,
    Map<String, dynamic>? roleData,
  }) async {
    final data = await _client.postJson('/roles/upgrade', body: {
      'roleId': roleId,
      'roleTypeId': roleTypeId,
      if (roleData != null) 'roleData': roleData,
    });
    return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
  }
}
