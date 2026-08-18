import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { sportId, slug } = await request.json().catch(() => ({}));
  const { error } = await supabaseAdmin.from('ss_user_sport').upsert({ user_id: userId, sport_id: sportId || slug });
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true });
}
