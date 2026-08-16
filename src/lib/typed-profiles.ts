// ─── Typed Role Profile Adapter ─────────────────────────────────
//
// Phase 4 — bridges the new typed profile tables (PlayerProfile,
// CoachProfile, … CommunityProfile) to the existing renderer layer
// that reads `roleProfile` as `Record<string, unknown>` via
// `rpString` / `rpNumber` / `rpArray` helpers.
//
// Strategy:
//   - Custom roles → data lives in typed table (PlayerProfile etc.)
//   - Generic roles → data still lives in `User.roleProfile` JSON
//   - API layer calls `attachTypedProfile(user)` before returning,
//     which fetches the matching typed row (if any) and exposes it
//     as `user.<role>Profile` for the renderer.
//   - Renderers call `getRoleProfile(apiUser, role)` which returns
//     the typed row as a plain Record (for custom roles) or falls
//     back to the JSON blob (for generic roles).
//   - Writes go through `saveTypedProfile(role, userId, data)`.

import { db } from './db';
import { safeJsonParse } from './json';

// ─── The 17 custom roles that have typed tables ────────────────
export const TYPED_PROFILE_ROLES = new Set<string>([
  'player', 'coach', 'team', 'scout', 'journalist', 'creator', 'analyst',
  'commentator', 'agent', 'organization', 'competition', 'league',
  'academy', 'venue', 'business', 'commercial-partner', 'community',
]);

export function isTypedProfileRole(role: string | null | undefined): boolean {
  return !!role && TYPED_PROFILE_ROLES.has(role);
}

// ─── Role slug → Prisma relation name on User ──────────────────
const RELATION_MAP: Record<string, string> = {
  player:             'playerProfile',
  coach:              'coachProfile',
  team:               'teamProfile',
  scout:              'scoutProfile',
  journalist:         'journalistProfile',
  creator:            'creatorProfile',
  analyst:            'analystProfile',
  commentator:        'commentatorProfile',
  agent:              'agentProfile',
  organization:       'organizationProfile',
  competition:        'competitionProfile',
  league:             'leagueProfile',
  academy:            'academyProfile',
  venue:              'venueProfile',
  business:           'businessProfile',
  'commercial-partner': 'commercialPartnerProfile',
  community:          'communityProfile',
};

export function getRelationName(role: string): string | null {
  return RELATION_MAP[role] || null;
}

// ─── Build a Prisma `include` object for a role ────────────────
// Returns `{ playerProfile: true }` for a player, `{}` for a fan.
export function includeTypedProfile(role: string | null | undefined): Record<string, true> {
  if (!role) return {};
  const rel = getRelationName(role);
  return rel ? { [rel]: true } : {};
}

// ─── Convert a typed row (from Prisma) into a plain Record ─────
// Strips relational/meta fields and normalizes Date → ISO string
// so the renderer's rpString/rpNumber/rpArray helpers work
// transparently.
export function typedRowToRecord(row: Record<string, unknown> | null): Record<string, unknown> {
  if (!row) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === 'userId' || k === 'createdAt' || k === 'updatedAt' || k === 'user') continue;
    if (v === null || v === undefined) continue;
    if (v instanceof Date) out[k] = v.toISOString();
    else out[k] = v;
  }
  return out;
}

// ─── Attach the typed profile (as a plain Record) to a user ────
// Mutates `user` by setting `user.<role>Profile = Record`. Called
// by the API layer after fetching a user. Returns the same user.
//
// For custom roles: reads the typed row from the matching table.
// For generic roles: leaves `user.roleProfile` JSON untouched.
export async function attachTypedProfile<T extends { role: string; id: string }>(
  user: T
): Promise<T & { typedProfile?: Record<string, unknown> }> {
  if (!isTypedProfileRole(user.role)) return user;
  const row = await fetchTypedRow(user.role, user.id);
  return Object.assign(user, { typedProfile: typedRowToRecord(row) }) as T & { typedProfile?: Record<string, unknown> };
}

