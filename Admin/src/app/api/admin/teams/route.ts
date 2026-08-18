import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  let query = supabaseAdmin.from('ss_team').select('*').order('name').limit(200);
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,city.ilike.%${q}%`);
  const { data, error } = await query;
  if (error && isMissingTable(error)) return NextResponse.json([]);
  const rows = (data || []).map((t) => ({
    ...t,
    logoUrl: t.logo_url,
    shortName: t.short_name,
    leagueId: t.league_id,
  }));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const row = {
    id: body.id || crypto.randomUUID(),
    name: body.name,
    slug: body.slug,
    logo_url: body.logoUrl || body.logo_url,
    city: body.city,
    country: body.country || 'Tanzania',
    short_name: body.shortName || body.short_name,
    league_id: body.leagueId || body.league_id,
    venue: body.venue,
  };
  const { data, error } = await supabaseAdmin.from('ss_team').insert(row).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.slug !== undefined) patch.slug = body.slug;
  if (body.city !== undefined) patch.city = body.city;
  if (body.country !== undefined) patch.country = body.country;
  if (body.logoUrl !== undefined || body.logo_url !== undefined) patch.logo_url = body.logoUrl || body.logo_url;
  if (body.shortName !== undefined || body.short_name !== undefined) patch.short_name = body.shortName || body.short_name;
  if (body.venue !== undefined) patch.venue = body.venue;
  if (body.leagueId !== undefined || body.league_id !== undefined) patch.league_id = body.leagueId || body.league_id;
  const { data, error } = await supabaseAdmin.from('ss_team').update(patch).eq('id', body.id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
