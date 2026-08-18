import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/constants/api_config.dart';
import '../../../shared/models/post.dart';
import '../../../shared/models/match.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../../profile/presentation/user_profile_sheet.dart';
import '../../../shared/widgets/ss_refresh.dart';
import '../../../shared/widgets/media_gallery.dart';
import '../../../shared/widgets/ss_video_player.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/role_badge.dart';
import '../../social/data/follows_api.dart';

// ─── Helper ──────────────────────────────────────────────────────────────────
String _resolveUrl(String url) => ApiConfig.resolveUrl(url);

// ─── SportlightsTab ───────────────────────────────────────────────────────────
class SportlightsTab extends ConsumerStatefulWidget {
  const SportlightsTab({super.key, this.onNeedLogin});
  final VoidCallback? onNeedLogin;
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

  // Inline suggestion/result cards shown at fixed positions in feed
  // Position 0 = after 3rd post, position 1 = after 8th, etc.
  static const _injectPositions = {3: 'results', 8: 'suggestions', 14: 'accounts'};

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

  Future<void> _refresh() async => _loadFirst();

  // Build a virtual list: posts + injected cards
  List<dynamic> _buildItems() {
    final items = <dynamic>[];
    for (var i = 0; i < _posts.length; i++) {
      items.add(_posts[i]);
      if (_injectPositions.containsKey(i + 1)) {
        items.add(_InjectCard(type: _injectPositions[i + 1]!));
      }
    }
    if (_hasMore) items.add(_LoadMore());
    return items;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const FeedSkeleton(count: 4);
    }
    if (_error != null) return FeedErrorView(message: _error!, onRetry: _loadFirst);
    if (_posts.isEmpty) {
      return SsRefreshScroll(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SizedBox(height: 120),
            Center(child: Text('No posts yet — pull to refresh', style: GoogleFonts.inter(color: AppColors.mutedForeground))),
          ],
        ),
      );
    }

    final items = _buildItems();
    return SsRefresh(
      onRefresh: _refresh,
      child: ListView.separated(
        controller: _scroll,
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(0, 0, 0, 100),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 1),
        itemBuilder: (context, i) {
          final item = items[i];
          if (item is Post) return LiveFeedCard(post: item, index: i);
          if (item is _InjectCard) return _buildInjected(item.type);
          return const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)));
        },
      ),
    );
  }

  Widget _buildInjected(String type) {
    switch (type) {
      case 'results': return const _RecentResultsCard();
      case 'suggestions': return const _SuggestedAccountsCard();
      case 'accounts': return const _TopAccountsCard();
      default: return const SizedBox.shrink();
    }
  }
}

class _InjectCard { const _InjectCard({required this.type}); final String type; }
class _LoadMore { const _LoadMore(); }

// ─── RECENT RESULTS CARD ──────────────────────────────────────────────────────
class _RecentResultsCard extends ConsumerWidget {
  const _RecentResultsCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final matchesAsync = ref.watch(matchesProvider(const MatchesKey(status: 'results')));
    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.fromLTRB(0, 12, 0, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Row(
              children: [
                const Icon(Icons.emoji_events_outlined, size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text('Recent Results', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: -0.3)),
                const Spacer(),
                Text('See all', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          matchesAsync.when(
            loading: () => const SizedBox(height: 80, child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))),
            error: (_, __) => const SizedBox.shrink(),
            data: (matches) {
              final recent = matches.take(5).toList();
              if (recent.isEmpty) return const SizedBox.shrink();
              return SizedBox(
                height: 110,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                  itemCount: recent.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, i) => _ResultChip(m: recent[i]),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
        ],
      ),
    );
  }
}

