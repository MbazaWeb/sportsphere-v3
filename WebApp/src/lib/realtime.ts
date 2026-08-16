/**
 * SportSphere — Real-time triggers (Next.js → WS internal API :3005)
 */

const WS_INTERNAL_URL = process.env.WS_INTERNAL_URL || "http://127.0.0.1:3005";

export async function emitRealtimeEvent(
  event: string,
  data: unknown,
  room?: string,
  rooms?: string[]
) {
  try {
    const res = await fetch(WS_INTERNAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data, room, rooms }),
    });
    if (!res.ok) {
      console.warn(`[Realtime] emit ${event} failed: ${res.status}`);
    }
  } catch (error) {
    console.error(`[Realtime] WS unreachable for ${event}:`, error);
  }
}

export const realtime = {
  matchUpdate: (matchId: string, matchData: unknown) => {
    void emitRealtimeEvent("match_update", matchData, `match_${matchId}`);
    void emitRealtimeEvent("scores_feed", { type: "match_update", match: matchData });
  },
  leagueUpdate: (leagueId: string, data: unknown) => {
    void emitRealtimeEvent("league_update", data, `league_${leagueId}`);
    void emitRealtimeEvent("scores_feed", { type: "league_update", league: data });
  },
  newComment: (postId: string, comment: unknown) => {
    void emitRealtimeEvent("new_comment", comment, `post_${postId}`);
    void emitRealtimeEvent("feed_update", { type: "comment", postId, comment }, "feed");
  },
  postCreated: (post: unknown) => {
    void emitRealtimeEvent("post_created", post, "feed");
    void emitRealtimeEvent("feed_update", { type: "post", post }, "feed");
    void emitRealtimeEvent("admin_activity", { type: "post_created", at: Date.now() }, "admin");
  },
  likeUpdated: (postId: string, payload: { likeCount: number; liked?: boolean; userId?: string }) => {
    void emitRealtimeEvent("like_update", { postId, ...payload }, `post_${postId}`);
    void emitRealtimeEvent("feed_update", { type: "like", postId, ...payload }, "feed");
  },
  followUpdated: (payload: {
    followerId: string;
    followingId: string;
    following?: boolean;
  }) => {
    void emitRealtimeEvent("follow_update", payload, `user_${payload.followingId}`);
    void emitRealtimeEvent("follow_update", payload, `user_${payload.followerId}`);
    void emitRealtimeEvent("admin_activity", { type: "follow", at: Date.now() }, "admin");
  },
  systemAlert: (message: string) => {
    void emitRealtimeEvent("system_alert", { message });
  },
  userNotification: (userId: string, data?: unknown) => {
    void emitRealtimeEvent(
      "notification_received",
      data ?? { unreadCount: 1 },
      `user_${userId}`
    );
  },
  presenceHint: () => {
    void emitRealtimeEvent("presence_ping", { at: Date.now() });
  },
};
