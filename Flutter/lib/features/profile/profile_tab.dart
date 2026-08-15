import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/providers/app_providers.dart';
import '../../core/security/biometric_lock.dart';
import '../../shared/models/user_profile.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';
import 'domain/profile_role_registry.dart';
import 'presentation/edit_profile_sheet.dart';
import 'presentation/settings_sheet.dart';
import 'presentation/saved_sheet.dart';
import 'presentation/role_upgrade_sheet.dart';
import 'presentation/role_tab_content.dart';

/// Own profile — structure matches web ProfileTab + profileConfig role tabs.
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

    final profile = user; // non-null after guard
    final roleCfg = ProfileRoleRegistry.forRole(profile.role ?? profile.roleName ?? 'fan');
    if (!roleCfg.tabs.any((t) => t.id == _activeTab)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _activeTab = roleCfg.tabs.first.id);
      });
    }

    return SafeArea(
      child: NestedScrollView(
        headerSliverBuilder: (context, inner) => [
          SliverToBoxAdapter(child: _ProfileHeader(user: profile, roleCfg: roleCfg)),
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
                child: const Icon(Icons.schedule, color: Color(0xFFFBBF24), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Verification in progress', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: const Color(0xFFFBBF24))),
                    Text('Your role profile is under review.', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
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
                const Icon(Icons.person_outline, size: 48, color: AppColors.primary),
                const SizedBox(height: 16),
                Text('Your profile', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(
                  'Sign in to see your role-based profile, stats, and tabs.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 14),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(onPressed: onSignIn, child: const Text('Sign in')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.user, required this.roleCfg});
  final UserProfile user;
  final RoleProfileConfig roleCfg;

  @override
  Widget build(BuildContext context) {
    final handle = user.handle.startsWith('@') ? user.handle : '@${user.handle}';
    final stats = _statsFor(user, roleCfg);

    return Column(
      children: [
        // Cover
        Container(
          height: 130,
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.backgroundSecondary,
                AppColors.background,
                AppColors.primary.withValues(alpha: 0.15),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            image: user.coverUrl != null && user.coverUrl!.isNotEmpty
                ? DecorationImage(image: NetworkImage(user.coverUrl!), fit: BoxFit.cover)
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
                    CircleAvatar(
                      radius: 44,
                      backgroundColor: AppColors.surfaceElevated,
                      backgroundImage: user.avatarUrl != null && user.avatarUrl!.isNotEmpty
                          ? NetworkImage(user.avatarUrl!)
                          : null,
                      child: user.avatarUrl == null || user.avatarUrl!.isEmpty
                          ? Text(
                              user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                              style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w800),
                            )
                          : null,
                    ),
                    const Spacer(),
                    // Role badge
                    _Badge(label: roleCfg.label, emoji: roleCfg.emoji),
                    if (user.isVerified) ...[
                      const SizedBox(width: 6),
                      const _Badge(label: 'Verified', gold: true),
                    ],
                    if (user.isPro) ...[
                      const SizedBox(width: 6),
                      const _Badge(label: 'PRO', gold: true),
                    ],
                  ],
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(user.name, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
                ),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '$handle · ${roleCfg.emoji} ${roleCfg.label}',
                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground),
                  ),
                ),
                if (user.bio.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(user.bio, style: GoogleFonts.inter(fontSize: 14, height: 1.4)),
                  ),
                ],
                if (user.location != null && user.location!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedForeground),
                        const SizedBox(width: 4),
                        Text(user.location!, style: GoogleFonts.inter(fontSize: 12.5, color: AppColors.mutedForeground)),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                Row(
                  children: stats
                      .map(
                        (s) => Expanded(
                          child: Column(
                            children: [
                              Text(s.$1, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
                              Text(s.$2, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                            ],
                          ),
                        ),
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

  List<(String, String)> _statsFor(UserProfile u, RoleProfileConfig cfg) {
    // Map live counts onto role labels when possible
    final values = <String>[
      '${u.postCount}',
      '${u.followerCount > 0 ? u.followerCount : u.fanCount}',
      '${u.followingCount}',
      if (cfg.statLabels.length > 3) '—',
    ];
    final out = <(String, String)>[];
    for (var i = 0; i < cfg.statLabels.length && i < 4; i++) {
      out.add((values[i.clamp(0, values.length - 1)], cfg.statLabels[i]));
    }
    return out;
  }
}

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
        color: gold ? AppColors.primary.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: gold ? AppColors.primary.withValues(alpha: 0.4) : AppColors.border),
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

class _RoleTabBar extends StatelessWidget {
  const _RoleTabBar({required this.tabs, required this.activeId, required this.onChanged});
  final List<ProfileTabDef> tabs;
  final String activeId;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border.withValues(alpha: 0.6))),
      ),
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        itemCount: tabs.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (context, i) {
          final t = tabs[i];
          final active = t.id == activeId;
          return GestureDetector(
            onTap: () => onChanged(t.id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: active ? AppColors.primary : AppColors.surface,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                t.label,
                style: GoogleFonts.inter(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: active ? AppColors.primaryForeground : AppColors.mutedForeground,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

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
    final usesProfileData = {
      'career', 'statistics', 'achievements', 'matches', 'overview',
    }.contains(tabId) && role != 'fan';

    if (tabId == 'overview') {
      return Column(
        children: [
          Expanded(
            child: usesProfileData
                ? RoleTabContent(tabId: 'overview', role: role)
                : _OverviewBody(user: user, roleCfg: roleCfg, onEdit: onEdit, onSignOut: onSignOut),
          ),
        ],
      );
    }
    if (tabId == 'about') {
      return _AboutBody(user: user, roleCfg: roleCfg);
    }
    if (tabId == 'feed' || tabId == 'posts') {
      return _PlaceholderBody(
        title: 'Posts',
        subtitle: 'Your posts will appear here — same feed filter as web.',
      );
    }
    if (usesProfileData) {
      return RoleTabContent(tabId: tabId, role: role);
    }
    return _PlaceholderBody(
      title: roleCfg.tabs.firstWhere((t) => t.id == tabId, orElse: () => ProfileTabDef(tabId, tabId)).label,
      subtitle: 'Section for ${roleCfg.emoji} ${roleCfg.label} profiles.',
    );
  }
}

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
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Overview', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 8),
              Text(
                'You are viewing the ${roleCfg.label} profile layout '
                '(${roleCfg.tabs.length} tabs — matches web profileConfig).',
                style: GoogleFonts.inter(fontSize: 13, height: 1.4, color: AppColors.mutedForeground),
              ),
              if (user.roleData.isNotEmpty) ...[
                const SizedBox(height: 12),
                ...user.roleData.entries.take(8).map(
                      (e) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            Expanded(child: Text(e.key, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground))),
                            Text(e.value, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        GlassCard(
          borderRadius: 14,
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.edit_outlined, color: AppColors.mutedForeground),
                title: Text('Edit profile', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
                onTap: onEdit,
              ),
              ListTile(
                leading: const Icon(Icons.bookmark_border, color: AppColors.mutedForeground),
                title: Text('Saved', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
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
                  leading: const Icon(Icons.workspace_premium_outlined, color: AppColors.primary),
                  title: Text('Upgrade role', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  subtitle: Text('Become a player, coach, creator…', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                  trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
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
                leading: const Icon(Icons.settings_outlined, color: AppColors.mutedForeground),
                title: Text('Settings', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => SettingsSheet(onSignOut: onSignOut),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout, color: AppColors.destructive),
                title: Text('Sign out', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.destructive)),
                onTap: () async => onSignOut?.call(),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _AboutBody extends StatelessWidget {
  const _AboutBody({required this.user, required this.roleCfg});
  final UserProfile user;
  final RoleProfileConfig roleCfg;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        GlassCard(
          borderRadius: 16,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('About', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 12),
              _AboutRow('Role', '${roleCfg.emoji} ${roleCfg.label}'),
              if (user.typeName != null) _AboutRow('Type', user.typeName!),
              if (user.email.isNotEmpty) _AboutRow('Email', user.email),
              if (user.location != null) _AboutRow('Location', user.location!),
              if (user.nationality != null) _AboutRow('Nationality', user.nationality!),
              if (user.registeredAt.isNotEmpty) _AboutRow('Joined', user.registeredAt),
              if (user.aboutMe != null && user.aboutMe!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(user.aboutMe!, style: GoogleFonts.inter(fontSize: 14, height: 1.45)),
              ],
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
          SizedBox(width: 100, child: Text(k, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground))),
          Expanded(child: Text(v, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}

class _PlaceholderBody extends StatelessWidget {
  const _PlaceholderBody({required this.title, required this.subtitle});
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
              Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
              const SizedBox(height: 8),
              Text(subtitle, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 13, height: 1.4)),
            ],
          ),
        ),
      ],
    );
  }
}

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
        leading: Icon(Icons.fingerprint, color: AppColors.mutedForeground),
        title: Text('Biometric lock'),
      );
    }
    return SwitchListTile(
      secondary: const Icon(Icons.fingerprint, color: AppColors.mutedForeground),
      title: Text('Biometric lock', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      subtitle: Text(
        _available ? 'Require Face ID / fingerprint when opening the app' : 'Not available on this device',
        style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground),
      ),
      value: _enabled && _available,
      activeColor: AppColors.primary,
      onChanged: !_available
          ? null
          : (v) async {
              if (v) {
                final ok = await _lock.authenticate(reason: 'Enable biometric lock');
                if (!ok) return;
              }
              await _lock.setEnabled(v);
              if (!mounted) return;
              setState(() => _enabled = v);
            },
    );
  }
}
