import { NextRequest, NextResponse } from 'next/server';
import {
  getSsSessionFromRequest,
  forwardToMainApp,
} from '@/lib/main-app-client';

export const dynamic = 'force-dynamic';

/** DELETE /api/admin/posts/[id] → fan app */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ssToken = await getSsSessionFromRequest();
  const { id } = await params;
  return forwardToMainApp(ssToken, {
    method: 'DELETE',
    path: `/api/admin/posts/${encodeURIComponent(id)}`,
  });
}
