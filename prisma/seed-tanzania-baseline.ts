/**
 * seed-tanzania-baseline.ts
 *
 * SportSphere Tanzania — Clean Baseline Seed
 *
 * Strategy:
 *   1. BACKUP  — Snapshot admin users, admin roles to JSON
 *   2. CLEAN   — Delete all sports/content data (preserve auth + admin infrastructure)
 *   3. SEED    — Insert real Tanzania sports, leagues, teams
 *   4. LOCATIONS — Seed Tanzania geography (regions + cities)
 *   5. VERIFY  — Count all tables
 *
 * Preserved (NOT deleted):
 *   - Role, RoleType (system roles)
 *   - AdminRole, UserAdminRole (admin access)
 *   - KPIConfiguration, KPIWeight (performance engine config)
 *   - _prisma_migrations (schema history)
 *   - AuditLog, DelegationLog (audit trail)
 *
 * Usage:
 *   npx tsx prisma/seed-tanzania-baseline.ts
 *
 * Idempotent — safe to re-run.
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import path from 'path';

const db = new PrismaClient();

// ─── Config ──────────────────────────────────────────────────────────

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `tanzania-baseline-backup-${Date.now()}.json`);

// Tables to CLEAN (sports/content data — ordered by dependencies)
const CLEAN_TABLES = [
  // Social / user-generated content
  'CommentLike', 'Comment', 'PostLike', 'PollVote', 'Poll', 'Post',
  'Prediction', 'LeaderboardEntry', 'Follow', 'CommunityMember',
  'Community', 'Message', 'Notification', 'UserFavorite', 'UserSport',
  // Performance engine data
  'PerformanceSnapshot', 'PerformancePointTransaction',
  'PerformanceVerification', 'PerformanceAnomaly', 'PerformanceEvent',
  'PerformanceProfile',
  // AI / claims
  'AIJobLog', 'ClaimRequest', 'PlayerTransfer',
  // Business links
  'BusinessCoach', 'BusinessPlayer', 'BusinessTeam',
  // Sports content
  'Rumor', 'NewsItem', 'MatchProfile', 'Match',
  'Coach', 'Player', 'Team', 'League', 'Business',
  // Typed profiles
  'PlayerProfile', 'CoachProfile', 'TeamProfile', 'ScoutProfile',
  'JournalistProfile', 'CreatorProfile', 'AnalystProfile',
  'CommentatorProfile', 'AgentProfile', 'OrganizationProfile',
  'CompetitionProfile', 'LeagueProfile', 'AcademyProfile',
  'VenueProfile', 'BusinessProfile', 'CommercialPartnerProfile',
  'CommunityProfile',
  // Locations (will be re-seeded)
  'Location',
  // Verification / tokens
  'VerificationRequest', 'PushToken',
  // Ranking
  'RankingHistory', 'RankingCategory',
] as const;

// ─── Tanzania Sports ────────────────────────────────────────────────

const TANZANIA_SPORTS = [
  {
    name: 'Football', slug: 'football', icon: '\u26BD', category: 'team',
    sportType: 'team_sport', format: '11v11', contactType: 'full_contact',
    olympicStatus: 'yes',
    description: 'Association football \u2014 the most popular sport in Tanzania. Governed by TFF, with the Vodacom Premier League as the top domestic competition.',
    tags: ['popular', 'tanzania', 'team', 'outdoor'], displayOrder: 1,
  },
  {
    name: 'Basketball', slug: 'basketball', icon: '\uD83C\uDFC0', category: 'team',
    sportType: 'team_sport', format: '5v5', contactType: 'limited_contact',
    olympicStatus: 'yes',
    description: 'Basketball growing rapidly in Tanzania, with the National Basketball League and regional competitions across Dar es Salaam, Mwanza, and Arusha.',
    tags: ['popular', 'tanzania', 'team', 'indoor'], displayOrder: 2,
  },
  {
    name: 'Athletics', slug: 'athletics', icon: '\uD83C\uDFC3', category: 'individual',
    sportType: 'individual', format: 'individual_and_relay', contactType: 'non_contact',
    olympicStatus: 'yes',
    description: 'Track and field athletics \u2014 Tanzania has produced world-class long-distance runners and marathon athletes competing internationally.',
    tags: ['tanzania', 'individual', 'outdoor', 'olympic'], displayOrder: 3,
  },
  {
    name: 'Boxing', slug: 'boxing', icon: '\uD83E\uDD4A', category: 'individual',
    sportType: 'combat', format: 'individual', contactType: 'full_contact',
    olympicStatus: 'yes',
    description: 'Boxing has a strong tradition in Tanzania with notable fighters. Professional and amateur boxing continues to develop nationally.',
    tags: ['tanzania', 'individual', 'combat', 'olympic'], displayOrder: 4,
  },
  {
    name: 'Volleyball', slug: 'volleyball', icon: '\uD83C\uDFD0', category: 'team',
    sportType: 'team_sport', format: '6v6', contactType: 'non_contact',
    olympicStatus: 'yes',
    description: 'Volleyball widely played across Tanzania in schools, universities, and community leagues. Both indoor and beach volleyball are popular.',
    tags: ['tanzania', 'team', 'indoor', 'beach', 'olympic'], displayOrder: 5,
  },
  {
    name: 'Netball', slug: 'netball', icon: '\uD83C\uDFAF', category: 'team',
    sportType: 'team_sport', format: '7v7', contactType: 'non_contact',
    olympicStatus: 'commonwealth',
    description: 'Netball is one of the most popular women\u2019s sports in Tanzania, with the Taifa Queens representing the country internationally.',
    tags: ['tanzania', 'team', 'women', 'indoor', 'commonwealth'], displayOrder: 6,
  },
  {
    name: 'Rugby', slug: 'rugby', icon: '\uD83C\uDFC9', category: 'team',
    sportType: 'team_sport', format: '15v15', contactType: 'full_contact',
    olympicStatus: 'sevens_olympic',
    description: 'Rugby is developing in Tanzania with the national team, Twigas, competing in regional African tournaments. Both XVs and Sevens are played.',
    tags: ['tanzania', 'team', 'outdoor', 'contact', 'rugby'], displayOrder: 7,
  },
];

// ─── Tanzania Competitions ───────────────────────────────────────────

const TANZANIA_COMPETITIONS = [
  {
    name: 'Vodacom Premier League', slug: 'vodacom-premier-league',
    country: 'Tanzania', countryCode: 'TZ', type: 'league',
    description: 'Top-tier professional football league in Tanzania, featuring 16 teams. Sponsored by Vodacom Tanzania.',
    sportSlug: 'football', season: '2025/2026',
  },
  {
    name: 'NBC Premier League', slug: 'nbc-premier-league',
    country: 'Tanzania', countryCode: 'TZ', type: 'league',
    description: 'First Division football league in Tanzania, serving as a pathway to the Vodacom Premier League.',
    sportSlug: 'football', season: '2025/2026',
  },
  {
    name: 'Azam Sports Federation Cup', slug: 'azam-federation-cup',
    country: 'Tanzania', countryCode: 'TZ', type: 'cup',
    description: 'National knockout cup competition for Tanzanian football clubs.',
    sportSlug: 'football', season: '2025/2026',
  },
  {
    name: 'Community Shield', slug: 'community-shield',
    country: 'Tanzania', countryCode: 'TZ', type: 'cup',
    description: 'Annual super cup match between the Premier League champions and FA Cup winners.',
    sportSlug: 'football',
  },
  {
    name: 'Kagame Interclub Cup', slug: 'kagame-interclub-cup',
    country: 'East Africa', countryCode: 'EA', type: 'cup',
    description: 'Regional East African club competition for champions from Tanzania, Kenya, Uganda, Rwanda, Burundi, and South Sudan.',
    sportSlug: 'football',
  },
  {
    name: 'National Basketball League', slug: 'national-basketball-league',
    country: 'Tanzania', countryCode: 'TZ', type: 'league',
    description: 'Top basketball league in Tanzania with teams from Dar es Salaam, Mwanza, Arusha, and other regions.',
    sportSlug: 'basketball', season: '2025',
  },
  {
    name: 'National Volleyball League', slug: 'national-volleyball-league',
    country: 'Tanzania', countryCode: 'TZ', type: 'league',
    description: 'Premier volleyball competition in Tanzania for both men and women.',
    sportSlug: 'volleyball', season: '2025',
  },
  {
    name: 'National Netball League', slug: 'national-netball-league',
    country: 'Tanzania', countryCode: 'TZ', type: 'league',
    description: 'Top domestic netball competition feeding players into the national team, Taifa Queens.',
    sportSlug: 'netball', season: '2025',
  },
  {
    name: 'National Rugby League', slug: 'national-rugby-league',
    country: 'Tanzania', countryCode: 'TZ', type: 'league',
    description: 'Domestic rugby union competition featuring clubs from across Tanzania.',
    sportSlug: 'rugby', season: '2025',
  },
];

// ─── Tanzanian Football Teams ───────────────────────────────────────

const TANZANIA_TEAMS = [
  // Vodacom Premier League
  {
    name: 'Simba SC', slug: 'simba-sc', shortName: 'SIM',
    city: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 1936, venue: 'Benjamin Mkapa National Stadium',
    description: 'One of the two biggest football clubs in Tanzania, based in Dar es Salaam. 22-time league champions.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Young Africans SC', slug: 'young-africans-sc', shortName: 'Yanga',
    city: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 1935, venue: 'Benjamin Mkapa National Stadium',
    description: 'The most decorated football club in Tanzania with 29+ league titles. Based in Dar es Salaam.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Azam FC', slug: 'azam-fc', shortName: 'AZAM',
    city: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2007, venue: 'Azam Complex Stadium',
    description: 'Modern professional football club based in Chamazi, Dar es Salaam. Strong youth development.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'KMC FC', slug: 'kmc-fc', shortName: 'KMC',
    city: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 1964, venue: 'Uhuru Stadium',
    description: 'Historic Dar es Salaam club competing in the Premier League.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Tanzania Prisons SC', slug: 'tanzania-prisons-sc', shortName: 'Prisons',
    city: 'Mbeya', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 1965, venue: 'Sokoine Stadium',
    description: 'Prisons football club based in Mbeya, Southern Highlands region.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Namungo FC', slug: 'namungo-fc', shortName: 'Namungo',
    city: 'Lindi', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2017, venue: 'Nangwanda Sijaona Stadium',
    description: 'Rising Premier League club based in Lindi region.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Mtibwa Sugar FC', slug: 'mtibwa-sugar-fc', shortName: 'Mtibwa',
    city: 'Morogoro', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 1998, venue: 'Jamhuri Stadium',
    description: 'Football club based in Morogoro, associated with Mtibwa Sugar Estate.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Kagera Sugar FC', slug: 'kagera-sugar-fc', shortName: 'Kagera',
    city: 'Bukoba', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2001, venue: 'Kagera Stadium',
    description: 'Football club based in Bukoba, Kagera region, northwestern Tanzania.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Biashara United', slug: 'biashara-united', shortName: 'Biashara',
    city: 'Mwanza', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 1998, venue: 'CCM Kirumba Stadium',
    description: 'Football club based in Mwanza, the second-largest city in Tanzania.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Singida Big Stars FC', slug: 'singida-big-stars-fc', shortName: 'Singida',
    city: 'Singida', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2020, venue: 'Singida Municipal Stadium',
    description: 'Emerging football club from Singida region competing in the Premier League.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Pamba Jiji FC', slug: 'pamba-jiji-fc', shortName: 'Pamba',
    city: 'Mwanza', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 1970, venue: 'CCK Stadium',
    description: 'Historic Mwanza-based club competing in Tanzanian top-flight football.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Dodoma Jiji FC', slug: 'dodoma-jiji-fc', shortName: 'Dodoma',
    city: 'Dodoma', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2017, venue: 'Jamhuri Stadium',
    description: 'Dodoma-based football club representing the capital city of Tanzania.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Coastal Union FC', slug: 'coastal-union-fc', shortName: 'Coastal',
    city: 'Tanga', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 1950, venue: 'Mkwakwani Stadium',
    description: 'Historic football club from Tanga, one of the oldest clubs in Tanzania.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'JKT Tanzania FC', slug: 'jkt-tanzania-fc', shortName: 'JKT',
    city: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 1970, venue: 'Uhuru Stadium',
    description: 'JKT (National Service) football team based in Dar es Salaam.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'GMC FC', slug: 'gmc-fc', shortName: 'GMC',
    city: 'Geita', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2018, venue: 'Geita Stadium',
    description: 'Football club from Geita region, representing the gold-mining area of Tanzania.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  {
    name: 'Kipanga FC', slug: 'kipanga-fc', shortName: 'Kipanga',
    city: 'Zanzibar', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2022, venue: 'Amaan Stadium',
    description: 'Newly promoted club from Zanzibar competing in the mainland Premier League.',
    leagueSlug: 'vodacom-premier-league', sportSlug: 'football',
  },
  // Basketball
  {
    name: 'ABC Giants', slug: 'abc-giants', shortName: 'Giants',
    city: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2010, venue: 'National Indoor Stadium',
    description: 'Top basketball team in Dar es Salaam, multiple National Basketball League titles.',
    leagueSlug: 'national-basketball-league', sportSlug: 'basketball',
  },
  {
    name: 'Don Bosco Lions', slug: 'don-bosco-lions', shortName: 'Lions',
    city: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2005, venue: 'Don Bosco Gymnasium',
    description: 'Established basketball club from Dar es Salaam competing in the national league.',
    leagueSlug: 'national-basketball-league', sportSlug: 'basketball',
  },
  {
    name: 'Arusha Pacers', slug: 'arusha-pacers', shortName: 'Pacers',
    city: 'Arusha', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2012, venue: 'Sheikh Amri Abeid Stadium',
    description: 'Arusha-based basketball team, representing the Northern Circuit.',
    leagueSlug: 'national-basketball-league', sportSlug: 'basketball',
  },
  {
    name: 'Mwanza Titans', slug: 'mwanza-titans', shortName: 'Titans',
    city: 'Mwanza', country: 'Tanzania', countryCode: 'TZ',
    foundedYear: 2015, venue: 'CCK Indoor Arena',
    description: 'Basketball club from Mwanza, Lake Zone representatives.',
    leagueSlug: 'national-basketball-league', sportSlug: 'basketball',
  },
];

// ─── Generate prefix search tokens ──────────────────────────────────

function generateTokens(name: string): string[] {
  const lower = name.toLowerCase();
  const tokens: string[] = [lower];
  for (let i = 1; i < lower.length; i++) {
    tokens.push(lower.slice(0, i));
  }
  return tokens;
}

// ─── Step 1: Backup ─────────────────────────────────────────────────

async function backupData() {
  console.log('\n  STEP 1: BACKUP \u2014 Snapshotting admin infrastructure...\n');

  const backup: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    adminRoles: await db.adminRole.findMany(),
    userAdminRoles: await db.userAdminRole.findMany(),
    roles: await db.role.findMany({ include: { types: true } }),
    kpiConfigs: await db.kPIConfiguration.findMany(),
    kpiWeights: await db.kPIWeight.findMany(),
    users: await db.user.findMany({
      where: { OR: [
        { verificationStatus: 'verified' },
        { role: { in: ['administrator', 'admin', 'moderator'] } },
      ]},
    }),
  };

  try {
    const { mkdirSync } = await import('fs');
    mkdirSync(BACKUP_DIR, { recursive: true });
  } catch { /* already exists */ }

  writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  console.log(`  Backup saved to: ${BACKUP_FILE}`);
  console.log(`    AdminRoles: ${(backup.adminRoles as unknown[])?.length || 0}`);
  console.log(`    Roles: ${(backup.roles as unknown[])?.length || 0}`);
  console.log(`    KPI Configs: ${(backup.kpiConfigs as unknown[])?.length || 0}`);
  console.log(`    Admin Users: ${(backup.users as unknown[])?.length || 0}`);
}

