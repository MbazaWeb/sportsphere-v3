import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const userId = await getUserIdFromRequest(_req);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { id } = await Promise.resolve(ctx.params as any);
  const { error } = await supabaseAdmin.from('ss_community_member').upsert({ community_id: id, user_id: userId }, { onConflict: 'community_id,user_id' });
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, joined: true });
}
