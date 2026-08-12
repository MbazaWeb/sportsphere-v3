import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/sports — Fetch all sports with assigned user counts
export async function GET() {
  try {
    const sports = await db.sport.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { userSports: true }
        }
      }
    });

    const formatted = sports.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      icon: s.icon || '⚽',
      isActive: s.isActive ?? true,
      userCount: s._count?.userSports || 0,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ ok: true, sports: formatted });
  } catch (error: any) {
    console.error('Error fetching sports:', error);
    return NextResponse.json({ error: 'Failed to fetch sports.' }, { status: 500 });
  }
}

// POST /api/admin/sports — Add a new sport
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, slug } = body;

    if (!name) {
      return NextResponse.json({ error: 'Sport name is required.' }, { status: 400 });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newSport = await db.sport.create({
      data: {
        name,
        slug: generatedSlug,
        icon: icon || '⚽',
        isActive: true,
      }
    });

    return NextResponse.json({ ok: true, sport: newSport });
  } catch (error: any) {
    console.error('Error creating sport:', error);
    return NextResponse.json({ error: error.message || 'Failed to create sport.' }, { status: 500 });
  }
}

// PATCH /api/admin/sports — Toggle active state
export async function PATCH(request: NextRequest) {
  try {
    const { id, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Sport ID required' }, { status: 400 });
    }

    const updated = await db.sport.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json({ ok: true, sport: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update sport' }, { status: 500 });
  }
}