class _ResultChip extends StatelessWidget {
  const _ResultChip({required this.m});
  final MatchItem m;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(m.league ?? 'Match', style: GoogleFonts.inter(fontSize: 9, color: AppColors.primary, fontWeight: FontWeight.w700, letterSpacing: 0.5), maxLines: 1, overflow: TextOverflow.ellipsis),
          const Spacer(),
          Row(
            children: [
              Expanded(child: Text(m.homeTeam, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Text('${m.homeScore ?? 0} - ${m.awayScore ?? 0}', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.foreground)),
              ),
              Expanded(child: Text(m.awayTeam, textAlign: TextAlign.right, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
            ],
          ),
          const Spacer(),
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(6)),
              child: Text('FT', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.mutedForeground)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── SUGGESTED ACCOUNTS CARD ─────────────────────────────────────────────────
class _SuggestedAccountsCard extends ConsumerStatefulWidget {
  const _SuggestedAccountsCard();
  @override
  ConsumerState<_SuggestedAccountsCard> createState() => _SuggestedAccountsCardState();
}

class _SuggestedAccountsCardState extends ConsumerState<_SuggestedAccountsCard> {
  List<Map<String, dynamic>> _suggestions = [];
  bool _loading = true;
  final _followed = <String>{};
  final _fanned = <String>{};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final data = await api.getJson('/users/suggested?limit=6');
      if (!mounted) return;
      final list = data is List ? data : (data is Map && data['users'] is List ? data['users'] : []);
      setState(() {
        _suggestions = list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const SizedBox(height: 80, child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)));
    if (_suggestions.isEmpty) return const SizedBox.shrink();
    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.fromLTRB(0, 12, 0, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome_outlined, size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text('Suggested For You', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: -0.3)),
              ],
            ),
          ),
          ..._suggestions.map((u) {
            final uid = u['id']?.toString() ?? '';
            final name = u['name']?.toString() ?? '';
            final handle = u['handle']?.toString() ?? '';
            final role = u['role']?.toString() ?? 'fan';
            final avatarUrl = u['avatarUrl']?.toString();
            final isFanRole = {'player','team','coach','national_team','club'}.contains(role.toLowerCase());
            final isFollowed = _followed.contains(uid);
            final isFanned = _fanned.contains(uid);
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                        child: Text('@SportSphere', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.primary))),
                      const SizedBox(width: 6),
                      Text('· Suggestion', style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground)),
                    ]),
                    const SizedBox(height: 10),
                    Row(children: [
                      // Real avatar/logo
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: avatarUrl != null && avatarUrl.isNotEmpty
                          ? Image.network(_resolveUrl(avatarUrl), width: 44, height: 44, fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _roleAvatar(role))
                          : _roleAvatar(role),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                        Text('${handle.startsWith('@') ? handle : '@$handle'} · ${_roleLabel(role)}',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                      ])),
                    ]),
                    const SizedBox(height: 10),
                    Row(children: [
                      if (isFanRole) ...[
                        Expanded(child: GestureDetector(
                          onTap: () => setState(() { if (isFanned) _fanned.remove(uid); else _fanned.add(uid); }),
                          child: AnimatedContainer(duration: const Duration(milliseconds: 180),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(color: isFanned ? AppColors.primary : AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.primary.withValues(alpha: 0.4))),
                            alignment: Alignment.center,
                            child: Text(isFanned ? 'Fan ✓' : 'Become a Fan', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: isFanned ? AppColors.primaryForeground : AppColors.primary))),
                        )),
                        const SizedBox(width: 8),
                      ],
                      Expanded(child: GestureDetector(
                        onTap: () => setState(() { if (isFollowed) _followed.remove(uid); else _followed.add(uid); }),
                        child: AnimatedContainer(duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(color: isFollowed ? Colors.white.withValues(alpha: 0.08) : Colors.transparent, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white.withValues(alpha: isFollowed ? 0.12 : 0.15))),
                          alignment: Alignment.center,
                          child: Text(isFollowed ? 'Following' : 'Follow', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: isFollowed ? AppColors.mutedForeground : AppColors.foreground))),
                      )),
                    ]),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
          Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
        ],
      ),
    );
  }

  Widget _roleAvatar(String role) {
    final emoji = {'player':'⚽','team':'👥','coach':'👨‍🏫','league':'🏆','competition':'🏆','academy':'🧒','media':'📺','journalist':'📰','creator':'🎥','community':'👥','business':'💼'}[role.toLowerCase()] ?? '👤';
    return Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.primary.withValues(alpha: 0.2))), child: Center(child: Text(emoji, style: const TextStyle(fontSize: 20))));
  }

  String _roleLabel(String role) {
    const labels = {'player':'Player','team':'Team','coach':'Coach','national_team':'National Team','league':'League','competition':'Competition','academy':'Academy','media':'Media','journalist':'Journalist','creator':'Creator','community':'Community','business':'Business','fan':'Fan'};
    return labels[role.toLowerCase()] ?? role;
  }
}

