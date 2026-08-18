import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('ss_match').select('*').order('kickoff', { ascending: false }).limit(200);
  if (error && isMissingTable(error)) return NextResponse.json([]);
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const row = {
    id: crypto.randomUUID(),
    league_id: body.leagueId,
    home_team_id: body.homeTeamId,
    away_team_id: body.awayTeamId,
    kickoff: body.kickoff,
    status: body.status || 'scheduled',
    venue: body.venue,
  };
  const { data, error } = await supabaseAdmin.from('ss_match').insert(row).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
