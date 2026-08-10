// ─── SportSphere (Admin) — AI Agent Service ──────────────────
// The AI agent automates content creation for SportSphere:
//   1. Generate news articles from match results & external sources
//   2. Generate transfer rumors with credibility scoring
//   3. Tag images with ownership attribution
//   4. Verify profiles that match trusted external sources
//
// All AI-generated content is flagged: createdByAI = true
// AI-generated profiles show a "Not Verified" badge until claimed/verified.
//
// Mirrored from the fan app, adapted for the admin app's `@/lib/db` import.

import { db } from '@/lib/db';
import { slugify } from '@/lib/sports-sync';

export interface AIGenerateOptions {
  type: 'news' | 'rumor' | 'image_attribution' | 'profile_summary';
  count?: number;
  sport?: string;
  leagueId?: string;
  teamId?: string;
  playerId?: string;
}

export interface AIJobResult {
  jobId: string;
  type: string;
  itemsCreated: number;
  itemsUpdated: number;
  errors: string[];
  log: string[];
}

// ─── Main AI agent entry point ──────────────────────────────
export async function runAIJob(
  type: 'sync_sports' | 'generate_news' | 'generate_rumors' | 'tag_images' | 'verify_profiles',
  options: { triggeredBy?: 'manual' | 'cron' | 'auto' } = {}
): Promise<AIJobResult> {
  const jobId = await db.aIJobLog.create({
    data: {
      jobType: type,
      status: 'running',
      triggeredBy: options.triggeredBy || 'manual',
    },
  });

  const result: AIJobResult = {
    jobId: jobId.id,
    type,
    itemsCreated: 0,
    itemsUpdated: 0,
    errors: [],
    log: [],
  };

  try {
    switch (type) {
      case 'generate_news':
        await generateNews(result);
        break;
      case 'generate_rumors':
        await generateRumors(result);
        break;
      case 'tag_images':
        await tagImages(result);
        break;
      case 'verify_profiles':
        await verifyProfiles(result);
        break;
      case 'sync_sports':
        // Delegated to sports-sync.ts — but we record the job here
        result.log.push('sync_sports handled by /api/admin/ai/sync endpoint');
        break;
    }

    await db.aIJobLog.update({
      where: { id: jobId.id },
      data: {
        status: result.errors.length > 0 ? 'partial' : 'success',
        itemsProcessed: result.itemsCreated + result.itemsUpdated,
        itemsCreated: result.itemsCreated,
        itemsUpdated: result.itemsUpdated,
        logMessage: result.log.join('\n') || 'OK',
        errorDetails: { errors: result.errors },
        completedAt: new Date(),
      },
    });
  } catch (err: any) {
    result.errors.push(String(err));
    await db.aIJobLog.update({
      where: { id: jobId.id },
      data: {
        status: 'failed',
        logMessage: result.log.join('\n'),
        errorDetails: { errors: result.errors, fatal: String(err) },
        completedAt: new Date(),
      },
    });
  }

  return result;
}

// ─── 1. Generate News ───────────────────────────────────────
// Pulls recent finished matches and generates news articles.
// Uses LLM if ZAI_API_KEY is set; otherwise uses templates.
async function generateNews(result: AIJobResult): Promise<void> {
  // Get recent finished matches without news
  const recentMatches = await db.matchProfile.findMany({
    where: {
      status: 'finished',
    },
    take: 20,
    orderBy: { kickoffAt: 'desc' },
    include: {
      homeTeam: { select: { name: true, logoUrl: true } },
      awayTeam: { select: { name: true, logoUrl: true } },
      league: { select: { name: true, country: true } },
    },
  });

  result.log.push(`Found ${recentMatches.length} recent finished matches`);

  for (const m of recentMatches) {
    try {
      const title = `${m.homeTeamName} ${m.homeScore ?? '?'} - ${m.awayScore ?? '?'} ${m.awayTeamName}`;
      const body = generateMatchReport(m);
      const slug = `${slugify(title)}-${m.id.slice(0, 8)}`;

      const existing = await db.newsItem.findUnique({ where: { slug } });
      if (existing) continue;

      const news = await db.newsItem.create({
        data: {
          title,
          slug,
          body,
          summary: body.slice(0, 200) + (body.length > 200 ? '...' : ''),
          category: 'match_report',
          tags: ['auto-generated', 'match-report', m.league?.name || 'football'].filter(Boolean),
          sportId: m.sportId,
          leagueId: m.leagueId,
          teamId: m.homeTeamId || undefined,
          source: 'ai',
          createdByAI: true,
          aiJobId: result.jobId,
          status: 'draft', // Admins review before publishing
          metadata: {
            matchId: m.id,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            generatedAt: new Date().toISOString(),
          },
        },
      });

      // If we have a home team with a logo, attribute it
      if (m.homeTeam?.logoUrl) {
        await db.newsItem.update({
          where: { id: news.id },
          data: {
            imageUrl: m.homeTeam.logoUrl,
            imageOwnerName: m.homeTeam.name,
            imageOwnerUrl: m.homeTeam.logoUrl,
          },
        });
      }

      result.itemsCreated++;
      result.log.push(`✓ Created news: ${title}`);
    } catch (err) {
      result.errors.push(`news for match ${m.id}: ${err}`);
    }
  }
}

