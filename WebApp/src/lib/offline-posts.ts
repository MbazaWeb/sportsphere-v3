// SportSphere — Offline Post Queue
// Stores posts that failed to publish due to network errors in localStorage.
// When the network returns, the queue is drained automatically by useOfflinePostSync.
//
// Media is NOT stored here — only the post body (text, mediaUrls that are already
// uploaded to the server, hashtags, poll, prediction). If the user is composing a
// media post and the upload itself fails, we do not queue the post (the user must
// re-upload after reconnecting).

import { apiUrl } from './api';

const STORAGE_KEY = 'sportsphere:offline-posts';
const MAX_RETRIES = 5;

export interface QueuedPost {
  id: string;                  // client-side uuid for tracking
  body: Record<string, unknown>; // the POST /api/posts body
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function safeRead(): QueuedPost[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(queue: QueuedPost[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    // Notify listeners (other tabs / same tab listeners)
    window.dispatchEvent(new CustomEvent('offline-posts:updated', { detail: { count: queue.length } }));
  } catch (e) {
    // localStorage might be full — fail silently
    console.warn('Could not persist offline post queue:', e);
  }
}

/** Generate a simple unique id without crypto dependency. */
function genId(): string {
  return `qp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Add a post to the offline queue. Returns the queued post id. */
export function queuePost(body: Record<string, unknown>): string {
  const queue = safeRead();
  const item: QueuedPost = {
    id: genId(),
    body,
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(item);
  safeWrite(queue);
  return item.id;
}

/** Remove a post from the queue (after successful sync or user discard). */
export function removeQueuedPost(id: string): void {
  const queue = safeRead().filter(q => q.id !== id);
  safeWrite(queue);
}

/** Get all queued posts (newest first for UI display). */
export function getQueuedPosts(): QueuedPost[] {
  return safeRead().sort((a, b) => b.createdAt - a.createdAt);
}

/** Whether the browser is currently offline. */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * Attempt to push a single queued post to /api/posts.
 * Returns true on success, false on failure (the post stays in the queue).
 */
export async function syncOne(item: QueuedPost): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/posts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.body),
      credentials: 'include',
    });

    if (res.status === 201) {
      removeQueuedPost(item.id);
      return true;
    }

    // 4xx validation errors — the post will never succeed, drop it but log
    if (res.status >= 400 && res.status < 500) {
      let errMsg = `HTTP ${res.status}`;
      try { const j = await res.json(); errMsg = j?.error || errMsg; } catch { /* ignore */ }
      console.warn(`Offline post ${item.id} rejected (${res.status}): ${errMsg}. Discarding.`);
      removeQueuedPost(item.id);
      return false;
    }

    // 5xx — server error, retry later
    console.warn(`Offline post ${item.id} got ${res.status}, will retry.`);
    return false;
  } catch {
    // Network failure — leave in queue for next attempt
    return false;
  }
}

/**
 * Drain the queue: try to sync every queued post in order.
 * Bumps retryCount on each attempt; posts exceeding MAX_RETRIES are kept
 * (user can manually discard from UI).
 *
 * Returns the number of posts successfully synced.
 */
export async function drainQueue(): Promise<{ synced: number; remaining: number }> {
  const queue = safeRead();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  // Still offline? Don't try.
  if (isOffline()) return { synced: 0, remaining: queue.length };

  let synced = 0;
  // Iterate over a copy so removals during iteration don't break us
  const snapshot = [...queue];
  for (const item of snapshot) {
    const ok = await syncOne(item);
    if (ok) {
      synced++;
    } else {
      // Bump retry count on the item still in storage
      const current = safeRead();
      const updated = current.map(q =>
        q.id === item.id ? { ...q, retryCount: q.retryCount + 1, lastError: `Attempt ${q.retryCount + 1} failed` } : q
      );
      safeWrite(updated);
      // If the very first item in the queue fails, stop trying the rest —
      // likely the server is still down. This preserves order.
      if (!ok) break;
    }
  }

  return { synced, remaining: getQueuedPosts().length };
}

/** Discard all queued posts (user-initiated "clear" action). */
export function clearQueue(): void {
  safeWrite([]);
}

/** Subscribe to queue changes. Returns an unsubscribe fn. */
export function onQueueChange(cb: (count: number) => void): () => void {
  if (!isBrowser()) return () => { /* noop */ };
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as { count: number } | undefined;
    cb(detail?.count ?? getQueuedPosts().length);
  };
  window.addEventListener('offline-posts:updated', handler);
  // Initial call
  cb(getQueuedPosts().length);
  return () => window.removeEventListener('offline-posts:updated', handler);
}
