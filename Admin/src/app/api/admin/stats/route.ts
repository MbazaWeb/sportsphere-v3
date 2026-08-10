import { NextResponse } from 'next/server';
import {
  getSsSessionFromRequest,
  forwardToMainApp,
} from '@/lib/main-app-client';

export const dynamic = 'force-dynamic';

/** GET /api/admin/stats → fan app /api/admin/stats */
export async function GET() {
  const ssToken = await getSsSessionFromRequest();
  return forwardToMainApp(ssToken, {
    method: 'GET',
    path: '/api/admin/stats',
  });
}
