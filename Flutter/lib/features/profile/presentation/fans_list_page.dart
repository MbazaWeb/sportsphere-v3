import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../../social/data/follows_api.dart';
import 'user_profile_sheet.dart';
import '../../../core/constants/api_config.dart';

/// Shows a list of fans / followers / following for a profile.

String _resolveUrl(String url) => ApiConfig.resolveUrl(url);

class FansListPage extends ConsumerStatefulWidget {
  const FansListPage({
    super.key,
    required this.userId,
    this.title = 'Fans',
    this.listType = 'fans',
    this.embedded = false,
  });

  final String userId;
  final String title;
  /// 'fans', 'followers', or 'following'
  final String listType;
  /// When true, renders as a plain list (no Scaffold/AppBar) for embedding.
  final bool embedded;

  @override
  ConsumerState<FansListPage> createState() => _FansListPageState();
}

class _FansListPageState extends ConsumerState<FansListPage> {
  List<Map<String, dynamic>> _users = [];
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
      final api = FollowsApi(ref.read(apiClientProvider));
      List<Map<String, dynamic>> result;
      switch (widget.listType) {
        case 'followers':
          result = await api.getFollowers(widget.userId);
          break;
        case 'following':
          result = await api.getFollowing(widget.userId);
          break;
        default:
          result = await api.getFans(widget.userId);
      }
      if (!mounted) return;
      setState(() {
        _users = result;
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
    final body = _loading
        ? const Center(
            child: CircularProgressIndicator(
              color: AppColors.primary,
              strokeWidth: 2,
            ),
          )
        : _error != null
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.destructive, size: 32),
                      const SizedBox(height: 12),
                      Text(
                        'Failed to load',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.mutedForeground,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                ),
              )
            : _users.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 48,
                          color: AppColors.mutedForeground.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No ${widget.title.toLowerCase()} yet',
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Be the first to become a fan!',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    color: AppColors.primary,
                    onRefresh: _load,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                      itemCount: _users.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, i) => _FanTile(
                        user: _users[i],
                        onTap: () {
                          final handle = _users[i]['handle']?.toString();
                          if (handle != null && handle.isNotEmpty) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => UserProfileSheet(
                                  handle: handle,
                                ),
                              ),
                            );
                          }
                        },
                      ),
                    ),
          );

    if (widget.embedded) return body;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.foreground,
        elevation: 0,
        title: Text(
          widget.title,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: body,
    );
  }
}

class _FanTile extends StatelessWidget {
  const _FanTile({required this.user, this.onTap});
  final Map<String, dynamic> user;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final name = user['name']?.toString() ?? 'User';
    final handle = user['handle']?.toString() ?? '';
    final avatar = user['avatarUrl']?.toString();
    final role = user['role']?.toString() ?? 'fan';
    final verified = user['isVerified'] == true;

    return GlassCard(
      borderRadius: 14,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      onTap: onTap,
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: AppColors.surfaceElevated,
            backgroundImage:
                avatar != null && avatar.isNotEmpty ? NetworkImage(_resolveUrl(avatar)) : null,
            child: avatar == null || avatar.isEmpty
                ? Text(
                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
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
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    if (verified) ...[
                      const SizedBox(width: 4),
                      Icon(Icons.verified,
                          size: 14, color: AppColors.primary),
                    ],
                  ],
                ),
                Text(
                  handle.startsWith('@') ? handle : '@$handle',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              role.toUpperCase(),
              style: GoogleFonts.inter(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: AppColors.mutedForeground,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
