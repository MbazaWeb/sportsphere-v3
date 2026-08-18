import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../core/constants/api_config.dart';
import '../../../shared/widgets/role_badge.dart';
import '../../../widgets/glass_card.dart';
import '../domain/profile_role_registry.dart';
import '../../messages/presentation/chat_thread_sheet.dart';
import 'performance_card.dart';
import 'role_tab_content.dart';
import '../../social/data/follows_api.dart';
import 'fans_list_page.dart';
import '../../home/widgets/sportlights_tab.dart' show LiveFeedCard;

String _resolveUrl(String url) => ApiConfig.resolveUrl(url);

/// Roles that show "Become a Fan" (personal sports identity — player, coach, team, national team).
const _sportsRoles = <String>{
  'player', 'team', 'coach', 'national_team', 'club',
};

/// Roles that show "Follow" only (institutions, orgs, media).
const _joinRoles = <String>{'community'};

// ─── Tailwind gradient → Flutter Color mapping ───────────────────────────────
const Map<String, List<Color>> _tailwindGradientMap = {
  'from-emerald-600 to-emerald-900': [Color(0xFF059669), Color(0xFF064E3B)],
  'from-blue-600 to-blue-900':       [Color(0xFF2563EB), Color(0xFF1E3A8A)],
  'from-orange-600 to-orange-900':   [Color(0xFFEA580C), Color(0xFF7C2D12)],
  'from-purple-600 to-purple-900':   [Color(0xFF9333EA), Color(0xFF581C87)],
  'from-cyan-600 to-cyan-900':       [Color(0xFF0891B2), Color(0xFF164E63)],
  'from-pink-600 to-pink-900':       [Color(0xFFDB2777), Color(0xFF831843)],
  'from-yellow-600 to-yellow-900':   [Color(0xFFCA8A04), Color(0xFF713F12)],
  'from-red-600 to-red-900':         [Color(0xFFDC2626), Color(0xFF7F1D1D)],
  'from-green-600 to-green-900':     [Color(0xFF16A34A), Color(0xFF14532D)],
  'from-indigo-600 to-indigo-900':   [Color(0xFF4F46E5), Color(0xFF312E81)],
  'from-teal-600 to-teal-900':       [Color(0xFF0D9488), Color(0xFF134E4A)],
  'from-rose-600 to-rose-900':       [Color(0xFFE11D48), Color(0xFF881337)],
  'from-slate-600 to-slate-900':     [Color(0xFF475569), Color(0xFF0F172A)],
};

// ─── Role-based default cover gradients ──────────────────────────────────────
const Map<String, List<Color>> _roleCoverGradient = {
  'player':        [Color(0xFF1D4ED8), Color(0xFF1E3A8A)],
  'team':          [Color(0xFF059669), Color(0xFF064E3B)],
  'coach':         [Color(0xFFEA580C), Color(0xFF7C2D12)],
  'national_team': [Color(0xFF0891B2), Color(0xFF164E63)],
  'club':          [Color(0xFF059669), Color(0xFF064E3B)],
  'league':        [Color(0xFF9333EA), Color(0xFF581C87)],
  'competition':   [Color(0xFF9333EA), Color(0xFF581C87)],
  'academy':       [Color(0xFF16A34A), Color(0xFF14532D)],
  'media':         [Color(0xFF0369A1), Color(0xFF0C4A6E)],
  'journalist':    [Color(0xFF0369A1), Color(0xFF0C4A6E)],
  'commentator':   [Color(0xFF0369A1), Color(0xFF0C4A6E)],
  'creator':       [Color(0xFFDB2777), Color(0xFF831843)],
  'analyst':       [Color(0xFF0D9488), Color(0xFF134E4A)],
  'referee':       [Color(0xFF475569), Color(0xFF0F172A)],
  'community':     [Color(0xFF7C3AED), Color(0xFF4C1D95)],
  'business':      [Color(0xFF65A30D), Color(0xFF365314)],
  'scout':         [Color(0xFF64748B), Color(0xFF1E293B)],
  'agent':         [Color(0xFF64748B), Color(0xFF1E293B)],
  'stadium':       [Color(0xFFCA8A04), Color(0xFF713F12)],
  'venue':         [Color(0xFFCA8A04), Color(0xFF713F12)],
  'fan':           [Color(0xFF0F1D3A), Color(0xFF0A1628)],
};

