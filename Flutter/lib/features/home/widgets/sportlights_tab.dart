import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/post.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../../profile/presentation/user_profile_sheet.dart';
import '../../../shared/widgets/ss_refresh.dart';

/// Live Sportlights feed from GET /api/feed
class SportlightsTab extends ConsumerWidget {
  const SportlightsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(feedProvider(null));

    return feedAsync.when(
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
        ),
      ),
      error: (e, _) {
        if (isLikelyCorsError(e)) {
          final posts = sampleFeedPosts();
          return Column(
            children: [
              Material(
                color: AppColors.primary.withValues(alpha: 0.12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, size: 18, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'CORS blocked live API — sample feed. Use Android or Chrome with web security off.',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary),
                        ),
                      ),
                      TextButton(
                        onPressed: () => ref.invalidate(feedProvider(null)),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                  itemCount: posts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, i) => LiveFeedCard(post: posts[i], index: i),
                ),
              ),
            ],
          );
        }
        return _ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(feedProvider(null)),
        );
      },
      data: (posts) {
        if (posts.isEmpty) {
          return SsRefreshScroll(
            onRefresh: () async {
              ref.invalidate(feedProvider(null));
              await ref.read(feedProvider(null).future);
            },
            child: Center(
              child: Text(
                'No posts yet — pull to refresh',
                style: GoogleFonts.inter(color: AppColors.mutedForeground),
              ),
            ),
          );
        }
        return SsRefresh(
          onRefresh: () async {
            ref.invalidate(feedProvider(null));
            await ref.read(feedProvider(null).future);
          },
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            itemCount: posts.length,
            separatorBuilder: (_, __) => const SizedBox(height: 14),
            itemBuilder: (context, i) => LiveFeedCard(post: posts[i], index: i),
          ),
        );
      },
    );
  }
}

class LiveFeedCard extends ConsumerStatefulWidget {
  const LiveFeedCard({super.key, required this.post, this.index = 0});
  final Post post;
  final int index;

  @override
  ConsumerState<LiveFeedCard> createState() => _LiveFeedCardState();
}

class _LiveFeedCardState extends ConsumerState<LiveFeedCard> {
  late int _likes;
  late bool _liked;
  late int _comments;

  @override
  void initState() {
    super.initState();
    _likes = widget.post.likeCount;
    _liked = widget.post.likedByMe;
    _comments = widget.post.commentCount;
  }

  Future<void> _toggleLike() async {
    if (!ref.read(authProvider).isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to like')));
      return;
    }
    try {
      final r = await ref.read(socialApiProvider).toggleLike(widget.post.id);
      if (!mounted) return;
      setState(() {
        _liked = r.liked;
        _likes = r.likeCount;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  void _openComments() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.backgroundSecondary,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _CommentsSheet(
        postId: widget.post.id,
        onCount: (n) {
          if (mounted) setState(() => _comments = n);
        },
      ),
    );
  }

  String _relTime(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      final diff = DateTime.now().difference(d);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final u = post.user;
    final time = _relTime(post.createdAt);

    return AnimatedGlassCard(
      index: widget.index,
      borderRadius: 20,
      padding: const EdgeInsets.fromLTRB(16, 15, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => UserProfileSheet(
                  handle: u.handle,
                  userId: post.userId,
                  initialName: u.name,
                ),
              );
            },
            child: Row(
            children: [
              _Avatar(url: u.avatarUrl, name: u.name),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            u.name,
                            style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15, letterSpacing: -0.2, height: 1.2),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (u.isVerified) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'VERIFIED',
                              style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: const Color(0xFF22C55E)),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      '${u.handle.startsWith('@') ? u.handle : '@${u.handle}'} · $time',
                      style: GoogleFonts.inter(fontSize: 12.5, color: AppColors.mutedForeground, letterSpacing: -0.1, height: 1.25),
                    ),
                  ],
                ),
              ),
            ],
          ),
          ),
          if (post.content.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(post.content, style: GoogleFonts.inter(fontSize: 15.5, height: 1.45, letterSpacing: -0.15, fontWeight: FontWeight.w400)),
          ],
          if (post.mediaUrls.isNotEmpty) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: AspectRatio(
                aspectRatio: 16 / 10,
                child: Image.network(
                  post.mediaUrls.first,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: AppColors.surface,
                    alignment: Alignment.center,
                    child: const Icon(Icons.image_not_supported, color: AppColors.mutedForeground),
                  ),
                ),
              ),
            ),
          ],
          if (post.poll != null) ...[
            const SizedBox(height: 12),
            _PollBlock(poll: post.poll!),
          ],
          if (post.prediction != null) ...[
            const SizedBox(height: 12),
            _PredictionBlock(pred: post.prediction!),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              GestureDetector(
                onTap: _toggleLike,
                child: _Act(
                  _liked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  '$_likes',
                  color: _liked ? const Color(0xFFF43F5E) : null,
                ),
              ),
              const SizedBox(width: 16),
              GestureDetector(
                onTap: _openComments,
                child: _Act(Icons.chat_bubble_outline_rounded, '$_comments'),
              ),
              const SizedBox(width: 16),
              _Act(Icons.ios_share_outlined, '${post.shareCount}'),
              const Spacer(),
              Icon(Icons.bookmark_border_rounded, size: 18, color: AppColors.mutedForeground.withValues(alpha: 0.85)),
            ],
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({this.url, required this.name});
  final String? url;
  final String name;

  @override
  Widget build(BuildContext context) {
    if (url != null && url!.isNotEmpty) {
      return CircleAvatar(radius: 20, backgroundImage: NetworkImage(url!));
    }
    final initials = name.isNotEmpty
        ? name.trim().split(RegExp(r'\s+')).take(2).map((e) => e[0]).join().toUpperCase()
        : '?';
    return CircleAvatar(
      radius: 20,
      backgroundColor: AppColors.surfaceElevated,
      child: Text(initials, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.primary)),
    );
  }
}

