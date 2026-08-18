import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { token } = await request.json().catch(() => ({}));
  if (token) await supabaseAdmin.from('ss_push_token').delete().eq('user_id', userId).eq('token', token);
  return NextResponse.json({ ok: true });
}
