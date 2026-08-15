import '../../../core/network/api_client.dart';

class MessagesApi {
  MessagesApi(this._client);
  final ApiClient _client;

  /// GET /api/messages — conversation list
  Future<List<Map<String, dynamic>>> getConversations() async {
    final data = await _client.getJson('/messages');
    final list = data is List ? data : [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  /// POST /api/messages — { recipientId, content }
  Future<Map<String, dynamic>> send({
    required String recipientId,
    required String content,
  }) async {
    final data = await _client.postJson('/messages', body: {
      'recipientId': recipientId,
      'content': content,
    });
    return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
  }
}
