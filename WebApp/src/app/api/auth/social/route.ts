import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import {
  signSession,
  buildSessionCookie,
  SESSION_MAX_AGE,
  serializePublicUser,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { provider, idToken } = await request.json();

    if (provider !== 'google' || !idToken) {
      return NextResponse.json({ error: 'Invalid provider or token' }, { status: 400 });
    }

    const firebaseApp = await getFirebaseAdminApp();
    if (!firebaseApp) {
      return NextResponse.json({ error: 'Social login currently unavailable' }, { status: 500 });
    }

    const admin = await import('firebase-admin');
    const auth = admin.auth(firebaseApp);
    const decodedToken = await auth.verifyIdToken(idToken);

    if (!decodedToken.email) {
      return NextResponse.json({ error: 'Email not provided by Google' }, { status: 400 });
    }

    const email = decodedToken.email.toLowerCase();
    const name = decodedToken.name || decodedToken.email.split('@')[0];
    const picture = decodedToken.picture;

    // Find or create user
    let user = await db.user.findUnique({
      where: { email },
      include: {
        userRole: { select: { id: true, name: true, slug: true, icon: true, category: true } },
        userRoleType: { select: { id: true, name: true, slug: true } },
        userSports: { select: { sport: { select: { id: true, name: true, slug: true, icon: true, category: true, sportType: true, format: true } } } },
      },
    });

    if (!user) {
      // Create new user with a unique handle
      const baseHandle = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
      let handle = baseHandle;
      let counter = 1;

      while (await db.user.findFirst({ where: { handle } })) {
        handle = `${baseHandle}${counter}`;
        counter++;
      }

      user = await db.user.create({
        data: {
          email,
          name,
          handle,
          avatarUrl: picture,
          emailVerified: true,
          role: 'fan',
          // Random password hash since it won't be used
          passwordHash: await import('bcryptjs').then(b => b.hash(Math.random().toString(36), 10)),
        },
        include: {
          userRole: { select: { id: true, name: true, slug: true, icon: true, category: true } },
          userRoleType: { select: { id: true, name: true, slug: true } },
          userSports: { select: { sport: { select: { id: true, name: true, slug: true, icon: true, category: true, sportType: true, format: true } } } },
        },
      });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 });
    }

    // Issue SportSphere session
    const payload = {
      sub: user.id,
      email: user.email,
      handle: user.handle,
      role: user.role,
      roleId: user.roleId,
      roleTypeId: user.roleTypeId,
    };

    const token = await signSession(payload);
    const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;

    const publicUser = {
      ...serializePublicUser(user),
      roleName: user.userRole?.name || 'Fan',
      roleSlug: user.userRole?.slug || 'fan',
      roleIcon: user.userRole?.icon || '⭐',
      roleCategory: user.userRole?.category || 'individual',
      typeName: user.userRoleType?.name || 'Casual Fan',
      typeSlug: user.userRoleType?.slug || 'casual',
      sports: user.userSports.map((us: any) => us.sport),
    };

    const response = NextResponse.json({ user: publicUser, token, expiresAt }, { status: 200 });
    response.headers.set('Set-Cookie', buildSessionCookie(token));

    db.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    }).catch(() => {});

    return response;
  } catch (error) {
    console.error('[social-auth] Error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
