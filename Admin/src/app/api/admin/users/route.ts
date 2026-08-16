import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type EntityType = "USER" | "TEAM" | "PLAYER";

/**
 * GET /api/admin/users?q=&role=&type=ALL|USER|TEAM|PLAYER
 *
 * Unified index for Users Manager:
 * - USER rows from User table
 * - TEAM / PLAYER rows from sports entities (created in admin, AI, sync)
 * Each non-user row includes claimStatus + claimedBy.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const role = searchParams.get("role");
    const type = (searchParams.get("type") || "ALL").toUpperCase();
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));

    const results: any[] = [];

    const wantUsers = type === "ALL" || type === "USER";
    const wantTeams = type === "ALL" || type === "TEAM";
    const wantPlayers = type === "ALL" || type === "PLAYER";

    // ── Users ────────────────────────────────────────────────────────────
    if (wantUsers) {
      const where: any = {};
      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { handle: { contains: q, mode: "insensitive" } },
        ];
      }
      if (role && role !== "ALL") where.role = role;

      const users = await db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          handle: true,
          role: true,
          isVerified: true,
          verificationStatus: true,
          registeredAt: true,
          lastSeenAt: true,
          followerCount: true,
          postCount: true,
        },
        orderBy: { registeredAt: "desc" },
        take: limit,
      });

      for (const u of users) {
        results.push({
          id: u.id,
          entityType: "USER" as EntityType,
          name: u.name,
          email: u.email,
          handle: u.handle,
          role: u.role,
          isVerified: u.isVerified,
          verificationStatus: u.verificationStatus,
          registeredAt: u.registeredAt,
          lastSeenAt: u.lastSeenAt,
          followerCount: u.followerCount,
          postCount: u.postCount,
          claimStatus: "n/a",
          claimedBy: null,
          claimedAt: null,
          meta: null,
        });
      }
    }

    // ── Teams ────────────────────────────────────────────────────────────
    if (wantTeams && !(role && role !== "ALL" && role !== "team")) {
      const where: any = {};
      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ];
      }
      const teams = await db.team.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          League: { select: { id: true, name: true } },
          Sport: { select: { id: true, name: true, icon: true } },
        },
      });

      const claimerIds = [
        ...new Set(teams.map((t) => t.claimedById).filter(Boolean) as string[]),
      ];
      const claimers = claimerIds.length
        ? await db.user.findMany({
            where: { id: { in: claimerIds } },
            select: { id: true, name: true, handle: true, email: true },
          })
        : [];
      const claimerMap = new Map(claimers.map((u) => [u.id, u]));

      for (const t of teams) {
        const claimedBy = t.claimedById
          ? claimerMap.get(t.claimedById) || null
          : null;
        results.push({
          id: t.id,
          entityType: "TEAM" as EntityType,
          name: t.name,
          email: null,
          handle: t.slug ? `@team/${t.slug}` : null,
          role: "team",
          isVerified: !!t.verified,
          verificationStatus: t.verified ? "verified" : "unverified",
          registeredAt: t.createdAt,
          lastSeenAt: t.updatedAt,
          followerCount: null,
          postCount: null,
          claimStatus: t.claimedById ? "claimed" : "unclaimed",
          claimedBy,
          claimedAt: t.claimedAt,
          meta: [t.city, t.country, t.League?.name, t.Sport?.name]
            .filter(Boolean)
            .join(" · "),
          logoUrl: t.logoUrl || null,
          createdByAI: t.createdByAI,
          source: t.source,
        });
      }
    }

    // ── Players ──────────────────────────────────────────────────────────
    if (wantPlayers && !(role && role !== "ALL" && role !== "player")) {
      const where: any = {};
      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { nationality: { contains: q, mode: "insensitive" } },
          { position: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ];
      }
      const players = await db.player.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          Team: { select: { id: true, name: true, logoUrl: true } },
          Sport: { select: { id: true, name: true, icon: true } },
        },
      });

      const claimerIds = [
        ...new Set(players.map((p) => p.claimedById).filter(Boolean) as string[]),
      ];
      const claimers = claimerIds.length
        ? await db.user.findMany({
            where: { id: { in: claimerIds } },
            select: { id: true, name: true, handle: true, email: true },
          })
        : [];
      const claimerMap = new Map(claimers.map((u) => [u.id, u]));

      for (const p of players) {
        const claimedBy = p.claimedById
          ? claimerMap.get(p.claimedById) || null
          : null;
        results.push({
          id: p.id,
          entityType: "PLAYER" as EntityType,
          name: p.name,
          email: null,
          handle: p.slug ? `@player/${p.slug}` : null,
          role: "player",
          isVerified: !!p.verified,
          verificationStatus: p.verified ? "verified" : "unverified",
          registeredAt: p.createdAt,
          lastSeenAt: p.updatedAt,
          followerCount: null,
          postCount: null,
          claimStatus: p.claimedById ? "claimed" : "unclaimed",
          claimedBy,
          claimedAt: p.claimedAt,
          meta: [
            p.position,
            p.Team?.name,
            p.nationality,
            p.Sport?.name,
            p.shirtNumber != null ? `#${p.shirtNumber}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          photoUrl: p.photoUrl || null,
          createdByAI: p.createdByAI,
          source: p.source,
        });
      }
    }

    // Sort unified list by registeredAt desc
    results.sort((a, b) => {
      const da = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
      const db_ = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
      return db_ - da;
    });

    return NextResponse.json(results.slice(0, limit));
  } catch (error) {
    console.error("Failed to fetch admin users index:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", detail: String(error) },
      { status: 500 }
    );
  }
}
