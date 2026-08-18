import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { token, platform } = await request.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });
  await supabaseAdmin.from('ss_push_token').upsert({ user_id: userId, token, platform: platform || 'web' });
  return NextResponse.json({ ok: true });
}
