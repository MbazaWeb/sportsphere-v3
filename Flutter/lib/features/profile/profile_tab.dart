import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/providers/app_providers.dart';
import '../../core/security/biometric_lock.dart';
import '../../shared/models/user_profile.dart';
import '../../shared/models/post.dart';
import '../../theme/app_colors.dart';
import '../../core/constants/api_config.dart';
import '../../widgets/glass_card.dart';
import '../../shared/widgets/role_badge.dart';
import '../home/widgets/sportlights_tab.dart' show LiveFeedCard, FeedErrorView;
import 'domain/profile_role_registry.dart';
import 'presentation/edit_profile_sheet.dart';
import 'presentation/settings_sheet.dart';
import 'presentation/saved_sheet.dart';
import 'presentation/fans_list_page.dart';
import 'presentation/role_upgrade_sheet.dart';
import 'presentation/role_tab_content.dart';
import 'presentation/performance_card.dart';

// ─── Colors matching web globals.css ─────────────────────────────────────────
// --primary: #F5C518  (gold)
// --background: #0A1628
// --background-secondary: #0F1D3A
// --surface: rgba(255,255,255,0.05)
// --surface-elevated: rgba(255,255,255,0.07)
// --muted-foreground: rgba(255,255,255,0.5)


String _resolveProfileUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final base = ApiConfig.baseUrl;
  return url.startsWith('/') ? '$base$url' : '$base/$url';
}

class ProfileTab extends ConsumerStatefulWidget {
  const ProfileTab({
    super.key,
    this.isAuthenticated = false,
    this.onSignIn,
    this.onSignOut,
  });

  final bool isAuthenticated;
  final VoidCallback? onSignIn;
  final Future<void> Function()? onSignOut;

  @override
  ConsumerState<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends ConsumerState<ProfileTab> {
  String _activeTab = 'overview';

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final authed = auth.isAuthenticated;

    if (!authed || user == null) {
      return _GuestProfile(onSignIn: widget.onSignIn);
    }

    final profile = user;
    final roleCfg = ProfileRoleRegistry.forRole(
        profile.role ?? profile.roleName ?? 'fan');

    if (!roleCfg.tabs.any((t) => t.id == _activeTab)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _activeTab = roleCfg.tabs.first.id);
      });
    }

    return SafeArea(
      child: NestedScrollView(
        headerSliverBuilder: (context, inner) => [
          SliverToBoxAdapter(
              child: _ProfileHeader(user: profile, roleCfg: roleCfg)),
          if (profile.verificationStatus == 'pending')
            const VerificationBanner(),
          SliverToBoxAdapter(
            child: _RoleTabBar(
              tabs: roleCfg.tabs,
              activeId: _activeTab,
              onChanged: (id) => setState(() => _activeTab = id),
            ),
          ),
        ],
        body: _RoleTabBody(
          tabId: _activeTab,
          user: profile,
          roleCfg: roleCfg,
          onEdit: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => const EditProfileSheet(),
            );
          },
          onSignOut: widget.onSignOut,
        ),
      ),
    );
  }
}

// ─── Verification Banner ──────────────────────────────────────────────────────
class VerificationBanner extends StatelessWidget {
  const VerificationBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
        child: GlassCard(
          borderRadius: 14,
          padding: const EdgeInsets.all(12),
          borderColor: const Color(0xFFFBBF24).withValues(alpha: 0.35),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFFBBF24).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.schedule,
                    color: Color(0xFFFBBF24), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Verification in progress',
                        style: GoogleFonts.inter(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: const Color(0xFFFBBF24))),
                    Text('Your role profile is under review.',
                        style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.mutedForeground)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Guest ────────────────────────────────────────────────────────────────────
