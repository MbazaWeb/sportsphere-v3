/// Mirrors authStore UserProfile from the React source.
class UserProfile {
  const UserProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.handle,
    this.avatar = '',
    this.avatarUrl,
    this.role = 'fan',
    this.verificationStatus = 'none',
    this.bio = '',
    this.sportsFollowing = const [],
    this.registeredAt = '',
    this.roleData = const {},
    this.isVerified = false,
    this.emailVerified = false,
    this.isPro = false,
    this.proSince,
    this.proTier,
    this.followerCount = 0,
    this.fanCount = 0,
    this.followingCount = 0,
    this.postCount = 0,
    this.location,
    this.countryOfOrigin,
    this.nationality,
    this.aboutMe,
    this.interests = const [],
    this.notifPrefs = const {},
    this.privacySettings = const {},
    this.theme = 'dark',
    this.fontSize = 'medium',
    this.reducedMotion = false,
    this.highContrast = false,
    this.website,
    this.coverGradient,
    this.coverUrl,
    this.roleId,
    this.roleTypeId,
    this.roleName,
    this.typeName,
  });

  final String id;
  final String name;
  final String email;
  final String handle;
  final String avatar;
  final String? avatarUrl;
  final String role;
  final String verificationStatus;
  final String bio;
  final List<String> sportsFollowing;
  final String registeredAt;
  final Map<String, String> roleData;
  final bool isVerified;
  final bool emailVerified;
  final bool isPro;
  final String? proSince;
  final String? proTier;
  final int followerCount;
  final int fanCount;
  final int followingCount;
  final int postCount;
  final String? location;
  final String? countryOfOrigin;
  final String? nationality;
  final String? aboutMe;
  final List<String> interests;
  final Map<String, bool> notifPrefs;
  final Map<String, bool> privacySettings;
  final String theme;
  final String fontSize;
  final bool reducedMotion;
  final bool highContrast;
  final String? website;
  final String? coverGradient;
  final String? coverUrl;
  final String? roleId;
  final String? roleTypeId;
  final String? roleName;
  final String? typeName;

  factory UserProfile.fromJson(Map<String, dynamic> j) {
    return UserProfile(
      id: j['id']?.toString() ?? '',
      name: j['name']?.toString() ?? '',
      email: j['email']?.toString() ?? '',
      handle: j['handle']?.toString() ?? '',
      avatar: j['avatar']?.toString() ?? j['avatarUrl']?.toString() ?? '',
      avatarUrl: j['avatarUrl']?.toString(),
      role: j['role']?.toString() ?? j['typeSlug']?.toString() ?? 'fan',
      verificationStatus: j['verificationStatus']?.toString() ?? 'none',
      bio: j['bio']?.toString() ?? '',
      sportsFollowing: (j['sportsFollowing'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      registeredAt: j['registeredAt']?.toString() ?? '',
      isVerified: j['isVerified'] == true,
      emailVerified: j['emailVerified'] == true,
      isPro: j['isPro'] == true,
      proSince: j['proSince']?.toString(),
      proTier: j['proTier']?.toString(),
      followerCount: (j['followerCount'] as num?)?.toInt() ?? 0,
      fanCount: (j['fanCount'] as num?)?.toInt() ?? 0,
      followingCount: (j['followingCount'] as num?)?.toInt() ?? 0,
      postCount: (j['postCount'] as num?)?.toInt() ?? 0,
      location: j['location']?.toString(),
      countryOfOrigin: j['countryOfOrigin']?.toString(),
      nationality: j['nationality']?.toString(),
      aboutMe: j['aboutMe']?.toString(),
      interests: (j['interests'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      notifPrefs: () {
        final n = j['notifPrefs'];
        if (n is Map) {
          return n.map((k, v) => MapEntry(k.toString(), v == true));
        }
        return <String, bool>{};
      }(),
      privacySettings: () {
        final n = j['privacySettings'];
        if (n is Map) {
          return n.map((k, v) => MapEntry(k.toString(), v == true));
        }
        return <String, bool>{};
      }(),
      theme: j['theme']?.toString() ?? 'dark',
      fontSize: j['fontSize']?.toString() ?? 'medium',
      reducedMotion: j['reducedMotion'] == true,
      highContrast: j['highContrast'] == true,
      website: j['website']?.toString(),
      coverGradient: j['coverGradient']?.toString(),
      coverUrl: j['coverUrl']?.toString(),
      roleId: j['roleId']?.toString(),
      roleTypeId: j['roleTypeId']?.toString(),
      roleName: j['roleName']?.toString(),
      typeName: j['typeName']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'handle': handle,
        'avatar': avatar,
        'avatarUrl': avatarUrl,
        'role': role,
        'verificationStatus': verificationStatus,
        'bio': bio,
        'isVerified': isVerified,
        'emailVerified': emailVerified,
        'isPro': isPro,
        'followerCount': followerCount,
        'followingCount': followingCount,
        'postCount': postCount,
        'location': location,
      };
}
