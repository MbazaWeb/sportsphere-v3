import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const { targetUserId, action: explicitAction } = await request.json();
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId is required.' }, { status: 400 });
    if (userId === targetUserId) return NextResponse.json({ error: 'Cannot follow yourself.' }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from('ss_follow')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', String(targetUserId))
      .limit(1);

    if (existing?.length) {
      await supabaseAdmin.from('ss_follow').delete().eq('follower_id', userId).eq('following_id', String(targetUserId));
    } else {
      const kind = explicitAction === 'fan' ? 'fan' : 'follow';
      const { error } = await supabaseAdmin.from('ss_follow').insert({
        follower_id: userId,
        following_id: String(targetUserId),
        kind,
      });
      if (error && !isMissingTable(error)) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { count: myFollowing } = await supabaseAdmin.from('ss_follow').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
    const { count: theirFollowers } = await supabaseAdmin.from('ss_follow').select('*', { count: 'exact', head: true }).eq('following_id', String(targetUserId));
    return NextResponse.json({
      following: !existing?.length,
      isFan: !existing?.length,
      fanCount: theirFollowers ?? 0,
      followerCount: theirFollowers ?? 0,
      followingCount: myFollowing ?? 0,
    });
  } catch (e) {
    console.error('follow', e);
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
  }
}
