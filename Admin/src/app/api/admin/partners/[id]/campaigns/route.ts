import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ssList, jsonData } from '@/lib/admin-ss';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const { id } = await Promise.resolve(ctx.params as any);
  const rows = await ssList('ss_partner_campaigns', (q) => q.eq('partner_id', id).limit(100));
  return jsonData(rows);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const { id } = await Promise.resolve(ctx.params as any);
  const body = await request.json().catch(() => ({}));
  const { data, error } = await supabaseAdmin.from('ss_partner_campaigns').insert({ id: crypto.randomUUID(), partner_id: id, ...body }).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message, data: [] });
  return NextResponse.json({ data });
}
