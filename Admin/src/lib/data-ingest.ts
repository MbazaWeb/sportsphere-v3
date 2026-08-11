// ─── SportSphere Admin — Data Ingest & Seeding Engine ───────────
// Fetches data from football-data.org, creates User accounts
// for teams, players, coaches, and generates welcome posts.
// Every created account gets an auto welcome post on their feed.

import { db } from '@/lib/db';
import { FootballDataOrgProvider } from '@/lib/sports-providers/football-data-org';

const TEAM_ROLE_ID = '199d10b8-dbf5-49a5-8a18-b7821602f522';
const PRO_CLUB_TYPE_ID = '6001f9a1-d44d-4a21-8c2a-74119f3be119';
const FOOTBALL_SPORT_ID = '419e6158-1e3c-4879-b683-b66dd1975003';

// ─── Role-specific welcome post config ───────────────
const WELCOME_CONFIG: Record<string, {
  gradient: string;
  accentColor: string;
  emoji: string;
  label: string;
  template: (name: string, extra: string, hashtags: string[]) => string;
}> = {
  team: {
    gradient: 'from-emerald-600 via-emerald-700 to-teal-900',
    accentColor: '#10b981',
    emoji: '\u26bd',
    label: 'Team',
    template: (name, extra, tags) =>
      `Welcome to SportSphere! ${name} is now officially on the platform. ${extra ? extra + '.' : ''} Follow for the latest updates, match results, and exclusive content. ${tags.map(t => '#' + t).join(' ')}`,
  },
  player: {
    gradient: 'from-sky-600 via-blue-700 to-indigo-900',
    accentColor: '#0ea5e9',
    emoji: '\u26bd',
    label: 'Player',
    template: (name, extra, tags) =>
      `Welcome to SportSphere! ${name} has joined the community. ${extra || ''} Follow to track their career journey and stay connected with fan updates. ${tags.map(t => '#' + t).join(' ')}`,
  },
  coach: {
    gradient: 'from-purple-600 via-violet-700 to-purple-900',
    accentColor: '#a855f7',
    emoji: '\u{1f3c5}',
    label: 'Coach',
    template: (name, extra, tags) =>
      `Welcome to SportSphere! ${name} is now on the platform. ${extra || ''} Follow for tactical insights, coaching updates, and behind-the-scenes content. ${tags.map(t => '#' + t).join(' ')}`,
  },
};

interface IngestResult {
  teamsCreated: number; teamsSkipped: number;
  playersCreated: number; playersSkipped: number;
  coachesCreated: number; coachesSkipped: number;
  errors: string[]; logs: string[];
}

function generateHandle(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 20);
}

function generateEmail(name: string, role: string): string {
  const handle = generateHandle(name);
  return `${handle}-${role}-${Date.now().toString(36)}@sportssphere.fun`;
}

function generateHashtags(name: string, league?: string, position?: string): string[] {
  const tags: string[] = [];
  // Team/club name as hashtag (no spaces)
  const slug = name.replace(/[^a-zA-Z0-9]/g, '');
  if (slug) tags.push(slug);
  if (league) {
    const leagueSlug = league.replace(/[^a-zA-Z0-9]/g, '');
    if (leagueSlug) tags.push(leagueSlug);
  }
  if (position) tags.push(position.replace(/\s+/g, ''));
  tags.push('SportSphere');
  tags.push('Football');
  return [...new Set(tags)];
}

