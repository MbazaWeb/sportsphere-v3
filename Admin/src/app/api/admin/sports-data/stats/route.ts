import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const t0 = Date.now();
    const [
      totalSports,
      activeSports,
      totalMatches,
      totalUsers,
      leagues,
      teams,
      players,
      coaches,
      sports,
    ] = await Promise.all([
      db.sport.count(),
      db.sport.count({ where: { isActive: true } }),
      db.match.count(),
      db.user.count(),
      db.league.count(),
      db.team.count(),
      db.player.count(),
      db.coach.count(),
      db.sport.findMany({
        take: 20,
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          icon: true,
          isActive: true,
          updatedAt: true,
        },
      }),
    ]);
    const latencyMs = Date.now() - t0;

    return NextResponse.json({
      ok: true,
      metrics: {
        totalSports,
        activeSports,
        totalMatches,
        totalUsers,
        leagues,
        teams,
        players,
        coaches,
        providerLatency: `${latencyMs}ms`,
        quotaUsage: "n/a",
      },
      sports: sports.map((s) => ({
        ...s,
        isVisible: s.isActive,
      })),
    });
  } catch (err: unknown) {
    console.error("sports-data stats:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
