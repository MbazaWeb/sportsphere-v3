import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const communities = await db.community.findMany({
      include: {
        createdBy: true,
      },
      orderBy: { memberCount: 'desc' },
      take: 20,
    });

    return NextResponse.json(communities);
  } catch (error) {
    console.error('Communities API error:', error);
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}