// ─── Create Welcome Post ───────────────────────────────
async function createWelcomePost(
  userId: string,
  role: 'team' | 'player' | 'coach',
  name: string,
  extra: string,
  hashtags: string[],
  teamTag?: string,
): Promise<void> {
  try {
    const config = WELCOME_CONFIG[role];
    if (!config) return;

    const content = config.template(name, extra, hashtags);

    // Store welcome post metadata in mediaUrls as JSON
    // This tells the frontend to render with colored background
    const welcomeMeta = {
      type: 'welcome',
      gradient: config.gradient,
      accentColor: config.accentColor,
      emoji: config.emoji,
      roleLabel: config.label,
    };

    await db.post.create({
      data: {
        userId,
        content,
        postType: 'welcome',
        mediaUrls: [JSON.stringify(welcomeMeta)],
        hashtags,
        teamTag: teamTag || null,
        isBreaking: false,
      },
    });
  } catch (e: any) {
    console.error(`Failed to create welcome post for ${name}:`, e.message);
  }
}

// ─── Seed a single team ────────────────────────────────
export async function seedTeam(teamData: {
  name: string; shortName?: string; crest?: string; country?: string;
  venue?: string; venueCapacity?: number; founded?: number;
  competition?: string; externalId?: string;
}, result: IngestResult) {
  try {
    const handle = generateHandle(teamData.name);
    const email = generateEmail(teamData.name, 'team');
    const initials = (teamData.shortName || teamData.name).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3);

    const existing = await db.user.findFirst({ where: { OR: [{ handle }, { email }] } });
    if (existing) { result.teamsSkipped++; result.logs.push(`Team ${teamData.name} already exists`); return; }

    const city = teamData.venue ? teamData.venue.split(',')[0]?.trim() : '';
    const country = teamData.country || 'Unknown';
    const hashtags = generateHashtags(teamData.name, teamData.competition);

    const user = await db.user.create({
      data: {
        name: teamData.shortName || teamData.name, email, handle,
        passwordHash: null, emailVerified: false,
        avatarUrl: teamData.crest || null, avatarInitials: initials,
        role: 'team', isPro: true, isVerified: false,
        roleId: TEAM_ROLE_ID, roleTypeId: PRO_CLUB_TYPE_ID,
        roleData: { sport: 'football', league: teamData.competition || '', claimed: false, seeded: true, source: 'football-data-org', externalId: teamData.externalId },
        nationality: country, countryOfOrigin: country, currentCountry: country, city,
        bio: `${teamData.name} - Official SportSphere profile. This account is unclaimed and managed by SportSphere AI.`,
        coverGradient: 'from-blue-700 to-blue-900',
      },
    });

    // Create TeamProfile
    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "TeamProfile" ("userId", "nickname", "stadium", "capacity", "foundedYear", "city", "country", "league", "division", "colors", "matchesPlayed", "wins", "draws", "losses", "goalsFor", "goalsAgainst", "points", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0, 0, 0, 0, 0, 0, NOW(), NOW())
      `, user.id, teamData.shortName || teamData.name, teamData.venue || null, teamData.venueCapacity || null, teamData.founded ? String(teamData.founded) : null, city, country, teamData.competition || '', '1st', JSON.stringify([]));
    } catch (e: any) { result.logs.push(`TeamProfile for ${teamData.name}: ${e.message?.slice(0, 80)}`); }

    try { await db.userSport.create({ data: { userId: user.id, sportId: FOOTBALL_SPORT_ID } }); } catch {}

    // Auto welcome post
    await createWelcomePost(user.id, 'team', teamData.name, `Based in ${city || country}`, hashtags, teamData.shortName || teamData.name);

    // Update post count on user
    await db.user.update({ where: { id: user.id }, data: { postCount: 1 } });

    result.teamsCreated++;
    result.logs.push(`Created team + welcome post: ${teamData.name} (@${handle})`);
  } catch (err: any) {
    result.errors.push(`seedTeam(${teamData.name}): ${err.message}`);
  }
}

// ─── Seed a single player ─────────────────────────────
export async function seedPlayer(playerData: {
  name: string; position?: string; nationality?: string; photo?: string;
  teamName?: string; teamId?: string; externalId?: string; dateOfBirth?: string;
}, result: IngestResult) {
  try {
    const handle = generateHandle(playerData.name);
    const email = generateEmail(playerData.name, 'player');
    const parts = playerData.name.split(' ');
    const initials = (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();

    const existing = await db.user.findFirst({ where: { OR: [{ handle }, { email }] } });
    if (existing) { result.playersSkipped++; result.logs.push(`Player ${playerData.name} already exists`); return; }

    let playerRoleId = '', playerTypeId = '';
    try {
      const playerRole = await db.role.findFirst({ where: { slug: 'player' } });
      if (playerRole) { playerRoleId = playerRole.id; const pType = await db.roleType.findFirst({ where: { roleId: playerRole.id } }); if (pType) playerTypeId = pType.id; }
    } catch {}

    const hashtags = generateHashtags(playerData.teamName || playerData.name, undefined, playerData.position);

    const user = await db.user.create({
      data: {
        name: playerData.name, email, handle,
        passwordHash: null, emailVerified: false,
        avatarUrl: playerData.photo || null, avatarInitials: initials,
        role: 'player', isPro: true, isVerified: false,
        roleId: playerRoleId || 'player-default-role', roleTypeId: playerTypeId || 'player-default-type',
        roleData: { sport: 'football', claimed: false, seeded: true, source: 'football-data-org', externalId: playerData.externalId, teamName: playerData.teamName },
        nationality: playerData.nationality || null,
        dateOfBirth: playerData.dateOfBirth ? new Date(playerData.dateOfBirth) : null,
        bio: `${playerData.name} - ${playerData.position || 'Footballer'}${playerData.teamName ? ' | ' + playerData.teamName : ''}. Unclaimed profile - contact admin to claim.`,
        coverGradient: 'from-emerald-600 to-emerald-900',
      },
    });

    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "PlayerProfile" ("userId", "position", "nationality", "dateOfBirth", "currentClub", "appearances", "goals", "assists", "yellowCards", "redCards", "cleanSheets", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 0, 0, 0, 0, NOW(), NOW())
      `, user.id, playerData.position || null, playerData.nationality || null, playerData.dateOfBirth ? new Date(playerData.dateOfBirth) : null, playerData.teamName || null);
    } catch (e: any) { result.logs.push(`PlayerProfile: ${e.message?.slice(0, 80)}`); }

    try { await db.userSport.create({ data: { userId: user.id, sportId: FOOTBALL_SPORT_ID } }); } catch {}

    // Auto welcome post
    const extra = playerData.position ? `${playerData.position}` : '';
    const teamExtra = playerData.teamName ? `Currently at ${playerData.teamName}` : '';
    await createWelcomePost(user.id, 'player', playerData.name, [extra, teamExtra].filter(Boolean).join('. '), hashtags, playerData.teamName);
    await db.user.update({ where: { id: user.id }, data: { postCount: 1 } });

    result.playersCreated++;
    result.logs.push(`Created player + welcome post: ${playerData.name} (@${handle})`);
  } catch (err: any) {
    result.errors.push(`seedPlayer(${playerData.name}): ${err.message}`);
  }
}

