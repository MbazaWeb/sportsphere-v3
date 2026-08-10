import { NextRequest, NextResponse } from 'next/server';
import {
  getSsSessionFromRequest,
  forwardToMainApp,
} from '@/lib/main-app-client';

export const dynamic = 'force-dynamic';

/** GET /api/admin/users?q=...&role=... → fan app */
export async function GET(request: NextRequest) {
  const ssToken = await getSsSessionFromRequest();
  const { search } = new URL(request.url);
  // Strip the leading '?' so we can pass query through
  const query: Record<string, string | undefined> = {};
  new URLSearchParams(search).forEach((v, k) => {
    query[k] = v;
  });
  return forwardToMainApp(ssToken, {
    method: 'GET',
    path: '/api/admin/users',
    query,
  });
}
