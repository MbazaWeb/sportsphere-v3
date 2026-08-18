import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isMissingTable(error: any) {
  const msg = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '');
  return code === '42P01' || code === 'PGRST205' || msg.includes('does not exist') || msg.includes('could not find the table');
}

import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

async function count(table: string): Promise<number> {
  try {
    const { count: n, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      if (isMissingTable(error)) {
        console.warn('missing table', table);
        return 0;
      }
      console.error('count', table, error.message);
      return 0;
    }
    return n ?? 0;
  } catch (e) {
    console.error('count', table, e);
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const [users, posts, sports, teams, players, comments, likes, follows] = await Promise.all([
      count('ss_user'),
      count('ss_post'),
      count('ss_sport'),
      count('ss_team'),
      count('ss_player'),
      count('ss_comment'),
      count('ss_post_like'),
      count('ss_follow'),
    ]);

    return NextResponse.json({
      ok: true,
      network: {
        status: 'up',
        alert: null,
        services: [],
        connections: { https: 0, http: 0, fan: 0, admin: 0, ws: 0, total: 0 },
        pingMs: { fan: 0, admin: 0, ws: 0, api: 0 },
      },
      db: {
        users, posts, sports, pendingRoles: 0, news: 0, rumors: 0, pendingClaims: 0,
        teams, players, comments, likes, follows, polls: 0, onlineUsers: 0,
        activeUsers24h: 0, signupsToday: 0, postsToday: 0, imagePosts: 0, videoPosts: 0, pollPosts: 0,
      },
      series: [],
      postTypes: [],
      sports: [],
      flow: [],
      system: { cpu: 0, ram: 0, eth0: { rx: 0, tx: 0 } },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('overview-stats failed:', error);
    return NextResponse.json(
      { error: 'Failed to load overview stats', detail: String(error) },
      { status: 500 }
    );
  }
}