// ─── Seed a single coach ────────────────────────────────
export async function seedCoach(coachData: {
  name: string; nationality?: string; photo?: string;
  teamName?: string; teamId?: string; externalId?: string; dateOfBirth?: string;
}, result: IngestResult) {
  try {
    const handle = generateHandle(coachData.name);
    const email = generateEmail(coachData.name, 'coach');
    const parts = coachData.name.split(' ');
    const initials = (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();

    const existing = await db.user.findFirst({ where: { OR: [{ handle }, { email }] } });
    if (existing) { result.coachesSkipped++; result.logs.push(`Coach ${coachData.name} already exists`); return; }

    let coachRoleId = '', coachTypeId = '';
    try {
      const coachRole = await db.role.findFirst({ where: { slug: 'coach' } });
      if (coachRole) { coachRoleId = coachRole.id; const cType = await db.roleType.findFirst({ where: { roleId: coachRole.id } }); if (cType) coachTypeId = cType.id; }
    } catch {}

    const hashtags = generateHashtags(coachData.teamName || coachData.name);

    const user = await db.user.create({
      data: {
        name: coachData.name, email, handle,
        passwordHash: null, emailVerified: false,
        avatarUrl: coachData.photo || null, avatarInitials: initials,
        role: 'coach', isPro: true, isVerified: false,
        roleId: coachRoleId || 'coach-default-role', roleTypeId: coachTypeId || 'coach-default-type',
        roleData: { sport: 'football', claimed: false, seeded: true, source: 'football-data-org', externalId: coachData.externalId, teamName: coachData.teamName },
        nationality: coachData.nationality || null,
        dateOfBirth: coachData.dateOfBirth ? new Date(coachData.dateOfBirth) : null,
        bio: `${coachData.name} - Head Coach${coachData.teamName ? ' | ' + coachData.teamName : ''}. Unclaimed profile - contact admin to claim.`,
        coverGradient: 'from-purple-600 to-purple-900',
      },
    });

    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "CoachProfile" ("userId", "coachingRole", "currentTeam", "nationality", "dateOfBirth", "matchesManaged", "wins", "draws", "losses", "trophiesWon", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 0, 0, NOW(), NOW())
      `, user.id, 'Head Coach', coachData.teamName || null, coachData.nationality || null, coachData.dateOfBirth ? new Date(coachData.dateOfBirth) : null);
    } catch (e: any) { result.logs.push(`CoachProfile: ${e.message?.slice(0, 80)}`); }

    try { await db.userSport.create({ data: { userId: user.id, sportId: FOOTBALL_SPORT_ID } }); } catch {}

    // Auto welcome post
    const extra = coachData.teamName ? `Currently managing ${coachData.teamName}` : '';
    await createWelcomePost(user.id, 'coach', coachData.name, extra, hashtags, coachData.teamName);
    await db.user.update({ where: { id: user.id }, data: { postCount: 1 } });

    result.coachesCreated++;
    result.logs.push(`Created coach + welcome post: ${coachData.name} (@${handle})`);
  } catch (err: any) {
    result.errors.push(`seedCoach(${coachData.name}): ${err.message}`);
  }
}

// ─── Full competition ingest ──────────────────────────
export async function ingestCompetition(competitionCode: string): Promise<IngestResult> {
  const provider = new FootballDataOrgProvider();
  const result: IngestResult = { teamsCreated: 0, teamsSkipped: 0, playersCreated: 0, playersSkipped: 0, coachesCreated: 0, coachesSkipped: 0, errors: [], logs: [] };

  const teams = await provider.getTeams('football', { league: competitionCode });
  result.logs.push(`Found ${teams.length} teams in ${competitionCode}`);

  const competitions = await provider.getCompetitions('football');
  const comp = competitions.find(c => c.id === competitionCode);
  const compName = comp?.name || competitionCode;

  for (const team of teams) {
    await seedTeam({ name: team.name, shortName: team.name, crest: team.logo, country: team.country, venue: team.venue, competition: compName, externalId: team.id }, result);

    try {
      const squad = await provider.getSquad(team.id);
      if (squad.coach) {
        await seedCoach({ name: squad.coach.name, nationality: squad.coach.nationality, photo: squad.coach.photo, teamName: team.name, teamId: team.id, externalId: squad.coach.id, dateOfBirth: squad.coach.dateOfBirth }, result);
      }
      for (const player of squad.players) {
        await seedPlayer({ name: player.name, position: player.position, nationality: player.nationality, photo: player.photo, teamName: team.name, teamId: team.id, externalId: player.id }, result);
      }
      await new Promise(r => setTimeout(r, 6500));
    } catch (err: any) {
      result.errors.push(`Squad for ${team.name}: ${err.message}`);
    }
  }
  return result;
}