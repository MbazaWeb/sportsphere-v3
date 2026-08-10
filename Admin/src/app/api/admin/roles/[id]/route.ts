import { NextRequest, NextResponse } from 'next/server';
import {
  getSsSessionFromRequest,
  forwardToMainApp,
} from '@/lib/main-app-client';

export const dynamic = 'force-dynamic';

/** PATCH /api/admin/roles/[id] → fan app (approve / reject) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ssToken = await getSsSessionFromRequest();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return forwardToMainApp(ssToken, {
    method: 'PATCH',
    path: `/api/admin/roles/${encodeURIComponent(id)}`,
    body,
  });
}
