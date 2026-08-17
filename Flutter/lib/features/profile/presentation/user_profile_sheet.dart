import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../domain/profile_role_registry.dart';
import '../../messages/presentation/chat_thread_sheet.dart';
import 'performance_card.dart';
import 'role_tab_content.dart';
import '../../social/data/follows_api.dart';
import 'fans_list_page.dart';

/// Roles that show "Become a Fan" (personal sports identity — player, coach, team, national team).
const _sportsRoles = <String>{
  'player', 'team', 'coach', 'national_team', 'club',
};

/// Roles that show "Follow" only (institutions, orgs, media).
const _followOnlyRoles = <String>{
  'academy', 'competition', 'league', 'organization', 'referee',
  'commentator', 'journalist', 'analyst', 'creator', 'scout',
  'agent', 'stadium', 'venue', 'business', 'commercial-partner', 'fan',
};

/// Role-based cover gradient colors (mirrors web TYPE_CONFIG gradients).
const _coverGradients = <String, List<Color>>{
  'team': [Color(0xFF059669), Color(0xFF064E3B)],
  'competition': [Color(0xFF7C3AED), Color(0xFF3B0764)],
  'player': [Color(0xFF2563EB), Color(0xFF1E3A8A)],
  'coach': [Color(0xFFEA580C), Color(0xFF7C2D12)],
  'league': [Color(0xFF7C3AED), Color(0xFF3B0764)],
  'stadium': [Color(0xFFCA8A04), Color(0xFF713F12)],
  'venue': [Color(0xFFCA8A04), Color(0xFF713F12)],
  'academy': [Color(0xFF0891B2), Color(0xFF164E63)],
  'community': [Color(0xFF6366F1), Color(0xFF312E81)],
  'organization': [Color(0xFF7C3AED), Color(0xFF3B0764)],
  'business': [Color(0xFF2563EB), Color(0xFF1E3A8A)],
  'journalist': [Color(0xFFDC2626), Color(0xFF7F1D1D)],
  'analyst': [Color(0xFF6366F1), Color(0xFF312E81)],
  'creator': [Color(0xFFE11D48), Color(0xFF881337)],
  'scout': [Color(0xFF059669), Color(0xFF064E3B)],
  'referee': [Color(0xFFF59E0B), Color(0xFF78350F)],
  'fan': [Color(0xFF1E40AF), Color(0xFF1E3A5F)],
};

/// Full-screen profile page for viewing another user's profile.
/// Matches the web EntityProfileSheet / UserProfileViewer with
/// role-aware "Become a Fan" button, fan stats, and tabbed content.
class UserProfileSheet extends ConsumerStatefulWidget {
  const UserProfileSheet({
    super.key,
    this.handle,
    this.userId,
    this.initialName,
  });

  final String? handle;
  final String? userId;
  final String? initialName;

  @override
  ConsumerState<UserProfileSheet> createState() => _UserProfileSheetState();
}

class _UserProfileSheetState extends ConsumerState<UserProfileSheet> {
  Map<String, dynamic>? _user;
  bool _loading = true;
  String? _error;
  bool _followBusy = false;
  bool _fanBusy = false;
  bool? _following;
  bool? _isFan;
  String _activeTab = 'overview';

  bool get _isSportsRole {
    final role = (_user?['role'] ?? 'fan').toString().toLowerCase();
    return _sportsRoles.contains(role);
  }

