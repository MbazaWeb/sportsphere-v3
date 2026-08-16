import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/users/[id]
 *
 * Direct DB update. Body can contain any of:
 *   { role: string }          — change the user's role slug
 *   { verificationStatus: string }
 *   { isVerified: boolean }
 *
 * Returns the updated user (sanitized — no passwordHash).
 *
 * NOTE: the User model has no `isBanned` field, so we don't accept that
 * here. If you want ban support, add a Boolean isBanned @default(false)
 * to the User model in prisma/schema.prisma and run a migration.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (typeof body.role === 'string') updateData.role = body.role;
    if (typeof body.verificationStatus === 'string')
      updateData.verificationStatus = body.verificationStatus;
    if (typeof body.isVerified === 'boolean')
      updateData.isVerified = body.isVerified;
    if (typeof body.emailVerified === 'boolean')
      updateData.emailVerified = body.emailVerified;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update.' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        handle: true,
        role: true,
        isVerified: true,
        verificationStatus: true,
        emailVerified: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
