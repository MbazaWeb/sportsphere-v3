import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import 'sportlights_tab.dart';
import '../../../shared/widgets/ss_refresh.dart';

class PollsTab extends ConsumerWidget {
  const PollsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(feedProvider(null));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              const Icon(Icons.bar_chart_rounded, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text('Polls', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800)),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Sign in to create a poll')),
                  );
                },
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Create Poll'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  minimumSize: Size.zero,
                  textStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: feedAsync.when(
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
            error: (e, _) => Center(child: TextButton(onPressed: () => ref.invalidate(feedProvider(null)), child: const Text('Retry'))),
            data: (posts) {
              final polls = posts.where((p) => p.poll != null || p.postType == 'poll').toList();
              if (polls.isEmpty) {
                return Center(
                  child: Text('No polls yet', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
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
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  itemCount: polls.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) => LiveFeedCard(post: polls[i]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
