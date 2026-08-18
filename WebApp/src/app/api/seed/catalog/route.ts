import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOfficialUserId } from '@/lib/official-account';

export const dynamic = 'force-dynamic';

const LOGO_BY_SLUG: Record<string, string> = {
  simba: 'https://www.google.com/s2/favicons?domain=simbasc.co.tz&sz=128',
  yanga: 'https://www.google.com/s2/favicons?domain=yangasc.co.tz&sz=128',
  'young-africans-sc': 'https://www.google.com/s2/favicons?domain=yangasc.co.tz&sz=128',
  azam: 'https://www.google.com/s2/favicons?domain=azamfc.co.tz&sz=128',
  'coastal-union': 'https://www.google.com/s2/favicons?domain=coastalunionfc.co.tz&sz=128',
};

function logoFor(slug: string, name: string, existing?: string | null) {
  if (existing) return existing;
  const key = String(slug || name || '').toLowerCase();
  for (const [k, url] of Object.entries(LOGO_BY_SLUG)) {
    if (key.includes(k)) return url;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'T')}&background=0f141c&color=f5c518&size=128&bold=true`;
}

export async function POST() {
  const { data: teams, error } = await supabaseAdmin.from('ss_team').select('id,name,slug,city,country,logo_url');
  if (error) return NextResponse.json({ error: error.message, created: 0 }, { status: 400 });

  let created = 0;
  for (const t of teams || []) {
    const handle = '@' + String(t.slug || t.name || t.id).toLowerCase().replace(/\s+/g, '');
    const logo = logoFor(t.slug, t.name, t.logo_url);
    await supabaseAdmin.from('ss_team').update({ logo_url: logo }).eq('id', t.id);
    const { error: up } = await supabaseAdmin.from('ss_user').upsert({
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
    if (!up) created += 1;
  }

  const officialId = await getOfficialUserId();
  return NextResponse.json({ ok: true, teams: teams?.length || 0, profiles: created, officialId });
}

export async function GET() {
  return POST();
}
