import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../../../core/constants/api_config.dart';
import '../../../core/errors/api_exception.dart';
import 'dart:convert';

class UploadApi {
  UploadApi({this.tokenProvider});

  final Future<String?> Function()? tokenProvider;

  /// POST multipart /api/uploads — field name "file"
  /// Returns public URL string from response.
  Future<String> uploadBytes({
    required Uint8List bytes,
    required String filename,
    String contentType = 'image/jpeg',
  }) async {
    final uri = Uri.parse(ApiConfig.path('/uploads'));
    final req = http.MultipartRequest('POST', uri);
    final token = tokenProvider != null ? await tokenProvider!() : null;
    if (token != null && token.isNotEmpty) {
      req.headers['Authorization'] = 'Bearer $token';
    }
    req.files.add(http.MultipartFile.fromBytes(
      'file',
      bytes,
      filename: filename,
      contentType: MediaType.parse(contentType),
    ));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    dynamic data;
    try {
      data = res.body.isEmpty ? null : jsonDecode(res.body);
    } catch (_) {
      data = res.body;
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final msg = data is Map && data['error'] != null
          ? data['error'].toString()
          : 'Upload failed (${res.statusCode})';
      throw ApiException(msg, statusCode: res.statusCode, body: data);
    }
    if (data is Map) {
      final url = data['url'] ?? data['publicUrl'] ?? data['path'];
      if (url != null) return url.toString();
    }
    throw ApiException('Upload response missing url', statusCode: res.statusCode, body: data);
  }
}
