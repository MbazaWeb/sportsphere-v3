import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../../../shared/widgets/ss_refresh.dart';
import 'sportlights_tab.dart';

/// Trending tab — matches web: Live Now · Communities · Trending posts.
class TrendingTab extends ConsumerWidget {
  const TrendingTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(feedProvider('trending'));
    final liveAsync = ref.watch(matchesProvider('live'));
    final commAsync = ref.watch(communitiesProvider);

    return SsRefresh(
      onRefresh: () async {
        ref.invalidate(feedProvider('trending'));
        ref.invalidate(matchesProvider('live'));
        ref.invalidate(communitiesProvider);
        await Future.wait([
          ref.read(feedProvider('trending').future).catchError((_) => []),
          ref.read(matchesProvider('live').future).catchError((_) => []),
          ref.read(communitiesProvider.future).catchError((_) => []),
        ]);
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        children: [
          // Live Now
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Text(
                'LIVE NOW',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: AppColors.mutedForeground,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 88,
            child: liveAsync.when(
              loading: () => const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
              error: (_, __) => Center(child: Text('No live matches', style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 12))),
              data: (matches) {
                if (matches.isEmpty) {
                  return Center(child: Text('No live matches', style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 12)));
                }
                return ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: matches.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, i) {
                    final m = matches[i];
                    final score = '${m.homeScore ?? 0}–${m.awayScore ?? 0}';
                    return GlassCard(
                      borderRadius: 14,
                      padding: const EdgeInsets.all(12),
                      child: SizedBox(
                        width: 168,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    '${m.league ?? 'Match'} · ${m.minute != null ? "${m.minute}'" : m.status.toUpperCase()}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary),
                                  ),
                                ),
                              ],
                            ),
                            const Spacer(),
                            Text(
                              '${_short(m.homeTeam)} $score ${_short(m.awayTeam)}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 22),

          // Communities
          Text(
            'COMMUNITIES',
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: AppColors.mutedForeground),
          ),
          const SizedBox(height: 10),
          commAsync.when(
            loading: () => const SizedBox(height: 48, child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))),
            error: (_, __) => Text('Could not load communities', style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 12)),
            data: (list) {
              if (list.isEmpty) {
                return Text('No communities yet', style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 12));
              }
              return Column(
                children: list.take(6).map((c) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: GlassCard(
                      borderRadius: 14,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                            child: Text(
                              c.name.isNotEmpty ? c.name[0].toUpperCase() : 'C',
                              style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppColors.primary),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(c.name, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                                Text(
                                  [
                                    if (c.topic != null && c.topic!.isNotEmpty) c.topic!,
                                    '${c.memberCount} members',
                                  ].join(' · '),
                                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground),
                                ),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              final authed = ref.read(authProvider).isAuthenticated;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(authed ? 'Join community — coming next' : 'Sign in to join communities'),
                                ),
                              );
                            },
                            child: Text('Join', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.primary)),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),
          const SizedBox(height: 22),

          // Trending posts
          Row(
            children: [
              const Icon(Icons.trending_up, size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(
                'TRENDING',
                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: AppColors.mutedForeground),
              ),
            ],
          ),
          const SizedBox(height: 10),
          feedAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
            ),
            error: (e, _) => TextButton(
              onPressed: () => ref.invalidate(feedProvider('trending')),
              child: const Text('Retry feed'),
            ),
            data: (posts) {
              if (posts.isEmpty) {
                return Text('No trending posts', style: GoogleFonts.inter(color: AppColors.mutedForeground));
              }
              return Column(
                children: [
                  for (var i = 0; i < posts.length; i++) ...[
                    LiveFeedCard(post: posts[i], index: i),
                    if (i < posts.length - 1) const SizedBox(height: 12),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  static String _short(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.isEmpty ? name : parts.last;
  }
}
