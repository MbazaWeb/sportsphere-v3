'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getSharedSocket,
  onSocketStatus,
  type SocketStatus,
} from '@/lib/socket-client';

/**
 * Subscribe to global scores_feed / match_update with automatic
 * reconnection (handled by Socket.IO) and re-subscribe after reconnect.
 */
export function useScoresLive(onUpdate: (payload: any) => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const [status, setStatus] = useState<SocketStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    let socket: any;

    const handleScores = (data: any) => onUpdateRef.current(data);
    const handleMatch = (data: any) =>
      onUpdateRef.current({ type: 'match_update', match: data });

    const bind = (s: any) => {
      s.off('scores_feed', handleScores);
      s.off('match_update', handleMatch);
      s.on('scores_feed', handleScores);
      s.on('match_update', handleMatch);
      // re-join global presence room if needed later
    };

    const unsubStatus = onSocketStatus((st) => {
      if (!cancelled) setStatus(st);
    });

    (async () => {
      try {
        socket = await getSharedSocket();
        if (cancelled) return;
        bind(socket);

        // After every successful (re)connect, re-bind listeners
        socket.on('connect', () => {
          if (cancelled) return;
          bind(socket);
        });
      } catch (e) {
        console.warn('[useScoresLive] socket unavailable', e);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      unsubStatus();
      try {
        socket?.off('scores_feed', handleScores);
        socket?.off('match_update', handleMatch);
      } catch {
        /* ignore */
      }
    };
  }, []);

  return { status };
}
