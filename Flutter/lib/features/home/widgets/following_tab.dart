import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/post.dart';
import '../../../theme/app_colors.dart';
import '../../../shared/widgets/ss_refresh.dart';
import 'sportlights_tab.dart' show LiveFeedCard, FeedErrorView;

/// Following feed — GET /api/feed?type=following with infinite scroll.
/// Reuses LiveFeedCard from sportlights_tab.dart.
class FollowingTab extends ConsumerStatefulWidget {
  const FollowingTab({super.key});

  @override
  ConsumerState<FollowingTab> createState() => _FollowingTabState();
}

class _FollowingTabState extends ConsumerState<FollowingTab> {
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
      final posts = await ref.read(feedApiProvider).getFeed(type: 'following', limit: _pageSize, offset: 0);
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
      final posts = await ref.read(feedApiProvider).getFeed(type: 'following', limit: _pageSize, offset: _offset);
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
    final auth = ref.watch(authProvider);

    if (!auth.isAuthenticated) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.people_outline_rounded, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.5)),
              const SizedBox(height: 16),
              Text('Sign in to see posts from people you follow',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 15, color: AppColors.mutedForeground, height: 1.4)),
            ],
          ),
        ),
      );
    }

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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.sports_esports_outlined, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.4)),
              const SizedBox(height: 12),
              Text('No posts from people you follow yet',
                style: GoogleFonts.inter(color: AppColors.mutedForeground)),
              const SizedBox(height: 4),
              Text('Follow more people to fill this feed',
                style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground.withValues(alpha: 0.7))),
            ],
          ),
        ),
      );
    }

    return SsRefresh(
      onRefresh: _refresh,
      child: ListView.separated(
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
