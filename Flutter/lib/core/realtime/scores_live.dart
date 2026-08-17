import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

typedef ScoresLiveCallback = void Function(Map<String, dynamic> payload);

/// Socket.IO live scores — mirrors web useScoresLive (scores_feed / match_update).
class ScoresLiveClient {
  io.Socket? _socket;
  ScoresLiveCallback? _onUpdate;
  final Set<String> _joinedMatches = {};
  bool _connected = false;
  final _statusCtrl = StreamController<String>.broadcast();

  Stream<String> get status$ => _statusCtrl.stream;
  bool get isConnected => _connected && _socket?.connected == true;

  void connect({
    ScoresLiveCallback? onUpdate,
    String? userId,
    String? baseUrl,
  }) {
    _onUpdate = onUpdate;
    _statusCtrl.add('connecting');
    try {
      _socket?.dispose();
      final uri = baseUrl ?? 'https://sportssphere.fun';
      _socket = io.io(
        uri,
        io.OptionBuilder()
            .setPath('/socket.io')
            .setTransports(['websocket', 'polling'])
            .enableReconnection()
            .setReconnectionAttempts(20)
            .setReconnectionDelay(1500)
            .build(),
      );

      _socket!
        ..onConnect((_) {
          _connected = true;
          _statusCtrl.add('live');
          if (kDebugMode) debugPrint('[WS] connected');
          if (userId != null && userId.isNotEmpty) {
            _socket!.emit('register_user', userId);
          }
          for (final id in _joinedMatches) {
            _socket!.emit('join_match', id);
          }
          _onUpdate?.call({'type': 'connected', 'at': DateTime.now().toIso8601String()});
        })
        ..onDisconnect((_) {
          _connected = false;
          _statusCtrl.add('offline');
          if (kDebugMode) debugPrint('[WS] disconnected');
        })
        ..onConnectError((e) {
          _statusCtrl.add('error');
          if (kDebugMode) debugPrint('[WS] connect error: $e');
        })
        ..on('scores_feed', (data) => _emit(data))
        ..on('match_update', (data) {
          _emit({'type': 'match_update', 'match': data});
        })
        ..on('feed_update', (data) {
          _emit({'type': 'feed_update', 'payload': data});
        })
        ..on('notification_push', (data) {
          _emit({'type': 'notification_push', 'payload': data});
        })
        ..on('presence_update', (data) {
          _emit({'type': 'presence_update', 'payload': data});
        });
    } catch (e) {
      _statusCtrl.add('error');
      if (kDebugMode) debugPrint('ScoresLive connect failed: $e');
    }
  }

  void joinMatch(String matchId) {
    if (matchId.isEmpty) return;
    _joinedMatches.add(matchId);
    _socket?.emit('join_match', matchId);
  }

  void leaveMatch(String matchId) {
    _joinedMatches.remove(matchId);
    _socket?.emit('leave_match', matchId);
  }

  void _emit(dynamic data) {
    if (data is Map) {
      _onUpdate?.call(Map<String, dynamic>.from(data));
    } else if (data is List) {
      _onUpdate?.call({'type': 'scores_feed', 'matches': data});
    }
  }

  void dispose() {
    for (final id in _joinedMatches.toList()) {
      leaveMatch(id);
    }
    _joinedMatches.clear();
    _socket?.dispose();
    _socket = null;
    _connected = false;
    _statusCtrl.close();
  }
}
