import '../../../core/network/api_client.dart';

/// Role-based action logic:
///
/// Sports roles (player, team, coach, etc.):
///   - "Become a Fan"  → POST /api/follows  { targetUserId, action: 'fan' }
///   - "Follow"        → POST /api/follows  { targetUserId, action: 'follow' }
///
/// Community/business roles:
///   - "Join"          → POST /api/follows  { targetUserId, action: 'follow' }
///
/// Fan ↔ Fan:
///   - "Follow"        → POST /api/follows  { targetUserId, action: 'follow' }
///
/// Returns: { following, isFan, fanCount, followerCount, followingCount }

// ─── Role classification ──────────────────────────────────────────────────────

/// Roles that support "Become a Fan" (personal sports identity only)
const fanRoles = <String>{
  'player', 'team', 'coach', 'national_team', 'club',
};

/// Roles that show "Join" instead of follow
const joinRoles = <String>{
  'community', 'business', 'media',
};

/// Get the primary action label for a role
String primaryActionLabel(String role, {bool isFan = false, bool isFollowing = false}) {
  final r = role.toLowerCase();
  if (fanRoles.contains(r)) {
    return isFan ? "You're a Fan ❤️" : 'Become a Fan';
  }
  if (joinRoles.contains(r)) {
    return isFollowing ? 'Joined ✓' : 'Join';
  }
  return isFollowing ? 'Following' : 'Follow';
}

/// Get secondary action label (follow for sports roles, null for others)
String? secondaryActionLabel(String role, {bool isFollowing = false}) {
  final r = role.toLowerCase();
  if (fanRoles.contains(r)) {
    return isFollowing ? 'Following' : 'Follow';
  }
  return null; // no secondary action
}

/// Whether this role has the "Become a Fan" button
bool hasFanButton(String role) => fanRoles.contains(role.toLowerCase());

/// Whether this role shows "Join" instead of "Follow"
bool hasJoinButton(String role) => joinRoles.contains(role.toLowerCase());

class FollowsApi {
  FollowsApi(this._client);
  final ApiClient _client;

  /// POST /api/follows — toggle follow for a target user.
  /// action: 'follow' | 'fan'
  /// Returns { following, isFan, fanCount, followerCount, followingCount }
  Future<Map<String, dynamic>> toggle(String targetUserId, {String action = 'follow'}) async {
    final data = await _client.postJson('/follows', body: {
      'targetUserId': targetUserId,
      'action': action,
    });
    return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data as Map);
  }

  /// Become a fan of a sports role profile.
  Future<Map<String, dynamic>> becomeFan(String targetUserId) =>
      toggle(targetUserId, action: 'fan');

  /// Follow any user (generic follow, not fan).
  Future<Map<String, dynamic>> follow(String targetUserId) =>
      toggle(targetUserId, action: 'join');

  /// Join a community or business.
  Future<Map<String, dynamic>> join(String targetUserId) =>
      toggle(targetUserId, action: 'join');

  /// GET /api/follows?userId=xxx&type=fans — list fans of a user.
  Future<List<Map<String, dynamic>>> getFans(String userId) async {
    final raw = await _client.getJson('/follows?userId=$userId&type=fans');
    if (raw is List) return raw.cast<Map<String, dynamic>>();
    return [];
  }

  /// GET /api/follows?userId=xxx&type=followers — list followers.
  Future<List<Map<String, dynamic>>> getFollowers(String userId) async {
    final raw = await _client.getJson('/follows?userId=$userId&type=followers');
    if (raw is List) return raw.cast<Map<String, dynamic>>();
    return [];
  }

  /// GET /api/follows?userId=xxx&type=following — list following.
  Future<List<Map<String, dynamic>>> getFollowing(String userId) async {
    final raw = await _client.getJson('/follows?userId=$userId&type=following');
    if (raw is List) return raw.cast<Map<String, dynamic>>();
    return [];
  }

  /// GET /api/follows/status?targetUserId=xxx — check follow/fan status.
  Future<Map<String, dynamic>> getStatus(String targetUserId) async {
    try {
      final raw = await _client.getJson('/follows/status?targetUserId=$targetUserId');
      return raw is Map<String, dynamic> ? raw : Map<String, dynamic>.from(raw as Map);
    } catch (_) {
      return {'following': false, 'isFan': false};
    }
  }
}
