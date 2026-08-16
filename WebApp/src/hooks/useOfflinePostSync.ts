'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { drainQueue, getQueuedPosts, onQueueChange, isOffline } from '@/lib/offline-posts';
import { useUIStore } from '@/store/uiStore';

/**
 * useOfflinePostSync — keeps the offline post queue drained.
 *
 * Mount this once at the app root (src/app/page.tsx). It:
 *   - Listens to `online`/`offline` window events
 *   - Drains the queue immediately on mount (in case a post was queued last session)
 *   - Drains the queue whenever `online` fires
 *   - Polls every 60s while online (in case the online event missed)
 *   - Surfaces a toast when posts successfully sync
 *   - Exposes `pendingCount` so the UI can show a "X posts pending" badge
 */
export function useOfflinePostSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const showToast = useUIStore((s) => s.showToast);
  const drainingRef = useRef(false);

  const drain = useCallback(async (silent = false) => {
    if (drainingRef.current) return;
    if (isOffline()) return;
    const queue = getQueuedPosts();
    if (queue.length === 0) return;

    drainingRef.current = true;
    setSyncing(true);
    try {
      const { synced, remaining } = await drainQueue();
      setPendingCount(remaining);
      if (synced > 0 && !silent) {
        showToast(
          synced === 1
            ? 'Your offline post was published! 🎉'
            : `${synced} offline posts published! 🎉`
        );
      }
    } finally {
      drainingRef.current = false;
      setSyncing(false);
    }
  }, [showToast]);

  // Subscribe to queue changes + initial count
  useEffect(() => {
    const unsub = onQueueChange((count) => setPendingCount(count));
    return unsub;
  }, []);

  // Try to drain on mount (handles session resume)
  useEffect(() => {
    drain(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for online event
  useEffect(() => {
    const handleOnline = () => {
      // Small delay so connection stabilizes
      setTimeout(() => drain(false), 800);
    };
    const handleOffline = () => {
      // Just update state; nothing to do
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [drain]);

  // Poll every 60s while online (catches missed online events)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOffline() && getQueuedPosts().length > 0) {
        drain(true);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [drain]);

  return { pendingCount, syncing, drain };
}
