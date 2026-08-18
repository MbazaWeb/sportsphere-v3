import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const TABLE = 'ss_role';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const { data } = await supabaseAdmin.from(TABLE).select('*').eq('id', id).limit(1);
  return NextResponse.json(data?.[0] || {});
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const body = await request.json().catch(() => ({}));
  const { data, error } = await supabaseAdmin.from(TABLE).update(body).eq('id', id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 200 });
  return NextResponse.json(data || { ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  await supabaseAdmin.from(TABLE).delete().eq('id', id);
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ ok: true, id, ...body });
}
