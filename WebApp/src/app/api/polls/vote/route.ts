import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const { pollId, optionIdx } = await request.json();
    if (pollId == null || optionIdx == null) return NextResponse.json({ error: 'pollId and optionIdx required.' }, { status: 400 });
    const { error } = await supabaseAdmin.from('ss_poll_vote').upsert({
      poll_id: pollId,
      user_id: userId,
      option_idx: optionIdx,
    }, { onConflict: 'poll_id,user_id' });
    if (error && !isMissingTable(error)) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, pollId, optionIdx });
  } catch (e) {
    console.error('poll vote', e);
    return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
  }
}
