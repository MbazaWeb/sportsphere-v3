import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  const total = Number(body.total || 0);
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    items: JSON.stringify(items),
    total,
    status: 'pending_payment',
    currency: 'TZS',
  };
  const { data, error } = await supabaseAdmin.from('ss_order').insert(row).select('id,status,total').maybeSingle();
  if (error) return NextResponse.json({ id: row.id, status: row.status, total, warning: error.message });
  return NextResponse.json({ id: data?.id || row.id, status: data?.status || row.status, total }, { status: 201 });
}
