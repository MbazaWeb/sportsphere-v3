import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../data/favorites_api.dart';

/// Saved / Favorites — GET /api/profile/favorites
class SavedSheet extends ConsumerStatefulWidget {
  const SavedSheet({super.key});

  @override
  ConsumerState<SavedSheet> createState() => _SavedSheetState();
}

class _SavedSheetState extends ConsumerState<SavedSheet> {
  List<FavoriteItem> _items = [];
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
      final list = await FavoritesApi(ref.read(apiClientProvider)).list();
      if (!mounted) return;
      setState(() {
        _items = list;
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

  Future<void> _remove(FavoriteItem f) async {
    try {
      await FavoritesApi(ref.read(apiClientProvider)).remove(f.id);
      if (!mounted) return;
      setState(() => _items.removeWhere((x) => x.id == f.id));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.85,
      decoration: const BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
            child: Row(
              children: [
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.chevron_left_rounded)),
                Text('Saved', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800)),
                const Spacer(),
                IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh_rounded)),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                              TextButton(onPressed: _load, child: const Text('Retry')),
                            ],
                          ),
                        ),
                      )
                    : _items.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Text(
                                'No saved items yet. Bookmark teams, players and content to revisit them.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(color: AppColors.mutedForeground, height: 1.4),
                              ),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                            itemCount: _items.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (context, i) {
                              final f = _items[i];
                              return GlassCard(
                                borderRadius: 14,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 20,
                                      backgroundColor: AppColors.surfaceElevated,
                                      child: Text(
                                        f.targetName.isNotEmpty ? f.targetName[0].toUpperCase() : '?',
                                        style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(f.targetName, style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                                          Text(
                                            [
                                              f.targetType,
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
