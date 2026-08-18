import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('ss_player').select('*').order('name').limit(200);
  if (error && isMissingTable(error)) {
    const users = await supabaseAdmin.from('ss_user').select('*').ilike('role', 'player').limit(200);
    return NextResponse.json(users.data || []);
  }
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const row = { id: crypto.randomUUID(), name: body.name, position: body.position, team_id: body.teamId, photo_url: body.photoUrl };
  const { data, error } = await supabaseAdmin.from('ss_player').insert(row).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
