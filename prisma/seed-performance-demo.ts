import { PrismaClient } from '@prisma/client';
import { recordPerformanceEvent, recomputeRankings, runDailySnapshot } from '../WebApp/src/lib/performance-engine/persistence';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Performance Demo Data...');

  // 1. Get Role IDs
  const playerRole = await prisma.role.findUnique({ where: { slug: 'player' } });
  const coachRole = await prisma.role.findUnique({ where: { slug: 'coach' } });
  const teamRole = await prisma.role.findUnique({ where: { slug: 'team' } });

  if (!playerRole || !coachRole || !teamRole) {
    console.error('❌ Roles not found. Run npx tsx prisma/seed.ts first.');
    return;
  }

  const proType = await prisma.roleType.findFirst({ where: { slug: 'professional' } });
  const headCoachType = await prisma.roleType.findFirst({ where: { slug: 'head-coach' } });
  const proClubType = await prisma.roleType.findFirst({ where: { slug: 'professional-club' } });

  // 2. Create Demo Users
  console.log('👤 Creating demo users...');

  // Player: Juma Shaban (Forward)
  const player = await prisma.user.upsert({
    where: { handle: '@jumashaban' },
    update: {},
    create: {
      name: 'Juma Shaban',
      handle: '@jumashaban',
      email: 'juma@example.com',
      role: 'player',
      roleId: playerRole.id,
      roleTypeId: proType?.id ?? '',
      isVerified: true,
      isPro: true,
      verificationStatus: 'verified',
      currentCountry: 'Tanzania',
      playerProfile: {
        create: {
          position: 'FWD',
          playerType: 'Professional',
          currentClub: 'Simba SC',
          nationality: 'Tanzanian',
        }
      }
    }
  });

  // Coach: Miguel Gamondi
  const coach = await prisma.user.upsert({
    where: { handle: '@gamondi' },
    update: {},
    create: {
      name: 'Miguel Gamondi',
      handle: '@gamondi',
      email: 'gamondi@example.com',
      role: 'coach',
      roleId: coachRole.id,
      roleTypeId: headCoachType?.id ?? '',
      isVerified: true,
      isPro: true,
      verificationStatus: 'verified',
      currentCountry: 'Tanzania',
      coachProfile: {
        create: {
          coachingRole: 'Head Coach',
          currentTeam: 'Young Africans SC',
          license: 'UEFA Pro',
        }
      }
    }
  });

  // Team: Simba SC
  const team = await prisma.user.upsert({
    where: { handle: '@simbasc' },
    update: {},
    create: {
      name: 'Simba SC',
      handle: '@simbasc',
      email: 'info@simbasc.co.tz',
      role: 'team',
      roleId: teamRole.id,
      roleTypeId: proClubType?.id ?? '',
      isVerified: true,
      isPro: true,
      verificationStatus: 'verified',
      currentCountry: 'Tanzania',
      teamProfile: {
        create: {
          nickname: 'Wekundu wa Msimbazi',
          foundedYear: '1936',
          stadium: 'Benjamin Mkapa Stadium',
          league: 'Tanzania Premier League',
        }
      }
    }
  });

  // 3. Record Performance Events
  console.log('📊 Recording performance events...');

  const today = new Date();
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Events for Player (Juma Shaban)
  await recordPerformanceEvent({
    userId: player.id,
    eventType: 'goal',
    kpiKey: 'goals',
    value: 1,
    competition: 'Tanzania Premier League',
    competitionTier: 'pro',
    opponentName: 'Azam FC',
    matchDate: lastWeek,
    source: 'official'
  });

  await recordPerformanceEvent({
    userId: player.id,
    eventType: 'assist',
    kpiKey: 'assists',
    value: 2,
    competition: 'Tanzania Premier League',
    competitionTier: 'pro',
    opponentName: 'Singida FG',
    matchDate: twoWeeksAgo,
    source: 'official'
  });

  await recordPerformanceEvent({
    userId: player.id,
    eventType: 'motm',
    kpiKey: 'motm',
    value: 1,
    competition: 'CAF Champions League',
    competitionTier: 'pro',
    opponentName: 'Al Ahly',
    matchDate: today,
    source: 'official'
  });

  // Events for Coach (Gamondi)
  await recordPerformanceEvent({
    userId: coach.id,
    eventType: 'match-win',
    kpiKey: 'wins',
    value: 1,
    competition: 'Tanzania Premier League',
    competitionTier: 'pro',
    opponentName: 'Coastal Union',
    matchDate: lastWeek,
    source: 'official'
  });

  // Events for Team (Simba SC)
  await recordPerformanceEvent({
    userId: team.id,
    eventType: 'match-win',
    kpiKey: 'points',
    value: 3,
    competition: 'Tanzania Premier League',
    competitionTier: 'pro',
    opponentName: 'Mashujaa FC',
    matchDate: lastWeek,
    source: 'official'
  });

  // 4. Create Historical Snapshots (for trends)
  console.log('📸 Creating trend snapshots...');

  // Yesterday's snapshot
  await prisma.performanceSnapshot.createMany({
    data: [
      {
        userId: player.id,
        capturedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        performanceScore: 65.5,
        totalPoints: 120,
        formScore: 70,
        consistencyScore: 80,
        tier: 'B',
        period: 'daily'
      },
      {
        userId: coach.id,
        capturedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        performanceScore: 78.2,
        totalPoints: 450,
        formScore: 85,
        consistencyScore: 90,
        tier: 'A',
        period: 'daily'
      }
    ]
  });

  // 5. Final Recompute
  console.log('🔄 Recomputing rankings...');
  await recomputeRankings();

  console.log('✅ Performance demo seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