class _SuggestItem {
  const _SuggestItem({required this.name, required this.handle, required this.badge, required this.emoji, required this.isTeam});
  final String name, handle, badge, emoji;
  final bool isTeam;
}

class _SuggestionRow extends StatelessWidget {
  const _SuggestionRow({required this.item, required this.index, required this.followed, required this.fanned, required this.onFollow, required this.onFan});
  final _SuggestItem item;
  final int index;
  final bool followed, fanned;
  final VoidCallback onFollow, onFan;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Badge header — "@SportSphere · Suggestion"
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                  child: Text('@SportSphere', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.primary)),
                ),
                const SizedBox(width: 6),
                Text('· Suggestion', style: GoogleFonts.inter(fontSize: 10, color: AppColors.mutedForeground)),
              ],
            ),
            const SizedBox(height: 10),
            // Account info
            Row(
              children: [
                // Logo / avatar
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                  ),
                  child: Center(child: Text(item.emoji, style: const TextStyle(fontSize: 20))),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.name, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                      Text('${item.handle} · ${item.badge}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Action buttons
            Row(
              children: [
                if (item.isTeam)
                  Expanded(
                    child: GestureDetector(
                      onTap: onFan,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: fanned ? AppColors.primary : AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          fanned ? 'Fan ✓' : 'Become a Fan',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: fanned ? AppColors.primaryForeground : AppColors.primary),
                        ),
                      ),
                    ),
                  ),
                if (item.isTeam) const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: onFollow,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: followed ? Colors.white.withValues(alpha: 0.08) : Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white.withValues(alpha: followed ? 0.12 : 0.15)),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        followed ? 'Following' : 'Follow',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: followed ? AppColors.mutedForeground : AppColors.foreground),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── TOP ACCOUNTS ─────────────────────────────────────────────────────────────
class _TopAccountsCard extends ConsumerStatefulWidget {
  const _TopAccountsCard();
  @override
  ConsumerState<_TopAccountsCard> createState() => _TopAccountsCardState();
}

class _TopAccountsCardState extends ConsumerState<_TopAccountsCard> {
  final _followed = <String>{};
  List<Map<String, dynamic>> _accounts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final data = await api.getJson('/users/top?limit=5');
      if (!mounted) return;
      final list = data is List ? data : (data is Map && data['users'] is List ? data['users'] : []);
      setState(() {
        _accounts = list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.fromLTRB(0, 12, 0, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Row(
              children: [
                const Icon(Icons.leaderboard_outlined, size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text('Top Accounts', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: -0.3)),
              ],
            ),
          ),
          ..._accounts.asMap().entries.map((e) {
            final id = e.value['id']?.toString() ?? e.key.toString();
            final followed = _followed.contains(id);
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Row(
                children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.primary.withValues(alpha: 0.2))),
                    child: Center(child: Text(e.value['emoji'] ?? '', style: const TextStyle(fontSize: 18))),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(e.value['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13)),
                    Text('${e.value['handle']} · ${e.value['badge']}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                  ])),
                  GestureDetector(
                    onTap: () => setState(() { if (followed) _followed.remove(id); else _followed.add(id); }),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: followed ? Colors.white.withValues(alpha: 0.06) : AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: followed ? Colors.white.withValues(alpha: 0.1) : AppColors.primary.withValues(alpha: 0.4)),
                      ),
                      child: Text(followed ? 'Following' : 'Follow', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: followed ? AppColors.mutedForeground : AppColors.primary)),
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 8),
          Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
        ],
      ),
    );
  }
}

// ─── MATCH CARD in Feed (Image 1 style) ─────────────────────────────────────
class MatchFeedCard extends StatelessWidget {
  const MatchFeedCard({super.key, required this.m});
  final MatchItem m;