class _PollBlock extends StatelessWidget {
  const _PollBlock({required this.poll});
  final PollData poll;

  @override
  Widget build(BuildContext context) {
    final total = poll.totalVotes == 0 ? 1 : poll.totalVotes;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(poll.question, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        ...List.generate(poll.options.length, (i) {
          final count = (poll.optionCounts != null && i < poll.optionCounts!.length)
              ? poll.optionCounts![i]
              : 0;
          final pct = ((count / total) * 100).round();
          final selected = poll.userVotedOption == i;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: selected ? const Color(0xFF8B7355).withValues(alpha: 0.45) : AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: selected ? AppColors.primary.withValues(alpha: 0.35) : AppColors.border,
                ),
              ),
              child: Row(
                children: [
                  Expanded(child: Text(poll.options[i], style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600))),
                  Text('$pct%', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: selected ? AppColors.primary : AppColors.mutedForeground)),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _PredictionBlock extends StatelessWidget {
  const _PredictionBlock({required this.pred});
  final PredictionData pred;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text('PREDICTION', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.mutedForeground)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: Text(pred.homeTeam, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600))),
              Text('${pred.predictedHome ?? '-'}', style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.primary)),
              Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Text('-', style: GoogleFonts.inter(color: AppColors.mutedForeground))),
              Text('${pred.predictedAway ?? '-'}', style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.primary)),
              Expanded(child: Text(pred.awayTeam, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600))),
            ],
          ),
          if (pred.confidence != null) ...[
            const SizedBox(height: 8),
            Text(pred.confidence!, style: GoogleFonts.inter(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
          ],
        ],
      ),
    );
  }
}

class _Act extends StatelessWidget {
  const _Act(this.icon, this.label, {this.color});
  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.mutedForeground.withValues(alpha: 0.9);
    return Row(
      children: [
        Icon(icon, size: 20, color: c),
        const SizedBox(width: 5),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            letterSpacing: -0.1,
            color: color ?? AppColors.mutedForeground,
          ),
        ),
      ],
    );
  }
}

class _CommentsSheet extends ConsumerStatefulWidget {
  const _CommentsSheet({required this.postId, required this.onCount});
  final String postId;
  final ValueChanged<int> onCount;

  @override
  ConsumerState<_CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends ConsumerState<_CommentsSheet> {
  final _ctrl = TextEditingController();
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final list = await ref.read(socialApiProvider).getComments(widget.postId);
      if (!mounted) return;
      setState(() {
        _items = list;
        _loading = false;
      });
      widget.onCount(list.length);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to comment')));
      return;
    }
    try {
      await ref.read(socialApiProvider).addComment(postId: widget.postId, content: text);
      _ctrl.clear();
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.55,
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Comments', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                  : _items.isEmpty
                      ? Center(child: Text('No comments yet', style: GoogleFonts.inter(color: AppColors.mutedForeground)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _items.length,
                          itemBuilder: (context, i) {
                            final c = _items[i];
                            final user = c['user'] is Map ? Map<String, dynamic>.from(c['user'] as Map) : {};
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(user['name']?.toString() ?? 'User', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13)),
                              subtitle: Text(c['content']?.toString() ?? '', style: GoogleFonts.inter(fontSize: 14)),
                            );
                          },
                        ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      decoration: InputDecoration(
                        hintText: 'Add a comment…',
                        isDense: true,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(onPressed: _send, icon: const Icon(Icons.send_rounded, color: AppColors.primary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}


class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  bool get _isCors {
    final m = message.toLowerCase();
    return m.contains('failed to fetch') ||
        m.contains('cors') ||
        m.contains('xmlhttprequest') ||
        m.contains('network');
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _isCors ? 'Browser blocked the API (CORS)' : 'Could not load feed',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              _isCors
                  ? 'Flutter Web on localhost cannot call sportssphere.fun until the API allows this origin.\n\nUse Chrome with web security disabled for local web, or run on Android/iOS (no CORS).'
                  : message,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 12.5, height: 1.45, color: AppColors.mutedForeground),
            ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
