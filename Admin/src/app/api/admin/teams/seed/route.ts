import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const TEAMS = [
  { id: 'ftz-simba', name: 'Simba SC', slug: 'simba', short_name: 'SIM', city: 'Dar es Salaam', country: 'Tanzania', venue: 'Benjamin Mkapa Stadium' },
  { id: 'ftz-young-africans-sc', name: 'Young Africans SC', slug: 'yanga', short_name: 'YGN', city: 'Dar es Salaam', country: 'Tanzania', venue: 'Benjamin Mkapa Stadium' },
  { id: 'ftz-azam', name: 'Azam FC', slug: 'azam', short_name: 'AZM', city: 'Dar es Salaam', country: 'Tanzania', venue: 'Azam Complex' },
  { id: 'ftz-dodoma-fc', name: 'Dodoma FC', slug: 'dodoma-fc', short_name: 'DOD', city: 'Dodoma', country: 'Tanzania' },
  { id: 'ftz-mbeya-city', name: 'Mbeya City', slug: 'mbeya-city', short_name: 'MBY', city: 'Mbeya', country: 'Tanzania' },
  { id: 'ftz-singida-black-stars-sc', name: 'Singida Black Stars SC', slug: 'singida-black-stars', short_name: 'SBS', city: 'Singida', country: 'Tanzania' },
  { id: 'ftz-geita-gold-fc', name: 'Geita Gold FC', slug: 'geita-gold', short_name: 'GGF', city: 'Geita', country: 'Tanzania' },
  { id: 'ftz-pamba-jiji', name: 'Pamba Jiji', slug: 'pamba-jiji', short_name: 'PMB', city: 'Mwanza', country: 'Tanzania' },
  { id: 'ftz-polisi-tanzania-fc', name: 'Polisi Tanzania FC', slug: 'polisi-tanzania', short_name: 'PTF', city: 'Dar es Salaam', country: 'Tanzania' },
  { id: 'ftz-kagera-sugar', name: 'Kagera Sugar', slug: 'kagera-sugar', short_name: 'KGS', city: 'Kagera', country: 'Tanzania' },
  { id: 'ftz-coastal-union-fc', name: 'Coastal Union FC', slug: 'coastal-union', short_name: 'CUF', city: 'Tanga', country: 'Tanzania' },
  { id: 'ftz-mashujaa-fc', name: 'Mashujaa FC', slug: 'mashujaa', short_name: 'MSH', city: 'Kigoma', country: 'Tanzania' },
  { id: 'ftz-jkt-tanzania', name: 'JKT Tanzania', slug: 'jkt-tanzania', short_name: 'JKT', city: 'Dar es Salaam', country: 'Tanzania' },
  { id: 'ftz-namungo', name: 'Namungo FC', slug: 'namungo', short_name: 'NMG', city: 'Lindi', country: 'Tanzania' },
];

export async function POST() {
  let n = 0;
  const errors: string[] = [];
  for (const t of TEAMS) {
    const { error } = await supabaseAdmin.from('ss_team').upsert(t, { onConflict: 'id' });
    if (error) {
      const { error: e2 } = await supabaseAdmin.from('ss_team').upsert({ id: t.id, name: t.name, slug: t.slug }, { onConflict: 'id' });
      if (e2) errors.push(`${t.id}: ${e2.message}`);
      else n += 1;
    } else n += 1;
  }
  return NextResponse.json({ ok: errors.length === 0, seeded: n, errors });
}

export async function GET() { return POST(); }
