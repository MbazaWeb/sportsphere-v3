import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { safeJsonParse } from '@/lib/json';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    let q = supabaseAdmin
      .from('ss_post')
      .select('id,user_id,content,post_type,media_urls,like_count,comment_count,created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error && !isMissingTable(error)) throw new Error(error.message);
    return NextResponse.json(
      (data || []).map((p) => ({
        id: p.id,
        userId: p.user_id,
        content: p.content,
        postType: p.post_type,
        mediaUrls: safeJsonParse(p.media_urls, []),
        likeCount: p.like_count ?? 0,
        commentCount: p.comment_count ?? 0,
        createdAt: p.created_at,
      })),
    );
  } catch (e) {
    console.error('posts GET', e);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      content,
      postType = 'post',
      mediaUrls = [],
      teamTag,
      playerTag,
      hashtags = [],
      location,
      isBreaking = false,
    } = body as {
      content?: string;
      postType?: string;
      mediaUrls?: string[];
      teamTag?: string;
      playerTag?: string;
      hashtags?: string[];
      location?: string;
      isBreaking?: boolean;
    };

    const valid = ['post', 'photo', 'video', 'spotlight', 'poll', 'prediction', 'highlight', 'welcome', 'match'];
    if (!valid.includes(postType)) {
      return NextResponse.json({ error: 'Invalid post type.' }, { status: 400 });
    }
    if (['photo', 'video', 'spotlight'].includes(postType) && (!Array.isArray(mediaUrls) || mediaUrls.length === 0)) {
      return NextResponse.json({ error: 'Media is required for this post type.' }, { status: 400 });
    }
    if (['post', 'poll', 'prediction'].includes(postType) && !String(content || '').trim()) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const row = {
      id,
      user_id: userId,
      content: String(content || '').trim(),
      post_type: postType,
      media_urls: JSON.stringify(Array.isArray(mediaUrls) ? mediaUrls : []),
      team_tag: teamTag || null,
      player_tag: playerTag || null,
      hashtags: JSON.stringify(Array.isArray(hashtags) ? hashtags : []),
      location: location || null,
      is_breaking: Boolean(isBreaking),
      like_count: 0,
      comment_count: 0,
    };

    const { data, error } = await supabaseAdmin.from('ss_post').insert(row).select('*').maybeSingle();
    if (error) {
      console.error('posts insert', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data?.id || id,
      userId,
      content: row.content,
      postType,
      mediaUrls,
      createdAt: data?.created_at || new Date().toISOString(),
    }, { status: 201 });
  } catch (e) {
    console.error('posts POST', e);
    return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 });
  }
}
