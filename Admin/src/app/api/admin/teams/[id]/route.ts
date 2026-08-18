import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (['name','slug','city','country','venue'].includes(k)) update[k] = v;
    if (k === 'logoUrl') update.logo_url = v;
    if (k === 'leagueId') update.league_id = v;
  }
  const { data, error } = await supabaseAdmin.from('ss_team').update(update).eq('id', id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  await supabaseAdmin.from('ss_team').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
