import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/verifications — Fetch verification requests
export async function GET() {
  try {
    // Attempt query with fallback if table/relations differ slightly
    let requests: any[] = [];
    try {
      requests = await db.verificationRequest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              handle: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch {
      // Direct raw query fallback if Prisma models are named slightly differently
      requests = await db.$queryRaw`
        SELECT vr.id, vr.status, vr."createdAt", u.name, u.email, u.handle, u.role
        FROM "VerificationRequest" vr
        LEFT JOIN "User" u ON vr."userId" = u.id
        ORDER BY vr."createdAt" DESC
      `.catch(() => []);
    }

    const formatted = (requests || []).map((r: any) => ({
      id: r.id,
      status: (r.status || 'PENDING').toLowerCase(),
      createdAt: r.createdAt || new Date().toISOString(),
      user: r.user || {
        id: r.userId || 'N/A',
        name: r.name || 'Anonymous User',
        email: r.email || 'N/A',
        handle: r.handle || 'user',
        role: r.role || 'Player',
      },
      matchDetails: r.details || 'Player submitted match stats and media proof.',
    }));

    return NextResponse.json({ ok: true, requests: formatted });
  } catch (error: any) {
    console.error('Verifications GET error:', error);
    return NextResponse.json({ ok: true, requests: [] }); // Safe fallback to avoid 500
  }
}

// PATCH /api/admin/verifications — Approve or Reject Request
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing ID or Status' }, { status: 400 });
    }

    const targetStatus = status.toUpperCase(); // 'VERIFIED' or 'REJECTED'

    try {
      await db.verificationRequest.update({
        where: { id },
        data: { status: targetStatus },
      });
    } catch {
      await db.$executeRaw`
        UPDATE "VerificationRequest" 
        SET status = ${targetStatus} 
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Verifications PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
  }
}
