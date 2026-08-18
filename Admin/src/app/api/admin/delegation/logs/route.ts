import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ssList, jsonData } from '@/lib/admin-ss';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const rows = await ssList('ss_admin_delegation_log', (q) => q.order('created_at', { ascending: false }).limit(100));
  return jsonData(rows);
}
