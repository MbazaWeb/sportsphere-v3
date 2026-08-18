import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('ss_league')
      .select('id,name,slug,type,country,season,is_active')
      .eq('is_active', true)
      .order('name');
    if (error && isMissingTable(error)) return NextResponse.json({ leagues: [], available: [] });
    const leagues = data || [];
    return NextResponse.json({
      leagues,
      available: leagues.map((l) => l.name),
    });
  } catch {
    return NextResponse.json({ leagues: [], available: [] });
  }
}
