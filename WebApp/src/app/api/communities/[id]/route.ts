import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = await Promise.resolve(ctx.params as any);
    const { data, error } = await supabaseAdmin.from('ss_community').select('*').eq('id', id).limit(1);
    if (error && isMissingTable(error)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const row = data?.[0];
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}
