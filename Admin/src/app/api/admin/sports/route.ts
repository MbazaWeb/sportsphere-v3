import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sports
 *   Returns all sports ordered by displayOrder, then name.
 *
 * POST /api/admin/sports
 *   Body: { name, slug?, icon?, category?, description?, isActive?, displayOrder? }
 *   Creates a new sport. Slug auto-derived from name if not provided.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const sports = await db.sport.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        category: true,
        sportType: true,
        format: true,
        contactType: true,
        olympicStatus: true,
        description: true,
        tags: true,
        isActive: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(sports);
  } catch (error) {
    console.error('Failed to fetch sports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sports' },
      { status: 500 }
    );
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      slug?: string;
      icon?: string;
      category?: string;
      sportType?: string;
      format?: string;
      contactType?: string;
      olympicStatus?: string;
      description?: string;
      tags?: string[];
      isActive?: boolean;
      displayOrder?: number;
    };

    const name = (body.name || '').trim();
    if (!name) {
      return NextResponse.json(
        { error: 'Sport name is required.' },
        { status: 400 }
      );
    }

    const slug = (body.slug || slugify(name)).toLowerCase().trim();
    if (!slug) {
      return NextResponse.json(
        { error: 'Could not derive a slug — please provide one explicitly.' },
        { status: 400 }
      );
    }

    // Uniqueness check
    const existing = await db.sport.findFirst({
      where: {
        OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }],
      },
      select: { id: true, name: true, slug: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: `A sport with name "${existing.name}" or slug "${existing.slug}" already exists.`,
        },
        { status: 409 }
      );
    }

    const sport = await db.sport.create({
      data: {
        name,
        slug,
        icon: body.icon ?? '🏆',
        category: body.category ?? null,
        sportType: body.sportType ?? null,
        format: body.format ?? null,
        contactType: body.contactType ?? null,
        olympicStatus: body.olympicStatus ?? null,
        description: body.description ?? null,
        tags: body.tags ?? [],
        isActive: body.isActive ?? true,
        displayOrder: body.displayOrder ?? 0,
      },
    });

    return NextResponse.json(sport, { status: 201 });
  } catch (error) {
    console.error('Failed to create sport:', error);
    return NextResponse.json(
      { error: 'Failed to create sport', detail: String(error) },
      { status: 500 }
    );
  }
}
