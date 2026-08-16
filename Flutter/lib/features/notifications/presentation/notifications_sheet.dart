import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../profile/presentation/user_profile_sheet.dart';

class NotificationsSheet extends ConsumerStatefulWidget {
  const NotificationsSheet({super.key, this.onNeedLogin});
  final VoidCallback? onNeedLogin;

  @override
  ConsumerState<NotificationsSheet> createState() => _NotificationsSheetState();
}

class _NotificationsSheetState extends ConsumerState<NotificationsSheet> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      setState(() {
        _loading = false;
        _error = 'Sign in to see notifications';
      });
      return;
    }
    try {
      final list = await ref.read(socialApiProvider).getNotifications();
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

  Future<void> _markAllRead() async {
    try {
      await ref.read(socialApiProvider).markNotificationsRead();
      if (!mounted) return;
      setState(() {
        for (var i = 0; i < _items.length; i++) {
          _items[i] = Map<String, dynamic>.from(_items[i])..['isRead'] = true;
        }
      });
    } catch (_) {
      // silent
    }
  }

  void _onTapNotification(Map<String, dynamic> n) {
    final type = n['type']?.toString() ?? '';
    final actor = n['actor'] is Map ? Map<String, dynamic>.from(n['actor'] as Map) : null;
    final actorId = actor?['id']?.toString();
    final actorHandle = actor?['handle']?.toString();
    final postId = n['postId']?.toString();

    // Mark this notification as read locally
    final idx = _items.indexOf(n);
    if (idx >= 0) {
      setState(() {
        _items[idx] = Map<String, dynamic>.from(_items[idx])..['isRead'] = true;
      });
    }

    Navigator.pop(context);

    // Navigate based on type
    if (type == 'follow' && actorId != null && actorHandle != null) {
      Future.delayed(const Duration(milliseconds: 300), () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => UserProfileSheet(
            handle: actorHandle,
            userId: actorId,
            initialName: actor?['name']?.toString() ?? '',
          ),
        );
      });
    } else if ((type == 'like' || type == 'comment') && actorId != null && actorHandle != null) {
      Future.delayed(const Duration(milliseconds: 300), () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => UserProfileSheet(
            handle: actorHandle,
            userId: actorId,
            initialName: actor?['name']?.toString() ?? '',
          ),
        );
      });
    }
  }

  String _relTime(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    try {
      final d = DateTime.parse(iso).toLocal();
      final diff = DateTime.now().difference(d);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return '';
    }
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'like': return Icons.favorite_rounded;
      case 'follow': return Icons.person_add_alt_1_rounded;
      case 'comment': return Icons.chat_bubble_rounded;
      case 'goal': case 'match_goal': return Icons.sports_soccer;
      case 'prediction': return Icons.emoji_events_rounded;
      case 'transfer': return Icons.swap_horiz_rounded;
      case 'result': return Icons.sports_score_rounded;
      case 'poll_result': return Icons.bar_chart_rounded;
      default: return Icons.notifications_rounded;
    }
  }

  Color _colorFor(String type) {
    switch (type) {
      case 'like': return const Color(0xFFF472B6);
      case 'follow': return const Color(0xFF60A5FA);
      case 'comment': return const Color(0xFF22D3EE);
      case 'goal': case 'match_goal': return const Color(0xFF22C55E);
      case 'prediction': case 'result': return AppColors.primary;
      case 'transfer': return const Color(0xFFA78BFA);
      case 'poll_result': return const Color(0xFFF59E0B);
      default: return AppColors.mutedForeground;
    }
  }

  int get _unreadCount => _items.where((n) => n['isRead'] != true).length;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.78,
      decoration: const BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 12, 4),
            child: Row(
              children: [
                Text('Notifications', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
                if (_unreadCount > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text('$_unreadCount new', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryForeground)),
                  ),
                ],
                const Spacer(),
                if (_unreadCount > 0)
                  TextButton(
                    onPressed: _markAllRead,
                    child: Text('Mark all read', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                  ),
                IconButton(onPressed: _load, icon: const Icon(Icons.refresh, size: 20)),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.notifications_off_rounded, size: 40, color: AppColors.mutedForeground.withValues(alpha: 0.4)),
                            const SizedBox(height: 12),
                            Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                            if (_error!.contains('Sign in')) ...[
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                  widget.onNeedLogin?.call();
                                },
                                child: const Text('Sign in'),
                              ),
                            ],
                          ],
                        ),
                      )
                    : _items.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.notifications_none_rounded, size: 40, color: AppColors.mutedForeground.withValues(alpha: 0.4)),
                                const SizedBox(height: 12),
                                Text('You\'re all caught up', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                                const SizedBox(height: 4),
                                Text('We\'ll let you know when something happens', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground.withValues(alpha: 0.7))),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            itemCount: _items.length,
                            itemBuilder: (context, i) {
                              final n = _items[i];
                              final title = n['title']?.toString() ?? n['type']?.toString() ?? 'Update';
                              final body = n['body']?.toString() ?? '';
                              final read = n['isRead'] == true;
                              final type = n['type']?.toString() ?? 'system';
                              final createdAt = n['createdAt']?.toString();
                              final actor = n['actor'] is Map ? Map<String, dynamic>.from(n['actor'] as Map) : null;
                              final actorName = actor?['name']?.toString();
                              final actorAvatar = actor?['avatarUrl']?.toString() ?? actor?['avatar']?.toString();
                              final time = _relTime(createdAt);

                              return GestureDetector(
                                onTap: () => _onTapNotification(n),
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 2),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: read ? Colors.transparent : AppColors.primary.withValues(alpha: 0.04),
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Stack(
                                        children: [
                                          CircleAvatar(
                                            radius: 20,
                                            backgroundImage: actorAvatar != null && actorAvatar.isNotEmpty ? NetworkImage(actorAvatar) : null,
                                            backgroundColor: _colorFor(type).withValues(alpha: 0.12),
                                            child: actorAvatar == null || actorAvatar.isEmpty
                                                ? Icon(_iconFor(type), size: 18, color: _colorFor(type))
                                                : null,
                                          ),
                                          if (!read)
                                            Positioned(
                                              right: 0, top: 0,
                                              child: Container(
                                                width: 8, height: 8,
                                                decoration: const BoxDecoration(
                                                  color: AppColors.primary,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                            ),
                                        ],
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
                                              Padding(
                                                padding: const EdgeInsets.only(top: 2),
                                                child: Text(body, maxLines: 2, overflow: TextOverflow.ellipsis,
                                                  style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground, height: 1.3)),
                                              ),
                                            if (time.isNotEmpty)
                                              Padding(
                                                padding: const EdgeInsets.only(top: 4),
                                                child: Text(time, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground.withValues(alpha: 0.7))),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
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
