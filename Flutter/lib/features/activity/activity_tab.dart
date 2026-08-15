import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';
import '../messages/presentation/chat_thread_sheet.dart';

/// Activity tab — guest gate + live notifications when signed in.
class ActivityTab extends ConsumerStatefulWidget {
  const ActivityTab({super.key, this.onSignIn});
  final VoidCallback? onSignIn;

  @override
  ConsumerState<ActivityTab> createState() => _ActivityTabState();
}

class _ActivityTabState extends ConsumerState<ActivityTab> {
  String _sub = 'all';
  List<Map<String, dynamic>> _items = [];
  List<Map<String, dynamic>> _conversations = [];
  bool _loading = false;
  String? _error;

  static const _subs = [
    ('all', 'All', Icons.notifications_none_rounded),
    ('social', 'Social', Icons.favorite_border_rounded),
    ('sports', 'Sports', Icons.emoji_events_outlined),
    ('messages', 'Messages', Icons.chat_bubble_outline_rounded),
  ];

  static const _socialTypes = {'like', 'follow', 'comment'};
  static const _sportsTypes = {
    'goal',
    'match_goal',
    'prediction',
    'result',
    'transfer',
    'poll_result',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final notifs = await ref.read(socialApiProvider).getNotifications();
      List<Map<String, dynamic>> convos = [];
      try {
        convos = await ref.read(messagesApiProvider).getConversations();
      } catch (_) {
        // messages may 401/empty
      }
      if (!mounted) return;
      setState(() {
        _items = notifs;
        _conversations = convos;
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

  List<Map<String, dynamic>> get _filtered {
    if (_sub == 'all') return _items;
    if (_sub == 'messages') return const [];
    if (_sub == 'social') {
      return _items.where((n) {
        final t = n['type']?.toString() ?? '';
        return _socialTypes.contains(t);
      }).toList();
    }
    if (_sub == 'sports') {
      return _items.where((n) {
        final t = n['type']?.toString() ?? '';
        return _sportsTypes.contains(t);
      }).toList();
    }
    return _items;
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'like':
        return Icons.favorite_rounded;
      case 'follow':
        return Icons.person_add_alt_1_rounded;
      case 'comment':
        return Icons.chat_bubble_rounded;
      case 'goal':
      case 'match_goal':
        return Icons.sports_soccer;
      case 'prediction':
        return Icons.emoji_events_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _colorFor(String type) {
    switch (type) {
      case 'like':
        return const Color(0xFFF472B6);
      case 'follow':
        return const Color(0xFF60A5FA);
      case 'comment':
        return const Color(0xFF22D3EE);
      case 'goal':
      case 'match_goal':
      case 'prediction':
        return AppColors.primary;
      default:
        return AppColors.mutedForeground;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    if (!auth.isAuthenticated) {
      return SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: GlassCard(
              borderRadius: 24,
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
                    ),
                    child: const Icon(Icons.notifications_none_rounded, size: 32, color: AppColors.primary),
                  ),
                  const SizedBox(height: 18),
                  Text('Activity Feed', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text(
                    'Sign in to see likes, follows, match alerts and messages.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 14, height: 1.45, color: AppColors.mutedForeground),
                  ),
                  const SizedBox(height: 22),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(onPressed: widget.onSignIn, child: const Text('Sign In')),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final filtered = _filtered;

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Text('Activity', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
                const Spacer(),
                IconButton(
                  onPressed: _loading ? null : _load,
                  icon: const Icon(Icons.refresh_rounded, size: 22),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 42,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _subs.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (context, i) {
                final (id, label, icon) = _subs[i];
                final active = _sub == id;
                return GestureDetector(
                  onTap: () => setState(() => _sub = id),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: active ? AppColors.primary : Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: Row(
                      children: [
                        Icon(icon, size: 16, color: active ? AppColors.primaryForeground : AppColors.mutedForeground),
                        const SizedBox(width: 6),
                        Text(
                          label,
                          style: GoogleFonts.inter(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: active ? AppColors.primaryForeground : AppColors.mutedForeground,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
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
                              const SizedBox(height: 12),
                              TextButton(onPressed: _load, child: const Text('Retry')),
                            ],
                          ),
                        ),
                      )
                    : _sub == 'messages'
                        ? (_conversations.isEmpty
                            ? Center(child: Text('No messages yet', style: GoogleFonts.inter(color: AppColors.mutedForeground)))
                            : RefreshIndicator(
                                color: AppColors.primary,
                                onRefresh: _load,
                                child: ListView.separated(
                                  physics: const AlwaysScrollableScrollPhysics(),
                                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                                  itemCount: _conversations.length,
                                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                                  itemBuilder: (context, i) {
                                    final c = _conversations[i];
                                    final name = c['partnerName']?.toString() ?? 'User';
                                    final handle = c['partnerHandle']?.toString() ?? '';
                                    final last = c['lastMessage']?.toString() ?? '';
                                    final unread = (c['unread'] as num?)?.toInt() ?? 0;
                                    final partnerId = c['partnerId']?.toString() ?? '';
                                    return GestureDetector(
                                      onTap: partnerId.isEmpty
                                          ? null
                                          : () {
                                              showModalBottomSheet(
                                                context: context,
                                                isScrollControlled: true,
                                                backgroundColor: Colors.transparent,
                                                builder: (_) => ChatThreadSheet(
                                                  partnerId: partnerId,
                                                  partnerName: name,
                                                  partnerHandle: handle,
                                                  seedMessage: last,
                                                ),
                                              );
                                            },
                                      child: GlassCard(
                                      borderRadius: 16,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 22,
                                            backgroundColor: AppColors.surfaceElevated,
                                            child: Text(
                                              name.isNotEmpty ? name[0].toUpperCase() : '?',
                                              style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                                                Text(
                                                  last,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground),
                                                ),
                                                if (handle.isNotEmpty)
                                                  Text(
                                                    handle.startsWith('@') ? handle : '@$handle',
                                                    style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground),
                                                  ),
                                              ],
                                            ),
                                          ),
                                          if (unread > 0)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: AppColors.primary,
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Text(
                                                '$unread',
                                                style: GoogleFonts.inter(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w800,
                                                  color: AppColors.primaryForeground,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    );
                                  },
                                ),
                              ))
                        : filtered.isEmpty
                        ? Center(
                            child: Text(
                              _sub == 'social'
                                  ? 'No social activity yet'
                                  : _sub == 'sports'
                                      ? 'No sports updates yet'
                                      : 'No activity yet',
                              style: GoogleFonts.inter(color: AppColors.mutedForeground),
                            ),
                          )
                        : RefreshIndicator(
                            color: AppColors.primary,
                            onRefresh: _load,
                            child: ListView.separated(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                              itemCount: filtered.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (context, i) {
                                final n = filtered[i];
                                final type = n['type']?.toString() ?? 'system';
                                final title = n['title']?.toString() ?? type;
                                final body = n['body']?.toString() ?? '';
                                final read = n['isRead'] == true;
                                final actor = n['actor'] is Map ? Map<String, dynamic>.from(n['actor'] as Map) : null;
                                final name = actor?['name']?.toString();
                                return GlassCard(
                                  borderRadius: 16,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 20,
                                        backgroundColor: _colorFor(type).withValues(alpha: 0.15),
                                        child: Icon(_iconFor(type), size: 18, color: _colorFor(type)),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              title,
                                              style: GoogleFonts.inter(
                                                fontWeight: read ? FontWeight.w500 : FontWeight.w700,
                                                fontSize: 14,
                                              ),
                                            ),
                                            if (body.isNotEmpty)
                                              Text(body, style: GoogleFonts.inter(fontSize: 12.5, color: AppColors.mutedForeground)),
                                            if (name != null)
                                              Text(name, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                                          ],
                                        ),
                                      ),
                                      if (!read)
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: AppColors.primary,
                                            shape: BoxShape.circle,
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
}
