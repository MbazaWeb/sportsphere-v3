import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// JWT session storage — encrypted on device (Keychain / Keystore).
/// Never log the token. Web falls back to secure storage where available.
class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock_this_device,
              ),
            );

  final FlutterSecureStorage _storage;
  static const _key = 'ss_session_token';
  static const _expiresKey = 'ss_session_expires';

  Future<void> saveToken(String token, {String? expiresAt}) async {
    if (token.isEmpty) return;
    await _storage.write(key: _key, value: token);
    if (expiresAt != null) {
      await _storage.write(key: _expiresKey, value: expiresAt);
    }
  }

  Future<String?> readToken() async {
    try {
      return await _storage.read(key: _key);
    } catch (e) {
      if (kDebugMode) {
        // Do not print token values
        debugPrint('TokenStorage.read failed');
      }
      return null;
    }
  }

  Future<String?> readExpiresAt() => _storage.read(key: _expiresKey);

  Future<void> clear() async {
    await _storage.delete(key: _key);
    await _storage.delete(key: _expiresKey);
  }
}
