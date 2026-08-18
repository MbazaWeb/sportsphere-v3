import { NextRequest } from 'next/server';
import { requireAdmin, ssList, jsonData } from '@/lib/admin-ss';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const rows = await ssList('ss_ai_task', (q) => q.limit(200));
  return jsonData(rows);
}
