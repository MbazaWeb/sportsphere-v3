import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../constants/api_config.dart';

typedef ScoresLiveCallback = void Function(Map<String, dynamic> payload);

/// Socket.IO live scores — mirrors web useScoresLive (scores_feed / match_update).
class ScoresLiveClient {
  io.Socket? _socket;
  ScoresLiveCallback? _onUpdate;
  final _statusCtrl = StreamController<String>.broadcast();

  Stream<String> get status$ => _statusCtrl.stream;
  String status = 'idle';

  void connect({ScoresLiveCallback? onUpdate}) {
    _onUpdate = onUpdate;
    try {
      final origin = ApiConfig.baseUrl; // https://sportssphere.fun
      _socket?.dispose();
      _socket = io.io(
        origin,
        io.OptionBuilder()
            .setPath('/socket.io')
            .setTransports(['websocket', 'polling'])
            .enableReconnection()
            .setReconnectionAttempts(100)
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(15000)
            .build(),
      );
      _set('connecting');
      _socket!
        ..onConnect((_) {
          _set('connected');
          _bind();
        })
        ..onDisconnect((_) => _set('disconnected'))
        ..onConnectError((_) => _set('error'))
        ..on('scores_feed', (data) => _emit(data))
        ..on('match_update', (data) {
          _emit({'type': 'match_update', 'match': data});
        });
      _socket!.connect();
    } catch (e) {
      if (kDebugMode) debugPrint('ScoresLive connect failed: $e');
      _set('error');
    }
  }

  void _bind() {
    _socket?.off('scores_feed');
    _socket?.off('match_update');
    _socket?.on('scores_feed', (data) => _emit(data));
    _socket?.on('match_update', (data) {
      _emit({'type': 'match_update', 'match': data});
    });
  }

  void _emit(dynamic data) {
    if (data is Map) {
      _onUpdate?.call(Map<String, dynamic>.from(data));
    } else if (data != null) {
      _onUpdate?.call({'data': data});
    }
  }

  void _set(String s) {
    status = s;
    if (!_statusCtrl.isClosed) _statusCtrl.add(s);
  }

  void dispose() {
    try {
      _socket?.dispose();
    } catch (_) {}
    _socket = null;
    _statusCtrl.close();
  }
}