// Internal: dispatch to the right Prisma model based on role.
// Returns the raw typed row (with userId, createdAt, etc.) or null.
async function fetchTypedRow(role: string, userId: string): Promise<Record<string, unknown> | null> {
  switch (role) {
    case 'player':             return db.playerProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'coach':              return db.coachProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'team':               return db.teamProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'scout':              return db.scoutProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'journalist':         return db.journalistProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'creator':            return db.creatorProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'analyst':            return db.analystProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'commentator':        return db.commentatorProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'agent':              return db.agentProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'organization':       return db.organizationProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'competition':        return db.competitionProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'league':             return db.leagueProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'academy':            return db.academyProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'venue':              return db.venueProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'business':           return db.businessProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'commercial-partner': return db.commercialPartnerProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    case 'community':          return db.communityProfile.findUnique({ where: { userId } }) as unknown as Promise<Record<string, unknown> | null>;
    default: return null;
  }
}

// Batch variant: attaches typed profiles for a list of users in a
// single round-trip per role. Useful for list endpoints.
export async function attachTypedProfiles<T extends { role: string; id: string }>(
  users: T[]
): Promise<Array<T & { typedProfile?: Record<string, unknown> }>> {
  if (users.length === 0) return users;
  // Group user IDs by role
  const byRole = new Map<string, string[]>();
  for (const u of users) {
    if (!isTypedProfileRole(u.role)) continue;
    const ids = byRole.get(u.role) || [];
    ids.push(u.id);
    byRole.set(u.role, ids);
  }
  if (byRole.size === 0) return users;

  // For each role, fetch all matching typed rows
  const cache = new Map<string, Record<string, unknown>>(); // key: `${role}:${userId}`
  for (const [role, ids] of byRole) {
    const rows = await fetchTypedRowsForRole(role, ids);
    for (const row of rows) {
      const uid = row.userId as string;
      cache.set(`${role}:${uid}`, typedRowToRecord(row));
    }
  }

  // Merge into users
  return users.map(u => {
    const typed = cache.get(`${u.role}:${u.id}`);
    return typed ? { ...u, typedProfile: typed } : u;
  });
}

// Internal: batch fetch typed rows for a single role.
async function fetchTypedRowsForRole(role: string, userIds: string[]): Promise<Record<string, unknown>[]> {
  switch (role) {
    case 'player':             return db.playerProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'coach':              return db.coachProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'team':               return db.teamProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'scout':              return db.scoutProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'journalist':         return db.journalistProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'creator':            return db.creatorProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'analyst':            return db.analystProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'commentator':        return db.commentatorProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'agent':              return db.agentProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'organization':       return db.organizationProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'competition':        return db.competitionProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'league':             return db.leagueProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'academy':            return db.academyProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'venue':              return db.venueProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'business':           return db.businessProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'commercial-partner': return db.commercialPartnerProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    case 'community':          return db.communityProfile.findMany({ where: { userId: { in: userIds } } }) as unknown as Promise<Record<string, unknown>[]>;
    default: return [];
  }
}

// ─── Save a Record-shaped profile to the typed table ───────────
// Dispatches based on role. Caller passes a Record (the same shape
// that came in via the API request body's `roleProfile` field).
// Coerces values to the right column types:
//   - String?  → string | null
//   - Float?   → number | null
//   - String[] → string[] | []
//   - DateTime? → Date | null
export async function saveTypedProfile(
  role: string,
  userId: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!isTypedProfileRole(role)) return;
  switch (role) {
    case 'player':             return upsertPlayer(userId, data);
    case 'coach':              return upsertCoach(userId, data);
    case 'team':               return upsertTeam(userId, data);
    case 'scout':              return upsertScout(userId, data);
    case 'journalist':         return upsertJournalist(userId, data);
    case 'creator':            return upsertCreator(userId, data);
    case 'analyst':            return upsertAnalyst(userId, data);
    case 'commentator':        return upsertCommentator(userId, data);
    case 'agent':              return upsertAgent(userId, data);
    case 'organization':       return upsertOrganization(userId, data);
    case 'competition':        return upsertCompetition(userId, data);
    case 'league':             return upsertLeague(userId, data);
    case 'academy':            return upsertAcademy(userId, data);
    case 'venue':              return upsertVenue(userId, data);
    case 'business':           return upsertBusiness(userId, data);
    case 'commercial-partner': return upsertCommercialPartner(userId, data);
    case 'community':          return upsertCommunity(userId, data);
  }
}

