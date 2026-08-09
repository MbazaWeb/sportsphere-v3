/**
 * POST /api/auth/register — Create a new Fan account
 *
 * Creates a User with the default Fan role + Casual Fan type.
 * Optionally links selected sports (UserSport rows).
 * Sends OTP verification email via Resend.
 * Returns the same shape as login: { user, token, expiresAt }.
 *
 * Rate limited: 5 registrations per IP per hour.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import {
  signSession,
  buildSessionCookie,
  SESSION_MAX_AGE,
  serializePublicUser,
  hashPassword,
  type SessionPayload,
} from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const OTP_TTL_MS = 1000 * 60 * 5; // 5 minutes

export async function POST(request: NextRequest) {
  // ── Rate limiting (stricter for registration) ───────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const { success, resetAt } = rateLimit(ip, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  });

  if (!success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // ── Parse + validate body ───────────────────────────────────────────────
  const body = await request.json().catch(() => ({}));
  const { name, email, password, handle, sports } = body as {
    name?: string;
    email?: string;
    password?: string;
    handle?: string;
    sports?: string[];
  };

  if (!name?.trim() || !email?.trim() || !password || !handle?.trim()) {
    return NextResponse.json(
      { error: 'Name, email, handle, and password are required.' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters.' },
      { status: 400 }
    );
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanHandle = handle.trim();

  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanHandle)) {
    return NextResponse.json(
      { error: 'Handle must be 3-30 characters: letters, numbers, _ or - only.' },
      { status: 400 }
    );
  }

  // ── Check for existing email / handle ───────────────────────────────────
  const existing = await db.user.findFirst({
    where: {
      OR: [
        { email: cleanEmail },
        { handle: { equals: cleanHandle, mode: 'insensitive' } },
      ],
    },
    select: { id: true, email: true, handle: true },
  });

  if (existing) {
    if (existing.email === cleanEmail) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Handle already taken.' }, { status: 409 });
  }

  // ── Look up default Fan role + Casual Fan type ──────────────────────────
  const fanRole = await db.role.findUnique({
    where: { slug: 'fan' },
    select: { id: true, types: { select: { id: true, slug: true }, where: { slug: 'casual' } } },
  });

  if (!fanRole || fanRole.types.length === 0) {
    return NextResponse.json(
      { error: 'Registration not ready — Fan role not seeded. Run: npx tsx prisma/seed-roles.ts' },
      { status: 500 }
    );
  }

  const fanTypeId = fanRole.types[0].id;

  // ── Hash password + generate OTP ────────────────────────────────────────
  const passwordHash = await hashPassword(password);
  const avatarInitials = name.trim().slice(0, 2).toUpperCase();
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

  // ── Create user ─────────────────────────────────────────────────────────
  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      handle: cleanHandle,
      passwordHash,
      avatarInitials,
      role: 'fan',
      roleId: fanRole.id,
      roleTypeId: fanTypeId,
      verificationStatus: 'none',
      isVerified: false,
      emailVerified: false,
      emailVerifyToken: otp,
      emailVerifyExpiry: otpExpiry,
      ...(sports && sports.length > 0
        ? {
            userSports: {
              create: (await db.sport.findMany({
                where: { slug: { in: sports } },
                select: { id: true },
              })).map((s) => ({ sportId: s.id })),
            },
          }
        : {}),
    },
    select: {
      id: true, name: true, email: true, handle: true,
      avatarUrl: true, avatarInitials: true, role: true,
      verificationStatus: true, isVerified: true, emailVerified: true,
      isPro: true, proSince: true, proTier: true,
      bio: true, location: true, coverGradient: true, coverUrl: true,
      followerCount: true, followingCount: true, postCount: true,
      sportsFollowing: true, roleData: true, registeredAt: true,
      roleId: true, roleTypeId: true,
      userRole: { select: { id: true, name: true, slug: true, icon: true, category: true } },
      userRoleType: { select: { id: true, name: true, slug: true } },
      userSports: { select: { sport: { select: { id: true, name: true, slug: true, icon: true, category: true, sportType: true, format: true } } } },
    },
  });

  // ── Send OTP email (fire-and-forget) ────────────────────────────────────
  sendOtpEmail(cleanEmail, otp).catch((err) => {
    console.error('[register] Failed to send OTP email:', err);
  });

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

  const response = NextResponse.json({ user: publicUser, token, expiresAt, otpSent: true }, { status: 201 });
  response.headers.set('Set-Cookie', buildSessionCookie(token));
  return response;
}