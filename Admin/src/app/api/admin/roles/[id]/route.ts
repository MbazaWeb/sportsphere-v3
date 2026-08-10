import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/roles/[id]
 *
 * Body: { status: 'approved' | 'rejected', adminNotes?: string }
 *
 * Direct DB update. When a request is approved:
 *   1. Updates the VerificationRequest row (status, reviewedBy, reviewedAt, notes)
 *   2. Updates the User's role + verificationStatus to reflect the upgrade
 *
 * When rejected, only the request row is updated.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body as {
      status?: 'approved' | 'rejected';
      adminNotes?: string;
    };

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json(
        { error: "status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Fetch the request (with user) so we can promote the user if approved
    const req = await db.verificationRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!req) {
      return NextResponse.json(
        { error: 'Role request not found' },
        { status: 404 }
      );
    }

    if (req.status !== 'pending') {
      return NextResponse.json(
        { error: `Request already ${req.status}` },
        { status: 409 }
      );
    }

    // Update the request row
    await db.verificationRequest.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
        reviewedBy: auth.user.sub,
        reviewedAt: new Date(),
      },
    });

    // If approved, promote the user
    if (status === 'approved' && req.user) {
      const updateData: any = {
        verificationStatus: 'verified',
        isVerified: true,
      };
      if (req.role) updateData.role = req.role;
      if (req.roleId) updateData.roleId = req.roleId;
      if (req.roleTypeId) updateData.roleTypeId = req.roleTypeId;
      if (req.roleData) updateData.roleData = req.roleData;

      await db.user.update({
        where: { id: req.userId },
        data: updateData,
      });
    }

    return NextResponse.json({
      ok: true,
      status,
      message:
        status === 'approved'
          ? 'Role request approved and user promoted.'
          : 'Role request rejected.',
    });
  } catch (error) {
    console.error('Failed to update role request:', error);
    return NextResponse.json(
      { error: 'Failed to update role request' },
      { status: 500 }
    );
  }
}