  int get _fanCount => (_user?['fanCount'] as num?)?.toInt() ?? 0;
  int get _followerCount => (_user?['followerCount'] as num?)?.toInt() ?? 0;
  int get _followingCount => (_user?['followingCount'] as num?)?.toInt() ?? 0;
  int get _postCount => (_user?['postCount'] as num?)?.toInt() ?? 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final client = ref.read(apiClientProvider);
      Map<String, dynamic> data;
      if (widget.handle != null && widget.handle!.isNotEmpty) {
        final h = widget.handle!.replaceFirst('@', '');
        final raw = await client.getJson(
          '/users?handle=${Uri.encodeComponent(h.startsWith('@') ? h : '@$h')}',
        );
        if (raw is Map && raw['error'] != null) {
          final raw2 = await client.getJson(
            '/users?handle=${Uri.encodeComponent(h)}',
          );
          data = Map<String, dynamic>.from(raw2 as Map);
        } else {
          data = Map<String, dynamic>.from(raw as Map);
        }
      } else if (widget.userId != null) {
        final raw = await client.getJson(
          '/users?q=${Uri.encodeComponent(widget.initialName ?? widget.userId!)}',
        );
        final list = raw is List ? raw : [];
        data = list.isNotEmpty
            ? Map<String, dynamic>.from(list.first as Map)
            : <String, dynamic>{};
      } else {
        data = {};
      }
      if (!mounted) return;
      setState(() {
        _user = data;
        _loading = false;
        _following = data['isFollowing'] == true;
        _isFan = data['isFan'] == true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(
          RegExp(r'^ApiException\(\d+\):\s*'),
          '',
        );
      });
    }
  }

  Future<void> _toggleFollow() async {
    final id = _user?['id']?.toString();
    if (id == null || id.isEmpty) return;
    if (!ref.read(authProvider).isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to become a fan')),
      );
      return;
    }
    setState(() => _followBusy = true);
    try {
      final res = await FollowsApi(ref.read(apiClientProvider)).toggle(id);
      if (!mounted) return;
      setState(() {
        _followBusy = false;
        _following = (res['following'] == true || res['isFan'] == true);
        // Update local counts from API response
        if (res['fanCount'] != null) {
          _user = Map<String, dynamic>.from(_user!)
            ..['fanCount'] = res['fanCount']
            ..['followerCount'] = res['followerCount'];
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _followBusy = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(
                color: AppColors.primary,
                strokeWidth: 2,
              ),
            )
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _user == null || _user!.isEmpty
                  ? const Center(child: Text('User not found'))
                  : _ProfileContent(
                      user: _user!,
                      roleCfg: ProfileRoleRegistry.forRole(
                        _user!['role']?.toString(),
                      ),
                      isSportsRole: _isSportsRole,
                      following: _following,
                      isFanOverride: _isFan,
                      followBusy: _followBusy,
                      fanBusy: _fanBusy,
                      fanCount: _fanCount,
                      followerCount: _followerCount,
                      followingCount: _followingCount,
                      postCount: _postCount,
                      activeTab: _activeTab,
                      onTabChanged: (id) => setState(() => _activeTab = id),
                      onToggleFollow: _toggleFollow,
                      onToggleFan: _toggleFan,
                    ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.destructive, size: 32),
            const SizedBox(height: 12),
            Text(error, textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: AppColors.mutedForeground)),
            const SizedBox(height: 16),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

/// The main profile content — full screen with cover, avatar, stats,
/// Become a Fan button, and tabbed content.
class _ProfileContent extends ConsumerWidget {
  const _ProfileContent({
    required this.user,
    required this.roleCfg,
    required this.isSportsRole,
    required this.following,
    this.isFanOverride,
    required this.followBusy,
    required this.fanBusy,
    required this.fanCount,
    required this.followerCount,
    required this.followingCount,
    required this.postCount,
    required this.activeTab,
    required this.onTabChanged,
    required this.onToggleFollow,
    required this.onToggleFan,
  });

  final Map<String, dynamic> user;
  final RoleProfileConfig roleCfg;
  final bool isSportsRole;
  final bool? following;
  final bool? isFanOverride;
  final bool followBusy;
  final bool fanBusy;
  final int fanCount;
  final int followerCount;
  final int followingCount;
  final int postCount;
  final String activeTab;
  final ValueChanged<String> onTabChanged;
  final VoidCallback onToggleFollow;
  final VoidCallback onToggleFan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = user['name']?.toString() ?? 'User';
    final handle = user['handle']?.toString() ?? '';
    final bio = user['bio']?.toString() ?? '';
    final avatar = user['avatarUrl']?.toString();
    final verified = user['isVerified'] == true;
    final role = user['role']?.toString() ?? 'fan';
    final location = user['location']?.toString();
    final registeredAt = user['registeredAt']?.toString() ?? user['createdAt']?.toString() ?? '';
    final id = user['id']?.toString() ?? '';

    final gradient = _coverGradients[role.toLowerCase()] ?? _coverGradients['fan']!;
    final isFan = isFanOverride ?? (following == true && isSportsRole);

    return CustomScrollView(
      slivers: [
        // ── App bar ──
        SliverAppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          pinned: true,
          leading: Container(
            margin: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.surface.withValues(alpha: 0.8),
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.border),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, size: 16),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          title: Text(
            name,
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
          centerTitle: false,
        ),

        // ── Cover gradient ──
        SliverToBoxAdapter(
          child: Container(
            height: 110,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: gradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
        ),

        // ── Avatar overlapping cover + Info ──
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Transform.translate(
              offset: const Offset(0, -36),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar + badges row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Avatar with gold border for sports roles
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: isSportsRole
                              ? LinearGradient(colors: [
                                  AppColors.primary,
                                  AppColors.primaryDark,
                                ])
                              : null,
                          color: isSportsRole ? null : AppColors.surfaceElevated,
                        ),
                        child: CircleAvatar(
                          radius: 40,
                          backgroundColor: AppColors.backgroundSecondary,
                          backgroundImage: avatar != null && avatar.isNotEmpty
                              ? NetworkImage(avatar)
                              : null,
                          child: avatar == null || avatar.isEmpty
                              ? Text(
                                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                                  style: GoogleFonts.outfit(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w800,
                                  ),
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Badges
                      if (verified) ...[
                        _Badge(label: 'VERIFIED', color: AppColors.primary, icon: Icons.verified),
                      ],
                      const SizedBox(width: 6),
                      _Badge(
                        label: roleCfg.label.toUpperCase(),
                        color: _roleBadgeColor(role),
                        icon: _roleIcon(role),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Name
                  Text(
                    name,
                    style: GoogleFonts.outfit(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Handle + Joined date
                  Row(
                    children: [
                      Text(
                        handle.isEmpty
                            ? roleCfg.label
                            : (handle.startsWith('@') ? handle : '@$handle'),
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.mutedForeground,
                        ),
                      ),
                      if (registeredAt.isNotEmpty) ...[
                        const SizedBox(width: 10),
                        Icon(Icons.calendar_today,
                            size: 12, color: AppColors.mutedForeground.withValues(alpha: 0.6)),
                        const SizedBox(width: 4),
                        Text(
                          'Joined ${_formatDate(registeredAt)}',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                      ],
                    ],
                  ),

                  // Bio
                  if (bio.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(
                      bio,
                      style: GoogleFonts.inter(fontSize: 14, height: 1.45),
                    ),
                  ],

                  // Location
                  if (location != null && location.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            size: 14, color: AppColors.mutedForeground.withValues(alpha: 0.7)),
                        const SizedBox(width: 4),
                        Text(location,
                            style: GoogleFonts.inter(
                              fontSize: 12.5,
                              color: AppColors.mutedForeground,
                            )),
                      ],
                    ),
                  ],

                  const SizedBox(height: 18),

                  // ── Stats row (4 stats) ──
                  Row(
                    children: [
                      _StatCard(
                        value: '$fanCount',
                        label: 'Fans',
                        icon: Icons.favorite,
                        color: AppColors.primary,
                        onTap: userId.isNotEmpty ? () => _openList(context, userId, 'fans', 'Fans') : null,
                      ),
                      _StatCard(
                        value: '$followerCount',
                        label: 'Followers',
                        icon: Icons.people,
                        color: AppColors.primary,
                        onTap: userId.isNotEmpty ? () => _openList(context, userId, 'followers', 'Followers') : null,
                      ),
                      _StatCard(
                        value: '$followingCount',
                        label: 'Following',
                        icon: Icons.person_add,
                        color: AppColors.primary,
                        onTap: userId.isNotEmpty ? () => _openList(context, userId, 'following', 'Following') : null,
                      ),
                      _StatCard(value: '$postCount', label: 'Posts', icon: Icons.article, color: AppColors.primary),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // ── Action buttons ──
                  _ActionButtons(
                    isSportsRole: isSportsRole,
                    isFan: isFan,
                      fanBusy: fanBusy,
                      onToggleFan: onToggleFan,
                    following: following,
                    busy: followBusy,
                    userId: id,
                    userName: name,
                    userHandle: handle,
                    role: role,
                    onToggleFollow: onToggleFollow,
                  ),

                  const SizedBox(height: 18),

                  // ── Tab bar ──
                  SizedBox(
                    height: 42,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      itemCount: roleCfg.tabs.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 6),
                      itemBuilder: (context, i) {
                        final tab = roleCfg.tabs[i];
                        final active = tab.id == activeTab;
                        return GestureDetector(
                          onTap: () => onTabChanged(tab.id),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: active
                                  ? AppColors.primary
                                  : AppColors.surface,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              tab.label,
                              style: GoogleFonts.inter(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: active
                                    ? AppColors.primaryForeground
                                    : AppColors.mutedForeground,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 14),

                  // ── Tab content ──
                  _TabContent(
                    tabId: activeTab,
                    user: user,
                    roleCfg: roleCfg,
                    userId: id,
                  ),

                  // Bottom padding for scroll
                  const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Color _roleBadgeColor(String role) {
    switch (role.toLowerCase()) {
      case 'team':
        return const Color(0xFF3B82F6); // blue
      case 'player':
        return const Color(0xFF3B82F6);
      case 'coach':
        return const Color(0xFFF97316); // orange
      case 'league':
      case 'competition':
        return const Color(0xFF8B5CF6); // purple
      case 'stadium':
      case 'venue':
        return const Color(0xFFEAB308); // yellow
      default:
        return AppColors.mutedForeground;
    }
  }

  IconData _roleIcon(String role) {
    switch (role.toLowerCase()) {
      case 'team':
        return Icons.shield;
      case 'player':
        return Icons.person;
      case 'coach':
        return Icons.sports_soccer;
      case 'league':
      case 'competition':
        return Icons.emoji_events;
      case 'stadium':
      case 'venue':
        return Icons.stadium;
      default:
        return Icons.person;
    }
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return dateStr.length > 7 ? dateStr.substring(0, 7) : dateStr;
    }
  }
}

// ── Stat card (rounded rectangle with icon) ──

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
    this.onTap,
  });

  final String value;
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: onTap != null
                  ? AppColors.primary.withValues(alpha: 0.18)
                  : AppColors.border.withValues(alpha: 0.5),
            ),
          ),
          child: Column(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(height: 4),
              Text(
                value,
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: color,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.w500,
                      color: AppColors.mutedForeground,
                      letterSpacing: 0.3,
                    ),
                  ),
                  if (onTap != null) ...[
                    const SizedBox(width: 2),
                    Icon(Icons.chevron_right, size: 10, color: AppColors.primary.withValues(alpha: 0.6)),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}


void _openList(BuildContext context, String userId, String listType, String title) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Column(
                children: [
                  Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)))),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withValues(alpha: 0.08))),
                          child: const Icon(Icons.close, size: 16, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: FansListPage(
                userId: userId,
                title: title,
                listType: listType,
                embedded: true,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

// ── Action buttons: Follow + Become a Fan + Message + Share ──

class _ActionButtons extends StatelessWidget {
  const _ActionButtons({
    required this.isSportsRole,
    required this.isFan,
    required this.following,
    required this.busy,
    required this.fanBusy,
    required this.userId,
    required this.userName,
    required this.userHandle,
    required this.role,
    required this.onToggleFollow,
    required this.onToggleFan,
  });

  final bool isSportsRole;
  final bool isFan;
  final bool? following;
  final bool busy;
  final bool fanBusy;
  final String userId;
  final String userName;
  final String userHandle;
  final String role;
  final VoidCallback onToggleFollow;
  final VoidCallback onToggleFan;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // For sports roles: show Follow (secondary) + Become a Fan (primary)
        if (isSportsRole) ...[
          // Follow button (glass/secondary)
          Expanded(
            flex: 2,
            child: _FollowButton(
              label: following == true ? 'Following' : 'Follow',
              icon: following == true ? Icons.person_remove : Icons.person_add,
              isPrimary: false,
              busy: busy,
              onPressed: onToggleFollow,
            ),
          ),
          const SizedBox(width: 10),
          // Become a Fan button (gold/primary)
          Expanded(
            flex: 3,
            child: _FollowButton(
              label: isFan ? "You're a Fan ❤️" : 'Become a Fan',
              icon: isFan ? Icons.favorite : Icons.favorite_border,
              isPrimary: true,
              busy: fanBusy,
              onPressed: onToggleFan,
            ),
          ),
        ] else
          // For non-sports roles: Follow or Join depending on role
          Expanded(
            child: _FollowButton(
              label: _joinRoles.contains(role.toLowerCase())
                  ? (following == true ? 'Joined ✓' : 'Join')
                  : (following == true ? 'Following' : 'Follow'),
              icon: _joinRoles.contains(role.toLowerCase())
                  ? (following == true ? Icons.group : Icons.group_add)
                  : (following == true ? Icons.person_remove : Icons.person_add),
              isPrimary: following != true,
              busy: busy,
              onPressed: onToggleFollow,
            ),
          ),

        const SizedBox(width: 10),

        // Message button
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
          ),
          child: IconButton(
            icon: const Icon(Icons.chat_bubble_outline, size: 20),
            color: AppColors.mutedForeground,
            onPressed: userId.isEmpty
                ? null
                : () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ChatThreadSheet(
                          partnerId: userId,
                          partnerName: userName,
                          partnerHandle: userHandle,
                        ),
                      ),
                    );
                  },
          ),
        ),

        const SizedBox(width: 6),

        // Share / Save button
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
          ),
          child: IconButton(
            icon: const Icon(Icons.bookmark_border, size: 20),
            color: AppColors.mutedForeground,
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Saved!')),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _FollowButton extends StatelessWidget {
  const _FollowButton({
    required this.label,
    required this.icon,
    required this.isPrimary,
    required this.busy,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final bool isPrimary;
  final bool busy;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    if (isPrimary) {
      // Gold primary button
      return SizedBox(
        height: 44,
        child: ElevatedButton(
          onPressed: busy ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.primaryForeground,
            elevation: 0,
            shadowColor: AppColors.primary.withValues(alpha: 0.2),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (busy)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primaryForeground,
                  ),
                )
              else
                Icon(icon, size: 18),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Glass secondary button
    return SizedBox(
      height: 44,
      child: OutlinedButton(
        onPressed: busy ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.mutedForeground,
          side: BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (busy)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              Icon(icon, size: 18),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Badge (Verified / Role type) ──

class _Badge extends StatelessWidget {
  const _Badge({
    required this.label,
    required this.color,
    required this.icon,
  });

  final String label;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Tab content router ──

class _TabContent extends StatelessWidget {
  const _TabContent({
    required this.tabId,
    required this.user,
    required this.roleCfg,
    required this.userId,
  });

  final String tabId;
  final Map<String, dynamic> user;
  final RoleProfileConfig roleCfg;
  final String userId;

  @override
  Widget build(BuildContext context) {
    final role = (user['role'] ?? roleCfg.role).toString().toLowerCase();
    final liveTabs = {
      'career', 'statistics', 'achievements', 'matches', 'overview',
      'performance', 'rankings', 'squad', 'fixtures', 'standings', 'about',
      'feed', 'media', 'shop', 'tickets',
    };

    if (tabId == 'fans') {
      return _FansPreview(userId: userId, user: user);
    }

    if (tabId == 'overview') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (userId.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: PerformanceCard(userId: userId),
            ),
          _OverviewTab(user: user, roleCfg: roleCfg),
        ],
      );
    }

    if (tabId == 'performance' || tabId == 'rankings') {
      return Column(
        children: [
          if (userId.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: PerformanceCard(userId: userId),
            ),
          Expanded(child: RoleTabContent(tabId: tabId, role: role, profileKey: user['handle']?.toString())),
        ],
      );
    }

    if (liveTabs.contains(tabId) && role != 'fan') {
      return RoleTabContent(
        tabId: tabId,
        role: role,
        profileKey: user['handle']?.toString(),
      );
    }

    return _PlaceholderTab(
      title: roleCfg.tabs
          .firstWhere((t) => t.id == tabId,
              orElse: () => ProfileTabDef(tabId, tabId))
          .label,
      subtitle: '${roleCfg.emoji} ${roleCfg.label} section',
    );
  }
}

// ── Fans tab: quick stats + top fans preview ──

class _FansPreview extends ConsumerStatefulWidget {
  const _FansPreview({required this.userId, required this.user});
  final String userId;
  final Map<String, dynamic> user;

  @override
  ConsumerState<_FansPreview> createState() => _FansPreviewState();
}

class _FansPreviewState extends ConsumerState<_FansPreview> {
  List<Map<String, dynamic>> _fans = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = FollowsApi(ref.read(apiClientProvider));
      final fans = await api.getFans(widget.userId);
      if (!mounted) return;
      setState(() {
        _fans = fans;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Quick stats
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.bar_chart, size: 16, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    'QUICK STATS',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: AppColors.mutedForeground,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _QuickStat(
                    value: '${widget.user['fanCount'] ?? _fans.length}',
                    label: 'Fans',
                  ),
                  _QuickStat(
                    value: '${widget.user['followingCount'] ?? 0}',
                    label: 'Following',
                  ),
                  _QuickStat(
                    value: '${widget.user['postCount'] ?? 0}',
                    label: 'Posts',
                  ),
                  _QuickStat(
                    value: _formatJoinDate(
                      widget.user['registeredAt']?.toString() ??
                          widget.user['createdAt']?.toString() ??
                          '',
                    ),
                    label: 'Joined',
                    isDate: true,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Favorites / Top fans
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.star, size: 16, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    'FANS',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: AppColors.mutedForeground,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const Spacer(),
                  if (_fans.length > 3)
                    GestureDetector(
                      onTap: () => _openFansList(context, 'See all'),
                      child: Text(
                        'See all',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              if (_loading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                      strokeWidth: 2,
                    ),
                  ),
                )
              else if (_fans.isEmpty)
                Text(
                  'No fans yet.',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.mutedForeground,
                  ),
                )
              else
                ..._fans.take(5).map(
                  (fan) => _FanPreviewTile(fan: fan),
                ),
            ],
          ),
        ),
      ],
    );
  }

  void _openFansList(BuildContext context, String title) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => FansListPage(
          userId: widget.userId,
          title: title,
          listType: 'fans',
        ),
      ),
    );
  }

  String _formatJoinDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('MMM yyyy').format(dt);
    } catch (_) {
      return 'N/A';
    }
  }
}

