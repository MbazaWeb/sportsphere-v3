import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminGuard';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('ss_post')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error && isMissingTable(error)) return NextResponse.json([]);
  return NextResponse.json((data || []).map((p) => ({
    id: p.id,
    userId: p.user_id,
    content: p.content,
    postType: p.post_type,
    mediaUrls: p.media_urls,
    likeCount: p.like_count,
    commentCount: p.comment_count,
    createdAt: p.created_at,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  const body = await request.json().catch(() => ({}));
  const mediaUrls = Array.isArray(body.mediaUrls) ? body.mediaUrls : [];
  const row = {
    id: crypto.randomUUID(),
    user_id: body.userId || auth.user.sub,
    content: String(body.content || '').trim(),
    post_type: body.postType || (mediaUrls.length ? 'photo' : 'post'),
    media_urls: JSON.stringify(mediaUrls),
    like_count: 0,
    comment_count: 0,
    is_breaking: !!body.isBreaking,
  };
  const { data, error } = await supabaseAdmin.from('ss_post').insert(row).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