  @override
  Widget build(BuildContext context) {
    final score = (m.isFinished || m.isLive) ? '${m.homeScore ?? 0} - ${m.awayScore ?? 0}' : 'vs';
    final statusLabel = m.isLive ? (m.minute != null ? "${m.minute}'" : 'LIVE') : m.isFinished ? 'FT' : (m.kickoff ?? m.status).toUpperCase();

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 6, 16, 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          // League header
          Row(
            children: [
              const Icon(Icons.emoji_events_outlined, size: 14, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(m.league ?? 'Match', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.foreground)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: m.isLive ? AppColors.primary.withValues(alpha: 0.15) : AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: m.isLive ? AppColors.primary.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.08)),
                ),
                child: Text(statusLabel, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: m.isLive ? AppColors.primary : AppColors.mutedForeground)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Teams + score
          Row(
            children: [
              // Home team
              Expanded(
                child: Column(
                  children: [
                    if (m.homeBadge != null && m.homeBadge!.isNotEmpty)
                      Image.network(_resolveUrl(m.homeBadge!), width: 44, height: 44, errorBuilder: (_, __, ___) => const Icon(Icons.sports_soccer, size: 36, color: AppColors.mutedForeground))
                    else
                      Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.surface, shape: BoxShape.circle), child: const Icon(Icons.sports_soccer, size: 22, color: AppColors.mutedForeground)),
                    const SizedBox(height: 8),
                    Text(m.homeTeam, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              // Score
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(score, style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w900, color: m.isLive ? AppColors.primary : AppColors.foreground, letterSpacing: -0.5)),
              ),
              // Away team
              Expanded(
                child: Column(
                  children: [
                    if (m.awayBadge != null && m.awayBadge!.isNotEmpty)
                      Image.network(_resolveUrl(m.awayBadge!), width: 44, height: 44, errorBuilder: (_, __, ___) => const Icon(Icons.sports_soccer, size: 36, color: AppColors.mutedForeground))
                    else
                      Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.surface, shape: BoxShape.circle), child: const Icon(Icons.sports_soccer, size: 22, color: AppColors.mutedForeground)),
                    const SizedBox(height: 8),
                    Text(m.awayTeam, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Actions
          Row(
            children: [
              _Act(Icons.favorite_border_rounded, '0'),
              const SizedBox(width: 16),
              _Act(Icons.chat_bubble_outline_rounded, '0'),
              const SizedBox(width: 16),
              _Act(Icons.ios_share_outlined, '0'),
              const Spacer(),
              Icon(Icons.bookmark_border_rounded, size: 18, color: AppColors.mutedForeground.withValues(alpha: 0.85)),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── LiveFeedCard ────────────────────────────────────────────────────────────
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
  late bool _fan;
  late bool _follow;
  late bool _joined;
  bool _hydratedSaved = false;

  @override
  void initState() {
    super.initState();
    _likes = widget.post.likeCount;
    _liked = widget.post.likedByMe;
    _comments = widget.post.commentCount;
    _bookmarked = false;
    _fan = widget.post.isFan;
    _follow = widget.post.following;
    _joined = widget.post.joined;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted || _hydratedSaved) return;
      try {
        final ids = await ref.read(savedPostIdsProvider.future);
        if (!mounted) return;
        setState(() { _bookmarked = ids.contains(widget.post.id); _hydratedSaved = true; });
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
      setState(() { _liked = r.liked; _likes = r.likeCount; });
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
    setState(() => _bookmarked = !prev);
    try {
      final next = await ref.read(favoritesApiProvider).togglePost(widget.post.id, currentlySaved: prev, preview: widget.post.content);
      if (!mounted) return;
      setState(() => _bookmarked = next);
      ref.invalidate(savedPostIdsProvider);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(next ? 'Saved' : 'Removed from saved')));
    } catch (e) {
      if (!mounted) return;
      setState(() => _bookmarked = prev);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), ''))));
    }
  }

  void _share(BuildContext ctx, Post post) {
    final text = '${post.content}\n\nhttps://sportssphere.fun/sportsphere/p/${post.id}';
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Link copied to clipboard')));
  }

