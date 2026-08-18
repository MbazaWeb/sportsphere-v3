import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ error: 'postId is required.' }, { status: 400 });

    const { data: existing, error: findErr } = await supabaseAdmin
      .from('ss_post_like')
      .select('id')
      .eq('post_id', String(postId))
      .eq('user_id', userId)
      .limit(1);
    if (findErr && !isMissingTable(findErr)) throw new Error(findErr.message);

    if (existing?.length) {
      await supabaseAdmin.from('ss_post_like').delete().eq('post_id', String(postId)).eq('user_id', userId);
    } else {
      await supabaseAdmin.from('ss_post_like').insert({ post_id: String(postId), user_id: userId });
    }

    const { count } = await supabaseAdmin
      .from('ss_post_like')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', String(postId));
    const likeCount = count ?? 0;
    await supabaseAdmin.from('ss_post').update({ like_count: likeCount }).eq('id', String(postId));
    return NextResponse.json({ liked: !existing?.length, likeCount });
  } catch (e) {
    console.error('Like error:', e);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
