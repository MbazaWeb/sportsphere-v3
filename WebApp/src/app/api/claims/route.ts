import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const targetId = request.nextUrl.searchParams.get('targetId');
  if (!targetId) return NextResponse.json({ claimable: false });
  const { data } = await supabaseAdmin.from('ss_user').select('id,role,is_claimed,password_hash').eq('id', targetId).limit(1);
  const u = data?.[0];
  if (!u) return NextResponse.json({ claimable: false });
  const claimable = ['team', 'player', 'coach', 'official'].includes(String(u.role || '').toLowerCase()) && !u.is_claimed && !u.password_hash;
  return NextResponse.json({ claimable, isClaimed: !!u.is_claimed });
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { targetId, message } = await request.json().catch(() => ({}));
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 });
  if (targetId === userId) return NextResponse.json({ error: 'You already own this profile.' }, { status: 400 });

  const { data: target } = await supabaseAdmin.from('ss_user').select('id,role,is_claimed,name,handle').eq('id', targetId).limit(1);
  if (!target?.[0]) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  if (target[0].is_claimed) return NextResponse.json({ error: 'This profile is already claimed.' }, { status: 409 });

  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    target_id: targetId,
    target_role: target[0].role,
    status: 'pending',
    message: message || null,
  };
  const { data, error } = await supabaseAdmin.from('ss_claim').insert(row).select('*').maybeSingle();
  if (error) {
    if (isMissingTable(error) || String(error.message).toLowerCase().includes('duplicate')) {
      return NextResponse.json({ ok: true, status: 'pending', note: error.message });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, status: 'pending', claim: data }, { status: 201 });
}
