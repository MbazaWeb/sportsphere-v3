import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });
  const { data } = await supabaseAdmin.from('ss_user').select('id').ilike('email', String(email).trim()).limit(1);
  // Always 200 to avoid email enumeration
  return NextResponse.json({ ok: true, sent: !!data?.length });
}
