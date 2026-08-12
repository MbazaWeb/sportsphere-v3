import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// GET /api/admin/rumors
export async function GET() {
  try {
    const rumors = await db.rumor.findMany({
      orderBy: { publishedAt: "desc" },
      take: 200,
    });

    const formatted = rumors.map((r) => ({
      id: r.id,
      title: r.title,
      player: r.playerId || "Unknown",
      fromClub: r.teamId || "—",
      toClub: "—",
      credibility: r.credibility ?? 50,
      status: (r.status || "draft").toLowerCase(),
      source: (r.source || "manual").toLowerCase(),
      createdAt: r.publishedAt?.toISOString() ?? new Date().toISOString(),
      body: r.body,
      slug: r.slug,
    }));

    return NextResponse.json({ ok: true, rumors: formatted });
  } catch (error: unknown) {
    console.error("Rumors GET error:", error);
    return NextResponse.json({ ok: true, rumors: [] });
  }
}

// POST /api/admin/rumors
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { player, fromClub, toClub, credibility, status, isAiGenerated, title, content } =
      body;

    const rumorTitle =
      title ||
      [player, fromClub && `from ${fromClub}`, toClub && `to ${toClub}`]
        .filter(Boolean)
        .join(" ") ||
      "Untitled rumor";

    const rumorBody =
      content ||
      `Transfer rumor: ${player || "Player"}${fromClub ? ` from ${fromClub}` : ""}${
        toClub ? ` to ${toClub}` : ""
      }.`;

    const slugBase = rumorTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const source = isAiGenerated ? "ai" : "manual";
    const initialCredibility = Number(
      credibility ?? (isAiGenerated ? 35 : 75)
    );

    const created = await db.rumor.create({
      data: {
        id: randomUUID(),
        title: rumorTitle,
        slug,
        body: rumorBody,
        credibility: initialCredibility,
        status: (status || "draft").toLowerCase(),
        source,
        createdByAI: Boolean(isAiGenerated),
        publishedAt:
          String(status || "").toLowerCase() === "published"
            ? new Date()
            : null,
      },
    });

    return NextResponse.json({ ok: true, rumor: created });
  } catch (error: unknown) {
    console.error("Rumors POST error:", error);
    return NextResponse.json(
      { error: "Failed to create rumor." },
      { status: 500 }
    );
  }
}
