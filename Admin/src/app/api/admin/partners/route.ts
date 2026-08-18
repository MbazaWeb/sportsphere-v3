import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ssList, jsonData } from '@/lib/admin-ss';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const search = request.nextUrl.searchParams.get('search') || '';
  const status = request.nextUrl.searchParams.get('status') || '';
  const rows = await ssList('ss_partner', (q) => {
    let n = q.order('created_at', { ascending: false }).limit(100);
    if (status) n = n.eq('status', status);
    if (search) n = n.or(`name.ilike."%${search}%",industry.ilike."%${search}%"`);
    return n;
  });
  return jsonData(rows, { total: rows.length });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const body = await request.json().catch(() => ({}));
  const row = {
    id: crypto.randomUUID(),
    name: body.name,
    slug: body.slug,
    industry: body.industry,
    status: body.status || 'active',
    tier: body.tier,
    partner_type: body.partnerType,
    contact_name: body.contactName,
    logo_url: body.logoUrl,
  };
  const { data, error } = await supabaseAdmin.from('ss_partner').insert(row).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message, data: null }, { status: 200 });
  return NextResponse.json({ data }, { status: 201 });
}
