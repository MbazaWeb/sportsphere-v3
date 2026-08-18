import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    let query = supabaseAdmin.from('ss_team').select('id,name,slug,logo_url,city,short_name').limit(40);
    if (q) query = query.or(`name.ilike."%${q}%",short_name.ilike."%${q}%"`);
    const { data, error } = await query;
    if (error && !isMissingTable(error)) console.error('teams search', error);
    const local = (data || []).map((t) => ({
      id: t.id, name: t.name, slug: t.slug, logoUrl: t.logo_url, city: t.city, shortName: t.short_name,
    }));
    if (!q || local.length >= 8) return NextResponse.json(local);
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'SportSphere/1.0' },
      });
      const json = await res.json();
      const remote = (json.teams || []).slice(0, 10).map((t: any) => ({
        id: `tsdb-${t.idTeam}`,
        name: t.strTeam,
        slug: String(t.strTeam || '').toLowerCase().replace(/\s+/g, '-'),
        logoUrl: t.strBadge || t.strLogo || null,
        city: t.strStadiumLocation || t.strCountry,
        shortName: t.strTeamShort,
      }));
      const seen = new Set(local.map((t) => t.name.toLowerCase()));
      return NextResponse.json([...local, ...remote.filter((t: any) => !seen.has(t.name.toLowerCase()))]);
    } catch {
      return NextResponse.json(local);
    }
  } catch {
    return NextResponse.json([]);
  }
}
