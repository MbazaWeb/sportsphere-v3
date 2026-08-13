import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncFromProviders } from "@/lib/sports-sync";

export async function GET() {
  try {
    const totalMatches = await db.match.count();
    const upcomingMatches = await db.match.count({ where: { status: "upcoming" } });
    const liveMatches = await db.match.count({ where: { status: "live" } });
    const completedMatches = await db.match.count({ where: { status: "finished" } });

    const leagueBreakdown = await db.match.groupBy({
      by: ["league"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const recentMatches = await db.match.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        league: true,
        homeTeam: true,
        awayTeam: true,
        kickoffAt: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      stats: { totalMatches, upcomingMatches, liveMatches, completedMatches },
      leagues: leagueBreakdown.map((item) => ({ name: item.league, count: item._count.id })),
      recentMatches,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // DISABLED: External sports sync is paused for Tanzania-only baseline.
  // Re-enable when ready with Tanzania-scoped providers only.
  return NextResponse.json(
    { error: "Sports sync is temporarily disabled. Tanzania-only sync coming soon.", disabled: true },
    { status: 503 }
  );
}
