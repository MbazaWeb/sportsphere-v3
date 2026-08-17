import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/constants/api_config.dart';
import '../../../shared/models/post.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../data/communities_api.dart';
import '../../home/widgets/sportlights_tab.dart' show LiveFeedCard, FeedErrorView;

// ─── Community Feed Sheet ──────────────────────────────────────────────────────
// Shows community detail + feed of posts tagged to the community.
// Opened when user taps a community card.
class CommunityFeedSheet extends ConsumerStatefulWidget {
  const CommunityFeedSheet({super.key, required this.community});
  final CommunityItem community;

  static Future<void> open(BuildContext context, CommunityItem community) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CommunityFeedSheet(community: community),
    );
  }

  @override
  ConsumerState<CommunityFeedSheet> createState() => _CommunityFeedSheetState();
}

class _CommunityFeedSheetState extends ConsumerState<CommunityFeedSheet> {
  Map<String, dynamic>? _detail;
  List<Post> _posts = [];
  bool _loading = true;
  bool _isMember = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _isMember = widget.community.isMember;
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ref.read(apiClientProvider).getJson('/communities/${widget.community.id}');
      if (!mounted) return;
      final rawPosts = data['posts'] as List? ?? [];
      setState(() {
        _detail = data is Map<String, dynamic> ? data : {};
        _isMember = data['isMember'] == true;
        _posts = rawPosts.whereType<Map>()
            .map((p) => Post.fromJson(Map<String, dynamic>.from(p)))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleMembership() async {
    if (!ref.read(authProvider).isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to join communities')));
      return;
    }
    setState(() => _busy = true);
    try {
      final api = ref.read(communitiesApiProvider);
      if (_isMember) {
        await api.leave(widget.community.id);
      } else {
        await api.join(widget.community.id);
      }
      if (mounted) setState(() { _isMember = !_isMember; _busy = false; });
    } catch (_) {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.community;
    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, ctrl) => Container(
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          children: [
            // Handle
            const SizedBox(height: 10),
            Center(child: Container(width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)))),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(width: 36, height: 36,
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withValues(alpha: 0.08))),
                          child: const Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: Colors.white)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Text(c.name,
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.3))),
                      // Join/Leave button
                      GestureDetector(
                        onTap: _busy ? null : _toggleMembership,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: _isMember ? Colors.white.withValues(alpha: 0.06) : AppColors.primary,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _isMember ? Colors.white.withValues(alpha: 0.1) : AppColors.primary),
                          ),
                          child: _busy
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                              : Text(_isMember ? 'Joined ✓' : 'Join',
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700,
                                      color: _isMember ? AppColors.mutedForeground : Colors.black)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Stats row
                  Row(
                    children: [
                      const Icon(Icons.people_outline, size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text('${c.memberCount} members',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                      if (c.topic != null) ...[
                        const SizedBox(width: 12),
                        const Icon(Icons.tag, size: 14, color: AppColors.mutedForeground),
                        const SizedBox(width: 3),
                        Text(c.topic!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                      ],
                    ],
                  ),
                  if (c.description != null && c.description!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(c.description!,
                        style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground, height: 1.4),
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                  const SizedBox(height: 12),
                  Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
                ],
              ),
            ),

            // Feed
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                  : _posts.isEmpty
                      ? _EmptyFeed(communityName: c.name, isMember: _isMember)
                      : RefreshIndicator(
                          onRefresh: _load,
                          color: AppColors.primary,
                          child: ListView.separated(
                            controller: ctrl,
                            padding: const EdgeInsets.fromLTRB(0, 8, 0, 80),
                            itemCount: _posts.length,
                            separatorBuilder: (_, __) => Divider(height: 1, color: Colors.white.withValues(alpha: 0.05)),
                            itemBuilder: (context, i) => LiveFeedCard(post: _posts[i], index: i),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyFeed extends StatelessWidget {
  const _EmptyFeed({required this.communityName, required this.isMember});
  final String communityName;
  final bool isMember;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.groups_outlined, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.4)),
          const SizedBox(height: 16),
          Text('No posts yet', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(
            isMember
                ? 'Be the first to post in $communityName!'
                : 'Join the community to see and create posts.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground, height: 1.4),
          ),
        ],
      ),
    ),
  );
}
