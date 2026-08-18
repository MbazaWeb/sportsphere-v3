import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { recountUser } from '@/lib/follow-counts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const list = request.nextUrl.searchParams.get('list') || 'followers';
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    let q = supabaseAdmin.from('ss_follow').select('id,follower_id,following_id,kind,created_at');
    if (list === 'following') q = q.eq('follower_id', userId).eq('kind', 'follow');
    else if (list === 'fans') q = q.eq('following_id', userId).eq('kind', 'fan');
    else if (list === 'fanning') q = q.eq('follower_id', userId).eq('kind', 'fan');
    else q = q.eq('following_id', userId).eq('kind', 'follow');

    const { data, error } = await q.limit(200);
    if (error && isMissingTable(error)) return NextResponse.json([]);

    const ids = [...new Set((data || []).map((r) =>
      list === 'following' || list === 'fanning' ? r.following_id : r.follower_id
    ))];
    const users: Record<string, any> = {};
    if (ids.length) {
      const { data: u } = await supabaseAdmin
        .from('ss_user')
        .select('id,name,handle,avatar_url,avatar_initials,role,is_verified')
        .in('id', ids);
      for (const row of u || []) users[row.id] = row;
    }

    return NextResponse.json((data || []).map((r) => {
      const uid = list === 'following' || list === 'fanning' ? r.following_id : r.follower_id;
      const u = users[uid] || {};
      return {
        id: r.id,
        kind: r.kind,
        createdAt: r.created_at,
        user: {
          id: u.id || uid,
          name: u.name || 'User',
          handle: u.handle || '',
          avatarUrl: u.avatar_url,
          avatarInitials: u.avatar_initials,
          role: u.role,
          isVerified: !!u.is_verified,
        },
      };
    }));
  } catch (e) {
    console.error('follows GET', e);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const body = await request.json();
    const targetUserId = String(body.targetUserId || '');
    const action = String(body.action || 'follow').toLowerCase();
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId is required.' }, { status: 400 });
    if (userId === targetUserId) return NextResponse.json({ error: 'Cannot follow yourself.' }, { status: 400 });

    const kind = action.includes('fan') ? 'fan' : 'follow';
    const turningOff = action.startsWith('un');

    const { data: existing } = await supabaseAdmin
      .from('ss_follow')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .eq('kind', kind)
      .limit(1);

    if (turningOff || existing?.length) {
      if (existing?.length && (turningOff || !action.startsWith('un') && existing.length)) {
        if (turningOff || existing.length) {
          await supabaseAdmin
            .from('ss_follow')
            .delete()
            .eq('follower_id', userId)
            .eq('following_id', targetUserId)
            .eq('kind', kind);
        }
      }
    }

    const shouldOn = !turningOff && !existing?.length;
    if (shouldOn) {
      const { error } = await supabaseAdmin.from('ss_follow').insert({
        follower_id: userId,
        following_id: targetUserId,
        kind,
      });
      if (error && !String(error.message).toLowerCase().includes('duplicate')) {
        if (!isMissingTable(error)) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // toggle: if action is follow/fan and row existed, we deleted it (unfollow that kind)
    if (!turningOff && existing?.length) {
      // already deleted above as toggle off
    }

    const { data: mine } = await supabaseAdmin
      .from('ss_follow')
      .select('kind')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);

    const kinds = new Set((mine || []).map((r) => r.kind));
    const them = await recountUser(targetUserId);
    const me = await recountUser(userId);

    return NextResponse.json({
      following: kinds.has('follow'),
      isFan: kinds.has('fan'),
      ...them,
      myFollowingCount: me.followingCount,
    });
  } catch (e) {
    console.error('follow', e);
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
  }
}
