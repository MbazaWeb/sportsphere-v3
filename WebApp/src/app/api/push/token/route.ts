/**
 * POST /api/push/token — register FCM (or Expo) device token for the current user.
 * Body: { token: string, platform?: 'android' | 'ios' | 'web' }
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
  const platform = typeof body.platform === 'string' ? body.platform.slice(0, 32) : null;

  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'Valid token is required' }, { status: 400 });
  }

  try {
    await db.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, updatedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('push token register error:', e);
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 });
  }
}
