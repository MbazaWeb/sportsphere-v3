import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import 'sportlights_tab.dart';
import '../../../shared/widgets/ss_refresh.dart';

class PredictionsTab extends ConsumerWidget {
  const PredictionsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Predictions often appear inside feed posts
    final feedAsync = ref.watch(feedProvider(null));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              const Icon(Icons.adjust, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text('Predictions', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800)),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Sign in to create a prediction')),
                  );
                },
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Predict'),
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
              final preds = posts.where((p) => p.prediction != null || p.postType == 'prediction').toList();
              if (preds.isEmpty) {
                return Center(
                  child: Text('No predictions yet', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
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
                  itemCount: preds.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) => LiveFeedCard(post: preds[i]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
