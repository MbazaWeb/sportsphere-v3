import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated admin's profile, fetched directly
 * from the database. Used by the dashboard layout to hydrate the sidebar.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const admin = await db.user.findUnique({
      where: { id: auth.user.sub },
      select: {
        id: true,
        name: true,
        email: true,
        handle: true,
        role: true,
        roleId: true,
        roleTypeId: true,
        avatarUrl: true,
        avatarInitials: true,
        isVerified: true,
        emailVerified: true,
        verificationStatus: true,
        lastSeenAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin account not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        handle: admin.handle,
        role: admin.role,
        roleId: admin.roleId,
        roleTypeId: admin.roleTypeId,
        avatarUrl: admin.avatarUrl,
        avatarInitials: admin.avatarInitials,
        isVerified: admin.isVerified,
        emailVerified: admin.emailVerified,
        verificationStatus: admin.verificationStatus,
        lastSeenAt: admin.lastSeenAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin /me error:', error);
    return NextResponse.json(
      { error: 'Failed to load admin profile.' },
      { status: 500 }
    );
  }
}
