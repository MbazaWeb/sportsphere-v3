// GET /api/roles/[id]/types — List types for a specific role
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const role = await db.role.findUnique({
      where: { id },
      include: {
        types: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role.types);
  } catch (error) {
    console.error('Failed to fetch role types:', error);
    return NextResponse.json({ error: 'Failed to fetch role types' }, { status: 500 });
  }
}
