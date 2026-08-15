import '../../../core/network/api_client.dart';
import '../../../shared/models/user_profile.dart';

class ProfileApi {
  ProfileApi(this._client);
  final ApiClient _client;

  /// PUT /api/profile
  Future<UserProfile> updateProfile({
    String? name,
    String? handle,
    String? bio,
    String? location,
    String? website,
    String? aboutMe,
    List<String>? sportsFollowing,
    List<String>? interests,
    Map<String, bool>? notifPrefs,
    Map<String, bool>? privacySettings,
    String? theme,
    String? fontSize,
    bool? reducedMotion,
    bool? highContrast,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (handle != null) body['handle'] = handle;
    if (bio != null) body['bio'] = bio;
    if (location != null) body['location'] = location;
    if (website != null) body['website'] = website;
    if (aboutMe != null) body['aboutMe'] = aboutMe;
    if (sportsFollowing != null) body['sportsFollowing'] = sportsFollowing;
    if (interests != null) body['interests'] = interests;
    if (notifPrefs != null) body['notifPrefs'] = notifPrefs;
    if (privacySettings != null) body['privacySettings'] = privacySettings;
    if (theme != null) body['theme'] = theme;
    if (fontSize != null) body['fontSize'] = fontSize;
    if (reducedMotion != null) body['reducedMotion'] = reducedMotion;
    if (highContrast != null) body['highContrast'] = highContrast;

    final data = await _client.putJson('/profile', body: body);
    final map = data is Map<String, dynamic>
        ? (data['user'] as Map<String, dynamic>? ?? data)
        : <String, dynamic>{};
    return UserProfile.fromJson(map);
  }
}
