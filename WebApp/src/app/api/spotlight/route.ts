import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('ss_post')
      .select('id,user_id,content,post_type,media_urls,like_count,comment_count,created_at')
      .in('post_type', ['video', 'spotlight'])
      .order('like_count', { ascending: false })
      .limit(20);
    if (error && !isMissingTable(error)) console.error('spotlight', error);
    const posts = data || [];
    const ids = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
    const usersById: Record<string, any> = {};
    if (ids.length) {
      const { data: users } = await supabaseAdmin
        .from('ss_user')
        .select('id,name,handle,avatar_url,avatar_initials')
        .in('id', ids);
      for (const u of users || []) usersById[u.id] = u;
    }
    return NextResponse.json(
      posts.map((p) => {
        const u = usersById[p.user_id] || {};
        return {
          id: p.id,
          userId: p.user_id,
          content: p.content,
          postType: p.post_type,
          mediaUrls: safeJsonParse(p.media_urls, []),
          likeCount: p.like_count ?? 0,
          commentCount: p.comment_count ?? 0,
          createdAt: p.created_at,
          user: {
            id: u.id || p.user_id,
            name: u.name || 'User',
            handle: u.handle || '',
            avatarUrl: u.avatar_url || null,
            avatarInitials: u.avatar_initials || 'U',
          },
        };
      }),
    );
  } catch (e) {
    console.error('spotlight', e);
    return NextResponse.json([]);
  }
}
