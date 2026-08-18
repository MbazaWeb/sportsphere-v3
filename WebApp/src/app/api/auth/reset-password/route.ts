import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import { hashResetToken, safeCompare } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { email, password, token } = await request.json().catch(() => ({}));
  if (!email || !password || !token || String(password).length < 8) {
    return NextResponse.json({ error: 'Email, token, and password (8+) required.' }, { status: 400 });
  }

  // Look up user by email
  const { data: users, error: lookupErr } = await supabaseAdmin
    .from('ss_user')
    .select('id, reset_token, reset_token_expiry')
    .ilike('email', String(email).trim())
    .limit(1);
  if (lookupErr) return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  if (!users?.length) return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });

  const user = users[0];

  // Verify hashed token matches
  const submittedHash = hashResetToken(token);
  if (!safeCompare(user.reset_token || '', submittedHash)) {
    return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
  }

  // Check expiry
  if (!user.reset_token_expiry || new Date(user.reset_token_expiry).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400 });
  }

  // Update password and clear token
  const hash = await hashPassword(password);
  const { error: updateErr } = await supabaseAdmin
    .from('ss_user')
    .update({ password_hash: hash, reset_token: null, reset_token_expiry: null })
    .eq('id', user.id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
