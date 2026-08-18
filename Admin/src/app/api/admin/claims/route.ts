import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminGuard';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  const { data, error } = await supabaseAdmin
    .from('ss_claim')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error && isMissingTable(error)) return NextResponse.json({ ok: true, claims: [] });
  const rows = data || [];
  const ids = [...new Set(rows.flatMap((r) => [r.user_id, r.target_id]).filter(Boolean))];
  const users: Record<string, any> = {};
  if (ids.length) {
    const { data: u } = await supabaseAdmin.from('ss_user').select('id,name,handle,role').in('id', ids);
    for (const row of u || []) users[row.id] = row;
  }
  const claims = rows.map((r) => ({
    id: r.id,
    profileType: r.target_role || users[r.target_id]?.role || 'team',
    profileName: users[r.target_id]?.name || r.target_id,
    profileHandle: users[r.target_id]?.handle,
    submittedBy: users[r.user_id]?.name || r.user_id,
    submittedHandle: users[r.user_id]?.handle,
    status: r.status || 'pending',
    message: r.message,
    createdAt: r.created_at,
    userId: r.user_id,
    targetId: r.target_id,
  }));
  return NextResponse.json({ ok: true, claims });
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('ss_claim').update({ status }).eq('id', id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (status === 'approved' && data?.target_id) {
    await supabaseAdmin.from('ss_user').update({ is_claimed: true }).eq('id', data.target_id);
  }
  return NextResponse.json({ ok: true, claim: data });
}