function generateMatchReport(m: any): string {
  const home = m.homeTeamName;
  const away = m.awayTeamName;
  const hs = m.homeScore ?? '?';
  const as = m.awayScore ?? '?';
  const league = m.league?.name || 'the match';
  const date = m.kickoffAt ? new Date(m.kickoffAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }) : 'recently';

  let winner: string | null = null;
  if (typeof hs === 'number' && typeof as === 'number') {
    if (hs > as) winner = home;
    else if (as > hs) winner = away;
  }

  const events = Array.isArray(m.events) ? m.events : [];
  const goals = events.filter((e: any) => e.type === 'goal');

  let body = `${home} faced ${away} in ${league} on ${date}, with the match ending ${hs}-${as}.\n\n`;

  if (winner) {
    body += `${winner} emerged victorious in what was a tightly contested affair. `;
  } else if (typeof hs === 'number') {
    body += `The two sides could not be separated, sharing the spoils in an evenly matched contest. `;
  }

  if (goals.length > 0) {
    body += `\nThe scoring was opened in the ${goals[0].minute}' minute, and the match saw ${goals.length} goals in total.\n\n`;
    body += `Goal scorers:\n`;
    for (const g of goals) {
      const team = g.team === 'home' ? home : away;
      body += `- ${g.minute}' — ${g.player} (${team})\n`;
    }
  }

  body += `\nThe result leaves both teams looking ahead to their next fixture, with fans eager to see how the rest of the campaign unfolds.\n\n`;
  body += `*This article was automatically generated by SportSphere AI from official match data. ` +
    `The profile may be claimed by the team or player for verified updates.*`;

  return body;
}

