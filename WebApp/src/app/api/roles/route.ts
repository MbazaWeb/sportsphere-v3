import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('ss_role').select('id,name,slug,icon,category,is_active').eq('is_active', true);
  if (error && isMissingTable(error)) {
    return NextResponse.json([
      { id: 'fan', name: 'Fan', slug: 'fan', icon: '⭐', category: 'individual' },
      { id: 'player', name: 'Player', slug: 'player', icon: '⚽', category: 'individual' },
      { id: 'coach', name: 'Coach', slug: 'coach', icon: '📋', category: 'individual' },
      { id: 'team', name: 'Team', slug: 'team', icon: '🛡️', category: 'organization' },
    ]);
  }
  return NextResponse.json(data || []);
}
