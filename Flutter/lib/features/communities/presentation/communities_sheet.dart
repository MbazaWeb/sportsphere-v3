import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/glass_card.dart';
import '../data/communities_api.dart';

import 'community_feed_page.dart';

/// Full communities browser — list, search, join/leave (parity with web discovery).
class CommunitiesSheet extends ConsumerStatefulWidget {
  const CommunitiesSheet({super.key, this.onNeedLogin});

  final VoidCallback? onNeedLogin;

  @override
  ConsumerState<CommunitiesSheet> createState() => _CommunitiesSheetState();
}

class _CommunitiesSheetState extends ConsumerState<CommunitiesSheet> {
  final _search = TextEditingController();
  List<CommunityItem> _all = [];
  List<CommunityItem> _filtered = [];
  bool _loading = true;
  String? _error;
  final Set<String> _busy = {};

  @override
  void initState() {
    super.initState();
    _load();
    _search.addListener(_applyFilter);
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ref.read(communitiesApiProvider).list();
      if (!mounted) return;
      setState(() {
        _all = list;
        _loading = false;
      });
      _applyFilter();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  void _applyFilter() {
    final q = _search.text.trim().toLowerCase();
    setState(() {
      if (q.isEmpty) {
        _filtered = List.from(_all);
      } else {
        _filtered = _all
            .where((c) =>
                c.name.toLowerCase().contains(q) ||
                (c.topic?.toLowerCase().contains(q) ?? false) ||
                (c.description?.toLowerCase().contains(q) ?? false))
            .toList();
      }
    });
  }

  Future<void> _toggleJoin(CommunityItem c) async {
    final authed = ref.read(authProvider).isAuthenticated;
    if (!authed) {
      widget.onNeedLogin?.call();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to join communities')),
      );
      return;
    }
    if (_busy.contains(c.id)) return;
    setState(() => _busy.add(c.id));
    try {
      if (c.isMember) {
        await ref.read(communitiesApiProvider).leave(c.id);
      } else {
        await ref.read(communitiesApiProvider).join(c.id);
      }
      if (!mounted) return;
      setState(() {
        _all = _all
            .map((x) => x.id == c.id
                ? x.copyWith(
                    isMember: !c.isMember,
                    memberCount: c.isMember
                        ? (c.memberCount > 0 ? c.memberCount - 1 : 0)
                        : c.memberCount + 1,
                  )
                : x)
            .toList();
        _busy.remove(c.id);
      });
      _applyFilter();
      ref.invalidate(communitiesProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(c.isMember ? 'Left ${c.name}' : 'Joined ${c.name}!')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy.remove(c.id));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '')),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.92,
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 8, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Communities',
                    style: GoogleFonts.outfit(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.foreground,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: _load,
                  icon: const Icon(Icons.refresh, color: AppColors.mutedForeground),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppColors.mutedForeground),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _search,
              style: GoogleFonts.inter(color: AppColors.foreground),
              decoration: InputDecoration(
                hintText: 'Search communities…',
                hintStyle: GoogleFonts.inter(color: AppColors.mutedForeground),
                prefixIcon: const Icon(Icons.search, color: AppColors.mutedForeground),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppColors.border),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
                  )
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_error!, style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                              const SizedBox(height: 12),
                              TextButton(onPressed: _load, child: const Text('Retry')),
                            ],
                          ),
                        ),
                      )
                    : _filtered.isEmpty
                        ? Center(
                            child: Text(
                              'No communities found',
                              style: GoogleFonts.inter(color: AppColors.mutedForeground),
                            ),
                          )
                        : RefreshIndicator(
                            color: AppColors.primary,
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: EdgeInsets.fromLTRB(16, 8, 16, 24 + bottom),
                              itemCount: _filtered.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (context, i) {
                                final c = _filtered[i];
                                final busy = _busy.contains(c.id);
                                return GlassCard(
                                  borderRadius: 16,
                                  padding: const EdgeInsets.all(14),
                                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CommunityFeedPage(community: c))),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 24,
                                        backgroundColor: AppColors.primary.withValues(alpha: 0.18),
                                        child: Text(
                                          c.name.isNotEmpty ? c.name[0].toUpperCase() : 'C',
                                          style: GoogleFonts.outfit(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 18,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              c.name,
                                              style: GoogleFonts.inter(
                                                fontWeight: FontWeight.w700,
                                                fontSize: 15,
                                                color: AppColors.foreground,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              [
                                                if (c.topic != null && c.topic!.isNotEmpty) c.topic!,
                                                '${c.memberCount} members',
                                              ].join(' · '),
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                color: AppColors.mutedForeground,
                                              ),
                                            ),
                                            if (c.description != null && c.description!.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                c.description!,
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: GoogleFonts.inter(
                                                  fontSize: 12,
                                                  color: AppColors.mutedForeground,
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      TextButton(
                                        onPressed: busy ? null : () => _toggleJoin(c),
                                        style: TextButton.styleFrom(
                                          backgroundColor: c.isMember
                                              ? Colors.white.withValues(alpha: 0.08)
                                              : AppColors.primary.withValues(alpha: 0.15),
                                          foregroundColor:
                                              c.isMember ? AppColors.mutedForeground : AppColors.primary,
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                        ),
                                        child: busy
                                            ? const SizedBox(
                                                width: 14,
                                                height: 14,
                                                child: CircularProgressIndicator(strokeWidth: 2),
                                              )
                                            : Text(
                                                c.isMember ? 'Joined' : 'Join',
                                                style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                                              ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  void _showDetail(CommunityItem c) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          decoration: const BoxDecoration(
            color: AppColors.backgroundSecondary,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                c.name,
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.foreground,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                [
                  if (c.topic != null && c.topic!.isNotEmpty) c.topic!,
                  '${c.memberCount} members',
                ].join(' · '),
                style: GoogleFonts.inter(color: AppColors.mutedForeground, fontSize: 13),
              ),
              if (c.description != null && c.description!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  c.description!,
                  style: GoogleFonts.inter(color: AppColors.foreground, fontSize: 14, height: 1.4),
                ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _toggleJoin(c);
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.primaryForeground,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    c.isMember ? 'Leave community' : 'Join community',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
