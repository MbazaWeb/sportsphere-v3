import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [totalSports, activeSports, totalMatches, totalUsers] = await Promise.all([
      db.sport.count(),
      db.sport.count({ where: { isVisible: true } }),
      db.match.count(),
      db.user.count(),
    ]);

    // Fetch real sports listing from database
    const sports = await db.sport.findMany({
      take: 10,
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        isVisible: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      metrics: {
        totalSports,
        activeSports,
        totalMatches,
        totalUsers,
        quotaUsage: "0.2%",
        providerLatency: "14ms",
      },
      sports,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
