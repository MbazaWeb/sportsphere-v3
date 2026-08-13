import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/teams
 *   ?search=&leagueId=&verified=&createdByAI=&page=&limit=
 *   Paginated list of teams with league name. Each team shows verification flags.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const leagueId = searchParams.get('leagueId') || '';
    const verified = searchParams.get('verified');
    const createdByAI = searchParams.get('createdByAI');
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (leagueId) where.leagueId = leagueId;
    if (verified === 'true') where.verified = true;
    if (verified === 'false') where.verified = false;
    if (createdByAI === 'true') where.createdByAI = true;
    if (createdByAI === 'false') where.createdByAI = false;

    const [total, teams] = await Promise.all([
      db.team.count({ where }),
      db.team.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          League: { select: { id: true, name: true } },
          Sport: { select: { id: true, name: true, icon: true } },
        },
      }),
    ]);

    // Fetch claimedBy users (claimedById is a raw string FK, not a Prisma relation)
    const claimedIds = Array.from(
      new Set(teams.map((t) => t.claimedById).filter(Boolean) as string[])
    );
    const claimers = claimedIds.length
      ? await db.user.findMany({
          where: { id: { in: claimedIds } },
          select: { id: true, name: true, handle: true, email: true },
        })
      : [];
    const claimerMap = new Map(claimers.map((u) => [u.id, u]));

    const data = teams.map((t) => {
      const { claimedById, ...rest } = t as any;
      return {
        ...rest,
        claimedBy: claimedById ? claimerMap.get(claimedById) || null : null,
      };
    });

    return NextResponse.json({
      data,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams', detail: String(error) },
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
    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "team";
    const slug = `${baseSlug}-${id.slice(0, 6)}`;
    const team = await db.team.create({
      data: {
        id,
        name,
        slug,
        shortName: body.shortName || null,
        city: body.city || null,
        country: body.country || null,
        countryCode: body.countryCode || null,
        logoUrl: body.logoUrl || null,
        venue: body.venue || null,
        foundedYear: body.foundedYear ? Number(body.foundedYear) : null,
        sportId: body.sportId || null,
        leagueId: body.leagueId || null,
        description: body.description || null,
        source: "admin",
        verified: Boolean(body.verified),
        createdByAI: false,
        isActive: body.isActive !== false,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, team }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/teams:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
