// ─── Phase 4 Backfill: roleProfile JSON → typed tables ─────────
//
// Run AFTER applying migration `20260809_phase4_typed_role_profiles`:
//
//   npx tsx prisma/backfill-typed-profiles.ts
//
// For every User with a custom role (player, coach, team, scout,
// journalist, creator, analyst, commentator, agent, organization,
// competition, league, academy, venue, business, commercial-partner,
// community), this script:
//   1. Reads their `roleProfile` JSON column
//   2. Coerces each field to the right column type
//   3. Upserts a row into the matching typed table (PlayerProfile etc.)
//
// Idempotent — uses upsert. Re-running is safe and won't clobber
// fields that have since been edited in the typed table.
//
// The legacy `roleProfile` JSON column is NOT cleared — it stays as
// a backup. Future API writes go to the typed table for custom roles.

import { PrismaClient } from '@prisma/client';
import { safeJsonParse } from '../src/lib/json';

const db = new PrismaClient();

// ─── Coercion helpers (mirror of src/lib/typed-profiles.ts) ────
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
  if (typeof v === 'string') return v.split(',').map(x => x.trim()).filter(Boolean);
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

const TYPED_ROLES = new Set([
  'player', 'coach', 'team', 'scout', 'journalist', 'creator', 'analyst',
  'commentator', 'agent', 'organization', 'competition', 'league',
  'academy', 'venue', 'business', 'commercial-partner', 'community',
]);

