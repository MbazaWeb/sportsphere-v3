import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/providers/app_providers.dart';
import '../../shared/widgets/ss_refresh.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_card.dart';
import '../messages/presentation/chat_thread_sheet.dart';
import '../profile/presentation/user_profile_sheet.dart';
import '../../../core/constants/api_config.dart';


String _resolveUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final base = ApiConfig.baseUrl;
  return url.startsWith('/') ? '\$base\$url' : '\$base/\$url';
}


/// Activity tab — guest gate + notifications, messages, grouped by type.
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
    'goal', 'match_goal', 'prediction', 'result', 'transfer', 'poll_result',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) return;
    setState(() { _loading = true; _error = null; });
    try {
      final notifs = await ref.read(socialApiProvider).getNotifications();
      List<Map<String, dynamic>> convos = [];
      try {
        convos = await ref.read(messagesApiProvider).getConversations();
      } catch (_) {}
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

  Future<void> _markAllRead() async {
    try {
      await ref.read(socialApiProvider).markNotificationsRead();
      if (!mounted) return;
      setState(() {
        for (var i = 0; i < _items.length; i++) {
          _items[i] = Map<String, dynamic>.from(_items[i])..['isRead'] = true;
        }
      });
    } catch (_) {}
  }

  List<Map<String, dynamic>> get _filtered {
    if (_sub == 'all') return _items;
    if (_sub == 'messages') return const [];
    if (_sub == 'social') {
      return _items.where((n) => _socialTypes.contains(n['type']?.toString() ?? '')).toList();
    }
    if (_sub == 'sports') {
      return _items.where((n) => _sportsTypes.contains(n['type']?.toString() ?? '')).toList();
    }
    return _items;
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'like': return Icons.favorite_rounded;
      case 'follow': return Icons.person_add_alt_1_rounded;
      case 'comment': return Icons.chat_bubble_rounded;
      case 'goal': case 'match_goal': return Icons.sports_soccer;
      case 'prediction': case 'result': return Icons.emoji_events_rounded;
      case 'transfer': return Icons.swap_horiz_rounded;
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
    } catch (_) { return ''; }
  }

  void _onNotifTap(Map<String, dynamic> n) {
    final type = n['type']?.toString() ?? '';
    final actor = n['actor'] is Map ? Map<String, dynamic>.from(n['actor'] as Map) : null;
    final actorId = actor?['id']?.toString();
    final actorHandle = actor?['handle']?.toString();
    if ((type == 'follow' || type == 'like' || type == 'comment') && actorId != null && actorHandle != null) {
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
    }
  }

  int get _unreadCount => _items.where((n) => n['isRead'] != true).length;

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
                    width: 64, height: 64,
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
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
            child: Row(
              children: [
                Text('Activity', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
                if (_unreadCount > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                    child: Text('$_unreadCount', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryForeground)),
                  ),
                ],
                const Spacer(),
                if (_unreadCount > 0 && _sub != 'messages')
                  TextButton(
                    onPressed: _markAllRead,
                    child: Text('Mark all read', style: GoogleFonts.inter(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                  ),
                IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh_rounded, size: 22)),
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
                        Text(label, style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.w600, color: active ? AppColors.primaryForeground : AppColors.mutedForeground)),
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
                          child: Column(mainAxisSize: MainAxisSize.min, children: [
                            Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                            const SizedBox(height: 12),
                            TextButton(onPressed: _load, child: const Text('Retry')),
                          ]),
                        ),
                      )
                    : _sub == 'messages'
                        ? _buildMessagesList()
                        : filtered.isEmpty
                            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                                Icon(_sub == 'social' ? Icons.favorite_border_rounded : _sub == 'sports' ? Icons.emoji_events_outlined : Icons.notifications_none_rounded,
                                    size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.3)),
                                const SizedBox(height: 12),
                                Text(
                                  _sub == 'social' ? 'No social activity yet' : _sub == 'sports' ? 'No sports updates yet' : 'No activity yet',
                                  style: GoogleFonts.inter(color: AppColors.mutedForeground),
                                ),
                              ]))
                            : _buildNotifList(filtered),
          ),
        ],
      ),
    );
  }

  Widget _buildMessagesList() {
    if (_conversations.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.chat_bubble_outline_rounded, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.3)),
        const SizedBox(height: 12),
        Text('No messages yet', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
        const SizedBox(height: 4),
        Text('Start a conversation from someone\'s profile', style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground.withValues(alpha: 0.7))),
      ]));
    }
    return SsRefresh(
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
          final avatar = c['partnerAvatarUrl']?.toString() ?? '';
          final time = _relTime(c['lastAt']?.toString());
          return GestureDetector(
            onTap: partnerId.isEmpty ? null : () {
              showModalBottomSheet(
                context: context, isScrollControlled: true, backgroundColor: Colors.transparent,
                builder: (_) => ChatThreadSheet(partnerId: partnerId, partnerName: name, partnerHandle: handle, seedMessage: last),
              );
            },
            child: GlassCard(
              borderRadius: 16,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Row(
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundImage: avatar.isNotEmpty ? NetworkImage(_resolveUrl(avatar)) : null,
                        backgroundColor: AppColors.surfaceElevated,
                        child: avatar.isEmpty ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: GoogleFonts.inter(fontWeight: FontWeight.w700)) : null,
                      ),
                      if (unread > 0)
                        Positioned(right: 0, bottom: 0,
                          child: Container(width: 18, height: 18,
                            decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                            child: Center(child: Text('$unread', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white))),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Flexible(child: Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14), overflow: TextOverflow.ellipsis)),
                        const Spacer(),
                        if (time.isNotEmpty) Text(time, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                      ]),
                      const SizedBox(height: 2),
                      Text(last, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground)),
                    ]),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotifList(List<Map<String, dynamic>> filtered) {
    return SsRefresh(
      onRefresh: _load,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
        itemCount: filtered.length,
        itemBuilder: (context, i) {
          final n = filtered[i];
          final type = n['type']?.toString() ?? 'system';
          final title = n['title']?.toString() ?? type;
          final body = n['body']?.toString() ?? '';
          final read = n['isRead'] == true;
          final actor = n['actor'] is Map ? Map<String, dynamic>.from(n['actor'] as Map) : null;
          final actorName = actor?['name']?.toString();
          final actorAvatar = actor?['avatarUrl']?.toString() ?? actor?['avatar']?.toString();
          final createdAt = n['createdAt']?.toString();
          final time = _relTime(createdAt);

          return GestureDetector(
            onTap: () => _onNotifTap(n),
            child: Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: read ? Colors.transparent : AppColors.primary.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(16),
                border: read ? null : Border.all(color: AppColors.primary.withValues(alpha: 0.08)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: actorAvatar != null && actorAvatar.isNotEmpty ? NetworkImage(_resolveUrl(actorAvatar)) : null,
                    backgroundColor: _colorFor(type).withValues(alpha: 0.12),
                    child: actorAvatar == null || actorAvatar.isEmpty
                        ? Icon(_iconFor(type), size: 18, color: _colorFor(type))
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(title, style: GoogleFonts.inter(fontWeight: read ? FontWeight.w500 : FontWeight.w700, fontSize: 14)),
                      if (body.isNotEmpty) Text(body, maxLines: 2, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(fontSize: 12.5, color: AppColors.mutedForeground, height: 1.3)),
                      Row(children: [
                        if (actorName != null) Text(actorName, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                        if (actorName != null && time.isNotEmpty) Text(' · ', style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                        if (time.isNotEmpty) Text(time, style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground)),
                      ]),
                    ]),
                  ),
                  if (!read) Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