List<Color> _gradientForProfile(String? coverGradient, String role) {
  if (coverGradient != null && coverGradient.isNotEmpty) {
    final mapped = _tailwindGradientMap[coverGradient];
    if (mapped != null) return mapped;
  }
  return _roleCoverGradient[role.toLowerCase()] ??
      [const Color(0xFF0F1D3A), const Color(0xFF0A1628)];
}

class UserProfileSheet extends ConsumerStatefulWidget {
  const UserProfileSheet({
    super.key,
    this.handle,
    this.userId,
    this.initialName,
    this.initialUser,
  });

  final String? handle;
  final String? userId;
  final String? initialName;
  final Map<String, dynamic>? initialUser;

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

  @override
  void initState() {
    super.initState();
    if (widget.initialUser != null) {
      _user = widget.initialUser;
      _following = _user!['isFollowing'] == true;
      _isFan = _user!['isFan'] == true;
      _loading = false;
    }
    _load();
  }

  Future<void> _load() async {
    if (_user == null) {
      setState(() { _loading = true; _error = null; });
    }
    try {
      final client = ref.read(apiClientProvider);
      Map<String, dynamic>? data;

      Map<String, dynamic>? pick(dynamic raw, {String? id, String? handle}) {
        if (raw is Map && raw['error'] == null && raw['id'] != null) {
          return Map<String, dynamic>.from(raw);
        }
        if (raw is List) {
          final h = (handle ?? '').replaceFirst('@', '').toLowerCase();
          for (final e in raw.whereType<Map>()) {
            final m = Map<String, dynamic>.from(e);
            if (id != null && m['id']?.toString() == id) return m;
            final mh = m['handle']?.toString().replaceFirst('@', '').toLowerCase() ?? '';
            if (h.isNotEmpty && mh == h) return m;
          }
          if (raw.isNotEmpty && raw.first is Map) return Map<String, dynamic>.from(raw.first as Map);
        }
        return null;
      }

      if (widget.userId != null && widget.userId!.isNotEmpty) {
        final raw = await client.getJson('/profile?id=${Uri.encodeComponent(widget.userId!)}');
        data = pick(raw, id: widget.userId);
      }
      if (data == null && widget.handle != null && widget.handle!.isNotEmpty) {
        final h = widget.handle!.replaceFirst('@', '');
        final raw = await client.getJson('/profile?handle=${Uri.encodeComponent(h)}');
        data = pick(raw, handle: h);
        if (data == null) {
          final raw2 = await client.getJson('/users?handle=${Uri.encodeComponent('@$h')}');
          data = pick(raw2, handle: h);
        }
      }

      if (!mounted) return;
      if (data != null) {
        final d = data;
        setState(() {
          _user = d;
          _loading = false;
          _following = d['isFollowing'] == true;
          _isFan = d['isFan'] == true;
        });
      } else if (_user == null) {
        setState(() { _loading = false; _error = 'User not found'; });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (_user == null) _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  Future<void> _toggleFollow() async {
    final id = _user?['id']?.toString();
    if (id == null || id.isEmpty) return;
    if (!ref.read(authProvider).isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to follow')));
      return;
    }
    setState(() => _followBusy = true);
    try {
      final res = await FollowsApi(ref.read(apiClientProvider)).toggle(id);
      if (!mounted) return;
      setState(() {
        _followBusy = false;
        _following = (res['following'] == true || res['isFan'] == true);
        if (res['fanCount'] != null) {
          _user = Map<String, dynamic>.from(_user!)
            ..['fanCount'] = res['fanCount']
            ..['followerCount'] = res['followerCount'];
        }
      });
    } catch (e) {
      if (mounted) setState(() => _followBusy = false);
    }
  }

  Future<void> _toggleFan() async {
    final id = _user?['id']?.toString();
    if (id == null || id.isEmpty) return;
    if (!ref.read(authProvider).isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to become a fan')));
      return;
    }
    setState(() => _fanBusy = true);
    try {
      final res = await FollowsApi(ref.read(apiClientProvider)).becomeFan(id);
      if (!mounted) return;
      final nowFan = res['isFan'] == true || res['following'] == true;
      setState(() {
        _fanBusy = false;
        _isFan = nowFan;
        if (nowFan) _following = true;
      });
      if (res['fanCount'] != null) {
        _user = Map<String, dynamic>.from(_user!)
          ..['fanCount'] = res['fanCount']
          ..['followerCount'] = res['followerCount'];
      }
    } catch (e) {
      if (mounted) setState(() => _fanBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _user == null) {
      return const Scaffold(backgroundColor: AppColors.background, body: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)));
    }
    if (_error != null && _user == null) {
      return Scaffold(backgroundColor: AppColors.background, body: _ErrorView(error: _error!, onRetry: _load));
    }
    if (_user == null) {
      return const Scaffold(backgroundColor: AppColors.background, body: Center(child: Text('User not found')));
    }

    final u = _user!;
    final role = (u['role']?.toString() ?? 'fan').toLowerCase();
    final roleCfg = ProfileRoleRegistry.forRole(role);
    final isSportsRole = _sportsRoles.contains(role);
    final isFan = _isFan ?? (_following == true && isSportsRole);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: _ProfileContent(
        user: u,
        roleCfg: roleCfg,
        isSportsRole: isSportsRole,
        following: _following,
        isFan: isFan,
        followBusy: _followBusy,
        fanBusy: _fanBusy,
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
            Text(error, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.mutedForeground)),
            const SizedBox(height: 16),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _ProfileContent extends ConsumerWidget {
  const _ProfileContent({
    required this.user,
    required this.roleCfg,
    required this.isSportsRole,
    required this.following,
    required this.isFan,
    required this.followBusy,
    required this.fanBusy,
    required this.activeTab,
    required this.onTabChanged,
    required this.onToggleFollow,
    required this.onToggleFan,
  });

  final Map<String, dynamic> user;
  final RoleProfileConfig roleCfg;
  final bool isSportsRole;
  final bool? following;
  final bool isFan;
  final bool followBusy;
  final bool fanBusy;
  final String activeTab;
  final ValueChanged<String> onTabChanged;
  final VoidCallback onToggleFollow;
  final VoidCallback onToggleFan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = user['name']?.toString() ?? 'User';
    final handle = user['handle']?.toString() ?? '';
    final bio = user['bio']?.toString() ?? '';
    final avatar = user['avatarUrl']?.toString() ?? user['avatar']?.toString();
    final verified = user['isVerified'] == true;
    final isPro = user['isPro'] == true;
    final role = user['role']?.toString() ?? 'fan';
    final typeName = user['typeName']?.toString();
    final location = user['location']?.toString();
    final registeredAt = user['registeredAt']?.toString() ?? user['createdAt']?.toString() ?? '';
    final id = user['id']?.toString() ?? '';

    final fanCount = (user['fanCount'] as num?)?.toInt() ?? 0;
    final followerCount = (user['followerCount'] as num?)?.toInt() ?? 0;
    final followingCount = (user['followingCount'] as num?)?.toInt() ?? 0;
    final postCount = (user['postCount'] as num?)?.toInt() ?? 0;

    final coverGradient = user['coverGradient']?.toString();
    final gradient = _gradientForProfile(coverGradient, role);

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          pinned: true,
          leading: Container(
            margin: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: AppColors.surface.withValues(alpha: 0.8), shape: BoxShape.circle),
            child: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 16), onPressed: () => Navigator.pop(context)),
          ),
          title: Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15)),
          centerTitle: false,
        ),
        SliverToBoxAdapter(
          child: Container(
            height: 120,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            child: Transform.translate(
              offset: const Offset(0, -40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.background,
                          border: isSportsRole ? Border.all(color: AppColors.primary, width: 2) : null,
                        ),
                        child: CircleAvatar(
                          radius: 44,
                          backgroundColor: AppColors.backgroundSecondary,
                          backgroundImage: avatar != null && avatar.isNotEmpty ? NetworkImage(_resolveUrl(avatar)) : null,
                          child: avatar == null || avatar.isEmpty ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w800)) : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: BadgeStack(role: role, isVerified: verified, isPro: isPro, typeName: typeName),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(name, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                  Row(
                    children: [
                      Text(handle.startsWith('@') ? handle : '@$handle', style: GoogleFonts.inter(fontSize: 14, color: AppColors.mutedForeground)),
                      if (registeredAt.isNotEmpty) ...[
                        const SizedBox(width: 10),
                        Icon(Icons.calendar_today, size: 12, color: AppColors.mutedForeground.withValues(alpha: 0.5)),
                        const SizedBox(width: 4),
                        Text('Joined ${_formatDate(registeredAt)}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground.withValues(alpha: 0.7))),
                      ],
                    ],
                  ),
                  if (bio.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 10), child: Text(bio, style: GoogleFonts.inter(fontSize: 14.5, height: 1.4))),
                  if (location != null && location.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Row(children: [const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedForeground), const SizedBox(width: 4), Text(location, style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground))])),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      _StatCard(value: '$fanCount', label: isSportsRole ? 'Supporters' : 'Fans', color: AppColors.primary, onTap: id.isNotEmpty ? () => _openList(context, id, 'fans', isSportsRole ? 'Supporters' : 'Fans') : null),
                      _StatCard(value: '$followingCount', label: 'Following', color: AppColors.primary, onTap: id.isNotEmpty ? () => _openList(context, id, 'following', 'Following') : null),
                      _StatCard(value: '$postCount', label: 'Posts', color: AppColors.primary),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _ActionButtons(isSportsRole: isSportsRole, isFan: isFan, following: following, busy: followBusy, fanBusy: fanBusy, userId: id, userName: name, userHandle: handle, role: role, onToggleFollow: onToggleFollow, onToggleFan: onToggleFan),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: roleCfg.tabs.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, i) {
                        final tab = roleCfg.tabs[i];
                        final active = tab.id == activeTab;
                        return GestureDetector(
                          onTap: () => onTabChanged(tab.id),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(color: active ? AppColors.primary : AppColors.surface, borderRadius: BorderRadius.circular(20)),
                            child: Text(tab.label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: active ? AppColors.primaryForeground : AppColors.mutedForeground)),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  _TabContent(tabId: activeTab, user: user, roleCfg: roleCfg, userId: id),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${months[dt.month - 1]} ${dt.year}';
    } catch (_) { return ''; }
  }

  void _openList(BuildContext context, String userId, String listType, String title) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.85, maxChildSize: 0.95, minChildSize: 0.5,
        builder: (_, scrollCtrl) => Container(
          decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: const BorderRadius.vertical(top: Radius.circular(24)), border: Border.all(color: Colors.white10)),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                child: Column(children: [Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)))), const SizedBox(height: 14), Row(children: [GestureDetector(onTap: () => Navigator.pop(context), child: Container(width: 36, height: 36, decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.close, size: 16, color: Colors.white))), const SizedBox(width: 12), Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800))])]),
              ),
              const SizedBox(height: 8),
              Expanded(child: FansListPage(userId: userId, title: title, listType: listType, embedded: true)),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.value, required this.label, required this.color, this.onTap});
  final String value, label;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: onTap != null ? AppColors.primary.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.05))),
          child: Column(
            children: [
              Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 18, color: color)),
              const SizedBox(height: 2),
              Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.mutedForeground, letterSpacing: 0.5)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButtons extends StatelessWidget {
  const _ActionButtons({required this.isSportsRole, required this.isFan, required this.following, required this.busy, required this.fanBusy, required this.userId, required this.userName, required this.userHandle, required this.role, required this.onToggleFollow, required this.onToggleFan});
  final bool isSportsRole, isFan, busy, fanBusy;
  final bool? following;
  final String userId, userName, userHandle, role;
  final VoidCallback onToggleFollow, onToggleFan;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (isSportsRole) ...[
          Expanded(flex: 3, child: _Btn(label: isFan ? "You're a Fan" : 'Become a Fan', icon: isFan ? Icons.favorite : Icons.favorite_border, primary: true, busy: fanBusy, onPressed: onToggleFan)),
          const SizedBox(width: 8),
          Expanded(flex: 2, child: _Btn(label: following == true ? 'Following' : 'Follow', icon: following == true ? Icons.person_remove : Icons.person_add, primary: false, busy: busy, onPressed: onToggleFollow)),
        ] else
          Expanded(child: _Btn(label: _joinRoles.contains(role) ? (following == true ? 'Joined' : 'Join') : (following == true ? 'Following' : 'Follow'), icon: following == true ? Icons.check : Icons.person_add, primary: following != true, busy: busy, onPressed: onToggleFollow)),
        const SizedBox(width: 10),
        _CircleBtn(icon: Icons.chat_bubble_outline, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ChatThreadSheet(partnerId: userId, partnerName: userName, partnerHandle: userHandle)))),
        const SizedBox(width: 8),
        _CircleBtn(icon: Icons.bookmark_border, onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved to your collection')));
        }),
      ],
    );
  }
}