async function main() {
  console.log('─── Phase 4 Backfill: roleProfile JSON → typed tables ───\n');

  const users = await db.user.findMany({
    where: { role: { in: Array.from(TYPED_ROLES) } },
    select: { id: true, name: true, handle: true, role: true, roleProfile: true },
  });

  console.log(`Found ${users.length} user(s) with custom roles.\n`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const u of users) {
    const data = safeJsonParse<Record<string, unknown>>(u.roleProfile as string | object | null, {});
    const keys = Object.keys(data);
    if (keys.length === 0) {
      console.log(`  SKIP  ${u.role.padEnd(20)} @${u.handle}  (empty roleProfile)`);
      skipped++;
      continue;
    }

    try {
      switch (u.role) {
        case 'player':
          await db.playerProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
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
            update: {}, // Don't overwrite — typed table may have newer data
          });
          break;

        case 'coach':
          await db.coachProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
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
            },
            update: {},
          });
          break;

        case 'team':
          await db.teamProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              nickname: s(data.nickname), foundedYear: s(data.foundedYear),
              country: s(data.country), city: s(data.city), stadium: s(data.stadium),
              capacity: n(data.capacity), league: s(data.league), division: s(data.division),
              coach: s(data.coach), owner: s(data.owner), colors: s(data.colors),
              matchesPlayed: n(data.matchesPlayed), wins: n(data.wins), draws: n(data.draws),
              losses: n(data.losses), goalsFor: n(data.goalsFor), goalsAgainst: n(data.goalsAgainst),
              points: n(data.points), position: s(data.position), form: s(data.form),
              squad: s(data.squad), achievements: s(data.achievements),
              historicPlayers: s(data.historicPlayers), historicCoaches: s(data.historicCoaches),
            },
            update: {},
          });
          break;

        case 'scout':
          await db.scoutProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
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
            },
            update: {},
          });
          break;

        case 'journalist':
          await db.journalistProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              publication: s(data.publication), beat: s(data.beat),
              location: s(data.location), yearsActive: n(data.yearsActive),
              languages: arr(data.languages), coverage: arr(data.coverage),
              articleCount: n(data.articleCount), exclusives: n(data.exclusives),
              interviews: n(data.interviews), breakingNews: n(data.breakingNews),
              totalViews: s(data.totalViews), pressCredentials: s(data.pressCredentials),
              articles: s(data.articles),
            },
            update: {},
          });
          break;

        case 'creator':
          await db.creatorProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              creatorType: s(data.creatorType), platforms: arr(data.platforms),
              niche: s(data.niche), audienceLocation: s(data.audienceLocation),
              audienceAgeRange: s(data.audienceAgeRange), audienceGender: s(data.audienceGender),
              languages: arr(data.languages), followers: s(data.followers),
              engagementRate: n(data.engagementRate), avgViews: s(data.avgViews),
              reach: s(data.reach), postsPerWeek: n(data.postsPerWeek),
              topContent: s(data.topContent), brandCollabs: s(data.brandCollabs),
              bookingEmail: s(data.bookingEmail),
            },
            update: {},
          });
          break;

        case 'analyst':
          await db.analystProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              analystType: s(data.analystType), organization: s(data.organization),
              expertise: arr(data.expertise),
              reportsPublished: n(data.reportsPublished), modelsCreated: n(data.modelsCreated),
              teamsAnalyzed: n(data.teamsAnalyzed), playersAnalyzed: n(data.playersAnalyzed),
              topModels: s(data.topModels), predictions: s(data.predictions),
            },
            update: {},
          });
          break;

        case 'commentator':
          await db.commentatorProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              commentatorType: s(data.commentatorType), broadcaster: s(data.broadcaster),
              languages: arr(data.languages), sports: arr(data.sports),
              yearsActive: n(data.yearsActive),
              matchesCovered: n(data.matchesCovered), competitions: n(data.competitions),
              countries: n(data.countries),
              majorEvents: s(data.majorEvents), matchLog: s(data.matchLog),
            },
            update: {},
          });
          break;

        case 'agent':
          await db.agentProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
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
            },
            update: {},
          });
          break;

        case 'organization':
          await db.organizationProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              orgType: s(data.orgType), country: s(data.country),
              headquarters: s(data.headquarters), foundedYear: s(data.foundedYear),
              leadership: s(data.leadership), departments: s(data.departments),
              affiliates: s(data.affiliates), competitions: s(data.competitions),
              programs: s(data.programs),
            },
            update: {},
          });
          break;

        case 'competition':
          await db.competitionProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              competitionName: s(data.competitionName), season: s(data.season),
              organizer: s(data.organizer), country: s(data.country),
              level: s(data.level), format: s(data.format),
              participants: n(data.participants), topScorer: s(data.topScorer),
              topAssists: s(data.topAssists),
              standings: s(data.standings), fixtures: s(data.fixtures),
              previousWinners: s(data.previousWinners), records: s(data.records),
              bracket: s(data.bracket),
            },
            update: {},
          });
          break;

        case 'league':
          await db.leagueProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
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
            },
            update: {},
          });
          break;

        case 'academy':
          await db.academyProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              academyName: s(data.academyName), parentOrg: s(data.parentOrg),
              location: s(data.location), foundedYear: s(data.foundedYear),
              director: s(data.director),
              programs: arr(data.programs), curriculum: s(data.curriculum),
              playersDeveloped: n(data.playersDeveloped),
              playersPromoted: n(data.playersPromoted),
              proGraduates: n(data.proGraduates), scholarships: n(data.scholarships),
              graduates: s(data.graduates),
            },
            update: {},
          });
          break;

        case 'venue':
          await db.venueProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              venueName: s(data.venueName), venueType: s(data.venueType),
              location: s(data.location), capacity: n(data.capacity),
              surface: s(data.surface), opened: s(data.opened),
              owner: s(data.owner), operator: s(data.operator),
              facilities: arr(data.facilities), tenants: s(data.tenants),
              upcomingEvents: s(data.upcomingEvents),
            },
            update: {},
          });
          break;

        case 'business':
          await db.businessProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              companyName: s(data.companyName), industry: s(data.industry),
              foundedYear: s(data.foundedYear), headquarters: s(data.headquarters),
              website: s(data.website), employees: n(data.employees),
              products: s(data.products),
              partnerTeams: s(data.partnerTeams), partnerAthletes: s(data.partnerAthletes),
              sponsorships: s(data.sponsorships), campaigns: s(data.campaigns),
            },
            update: {},
          });
          break;

        case 'commercial-partner':
          await db.commercialPartnerProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
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
            },
            update: {},
          });
          break;

        case 'community':
          await db.communityProfile.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              communityName: s(data.communityName), communityType: s(data.communityType),
              foundedYear: s(data.foundedYear), location: s(data.location),
              supportedTeam: s(data.supportedTeam), description: s(data.description),
              memberCount: n(data.memberCount), activeMembers: n(data.activeMembers),
              eventCount: n(data.eventCount), postCount: n(data.postCount),
              events: s(data.events), rules: s(data.rules),
            },
            update: {},
          });
          break;
      }
      console.log(`  OK    ${u.role.padEnd(20)} @${u.handle}  (${keys.length} fields)`);
      processed++;
    } catch (err) {
      console.log(`  FAIL  ${u.role.padEnd(20)} @${u.handle}  — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n─── Backfill complete ───`);
  console.log(`Processed: ${processed}`);
  console.log(`Skipped:   ${skipped} (empty roleProfile)`);
  console.log(`Failed:    ${failed}`);
  console.log(`Total:     ${users.length}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error('Backfill failed:', e);
    await db.$disconnect();
    process.exit(1);
  });
