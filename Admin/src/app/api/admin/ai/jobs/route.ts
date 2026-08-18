import { NextRequest } from 'next/server';
import { requireAdmin, ssList, jsonData } from '@/lib/admin-ss';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const limit = Math.min(200, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || '50')));
  const jobs = await ssList('ss_ai_job_log', (q) => q.order('started_at', { ascending: false }).limit(limit));
  return jsonData(jobs);
}
