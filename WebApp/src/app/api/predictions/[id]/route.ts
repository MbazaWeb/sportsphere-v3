import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const { data, error } = await supabaseAdmin.from('ss_post').select('*').eq('id', id).limit(1);
  if (error && isMissingTable(error)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data?.[0] || { error: 'Not found' }, { status: data?.[0] ? 200 : 404 });
}
