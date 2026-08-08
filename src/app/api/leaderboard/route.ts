import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

// GET /api/leaderboard — top users by REAL PERFORMANCE POINTS
//
// Phase 5 change: previously this endpoint used `followerCount` as a
// proxy for "points" (a popularity score). That violated the
// Performance Engine spec — performance must reflect verified sporting
// performance, not social engagement.
//
// Now reads from `PerformanceProfile.totalPoints` (the audited ledger
// balance). Users without a PerformanceProfile are excluded.
//
// Query params:
//   ?role=player|coach|team          — filter by role
//   ?position=GK|DEF|MID|FWD         — filter by player position
//   ?playerType=Professional|Amateur  — filter by player type
//   ?categoryBucket=...              — filter by exact bucket
//   ?dimension=overall|form|season|career|improvement|consistency
//                                    — which rank to sort by (default: overall = totalPoints)
//   ?limit=10                        — max results (capped at 50)

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get('role') || undefined;
    const position = url.searchParams.get('position') || undefined;
    const playerType = url.searchParams.get('playerType') || undefined;
    const categoryBucket = url.searchParams.get('categoryBucket') || undefined;
    const dimension = url.searchParams.get('dimension') || 'overall';
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '10', 10)));

    // Build where clause
    const where: any = {
      // Only include users with a PerformanceProfile
      performanceProfile: { isNot: null },
    };
    if (role) where.role = role;
    if (position) where.performanceProfile = { ...where.performanceProfile, position };
    if (playerType) where.performanceProfile = { ...where.performanceProfile, playerType };
    if (categoryBucket) where.performanceProfile = { ...where.performanceProfile, categoryBucket };

    // Determine sort field based on dimension
    const sortField = dimensionToSortField(dimension);

    const users = await db.user.findMany({
      where,
      select: {
        ...USER_SELECT,
        performanceProfile: {
          select: {
            performanceScore: true,
            totalPoints: true,
            tier: true,
            formScore: true,
            consistencyScore: true,
            improvementScore: true,
            rankGlobal: true,
            rankCategory: true,
            rankForm: true,
            rankSeason: true,
            rankCareer: true,
            rankImprovement: true,
            rankConsistency: true,
            rankMovement: true,
            categoryBucket: true,
            position: true,
            playerType: true,
            lastEventAt: true,
          },
        },
      },
      orderBy: sortField,
      take: limit,
    });

    const leaderboard = users.map((u, i) => {
      const perf = u.performanceProfile;
      return {
        rank: i + 1,
        ...u,
        // Real performance points from the audited ledger:
        points: perf?.totalPoints ?? 0,
        performanceScore: perf?.performanceScore ?? 0,
        tier: perf?.tier ?? 'Unranked',
        formScore: perf?.formScore ?? 0,
        consistencyScore: perf?.consistencyScore ?? 0,
        improvementScore: perf?.improvementScore ?? 0,
        rankMovement: perf?.rankMovement ?? 0,
        categoryBucket: perf?.categoryBucket ?? '',
        position: perf?.position ?? null,
        playerType: perf?.playerType ?? null,
        lastEventAt: perf?.lastEventAt ?? null,
        roleData: safeJsonParse(u.roleData, {}),
        sportsFollowing: safeJsonParse(u.sportsFollowing, []),
      };
    });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

function dimensionToSortField(dimension: string): any {
  switch (dimension) {
    case 'form':
      return { performanceProfile: { formScore: 'desc' } };
    case 'season':
      return { performanceProfile: { rankSeason: 'asc' } };
    case 'career':
      return { performanceProfile: { rankCareer: 'asc' } };
    case 'improvement':
      return { performanceProfile: { improvementScore: 'desc' } };
    case 'consistency':
      return { performanceProfile: { consistencyScore: 'desc' } };
    case 'overall':
    default:
      return { performanceProfile: { totalPoints: 'desc' } };
  }
}
