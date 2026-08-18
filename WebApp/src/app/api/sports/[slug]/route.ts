import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const params = await Promise.resolve(ctx.params as any);
    const slug = params.slug;
    const { data, error } = await supabaseAdmin.from('ss_sport').select('*').eq('slug', slug).limit(1);
    if (error && isMissingTable(error)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const s = data?.[0];
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      id: s.id, name: s.name, slug: s.slug, icon: s.icon, category: s.category,
      sportType: s.sport_type, format: s.format, description: s.description,
    });
  } catch (e) {
    console.error('sport slug', e);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
