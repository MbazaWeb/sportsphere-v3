import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const TABLE = 'ss_coach';

export async function GET() {
  const { data, error } = await supabaseAdmin.from(TABLE).select('*').limit(200);
  if (error && isMissingTable(error)) return NextResponse.json([]);
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const row = { id: crypto.randomUUID(), ...body };
  const { data, error } = await supabaseAdmin.from(TABLE).insert(row).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: error.message, items: [] }, { status: 200 });
  return NextResponse.json(data || { ok: true }, { status: 201 });
}
