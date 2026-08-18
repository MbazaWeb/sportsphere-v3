import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase Storage for SportSphere Flutter.
///
/// Replaces the current upload to /api/uploads (which saves to VPS disk).
/// Files are now stored in Supabase Storage — CDN-backed, globally fast.
///
/// Buckets:
///   - avatars     → user profile photos
///   - covers      → profile cover images
///   - posts       → post photos and videos
///   - media       → general media

class SupabaseStorage {
  final _client = Supabase.instance.client;
  static const _baseUrl = 'https://vqyfybuloyqahgoagmzd.supabase.co/storage/v1/object/public';

  // ─── Upload bytes to a bucket ──────────────────────────────────────────────
  Future<String> upload({
    required String bucket,
    required String path,
    required Uint8List bytes,
    String contentType = 'image/jpeg',
  }) async {
    await _client.storage.from(bucket).uploadBinary(
      path,
      bytes,
      fileOptions: FileOptions(contentType: contentType, upsert: true),
    );
    return '$_baseUrl/$bucket/$path';
  }

  // ─── Upload avatar ─────────────────────────────────────────────────────────
  Future<String> uploadAvatar({
    required String userId,
    required Uint8List bytes,
    String contentType = 'image/jpeg',
  }) async {
    final path = 'user/$userId/avatar.${contentType.split('/').last}';
    return upload(bucket: 'avatars', path: path, bytes: bytes, contentType: contentType);
  }

  // ─── Upload post media ─────────────────────────────────────────────────────
  Future<String> uploadPostMedia({
    required String userId,
    required String filename,
    required Uint8List bytes,
    String contentType = 'image/jpeg',
  }) async {
    final ts = DateTime.now().millisecondsSinceEpoch;
    final ext = filename.split('.').last;
    final path = 'user/$userId/$ts.$ext';
    return upload(bucket: 'posts', path: path, bytes: bytes, contentType: contentType);
  }

  // ─── Delete file ───────────────────────────────────────────────────────────
  Future<void> delete(String bucket, String path) async {
    await _client.storage.from(bucket).remove([path]);
  }

  // ─── Get public URL ────────────────────────────────────────────────────────
  String publicUrl(String bucket, String path) {
    return _client.storage.from(bucket).getPublicUrl(path);
  }
}
