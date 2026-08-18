import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('ss_sport').select('*').order('name').limit(200);
  if (error && isMissingTable(error)) return NextResponse.json([]);
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const row = { id: crypto.randomUUID(), name: body.name, slug: body.slug, icon: body.icon, category: body.category, is_active: true };
  const { data, error } = await supabaseAdmin.from('ss_sport').insert(row).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
