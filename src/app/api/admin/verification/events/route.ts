// ─── Admin: Performance Event Verification Queue ────────────────
//
// GET  /api/admin/verification/events          — list events (default: pending only)
//
// Query params:
//   ?status=pending|verified|rejected|all      (default: pending)
//   ?role=player|coach|team                    (filter by user role)
//   ?limit=50                                  (max 100)
//   ?offset=0                                  (pagination)
//
// Returns events joined with user info + verification records + point transactions.
//
// Per the master admin spec §11 (VERIFICATION DEPARTMENT):
//   VERIFICATION_OFFICER — reviews pending events submitted by users/scouts
//   Can approve (event becomes verified → points are credited to the ledger)
//   Can reject (event stays rejected → no points)
//
// All routes admin-guarded.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const roleFilter = searchParams.get("role");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

    // Build where clause
    const where: any = {};
    if (status !== "all") {
      where.verificationStatus = status;
    }
    if (roleFilter) {
      where.user = { role: roleFilter };
    }

    const [events, totalCount] = await Promise.all([
      db.performanceEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              handle: true,
              email: true,
              avatarUrl: true,
              role: true,
              playerProfile: { select: { position: true, playerType: true } },
              coachProfile: { select: { coachingRole: true } },
              teamProfile: { select: { nickname: true, league: true } },
            },
          },
          kpiConfig: {
            select: { kpiKey: true, label: true, category: true },
          },
          verification: true,
          pointTransactions: {
            select: { id: true, amount: true, balanceAfter: true, createdAt: true },
          },
        },
      }),
      db.performanceEvent.count({ where }),
    ]);

    // Summary counts for the queue header
    const [pendingCount, verifiedCount, rejectedCount] = await Promise.all([
      db.performanceEvent.count({ where: { verificationStatus: "pending" } }),
      db.performanceEvent.count({ where: { verificationStatus: "verified" } }),
      db.performanceEvent.count({ where: { verificationStatus: "rejected" } }),
    ]);

    return NextResponse.json({
      events,
      totalCount,
      summary: { pending: pendingCount, verified: verifiedCount, rejected: rejectedCount },
    });
  } catch (error) {
    console.error("Failed to fetch verification queue:", error);
    return NextResponse.json({ error: "Failed to fetch verification queue" }, { status: 500 });
  }
}