  void _openComments() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.backgroundSecondary,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _CommentsSheet(postId: widget.post.id, onCount: (n) { if (mounted) setState(() => _comments = n); }),
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
    } catch (_) { return ''; }
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(savedPostIdsProvider);
    final post = widget.post;
    final u = post.user;
    final time = _relTime(post.createdAt);

    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author row
          GestureDetector(
            onTap: () => showModalBottomSheet(
              context: context, isScrollControlled: true, backgroundColor: Colors.transparent,
              builder: (_) => UserProfileSheet(handle: u.handle, userId: post.userId, initialName: u.name),
            ),
            child: Row(
              children: [
                _Avatar(url: u.avatarUrl, name: u.name),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Flexible(child: Text(u.name, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: -0.2), overflow: TextOverflow.ellipsis)),
                        const SizedBox(width: 6),
                        PostBadge(role: u.role, isVerified: u.isVerified),
                      ]),
                      Text('${u.handle.startsWith('@') ? u.handle : '@${u.handle}'} · $time', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                    ],
                  ),
                ),
                Icon(Icons.more_horiz, size: 18, color: AppColors.mutedForeground.withValues(alpha: 0.6)),
              ],
            ),
          ),
          if (post.content.isNotEmpty) ...[
            const SizedBox(height: 10),
            if (post.isBreaking)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.flash_on_rounded, size: 11, color: Color(0xFFEF4444)),
                      const SizedBox(width: 4),
                      Text(
                        'BREAKING',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFFEF4444),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            if (post.postType == 'repost' && post.repostData != null) ...[
              if (post.repostData!['caption']?.toString().isNotEmpty == true)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(post.repostData!['caption'], style: GoogleFonts.inter(fontSize: 15, height: 1.45)),
                ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                  color: AppColors.surface.withValues(alpha: 0.3),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 10,
                          backgroundImage: post.repostData!['userAvatar'] != null ? NetworkImage(_resolveUrl(post.repostData!['userAvatar'])) : null,
                          backgroundColor: AppColors.surfaceElevated,
                        ),
                        const SizedBox(width: 6),
                        Text(post.repostData!['userName'] ?? 'User', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12)),
                        Text(' \u00b7 reposted', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(post.content, style: GoogleFonts.inter(fontSize: 14, height: 1.4)),
                  ],
                ),
              ),
            ] else
              Text(post.content, style: GoogleFonts.inter(fontSize: 15, height: 1.45, letterSpacing: -0.1)),
          ],
          if (post.mediaUrls.isNotEmpty) ...[
            const SizedBox(height: 10),
            _MediaRenderer(post: post),
          ],
          if (post.poll != null) ...[const SizedBox(height: 10), _PollBlock(poll: post.poll!, postId: post.id)],
          if (post.prediction != null) ...[const SizedBox(height: 10), _PredictionBlock(pred: post.prediction!, postId: post.id)],
          const SizedBox(height: 12),
          _RoleCtas(
            post: post,
            fan: _fan,
            follow: _follow,
            joined: _joined,
            onChanged: (f, fo, j) => setState(() { _fan = f; _follow = fo; _joined = j; }),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              GestureDetector(onTap: _toggleLike, child: _Act(_liked ? Icons.favorite_rounded : Icons.favorite_border_rounded, '$_likes', color: _liked ? const Color(0xFFF43F5E) : null)),
              const SizedBox(width: 18),
              GestureDetector(onTap: _openComments, child: _Act(Icons.chat_bubble_outline_rounded, '$_comments')),
              const SizedBox(width: 18),
              GestureDetector(onTap: () => _share(context, post), child: _Act(Icons.ios_share_outlined, '${post.shareCount}')),
              const Spacer(),
              GestureDetector(onTap: _toggleBookmark, child: Icon(_bookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded, size: 18, color: _bookmarked ? AppColors.primary : AppColors.mutedForeground.withValues(alpha: 0.85))),
            ],
          ),
          const SizedBox(height: 14),
          Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
        ],
      ),
    );
  }
}

// ─── Smart Media Renderer — handles images AND videos ────────────────────────
class _MediaRenderer extends StatelessWidget {
  const _MediaRenderer({required this.post});
  final Post post;

  bool get _isVideo =>
      post.postType == 'video' ||
      post.postType == 'spotlight' ||
      post.mediaUrls.any((u) {
        final lower = u.toLowerCase();
        return lower.contains('.mp4') || lower.contains('.mov') ||
               lower.contains('.avi') || lower.contains('/video');
      });

  @override
  Widget build(BuildContext context) {
    if (_isVideo && post.mediaUrls.isNotEmpty) {
      // First URL is video, second (if any) is thumbnail
      final videoUrl = _resolveUrl(post.mediaUrls.first);
      final thumb = post.mediaUrls.length > 1 ? _resolveUrl(post.mediaUrls[1]) : null;
      return GestureDetector(
        onTap: () => SsVideoPage.open(context, videoUrl, thumbnailUrl: thumb),
        child: _VideoPlayer(url: videoUrl, thumbnailUrl: thumb),
      );
    }
    return MediaGallery(
      imageUrls: post.mediaUrls,
      onTapImage: (i, url) => MediaGallery.showViewer(context, post.mediaUrls, initialIndex: i),
    );
  }
}

