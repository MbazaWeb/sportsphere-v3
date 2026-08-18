import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOfficialUserId } from '@/lib/official-account';
import { fetchLogoFromTheSportsDB } from '@/lib/team-logo-resolver';
import { uploadPublic } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SEARCH_NAME: Record<string, string> = {
  simba: 'Simba SC',
  yanga: 'Young Africans',
  'young-africans-sc': 'Young Africans',
  azam: 'Azam FC',
  'dodoma-fc': 'Dodoma FC',
  'mbeya-city': 'Mbeya City',
  'singida-black-stars': 'Singida Black Stars',
  'geita-gold': 'Geita Gold',
  'pamba-jiji': 'Pamba',
  'polisi-tanzania': 'Polisi Tanzania',
  'kagera-sugar': 'Kagera Sugar',
  'coastal-union': 'Coastal Union',
  mashujaa: 'Mashujaa',
  'jkt-tanzania': 'JKT Tanzania',
  namungo: 'Namungo FC',
};

async function downloadAndStore(teamId: string, sourceUrl: string): Promise<string | null> {
  const res = await fetch(sourceUrl, { headers: { 'User-Agent': 'SportSphere/1.0' } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || 'image/png';
  const ext = ct.includes('jpeg') ? 'jpg' : ct.includes('webp') ? 'webp' : 'png';
  return uploadPublic('avatars', `teams/${teamId}.${ext}`, buf, ct);
}

export async function POST() {
  const { data: teams, error } = await supabaseAdmin.from('ss_team').select('id,name,slug,city,country,logo_url');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const saved: { id: string; name: string; logo: string | null }[] = [];

  for (const t of teams || []) {
    const slug = String(t.slug || '').toLowerCase();
    const search = SEARCH_NAME[slug] || t.name;
    let source = t.logo_url as string | null;
    if (!source || source.includes('google.com/s2/favicons') || source.includes('ui-avatars.com')) {
      source = await fetchLogoFromTheSportsDB(search);
    }
    let stored: string | null = null;
    if (source) {
      try {
        stored = await downloadAndStore(t.id, source);
      } catch (e) {
        console.error('logo store', t.name, e);
        stored = source;
      }
    }
    const logo = stored || source || null;
    if (logo) {
      await supabaseAdmin.from('ss_team').update({ logo_url: logo }).eq('id', t.id);
    }
    const handle = '@' + String(t.slug || t.name || t.id).toLowerCase().replace(/\s+/g, '');
    await supabaseAdmin.from('ss_user').upsert({
      id: t.id,
      name: t.name,
      handle,
      role: 'team',
      avatar_url: logo,
      avatar_initials: String(t.name || 'T').slice(0, 2).toUpperCase(),
      is_verified: true,
      is_active: true,
      is_claimed: false,
      location: [t.city, t.country || 'Tanzania'].filter(Boolean).join(', '),
      bio: t.name,
    }, { onConflict: 'id' });
    saved.push({ id: t.id, name: t.name, logo });
  }

  const officialId = await getOfficialUserId();
  return NextResponse.json({ ok: true, officialId, teams: saved });
}

export async function GET() {
  return POST();
}
