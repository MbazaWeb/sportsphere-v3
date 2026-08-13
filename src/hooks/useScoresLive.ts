'use client';

import { useEffect } from 'react';

/**
 * Subscribe to global scores_feed WebSocket events and refresh callback
 * when admin updates matches/leagues.
 */
export function useScoresLive(onUpdate: (payload: any) => void) {
  useEffect(() => {
    let socket: any;
    let cancelled = false;

    (async () => {
      try {
        const mod = await import('socket.io-client');
        if (cancelled) return;
        socket = mod.io({
          path: '/socket.io',
          transports: ['websocket', 'polling'],
        });
        socket.on('scores_feed', (data: any) => {
          onUpdate(data);
        });
        socket.on('match_update', (data: any) => {
          onUpdate({ type: 'match_update', match: data });
        });
      } catch (e) {
        console.warn('[useScoresLive] socket unavailable', e);
      }
    })();

    return () => {
      cancelled = true;
      try {
        socket?.disconnect();
      } catch {}
    };
  }, [onUpdate]);
}
