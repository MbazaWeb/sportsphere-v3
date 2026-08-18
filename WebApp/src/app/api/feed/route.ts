import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { safeJsonParse } from '@/lib/json';
import { publicUserView } from '@/lib/official-account';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'for-you';
    const userId = searchParams.get('userId');
    const q = searchParams.get('q')?.trim();

    let query = supabaseAdmin
      .from('ss_post')
      .select('id,user_id,content,post_type,media_urls,team_tag,player_tag,is_breaking,hashtags,like_count,comment_count,share_count,view_count,created_at,updated_at')
      .limit(type === 'for-you' ? 30 : 20);

    if (userId) query = query.eq('user_id', userId);
    if (q) query = query.ilike('content', `%${q}%`);
    if (type === 'spotlight') query = query.in('post_type', ['video', 'spotlight']);
    if (type === 'trending' || type === 'spotlight') query = query.order('like_count', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data: posts, error } = await query;
    if (error) throw new Error(error.message);

    const rows = posts ?? [];
    const ids = [...new Set(rows.map((p) => p.user_id).filter(Boolean))];

    let usersById: Record<string, any> = {};
    if (ids.length) {
      const { data: users } = await supabaseAdmin
        .from('ss_user')
        .select('id,name,handle,avatar_url,avatar_initials,role,is_verified,bio,location')
        .in('id', ids);
      for (const u of users ?? []) usersById[u.id] = u;
    }

    const parsed = rows.map((post) => {
      const u = usersById[post.user_id] || {};
      return {
        id: post.id,
        userId: post.user_id,
        content: post.content,
        postType: post.post_type,
        mediaUrls: safeJsonParse(post.media_urls, []),
        teamTag: post.team_tag,
        playerTag: post.player_tag,
        isBreaking: post.is_breaking,
        hashtags: safeJsonParse(post.hashtags, []),
        likeCount: post.like_count ?? 0,
        commentCount: post.comment_count ?? 0,
        shareCount: post.share_count ?? 0,
        viewCount: post.view_count ?? 0,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        comments: [],
        user: publicUserView({
          id: u.id || post.user_id,
          name: u.name || 'User',
          handle: u.handle || '',
          avatarUrl: u.avatar_url || null,
          avatarInitials: u.avatar_initials || 'U',
          role: u.role || 'fan',
          isVerified: !!u.is_verified,
          bio: u.bio || null,
          location: u.location || null,
        }),
      };
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
