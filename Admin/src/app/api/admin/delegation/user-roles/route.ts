import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ssList, jsonData } from '@/lib/admin-ss';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const userId = request.nextUrl.searchParams.get('userId');
  const rows = await ssList('ss_admin_user_role', (q) => userId ? q.eq('user_id', userId) : q.limit(200));
  return jsonData(rows);
}
