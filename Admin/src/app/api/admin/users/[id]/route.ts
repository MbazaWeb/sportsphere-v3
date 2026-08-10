import { NextRequest, NextResponse } from 'next/server';
import {
  getSsSessionFromRequest,
  forwardToMainApp,
} from '@/lib/main-app-client';

export const dynamic = 'force-dynamic';

/** PUT /api/admin/users/[id] → fan app (update role / ban status) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ssToken = await getSsSessionFromRequest();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return forwardToMainApp(ssToken, {
    method: 'PUT',
    path: `/api/admin/users/${encodeURIComponent(id)}`,
    body,
  });
}