// ─── Video Player Widget — uses real SsVideoPlayer ───────────────────────────
class _VideoPlayer extends StatelessWidget {
  const _VideoPlayer({required this.url, this.thumbnailUrl});
  final String url;
  final String? thumbnailUrl;

  @override
  Widget build(BuildContext context) {
    return SsVideoPlayer(
      url: url,
      thumbnailUrl: thumbnailUrl,
      autoPlay: false,
      muted: true,
      showControls: false, // tap to play, full controls in full-screen
      borderRadius: 14,
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
      return CircleAvatar(radius: 20, backgroundImage: NetworkImage(_resolveUrl(url!)));
    }
    final initials = name.isNotEmpty ? name.trim().split(RegExp(r'\s+')).take(2).map((e) => e[0]).join().toUpperCase() : '?';
    return CircleAvatar(radius: 20, backgroundColor: AppColors.surfaceElevated, child: Text(initials, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.primary)));
  }
}

class _Act extends StatelessWidget {
  const _Act(this.icon, this.label, {this.color});
  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 18, color: color ?? AppColors.mutedForeground.withValues(alpha: 0.85)),
      const SizedBox(width: 5),
      Text(label, style: GoogleFonts.inter(fontSize: 13, color: color ?? AppColors.mutedForeground, fontWeight: FontWeight.w500)),
    ]);
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

class _PredictionBlock extends ConsumerStatefulWidget {
  const _PredictionBlock({required this.pred, required this.postId, this.postUserId});
  final PredictionData pred;
  final String postId;
  final String? postUserId;

  @override
  ConsumerState<_PredictionBlock> createState() => _PredictionBlockState();
}

class _PredictionBlockState extends ConsumerState<_PredictionBlock> {
  late PredictionData _pred;

  @override
  void initState() { super.initState(); _pred = widget.pred; }

  Future<void> _editPrediction(BuildContext context) async {
    final result = await showModalBottomSheet<Map<String,dynamic>>(
      context: context, backgroundColor: AppColors.backgroundSecondary, isScrollControlled: true,
      builder: (_) => _EditPredictionSheet(pred: _pred),
    );
    if (result != null && mounted) {
      try {
        final api = ref.read(apiClientProvider);
        await api.postJson('/posts/\${widget.postId}/prediction', body: result);
        if (mounted) setState(() => _pred = PredictionData(
          id: _pred.id,
          homeTeam: result['homeTeam'] ?? _pred.homeTeam,
          awayTeam: result['awayTeam'] ?? _pred.awayTeam,
          predictedHome: result['predictedHome'] ?? _pred.predictedHome,
          predictedAway: result['predictedAway'] ?? _pred.predictedAway,
          confidence: result['confidence']?.toString() ?? _pred.confidence,
        ));
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    final pred = _pred;
    final isOwn = widget.postUserId != null && widget.postUserId == ref.read(authProvider).user?.id;
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
                                    backgroundImage: userAvatar != null && userAvatar.isNotEmpty ? NetworkImage((userAvatar.startsWith('http://') || userAvatar.startsWith('https://')) ? userAvatar : '${ApiConfig.baseUrl}$userAvatar') : null,
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
                    backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty ? NetworkImage((avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) ? avatarUrl : '${ApiConfig.baseUrl}$avatarUrl') : null,
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

// ─── Edit Prediction Sheet ────────────────────────────────────────────────────
class _EditPredictionSheet extends StatefulWidget {
  const _EditPredictionSheet({required this.pred});
  final PredictionData pred;

  @override
  State<_EditPredictionSheet> createState() => _EditPredictionSheetState();
}

class _EditPredictionSheetState extends State<_EditPredictionSheet> {
  late int _homeScore, _awayScore;
  late double _confidence;

  @override
  void initState() {
    super.initState();
    _homeScore = widget.pred.predictedHome ?? 0;
    _awayScore = widget.pred.predictedAway ?? 0;
    _confidence = double.tryParse(widget.pred.confidence ?? "70") ?? 70.0;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        decoration: BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Text('Edit Prediction', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800)),
              const Spacer(),
              GestureDetector(onTap: () => Navigator.pop(context), child: const Icon(Icons.close, color: AppColors.mutedForeground)),
            ]),
            const SizedBox(height: 16),
            Text('Score prediction', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _ScoreStepper(label: widget.pred.homeTeam, value: _homeScore,
                    onChanged: (v) => setState(() => _homeScore = v)),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text('–', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800))),
                _ScoreStepper(label: widget.pred.awayTeam, value: _awayScore,
                    onChanged: (v) => setState(() => _awayScore = v)),
              ],
            ),
            const SizedBox(height: 16),
            Row(children: [
              Text('Confidence', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground)),
              const Spacer(),
              Text('${_confidence.round()}%', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
            ]),
            SliderTheme(
              data: SliderThemeData(activeTrackColor: AppColors.primary, inactiveTrackColor: Colors.white.withValues(alpha: 0.1), thumbColor: AppColors.primary, trackHeight: 3, thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8)),
              child: Slider(value: _confidence, min: 10, max: 100, divisions: 9, onChanged: (v) => setState(() => _confidence = v)),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context, {
                  'predictedHome': _homeScore,
                  'predictedAway': _awayScore,
                  'confidence': _confidence.round(),
                }),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                child: Text('Update Prediction', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScoreStepper extends StatelessWidget {
  const _ScoreStepper({required this.label, required this.value, required this.onChanged});
  final String label;
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground), overflow: TextOverflow.ellipsis),
      const SizedBox(height: 6),
      Row(children: [
        GestureDetector(onTap: () { if (value > 0) onChanged(value - 1); },
            child: Container(width: 32, height: 32, decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.white.withValues(alpha: 0.1))),
                child: const Icon(Icons.remove, size: 16))),
        Padding(padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text('$value', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900))),
        GestureDetector(onTap: () => onChanged(value + 1),
            child: Container(width: 32, height: 32, decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.add, size: 16, color: Colors.black))),
      ]),
    ],
  );
}

