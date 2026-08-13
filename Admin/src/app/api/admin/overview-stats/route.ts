import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminGuard";
import si from "systeminformation";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/admin/overview-stats
 * Live telemetry + DB KPIs for the control-center dashboard.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const [users, posts, sports, pendingRoles, news, rumors, claims, load, mem, net] =
      await Promise.all([
        db.user.count(),
        db.post.count(),
        db.sport.count({ where: { isActive: true } }),
        db.verificationRequest.count({ where: { status: "pending" } }),
        db.newsItem.count().catch(() => 0),
        db.rumor.count().catch(() => 0),
        db.claimRequest.count({ where: { status: "pending" } }).catch(() => 0),
        si.currentLoad(),
        si.mem(),
        si.networkStats(),
      ]);

    const eth0 = net?.[0] || { rx_sec: 0, tx_sec: 0 };

    return NextResponse.json({
      ok: true,
      db: {
        users,
        posts,
        sports,
        pendingRoles,
        news,
        rumors,
        pendingClaims: claims,
      },
      system: {
        cpu: Math.round(load.currentLoad * 10) / 10,
        ram: Math.round((mem.active / mem.total) * 1000) / 10,
        eth0: {
          rx: Math.round((eth0.rx_sec || 0) / 1024),
          tx: Math.round((eth0.tx_sec || 0) / 1024),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("overview-stats failed:", error);
    return NextResponse.json(
      { error: "Failed to load overview stats", detail: String(error) },
      { status: 500 }
    );
  }
}
