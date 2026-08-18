import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Supabase Realtime channels for SportSphere.
///
/// Replaces socket.io for:
///   - Live scores (match table changes)
///   - Notifications (new notifications for current user)
///   - Messages (new messages in conversation)
///   - Feed (new posts from followed users)

final supabaseRealtimeProvider = Provider((ref) => SupabaseRealtime());

class SupabaseRealtime {
  final _client = Supabase.instance.client;

  // ─── Live Scores ──────────────────────────────────────────────────────────
  RealtimeChannel subscribeToScores({
    required void Function(Map<String, dynamic> match) onUpdate,
  }) {
    return _client
        .channel('public:match')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'match',
          callback: (payload) => onUpdate(payload.newRecord),
        )
        .subscribe();
  }

  // ─── Notifications ─────────────────────────────────────────────────────────
  RealtimeChannel subscribeToNotifications({
    required String userId,
    required void Function(Map<String, dynamic> notification) onNew,
  }) {
    return _client
        .channel('notifications:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notification',
          filter: PostgresChangeFilter(
            type: FilterType.eq,
            column: 'userId',
            value: userId,
          ),
          callback: (payload) => onNew(payload.newRecord),
        )
        .subscribe();
  }

  // ─── Messages ─────────────────────────────────────────────────────────────
  RealtimeChannel subscribeToMessages({
    required String userId,
    required String partnerId,
    required void Function(Map<String, dynamic> message) onNew,
  }) {
    return _client
        .channel('messages:$userId:$partnerId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'message',
          filter: PostgresChangeFilter(
            type: FilterType.eq,
            column: 'receiverId',
            value: userId,
          ),
          callback: (payload) {
            final msg = payload.newRecord;
            // Only surface messages from this conversation
            if (msg['senderId'] == partnerId || msg['receiverId'] == partnerId) {
              onNew(msg);
            }
          },
        )
        .subscribe();
  }

  // ─── New Posts in Feed ─────────────────────────────────────────────────────
  RealtimeChannel subscribeToFeed({
    required void Function(Map<String, dynamic> post) onNew,
  }) {
    return _client
        .channel('public:post')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'post',
          callback: (payload) => onNew(payload.newRecord),
        )
        .subscribe();
  }

  // ─── Presence (online users) ───────────────────────────────────────────────
  RealtimeChannel joinPresence({
    required String userId,
    required String username,
  }) {
    final channel = _client.channel('online-users');
    channel.subscribe((status, error) async {
      if (status == RealtimeSubscribeStatus.subscribed) {
        await channel.track({'user_id': userId, 'username': username, 'online_at': DateTime.now().toIso8601String()});
      }
    });
    return channel;
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  Future<void> unsubscribe(RealtimeChannel channel) async {
    await _client.removeChannel(channel);
  }

  Future<void> unsubscribeAll() async {
    await _client.removeAllChannels();
  }
}
