import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateResetToken } from '@/lib/auth-helpers';
import { resetTokenExpiry } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

  const { data: users } = await supabaseAdmin
    .from('ss_user')
    .select('id')
    .ilike('email', String(email).trim())
    .limit(1);

  if (users?.length) {
    const { rawToken, hashedToken } = generateResetToken();
    const expiry = resetTokenExpiry();
    await supabaseAdmin
      .from('ss_user')
      .update({ reset_token: hashedToken, reset_token_expiry: expiry.toISOString() })
      .eq('id', users[0].id);
    // In production, send email with rawToken here
  }

  // Always 200 to avoid email enumeration
  return NextResponse.json({ ok: true });
}
