import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const postId = request.nextUrl.searchParams.get('postId');
    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('ss_comment')
      .select('id,post_id,user_id,parent_id,content,like_count,created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(80);
    if (error) {
      if (isMissingTable(error)) return NextResponse.json([]);
      throw new Error(error.message);
    }
    const rows = data || [];
    const ids = [...new Set(rows.map((c) => c.user_id).filter(Boolean))];
    const users: Record<string, any> = {};
    if (ids.length) {
      const { data: u } = await supabaseAdmin.from('ss_user').select('id,name,handle,avatar_url,avatar_initials').in('id', ids);
      for (const row of u || []) users[row.id] = row;
    }
    return NextResponse.json(rows.map((c) => {
      const u = users[c.user_id] || {};
      return {
        id: c.id,
        postId: c.post_id,
        userId: c.user_id,
        parentId: c.parent_id,
        content: c.content,
        likeCount: c.like_count ?? 0,
        createdAt: c.created_at,
        replies: [],
        user: { id: u.id || c.user_id, name: u.name || 'User', handle: u.handle || '', avatarUrl: u.avatar_url, avatarInitials: u.avatar_initials || 'U' },
      };
    }));
  } catch (e) {
    console.error('comments GET', e);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const body = await request.json();
    const postId = body.postId;
    const content = String(body.content || '').trim();
    if (!postId || !content) return NextResponse.json({ error: 'postId and content required.' }, { status: 400 });
    const id = crypto.randomUUID();
    const { data, error } = await supabaseAdmin
      .from('ss_comment')
      .insert({ id, post_id: postId, user_id: userId, parent_id: body.parentId || null, content, like_count: 0 })
      .select('*')
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { count } = await supabaseAdmin.from('ss_comment').select('*', { count: 'exact', head: true }).eq('post_id', postId);
    await supabaseAdmin.from('ss_post').update({ comment_count: count ?? 0 }).eq('id', postId);
    return NextResponse.json({ id: data?.id || id, postId, userId, content, createdAt: data?.created_at }, { status: 201 });
  } catch (e) {
    console.error('comments POST', e);
    return NextResponse.json({ error: 'Failed to comment' }, { status: 500 });
  }
}
