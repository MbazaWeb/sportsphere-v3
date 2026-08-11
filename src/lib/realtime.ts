/**
 * SportSphere — Real-time triggering utility
 * -----------------------------------------
 * Allows the Next.js API routes to push events to the WebSocket server.
 */

const WS_INTERNAL_URL = 'http://127.0.0.1:3005';

export async function emitRealtimeEvent(event: string, data: any, room?: string) {
  try {
    const res = await fetch(WS_INTERNAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, room }),
    });

    if (!res.ok) {
      console.warn(`[Realtime] Failed to emit event ${event}: ${res.statusText}`);
    }
  } catch (error) {
    console.error(`[Realtime] Connection error to WS server:`, error);
  }
}

/**
 * Domain-specific triggers
 */
export const realtime = {
  // Notify match score update
  matchUpdate: (matchId: string, matchData: any) =>
    emitRealtimeEvent('match_update', matchData, `match_${matchId}`),

  // Notify new comment in a post
  newComment: (postId: string, comment: any) =>
    emitRealtimeEvent('new_comment', comment, `post_${postId}`),

  // Global system announcement
  systemAlert: (message: string) =>
    emitRealtimeEvent('system_alert', { message }),

  // User presence or notification badge update
  userNotification: (userId: string) =>
    emitRealtimeEvent('notification_received', { unreadCount: 1 }, `user_${userId}`),
};