class _Btn extends StatelessWidget {
  const _Btn({required this.label, required this.icon, required this.primary, required this.busy, required this.onPressed});
  final String label; final IconData icon; final bool primary, busy; final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) {
    return SizedBox(height: 48, child: ElevatedButton(onPressed: busy ? null : onPressed, style: ElevatedButton.styleFrom(backgroundColor: primary ? AppColors.primary : AppColors.surface, foregroundColor: primary ? AppColors.primaryForeground : AppColors.foreground, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: primary ? BorderSide.none : const BorderSide(color: Colors.white10))), child: busy ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(icon, size: 18), const SizedBox(width: 8), Flexible(child: Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 13), overflow: TextOverflow.ellipsis))])));
  }
}

class _CircleBtn extends StatelessWidget {
  const _CircleBtn({required this.icon, required this.onTap});
  final IconData icon; final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return Container(decoration: BoxDecoration(color: AppColors.surface, shape: BoxShape.circle, border: Border.all(color: Colors.white10)), child: IconButton(icon: Icon(icon, size: 20, color: AppColors.mutedForeground), onPressed: onTap));
  }
}

class _TabContent extends StatelessWidget {
  const _TabContent({required this.tabId, required this.user, required this.roleCfg, required this.userId});
  final String tabId; final Map<String, dynamic> user; final RoleProfileConfig roleCfg; final String userId;
  @override
  Widget build(BuildContext context) {
    final role = (user['role'] ?? roleCfg.role).toString().toLowerCase();
    if (tabId == 'fans') return _FansPreview(userId: userId, user: user);
    if (tabId == 'overview') return Column(children: [if (userId.isNotEmpty) Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: PerformanceCard(userId: userId)), _OverviewTab(user: user)]);
    return SizedBox(height: 400, child: RoleTabContent(tabId: tabId, role: role, profileKey: user['handle']?.toString()));
  }
}

