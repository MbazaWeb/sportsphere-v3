import { NextResponse } from 'next/server';
import {
  getSsSessionFromRequest,
  forwardToMainApp,
} from '@/lib/main-app-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated admin's profile from the fan app.
 * The fan app's /api/admin/auth/me does the real verification and DB lookup.
 */
export async function GET() {
  const ssToken = await getSsSessionFromRequest();
  return forwardToMainApp(ssToken, {
    method: 'GET',
    path: '/api/admin/auth/me',
  });
}