class _QuickStat extends StatelessWidget {
  const _QuickStat({
    required this.value,
    required this.label,
    this.isDate = false,
  });

  final String value;
  final String label;
  final bool isDate;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w800,
              fontSize: isDate ? 13 : 18,
              color: isDate ? AppColors.primary : AppColors.foreground,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: AppColors.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}

class _FanPreviewTile extends StatelessWidget {
  const _FanPreviewTile({required this.fan});
  final Map<String, dynamic> fan;

  @override
  Widget build(BuildContext context) {
    final name = fan['name']?.toString() ?? 'User';
    final handle = fan['handle']?.toString() ?? '';
    final avatar = fan['avatarUrl']?.toString();
    final verified = fan['isVerified'] == true;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.surfaceElevated,
            backgroundImage:
                avatar != null && avatar.isNotEmpty ? NetworkImage(avatar) : null,
            child: avatar == null || avatar.isEmpty
                ? Text(
                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    if (verified) ...[
                      const SizedBox(width: 4),
                      Icon(Icons.verified, size: 12, color: AppColors.primary),
                    ],
                  ],
                ),
                Text(
                  handle.startsWith('@') ? handle : '@$handle',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Overview tab ──

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({required this.user, required this.roleCfg});
  final Map<String, dynamic> user;
  final RoleProfileConfig roleCfg;

  @override
  Widget build(BuildContext context) {
    final aboutMe = user['aboutMe']?.toString() ?? user['bio']?.toString() ?? '';
    final roleData = user['roleData'];
    final Map<String, dynamic> data =
        roleData is Map<String, dynamic> ? roleData : <String, dynamic>{};

    return Column(
      children: [
        if (aboutMe.isNotEmpty)
          GlassCard(
            borderRadius: 16,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ABOUT',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppColors.mutedForeground,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  aboutMe,
                  style: GoogleFonts.inter(fontSize: 13.5, height: 1.5),
                ),
              ],
            ),
          ),
        if (data.isNotEmpty) ...[
          const SizedBox(height: 12),
          GlassCard(
            borderRadius: 16,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'DETAILS',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppColors.mutedForeground,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 10),
                ...data.entries.take(8).map(
                  (e) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            _humanizeKey(e.key),
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppColors.mutedForeground,
                            ),
                          ),
                        ),
                        Text(
                          e.value?.toString() ?? '',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  String _humanizeKey(String key) {
    return key
        .replaceAllMapped(RegExp(r'[A-Z]'), (m) => ' ${m.group(0)}')
        .replaceAll('_', ' ')
        .trim()
        .split(' ')
        .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
        .join(' ');
  }
}

// ── Placeholder tab ──

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: 16,
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text(
            title,
            style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              color: AppColors.mutedForeground,
              fontSize: 13,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
