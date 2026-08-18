import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.body !== undefined) update.body = body.body;
  if (body.content !== undefined) update.body = body.content;
  if (body.published !== undefined) update.published = body.published;
  if (body.imageUrl !== undefined) update.image_url = body.imageUrl;
  const { data, error } = await supabaseAdmin.from('ss_news_item').update(update).eq('id', id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  await supabaseAdmin.from('ss_news_item').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
