import '../../../core/network/api_client.dart';
import '../../../shared/models/user_profile.dart';

class AuthResult {
  AuthResult({required this.user, required this.token, this.expiresAt});
  final UserProfile user;
  final String token;
  final String? expiresAt;
}

/// Auth endpoints from api/auth/*
class AuthApi {
  AuthApi(this._client);
  final ApiClient _client;

  /// POST /api/auth — email OR handle + password
  /// Returns { user, token, expiresAt }
  Future<AuthResult> login({
    String? email,
    String? handle,
    required String password,
  }) async {
    final body = <String, dynamic>{
      'password': password,
      if (email != null && email.isNotEmpty) 'email': email,
      if (handle != null && handle.isNotEmpty) 'handle': handle,
    };
    final data = await _client.postJson('/auth', body: body) as Map<String, dynamic>;
    return _parseAuth(data);
  }

  /// POST /api/auth/register
  Future<AuthResult> register({
    required String name,
    required String email,
    required String handle,
    required String password,
    List<String>? sports,
    String? roleId,
    String? roleTypeId,
  }) async {
    final data = await _client.postJson('/auth/register', body: {
      'name': name,
      'email': email,
      'handle': handle,
      'password': password,
      if (sports != null) 'sports': sports,
      if (roleId != null) 'roleId': roleId,
      if (roleTypeId != null) 'roleTypeId': roleTypeId,
    }) as Map<String, dynamic>;
    return _parseAuth(data);
  }

  /// GET /api/auth/me
  Future<UserProfile> me() async {
    final data = await _client.getJson('/auth/me');
    final map = data is Map<String, dynamic>
        ? (data['user'] as Map<String, dynamic>? ?? data)
        : <String, dynamic>{};
    return UserProfile.fromJson(map);
  }

  /// POST /api/auth/logout
  Future<void> logout() async {
    try {
      await _client.postJson('/auth/logout');
    } catch (_) {
      // still clear local token
    }
  }

  /// POST /api/auth/forgot-password — generic response (no email enumeration)
  Future<String> forgotPassword(String email) async {
    final data = await _client.postJson('/auth/forgot-password', body: {
      'email': email.trim().toLowerCase(),
    });
    if (data is Map && data['message'] != null) return data['message'].toString();
    return 'If that email is registered, a reset link has been sent.';
  }

  /// POST /api/auth/reset-password — token from email + new password (min 8)
  Future<void> resetPassword({required String token, required String password}) async {
    await _client.postJson('/auth/reset-password', body: {
      'token': token.trim(),
      'password': password,
    });
  }

  /// POST /api/auth/verify-email/request
  Future<void> requestVerifyEmail() async {
    await _client.postJson('/auth/verify-email/request');
  }

  /// POST /api/auth/verify-email/confirm
  Future<void> confirmVerifyEmail(String code) async {
    await _client.postJson('/auth/verify-email/confirm', body: {'code': code});
  }

  AuthResult _parseAuth(Map<String, dynamic> data) {
    final userMap = data['user'] as Map<String, dynamic>? ?? data;
    final token = data['token']?.toString() ?? '';
    if (token.isEmpty) {
      throw StateError('No token in auth response');
    }
    return AuthResult(
      user: UserProfile.fromJson(userMap),
      token: token,
      expiresAt: data['expiresAt']?.toString(),
    );
  }
}
