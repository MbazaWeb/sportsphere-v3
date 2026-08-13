import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminGuard";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const TEAM_ROLES = ["sponsor", "partner", "owner", "kit_supplier", "media", "other"] as const;
const PLAYER_ROLES = ["endorsement", "sponsor", "partner", "agency", "other"] as const;
const COACH_ROLES = ["partner", "sponsor", "agency", "other"] as const;

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const sp = request.nextUrl.searchParams;
    const businessId = sp.get("businessId") || undefined;
    const type = sp.get("type") || "all"; // team | player | coach | all

    const [teams, players, coaches] = await Promise.all([
      type === "all" || type === "team"
        ? db.businessTeam.findMany({
            where: businessId ? { businessId } : undefined,
            orderBy: { updatedAt: "desc" },
            take: 100,
            include: {
              Business: { select: { id: true, name: true, type: true } },
              Team: { select: { id: true, name: true, country: true } },
            },
          })
        : Promise.resolve([]),
      type === "all" || type === "player"
        ? db.businessPlayer.findMany({
            where: businessId ? { businessId } : undefined,
            orderBy: { updatedAt: "desc" },
            take: 100,
            include: {
              Business: { select: { id: true, name: true, type: true } },
              Player: { select: { id: true, name: true, position: true } },
            },
          })
        : Promise.resolve([]),
      type === "all" || type === "coach"
        ? db.businessCoach.findMany({
            where: businessId ? { businessId } : undefined,
            orderBy: { updatedAt: "desc" },
            take: 100,
            include: {
              Business: { select: { id: true, name: true, type: true } },
              Coach: { select: { id: true, name: true, role: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      ok: true,
      links: {
        teams,
        players,
        coaches,
      },
    });
  } catch (error: unknown) {
    console.error("GET business-links:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const entityType = String(body.entityType || "").toLowerCase(); // team | player | coach
    const businessId = String(body.businessId || "").trim();
    const entityId = String(body.entityId || "").trim();
    const role = String(body.role || "").trim();
    const notes = body.notes ? String(body.notes) : null;

    if (!businessId || !entityId || !entityType) {
      return NextResponse.json(
        { ok: false, error: "businessId, entityType, and entityId are required" },
        { status: 400 }
      );
    }

    const biz = await db.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    const id = randomUUID();
    const now = new Date();

    if (entityType === "team") {
      const team = await db.team.findUnique({ where: { id: entityId } });
      if (!team) {
        return NextResponse.json({ ok: false, error: "Team not found" }, { status: 404 });
      }
      const r = TEAM_ROLES.includes(role as any) ? role : "sponsor";
      const link = await db.businessTeam.upsert({
        where: {
          businessId_teamId_role: { businessId, teamId: entityId, role: r },
        },
        create: {
          id,
          businessId,
          teamId: entityId,
          role: r,
          notes,
          isActive: true,
          updatedAt: now,
        },
        update: { notes, isActive: true, updatedAt: now },
        include: {
          Business: { select: { id: true, name: true } },
          Team: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json({ ok: true, link, entityType: "team" }, { status: 201 });
    }

    if (entityType === "player") {
      const player = await db.player.findUnique({ where: { id: entityId } });
      if (!player) {
        return NextResponse.json({ ok: false, error: "Player not found" }, { status: 404 });
      }
      const r = PLAYER_ROLES.includes(role as any) ? role : "endorsement";
      const link = await db.businessPlayer.upsert({
        where: {
          businessId_playerId_role: { businessId, playerId: entityId, role: r },
        },
        create: {
          id,
          businessId,
          playerId: entityId,
          role: r,
          notes,
          isActive: true,
          updatedAt: now,
        },
        update: { notes, isActive: true, updatedAt: now },
        include: {
          Business: { select: { id: true, name: true } },
          Player: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json({ ok: true, link, entityType: "player" }, { status: 201 });
    }

    if (entityType === "coach") {
      const coach = await db.coach.findUnique({ where: { id: entityId } });
      if (!coach) {
        return NextResponse.json({ ok: false, error: "Coach not found" }, { status: 404 });
      }
      const r = COACH_ROLES.includes(role as any) ? role : "partner";
      const link = await db.businessCoach.upsert({
        where: {
          businessId_coachId_role: { businessId, coachId: entityId, role: r },
        },
        create: {
          id,
          businessId,
          coachId: entityId,
          role: r,
          notes,
          isActive: true,
          updatedAt: now,
        },
        update: { notes, isActive: true, updatedAt: now },
        include: {
          Business: { select: { id: true, name: true } },
          Coach: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json({ ok: true, link, entityType: "coach" }, { status: 201 });
    }

    return NextResponse.json(
      { ok: false, error: "entityType must be team, player, or coach" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("POST business-links:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const sp = request.nextUrl.searchParams;
    const entityType = sp.get("entityType") || "";
    const id = sp.get("id") || "";
    if (!id || !entityType) {
      return NextResponse.json(
        { ok: false, error: "id and entityType required" },
        { status: 400 }
      );
    }

    if (entityType === "team") {
      await db.businessTeam.delete({ where: { id } });
    } else if (entityType === "player") {
      await db.businessPlayer.delete({ where: { id } });
    } else if (entityType === "coach") {
      await db.businessCoach.delete({ where: { id } });
    } else {
      return NextResponse.json({ ok: false, error: "invalid entityType" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
