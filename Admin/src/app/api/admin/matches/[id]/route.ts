import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.homeScore !== undefined) update.home_score = body.homeScore;
  if (body.awayScore !== undefined) update.away_score = body.awayScore;
  if (body.kickoff !== undefined) update.kickoff = body.kickoff;
  const { data, error } = await supabaseAdmin.from('ss_match').update(update).eq('id', id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  await supabaseAdmin.from('ss_match').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
