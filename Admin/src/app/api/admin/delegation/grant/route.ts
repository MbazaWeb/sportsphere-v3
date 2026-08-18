import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-ss';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const { userId, roleId } = await request.json().catch(() => ({}));
  if (!userId || !roleId) return NextResponse.json({ error: 'userId and roleId required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('ss_admin_user_role').insert({ id: crypto.randomUUID(), user_id: userId, role_id: roleId });
  if (error) return NextResponse.json({ error: error.message, ok: false });
  return NextResponse.json({ ok: true });
}
