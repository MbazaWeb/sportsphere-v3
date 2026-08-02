// GET /api/sports — List all active sports
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const sports = await db.sport.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(sports);
  } catch (error) {
    console.error('Failed to fetch sports:', error);
    return NextResponse.json({ error: 'Failed to fetch sports' }, { status: 500 });
  }
}
