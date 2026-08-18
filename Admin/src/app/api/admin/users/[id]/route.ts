import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const { data } = await supabaseAdmin.from('ss_user').select('*').eq('id', id).limit(1);
  return NextResponse.json(data?.[0] || {}, { status: data?.[0] ? 200 : 404 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (body.role !== undefined) update.role = body.role;
  if (body.isVerified !== undefined) update.is_verified = body.isVerified;
  if (body.isActive !== undefined) update.is_active = body.isActive;
  if (body.name !== undefined) update.name = body.name;
  const { data, error } = await supabaseAdmin.from('ss_user').update(update).eq('id', id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const { error } = await supabaseAdmin.from('ss_user').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
