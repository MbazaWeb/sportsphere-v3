import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json([]);
  const { data, error } = await supabaseAdmin.from('ss_favorite').select('*').eq('user_id', userId);
  if (error && isMissingTable(error)) return NextResponse.json([]);
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { error } = await supabaseAdmin.from('ss_favorite').insert({ user_id: userId, ...body });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
