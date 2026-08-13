import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/coaches
 *   ?search=&teamId=&page=&limit=
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const teamId = searchParams.get('teamId') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nationality: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (teamId) where.teamId = teamId;

    const [total, coaches] = await Promise.all([
      db.coach.count({ where }),
      db.coach.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          Team: { select: { id: true, name: true, logoUrl: true } },
          Sport: { select: { id: true, name: true, icon: true } },
        },
      }),
    ]);

    const claimedIds = Array.from(
      new Set(coaches.map((c) => c.claimedById).filter(Boolean) as string[])
    );
    const claimers = claimedIds.length
      ? await db.user.findMany({
          where: { id: { in: claimedIds } },
          select: { id: true, name: true, handle: true, email: true },
        })
      : [];
    const claimerMap = new Map(claimers.map((u) => [u.id, u]));

    const data = coaches.map((c) => {
      const { claimedById, ...rest } = c as any;
      return {
        ...rest,
        claimedBy: claimedById ? claimerMap.get(claimedById) || null : null,
      };
    });

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch coaches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaches', detail: String(error) },
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
    const role = String(body.role || "head_coach").trim();
    const allowed = new Set([
      "head_coach",
      "assistant_coach",
      "goalkeeping_coach",
      "fitness_coach",
      "analyst",
      "staff",
      "other",
    ]);
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "coach";
    const slug = `${baseSlug}-${id.slice(0, 6)}`;
    const coach = await db.coach.create({
      data: {
        id,
        name,
        slug,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        nationality: body.nationality || null,
        countryCode: body.countryCode || null,
        photoUrl: body.photoUrl || null,
        role: allowed.has(role) ? role : "staff",
        teamId: body.teamId || null,
        leagueId: body.leagueId || null,
        sportId: body.sportId || null,
        description: body.description || null,
        source: "admin",
        verified: Boolean(body.verified),
        createdByAI: false,
        isActive: body.isActive !== false,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, coach }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/coaches:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