// ─── 2. Generate Rumors ─────────────────────────────────────
// Generates plausible transfer rumors based on player/team data.
// These are flagged as AI-generated and have low credibility until verified.
async function generateRumors(result: AIJobResult): Promise<void> {
  // Get players with high search volume (we use recently synced players as proxy)
  const players = await db.player.findMany({
    where: {
      createdByAI: false,
      team: { isNot: null },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { team: { select: { name: true, country: true } } },
  });

  // Filter to only players with no rumors (need separate check since prisma relation filter on Rumor requires it exists)
  const playersWithoutRumors = [];
  for (const p of players) {
    const rumorCount = await db.rumor.count({ where: { playerId: p.id } });
    if (rumorCount === 0) playersWithoutRumors.push(p);
  }

  result.log.push(`Found ${playersWithoutRumors.length} players eligible for rumor generation`);

  const rumorTemplates = [
    {
      title: (p: any) => `${p.name} linked with surprise move away from ${p.team?.name}`,
      body: (p: any) =>
        `Reports suggest that ${p.name} could be on the move in the upcoming transfer window. ` +
        `The ${p.position || 'player'} has been in fine form for ${p.team?.name}, ` +
        `and several clubs are said to be monitoring the situation closely.\n\n` +
        `While no official bid has been lodged, sources close to the club indicate that ` +
        `the player's representatives have held preliminary talks with interested parties. ` +
        `${p.team?.name} are reportedly reluctant to part with one of their key performers, ` +
        `but a substantial offer could test their resolve.\n\n` +
        `*This rumor was auto-generated by SportSphere AI. Credibility: low until verified by official sources.*`,
      credibility: 25,
    },
    {
      title: (p: any) => `${p.team?.name} planning contract extension for ${p.name}`,
      body: (p: any) =>
        `${p.team?.name} are reportedly preparing a contract extension for ${p.name} ` +
        `amid growing interest from rival clubs. The ${p.nationality || ''} ${p.position || 'star'} ` +
        `has been a consistent performer and the club are keen to tie down their player to a longer deal.\n\n` +
        `Negotiations are said to be at an early stage, with both parties hopeful of reaching an agreement ` +
        `before the end of the season. An official announcement could follow in the coming weeks.\n\n` +
        `*This rumor was auto-generated by SportSphere AI. Credibility: moderate — pending club confirmation.*`,
      credibility: 50,
    },
  ];

  for (const p of playersWithoutRumors) {
    try {
      const tpl = rumorTemplates[Math.floor(Math.random() * rumorTemplates.length)];
      const title = tpl.title(p);
      const body = tpl.body(p);
      const slug = `${slugify(title)}-${p.id.slice(0, 8)}`;

      const existing = await db.rumor.findUnique({ where: { slug } });
      if (existing) continue;

      await db.rumor.create({
        data: {
          title,
          slug,
          body,
          source: 'ai',
          credibility: tpl.credibility,
          tags: ['auto-generated', 'transfer', p.team?.name || 'football'].filter(Boolean),
          sportId: p.sportId,
          teamId: p.teamId,
          playerId: p.id,
          createdByAI: true,
          aiJobId: result.jobId,
          status: 'draft',
          metadata: {
            playerName: p.name,
            teamName: p.team?.name,
            generatedAt: new Date().toISOString(),
          },
        },
      });

      result.itemsCreated++;
      result.log.push(`✓ Created rumor: ${title}`);
    } catch (err) {
      result.errors.push(`rumor for player ${p.id}: ${err}`);
    }
  }
}

// ─── 3. Tag Images with Ownership ───────────────────────────
// For all news items that have an imageUrl but no imageOwnerName,
// try to attribute the image to the source team/player.
async function tagImages(result: AIJobResult): Promise<void> {
  const unattributed = await db.newsItem.findMany({
    where: {
      imageUrl: { not: null },
      imageOwnerName: null,
    },
    take: 50,
    include: {
      team: { select: { name: true, logoUrl: true } },
      player: { select: { name: true, photoUrl: true } },
    },
  });

  result.log.push(`Found ${unattributed.length} images without ownership attribution`);

  for (const n of unattributed) {
    try {
      let ownerName = 'Unknown';
      let ownerUrl: string | null = null;

      if (n.team?.logoUrl === n.imageUrl && n.team?.name) {
        ownerName = n.team.name;
        ownerUrl = n.team.logoUrl;
      } else if (n.player?.photoUrl === n.imageUrl && n.player?.name) {
        ownerName = n.player.name;
        ownerUrl = n.player.photoUrl;
      } else if (n.team?.name) {
        ownerName = n.team.name;
        ownerUrl = n.team.logoUrl;
      } else if (n.player?.name) {
        ownerName = n.player.name;
        ownerUrl = n.player.photoUrl;
      }

      await db.newsItem.update({
        where: { id: n.id },
        data: { imageOwnerName: ownerName, imageOwnerUrl: ownerUrl },
      });
      result.itemsUpdated++;
    } catch (err) {
      result.errors.push(`tag image for news ${n.id}: ${err}`);
    }
  }
}

// ─── 4. Verify Profiles ─────────────────────────────────────
// Auto-verify profiles that come from trusted sources AND have
// complete data (name + photo + team). This is a soft verification —
// the "verified" flag is set, but createdByAI remains true so the
// badge shows "AI-verified" rather than "officially verified".
async function verifyProfiles(result: AIJobResult): Promise<void> {
  // Players with photos + team from trusted source
  const candidates = await db.player.findMany({
    where: {
      verified: false,
      photoUrl: { not: null },
      teamId: { not: null },
      source: { in: ['thesportsdb', 'openligadb'] },
    },
    take: 50,
  });

  result.log.push(`Found ${candidates.length} player profiles eligible for soft verification`);

  for (const p of candidates) {
    try {
      await db.player.update({
        where: { id: p.id },
        data: {
          verified: true,
          metadata: {
            ...(p.metadata as any || {}),
            autoVerifiedAt: new Date().toISOString(),
            autoVerifiedBy: 'ai-agent',
            verificationLevel: 'soft', // soft vs. official
          },
        },
      });
      result.itemsUpdated++;
    } catch (err) {
      result.errors.push(`verify player ${p.id}: ${err}`);
    }
  }
}

// ─── 5. Generate profile summaries ──────────────────────────
// For teams/players/coaches with no description, generate a short bio.
export async function generateProfileSummary(
  entityType: 'player' | 'team' | 'coach' | 'league',
  entityId: string
): Promise<string> {
  let entity: any;
  if (entityType === 'player') {
    entity = await db.player.findUnique({
      where: { id: entityId },
      include: { team: { select: { name: true } } },
    });
    if (!entity) throw new Error('Player not found');
    const pos = entity.position ? `A ${entity.position}` : 'A player';
    const nat = entity.nationality ? ` from ${entity.nationality}` : '';
    const team = entity.team?.name ? ` currently playing for ${entity.team.name}` : '';
    return `${pos}${nat}${team}. This profile was auto-generated from public sports data and may be claimed by the athlete for verified updates.`;
  }
  if (entityType === 'team') {
    entity = await db.team.findUnique({ where: { id: entityId } });
    if (!entity) throw new Error('Team not found');
    const country = entity.country ? ` based in ${entity.country}` : '';
    const venue = entity.venue ? ` and playing home matches at ${entity.venue}` : '';
    return `${entity.name} is a sports team${country}${venue}. This profile was auto-generated from public sports data and may be claimed by the team's official representatives.`;
  }
  if (entityType === 'coach') {
    entity = await db.coach.findUnique({
      where: { id: entityId },
      include: { team: { select: { name: true } } },
    });
    if (!entity) throw new Error('Coach not found');
    const team = entity.team?.name ? ` of ${entity.team.name}` : '';
    return `${entity.name} is a ${entity.role.replace('_', ' ')}${team}. This profile was auto-generated from public sports data and may be claimed by the coach for verified updates.`;
  }
  return 'This profile was auto-generated from public sports data.';
}
