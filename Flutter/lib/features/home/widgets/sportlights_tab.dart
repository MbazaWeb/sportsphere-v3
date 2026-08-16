import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/post.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../../profile/presentation/user_profile_sheet.dart';
import '../../../shared/widgets/ss_refresh.dart';
import '../../../shared/widgets/media_gallery.dart';

/// Live Sportlights feed from GET /api/feed with infinite scroll
class SportlightsTab extends ConsumerStatefulWidget {
  const SportlightsTab({super.key});

  @override
  ConsumerState<SportlightsTab> createState() => _SportlightsTabState();
}

class _SportlightsTabState extends ConsumerState<SportlightsTab> {
  final _scroll = ScrollController();
  List<Post> _posts = [];
  int _offset = 0;
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  String? _error;
  static const _pageSize = 20;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    _loadFirst();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _loadFirst() async {
    setState(() { _loading = true; _error = null; _posts = []; _offset = 0; _hasMore = true; });
    try {
      final posts = await ref.read(feedApiProvider).getFeed(limit: _pageSize, offset: 0);
      if (!mounted) return;
      setState(() { _posts = posts; _offset = posts.length; _hasMore = posts.length >= _pageSize; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    setState(() => _loadingMore = true);
    try {
      final posts = await ref.read(feedApiProvider).getFeed(limit: _pageSize, offset: _offset);
      if (!mounted) return;
      setState(() {
        _posts.addAll(posts);
        _offset += posts.length;
        _hasMore = posts.length >= _pageSize;
        _loadingMore = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _refresh() async {
    await _loadFirst();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
        ),
      );
    }

    if (_error != null) {
      return FeedErrorView(message: _error!, onRetry: _loadFirst);
    }

    if (_posts.isEmpty) {
      return SsRefreshScroll(
        onRefresh: _refresh,
        child: Center(
          child: Text('No posts yet — pull to refresh', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
        ),
      );
    }

    return SsRefresh(
      onRefresh: _refresh,
      child: ListView.builder(
        controller: _scroll,
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        itemCount: _posts.length + (_hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemBuilder: (context, i) {
          if (i >= _posts.length) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
            );
          }
          return LiveFeedCard(post: _posts[i], index: i);
        },
      ),
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
  late bool _bookmarked;
  bool _hydratedSaved = false;

  @override
  void initState() {
    super.initState();
    _likes = widget.post.likeCount;
    _liked = widget.post.likedByMe;
    _comments = widget.post.commentCount;
    _bookmarked = false;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted || _hydratedSaved) return;
      try {
        final ids = await ref.read(savedPostIdsProvider.future);
        if (!mounted) return;
        setState(() {
          _bookmarked = ids.contains(widget.post.id);
          _hydratedSaved = true;
        });
      } catch (_) {
        if (mounted) setState(() => _hydratedSaved = true);
      }
    });
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

  Future<void> _toggleBookmark() async {
    if (!ref.read(authProvider).isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to save')));
      return;
    }
    final prev = _bookmarked;
    setState(() => _bookmarked = !prev); // optimistic
    try {
      final next = await ref.read(favoritesApiProvider).togglePost(
            widget.post.id,
            currentlySaved: prev,
            preview: widget.post.content,
          );
      if (!mounted) return;
      setState(() => _bookmarked = next);
      ref.invalidate(savedPostIdsProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(next ? 'Saved' : 'Removed from saved')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _bookmarked = prev);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), ''))),
      );
    }
  }

  void _share(BuildContext ctx, Post post) {
    final text = '${post.content}\n\nhttps://sportssphere.fun/sportsphere/p/${post.id}';
    ScaffoldMessenger.of(ctx).showSnackBar(
      SnackBar(
        content: const Text('Link copied to clipboard'),
        action: SnackBarAction(
          label: 'OK',
          onPressed: () {},
        ),
      ),
    );
    // Use platform share if available, otherwise clipboard
    Clipboard.setData(ClipboardData(text: text));
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

  @override
  Widget build(BuildContext context) {
    // Keep provider watched so cache stays warm across cards
    ref.watch(savedPostIdsProvider);
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
            MediaGallery(
              imageUrls: post.mediaUrls,
              onTapImage: (i, url) => MediaGallery.showViewer(context, post.mediaUrls, initialIndex: i),
            ),
          ],
          if (post.poll != null) ...[
            const SizedBox(height: 12),
            _PollBlock(poll: post.poll!, postId: post.id),
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
              GestureDetector(
                onTap: () => _share(context, post),
                child: _Act(Icons.ios_share_outlined, '${post.shareCount}'),
              ),
              const Spacer(),
              GestureDetector(
                onTap: _toggleBookmark,
                child: Icon(
                  _bookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                  size: 18,
                  color: _bookmarked ? AppColors.primary : AppColors.mutedForeground.withValues(alpha: 0.85),
                ),
              ),
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

class _PollBlock extends ConsumerStatefulWidget {
  const _PollBlock({required this.poll, required this.postId});
  final PollData poll;
  final String postId;

  @override
  ConsumerState<_PollBlock> createState() => _PollBlockState();
}

class _PollBlockState extends ConsumerState<_PollBlock> {
  late List<int> _counts;
  late int _total;
  late int? _votedIndex;
  bool _voting = false;

  @override
  void initState() {
    super.initState();
    _counts = List<int>.from(widget.poll.optionCounts ?? List.filled(widget.poll.options.length, 0));
    _total = widget.poll.totalVotes;
    _votedIndex = widget.poll.userVotedOption;
  }

  Future<void> _vote(int index) async {
    if (_votedIndex != null || _voting) return;
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to vote')));
      return;
    }
    setState(() => _voting = true);
    try {
      final result = await ref.read(pollsApiProvider).vote(pollId: widget.poll.id, optionIndex: index);
      if (!mounted) return;
      final updatedPoll = result['poll'];
      if (updatedPoll is Map) {
        setState(() {
          _counts = List<int>.from((updatedPoll['optionCounts'] as List?)?.map((e) => (e as num).toInt()) ?? _counts);
          _total = (updatedPoll['totalVotes'] as num?)?.toInt() ?? _total + 1;
          _votedIndex = (updatedPoll['userVotedOption'] as num?)?.toInt() ?? index;
        });
      } else {
        // Fallback: optimistically update
        setState(() {
          _counts[index]++;
          _total++;
          _votedIndex = index;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Vote failed: $e')));
    } finally {
      if (mounted) setState(() => _voting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _total == 0 ? 1 : _total;
    final hasVoted = _votedIndex != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.poll.question, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        ...List.generate(widget.poll.options.length, (i) {
          final count = i < _counts.length ? _counts[i] : 0;
          final pct = ((count / total) * 100).round();
          final selected = _votedIndex == i;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              onTap: hasVoted ? null : () => _vote(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
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
                    Expanded(child: Text(widget.poll.options[i], style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600))),
                    if (hasVoted)
                      Text('$pct%', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: selected ? AppColors.primary : AppColors.mutedForeground)),
                  ],
                ),
              ),
            ),
          );
        }),
        if (!hasVoted)
          Text('Tap to vote', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
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
  final _scroll = ScrollController();
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  bool _sending = false;
  String? _replyingTo;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  String _relTime(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    try {
      final d = DateTime.parse(iso).toLocal();
      final diff = DateTime.now().difference(d);
      if (diff.inMinutes < 1) return 'now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m';
      if (diff.inHours < 24) return '${diff.inHours}h';
      if (diff.inDays < 7) return '${diff.inDays}d';
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return '';
    }
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
    if (text.isEmpty || _sending) return;
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to comment')));
      return;
    }
    setState(() => _sending = true);
    try {
      await ref.read(socialApiProvider).addComment(
        postId: widget.postId,
        content: text,
        parentId: _replyingTo,
      );
      _ctrl.clear();
      setState(() => _replyingTo = null);
      await _load();
      _scrollToEnd();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          0,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _setReply(String commentId, String userName) {
    setState(() => _replyingTo = commentId);
    _ctrl.text = '@$userName ';
    FocusScope.of(context).requestFocus(FocusNode());
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    final auth = ref.watch(authProvider);
    final avatarUrl = auth.user?.avatarUrl;
    final name = auth.user?.name ?? '';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.65,
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Row(
                children: [
                  Text('Comments', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
                  const Spacer(),
                  Text(
                    '${_items.length}',
                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground),
                  ),
                ],
              ),
            ),
            if (_replyingTo != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                color: AppColors.surface,
                child: Row(
                  children: [
                    Icon(Icons.reply, size: 14, color: AppColors.primary),
                    const SizedBox(width: 6),
                    Text('Replying...', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary, fontStyle: FontStyle.italic)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => setState(() {
                        _replyingTo = null;
                        _ctrl.clear();
                      }),
                      child: Icon(Icons.close, size: 16, color: AppColors.mutedForeground),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                  : _items.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.chat_bubble_outline_rounded, size: 40, color: AppColors.mutedForeground.withValues(alpha: 0.4)),
                              const SizedBox(height: 10),
                              Text('No comments yet', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                              const SizedBox(height: 4),
                              Text('Be the first to share your thoughts', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground.withValues(alpha: 0.7))),
                            ],
                          ),
                        )
                      : ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _items.length,
                          itemBuilder: (context, i) {
                            final c = _items[i];
                            final user = c['user'] is Map ? Map<String, dynamic>.from(c['user'] as Map) : {};
                            final userName = user['name']?.toString() ?? 'User';
                            final userHandle = user['handle']?.toString() ?? '';
                            final userAvatar = user['avatarUrl']?.toString() ?? user['avatar']?.toString();
                            final content = c['content']?.toString() ?? '';
                            final createdAt = c['createdAt']?.toString();
                            final time = _relTime(createdAt);
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 14),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundImage: userAvatar != null && userAvatar.isNotEmpty ? NetworkImage(userAvatar) : null,
                                    backgroundColor: AppColors.surfaceElevated,
                                    child: userAvatar == null || userAvatar.isEmpty
                                        ? Text(userName.isNotEmpty ? userName[0].toUpperCase() : '?',
                                            style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 11, color: AppColors.primary))
                                        : null,
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(userName, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13)),
                                            const SizedBox(width: 6),
                                            Text(
                                              time,
                                              style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(content, style: GoogleFonts.inter(fontSize: 14, height: 1.4)),
                                        const SizedBox(height: 4),
                                        GestureDetector(
                                          onTap: auth.isAuthenticated
                                              ? () => _setReply(c['id']?.toString() ?? '', userName)
                                              : null,
                                          child: Text(
                                            'Reply',
                                            style: GoogleFonts.inter(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: auth.isAuthenticated ? AppColors.primary : AppColors.mutedForeground.withValues(alpha: 0.5),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
            ),
            // Comment input
            Container(
              padding: const EdgeInsets.fromLTRB(12, 8, 8, 16),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
                    backgroundColor: AppColors.surfaceElevated,
                    child: avatarUrl == null || avatarUrl.isEmpty
                        ? Text(initial, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 11, color: AppColors.primary))
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      maxLines: 3,
                      minLines: 1,
                      decoration: InputDecoration(
                        hintText: _replyingTo != null ? 'Write a reply...' : 'Add a comment...',
                        isDense: true,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                        : const Icon(Icons.send_rounded, color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}


class FeedErrorView extends StatelessWidget {
  const FeedErrorView({required this.message, required this.onRetry});
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
