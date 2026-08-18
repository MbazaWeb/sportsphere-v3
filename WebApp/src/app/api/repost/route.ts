import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { postId } = await request.json().catch(() => ({}));
  if (!postId) return NextResponse.json({ error: 'postId required.' }, { status: 400 });
  const { data: src } = await supabaseAdmin.from('ss_post').select('content,media_urls,post_type').eq('id', postId).limit(1);
  const orig = (src?.[0] || {}) as Record<string, any>;
  const id = crypto.randomUUID();
  const { error } = await supabaseAdmin.from('ss_post').insert({
    id, user_id: userId, content: orig.content || '', post_type: orig.post_type || 'post',
    media_urls: orig.media_urls || '[]', like_count: 0, comment_count: 0,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
