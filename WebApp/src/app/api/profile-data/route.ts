import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data } = await supabaseAdmin.from('ss_user').select('id,name,handle,role,avatar_url,bio,location').eq('id', userId).limit(1);
  return NextResponse.json(data?.[0] || {});
}

export async function PUT(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ ok: true, ...body, id: userId });
}
