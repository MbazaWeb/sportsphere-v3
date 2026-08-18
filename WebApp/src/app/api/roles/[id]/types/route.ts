import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params as any);
  const { data, error } = await supabaseAdmin.from('ss_role_type').select('id,name,slug,role_id').eq('role_id', id);
  if (error && isMissingTable(error)) return NextResponse.json([]);
  return NextResponse.json(data || []);
}
