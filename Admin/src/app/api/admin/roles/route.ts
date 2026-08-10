import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/roles?status=pending
 *
 * Direct DB query. Returns verification requests filtered by status
 * (defaults to pending). Includes the submitting user's basic profile.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const requests = await db.verificationRequest.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            handle: true,
            avatarUrl: true,
            avatarInitials: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });

    const result = requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      userEmail: r.user.email,
      userHandle: r.user.handle,
      userAvatarUrl: r.user.avatarUrl,
      userAvatarInitials: r.user.avatarInitials,
      role: r.role,
      roleId: r.roleId,
      roleTypeId: r.roleTypeId,
      roleData: r.roleData,
      status: r.status,
      adminNotes: r.adminNotes,
      submittedAt: r.submittedAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() || null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch role requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role requests' },
      { status: 500 }
    );
  }
}
