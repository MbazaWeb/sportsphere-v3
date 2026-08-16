import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { realtime } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  try {
    const { id } = await params;
    const match = await db.matchProfile.findUnique({
      where: { id },
      include: {
        League: { select: { id: true, name: true } },
        Sport: { select: { id: true, name: true } },
        Team_MatchProfile_homeTeamIdToTeam: { select: { id: true, name: true, logoUrl: true } },
        Team_MatchProfile_awayTeamIdToTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    });
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(match);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await db.matchProfile.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data: any = { updatedAt: new Date() };
    const fields = [
      'homeTeamName', 'awayTeamName', 'status', 'period', 'venue',
      'homeTeamId', 'awayTeamId', 'leagueId', 'sportId',
    ] as const;
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f] === '' ? null : body[f];
    }
    if (body.homeScore !== undefined) {
      data.homeScore = body.homeScore === '' || body.homeScore == null ? null : Number(body.homeScore);
    }
    if (body.awayScore !== undefined) {
      data.awayScore = body.awayScore === '' || body.awayScore == null ? null : Number(body.awayScore);
    }
    if (body.minute !== undefined) {
      data.minute = body.minute === '' || body.minute == null ? null : Number(body.minute);
    }
    if (body.kickoffAt) data.kickoffAt = new Date(body.kickoffAt);
    if (Array.isArray(body.events)) data.events = body.events;

    const prevMeta = (existing.metadata as any) || {};
    if (body.stats || body.lineups || body.coaches || body.referee != null || body.attendance != null || body.notes != null) {
      data.metadata = {
        ...prevMeta,
        ...(body.stats ? { stats: body.stats } : {}),
        ...(body.lineups ? { lineups: body.lineups } : {}),
        ...(body.coaches ? { coaches: body.coaches } : {}),
        ...(body.referee != null ? { referee: body.referee } : {}),
        ...(body.attendance != null ? { attendance: body.attendance === '' ? null : Number(body.attendance) } : {}),
        ...(body.notes != null ? { notes: body.notes } : {}),
      };
    }

    const updated = await db.matchProfile.update({ where: { id }, data });

    // Mirror to fan Match table when linked
    const fanId = (prevMeta.fanMatchId as string) || existing.externalId;
    if (fanId) {
      const fanData: any = {};
      if (data.homeTeamName) fanData.homeTeam = data.homeTeamName;
      if (data.awayTeamName) fanData.awayTeam = data.awayTeamName;
      if (data.homeScore !== undefined) fanData.homeScore = data.homeScore;
      if (data.awayScore !== undefined) fanData.awayScore = data.awayScore;
      if (data.status) {
        fanData.status =
          data.status === 'ht' ? 'ht' :
          data.status === 'ft' ? 'ft' :
          data.status === 'live' ? 'live' :
          data.status === 'postponed' ? 'postponed' :
          data.status === 'cancelled' ? 'cancelled' : 'upcoming';
      }
      if (data.minute !== undefined) fanData.minute = data.minute;
      if (data.venue !== undefined) fanData.venue = data.venue;
      if (data.kickoffAt) fanData.kickoffAt = data.kickoffAt;
      if (data.events) fanData.events = data.events;
      try {
        await db.match.update({ where: { id: fanId }, data: fanData });
      } catch (e) {
        console.warn('Fan match mirror update failed:', e);
      }
    }

    // Live push to fan app clients
    realtime.matchUpdate(id, {
      id,
      fanMatchId: fanId || null,
      homeTeam: updated.homeTeamName,
      awayTeam: updated.awayTeamName,
      homeScore: updated.homeScore,
      awayScore: updated.awayScore,
      status: updated.status,
      minute: updated.minute,
      events: updated.events,
      venue: updated.venue,
      kickoffAt: updated.kickoffAt,
      updatedAt: updated.updatedAt,
    });

    return NextResponse.json({ ok: true, match: updated });
  } catch (e) {
    console.error('PATCH match:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/admin/matches/[id] — publish match to fan feed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const match = await db.matchProfile.findUnique({
      where: { id },
      include: {
        League: { select: { id: true, name: true, country: true } },
        Sport: { select: { id: true, name: true } },
        Team_MatchProfile_homeTeamIdToTeam: { select: { id: true, name: true, logoUrl: true } },
        Team_MatchProfile_awayTeamIdToTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    });
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Use a dedicated SportSphere Official account for admin feed posts.
    // This ensures admin posts don't appear as personal posts from any fan user.
    const OFFICIAL_HANDLE = 'sportsphere';
    let adminUser = await db.user.findUnique({ where: { handle: OFFICIAL_HANDLE } });
    if (!adminUser) {
      // Create the official system account on-the-fly
      adminUser = await db.user.create({
        data: {
          email: 'official@sportsphere.app',
          name: 'SportSphere',
          handle: OFFICIAL_HANDLE,
          password: 'no-login-' + Date.now(), // unusable password
          avatarInitials: 'SS',
          isVerified: true,
          verificationStatus: 'verified',
          role: 'official',
          bio: 'Official SportSphere account — match updates, news, and announcements.',
          coverGradient: 'from-amber-500 to-orange-600',
        },
      });
    }

    const homeBadge = match.Team_MatchProfile_homeTeamIdToTeam?.logoUrl || null;
    const awayBadge = match.Team_MatchProfile_awayTeamIdToTeam?.logoUrl || null;
    const league = match.League?.name || 'Match';
    const statusLabel = (match.status || 'upcoming').toUpperCase();
    const kickoffStr = match.kickoffAt
      ? new Date(match.kickoffAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'TBD';

    const content = `${match.homeTeamName} vs ${match.awayTeamName} \u2014 ${league}`;

    // Store match data as JSON in mediaUrls[0]
    const matchData = {
      type: 'match-card',
      matchId: match.id,
      homeTeam: match.homeTeamName,
      awayTeam: match.awayTeamName,
      homeBadge,
      awayBadge,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status,
      minute: match.minute,
      kickoffAt: match.kickoffAt,
      venue: match.venue,
      league,
      country: match.League?.country || '',
      sport: match.Sport?.name || '',
    };

    const post = await db.post.create({
      data: {
        userId: adminUser.id,
        content,
        postType: 'match',
        mediaUrls: JSON.stringify([JSON.stringify(matchData)]),
        teamTag: league,
        hashtags: JSON.stringify([league, match.homeTeamName, match.awayTeamName, 'MatchDay'].filter(Boolean)),
        isBreaking: match.status === 'live',
      },
      select: {
        id: true, userId: true, content: true, postType: true, mediaUrls: true,
        teamTag: true, playerTag: true, hashtags: true, location: true,
        isBreaking: true, likeCount: true, commentCount: true, shareCount: true,
        viewCount: true, createdAt: true, updatedAt: true,
        user: { select: { id: true, name: true, handle: true, avatarUrl: true, avatarInitials: true, isVerified: true, isPro: true, role: true, bio: true, location: true, followerCount: true, followingCount: true, postCount: true, registeredAt: true, verificationStatus: true, coverGradient: true, roleData: true, sportsFollowing: true } },
      },
    });

    // Emit realtime
    try {
      realtime.postCreated({
        ...post,
        mediaUrls: [matchData],
        hashtags: [league, match.homeTeamName, match.awayTeamName, 'MatchDay'].filter(Boolean),
        user: post.user ? { ...post.user, roleData: {}, sportsFollowing: [] } : null,
      });
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true, postId: post.id });
  } catch (e) {
    console.error('Publish match to feed:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
