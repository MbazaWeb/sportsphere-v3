import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function codeFor(userId: string) {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const code = codeFor(userId);
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://sportssphere.fun/sportsphere';
  const target = request.nextUrl.searchParams.get('target') || '';
  const action = request.nextUrl.searchParams.get('action') || 'fan';
  const url = `${base}?ref=${code}&action=${encodeURIComponent(action)}&target=${encodeURIComponent(target)}`;
  return NextResponse.json({ code, url });
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { code, action, targetId } = await request.json().catch(() => ({}));
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });
  const { data: users } = await supabaseAdmin.from('ss_user').select('id').limit(200);
  const referrer = (users || []).find((u) => codeFor(u.id) === String(code).toUpperCase());
  if (!referrer || referrer.id === userId) return NextResponse.json({ ok: false, reason: 'invalid' });
  const row = { referrer_id: referrer.id, referred_id: userId, action: action || 'signup', target_id: targetId || null };
  const { error } = await supabaseAdmin.from('ss_referral').insert(row);
  return NextResponse.json({ ok: !error, warning: error?.message });
}