class _GuestProfile extends StatelessWidget {
  const _GuestProfile({this.onSignIn});
  final VoidCallback? onSignIn;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: GlassCard(
            borderRadius: 24,
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.person_outline,
                    size: 48, color: AppColors.primary),
                const SizedBox(height: 16),
                Text('Your profile',
                    style: GoogleFonts.outfit(
                        fontSize: 20, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(
                  'Sign in to see your role-based profile, stats, and tabs.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                      color: AppColors.mutedForeground, fontSize: 14),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                      onPressed: onSignIn,
                      child: const Text('Sign in')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Profile Header (matches web ProfileHeader / ProfileCover) ────────────────
class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.user, required this.roleCfg});
  final UserProfile user;
  final RoleProfileConfig roleCfg;

  @override
  Widget build(BuildContext context) {
    final handle =
        user.handle.startsWith('@') ? user.handle : '@${user.handle}';
    final stats = _statsFor(user, roleCfg);

    return Column(
      children: [
        // Cover — dark navy gradient matching web --background-secondary
        Container(
          height: 130,
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF0F1D3A), // --background-secondary
                Color(0xFF1A2A4A),
                Color(0xFF0A1628), // --background
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            image: user.coverUrl != null && user.coverUrl!.isNotEmpty
                ? DecorationImage(
                    image: NetworkImage(_resolveProfileUrl(user.coverUrl!)), fit: BoxFit.cover)
                : null,
          ),
        ),
        Transform.translate(
          offset: const Offset(0, -36),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Avatar — gold border when verified (matches web)
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: (user.isVerified || user.isPro)
                              ? AppColors.primary
                              : AppColors.surfaceElevated,
                          width: 3,
                        ),
                      ),
                      child: CircleAvatar(
                        radius: 44,
                        backgroundColor: AppColors.surfaceElevated,
                        backgroundImage:
                            user.avatarUrl != null && user.avatarUrl!.isNotEmpty
                                ? NetworkImage(_resolveProfileUrl(user.avatarUrl!))
                                : null,
                        child: user.avatarUrl == null || user.avatarUrl!.isEmpty
                            ? Text(
                                user.name.isNotEmpty
                                    ? user.name[0].toUpperCase()
                                    : '?',
                                style: GoogleFonts.outfit(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w800),
                              )
                            : null,
                      ),
                    ),
                    const Spacer(),
                    BadgeStack(
                      role: user.role ?? roleCfg.role,
                      isVerified: user.isVerified,
                      isPro: user.isPro,
                      typeName: user.typeName,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(user.name,
                      style: GoogleFonts.outfit(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.3)),
                ),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '$handle · ${roleCfg.emoji} ${roleCfg.label}',
                    style: GoogleFonts.inter(
                        fontSize: 13, color: AppColors.mutedForeground),
                  ),
                ),
                if (user.bio.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(user.bio,
                        style:
                            GoogleFonts.inter(fontSize: 14, height: 1.4)),
                  ),
                ],
                if (user.location != null && user.location!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 14, color: AppColors.mutedForeground),
                        const SizedBox(width: 4),
                        Text(user.location!,
                            style: GoogleFonts.inter(
                                fontSize: 12.5,
                                color: AppColors.mutedForeground)),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                // Stats bar — gold values, matching web StatCard style
                Row(
                  children: stats
                      .asMap()
                      .entries
                      .map(
                        (e) {
                          final i = e.key;
                          final s = e.value;
                          VoidCallback? onTap;
                          if (s.$2 == 'Fans' && user.id.isNotEmpty) {
                            onTap = () { showModalBottomSheet(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (_) => DraggableScrollableSheet(initialChildSize: 0.85, maxChildSize: 0.95, minChildSize: 0.5, builder: (ctx, __) => Container(decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))), child: Column(children: [Padding(padding: const EdgeInsets.fromLTRB(16,14,16,8), child: Row(children: [GestureDetector(onTap: () => Navigator.pop(ctx), child: Container(width:36,height:36,decoration: BoxDecoration(color: Colors.white12, borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.close,size:16,color:Colors.white))), const SizedBox(width:12), const Text('Fans', style: TextStyle(fontSize:18,fontWeight:FontWeight.w800,color:Colors.white))])), Expanded(child: FansListPage(userId: user.id, title: 'Fans', listType: 'fans', embedded: true))]))));  };
                          } else if (s.$2 == 'Fans' || s.$2 == 'Followers') {
                            onTap = () { showModalBottomSheet(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (_) => DraggableScrollableSheet(initialChildSize: 0.85, maxChildSize: 0.95, minChildSize: 0.5, builder: (ctx, __) => Container(decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))), child: Column(children: [Padding(padding: const EdgeInsets.fromLTRB(16,14,16,8), child: Row(children: [GestureDetector(onTap: () => Navigator.pop(ctx), child: Container(width:36,height:36,decoration: BoxDecoration(color: Colors.white12, borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.close,size:16,color:Colors.white))), const SizedBox(width:12), const Text('Followers', style: TextStyle(fontSize:18,fontWeight:FontWeight.w800,color:Colors.white))])), Expanded(child: FansListPage(userId: user.id, title: 'Followers', listType: 'followers', embedded: true))]))));  };
                          } else if (s.$2 == 'Following') {
                            onTap = () { showModalBottomSheet(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (_) => DraggableScrollableSheet(initialChildSize: 0.85, maxChildSize: 0.95, minChildSize: 0.5, builder: (ctx, __) => Container(decoration: BoxDecoration(color: AppColors.backgroundSecondary, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))), child: Column(children: [Padding(padding: const EdgeInsets.fromLTRB(16,14,16,8), child: Row(children: [GestureDetector(onTap: () => Navigator.pop(ctx), child: Container(width:36,height:36,decoration: BoxDecoration(color: Colors.white12, borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.close,size:16,color:Colors.white))), const SizedBox(width:12), const Text('Following', style: TextStyle(fontSize:18,fontWeight:FontWeight.w800,color:Colors.white))])), Expanded(child: FansListPage(userId: user.id, title: 'Following', listType: 'following', embedded: true))]))));  };
                          }
                          return Expanded(
                            child: GestureDetector(
                              onTap: onTap,
                              child: Column(
                                children: [
                                  Text(s.$1,
                                      style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                          color: AppColors.primary)),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(s.$2,
                                          style: GoogleFonts.inter(
                                              fontSize: 11,
                                              color: AppColors.mutedForeground)),
                                      if (onTap != null)
                                        Icon(Icons.chevron_right, size: 10, color: AppColors.primary.withValues(alpha: 0.5)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      )
                      .toList(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  List<(String, String)> _statsFor(
      UserProfile u, RoleProfileConfig cfg) {
    final values = <String>[
      '${u.postCount}',
      '${u.followerCount > 0 ? u.followerCount : u.fanCount}',
      '${u.followingCount}',
      if (cfg.statLabels.length > 3) '—',
    ];
    final out = <(String, String)>[];
    for (var i = 0; i < cfg.statLabels.length && i < 4; i++) {
      out.add(
          (values[i.clamp(0, values.length - 1)], cfg.statLabels[i]));
    }
    return out;
  }
}

// ─── Badge chip — matches web RoleBadge / GoldBadge ──────────────────────────
class _Badge extends StatelessWidget {
  const _Badge({required this.label, this.emoji, this.gold = false});
  final String label;
  final String? emoji;
  final bool gold;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: gold
            ? AppColors.primary.withValues(alpha: 0.15)
            : Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
            color: gold
                ? AppColors.primary.withValues(alpha: 0.4)
                : AppColors.border),
      ),
      child: Text(
        emoji != null ? '$emoji $label' : label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: gold ? AppColors.primary : AppColors.mutedForeground,
        ),
      ),
    );
  }
}

