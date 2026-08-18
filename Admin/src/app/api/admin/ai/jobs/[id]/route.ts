import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-ss';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const { id } = await Promise.resolve(ctx.params as any);
  const { data } = await supabaseAdmin.from('ss_ai_job_log').select('*').eq('id', id).limit(1);
  return NextResponse.json({ data: data?.[0] || null });
}