// ─── Coercion helpers ──────────────────────────────────────────
function s(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return String(v);
  return null;
}
function n(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;
  if (typeof v === 'string') {
    const x = parseFloat(v);
    return isNaN(x) ? null : x;
  }
  return null;
}
function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(x => typeof x === 'string').map(x => x as string);
  if (typeof v === 'string') {
    // Some legacy JSON stored chips as comma-separated strings
    return v.split(',').map(x => x.trim()).filter(Boolean);
  }
  return [];
}
function d(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string') {
    const dt = new Date(v);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

// ─── Per-role upserts ──────────────────────────────────────────
// Each function builds a typed object from the Record and calls
// `db.<model>.upsert(...)`. We use the typed Prisma client (no raw
// SQL) for writes — type safety on the way in.

async function upsertPlayer(userId: string, data: Record<string, unknown>) {
  await db.playerProfile.upsert({
    where: { userId },
    create: {
      userId,
      position: s(data.position), secondaryPosition: s(data.secondaryPosition),
      preferredFoot: s(data.preferredFoot), jerseyNumber: s(data.jerseyNumber),
      height: n(data.height), weight: n(data.weight),
      dateOfBirth: d(data.dateOfBirth), nationality: s(data.nationality),
      playerType: s(data.playerType), careerStatus: s(data.careerStatus),
      appearances: n(data.appearances), starts: n(data.starts), minutes: n(data.minutes),
      goals: n(data.goals), assists: n(data.assists),
      yellowCards: n(data.yellowCards), redCards: n(data.redCards),
      rating: n(data.rating), motm: n(data.motm),
      passAccuracy: n(data.passAccuracy), chancesCreated: n(data.chancesCreated),
      shots: n(data.shots), shotsOnTarget: n(data.shotsOnTarget),
      tackles: n(data.tackles), interceptions: n(data.interceptions),
      duelsWon: n(data.duelsWon), aerialDuels: n(data.aerialDuels),
      cleanSheets: n(data.cleanSheets), saves: n(data.saves), savePct: n(data.savePct),
      goalsConceded: n(data.goalsConceded), penaltiesSaved: n(data.penaltiesSaved),
      currentClub: s(data.currentClub), contractUntil: s(data.contractUntil),
      contractStatus: s(data.contractStatus), academy: s(data.academy),
      debutYear: s(data.debutYear), nationalTeam: s(data.nationalTeam),
      internationalCaps: n(data.internationalCaps), internationalGoals: n(data.internationalGoals),
      transferHistory: s(data.transferHistory), marketValue: s(data.marketValue),
      playingStyle: s(data.playingStyle), strengths: arr(data.strengths),
      weaknesses: arr(data.weaknesses), injuryHistory: s(data.injuryHistory),
      form: s(data.form), ranking: s(data.ranking),
    },
    update: {
      position: s(data.position), secondaryPosition: s(data.secondaryPosition),
      preferredFoot: s(data.preferredFoot), jerseyNumber: s(data.jerseyNumber),
      height: n(data.height), weight: n(data.weight),
      dateOfBirth: d(data.dateOfBirth), nationality: s(data.nationality),
      playerType: s(data.playerType), careerStatus: s(data.careerStatus),
      appearances: n(data.appearances), starts: n(data.starts), minutes: n(data.minutes),
      goals: n(data.goals), assists: n(data.assists),
      yellowCards: n(data.yellowCards), redCards: n(data.redCards),
      rating: n(data.rating), motm: n(data.motm),
      passAccuracy: n(data.passAccuracy), chancesCreated: n(data.chancesCreated),
      shots: n(data.shots), shotsOnTarget: n(data.shotsOnTarget),
      tackles: n(data.tackles), interceptions: n(data.interceptions),
      duelsWon: n(data.duelsWon), aerialDuels: n(data.aerialDuels),
      cleanSheets: n(data.cleanSheets), saves: n(data.saves), savePct: n(data.savePct),
      goalsConceded: n(data.goalsConceded), penaltiesSaved: n(data.penaltiesSaved),
      currentClub: s(data.currentClub), contractUntil: s(data.contractUntil),
      contractStatus: s(data.contractStatus), academy: s(data.academy),
      debutYear: s(data.debutYear), nationalTeam: s(data.nationalTeam),
      internationalCaps: n(data.internationalCaps), internationalGoals: n(data.internationalGoals),
      transferHistory: s(data.transferHistory), marketValue: s(data.marketValue),
      playingStyle: s(data.playingStyle), strengths: arr(data.strengths),
      weaknesses: arr(data.weaknesses), injuryHistory: s(data.injuryHistory),
      form: s(data.form), ranking: s(data.ranking),
    },
  });
}

async function upsertCoach(userId: string, data: Record<string, unknown>) {
  const payload = {
    coachingRole: s(data.coachingRole), currentTeam: s(data.currentTeam),
    license: s(data.license), licenseFederation: s(data.licenseFederation),
    nationality: s(data.nationality), dateOfBirth: d(data.dateOfBirth),
    yearsCoaching: n(data.yearsCoaching),
    matchesManaged: n(data.matchesManaged), wins: n(data.wins), draws: n(data.draws),
    losses: n(data.losses), goalsFor: n(data.goalsFor), goalsAgainst: n(data.goalsAgainst),
    cleanSheets: n(data.cleanSheets), pointsPerGame: n(data.pointsPerGame),
    trophiesWon: n(data.trophiesWon),
    preferredFormation: s(data.preferredFormation),
    alternateFormations: arr(data.alternateFormations),
    playingPhilosophy: s(data.playingPhilosophy),
    pressingStyle: s(data.pressingStyle), possessionStyle: s(data.possessionStyle),
    defensiveApproach: s(data.defensiveApproach), buildUpStyle: s(data.buildUpStyle),
    previousClubs: s(data.previousClubs), nationalTeams: s(data.nationalTeams),
    academyExperience: s(data.academyExperience), playingCareer: s(data.playingCareer),
  };
  await db.coachProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertTeam(userId: string, data: Record<string, unknown>) {
  const payload = {
    nickname: s(data.nickname), foundedYear: s(data.foundedYear),
    country: s(data.country), city: s(data.city), stadium: s(data.stadium),
    capacity: n(data.capacity), league: s(data.league), division: s(data.division),
    coach: s(data.coach), owner: s(data.owner), colors: s(data.colors),
    matchesPlayed: n(data.matchesPlayed), wins: n(data.wins), draws: n(data.draws),
    losses: n(data.losses), goalsFor: n(data.goalsFor), goalsAgainst: n(data.goalsAgainst),
    points: n(data.points), position: s(data.position), form: s(data.form),
    squad: s(data.squad), achievements: s(data.achievements),
    historicPlayers: s(data.historicPlayers), historicCoaches: s(data.historicCoaches),
  };
  await db.teamProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertScout(userId: string, data: Record<string, unknown>) {
  const payload = {
    scoutType: s(data.scoutType), organization: s(data.organization),
    geographicCoverage: s(data.geographicCoverage),
    sportsCovered: arr(data.sportsCovered),
    yearsExperience: n(data.yearsExperience),
    specialization: s(data.specialization),
    playersDiscovered: n(data.playersDiscovered),
    playersRecommended: n(data.playersRecommended),
    successfulSignings: n(data.successfulSignings),
    countriesCovered: n(data.countriesCovered),
    competitionsMonitored: n(data.competitionsMonitored),
    scoutingBoard: s(data.scoutingBoard),
  };
  await db.scoutProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertJournalist(userId: string, data: Record<string, unknown>) {
  const payload = {
    publication: s(data.publication), beat: s(data.beat),
    location: s(data.location), yearsActive: n(data.yearsActive),
    languages: arr(data.languages), coverage: arr(data.coverage),
    articleCount: n(data.articleCount), exclusives: n(data.exclusives),
    interviews: n(data.interviews), breakingNews: n(data.breakingNews),
    totalViews: s(data.totalViews), pressCredentials: s(data.pressCredentials),
    articles: s(data.articles),
  };
  await db.journalistProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertCreator(userId: string, data: Record<string, unknown>) {
  const payload = {
    creatorType: s(data.creatorType), platforms: arr(data.platforms),
    niche: s(data.niche), audienceLocation: s(data.audienceLocation),
    audienceAgeRange: s(data.audienceAgeRange), audienceGender: s(data.audienceGender),
    languages: arr(data.languages), followers: s(data.followers),
    engagementRate: n(data.engagementRate), avgViews: s(data.avgViews),
    reach: s(data.reach), postsPerWeek: n(data.postsPerWeek),
    topContent: s(data.topContent), brandCollabs: s(data.brandCollabs),
    bookingEmail: s(data.bookingEmail),
  };
  await db.creatorProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertAnalyst(userId: string, data: Record<string, unknown>) {
  const payload = {
    analystType: s(data.analystType), organization: s(data.organization),
    expertise: arr(data.expertise),
    reportsPublished: n(data.reportsPublished), modelsCreated: n(data.modelsCreated),
    teamsAnalyzed: n(data.teamsAnalyzed), playersAnalyzed: n(data.playersAnalyzed),
    topModels: s(data.topModels), predictions: s(data.predictions),
  };
  await db.analystProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertCommentator(userId: string, data: Record<string, unknown>) {
  const payload = {
    commentatorType: s(data.commentatorType), broadcaster: s(data.broadcaster),
    languages: arr(data.languages), sports: arr(data.sports),
    yearsActive: n(data.yearsActive),
    matchesCovered: n(data.matchesCovered), competitions: n(data.competitions),
    countries: n(data.countries),
    majorEvents: s(data.majorEvents), matchLog: s(data.matchLog),
  };
  await db.commentatorProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertAgent(userId: string, data: Record<string, unknown>) {
  const payload = {
    agentType: s(data.agentType), agency: s(data.agency),
    license: s(data.license), federation: s(data.federation),
    countries: arr(data.countries),
    playersRepresented: n(data.playersRepresented),
    coachesRepresented: n(data.coachesRepresented),
    transfersCompleted: n(data.transfersCompleted),
    totalTransferValue: s(data.totalTransferValue),
    activeNegotiations: n(data.activeNegotiations),
    contractsManaged: n(data.contractsManaged),
    clientRoster: s(data.clientRoster),
  };
  await db.agentProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertOrganization(userId: string, data: Record<string, unknown>) {
  const payload = {
    orgType: s(data.orgType), country: s(data.country),
    headquarters: s(data.headquarters), foundedYear: s(data.foundedYear),
    leadership: s(data.leadership), departments: s(data.departments),
    affiliates: s(data.affiliates), competitions: s(data.competitions),
    programs: s(data.programs),
  };
  await db.organizationProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertCompetition(userId: string, data: Record<string, unknown>) {
  const payload = {
    competitionName: s(data.competitionName), season: s(data.season),
    organizer: s(data.organizer), country: s(data.country),
    level: s(data.level), format: s(data.format),
    participants: n(data.participants), topScorer: s(data.topScorer),
    topAssists: s(data.topAssists),
    standings: s(data.standings), fixtures: s(data.fixtures),
    previousWinners: s(data.previousWinners), records: s(data.records),
    bracket: s(data.bracket),
  };
  await db.competitionProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertLeague(userId: string, data: Record<string, unknown>) {
  const payload = {
    leagueName: s(data.leagueName), country: s(data.country),
    division: s(data.division), organizer: s(data.organizer),
    foundedYear: s(data.foundedYear), currentSeason: s(data.currentSeason),
    teams: n(data.teams), matchdays: n(data.matchdays),
    topScorer: s(data.topScorer), topAssists: s(data.topAssists),
    avgGoals: n(data.avgGoals), avgAttendance: n(data.avgAttendance),
    allTimeTopScorer: s(data.allTimeTopScorer),
    allTimeTopAppearances: s(data.allTimeTopAppearances),
    standings: s(data.standings), fixtures: s(data.fixtures),
    champions: s(data.champions), previousChampions: s(data.previousChampions),
  };
  await db.leagueProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertAcademy(userId: string, data: Record<string, unknown>) {
  const payload = {
    academyName: s(data.academyName), parentOrg: s(data.parentOrg),
    location: s(data.location), foundedYear: s(data.foundedYear),
    director: s(data.director),
    programs: arr(data.programs), curriculum: s(data.curriculum),
    playersDeveloped: n(data.playersDeveloped),
    playersPromoted: n(data.playersPromoted),
    proGraduates: n(data.proGraduates), scholarships: n(data.scholarships),
    graduates: s(data.graduates),
  };
  await db.academyProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertVenue(userId: string, data: Record<string, unknown>) {
  const payload = {
    venueName: s(data.venueName), venueType: s(data.venueType),
    location: s(data.location), capacity: n(data.capacity),
    surface: s(data.surface), opened: s(data.opened),
    owner: s(data.owner), operator: s(data.operator),
    facilities: arr(data.facilities), tenants: s(data.tenants),
    upcomingEvents: s(data.upcomingEvents),
  };
  await db.venueProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertBusiness(userId: string, data: Record<string, unknown>) {
  const payload = {
    companyName: s(data.companyName), industry: s(data.industry),
    foundedYear: s(data.foundedYear), headquarters: s(data.headquarters),
    website: s(data.website), employees: n(data.employees),
    products: s(data.products),
    partnerTeams: s(data.partnerTeams), partnerAthletes: s(data.partnerAthletes),
    sponsorships: s(data.sponsorships), campaigns: s(data.campaigns),
  };
  await db.businessProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertCommercialPartner(userId: string, data: Record<string, unknown>) {
  const payload = {
    partnerType: s(data.partnerType), brand: s(data.brand),
    sportsCategory: s(data.sportsCategory),
    partnershipStatus: s(data.partnershipStatus),
    foundedYear: s(data.foundedYear), headquarters: s(data.headquarters),
    website: s(data.website),
    sponsoredTeams: s(data.sponsoredTeams),
    sponsoredPlayers: s(data.sponsoredPlayers),
    sponsoredCompetitions: s(data.sponsoredCompetitions),
    sponsoredEvents: s(data.sponsoredEvents),
    activeCampaigns: s(data.activeCampaigns),
  };
  await db.commercialPartnerProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

async function upsertCommunity(userId: string, data: Record<string, unknown>) {
  const payload = {
    communityName: s(data.communityName), communityType: s(data.communityType),
    foundedYear: s(data.foundedYear), location: s(data.location),
    supportedTeam: s(data.supportedTeam), description: s(data.description),
    memberCount: n(data.memberCount), activeMembers: n(data.activeMembers),
    eventCount: n(data.eventCount), postCount: n(data.postCount),
    events: s(data.events), rules: s(data.rules),
  };
  await db.communityProfile.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
}

// ─── Convenience: read the typed profile as a Record ───────────
// Single-row fetch. Used by API endpoints that already have a user
// and want to merge the typed profile into the response shape.
export async function fetchTypedProfileRecord(
  role: string,
  userId: string
): Promise<Record<string, unknown>> {
  if (!isTypedProfileRole(role)) return {};
  const row = await fetchTypedRow(role, userId);
  return typedRowToRecord(row);
}

// ─── Helper for parse-on-read APIs ─────────────────────────────
// Given a user fetched from the DB (which may or may not have a
// typed profile attached), returns the roleProfile-shaped Record
// the renderer expects. For custom roles: prefers typed table,
// falls back to JSON blob. For generic roles: returns JSON blob.
export async function resolveRoleProfile<T extends { role: string; id: string; roleProfile?: unknown }>(
  user: T
): Promise<Record<string, unknown>> {
  if (isTypedProfileRole(user.role)) {
    const typed = await fetchTypedProfileRecord(user.role, user.id);
    if (Object.keys(typed).length > 0) return typed;
    // Fall back to legacy JSON if typed row doesn't exist yet
  }
  return safeJsonParse(user.roleProfile as string | object | null, {});
}
