import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_config.dart';
import '../errors/api_exception.dart';

/// HTTP client — Authorization: Bearer <JWT> for mobile (see api/auth).
class ApiClient {
  ApiClient({
    http.Client? client,
    this.tokenProvider,
    this.onUnauthorized,
  }) : _client = client ?? http.Client();

  final http.Client _client;
  final Future<String?> Function()? tokenProvider;

  /// Called on HTTP 401 so session can be cleared.
  final Future<void> Function()? onUnauthorized;

  Future<Map<String, String>> _headers({Map<String, String>? extra}) async {
    final h = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?extra,
    };
    final token = tokenProvider != null ? await tokenProvider!() : null;
    if (token != null && token.isNotEmpty) {
      h['Authorization'] = 'Bearer $token';
    }
    return h;
  }

  Future<http.Response> request(
    String endpoint, {
    String method = 'GET',
    Map<String, String>? headers,
    Object? body,
  }) async {
    final uri = Uri.parse(ApiConfig.path(endpoint));
    final h = await _headers(extra: headers);
    final encoded = body == null
        ? null
        : body is String
            ? body
            : jsonEncode(body);

    switch (method.toUpperCase()) {
      case 'POST':
        return _client.post(uri, headers: h, body: encoded);
      case 'PUT':
        return _client.put(uri, headers: h, body: encoded);
      case 'PATCH':
        return _client.patch(uri, headers: h, body: encoded);
      case 'DELETE':
        return _client.delete(uri, headers: h, body: encoded);
      default:
        return _client.get(uri, headers: h);
    }
  }

  Future<dynamic> getJson(String endpoint) async {
    final res = await request(endpoint);
    return _decode(res);
  }

  Future<dynamic> postJson(String endpoint, {Object? body}) async {
    final res = await request(endpoint, method: 'POST', body: body);
    return _decode(res);
  }

  Future<dynamic> putJson(String endpoint, {Object? body}) async {
    final res = await request(endpoint, method: 'PUT', body: body);
    return _decode(res);
  }

  Future<dynamic> deleteJson(String endpoint, {Object? body}) async {
    final res = await request(endpoint, method: 'DELETE', body: body);
    return _decode(res);
  }

  dynamic _decode(http.Response res) {
    final text = res.body;
    dynamic data;
    try {
      data = text.isEmpty ? null : jsonDecode(text);
    } catch (_) {
      data = text;
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return data;
    }
    if (res.statusCode == 401) {
      // Fire-and-forget session clear
      onUnauthorized?.call();
    }
    final msg = data is Map && data['error'] != null
        ? data['error'].toString()
        : 'Request failed (${res.statusCode})';
    throw ApiException(msg, statusCode: res.statusCode, body: data);
  }
}
