import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/claims/[id]
 *   Single claim with full detail (all evidence, user, reviewer, profile name).
 *
 * PATCH /api/admin/claims/[id]
 *   Body: { action: 'approve' | 'reject' | 'needs_info', reviewNotes?: string }
 *   Updates status, sets reviewerId + reviewedAt.
 *   On 'approve': set the claimed entity's claimedById=userId, claimedAt=now,
 *   verified=true. Log to AuditLog.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const claim = await db.claimRequest.findUnique({ where: { id } });
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Fetch the user and reviewer
    const userIds = [claim.userId, claim.reviewerId].filter(Boolean) as string[];
    const users = userIds.length
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, handle: true, avatarUrl: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return NextResponse.json({
      ...claim,
      user: userMap.get(claim.userId) || null,
      reviewer: claim.reviewerId ? userMap.get(claim.reviewerId) || null : null,
    });
  } catch (error) {
    console.error('Failed to fetch claim:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: 'approve' | 'reject' | 'needs_info';
      reviewNotes?: string;
    };

    const action = body.action;
    if (!action || !['approve', 'reject', 'needs_info'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'reject', or 'needs_info'." },
        { status: 400 }
      );
    }

    const existing = await db.claimRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      needs_info: 'needs_info',
    };

    const updated = await db.claimRequest.update({
      where: { id },
      data: {
        status: statusMap[action],
        reviewerId: auth.user.sub,
        reviewedAt: new Date(),
        reviewNotes: body.reviewNotes || null,
      },
    });

    // On approve: set the claimed entity's claimedById=userId, claimedAt=now, verified=true
    if (action === 'approve') {
      const userId = existing.userId;
      const now = new Date();
      try {
        if (existing.profileType === 'player' && existing.playerId) {
          await db.player.update({
            where: { id: existing.playerId },
            data: { claimedById: userId, claimedAt: now, verified: true },
          });
        } else if (existing.profileType === 'team' && existing.teamId) {
          await db.team.update({
            where: { id: existing.teamId },
            data: { claimedById: userId, claimedAt: now, verified: true },
          });
        } else if (existing.profileType === 'coach' && existing.coachId) {
          await db.coach.update({
            where: { id: existing.coachId },
            data: { claimedById: userId, claimedAt: now, verified: true },
          });
        } else if (existing.profileType === 'league' && existing.leagueId) {
          await db.league.update({
            where: { id: existing.leagueId },
            data: { claimedById: userId, claimedAt: now, verified: true },
          });
        }
      } catch (err) {
        console.error('Failed to set claimed entity flags:', err);
        // Continue — the claim status update is the primary action
      }
    }

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: `claim.${action}`,
        module: 'claims',
        targetId: id,
        targetType: 'ClaimRequest',
        oldValue: { status: existing.status } as any,
        newValue: { status: statusMap[action], reviewNotes: body.reviewNotes } as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update claim:', error);
    return NextResponse.json(
      { error: 'Failed to update claim', detail: String(error) },
      { status: 500 }
    );
  }
}
