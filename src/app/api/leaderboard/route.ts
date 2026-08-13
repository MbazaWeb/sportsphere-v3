import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

// GET /api/leaderboard — top users by REAL PERFORMANCE POINTS
//
// Query params:
//   ?role=player|coach|team
//   ?position=GK|DEF|MID|FWD
//   ?playerType=Professional|Amateur
//   ?categoryBucket=...
//   ?dimension=overall|form|season|career|improvement|consistency
//   ?limit=10 (max 50)
//
// For role=player: includes players even without PerformanceProfile,
// ranking by totalPoints when present, otherwise PlayerProfile.rating (PPI).

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get('role') || undefined;
    const position = url.searchParams.get('position') || undefined;
    const playerType = url.searchParams.get('playerType') || undefined;
    const categoryBucket = url.searchParams.get('categoryBucket') || undefined;
    const dimension = url.searchParams.get('dimension') || 'overall';
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '10', 10)));

    // Player-specific path: prefer performance ledger, fall back to PPI
    if (role === 'player') {
      return NextResponse.json(
        await fetchPlayerLeaderboard({ position, playerType, categoryBucket, dimension, limit }),
      );
    }

    const where: Record<string, unknown> = {
      performanceProfile: { isNot: null },
    };
    if (role) where.role = role;

    const perfFilter: Record<string, unknown> = { isNot: null };
    if (position) perfFilter.position = position;
    if (playerType) perfFilter.playerType = playerType;
    if (categoryBucket) perfFilter.categoryBucket = categoryBucket;
    where.performanceProfile = perfFilter;

    const sortField = dimensionToSortField(dimension);

    const users = await db.user.findMany({
      where,
      select: {
        ...USER_SELECT,
        performanceProfile: {
          select: {
            totalPoints: true,
            performanceScore: true,
            tier: true,
            formScore: true,
            consistencyScore: true,
            improvementScore: true,
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

    const leaderboard = users.map((u, i) => mapEntry(u, i + 1));
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

async function fetchPlayerLeaderboard(opts: {
  position?: string;
  playerType?: string;
  categoryBucket?: string;
  dimension: string;
  limit: number;
}) {
  const { position, playerType, categoryBucket, dimension, limit } = opts;

  // All users with role=player (profiles optional — rank by points/PPI when present)
  const users = await db.user.findMany({
    where: { role: 'player' },
    select: {
      ...USER_SELECT,
      performanceProfile: {
        select: {
          totalPoints: true,
          performanceScore: true,
          tier: true,
          formScore: true,
          consistencyScore: true,
          improvementScore: true,
          rankMovement: true,
          categoryBucket: true,
          position: true,
          playerType: true,
          lastEventAt: true,
        },
      },
      playerProfile: {
        select: {
          position: true,
          playerType: true,
          rating: true,
          currentClub: true,
          nationality: true,
          goals: true,
          assists: true,
          appearances: true,
          form: true,
        },
      },
    },
    take: 200, // rank in memory so PPI fallback works
  });

  let filtered = users;

  if (position) {
    const pos = position.toUpperCase();
    filtered = filtered.filter((u) => {
      const p =
        u.performanceProfile?.position ||
        u.playerProfile?.position ||
        '';
      return p.toUpperCase().includes(pos) || matchPositionBucket(p, pos);
    });
  }

  if (playerType) {
    filtered = filtered.filter((u) => {
      const t =
        u.performanceProfile?.playerType ||
        u.playerProfile?.playerType ||
        '';
      return t.toLowerCase() === playerType.toLowerCase();
    });
  }

  if (categoryBucket) {
    filtered = filtered.filter(
      (u) => u.performanceProfile?.categoryBucket === categoryBucket,
    );
  }

  const scored = filtered.map((u) => {
    const perf = u.performanceProfile;
    const pp = u.playerProfile;
    const totalPoints = perf?.totalPoints ?? 0;
    const ppi = pp?.rating ?? 0;
    // Effective sort key by dimension
    let sortValue = totalPoints;
    if (dimension === 'form') sortValue = perf?.formScore ?? 0;
    else if (dimension === 'improvement') sortValue = perf?.improvementScore ?? 0;
    else if (dimension === 'consistency') sortValue = perf?.consistencyScore ?? 0;
    else {
      // overall: prefer ledger points; if zero, use PPI * 10 so relative order is meaningful
      sortValue = totalPoints > 0 ? totalPoints : ppi * 10;
    }
    return { u, sortValue, totalPoints, ppi };
  });

  scored.sort((a, b) => b.sortValue - a.sortValue);

  return scored.slice(0, limit).map(({ u, totalPoints, ppi }, i) => {
    const base = mapEntry(u, i + 1);
    const pp = u.playerProfile;
    return {
      ...base,
      // Ensure points reflect ledger or PPI-derived value for display
      points: totalPoints > 0 ? totalPoints : Math.round(ppi * 10),
      performanceScore: base.performanceScore || ppi || 0,
      tier: base.tier !== 'Unranked' && base.tier !== 'D' ? base.tier : ppiTier(ppi),
      position: base.position || pp?.position || null,
      playerType: base.playerType || pp?.playerType || null,
      currentTeam: pp?.currentClub ?? null,
      nationality: pp?.nationality ?? null,
      ppiScore: ppi,
      goals: pp?.goals ?? 0,
      assists: pp?.assists ?? 0,
      matchesPlayed: pp?.appearances ?? 0,
    };
  });
}

function mapEntry(
  u: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
    avatarInitials: string | null;
    role: string;
    isPro?: boolean;
    isVerified?: boolean;
    roleData?: unknown;
    sportsFollowing?: unknown;
    performanceProfile?: {
      totalPoints: number;
      performanceScore: number;
      tier: string;
      formScore: number;
      consistencyScore: number;
      improvementScore: number;
      rankMovement: number;
      categoryBucket: string;
      position: string | null;
      playerType: string | null;
      lastEventAt: Date | null;
    } | null;
  },
  rank: number,
) {
  const perf = u.performanceProfile;
  return {
    rank,
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatarUrl: u.avatarUrl,
    avatarInitials: u.avatarInitials,
    role: u.role,
    isPro: u.isPro ?? false,
    isVerified: u.isVerified ?? false,
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
}

function dimensionToSortField(dimension: string): Record<string, unknown> {
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

function matchPositionBucket(pos: string, bucket: string): boolean {
  const p = pos.toLowerCase();
  if (bucket === 'GK') return /gk|goal/.test(p);
  if (bucket === 'DEF') return /def|back|cb|lb|rb/.test(p);
  if (bucket === 'MID') return /mid|cm|dm|am|wing/.test(p);
  if (bucket === 'FWD') return /fwd|forward|st|striker|cf|winger/.test(p);
  return false;
}

function ppiTier(ppi: number): string {
  if (ppi >= 90) return 'S';
  if (ppi >= 80) return 'A';
  if (ppi >= 70) return 'B';
  if (ppi >= 60) return 'C';
  if (ppi > 0) return 'D';
  return 'Unranked';
}
