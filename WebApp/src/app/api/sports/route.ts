// GET /api/sports — List all active sports with full metadata
// POST /api/sports — Create a new sport (admin only)
// PUT /api/sports — Update a sport (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';
import { verifyAdminSession } from '@/lib/adminGuard';
import { logAdminAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// ─── GET /api/sports ──────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const sportType = searchParams.get('sportType');
    const format = searchParams.get('format');
    const contactType = searchParams.get('contactType');
    const olympicStatus = searchParams.get('olympicStatus');
    const search = searchParams.get('q');

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    if (sportType) where.sportType = sportType;
    if (format) where.format = format;
    if (contactType) where.contactType = contactType;
    if (olympicStatus) where.olympicStatus = olympicStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const sports = await db.sport.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true, name: true, slug: true, icon: true,
        category: true, sportType: true, format: true,
        contactType: true, olympicStatus: true,
        description: true, tags: true, displayOrder: true,
      },
    });

    const result = sports.map((s: typeof sports[number]) => ({
      ...s,
      tags: safeJsonParse(s.tags, []),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch sports:', error);
    return NextResponse.json({ error: 'Failed to fetch sports' }, { status: 500 });
  }
}

// ─── POST /api/sports — Create a new sport (admin only) ──────
export async function POST(request: NextRequest) {
  // FIX: Use verifyAdminSession instead of x-user-role header
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { name, slug, icon, category, sportType, format, contactType, olympicStatus, description, tags, displayOrder } = body as {
      name?: string; slug?: string; icon?: string;
      category?: string; sportType?: string; format?: string;
      contactType?: string; olympicStatus?: string;
      description?: string; tags?: string[]; displayOrder?: number;
    };

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 });
    }

    // Length validation
    if (name.length > 100) {
      return NextResponse.json({ error: 'Name too long (max 100 chars).' }, { status: 400 });
    }

    const sport = await db.sport.create({
      data: {
        name: String(name).trim(),
        slug: String(slug).trim().toLowerCase().replace(/\s+/g, '-'),
        icon: icon || null,
        category: category || null,
        sportType: sportType || null,
        format: format || null,
        contactType: contactType || null,
        olympicStatus: olympicStatus || null,
        description: description || null,
        tags: tags ? JSON.stringify(tags) : '[]',
        displayOrder: displayOrder ?? 0,
      },
    });

    // ── Audit log ────────────────────────────────────────────────
    await logAdminAction({
      request,
      actorId: auth.user!.sub,
      action: 'sport.create',
      module: 'sports',
      targetId: sport.id,
      targetType: 'Sport',
      newValue: { name: sport.name, slug: sport.slug },
    }).catch(() => {});

    return NextResponse.json(sport, { status: 201 });
  } catch (error) {
    console.error('Failed to create sport:', error);
    return NextResponse.json({ error: 'Failed to create sport' }, { status: 500 });
  }
}

// ─── PUT /api/sports — Update a sport (admin only) ───────────
export async function PUT(request: NextRequest) {
  // FIX: Use verifyAdminSession instead of x-user-role header
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { id, name, slug, icon, category, sportType, format, contactType, olympicStatus, description, tags, displayOrder, isActive } = body as {
      id?: string; name?: string; slug?: string; icon?: string;
      category?: string; sportType?: string; format?: string;
      contactType?: string; olympicStatus?: string;
      description?: string; tags?: string[]; displayOrder?: number;
      isActive?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'Sport ID is required.' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = String(name).trim();
    if (slug !== undefined) update.slug = String(slug).trim().toLowerCase().replace(/\s+/g, '-');
    if (icon !== undefined) update.icon = icon || null;
    if (category !== undefined) update.category = category || null;
    if (sportType !== undefined) update.sportType = sportType || null;
    if (format !== undefined) update.format = format || null;
    if (contactType !== undefined) update.contactType = contactType || null;
    if (olympicStatus !== undefined) update.olympicStatus = olympicStatus || null;
    if (description !== undefined) update.description = description || null;
    if (tags !== undefined) update.tags = JSON.stringify(tags);
    if (displayOrder !== undefined) update.displayOrder = displayOrder;
    if (isActive !== undefined) update.isActive = isActive;

    const sport = await db.sport.update({
      where: { id },
      data: update,
    });

    // ── Audit log ────────────────────────────────────────────────
    await logAdminAction({
      request,
      actorId: auth.user!.sub,
      action: 'sport.update',
      module: 'sports',
      targetId: id,
      targetType: 'Sport',
      newValue: update,
    }).catch(() => {});

    return NextResponse.json(sport);
  } catch (error) {
    console.error('Failed to update sport:', error);
    return NextResponse.json({ error: 'Failed to update sport' }, { status: 500 });
  }
}
