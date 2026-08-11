import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check-handle?handle=xyz
 *
 * Returns { available: boolean }
 * Lightweight check — no rate limit, read-only query.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('handle')?.trim();

  if (!raw || raw.length < 3 || raw.length > 30) {
    return NextResponse.json({ available: false, reason: 'invalid' });
  }

  const taken = await db.user.findFirst({
    where: { handle: { equals: raw, mode: 'insensitive' } },
    select: { id: true },
  });

  return NextResponse.json({ available: !taken });
}
