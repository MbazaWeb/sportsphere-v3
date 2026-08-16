/**
 * POST /api/push/token/unregister — remove a device token.
 * Body: { token: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  try {
    await db.pushToken.deleteMany({
      where: { userId, token },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('push token unregister error:', e);
    return NextResponse.json({ error: 'Failed to unregister token' }, { status: 500 });
  }
}
