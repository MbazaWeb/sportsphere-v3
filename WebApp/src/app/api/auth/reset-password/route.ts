import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password || String(password).length < 8) {
    return NextResponse.json({ error: 'Email and password (8+) required.' }, { status: 400 });
  }
  const hash = await hashPassword(password);
  const { error } = await supabaseAdmin.from('ss_user').update({ password_hash: hash }).ilike('email', String(email).trim());
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
