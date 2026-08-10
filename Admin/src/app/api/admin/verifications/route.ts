import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/verifications
 *   ?status=pending|approved|rejected|all
 *   Returns verification requests with user info, ordered by submittedAt.
 *
 * POST /api/admin/verifications
 *   Body: { id, action: 'approve'|'reject', adminNotes? }
 *   Approves or rejects a verification request. Sets reviewedBy, reviewedAt,
 *   and updates the user's verificationStatus accordingly.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const where: any = {};
    if (status !== 'all') where.status = status;

    const requests = await db.verificationRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            handle: true,
            avatarUrl: true,
            avatarInitials: true,
            currentCountry: true,
            role: true,
            isVerified: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });

    // Count by status for the tabs
    const [pending, approved, rejected] = await Promise.all([
      db.verificationRequest.count({ where: { status: 'pending' } }),
      db.verificationRequest.count({ where: { status: 'approved' } }),
      db.verificationRequest.count({ where: { status: 'rejected' } }),
    ]);

    return NextResponse.json({
      requests,
      counts: { pending, approved, rejected, total: pending + approved + rejected },
    });
  } catch (error) {
    console.error('Failed to fetch verifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verifications', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      action?: 'approve' | 'reject';
      adminNotes?: string;
    };

    if (!body.id || !body.action || !['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { error: 'id and action (approve|reject) are required.' },
        { status: 400 }
      );
    }

    const existing = await db.verificationRequest.findUnique({
      where: { id: body.id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Verification request not found.' },
        { status: 404 }
      );
    }

    const newStatus = body.action === 'approve' ? 'approved' : 'rejected';
    const updated = await db.verificationRequest.update({
      where: { id: body.id },
      data: {
        status: newStatus,
        adminNotes: body.adminNotes || null,
        reviewedBy: (auth.user as any).sub || null,
        reviewedAt: new Date(),
      },
    });

    // If approved, update the user's verification status
    if (body.action === 'approve') {
      await db.user.update({
        where: { id: existing.userId },
        data: {
          isVerified: true,
          verificationStatus: 'verified',
          role: existing.role || undefined,
          roleId: existing.roleId || undefined,
          roleTypeId: existing.roleTypeId || undefined,
        },
      });
    }

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          actorId: (auth.user as any).sub || 'unknown',
          action: `verification.${body.action}`,
          module: 'verifications',
          targetType: 'VerificationRequest',
          targetId: body.id,
          newValue: {
            status: newStatus,
            adminNotes: body.adminNotes || null,
            userId: existing.userId,
            userName: existing.user?.name,
          } as any,
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
        },
      });
    } catch (auditErr) {
      console.warn('AuditLog write failed (non-fatal):', auditErr);
    }

    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    console.error('Failed to process verification:', error);
    return NextResponse.json(
      { error: 'Failed to process verification', detail: String(error) },
      { status: 500 }
    );
  }
}