// ─── Tab Bar — gold active pill, matches web ProfileTabs ─────────────────────
class _RoleTabBar extends StatelessWidget {
  const _RoleTabBar(
      {required this.tabs,
      required this.activeId,
      required this.onChanged});
  final List<ProfileTabDef> tabs;
  final String activeId;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
            bottom: BorderSide(
                color: AppColors.border.withValues(alpha: 0.6))),
      ),
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        itemCount: tabs.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (context, i) {
          final t = tabs[i];
          final active = t.id == activeId;
          return GestureDetector(
            onTap: () => onChanged(t.id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                // Gold bg when active — matches web `bg-gold text-black`
                color: active
                    ? AppColors.primary
                    : AppColors.surface,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                t.label,
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
    );
  }
}

// ─── Tab Body dispatcher ──────────────────────────────────────────────────────
class _RoleTabBody extends StatelessWidget {
  const _RoleTabBody({
    required this.tabId,
    required this.user,
    required this.roleCfg,
    required this.onEdit,
    this.onSignOut,
  });

  final String tabId;
  final UserProfile user;
  final RoleProfileConfig roleCfg;
  final VoidCallback onEdit;
  final Future<void> Function()? onSignOut;

  @override
  Widget build(BuildContext context) {
    final role = roleCfg.role;

    switch (tabId) {
      // ── Overview = overview + achievements + about (merged) ───────────────
      case 'overview':
        return _OverviewBody(
          user: user,
          roleCfg: roleCfg,
          onEdit: onEdit,
          onSignOut: onSignOut,
        );

      // ── Spotlights = feed + posts + media + spotlight + predictions ───────
      case 'spotlights':
        return _SpotlightsBody(user: user);

      // ── Community = communities + shop ────────────────────────────────────
      case 'community':
        return _CommunityBody(user: user, role: role);

      // ── Sports-specific tabs ──────────────────────────────────────────────
      case 'career':
      case 'statistics':
      case 'squad':
      case 'fixtures':
      case 'standings':
      case 'performance':
        return RoleTabContent(tabId: tabId, role: role);

      case 'fans':
      case 'followers':
        return FansListPage(
          userId: user.id,
          title: tabId == 'fans' ? 'My Fans' : 'Followers',
          listType: tabId,
          embedded: true,
        );

      default:
        return _PlaceholderBody(
          title: roleCfg.tabs
              .firstWhere((t) => t.id == tabId,
                  orElse: () => ProfileTabDef(tabId, tabId))
              .label,
          subtitle: 'Section for ${roleCfg.emoji} ${roleCfg.label}.',
        );
    }
  }
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
// Merged: overview + achievements + about  (matches web profileConfig fan tabs)
class _OverviewBody extends StatelessWidget {
  const _OverviewBody({
    required this.user,
    required this.roleCfg,
    required this.onEdit,
    this.onSignOut,
  });

