import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('q');
    let q = supabaseAdmin
      .from('ss_sport')
      .select('id,name,slug,icon,category,sport_type,format,description,tags,display_order,is_active')
      .eq('is_active', true)
      .order('display_order')
      .limit(200);
    if (category) q = q.eq('category', category);
    if (search) q = q.or(`name.ilike."%${search}%",slug.ilike."%${search}%"`);
    const { data, error } = await q;
    if (error) {
      if (isMissingTable(error)) return NextResponse.json([]);
      console.error('sports', error);
      return NextResponse.json([]);
    }
    return NextResponse.json((data || []).map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      icon: s.icon,
      category: s.category,
      sportType: s.sport_type,
      format: s.format,
      description: s.description,
      tags: safeJsonParse(s.tags, []),
      displayOrder: s.display_order,
    })));
  } catch (e) {
    console.error('sports', e);
    return NextResponse.json([]);
  }
}
