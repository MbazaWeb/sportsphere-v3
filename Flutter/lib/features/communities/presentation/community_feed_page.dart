import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/post.dart';
import '../../../theme/app_colors.dart';
import '../../home/widgets/sportlights_tab.dart' show LiveFeedCard, FeedErrorView;
import '../data/communities_api.dart';

class CommunityFeedPage extends ConsumerStatefulWidget {
  const CommunityFeedPage({super.key, required this.community});
  final CommunityItem community;

  @override
  ConsumerState<CommunityFeedPage> createState() => _CommunityFeedPageState();
}

class _CommunityFeedPageState extends ConsumerState<CommunityFeedPage> {
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
      final raw = await ref.read(communitiesApiProvider).getFeed(widget.community.id);
      if (!mounted) return;
      setState(() {
        _posts = raw.map((e) => Post.fromJson(Map<String, dynamic>.from(e as Map))).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.community.name, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800)),
            Text('${widget.community.memberCount} members', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
          : _error != null
              ? FeedErrorView(message: _error!, onRetry: _load)
              : _posts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.article_outlined, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.3)),
                          const SizedBox(height: 12),
                          Text('No posts yet', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.mutedForeground)),
                          Text('Be the first to post in ${widget.community.name}', style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground.withValues(alpha: 0.7))),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: AppColors.primary,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(0, 8, 0, 100),
                        itemCount: _posts.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 1),
                        itemBuilder: (context, i) => LiveFeedCard(post: _posts[i], index: i),
                      ),
                    ),
    );
  }
}
