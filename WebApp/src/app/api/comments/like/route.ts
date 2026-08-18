import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const { commentId } = await request.json();
    if (!commentId) return NextResponse.json({ error: 'commentId is required.' }, { status: 400 });
    const { data: existing, error } = await supabaseAdmin
      .from('ss_comment_like')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .limit(1);
    if (error && isMissingTable(error)) return NextResponse.json({ liked: false, likeCount: 0 });
    if (existing?.length) {
      await supabaseAdmin.from('ss_comment_like').delete().eq('comment_id', commentId).eq('user_id', userId);
    } else {
      await supabaseAdmin.from('ss_comment_like').insert({ comment_id: commentId, user_id: userId });
    }
    const { count } = await supabaseAdmin.from('ss_comment_like').select('*', { count: 'exact', head: true }).eq('comment_id', commentId);
    await supabaseAdmin.from('ss_comment').update({ like_count: count ?? 0 }).eq('id', commentId);
    return NextResponse.json({ liked: !existing?.length, likeCount: count ?? 0 });
  } catch (e) {
    console.error('comment like', e);
    return NextResponse.json({ liked: false, likeCount: 0 });
  }
}
