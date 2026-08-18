import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { businessId } = await request.json().catch(() => ({}));
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('ss_business_member').upsert(
    { business_id: businessId, user_id: userId },
    { onConflict: 'business_id,user_id' },
  );
  if (error) return NextResponse.json({ ok: false, error: error.message });
  const { count } = await supabaseAdmin.from('ss_business_member').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
  return NextResponse.json({ ok: true, joined: true, memberCount: count ?? 0 });
}
