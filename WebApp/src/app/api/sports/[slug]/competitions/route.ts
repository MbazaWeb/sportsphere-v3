import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await Promise.resolve(ctx.params as any);
  const { data: sport } = await supabaseAdmin.from('ss_sport').select('id').eq('slug', slug).limit(1);
  const sportId = sport?.[0]?.id;
  if (!sportId) return NextResponse.json([]);
  const { data, error } = await supabaseAdmin.from('ss_league').select('id,name,slug,country,season').eq('sport_id', sportId).limit(80);
  if (error && isMissingTable(error)) return NextResponse.json([]);
  return NextResponse.json(data || []);
}
