import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';

// Enum values mirrored from schema.prisma (Prisma client not generated in CI)
type FavoriteTargetType = 'TEAM' | 'PLAYER' | 'COACH' | 'STADIUM' | 'LEAGUE' | 'NATIONAL_TEAM' | 'COMPETITION' | 'SPORT';
const VALID_TYPES: FavoriteTargetType[] = [
  'TEAM', 'PLAYER', 'COACH', 'STADIUM', 'LEAGUE', 'NATIONAL_TEAM', 'COMPETITION', 'SPORT'
];

// GET /api/profile/favorites — list favorites
//   ?userId=xxx  — public: fetch any user's favorites (no auth needed)
//   (no param)   — private: fetch current user's favorites (auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const targetUserId = searchParams.get('userId');

    let userId: string | null = null;

    if (targetUserId) {
      // Public access — anyone can view a user's favorites
      userId = targetUserId;
    } else {
      // Private access — require auth
      userId = await getUserIdFromRequest(request);
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }
    }

    const favorites = await db.userFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Favorites GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/profile/favorites — add a favorite
// Body: { targetType, targetName, targetHandle? }
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { targetType, targetName, targetHandle, targetId } = await request.json();

    if (!targetType || !targetName || !targetId) {
      return NextResponse.json({ error: 'targetType, targetName and targetId are required.' }, { status: 400 });
    }

    const enumType = String(targetType).toUpperCase() as FavoriteTargetType;
    if (!VALID_TYPES.includes(enumType)) {
      return NextResponse.json({ error: 'Invalid targetType.' }, { status: 400 });
    }

    const favorite = await db.userFavorite.upsert({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: enumType,
          targetId: String(targetId),
        },
      },
      update: { targetName: String(targetName), targetHandle: targetHandle || null },
      create: {
        userId,
        targetType: enumType,
        targetId: String(targetId),
        targetName: String(targetName),
        targetHandle: targetHandle || null,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Favorites POST error:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE /api/profile/favorites?id=xxx — remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Favorite id is required.' }, { status: 400 });
    }

    await db.userFavorite.deleteMany({
      where: { id: String(id), userId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Favorites DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
