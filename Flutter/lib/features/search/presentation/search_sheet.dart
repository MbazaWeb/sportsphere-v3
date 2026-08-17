import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/post.dart';
import '../../../theme/app_colors.dart';
import '../../profile/presentation/user_profile_sheet.dart';
import '../../home/widgets/sportlights_tab.dart' show LiveFeedCard;
import '../../../core/constants/api_config.dart';


String _resolveUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final base = ApiConfig.baseUrl;
  return url.startsWith('/') ? '$base$url' : '$base/$url';
}

class SearchSheet extends ConsumerStatefulWidget {
  const SearchSheet({super.key});

  @override
  ConsumerState<SearchSheet> createState() => _SearchSheetState();
}

class _SearchSheetState extends ConsumerState<SearchSheet> {
  final _ctrl = TextEditingController();
  Timer? _debounce;
  List<Map<String, dynamic>> _users = [];
  List<Post> _posts = [];
  bool _loading = false;
  String? _error;
  String _tab = 'users'; // 'users' or 'posts'

  @override
  void dispose() {
    _debounce?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _search(String q) async {
    if (q.trim().length < 2) {
      setState(() {
        _users = [];
        _posts = [];
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ref.read(socialApiProvider).searchUsers(q.trim()),
        ref.read(socialApiProvider).searchPosts(q.trim()).then((list) => list.map((e) => Post.fromJson(Map<String, dynamic>.from(e as Map))).toList()),
      ]);
      if (!mounted) return;
      setState(() {
        _users = results[0] as List<Map<String, dynamic>>;
        _posts = results[1] as List<Post>;
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

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      if (_ctrl.text == v) _search(v);
    });
  }

  @override
  Widget build(BuildContext context) {
    final hasQuery = _ctrl.text.trim().length >= 2;

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
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    autofocus: true,
                    onChanged: _onChanged,
                    decoration: InputDecoration(
                      hintText: 'Search people, posts, teams…',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _ctrl.text.isNotEmpty
                          ? IconButton(
                              onPressed: () {
                                _ctrl.clear();
                                setState(() { _users = []; _posts = []; _error = null; });
                              },
                              icon: const Icon(Icons.close, size: 18),
                            )
                          : null,
                      filled: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Tabs
          if (hasQuery)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  _SearchTab(
                    label: 'People',
                    count: _users.length,
                    active: _tab == 'users',
                    onTap: () => setState(() => _tab = 'users'),
                  ),
                  const SizedBox(width: 8),
                  _SearchTab(
                    label: 'Posts',
                    count: _posts.length,
                    active: _tab == 'posts',
                    onTap: () => setState(() => _tab = 'posts'),
                  ),
                ],
              ),
            ),
          if (_loading) const LinearProgressIndicator(minHeight: 2, color: AppColors.primary),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(_error!, style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 12)),
            ),
          Expanded(
            child: !hasQuery
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.search_rounded, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.3)),
                        const SizedBox(height: 12),
                        Text('Search SportSphere', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.mutedForeground)),
                        const SizedBox(height: 4),
                        Text('Find people, posts, and more', style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground.withValues(alpha: 0.7))),
                      ],
                    ),
                  )
                : _tab == 'users'
                    ? _users.isEmpty && !_loading
                        ? Center(child: Text('No people found', style: GoogleFonts.inter(color: AppColors.mutedForeground)))
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            itemCount: _users.length,
                            itemBuilder: (context, i) {
                              final u = _users[i];
                              final name = u['name']?.toString() ?? '';
                              final handle = u['handle']?.toString() ?? '';
                              final avatar = u['avatarUrl']?.toString();
                              final bio = u['bio']?.toString() ?? '';
                              final isVerified = u['isVerified'] == true;
                              return ListTile(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                leading: CircleAvatar(
                                  backgroundImage: avatar != null && avatar.isNotEmpty ? NetworkImage(_resolveUrl(avatar)) : null,
                                  child: avatar == null || avatar.isEmpty ? Text(name.isNotEmpty ? name[0] : '?') : null,
                                ),
                                title: Row(
                                  children: [
                                    Flexible(
                                      child: Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w700), overflow: TextOverflow.ellipsis),
                                    ),
                                    if (isVerified) ...[
                                      const SizedBox(width: 4),
                                      Icon(Icons.verified, size: 14, color: const Color(0xFF22C55E)),
                                    ],
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(handle.startsWith('@') ? handle : '@$handle', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                                    if (bio.isNotEmpty)
                                      Text(bio, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground.withValues(alpha: 0.7))),
                                  ],
                                ),
                                onTap: () {
                                  showModalBottomSheet(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (_) => UserProfileSheet(
                                      handle: handle,
                                      userId: u['id']?.toString(),
                                      initialName: name,
                                    ),
                                  );
                                },
                              );
                            },
                          )
                    : _posts.isEmpty && !_loading
                        ? Center(child: Text('No posts found', style: GoogleFonts.inter(color: AppColors.mutedForeground)))
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                            itemCount: _posts.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, i) => LiveFeedCard(post: _posts[i], index: i),
                          ),
          ),
        ],
      ),
    );
  }
}

class _SearchTab extends StatelessWidget {
  const _SearchTab({required this.label, required this.count, required this.active, required this.onTap});
  final String label;
  final int count;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: active ? AppColors.primaryForeground : AppColors.mutedForeground)),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Text('$count', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: active ? AppColors.primaryForeground : AppColors.mutedForeground.withValues(alpha: 0.7))),
            ],
          ],
        ),
      ),
    );
  }
}
