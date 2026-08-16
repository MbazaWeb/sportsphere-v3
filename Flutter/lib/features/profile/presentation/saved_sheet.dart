import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../data/favorites_api.dart';

/// Saved items — server-backed UserFavorite (teams, players, posts, …)
class SavedSheet extends ConsumerStatefulWidget {
  const SavedSheet({super.key});

  @override
  ConsumerState<SavedSheet> createState() => _SavedSheetState();
}

class _SavedSheetState extends ConsumerState<SavedSheet> {
  List<FavoriteItem> _items = [];
  bool _loading = true;
  String? _error;
  String _filter = 'ALL'; // ALL | POST | TEAM | PLAYER | OTHER

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
      final list = await FavoritesApi(ref.read(apiClientProvider)).list();
      if (!mounted) return;
      setState(() {
        _items = list;
        _loading = false;
      });
      ref.invalidate(savedPostIdsProvider);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  Future<void> _remove(FavoriteItem f) async {
    try {
      await FavoritesApi(ref.read(apiClientProvider)).remove(f.id);
      if (!mounted) return;
      setState(() => _items.removeWhere((x) => x.id == f.id));
      ref.invalidate(savedPostIdsProvider);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  List<FavoriteItem> get _filtered {
    switch (_filter) {
      case 'POST':
        return _items.where((e) => e.targetType.toUpperCase() == 'POST').toList();
      case 'TEAM':
        return _items.where((e) => e.targetType.toUpperCase() == 'TEAM').toList();
      case 'PLAYER':
        return _items.where((e) => e.targetType.toUpperCase() == 'PLAYER').toList();
      case 'OTHER':
        return _items
            .where((e) => !{'POST', 'TEAM', 'PLAYER'}.contains(e.targetType.toUpperCase()))
            .toList();
      default:
        return _items;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.88,
      decoration: const BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
            child: Row(
              children: [
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.chevron_left_rounded)),
                Text('Saved', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800)),
                const Spacer(),
                IconButton(onPressed: _load, icon: const Icon(Icons.refresh, size: 20)),
              ],
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                for (final f in const [
                  ('ALL', 'All'),
                  ('POST', 'Posts'),
                  ('TEAM', 'Teams'),
                  ('PLAYER', 'Players'),
                  ('OTHER', 'Other'),
                ])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(f.$2, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                      selected: _filter == f.$1,
                      onSelected: (_) => setState(() => _filter = f.$1),
                      selectedColor: AppColors.primary.withValues(alpha: 0.25),
                      backgroundColor: AppColors.surface,
                      side: BorderSide(color: _filter == f.$1 ? AppColors.primary : AppColors.border),
                      labelStyle: TextStyle(
                        color: _filter == f.$1 ? AppColors.primary : AppColors.mutedForeground,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!, style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                            TextButton(onPressed: _load, child: const Text('Retry')),
                          ],
                        ),
                      )
                    : _filtered.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Text(
                                'No saved items yet.\nBookmark posts, teams and players to revisit them.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(color: AppColors.mutedForeground, height: 1.4),
                              ),
                            ),
                          )
                        : ListView.separated(
                            padding: EdgeInsets.fromLTRB(16, 4, 16, 24 + bottom),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, i) {
                              final f = _filtered[i];
                              final type = f.targetType.toUpperCase();
                              final icon = switch (type) {
                                'POST' => Icons.article_outlined,
                                'TEAM' => Icons.shield_outlined,
                                'PLAYER' => Icons.person_outline,
                                'LEAGUE' || 'COMPETITION' => Icons.emoji_events_outlined,
                                'SPORT' => Icons.sports_soccer,
                                _ => Icons.bookmark_outline,
                              };
                              return GlassCard(
                                borderRadius: 14,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 20,
                                      backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                                      child: Icon(icon, size: 18, color: AppColors.primary),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            f.targetName,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14),
                                          ),
                                          Text(
                                            [
                                              type,
                                              if (f.targetHandle != null && f.targetHandle!.isNotEmpty) f.targetHandle!,
                                            ].join(' · '),
                                            style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground),
                                          ),
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      onPressed: () => _remove(f),
                                      icon: const Icon(Icons.bookmark_remove_outlined, size: 20, color: AppColors.mutedForeground),
                                      tooltip: 'Remove',
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
