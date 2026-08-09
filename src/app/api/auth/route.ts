/**
 * POST /api/auth — Login
 *
 * Accepts email OR handle + password. Returns the public user + session JWT.
 * Sets the ss_session httpOnly cookie (web) AND returns the token in the JSON
 * body (mobile — RN can't use cookies, stores the token in expo-secure-store).
 *
 * Canonical session system:
 *   - Secret: SESSION_SECRET (env, required in production)
 *   - Cookie: ss_session
 *   - Sign:   signSession() from @/lib/session
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import {
  signSession,
  buildSessionCookie,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  serializePublicUser,
  verifyPassword,
  type SessionPayload,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // ── Rate limiting: 10 attempts per IP per 15 minutes ────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const { success, resetAt } = rateLimit(ip, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({}));
  const { email, handle, password } = body as {
    email?: string;
    handle?: string;
    password?: string;
  };

  const identifier = (email ?? handle ?? '').trim();
  if (!identifier || !password) {
    return NextResponse.json(
      { error: 'Email/handle and password are required.' },
      { status: 400 }
    );
  }

  // Generic error — never reveal whether the email exists (prevents enumeration)
  const GENERIC_ERROR = 'Invalid email/handle or password.';

  // ── Look up user by email OR handle ─────────────────────────────────────
  const isEmail = identifier.includes('@');
  const user = await db.user.findFirst({
    where: isEmail
      ? { email: identifier.toLowerCase() }
      : { handle: { equals: identifier, mode: 'insensitive' } },
    select: {
      id: true, name: true, email: true, handle: true,
      passwordHash: true, role: true,
      avatarUrl: true, avatarInitials: true,
      verificationStatus: true, isVerified: true, emailVerified: true,
      isPro: true, proSince: true, proTier: true,
      bio: true, location: true, coverGradient: true, coverUrl: true,
      followerCount: true, followingCount: true, postCount: true,
      sportsFollowing: true, roleData: true, registeredAt: true,
      roleId: true, roleTypeId: true,
      isBanned: true, bannedReason: true,
      userRole: { select: { id: true, name: true, slug: true, icon: true, category: true } },
      userRoleType: { select: { id: true, name: true, slug: true } },
      userSports: { select: { sport: { select: { id: true, name: true, slug: true, icon: true, category: true, sportType: true, format: true } } } },
    },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // ── Ban check (Phase D.1 security fix) ──────────────────────────────────
  if (user.isBanned) {
    return NextResponse.json(
      { error: 'Your account has been suspended. Contact support for assistance.' },
      { status: 403 }
    );
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // ── Issue session JWT ───────────────────────────────────────────────────
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    handle: user.handle,
    role: user.role,
    roleId: user.roleId,
    roleTypeId: user.roleTypeId,
  };
  const token = await signSession(payload);
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;

  // ── Build response with cookie (web) + token in body (mobile) ───────────
  const publicUser = {
    ...serializePublicUser(user),
    roleName: user.userRole?.name || 'Fan',
    roleSlug: user.userRole?.slug || 'fan',
    roleIcon: user.userRole?.icon || '⭐',
    roleCategory: user.userRole?.category || 'individual',
    typeName: user.userRoleType?.name || 'Casual Fan',
    typeSlug: user.userRoleType?.slug || 'casual',
    sports: user.userSports.map((us) => us.sport),
    roleProfile: {},
  };

  const response = NextResponse.json({ user: publicUser, token, expiresAt }, { status: 200 });
  response.headers.set('Set-Cookie', buildSessionCookie(token));

  // Update lastSeenAt in the background (non-blocking)
  db.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  }).catch(() => {});

  return response;
}
