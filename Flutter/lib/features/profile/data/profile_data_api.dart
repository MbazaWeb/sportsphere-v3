import '../../../core/network/api_client.dart';

/// GET /api/profile-data?type=&key= — role-enriched demo/live payload from API.
class ProfileDataApi {
  ProfileDataApi(this._client);
  final ApiClient _client;

  Future<Map<String, dynamic>> fetch({required String type, String? key}) async {
    final q = StringBuffer('/profile-data?type=${Uri.encodeComponent(type)}');
    if (key != null && key.isNotEmpty) {
      q.write('&key=${Uri.encodeComponent(key)}');
    }
    final data = await _client.getJson(q.toString());
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }
}
