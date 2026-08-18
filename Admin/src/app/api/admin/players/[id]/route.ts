import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.position !== undefined) update.position = body.position;
  if (body.teamId !== undefined) update.team_id = body.teamId;
  if (body.photoUrl !== undefined) update.photo_url = body.photoUrl;
  const { data, error } = await supabaseAdmin.from('ss_player').update(update).eq('id', id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  await supabaseAdmin.from('ss_player').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