  final UserProfile user;
  final RoleProfileConfig roleCfg;
  final VoidCallback onEdit;
  final Future<void> Function()? onSignOut;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        // Performance card
        if (user.id.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: PerformanceCard(
                userId: user.id,
                compact: roleCfg.role == 'fan'),
          ),

        // ── About section (was separate tab, now merged) ─────────────────
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const Icon(Icons.info_outline,
                    size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text('About',
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        color: AppColors.primary,
                        letterSpacing: 0.8)),
              ]),
              const SizedBox(height: 10),
              _AboutRow('Role',
                  '${roleCfg.emoji} ${roleCfg.label}'),
              if (user.typeName != null)
                _AboutRow('Type', user.typeName!),
              if (user.location != null)
                _AboutRow('Location', user.location!),
              if (user.nationality != null)
                _AboutRow('Nationality', user.nationality!),
              if (user.registeredAt.isNotEmpty)
                _AboutRow('Joined', user.registeredAt),
              if (user.aboutMe != null && user.aboutMe!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(user.aboutMe!,
                    style: GoogleFonts.inter(
                        fontSize: 13, height: 1.45)),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),

        // ── Achievements section (was separate tab, now merged) ───────────
        if (user.roleData.isNotEmpty) ...[
          GlassCard(
            borderRadius: 16,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Icon(Icons.emoji_events_outlined,
                      size: 16, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Text('Achievements',
                      style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          color: AppColors.primary,
                          letterSpacing: 0.8)),
                ]),
                const SizedBox(height: 10),
                ...user.roleData.entries.take(8).map(
                      (e) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            Expanded(
                                child: Text(e.key,
                                    style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: AppColors.mutedForeground))),
                            Text(e.value,
                                style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // ── Quick actions ─────────────────────────────────────────────────
        GlassCard(
          borderRadius: 14,
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.edit_outlined,
                    color: AppColors.mutedForeground),
                title: Text('Edit profile',
                    style:
                        GoogleFonts.inter(fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right,
                    color: AppColors.mutedForeground),
                onTap: onEdit,
              ),
              ListTile(
                leading: const Icon(Icons.bookmark_border,
                    color: AppColors.mutedForeground),
                title: Text('Saved',
                    style:
                        GoogleFonts.inter(fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right,
                    color: AppColors.mutedForeground),
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const SavedSheet(),
                  );
                },
              ),
              if (roleCfg.role == 'fan')
                ListTile(
                  leading: const Icon(
                      Icons.workspace_premium_outlined,
                      color: AppColors.primary),
                  title: Text('Upgrade role',
                      style: GoogleFonts.inter(
                          fontWeight: FontWeight.w600)),
                  subtitle: Text('Become a player, coach, creator…',
                      style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.mutedForeground)),
                  trailing: const Icon(Icons.chevron_right,
                      color: AppColors.mutedForeground),
                  onTap: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const RoleUpgradeSheet(),
                    );
                  },
                ),
              const _BiometricTile(),
              ListTile(
                leading: const Icon(Icons.settings_outlined,
                    color: AppColors.mutedForeground),
                title: Text('Settings',
                    style:
                        GoogleFonts.inter(fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right,
                    color: AppColors.mutedForeground),
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) =>
                        SettingsSheet(onSignOut: onSignOut),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout,
                    color: AppColors.destructive),
                title: Text('Sign out',
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.w600,
                        color: AppColors.destructive)),
                onTap: () async => onSignOut?.call(),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _AboutRow extends StatelessWidget {
  const _AboutRow(this.k, this.v);
  final String k, v;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
              width: 100,
              child: Text(k,
                  style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.mutedForeground))),
          Expanded(
              child: Text(v,
                  style: GoogleFonts.inter(
                      fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}

// ─── SPOTLIGHTS TAB ───────────────────────────────────────────────────────────
// Merged: feed + posts + media + spotlight + predictions
// Sub-tabs mirror web FeedsTab (Posts / Media) + adds Predictions chip
class _SpotlightsBody extends ConsumerStatefulWidget {
  const _SpotlightsBody({required this.user});
  final UserProfile user;

  @override
  ConsumerState<_SpotlightsBody> createState() => _SpotlightsBodyState();
}

class _SpotlightsBodyState extends ConsumerState<_SpotlightsBody> {
  // Sub-tab mirrors web FeedsTab: posts | media | predictions
  String _sub = 'posts';

  List<Post> _posts = [];
  bool _loading = true;
  String? _error;

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
      final all =
          await ref.read(feedApiProvider).getFeed(limit: 50, offset: 0);
      if (!mounted) return;
      setState(() {
        _posts = all.where((p) => p.userId == widget.user.id).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Filter by sub-tab
    final filtered = _sub == 'media'
        ? _posts
            .where((p) =>
                p.mediaUrls.isNotEmpty ||
                p.postType == 'video' ||
                p.postType == 'spotlight')
            .toList()
        : _sub == 'predictions'
            ? _posts
                .where((p) => p.postType == 'prediction')
                .toList()
            : _posts;

    return Column(
      children: [
        // Sub-tab pills — matches web FeedsTab subtab style
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                _SubTab('posts', 'Posts', _sub,
                    (v) => setState(() => _sub = v)),
                _SubTab('media', 'Media', _sub,
                    (v) => setState(() => _sub = v)),
                _SubTab('predictions', 'Predictions', _sub,
                    (v) => setState(() => _sub = v)),
              ],
            ),
          ),
        ),

        // Content
        Expanded(
          child: _loading
              ? const Center(
                  child: CircularProgressIndicator(
                      color: AppColors.primary, strokeWidth: 2))
              : _error != null
                  ? FeedErrorView(message: _error!, onRetry: _load)
                  : filtered.isEmpty
                      ? _SpotlightsEmpty(sub: _sub)
                      : RefreshIndicator(
                          onRefresh: _load,
                          color: AppColors.primary,
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(
                                16, 4, 16, 100),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 14),
                            itemBuilder: (context, i) =>
                                LiveFeedCard(
                                    post: filtered[i], index: i),
                          ),
                        ),
        ),
      ],
    );
  }
}

