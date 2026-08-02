// GET /api/sports/[slug] — Get single sport details with metadata
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sport = await db.sport.findUnique({
      where: { slug },
    });

    if (!sport || !sport.isActive) {
      return NextResponse.json({ error: 'Sport not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ...sport,
      tags: safeJsonParse(sport.tags, []),
    });
  } catch (error) {
    console.error('Failed to fetch sport:', error);
    return NextResponse.json({ error: 'Failed to fetch sport' }, { status: 500 });
  }
}
