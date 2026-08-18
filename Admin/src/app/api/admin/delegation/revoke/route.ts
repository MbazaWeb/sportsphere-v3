import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-ss';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const { userId, roleId } = await request.json().catch(() => ({}));
  await supabaseAdmin.from('ss_admin_user_role').delete().eq('user_id', userId).eq('role_id', roleId);
  return NextResponse.json({ ok: true });
}