class _SubTab extends StatelessWidget {
  const _SubTab(this.id, this.label, this.active, this.onTap);
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
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isActive
                  ? AppColors.primaryForeground
                  : AppColors.mutedForeground,
            ),
          ),
        ),
      ),
    );
  }
}

class _SpotlightsEmpty extends StatelessWidget {
  const _SpotlightsEmpty({required this.sub});
  final String sub;

  @override
  Widget build(BuildContext context) {
    final icon = sub == 'media'
        ? Icons.video_library_outlined
        : sub == 'predictions'
            ? Icons.emoji_events_outlined
            : Icons.article_outlined;
    final msg = sub == 'media'
        ? 'No media yet. Share photos or videos!'
        : sub == 'predictions'
            ? 'No predictions yet. Start predicting match outcomes!'
            : 'No posts yet. Create your first post!';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 36,
                color: AppColors.mutedForeground.withValues(alpha: 0.4)),
            const SizedBox(height: 12),
            Text(msg,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.mutedForeground)),
          ],
        ),
      ),
    );
  }
}

// ─── COMMUNITY TAB ────────────────────────────────────────────────────────────
// Merged: communities + shop
class _CommunityBody extends StatelessWidget {
  const _CommunityBody({required this.user, required this.role});
  final UserProfile user;
  final String role;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        // Communities section
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const Icon(Icons.groups_outlined,
                    size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text('Communities',
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        color: AppColors.primary,
                        letterSpacing: 0.8)),
              ]),
              const SizedBox(height: 12),
              Text(
                'Join communities to connect with fans who share your passion.',
                style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.mutedForeground,
                    height: 1.4),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.explore_outlined, size: 16),
                  label: const Text('Browse Communities'),
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: BorderSide(
                        color: AppColors.primary.withValues(alpha: 0.4)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Shop section
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const Icon(Icons.shopping_bag_outlined,
                    size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text('Shop',
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        color: AppColors.primary,
                        letterSpacing: 0.8)),
              ]),
              const SizedBox(height: 12),
              Text(
                'Discover exclusive sports merchandise, tickets and more.',
                style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.mutedForeground,
                    height: 1.4),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.storefront_outlined, size: 16),
                  label: const Text('Visit Shop'),
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: BorderSide(
                        color: AppColors.primary.withValues(alpha: 0.4)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Role-specific community content
        if (role != 'fan') ...[
          const SizedBox(height: 12),
          RoleTabContent(tabId: 'community', role: role),
        ],
      ],
    );
  }
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
class _PlaceholderBody extends StatelessWidget {
  const _PlaceholderBody(
      {required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 100),
      children: [
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Text(title,
                  style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w800, fontSize: 18)),
              const SizedBox(height: 8),
              Text(subtitle,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                      color: AppColors.mutedForeground,
                      fontSize: 13,
                      height: 1.4)),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Biometric tile (unchanged) ───────────────────────────────────────────────
class _BiometricTile extends StatefulWidget {
  const _BiometricTile();

