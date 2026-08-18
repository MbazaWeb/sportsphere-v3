import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOfficialUserId } from '@/lib/official-account';

export const dynamic = 'force-dynamic';

export async function POST() {
  const { data: teams, error } = await supabaseAdmin.from('ss_team').select('id,name,slug,city,country,logo_url');
  if (error) return NextResponse.json({ error: error.message, created: 0 }, { status: 400 });

  let created = 0;
  for (const t of teams || []) {
    const handle = '@' + String(t.slug || t.name || t.id).toLowerCase().replace(/\s+/g, '');
    const { error: up } = await supabaseAdmin.from('ss_user').upsert({
      id: t.id,
      name: t.name,
      handle,
      role: 'team',
      avatar_url: t.logo_url || null,
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
