import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const userId = await getUserIdFromRequest(_req);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { id } = await Promise.resolve(ctx.params as any);
  await supabaseAdmin.from('ss_community_member').delete().eq('community_id', id).eq('user_id', userId);
  return NextResponse.json({ ok: true, joined: false });
}
