import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { recountUser, defaultKind } from '@/lib/follow-counts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const list = request.nextUrl.searchParams.get('list') || 'followers';
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    let q = supabaseAdmin.from('ss_follow').select('id,follower_id,following_id,kind,created_at');
    if (list === 'following') q = q.eq('follower_id', userId);
    else if (list === 'fans') q = q.eq('following_id', userId).eq('kind', 'fan');
    else q = q.eq('following_id', userId); // followers (follow + fan)

    const { data, error } = await q.limit(200);
    if (error && isMissingTable(error)) return NextResponse.json([]);

    const ids = [...new Set((data || []).map((r) => list === 'following' ? r.following_id : r.follower_id))];
    const users: Record<string, any> = {};
    if (ids.length) {
      const { data: u } = await supabaseAdmin
        .from('ss_user')
        .select('id,name,handle,avatar_url,avatar_initials,role,is_verified')
        .in('id', ids);
      for (const row of u || []) users[row.id] = row;
    }

    return NextResponse.json((data || []).map((r) => {
      const uid = list === 'following' ? r.following_id : r.follower_id;
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
    const action = String(body.action || '').toLowerCase(); // follow | fan | unfollow | unfan | toggle
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId is required.' }, { status: 400 });
    if (userId === targetUserId) return NextResponse.json({ error: 'Cannot follow yourself.' }, { status: 400 });

    const { data: target } = await supabaseAdmin.from('ss_user').select('id,role').eq('id', targetUserId).limit(1);
    if (!target?.length) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const { data: existing } = await supabaseAdmin
      .from('ss_follow')
      .select('id,kind')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .limit(1);

    const row = existing?.[0];
    const wantOff = action === 'unfollow' || action === 'unfan';
    let following = !!row;
    let kind = row?.kind || defaultKind(target[0].role, action);

    if (wantOff && row) {
      await supabaseAdmin.from('ss_follow').delete().eq('follower_id', userId).eq('following_id', targetUserId);
      following = false;
    } else if (!row && !wantOff) {
      kind = defaultKind(target[0].role, action === 'toggle' ? undefined : action);
      const { error } = await supabaseAdmin.from('ss_follow').insert({
        follower_id: userId,
        following_id: targetUserId,
        kind,
      });
      if (error && !String(error.message).toLowerCase().includes('duplicate')) {
        if (!isMissingTable(error)) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      following = true;
    } else if (row && (action === 'fan' || action === 'follow') && row.kind !== action) {
      await supabaseAdmin.from('ss_follow').update({ kind: action }).eq('id', row.id);
      kind = action;
      following = true;
    }

    const [me, them] = await Promise.all([recountUser(userId), recountUser(targetUserId)]);
    return NextResponse.json({
      following,
      isFan: following && kind === 'fan',
      kind: following ? kind : null,
      ...them,
      myFollowingCount: me.followingCount,
    });
  } catch (e) {
    console.error('follow', e);
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
  }
}
