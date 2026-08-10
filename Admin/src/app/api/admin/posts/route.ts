import { NextRequest, NextResponse } from 'next/server';
import {
  getSsSessionFromRequest,
  forwardToMainApp,
} from '@/lib/main-app-client';

export const dynamic = 'force-dynamic';

/** GET /api/admin/posts → fan app */
export async function GET(request: NextRequest) {
  const ssToken = await getSsSessionFromRequest();
  const query: Record<string, string | undefined> = {};
  new URL(request.url).searchParams.forEach((v, k) => {
    query[k] = v;
  });
  return forwardToMainApp(ssToken, {
    method: 'GET',
    path: '/api/admin/posts',
    query,
  });
}
