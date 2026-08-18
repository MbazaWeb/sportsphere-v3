import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ userId: string }> | { userId: string } }) {
  const { userId } = await Promise.resolve(ctx.params as any);
  const { data, error } = await supabaseAdmin.from('ss_performance').select('*').eq('user_id', userId).limit(1);
  if (error && isMissingTable(error)) return NextResponse.json({ userId, points: 0, tier: 'Unranked' });
  return NextResponse.json(data?.[0] || { userId, points: 0, tier: 'Unranked' });
}
