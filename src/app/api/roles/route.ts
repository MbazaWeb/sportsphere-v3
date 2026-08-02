// GET /api/roles — List all active roles with their types
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const roles = await db.role.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        types: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}
