import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  let query = supabaseAdmin.from('ss_location').select('id,name,country,city').limit(20);
  if (q) query = query.ilike('name', `%${q}%`);
  const { data, error } = await query;
  if (error && isMissingTable(error)) return NextResponse.json([]);
  return NextResponse.json(data || []);
}
