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
    return NextResponse.json((data || []).map((t) => ({
      id: t.id, name: t.name, slug: t.slug, logoUrl: t.logo_url, city: t.city, shortName: t.short_name,
    })));
  } catch {
    return NextResponse.json([]);
  }
}
