import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { verifyAdmin } from '@/lib/adminGuard';

export async function requireAdmin(request: NextRequest) {
  return verifyAdmin(request);
}

export async function ssList(table: string, build?: (q: any) => any) {
  try {
    let q = supabaseAdmin.from(table).select('*');
    if (build) q = build(q);
    const { data, error } = await q;
    if (error) {
      if (isMissingTable(error)) return [];
      console.error(table, error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error(table, e);
    return [];
  }
}

export function jsonData(data: unknown, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ data, ...extra });
}
