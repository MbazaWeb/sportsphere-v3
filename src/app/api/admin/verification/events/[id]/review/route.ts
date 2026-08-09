// ─── Admin: Approve / Reject a Performance Event ────────────────
//
// POST /api/admin/verification/events/[id]/review
//
// Body:
//   { action: "approve" | "reject", notes?: string, verifierRole?: string }
//
// When approving:
//   1. Update PerformanceEvent.verificationStatus = 'verified'
//   2. Create PerformanceVerification record (status='approved')
//   3. Create PerformancePointTransaction (credited to user's point balance)
//   4. Trigger recalcPerformanceProfile(userId) to refresh score & rank
//
// When rejecting:
//   1. Update PerformanceEvent.verificationStatus = 'rejected' + rejectionReason
//   2. Create PerformanceVerification record (status='rejected')
//   3. NO point transaction is created
//   4. recalcPerformanceProfile NOT triggered (no change to user's score)
//
// All routes admin-guarded.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";
import { recalcPerformanceProfile } from "@/lib/performance-engine";
import { logAdminAction } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, notes, verifierRole } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 },
      );
    }

    // Fetch the event
    const event = await db.performanceEvent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, role: true } },
        kpiConfig: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.verificationStatus !== "pending") {
      return NextResponse.json(
        { error: `Event already ${event.verificationStatus}` },
        { status: 409 },
      );
    }

    const verifierUserId = (auth.user as any)?.sub ?? null;
    const reviewedAt = new Date();

    if (action === "approve") {
      // ── Approve: credit points and trigger recalc ──
      const current = await db.performanceProfile.findUnique({
        where: { userId: event.userId },
        select: { totalPoints: true },
      });
      const balanceBefore = current?.totalPoints ?? 0;
      const balanceAfter = balanceBefore + Math.round(event.pointsCalculated);

      await db.$transaction(// eslint-disable-next-line @typescript-eslint/no-explicit-any
async (tx: any) => {
        // 1. Mark event as verified
        await tx.performanceEvent.update({
          where: { id },
          data: {
            verificationStatus: "verified",
            verifiedBy: verifierUserId,
            verifiedAt: reviewedAt,
          },
        });

        // 2. Create verification record (status='approved')
        await tx.performanceVerification.upsert({
          where: { eventId: id },
          create: {
            eventId: id,
            userId: event.userId,
            verifierRole: verifierRole ?? "admin",
            verifierUserId,
            status: "approved",
            verificationMethod: "manual",
            evidence: {
              reviewedAt: reviewedAt.toISOString(),
              reviewedBy: verifierUserId,
              notes: notes ?? null,
            },
            notes: notes ?? null,
            reviewedAt,
          },
          update: {
            verifierRole: verifierRole ?? "admin",
            verifierUserId,
            status: "approved",
            evidence: {
              reviewedAt: reviewedAt.toISOString(),
              reviewedBy: verifierUserId,
              notes: notes ?? null,
            },
            notes: notes ?? null,
            reviewedAt,
          },
        });

        // 3. Create point transaction (credited)
        await tx.performancePointTransaction.create({
          data: {
            userId: event.userId,
            eventId: id,
            transactionType: "event",
            amount: Math.round(event.pointsCalculated),
            balanceBefore,
            balanceAfter,
            reason: buildReasonString(event, Math.round(event.pointsCalculated)),
            reasonCode: event.eventType,
            verified: true,
          },
        });

        // 4. Update the cached PerformanceProfile.totalPoints
        if (current) {
          await tx.performanceProfile.update({
            where: { userId: event.userId },
            data: { totalPoints: balanceAfter, lastEventAt: event.matchDate },
          });
        }
      });

      // 5. Trigger recalc (outside transaction — heavy compute)
      try {
        await recalcPerformanceProfile(event.userId);
      } catch (recalcErr) {
        console.error(`recalc failed for user ${event.userId} after event approval:`, recalcErr);
      }

      // Audit log
      await logAdminAction({
        request,
        actorId: auth.user!.sub,
        action: 'event.verification.approve',
        module: 'verifications',
        targetId: id,
        targetType: 'PerformanceEvent',
        newValue: { pointsCredited: Math.round(event.pointsCalculated), newBalance: balanceAfter },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        action: "approved",
        eventId: id,
        userId: event.userId,
        pointsCredited: Math.round(event.pointsCalculated),
        newBalance: balanceAfter,
      });
    } else {
      // ── Reject: no points, just mark rejected ──
      await db.$transaction(// eslint-disable-next-line @typescript-eslint/no-explicit-any
async (tx: any) => {
        await tx.performanceEvent.update({
          where: { id },
          data: {
            verificationStatus: "rejected",
            verifiedBy: verifierUserId,
            verifiedAt: reviewedAt,
            rejectionReason: notes ?? "Rejected by verifier",
          },
        });

        await tx.performanceVerification.upsert({
          where: { eventId: id },
          create: {
            eventId: id,
            userId: event.userId,
            verifierRole: verifierRole ?? "admin",
            verifierUserId,
            status: "rejected",
            verificationMethod: "manual",
            evidence: {
              reviewedAt: reviewedAt.toISOString(),
              reviewedBy: verifierUserId,
              notes: notes ?? null,
            },
            notes: notes ?? null,
            reviewedAt,
          },
          update: {
            verifierRole: verifierRole ?? "admin",
            verifierUserId,
            status: "rejected",
            evidence: {
              reviewedAt: reviewedAt.toISOString(),
              reviewedBy: verifierUserId,
              notes: notes ?? null,
            },
            notes: notes ?? null,
            reviewedAt,
          },
        });
      });

      // Audit log
      await logAdminAction({
        request,
        actorId: auth.user!.sub,
        action: 'event.verification.reject',
        module: 'verifications',
        targetId: id,
        targetType: 'PerformanceEvent',
        newValue: { notes: notes ?? null },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        action: "rejected",
        eventId: id,
        userId: event.userId,
      });
    }
  } catch (error) {
    console.error("Failed to review event:", error);
    return NextResponse.json({ error: "Failed to review event" }, { status: 500 });
  }
}

function buildReasonString(event: any, points: number): string {
  const sign = points >= 0 ? "+" : "";
  const opp = event.opponentName ? ` vs ${event.opponentName}` : "";
  const comp = event.competition ? ` (${event.competition})` : "";
  return `${sign}${points} ${event.eventType}${opp}${comp}`;
}
