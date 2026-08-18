import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || '20')));
    const { data, error } = await supabaseAdmin
      .from('ss_post')
      .select('id,user_id,content,post_type,media_urls,like_count,comment_count,created_at')
      .eq('post_type', 'poll')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error && isMissingTable(error)) return NextResponse.json([]);
    return NextResponse.json((data || []).map((p) => ({
      id: p.id,
      userId: p.user_id,
      content: p.content,
      postType: p.post_type,
      mediaUrls: safeJsonParse(p.media_urls, []),
      likeCount: p.like_count ?? 0,
      commentCount: p.comment_count ?? 0,
      createdAt: p.created_at,
    })));
  } catch {
    return NextResponse.json([]);
  }
}
