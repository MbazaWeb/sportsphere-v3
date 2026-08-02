import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession, serializePublicUser, SESSION_COOKIE } from '@/lib/auth';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true, name: true, email: true, handle: true,
      avatarUrl: true, avatarInitials: true, role: true,
      verificationStatus: true, isVerified: true, emailVerified: true,
      bio: true, location: true, coverGradient: true,
      followerCount: true, followingCount: true, postCount: true,
      sportsFollowing: true, roleData: true, registeredAt: true,
      roleId: true, roleTypeId: true,
      userRole: { select: { id: true, name: true, slug: true, icon: true, category: true } },
      userRoleType: { select: { id: true, name: true, slug: true } },
      userSports: { select: { sport: { select: { id: true, name: true, slug: true, icon: true } } } },
    },
  });
  if (!user) {
    const res = NextResponse.json({ user: null }, { status: 200 });
    res.headers.set(
      'Set-Cookie',
      `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
    );
    return res;
  }

  const publicUser = serializePublicUser(user);
  return NextResponse.json({
    user: {
      ...publicUser,
      roleName: user.userRole?.name || 'Fan',
      roleSlug: user.userRole?.slug || 'fan',
      roleIcon: user.userRole?.icon || '⭐',
      roleCategory: user.userRole?.category || 'individual',
      typeName: user.userRoleType?.name || 'Casual Fan',
      typeSlug: user.userRoleType?.slug || 'casual',
      sports: user.userSports.map(us => us.sport),
    },
  }, { status: 200 });
}
