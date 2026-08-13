import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminGuard";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  try {
    const q = request.nextUrl.searchParams.get("q") || "";
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};
    const businesses = await db.business.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ ok: true, businesses });
  } catch (error: unknown) {
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
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });
    }
    const type = String(body.type || "brand").trim();
    const allowed = new Set(["brand", "media", "sponsor", "agency", "club_partner", "other"]);
    const id = randomUUID();
    const baseSlug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "business";
    const slug = `${baseSlug}-${id.slice(0, 6)}`;
    const business = await db.business.create({
      data: {
        id,
        name,
        slug,
        type: allowed.has(type) ? type : "other",
        website: body.website || null,
        logoUrl: body.logoUrl || null,
        country: body.country || null,
        description: body.description || null,
        source: "admin",
        verified: Boolean(body.verified),
        isActive: body.isActive !== false,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, business }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST businesses:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