class _FansPreview extends ConsumerStatefulWidget {
  const _FansPreview({required this.userId, required this.user});
  final String userId; final Map<String, dynamic> user;
  @override ConsumerState<_FansPreview> createState() => _FansPreviewState();
}
class _FansPreviewState extends ConsumerState<_FansPreview> {
  List<Map<String, dynamic>> _fans = []; bool _loading = true;
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final fans = await FollowsApi(ref.read(apiClientProvider)).getFans(widget.userId);
      if (mounted) setState(() { _fans = fans; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }
  @override Widget build(BuildContext context) {
    return Column(children: [
      GlassCard(borderRadius: 16, padding: const EdgeInsets.all(16), child: Row(children: [_QuickStat(value: '${widget.user['fanCount'] ?? 0}', label: 'Fans'), _QuickStat(value: '${widget.user['followingCount'] ?? 0}', label: 'Following'), _QuickStat(value: '${widget.user['postCount'] ?? 0}', label: 'Posts')])),
      const SizedBox(height: 12),
      GlassCard(borderRadius: 16, padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Row(children: [const Icon(Icons.star, size: 16, color: AppColors.primary), const SizedBox(width: 8), Text('FANS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.mutedForeground, letterSpacing: 1.2))]), const SizedBox(height: 12), if (_loading) const Center(child: CircularProgressIndicator()) else if (_fans.isEmpty) const Text('No fans yet.', style: TextStyle(color: Colors.white54)) else ..._fans.take(5).map((f) => _FanTile(f: f))])),
    ]);
  }
}

class _QuickStat extends StatelessWidget {
  const _QuickStat({required this.value, required this.label}); final String value, label;
  @override Widget build(BuildContext context) { return Expanded(child: Column(children: [Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)), Text(label, style: const TextStyle(fontSize: 10, color: Colors.white54))])); }
}

class _FanTile extends StatelessWidget {
  const _FanTile({required this.f}); final Map<String, dynamic> f;
  @override Widget build(BuildContext context) {
    final name = f['name']?.toString() ?? 'User';
    return Padding(padding: const EdgeInsets.only(bottom: 10), child: Row(children: [CircleAvatar(radius: 18, backgroundImage: f['avatarUrl'] != null ? NetworkImage(_resolveUrl(f['avatarUrl'])) : null, child: f['avatarUrl'] == null ? Text(name[0]) : null), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)), Text('@${f['handle']}', style: const TextStyle(fontSize: 11, color: Colors.white54))]))]));
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({required this.user}); final Map<String, dynamic> user;
  @override Widget build(BuildContext context) {
    final about = user['aboutMe']?.toString() ?? user['bio']?.toString() ?? '';
    final roleData = user['roleData'] is Map ? Map<String, dynamic>.from(user['roleData'] as Map) : <String, dynamic>{};
    return Column(children: [
      if (about.isNotEmpty) GlassCard(borderRadius: 16, padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('ABOUT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white54, letterSpacing: 1.2)), const SizedBox(height: 8), Text(about, style: const TextStyle(fontSize: 14, height: 1.5))])),
      if (roleData.isNotEmpty) ...[const SizedBox(height: 12), GlassCard(borderRadius: 16, padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('DETAILS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white54, letterSpacing: 1.2)), const SizedBox(height: 10), ...roleData.entries.take(8).map((e) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [Expanded(child: Text(e.key.toUpperCase(), style: const TextStyle(fontSize: 11, color: Colors.white54))), Text(e.value?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))])))]))],
    ]);
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({required this.title, required this.subtitle}); final String title, subtitle;
  @override Widget build(BuildContext context) { return GlassCard(borderRadius: 16, padding: const EdgeInsets.all(24), child: Column(children: [Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)), const SizedBox(height: 8), Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white54, fontSize: 13))])); }
}

// ══════════════════════════════════════════════════════════════════════════════
// TEAM PROFILE TABS
// ══════════════════════════════════════════════════════════════════════════════

// ─── Team Overview Tab ────────────────────────────────────────────────────────
// About + Stats + History + Achievements + Community fans
class _TeamOverviewTab extends ConsumerStatefulWidget {
  const _TeamOverviewTab({required this.user, required this.userId, required this.roleCfg});
  final Map<String, dynamic> user;
  final String userId;
  final RoleProfileConfig roleCfg;

  @override
  ConsumerState<_TeamOverviewTab> createState() => _TeamOverviewTabState();
}

class _TeamOverviewTabState extends ConsumerState<_TeamOverviewTab> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final key = widget.user['handle']?.toString() ?? widget.userId;
      final data = await ref.read(profileDataApiProvider).fetch(type: 'team', key: key);
      if (!mounted) return;
      setState(() { _data = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openList(BuildContext ctx, String userId, String type, String title) {
    Navigator.push(ctx, MaterialPageRoute(
      builder: (_) => FansListPage(userId: userId, listType: type, title: title),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final u = widget.user;
    final name = u['name']?.toString() ?? '';
    final bio = u['bio']?.toString() ?? '';
    final location = u['location']?.toString();
    final fanCount = u['fanCount'] ?? 0;
    final followerCount = u['followerCount'] ?? 0;
    final postCount = u['postCount'] ?? 0;
    final d = _data ?? {};

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [

        // ── About ────────────────────────────────────────────────────────────
        GlassCard(
          borderRadius: 16,
          goldAccent: true,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionHeader('About', Icons.info_outline),
              const SizedBox(height: 10),
              if (bio.isNotEmpty) ...[
                Text(bio, style: GoogleFonts.inter(fontSize: 14, height: 1.5, color: AppColors.foreground.withValues(alpha: 0.9))),
                const SizedBox(height: 10),
              ],
              if (location != null) _InfoRow(Icons.location_on_outlined, location),
              if (d['founded'] != null) _InfoRow(Icons.calendar_today_outlined, 'Founded ${d['founded']}'),
              if (d['stadium'] != null) _InfoRow(Icons.stadium_outlined, d['stadium'].toString()),
              if (d['league'] != null) _InfoRow(Icons.emoji_events_outlined, d['league'].toString()),
              if (d['country'] != null) _InfoRow(Icons.flag_outlined, d['country'].toString()),
              if (d['manager'] != null) _InfoRow(Icons.person_outlined, 'Manager: ${d['manager']}'),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // ── Quick Stats ───────────────────────────────────────────────────────
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionHeader('Stats', Icons.bar_chart_rounded),
              const SizedBox(height: 12),
              Row(
                children: [
                  _StatBox('$fanCount', 'Fans', AppColors.primary),
                  _StatBox('$followerCount', 'Followers', const Color(0xFF3B82F6)),
                  _StatBox('$postCount', 'Posts', const Color(0xFF10B981)),
                  if (d['trophies'] != null)
                    _StatBox('${d['trophies']}', 'Trophies', const Color(0xFFEAB308)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // ── History ───────────────────────────────────────────────────────────
        if (d['history'] != null || d['description'] != null) ...[
          GlassCard(
            borderRadius: 16,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionHeader('History', Icons.history_rounded),
                const SizedBox(height: 10),
                Text(
                  d['history']?.toString() ?? d['description']?.toString() ?? '',
                  style: GoogleFonts.inter(fontSize: 13, height: 1.55, color: AppColors.foreground.withValues(alpha: 0.85)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // ── Achievements / Honours ────────────────────────────────────────────
        if (_loading)
          const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)))
        else if (d['honours'] is List && (d['honours'] as List).isNotEmpty) ...[
          GlassCard(
            borderRadius: 16,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionHeader('Achievements', Icons.emoji_events_rounded),
                const SizedBox(height: 10),
                ...(d['honours'] as List).take(6).map((h) {
                  final honour = h is Map ? Map<String, dynamic>.from(h) : {};
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.emoji_events, size: 16, color: AppColors.primary),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(honour['title']?.toString() ?? h.toString(),
                                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                              if (honour['year'] != null)
                                Text(honour['year'].toString(),
                                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // ── Community (Fans) ──────────────────────────────────────────────────
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionHeader('Community', Icons.favorite_rounded),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.favorite, size: 20, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text('$fanCount fans supporting $name',
                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground)),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.people_outline, size: 20, color: Color(0xFF3B82F6)),
                  const SizedBox(width: 8),
                  Text('$followerCount followers',
                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground)),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.people_alt_outlined, size: 16),
                  label: const Text('View all fans'),
                  onPressed: () => _openList(context, widget.userId, 'fans', 'Fans'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: BorderSide(color: AppColors.primary.withValues(alpha: 0.4)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Team Spotlights Tab ──────────────────────────────────────────────────────
class _TeamSpotlightsTab extends ConsumerStatefulWidget {
  const _TeamSpotlightsTab({required this.userId, required this.user});
  final String userId;
  final Map<String, dynamic> user;

  @override
  ConsumerState<_TeamSpotlightsTab> createState() => _TeamSpotlightsTabState();
}

class _TeamSpotlightsTabState extends ConsumerState<_TeamSpotlightsTab> {
  String _sub = 'posts';
  List<dynamic> _posts = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final all = await ref.read(feedApiProvider).getFeed(userId: widget.userId, limit: 50, offset: 0);
      if (!mounted) return;
      setState(() {
        _posts = all;
        _loading = false;
      });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _sub == 'media'
        ? _posts.where((p) => (p.mediaUrls as List).isNotEmpty).toList()
        : _sub == 'videos'
            ? _posts.where((p) => p.postType == 'video' || p.postType == 'spotlight').toList()
            : _posts;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
          child: Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: Row(children: [
              _SubPill('posts', 'Posts', _sub, (v) => setState(() => _sub = v)),
              _SubPill('media', 'Photos', _sub, (v) => setState(() => _sub = v)),
              _SubPill('videos', 'Videos', _sub, (v) => setState(() => _sub = v)),
            ]),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
              : filtered.isEmpty
                  ? Center(child: Text('No ${_sub} yet', style: GoogleFonts.inter(color: AppColors.mutedForeground)))
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const Divider(height: 1, color: Colors.white10),
                      itemBuilder: (ctx, i) => LiveFeedCard(post: filtered[i], index: i),
                    ),
        ),
      ],
    );
  }
}

// ─── Team Squad Tab ───────────────────────────────────────────────────────────
// Squad list + Fixtures + Standings in sub-tabs
class _TeamSquadTab extends ConsumerStatefulWidget {
  const _TeamSquadTab({required this.user, required this.profileKey});
  final Map<String, dynamic> user;
  final String profileKey;

  @override
  ConsumerState<_TeamSquadTab> createState() => _TeamSquadTabState();
}

class _TeamSquadTabState extends ConsumerState<_TeamSquadTab> {
  String _sub = 'squad';

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
          child: Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: Row(children: [
              _SubPill('squad', 'Squad', _sub, (v) => setState(() => _sub = v)),
              _SubPill('fixtures', 'Fixtures', _sub, (v) => setState(() => _sub = v)),
              _SubPill('standings', 'Standings', _sub, (v) => setState(() => _sub = v)),
            ]),
          ),
        ),
        Expanded(
          child: RoleTabContent(
            tabId: _sub,
            role: 'team',
            profileKey: widget.profileKey,
          ),
        ),
      ],
    );
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title, this.icon);
  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 14, color: AppColors.primary),
      const SizedBox(width: 6),
      Text(title.toUpperCase(),
        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800,
          color: AppColors.primary, letterSpacing: 1)),
    ],
  );
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.icon, this.text);
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(children: [
      Icon(icon, size: 14, color: AppColors.mutedForeground),
      const SizedBox(width: 8),
      Expanded(child: Text(text, style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground))),
    ]),
  );
}

class _StatBox extends StatelessWidget {
  const _StatBox(this.value, this.label, this.color);
  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(children: [
      Text(value, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
      Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground)),
    ]),
  );
}

class _SubPill extends StatelessWidget {
  const _SubPill(this.id, this.label, this.active, this.onTap);
  final String id, label, active;
  final ValueChanged<String> onTap;

  @override
  Widget build(BuildContext context) {
    final isActive = id == active;
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: const EdgeInsets.symmetric(vertical: 7),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
          ),
          alignment: Alignment.center,
          child: Text(label,
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700,
              color: isActive ? AppColors.primaryForeground : AppColors.mutedForeground)),
        ),
      ),
    );
  }
}
