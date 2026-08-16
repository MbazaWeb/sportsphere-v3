import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../domain/profile_role_registry.dart';
import '../../messages/presentation/chat_thread_sheet.dart';
import '../../social/data/follows_api.dart';

/// View another user's public profile (web UserProfileViewer / EntityProfileSheet).
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
  bool? _following;

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
        final raw = await client.getJson('/users?handle=${Uri.encodeComponent(h.startsWith('@') ? h : '@$h')}');
        // API may store handle with or without @
        if (raw is Map && raw['error'] != null) {
          final raw2 = await client.getJson('/users?handle=${Uri.encodeComponent(h)}');
          data = Map<String, dynamic>.from(raw2 as Map);
        } else {
          data = Map<String, dynamic>.from(raw as Map);
        }
      } else if (widget.userId != null) {
        final raw = await client.getJson('/users?q=${Uri.encodeComponent(widget.initialName ?? widget.userId!)}');
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
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
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
        if (res['following'] != null) {
          _following = res['following'] == true;
        } else if (res['followed'] != null) {
          _following = res['followed'] == true;
        } else {
          _following = !(_following ?? false);
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _followBusy = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = (_user?['role'] ?? 'fan').toString();
    final cfg = ProfileRoleRegistry.forRole(role);
    final name = _user?['name']?.toString() ?? widget.initialName ?? 'User';
    final handle = _user?['handle']?.toString() ?? widget.handle ?? '';
    final bio = _user?['bio']?.toString() ?? '';
    final avatar = _user?['avatarUrl']?.toString();
    final verified = _user?['isVerified'] == true;
    final followers = (_user?['followerCount'] as num?)?.toInt() ?? 0;
    final following = (_user?['followingCount'] as num?)?.toInt() ?? 0;
    final posts = (_user?['postCount'] as num?)?.toInt() ?? 0;
    final id = _user?['id']?.toString() ?? '';

    return Container(
      height: MediaQuery.sizeOf(context).height * 0.88,
      decoration: const BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 4, 8, 0),
            child: Row(
              children: [
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                const Spacer(),
                Text(cfg.emoji, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 6),
                Text(cfg.label, style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.mutedForeground)),
                const SizedBox(width: 12),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                        ),
                      )
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 40,
                                backgroundColor: AppColors.surfaceElevated,
                                backgroundImage: avatar != null && avatar.isNotEmpty ? NetworkImage(avatar) : null,
                                child: avatar == null || avatar.isEmpty
                                    ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w800))
                                    : null,
                              ),
                              const Spacer(),
                              if (verified)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text('Verified', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(name, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800)),
                          Text(
                            handle.isEmpty ? cfg.label : (handle.startsWith('@') ? handle : '@$handle'),
                            style: GoogleFonts.inter(color: AppColors.mutedForeground),
                          ),
                          if (bio.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(bio, style: GoogleFonts.inter(fontSize: 14, height: 1.4)),
                          ],
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              _Stat('$posts', 'Posts'),
                              _Stat('$followers', 'Followers'),
                              _Stat('$following', 'Following'),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: _followBusy ? null : _toggleFollow,
                                  child: Text(_following == true ? 'Following' : 'Follow'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: id.isEmpty
                                      ? null
                                      : () {
                                          showModalBottomSheet(
                                            context: context,
                                            isScrollControlled: true,
                                            backgroundColor: Colors.transparent,
                                            builder: (_) => ChatThreadSheet(
                                              partnerId: id,
                                              partnerName: name,
                                              partnerHandle: handle,
                                            ),
                                          );
                                        },
                                  child: const Text('Message'),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            height: 40,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: cfg.tabs.take(8).length,
                              separatorBuilder: (_, __) => const SizedBox(width: 6),
                              itemBuilder: (context, i) {
                                final tab = cfg.tabs[i];
                                final active = i == 0;
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: active ? AppColors.primary : AppColors.surface,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    tab.label,
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: active ? AppColors.primaryForeground : AppColors.mutedForeground,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 12),
                          GlassCard(
                            borderRadius: 14,
                            padding: const EdgeInsets.all(14),
                            child: Text(
                              '${cfg.emoji} ${cfg.label} · Overview matches web entity profile. Full tab content uses profile-data when available.',
                              style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground, height: 1.4),
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

class _Stat extends StatelessWidget {
  const _Stat(this.v, this.l);
  final String v, l;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(v, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
          Text(l, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
        ],
      ),
    );
  }
}
