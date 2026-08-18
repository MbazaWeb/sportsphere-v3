import 'dart:typed_data';
import '../../../core/network/api_client.dart';
import '../../../core/errors/api_exception.dart';

class UploadApi {
  UploadApi(this._client);

  final ApiClient _client;

  /// Uploads bytes (images) via ApiClient to /uploads
  Future<String> uploadBytes({
    required Uint8List bytes,
    required String filename,
    String contentType = 'image/jpeg',
  }) async {
    try {
      final res = await _client.postMultipart(
        '/uploads',
        bytes: bytes,
        filename: filename,
      );
      if (res is Map && res['url'] != null) {
        return res['url'].toString();
      }
      throw ApiException('Invalid upload response');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Upload failed: $e');
    }
  }

  /// Uploads a file (videos) via ApiClient to /uploads
  Future<String> uploadFile({
    required String path,
    required String filename,
    String contentType = 'video/mp4',
  }) async {
    // For simplicity, read all bytes. For very large files,
    // postMultipart could be extended to take a Stream.
    try {
      final bytes = await _client.readBytesFromFile(path);
      return uploadBytes(bytes: bytes, filename: filename, contentType: contentType);
    } catch (e) {
      throw ApiException('Upload failed: $e');
    }
  }
}
