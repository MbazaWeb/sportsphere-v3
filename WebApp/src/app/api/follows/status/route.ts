import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request).catch(() => null);
    if (!userId) return NextResponse.json({ following: false, isFan: false });
    const targetUserId = request.nextUrl.searchParams.get('targetUserId');
    if (!targetUserId) return NextResponse.json({ following: false, isFan: false });
    const { data, error } = await supabaseAdmin
      .from('ss_follow')
      .select('kind')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .limit(1);
    if (error && isMissingTable(error)) return NextResponse.json({ following: false, isFan: false });
    const follow = data?.[0];
    return NextResponse.json({ following: !!follow, isFan: follow?.kind === 'fan' });
  } catch {
    return NextResponse.json({ following: false, isFan: false });
  }
}