class _RoleCtas extends ConsumerWidget {
  const _RoleCtas({
    required this.post,
    required this.fan,
    required this.follow,
    required this.joined,
    required this.onChanged,
    this.onNeedLogin,
  });
  final Post post;
  final bool fan, follow, joined;
  final void Function(bool fan, bool follow, bool joined) onChanged;
  final VoidCallback? onNeedLogin;

  String get _role => post.user.role.toLowerCase();
  String get _type => post.postType.toLowerCase();

  Future<void> _act(WidgetRef ref, BuildContext context, String action) async {
    if (!ref.read(authProvider).isAuthenticated) {
      onNeedLogin?.call();
      return;
    }
    try {
      final data = await ref.read(followsApiProvider).toggle(post.userId, action: action);
      onChanged(data['isFan'] == true, data['following'] == true, data['joined'] == true);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget btn(String label, VoidCallback onTap, {bool gold = false, bool outline = false}) {
      return Expanded(
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: gold ? AppColors.primary : (outline ? Colors.transparent : const Color(0xFF2563EB)),
              borderRadius: BorderRadius.circular(12),
              border: outline ? Border.all(color: AppColors.border) : null,
            ),
            alignment: Alignment.center,
            child: Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: gold ? Colors.black : Colors.white)),
          ),
        ),
      );
    }

    if (_type == 'shop') {
      return Row(children: [btn('Add to cart', () {}, gold: true)]);
    }
    if (_role == 'media' || _role == 'business') {
      return Row(children: [
        btn(follow ? 'You are following' : 'Follow', () => _act(ref, context, 'follow')),
        const SizedBox(width: 8),
        btn(joined ? 'You joined' : (_role == 'media' ? 'Join Media' : 'Join Business'), () => _act(ref, context, 'join'), gold: true),
      ]);
    }
    if (['official', 'team', 'player', 'coach'].contains(_role) || _type == 'official') {
      return Row(children: [
        btn(fan ? 'You are a fan' : 'Become Fan', () => _act(ref, context, 'fan'), outline: true),
        const SizedBox(width: 8),
        btn(follow ? 'You are following' : 'Follow', () => _act(ref, context, 'follow')),
      ]);
    }
    if (_role == 'analyst' || _type == 'prediction') {
      return Row(children: [btn(follow ? 'You are following' : 'Follow', () => _act(ref, context, 'follow'))]);
    }
    return const SizedBox.shrink();
  }
}