// ─── Step 2: Clean ──────────────────────────────────────────────────

async function cleanData() {
  console.log('\n  STEP 2: CLEAN \u2014 Removing all sports/content data...\n');

  for (const table of CLEAN_TABLES) {
    try {
      const modelName = table as 'post';
      // @ts-expect-error dynamic deleteMany
      const result = await (db[modelName] as { deleteMany: () => Promise<{ count: number }> }).deleteMany();
      console.log(`  [DEL] ${table}: ${result.count} rows`);
    } catch (err) {
      console.log(`  [SKIP] ${table}: ${((err as Error).message || '').slice(0, 60)}`);
    }
  }

  // Clean ONLY fake seeded entity accounts (team/player/coach accounts with @sportssphere.fun emails)
  // NEVER delete real fan users or manually registered accounts
  const fakeEntityUsers = await db.user.deleteMany({
    where: {
      AND: [
        { role: { in: ['team', 'player', 'coach', 'competition', 'league'] } },
        { email: { endsWith: '@sportssphere.fun' } },
      ],
    },
  });
  console.log(`  [DEL] User (fake entity accounts @sportssphere.fun): ${fakeEntityUsers.count} rows`);

  // NOTE: Real fan users are NEVER touched by this seed script
}

// ─── Step 3: Seed Sports ────────────────────────────────────────────

