import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ssList, jsonData } from '@/lib/admin-ss';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const status = request.nextUrl.searchParams.get('status');
  const department = request.nextUrl.searchParams.get('department');
  const agents = await ssList('ss_ai_agent', (q) => {
    let n = q.order('created_at', { ascending: false }).limit(100);
    if (status) n = n.eq('status', status);
    if (department) n = n.eq('department', department);
    return n;
  });
  return jsonData(agents);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const body = await request.json().catch(() => ({}));
  const { data, error } = await supabaseAdmin.from('ss_ai_agent').insert({ id: crypto.randomUUID(), ...body, status: body.status || 'ACTIVE' }).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message, data: [] });
  return NextResponse.json({ data });
}