  @override
  State<_BiometricTile> createState() => _BiometricTileState();
}

class _BiometricTileState extends State<_BiometricTile> {
  final _lock = BiometricLock();
  bool _enabled = false;
  bool _available = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final enabled = await _lock.isEnabled();
    final available = await _lock.canCheck();
    if (!mounted) return;
    setState(() {
      _enabled = enabled;
      _available = available;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const ListTile(
        leading:
            Icon(Icons.fingerprint, color: AppColors.mutedForeground),
        title: Text('Biometric lock'),
      );
    }
    return SwitchListTile(
      secondary: const Icon(Icons.fingerprint,
          color: AppColors.mutedForeground),
      title: Text('Biometric lock',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      subtitle: Text(
        _available
            ? 'Require Face ID / fingerprint when opening the app'
            : 'Not available on this device',
        style: GoogleFonts.inter(
            fontSize: 12, color: AppColors.mutedForeground),
      ),
      value: _enabled && _available,
      activeColor: AppColors.primary,
      onChanged: !_available
          ? null
          : (v) async {
              if (v) {
                final ok = await _lock.authenticate(
                    reason: 'Enable biometric lock');
                if (!ok) return;
              }
              await _lock.setEnabled(v);
              if (!mounted) return;
              setState(() => _enabled = v);
            },
    );
  }
}
