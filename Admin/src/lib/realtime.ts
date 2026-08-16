const WS_INTERNAL_URL = process.env.WS_INTERNAL_URL || 'http://127.0.0.1:3005';

export async function emitRealtimeEvent(event: string, data: any, room?: string) {
  try {
    const res = await fetch(WS_INTERNAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, room }),
    });
    if (!res.ok) {
      console.warn(`[Realtime] Failed to emit ${event}: ${res.status}`);
    }
  } catch (error) {
    console.error(`[Realtime] WS connection error:`, error);
  }
}

export const realtime = {
  matchUpdate: (matchId: string, matchData: any) => {
    emitRealtimeEvent('match_update', matchData, `match_${matchId}`);
    emitRealtimeEvent('scores_feed', { type: 'match_update', match: matchData });
  },
  leagueUpdate: (leagueId: string, data: any) => {
    emitRealtimeEvent('league_update', data, `league_${leagueId}`);
    emitRealtimeEvent('scores_feed', { type: 'league_update', league: data });
  },
  systemAlert: (message: string) => emitRealtimeEvent('system_alert', { message }),
};