async function seedSports() {
  console.log('\n  STEP 3: SEED \u2014 Tanzania sports...\n');

  await db.sport.deleteMany();
  console.log('  Cleared existing sports');

  for (const sport of TANZANIA_SPORTS) {
    await db.sport.create({ data: sport });
    console.log(`  [+] ${sport.icon} ${sport.name}`);
  }
  console.log(`\n  Seeded ${TANZANIA_SPORTS.length} Tanzania sports`);
}

// ─── Step 4: Seed Competitions ───────────────────────────────────────

async function seedCompetitions() {
  console.log('\n  STEP 4: SEED \u2014 Tanzania competitions/leagues...\n');

  for (const comp of TANZANIA_COMPETITIONS) {
    const sport = await db.sport.findUnique({ where: { slug: comp.sportSlug } });
    if (!sport) {
      console.log(`  [SKIP] ${comp.name} \u2014 sport ${comp.sportSlug} not found`);
      continue;
    }

    await db.league.create({
      data: {
        id: `league-${comp.slug}`,
        name: comp.name,
        slug: comp.slug,
        country: comp.country,
        countryCode: comp.countryCode,
        type: comp.type,
        description: comp.description,
        season: comp.season || null,
        sportId: sport.id,
        verified: true,
        source: 'manual',
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log(`  [+] ${comp.name} (${comp.type})`);
  }
  console.log(`\n  Seeded ${TANZANIA_COMPETITIONS.length} competitions`);
}

// ─── Step 5: Seed Teams ──────────────────────────────────────────────

async function seedTeams() {
  console.log('\n  STEP 5: SEED \u2014 Tanzania teams...\n');

  for (const team of TANZANIA_TEAMS) {
    const sport = await db.sport.findUnique({ where: { slug: team.sportSlug } });
    const league = await db.league.findUnique({ where: { slug: team.leagueSlug } });
    if (!sport || !league) {
      console.log(`  [SKIP] ${team.name} \u2014 missing sport or league`);
      continue;
    }

    await db.team.create({
      data: {
        id: `team-${team.slug}`,
        name: team.name,
        slug: team.slug,
        shortName: team.shortName,
        city: team.city,
        country: team.country,
        countryCode: team.countryCode,
        venue: team.venue || null,
        foundedYear: team.foundedYear,
        description: team.description,
        sportId: sport.id,
        leagueId: league.id,
        verified: true,
        source: 'manual',
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log(`  [+] ${team.name} (${team.city})`);
  }
  console.log(`\n  Seeded ${TANZANIA_TEAMS.length} teams`);
}

// ─── Step 6: Seed Locations ──────────────────────────────────────────

async function seedLocations() {
  console.log('\n  STEP 6: SEED \u2014 Tanzania locations...\n');

  await db.location.deleteMany();

  // Tanzania country
  const tanzania = await db.location.create({
    data: {
      name: 'Tanzania', nameLower: 'tanzania', type: 'country', countryCode: 'TZ',
      latitude: -6.369, longitude: 34.888, population: 65497748, isPopular: true,
      displayLabel: 'Tanzania', searchTokens: generateTokens('Tanzania'),
    },
  });
  console.log(`  [+] Country: Tanzania`);

  // 31 regions
  const regions = [
    'Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Mbeya', 'Morogoro',
    'Tanga', 'Zanzibar Urban/West', 'Zanzibar North', 'Zanzibar South',
    'Kilimanjaro', 'Iringa', 'Kagera', 'Kigoma', 'Lindi',
    'Mara', 'Mtwara', 'Pwani', 'Rukwa', 'Ruvuma',
    'Shinyanga', 'Singida', 'Tabora', 'Geita', 'Katavi',
    'Kaskazini Pemba', 'Kusini Pemba', 'Kaskazini Unguja', 'Kusini Unguja',
    'Mjini Magharibi', 'Simiyu', 'Njombe', 'Songwe',
  ];

  for (const region of regions) {
    await db.location.create({
      data: {
        name: region, nameLower: region.toLowerCase(), type: 'region',
        parentId: tanzania.id, countryCode: 'TZ',
        displayLabel: `${region}, Tanzania`,
        searchTokens: generateTokens(region),
      },
    });
  }
  console.log(`  [+] Regions: ${regions.length}`);

  // Major cities
  const cities: Array<{ name: string; region: string; lat: number; lng: number; pop?: number; popular?: boolean }> = [
    { name: 'Dar es Salaam', region: 'Dar es Salaam', lat: -6.7924, lng: 39.2083, pop: 6500000, popular: true },
    { name: 'Dodoma', region: 'Dodoma', lat: -6.1630, lng: 35.7516, pop: 410000, popular: true },
    { name: 'Mwanza', region: 'Mwanza', lat: -2.5164, lng: 32.9175, pop: 850000, popular: true },
    { name: 'Arusha', region: 'Arusha', lat: -3.3869, lng: 36.6830, pop: 600000, popular: true },
    { name: 'Mbeya', region: 'Mbeya', lat: -8.9306, lng: 33.4592, pop: 430000 },
    { name: 'Morogoro', region: 'Morogoro', lat: -6.8250, lng: 37.6625, pop: 380000 },
    { name: 'Tanga', region: 'Tanga', lat: -5.0828, lng: 39.2775, pop: 340000 },
    { name: 'Zanzibar City', region: 'Zanzibar Urban/West', lat: -6.1659, lng: 39.1990, pop: 250000, popular: true },
    { name: 'Moshi', region: 'Kilimanjaro', lat: -3.3400, lng: 37.3400, pop: 220000 },
    { name: 'Iringa', region: 'Iringa', lat: -7.7700, lng: 35.7000, pop: 160000 },
    { name: 'Bukoba', region: 'Kagera', lat: -1.3317, lng: 31.8122, pop: 120000 },
    { name: 'Kigoma', region: 'Kigoma', lat: -4.8764, lng: 29.6278, pop: 110000 },
    { name: 'Singida', region: 'Singida', lat: -4.9386, lng: 34.7500, pop: 100000 },
    { name: 'Lindi', region: 'Lindi', lat: -8.8500, lng: 39.7167, pop: 85000 },
    { name: 'Mtwara', region: 'Mtwara', lat: -10.2733, lng: 40.1833, pop: 110000 },
    { name: 'Geita', region: 'Geita', lat: -2.8667, lng: 32.1667, pop: 95000 },
    { name: 'Shinyanga', region: 'Shinyanga', lat: -3.6667, lng: 33.4333, pop: 120000 },
    { name: 'Tabora', region: 'Tabora', lat: -5.0167, lng: 32.8000, pop: 150000 },
    { name: 'Kahama', region: 'Shinyanga', lat: -3.8333, lng: 32.6000, pop: 100000 },
    { name: 'Songea', region: 'Ruvuma', lat: -10.6833, lng: 35.6667, pop: 80000 },
  ];

  const regionRecords = await db.location.findMany({ where: { type: 'region', parentId: tanzania.id } });
  const regionMap = new Map(regionRecords.map(r => [r.name, r.id]));

  for (const city of cities) {
    const regionId = regionMap.get(city.region);
    if (!regionId) { console.log(`  [SKIP] ${city.name} - region ${city.region} not found`); continue; }

    await db.location.create({
      data: {
        name: city.name, nameLower: city.name.toLowerCase(), type: 'city',
        parentId: regionId, countryCode: 'TZ',
        latitude: city.lat, longitude: city.lng,
        population: city.pop || null,
        isPopular: city.popular || false,
        displayLabel: `${city.name}, ${city.region}, Tanzania`,
        searchTokens: generateTokens(city.name),
      },
    });
  }
  console.log(`  [+] Cities: ${cities.length}`);

  // Neighboring countries
  const neighbors = [
    { name: 'Kenya', code: 'KE', lat: -0.0236, lng: 37.9062 },
    { name: 'Uganda', code: 'UG', lat: 1.3733, lng: 32.2903 },
    { name: 'Rwanda', code: 'RW', lat: -1.9403, lng: 29.8739 },
    { name: 'Burundi', code: 'BI', lat: -3.3731, lng: 29.9184 },
    { name: 'DR Congo', code: 'CD', lat: -4.0383, lng: 21.7587 },
    { name: 'Malawi', code: 'MW', lat: -13.2543, lng: 34.3015 },
    { name: 'Zambia', code: 'ZM', lat: -13.1339, lng: 27.8493 },
    { name: 'Mozambique', code: 'MZ', lat: -18.6657, lng: 35.5296 },
    { name: 'Somalia', code: 'SO', lat: 5.1501, lng: 46.1999 },
    { name: 'Ethiopia', code: 'ET', lat: 9.1450, lng: 40.4897 },
  ];

  for (const c of neighbors) {
    await db.location.create({
      data: {
        name: c.name, nameLower: c.name.toLowerCase(), type: 'country',
        countryCode: c.code, latitude: c.lat, longitude: c.lng,
        displayLabel: c.name, searchTokens: generateTokens(c.name),
      },
    });
  }
  console.log(`  [+] Neighboring countries: ${neighbors.length}`);

  console.log(`\n  Total locations: ${1 + regions.length + cities.length + neighbors.length}`);
}

// ─── Step 7: Verify ──────────────────────────────────────────────────

async function verify() {
  console.log('\n  STEP 7: VERIFY \u2014 Final state...\n');

  const checks: Array<[string, Promise<number>]> = [
    ['Sports', db.sport.count()],
    ['Competitions', db.league.count()],
    ['Teams', db.team.count()],
    ['Players', db.player.count()],
    ['Matches', db.match.count()],
    ['Users', db.user.count()],
    ['Roles', db.role.count()],
    ['AdminRoles', db.adminRole.count()],
    ['AdminUsers', db.userAdminRole.count()],
    ['Posts', db.post.count()],
    ['Locations', db.location.count()],
    ['KPI Configs', db.kPIConfiguration.count()],
  ];

  for (const [name, countP] of checks) {
    const count = await countP;
    const icon = count > 0 ? '[OK]' : '[--]';
    console.log(`  ${icon} ${name}: ${count}`);
  }

  console.log('\n  Tanzania Baseline Complete!');
  console.log('    7 core sports');
  console.log('    Real Tanzanian competitions');
  console.log('    Authentic Tanzanian teams');
  console.log('    Full location hierarchy');
  console.log('    Admin infrastructure preserved');
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('===================================================');
  console.log('  SportSphere Tanzania - Clean Baseline Seed');
  console.log('  DATABASE > BACKUP > CLEAN > SEED > VERIFY');
  console.log('===================================================');

  await backupData();
  await cleanData();
  await seedSports();
  await seedCompetitions();
  await seedTeams();
  await seedLocations();
  await verify();
}

main()
  .catch((e) => { console.error('FATAL:', e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
