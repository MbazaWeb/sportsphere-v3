import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession, serializePublicUser, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await db.user.findUnique({
    where: { id: payload.sub },
  });
  if (!user) {
    const res = NextResponse.json({ user: null }, { status: 200 });
    res.headers.set(
      'Set-Cookie',
      `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
    );
    return res;
  }

  return NextResponse.json({ user: serializePublicUser(user) }, { status: 200 });
}
