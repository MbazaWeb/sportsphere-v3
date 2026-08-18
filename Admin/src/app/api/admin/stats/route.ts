import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function count(table: string) {
  const { count, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function GET() {
  const [users, posts, teams, matches, sports] = await Promise.all([
    count('ss_user'), count('ss_post'), count('ss_team'), count('ss_match'), count('ss_sport'),
  ]);
  return NextResponse.json({ users, posts, teams, matches, sports });
}
