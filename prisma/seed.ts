import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SportSphere database...');

  // ─── Clean existing data (optional — idempotent upserts below) ──
  // We use deleteMany first then recreate for clean data

  // ─── Users ─────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { handle: '@sportsphere' },
      update: {},
      create: {
        name: 'SportSphere Official', handle: '@sportsphere', email: 'official@sportsphere.com',
        avatarInitials: 'SS', role: 'organization', isVerified: true,
        verificationStatus: 'verified', bio: 'The official SportSphere account. Breaking sports news worldwide.',
        location: 'London, UK', followerCount: 4580000, followingCount: 120, postCount: 2340,
        coverGradient: 'from-emerald-600 via-green-500 to-emerald-900',
        sportsFollowing: JSON.stringify(['Football', 'Basketball', 'Tennis']),
        roleData: JSON.stringify({ type: 'official', category: 'sports-media' }),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@sarahchen' },
      update: {},
      create: {
        name: 'Sarah Chen', handle: '@sarahchen', email: 'sarah@example.com',
        avatarInitials: 'SC', role: 'creator', isVerified: true,
        verificationStatus: 'verified', bio: 'Arsenal season ticket holder. Football photographer.',
        location: 'London, UK', followerCount: 34500, followingCount: 412, postCount: 189,
        coverGradient: 'from-pink-600 via-violet-500 to-purple-900',
        sportsFollowing: JSON.stringify(['Football']),
        roleData: JSON.stringify({ category: 'photography' }),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@footballdaily' },
      update: {},
      create: {
        name: 'Football Daily', handle: '@footballdaily', email: 'news@footballdaily.com',
        avatarInitials: 'FD', role: 'journalist', isVerified: true,
        verificationStatus: 'verified', bio: 'Your daily dose of football news, transfers, and analysis.',
        location: 'Manchester, UK', followerCount: 1200000, followingCount: 89, postCount: 3450,
        coverGradient: 'from-teal-600 via-cyan-500 to-teal-900',
        sportsFollowing: JSON.stringify(['Football']),
        roleData: JSON.stringify({ publication: 'Football Daily', founded: 2020 }),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@marcusj' },
      update: {},
      create: {
        name: 'Marcus Johnson', handle: '@marcusj', email: 'marcus@example.com',
        avatarInitials: 'MJ', role: 'fan', isVerified: false,
        bio: 'Premier League obsessed. Stats nerd. Occasional hot takes.',
        location: 'Lagos, Nigeria', followerCount: 8900, followingCount: 567, postCount: 234,
        coverGradient: 'from-blue-600 via-indigo-500 to-blue-900',
        sportsFollowing: JSON.stringify(['Football', 'Basketball']),
        roleData: JSON.stringify({}),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@goalsdaily' },
      update: {},
      create: {
        name: 'Goal Highlights HD', handle: '@goalsdaily', email: 'goals@highlightshd.com',
        avatarInitials: 'GH', role: 'creator', isVerified: true,
        verificationStatus: 'verified', bio: 'Every goal, every game, every highlight. 4K quality.',
        location: 'Dubai, UAE', followerCount: 2100000, followingCount: 45, postCount: 3800,
        coverGradient: 'from-yellow-600 via-amber-500 to-orange-800',
        sportsFollowing: JSON.stringify(['Football']),
        roleData: JSON.stringify({ category: 'highlights' }),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@gkunion' },
      update: {},
      create: {
        name: 'GK Union', handle: '@gkunion', email: 'gk@union.com',
        avatarInitials: 'GU', role: 'community', isVerified: true,
        verificationStatus: 'verified', bio: 'The goalkeeper community. Saves, tips, and training drills.',
        location: 'Global', followerCount: 67800, followingCount: 234, postCount: 890,
        coverGradient: 'from-lime-600 via-green-500 to-emerald-800',
        sportsFollowing: JSON.stringify(['Football']),
        roleData: JSON.stringify({ topic: 'Goalkeeping' }),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@davidmbaza' },
      update: {},
      create: {
        name: 'David Mbaza', handle: '@davidmbaza', email: 'david@sportsphere.com',
        avatarInitials: 'DM', role: 'fan', isVerified: false,
        bio: 'Football is life. Man Utd till I die. Predictions guru.',
        location: 'Dar es Salaam, Tanzania', followerCount: 1200, followingCount: 345, postCount: 52,
        coverGradient: 'from-red-600 via-red-500 to-red-800',
        sportsFollowing: JSON.stringify(['Football', 'Basketball']),
        roleData: JSON.stringify({}),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@skillzhd' },
      update: {},
      create: {
        name: 'Skillz HD', handle: '@skillzhd', email: 'skillz@example.com',
        avatarInitials: 'SH', role: 'creator', isVerified: true,
        verificationStatus: 'verified', bio: 'Skills, dribbles, free kicks — all in 4K.',
        location: 'Madrid, Spain', followerCount: 890000, followingCount: 23, postCount: 1200,
        coverGradient: 'from-purple-600 via-purple-500 to-purple-900',
        sportsFollowing: JSON.stringify(['Football']),
        roleData: JSON.stringify({ category: 'skills' }),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@techniqueking' },
      update: {},
      create: {
        name: 'Technique King', handle: '@techniqueking', email: 'technique@example.com',
        avatarInitials: 'TK', role: 'analyst', isVerified: true,
        verificationStatus: 'verified', bio: 'Football technique breakdowns and tutorials.',
        location: 'Paris, France', followerCount: 234000, followingCount: 89, postCount: 567,
        coverGradient: 'from-sky-600 via-sky-500 to-blue-900',
        sportsFollowing: JSON.stringify(['Football']),
        roleData: JSON.stringify({ speciality: 'tactical-analysis' }),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@laligahd' },
      update: {},
      create: {
        name: 'LaLiga HD', handle: '@laligahd', email: 'laliga@example.com',
        avatarInitials: 'LH', role: 'creator', isVerified: true,
        verificationStatus: 'verified', bio: 'Official LaLiga highlights and match coverage.',
        location: 'Barcelona, Spain', followerCount: 3400000, followingCount: 34, postCount: 2100,
        coverGradient: 'from-orange-600 via-orange-500 to-red-900',
        sportsFollowing: JSON.stringify(['Football']),
        roleData: JSON.stringify({ league: 'La Liga' }),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@goonercam' },
      update: {},
      create: {
        name: 'Gooner Cam', handle: '@goonercam', email: 'gooner@example.com',
        avatarInitials: 'GC', role: 'creator', isVerified: false,
        bio: 'Arsenal match reactions and fan POV.',
        location: 'London, UK', followerCount: 145000, followingCount: 67, postCount: 456,
        coverGradient: 'from-red-600 via-rose-500 to-rose-900',
        sportsFollowing: JSON.stringify(['Football']),
        roleData: JSON.stringify({}),
      },
    }),
    prisma.user.upsert({
      where: { handle: '@manchesterunited' },
      update: {},
      create: {
        name: 'Manchester United', handle: '@manchesterunited', email: 'manutd@example.com',
        avatarInitials: 'MU', role: 'team', isVerified: true,
        verificationStatus: 'verified', bio: 'Official Manchester United FC. 20x Premier League champions.',
        location: 'Manchester, UK', followerCount: 8900000, followingCount: 12, postCount: 1240,
        coverGradient: 'from-red-700 to-red-900',
        sportsFollowing: JSON.stringify(['Football']),
        roleData: JSON.stringify({ founded: 1878, stadium: 'Old Trafford', league: 'Premier League' }),
      },
    }),
  ]);

  const [ss, sarah, fd, marcus, goals, gku, david, skillz, techKing, laliga, gooner, manutd] = users;
  console.log(`✅ Created ${users.length} users`);

  // ─── Matches ───────────────────────────────────────────────
  const now = new Date();

  // Helper to create kickoff times
  const hrs = (h: number) => new Date(now.getTime() + h * 3600000);
  const ago = (m: number) => new Date(now.getTime() - m * 60000);

  const matches = await Promise.all([
    // ── LIVE matches ──
    prisma.match.upsert({
      where: { id: 'match-mu-ars' },
      update: { minute: 78, homeScore: 2, awayScore: 1 },
      create: {
        id: 'match-mu-ars', league: 'Premier League',
        homeTeam: 'Manchester United', awayTeam: 'Arsenal',
        homeScore: 2, awayScore: 1, status: 'live', minute: 78,
        venue: 'Old Trafford', continent: 'Europe', country: 'England',
        kickoffAt: ago(78),
        events: JSON.stringify([
          { minute: 23, type: 'goal', player: 'Rashford', team: 'home' },
          { minute: 34, type: 'goal', player: 'Saka', team: 'away' },
          { minute: 56, type: 'goal', player: 'Rashford', team: 'home' },
        ]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-rm-barca' },
      update: {},
      create: {
        id: 'match-rm-barca', league: 'La Liga',
        homeTeam: 'Real Madrid', awayTeam: 'Barcelona',
        homeScore: 1, awayScore: 1, status: 'ht', minute: 45,
        venue: 'Santiago Bernabeu', continent: 'Europe', country: 'Spain',
        kickoffAt: ago(45),
        events: JSON.stringify([
          { minute: 18, type: 'goal', player: 'Vinicius Jr', team: 'home' },
          { minute: 38, type: 'goal', player: 'Lewandowski', team: 'away' },
        ]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-inter-milan' },
      update: {},
      create: {
        id: 'match-inter-milan', league: 'Serie A',
        homeTeam: 'Inter Milan', awayTeam: 'AC Milan',
        homeScore: 0, awayScore: 0, status: 'live', minute: 34,
        venue: 'San Siro', continent: 'Europe', country: 'Italy',
        kickoffAt: ago(34),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-nig-cmr' },
      update: {},
      create: {
        id: 'match-nig-cmr', league: 'AFCON',
        homeTeam: 'Nigeria', awayTeam: 'Cameroon',
        homeScore: 1, awayScore: 0, status: 'live', minute: 62,
        venue: 'Stade Olympique', continent: 'Africa', country: 'Africa',
        kickoffAt: ago(62),
        events: JSON.stringify([{ minute: 45, type: 'goal', player: 'Osimhen', team: 'home' }]),
      },
    }),

    // ── Today (upcoming, same day) ──
    prisma.match.upsert({
      where: { id: 'match-liv-che' },
      update: {},
      create: {
        id: 'match-liv-che', league: 'Premier League',
        homeTeam: 'Liverpool', awayTeam: 'Chelsea',
        status: 'upcoming', venue: 'Anfield',
        continent: 'Europe', country: 'England',
        kickoffAt: hrs(3),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-tot-new' },
      update: {},
      create: {
        id: 'match-tot-new', league: 'Premier League',
        homeTeam: 'Tottenham', awayTeam: 'Newcastle',
        status: 'upcoming', venue: 'Tottenham Hotspur Stadium',
        continent: 'Europe', country: 'England',
        kickoffAt: hrs(5),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-bay-dor' },
      update: {},
      create: {
        id: 'match-bay-dor', league: 'Bundesliga',
        homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund',
        status: 'upcoming', venue: 'Allianz Arena',
        continent: 'Europe', country: 'Germany',
        kickoffAt: hrs(4),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-psg-lyon' },
      update: {},
      create: {
        id: 'match-psg-lyon', league: 'Ligue 1',
        homeTeam: 'PSG', awayTeam: 'Lyon',
        status: 'upcoming', venue: 'Parc des Princes',
        continent: 'Europe', country: 'France',
        kickoffAt: hrs(6),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-sen-gha' },
      update: {},
      create: {
        id: 'match-sen-gha', league: 'AFCON',
        homeTeam: 'Senegal', awayTeam: 'Ghana',
        status: 'upcoming', venue: 'Cairo Stadium',
        continent: 'Africa', country: 'Africa',
        kickoffAt: hrs(2),
        events: JSON.stringify([]),
      },
    }),

    // ── Upcoming (future days) ──
    prisma.match.upsert({
      where: { id: 'match-mci-nap' },
      update: {},
      create: {
        id: 'match-mci-nap', league: 'Champions League',
        homeTeam: 'Manchester City', awayTeam: 'Napoli',
        status: 'upcoming', venue: 'Etihad Stadium',
        continent: 'Europe', country: 'England',
        kickoffAt: hrs(28),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-rm-inter' },
      update: {},
      create: {
        id: 'match-rm-inter', league: 'Champions League',
        homeTeam: 'Real Madrid', awayTeam: 'Inter Milan',
        status: 'upcoming', venue: 'Santiago Bernabeu',
        continent: 'Europe', country: 'Spain',
        kickoffAt: hrs(52),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-ars-psv' },
      update: {},
      create: {
        id: 'match-ars-psv', league: 'Europa League',
        homeTeam: 'Arsenal', awayTeam: 'PSV Eindhoven',
        status: 'upcoming', venue: 'Emirates Stadium',
        continent: 'Europe', country: 'England',
        kickoffAt: hrs(76),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-egy-mor' },
      update: {},
      create: {
        id: 'match-egy-mor', league: 'AFCON',
        homeTeam: 'Egypt', awayTeam: 'Morocco',
        status: 'upcoming', venue: 'Stade de la Réunification',
        continent: 'Africa', country: 'Africa',
        kickoffAt: hrs(100),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-lei-frk' },
      update: {},
      create: {
        id: 'match-lei-frk', league: 'Bundesliga',
        homeTeam: 'RB Leipzig', awayTeam: 'Eintracht Frankfurt',
        status: 'upcoming', venue: 'Red Bull Arena',
        continent: 'Europe', country: 'Germany',
        kickoffAt: hrs(124),
        events: JSON.stringify([]),
      },
    }),

    // ── Finished (FT) ──
    prisma.match.upsert({
      where: { id: 'match-che-mci-ft' },
      update: {},
      create: {
        id: 'match-che-mci-ft', league: 'Premier League',
        homeTeam: 'Chelsea', awayTeam: 'Manchester City',
        homeScore: 1, awayScore: 3, status: 'ft',
        venue: 'Stamford Bridge', continent: 'Europe', country: 'England',
        kickoffAt: ago(180),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-juve-rom-ft' },
      update: {},
      create: {
        id: 'match-juve-rom-ft', league: 'Serie A',
        homeTeam: 'Juventus', awayTeam: 'Roma',
        homeScore: 2, awayScore: 0, status: 'ft',
        venue: 'Allianz Stadium', continent: 'Europe', country: 'Italy',
        kickoffAt: ago(240),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-avl-bha-ft' },
      update: {},
      create: {
        id: 'match-avl-bha-ft', league: 'Premier League',
        homeTeam: 'Aston Villa', awayTeam: 'Brighton',
        homeScore: 3, awayScore: 1, status: 'ft',
        venue: 'Villa Park', continent: 'Europe', country: 'England',
        kickoffAt: ago(300),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-whw-wol-ft' },
      update: {},
      create: {
        id: 'match-whw-wol-ft', league: 'Premier League',
        homeTeam: 'West Ham', awayTeam: 'Wolves',
        homeScore: 2, awayScore: 0, status: 'ft',
        venue: 'London Stadium', continent: 'Europe', country: 'England',
        kickoffAt: ago(360),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-atl-sev-ft' },
      update: {},
      create: {
        id: 'match-atl-sev-ft', league: 'La Liga',
        homeTeam: 'Atletico Madrid', awayTeam: 'Sevilla',
        homeScore: 1, awayScore: 0, status: 'ft',
        venue: 'Metropolitano', continent: 'Europe', country: 'Spain',
        kickoffAt: ago(360),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-ivc-mal-ft' },
      update: {},
      create: {
        id: 'match-ivc-mal-ft', league: 'AFCON',
        homeTeam: 'Ivory Coast', awayTeam: 'Mali',
        homeScore: 2, awayScore: 2, status: 'ft',
        venue: 'Stade Félix Houphouët-Boigny', continent: 'Africa', country: 'Africa',
        kickoffAt: ago(360),
        events: JSON.stringify([]),
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-dor-lev-ft' },
      update: {},
      create: {
        id: 'match-dor-lev-ft', league: 'Bundesliga',
        homeTeam: 'Borussia Dortmund', awayTeam: 'Bayer Leverkusen',
        homeScore: 1, awayScore: 3, status: 'ft',
        venue: 'Signal Iduna Park', continent: 'Europe', country: 'Germany',
        kickoffAt: ago(420),
        events: JSON.stringify([]),
      },
    }),
  ]);
  console.log(`✅ Created ${matches.length} matches`);

  // ─── Posts ──────────────────────────────────────────────────
  const posts = await Promise.all([
    // Breaking news posts
    prisma.post.upsert({
      where: { id: 'post-break-yoro' },
      update: {},
      create: {
        id: 'post-break-yoro', userId: ss.id, postType: 'post', isBreaking: true,
        content: "BREAKING: Manchester United confirm the signing of Leny Yoro from Lille for £58.9M. The 18-year-old defender becomes one of the most expensive teenage transfers in history. 🔴",
        likeCount: 2847, commentCount: 342, shareCount: 156, viewCount: 45000,
        teamTag: 'Manchester United',
      },
    }),
    prisma.post.upsert({
      where: { id: 'post-break-mbappe' },
      update: {},
      create: {
        id: 'post-break-mbappe', userId: fd.id, postType: 'post', isBreaking: true,
        content: "OFFICIAL: Real Madrid have activated the release clause of Kylian Mbappé. The French superstar signs a 5-year deal at the Bernabeu. Transfer fee: £178M.",
        likeCount: 15670, commentCount: 2341, shareCount: 3456, viewCount: 234000,
      },
    }),
    // Fan posts
    prisma.post.upsert({
      where: { id: 'post-mu-perf' },
      update: {},
      create: {
        id: 'post-mu-perf', userId: manutd.id, postType: 'post', isBreaking: false,
        content: 'What a performance from the lads tonight. Rashford with the brace — absolute class. Old Trafford was rocking.',
        likeCount: 4521, commentCount: 678, shareCount: 234, viewCount: 89000,
        teamTag: 'Manchester United', playerTag: 'Rashford',
      },
    }),
    prisma.post.upsert({
      where: { id: 'post-sarah-emirates' },
      update: {},
      create: {
        id: 'post-sarah-emirates', userId: sarah.id, postType: 'photo',
        content: 'Match day at the Emirates. The atmosphere was electric tonight.',
        mediaUrls: JSON.stringify(['https://example.com/photo/emirates-matchday.jpg']),
        likeCount: 3456, commentCount: 234, shareCount: 89, viewCount: 45000,
        teamTag: 'Arsenal',
      },
    }),
    // Poll
    prisma.post.upsert({
      where: { id: 'post-poll-pl' },
      update: {},
      create: {
        id: 'post-poll-pl', userId: fd.id, postType: 'post',
        content: 'Who wins the Premier League this season?',
        likeCount: 890, commentCount: 234, shareCount: 56, viewCount: 12000,
      },
    }),
    // Marcus hot take
    prisma.post.upsert({
      where: { id: 'post-marcus-haaland' },
      update: {},
      create: {
        id: 'post-marcus-haaland', userId: marcus.id, postType: 'post',
        content: "Hot take: Haaland's goal-per-game ratio makes him the most efficient striker in Premier League history. The stats don't lie. Change my mind.",
        likeCount: 567, commentCount: 234, shareCount: 23, viewCount: 8900,
        playerTag: 'Erling Haaland',
      },
    }),
    // Video / spotlight posts
    prisma.post.upsert({
      where: { id: 'post-rashford-goals' },
      update: {},
      create: {
        id: 'post-rashford-goals', userId: goals.id, postType: 'video',
        content: 'Every Rashford goal this season 🔥 What a player when he\'s in form. Vol. 1 — 12 goals in one video.',
        mediaUrls: JSON.stringify(['https://example.com/video/rashford-goals.mp4']),
        likeCount: 8934, commentCount: 456, shareCount: 1234, viewCount: 450000,
        playerTag: 'Rashford',
      },
    }),
    prisma.post.upsert({
      where: { id: 'post-sarah-spotlight' },
      update: {},
      create: {
        id: 'post-sarah-spotlight', userId: sarah.id, postType: 'spotlight',
        content: 'The atmosphere at the Emirates last night was absolutely electric. Arsenal fans were incredible from start to finish. This team is going places. 📸',
        likeCount: 1234, commentCount: 89, shareCount: 45, viewCount: 18000,
        teamTag: 'Arsenal',
      },
    }),
    // GK training
    prisma.post.upsert({
      where: { id: 'post-gk-drill' },
      update: {},
      create: {
        id: 'post-gk-drill', userId: gku.id, postType: 'post',
        content: "Today's training tip: The 1-2 save drill. Set up two shooters, one at each post. Make the first save then immediately reset for the second. Reaction time is everything.",
        likeCount: 2341, commentCount: 123, shareCount: 234, viewCount: 34000,
      },
    }),
    // Transfer news
    prisma.post.upsert({
      where: { id: 'post-tonali' },
      update: {},
      create: {
        id: 'post-tonali', userId: fd.id, postType: 'post',
        content: 'TRANSFER UPDATE: Chelsea in advanced talks to sign Sandro Tonali from Newcastle for £65M. The Italian midfielder is keen on a return to top European football.',
        likeCount: 4521, commentCount: 678, shareCount: 890, viewCount: 89000,
        playerTag: 'Sandro Tonali',
      },
    }),
    // More spotlight/video content for spotlight feed
    prisma.post.upsert({
      where: { id: 'post-mbappe-skills' },
      update: {},
      create: {
        id: 'post-mbappe-skills', userId: skillz.id, postType: 'spotlight',
        content: 'Mbappe Skills Compilation — The French wizard at his best. Every dribble, every trick, every finish.',
        mediaUrls: JSON.stringify(['https://example.com/video/mbappe-skills.mp4']),
        likeCount: 6700, commentCount: 312, shareCount: 890, viewCount: 320000,
        playerTag: 'Mbappe',
      },
    }),
    prisma.post.upsert({
      where: { id: 'post-gooner-reaction' },
      update: {},
      create: {
        id: 'post-gooner-reaction', userId: gooner.id, postType: 'spotlight',
        content: 'Fan Reaction — Arsenal Win! The Emirates was bouncing today. What a performance from the lads!',
        mediaUrls: JSON.stringify(['https://example.com/video/gooner-reaction.mp4']),
        likeCount: 2300, commentCount: 156, shareCount: 78, viewCount: 65000,
        teamTag: 'Arsenal',
      },
    }),
    prisma.post.upsert({
      where: { id: 'post-gk-saves' },
      update: {},
      create: {
        id: 'post-gk-saves', userId: gku.id, postType: 'spotlight',
        content: 'Best Saves This Week — Top 10 goalkeeper saves from around Europe. Some of these are unreal!',
        mediaUrls: JSON.stringify(['https://example.com/video/gk-saves.mp4']),
        likeCount: 1800, commentCount: 98, shareCount: 234, viewCount: 43000,
      },
    }),
    prisma.post.upsert({
      where: { id: 'post-dribble-master' },
      update: {},
      create: {
        id: 'post-dribble-master', userId: techKing.id, postType: 'spotlight',
        content: 'Dribble Masterclass — Breaking down the technique behind the best dribblers in world football.',
        mediaUrls: JSON.stringify(['https://example.com/video/dribble-master.mp4']),
        likeCount: 1500, commentCount: 67, shareCount: 112, viewCount: 28000,
      },
    }),
    prisma.post.upsert({
      where: { id: 'post-clasico-hl' },
      update: {},
      create: {
        id: 'post-clasico-hl', userId: laliga.id, postType: 'spotlight',
        content: 'El Clasico Highlights — Real Madrid vs Barcelona. The biggest match in world football never disappoints.',
        mediaUrls: JSON.stringify(['https://example.com/video/clasico-hl.mp4']),
        likeCount: 9800, commentCount: 567, shareCount: 2340, viewCount: 890000,
      },
    }),
  ]);
  console.log(`✅ Created ${posts.length} posts`);

  // ─── Polls ──────────────────────────────────────────────────
  const pollPost = posts.find(p => p.id === 'post-poll-pl')!;
  await prisma.poll.upsert({
    where: { id: 'poll-pl-winner' },
    update: {},
    create: {
      id: 'poll-pl-winner', postId: pollPost.id,
      question: 'Who wins the Premier League this season?',
      options: JSON.stringify([
        { label: 'Manchester City', pct: 42 },
        { label: 'Arsenal', pct: 31 },
        { label: 'Liverpool', pct: 18 },
        { label: 'Chelsea', pct: 9 },
      ]),
      totalVotes: 12400,
      endsAt: hrs(168),
    },
  });
  console.log('✅ Created poll');

  // ─── Comments ────────────────────────────────────────────────
  const commentsData = [
    { postId: 'post-mu-perf', userId: sarah.id, content: 'Absolutely class! 🔥', likeCount: 45 },
    { postId: 'post-mu-perf', userId: marcus.id, content: 'Rashford is back to his best this season', likeCount: 23 },
    { postId: 'post-mu-perf', userId: gku.id, content: 'What a performance 🔥', likeCount: 12 },
    { postId: 'post-break-yoro', userId: marcus.id, content: 'Great signing for the future. £58.9M is a lot but he has potential.', likeCount: 34 },
    { postId: 'post-break-yoro', userId: sarah.id, content: 'Excited to see him develop at United!', likeCount: 56 },
    { postId: 'post-break-mbappe', userId: marcus.id, content: 'The biggest transfer of the decade. Madrid got a bargain.', likeCount: 234 },
    { postId: 'post-marcus-haaland', userId: sarah.id, content: "I'd argue Henry in his prime was more efficient, but Haaland is insane.", likeCount: 89 },
    { postId: 'post-marcus-haaland', userId: fd.id, content: 'Stats support this take. The xG numbers are ridiculous.', likeCount: 156 },
    { postId: 'post-rashford-goals', userId: marcus.id, content: 'Vol 2 when? 🔥🔥🔥', likeCount: 78 },
    { postId: 'post-rashford-goals', userId: sarah.id, content: 'The chip against Wolves is my favourite', likeCount: 45 },
    { postId: 'post-sarah-emirates', userId: marcus.id, content: 'Looks amazing! What camera do you use?', likeCount: 12 },
    { postId: 'post-sarah-emirates', userId: gku.id, content: 'The Emirates at night is special', likeCount: 8 },
    { postId: 'post-tonali', userId: sarah.id, content: 'Would be a great signing for Chelsea. He fits their style perfectly.', likeCount: 67 },
    { postId: 'post-gk-drill', userId: sarah.id, content: 'Tried this at training today, definitely improved my reaction time!', likeCount: 23 },
    { postId: 'post-gk-drill', userId: david.id, content: 'My coach showed us this last week. Really effective.', likeCount: 11 },
    { postId: 'post-poll-pl', userId: marcus.id, content: 'City have the squad depth to go all the way again.', likeCount: 45 },
    { postId: 'post-poll-pl', userId: sarah.id, content: 'Arsenal if we stay injury free! 💪', likeCount: 89 },
    { postId: 'post-poll-pl', userId: david.id, content: "Don't sleep on Liverpool. Slot is doing wonders.", likeCount: 34 },
  ];

  await prisma.$transaction(
    commentsData.map(c =>
      prisma.comment.upsert({
        where: { id: `comment-${c.postId}-${c.userId}` },
        update: {},
        create: { id: `comment-${c.postId}-${c.userId}`, ...c },
      })
    )
  );
  console.log(`✅ Created ${commentsData.length} comments`);

  // ─── Communities ─────────────────────────────────────────────
  const communities = await Promise.all([
    prisma.community.upsert({
      where: { id: 'comm-gooners' },
      update: {},
      create: { id: 'comm-gooners', name: 'Gooners', description: 'The official Arsenal fan community on SportSphere', topic: 'Arsenal', memberCount: 125000, createdById: ss.id },
    }),
    prisma.community.upsert({
      where: { id: 'comm-red-devils' },
      update: {},
      create: { id: 'comm-red-devils', name: 'Red Devils', description: 'Manchester United fans worldwide', topic: 'Manchester United', memberCount: 98000, createdById: ss.id },
    }),
    prisma.community.upsert({
      where: { id: 'comm-culers' },
      update: {},
      create: { id: 'comm-culers', name: 'Culer Nation', description: 'FC Barcelona supporters', topic: 'FC Barcelona', memberCount: 87000, createdById: ss.id },
    }),
    prisma.community.upsert({
      where: { id: 'comm-gku' },
      update: {},
      create: { id: 'comm-gku', name: 'GK Union', description: 'Goalkeeper community — saves, tips, drills', topic: 'Goalkeeping', memberCount: 67800, createdById: gku.id },
    }),
    prisma.community.upsert({
      where: { id: 'comm-predictions' },
      update: {},
      create: { id: 'comm-predictions', name: 'Prediction Kings', description: 'The home of match predictions. Compete with fans worldwide.', topic: 'Predictions', memberCount: 45000, createdById: ss.id },
    }),
  ]);
  console.log(`✅ Created ${communities.length} communities`);

  // ─── Community Memberships ──────────────────────────────────
  await prisma.$transaction([
    prisma.communityMember.upsert({ where: { communityId_userId: { communityId: 'comm-gooners', userId: sarah.id } }, update: {}, create: { communityId: 'comm-gooners', userId: sarah.id, role: 'admin' } }),
    prisma.communityMember.upsert({ where: { communityId_userId: { communityId: 'comm-gooners', userId: gooner.id } }, update: {}, create: { communityId: 'comm-gooners', userId: gooner.id, role: 'moderator' } }),
    prisma.communityMember.upsert({ where: { communityId_userId: { communityId: 'comm-gooners', userId: david.id } }, update: {}, create: { communityId: 'comm-gooners', userId: david.id, role: 'member' } }),
    prisma.communityMember.upsert({ where: { communityId_userId: { communityId: 'comm-red-devils', userId: david.id } }, update: {}, create: { communityId: 'comm-red-devils', userId: david.id, role: 'member' } }),
    prisma.communityMember.upsert({ where: { communityId_userId: { communityId: 'comm-red-devils', userId: marcus.id } }, update: {}, create: { communityId: 'comm-red-devils', userId: marcus.id, role: 'member' } }),
    prisma.communityMember.upsert({ where: { communityId_userId: { communityId: 'comm-gku', userId: gku.id } }, update: {}, create: { communityId: 'comm-gku', userId: gku.id, role: 'admin' } }),
    prisma.communityMember.upsert({ where: { communityId_userId: { communityId: 'comm-gku', userId: david.id } }, update: {}, create: { communityId: 'comm-gku', userId: david.id, role: 'member' } }),
    prisma.communityMember.upsert({ where: { communityId_userId: { communityId: 'comm-predictions', userId: david.id } }, update: {}, create: { communityId: 'comm-predictions', userId: david.id, role: 'member' } }),
    prisma.communityMember.upsert({ where: { communityId_userId: { communityId: 'comm-predictions', userId: marcus.id } }, update: {}, create: { communityId: 'comm-predictions', userId: marcus.id, role: 'member' } }),
  ]);
  console.log('✅ Created community memberships');

  // ─── Follows ────────────────────────────────────────────────
  await prisma.$transaction([
    prisma.follow.upsert({ where: { followerId_followingId: { followerId: sarah.id, followingId: david.id } }, update: {}, create: { followerId: sarah.id, followingId: david.id } }),
    prisma.follow.upsert({ where: { followerId_followingId: { followerId: marcus.id, followingId: david.id } }, update: {}, create: { followerId: marcus.id, followingId: david.id } }),
    prisma.follow.upsert({ where: { followerId_followingId: { followerId: goals.id, followingId: david.id } }, update: {}, create: { followerId: goals.id, followingId: david.id } }),
    prisma.follow.upsert({ where: { followerId_followingId: { followerId: david.id, followingId: sarah.id } }, update: {}, create: { followerId: david.id, followingId: sarah.id } }),
    prisma.follow.upsert({ where: { followerId_followingId: { followerId: david.id, followingId: marcus.id } }, update: {}, create: { followerId: david.id, followingId: marcus.id } }),
    prisma.follow.upsert({ where: { followerId_followingId: { followerId: david.id, followingId: ss.id } }, update: {}, create: { followerId: david.id, followingId: ss.id } }),
    prisma.follow.upsert({ where: { followerId_followingId: { followerId: david.id, followingId: fd.id } }, update: {}, create: { followerId: david.id, followingId: fd.id } }),
    prisma.follow.upsert({ where: { followerId_followingId: { followerId: david.id, followingId: goals.id } }, update: {}, create: { followerId: david.id, followingId: goals.id } }),
    prisma.follow.upsert({ where: { followerId_followingId: { followerId: david.id, followingId: manutd.id } }, update: {}, create: { followerId: david.id, followingId: manutd.id } }),
  ]);
  console.log('✅ Created follows');

  // ─── Notifications ────────────────────────────────────────────
  const notificationsData = [
    { userId: david.id, type: 'follow', title: 'Sarah Chen followed you', actorId: sarah.id, isRead: false },
    { userId: david.id, type: 'like', title: 'Marcus Johnson liked your post', actorId: marcus.id, isRead: false },
    { userId: david.id, type: 'match_goal', title: "GOAL! Rashford 78' — Man Utd 2-1 Arsenal", referenceId: 'match-mu-ars', isRead: false },
    { userId: david.id, type: 'system', title: 'Welcome to SportSphere!', body: 'Start by following your favourite teams and players.', isRead: true },
    { userId: david.id, type: 'comment', title: 'Sarah Chen commented on your post', actorId: sarah.id, isRead: false },
    { userId: david.id, type: 'follow', title: 'Goal Highlights HD started following you', actorId: goals.id, isRead: true },
    { userId: david.id, type: 'prediction', title: 'Your prediction was correct! Arsenal won 2-1', isRead: false },
    { userId: david.id, type: 'community', title: 'You were invited to join "Gooners" community', isRead: true },
    { userId: david.id, type: 'result', title: 'Chelsea vs Manchester City ended 1-3', referenceId: 'match-che-mci-ft', isRead: true },
    { userId: david.id, type: 'transfer', title: 'Transfer news: Arsenal signs new midfielder', actorId: fd.id, isRead: true },
    { userId: david.id, type: 'poll_result', title: 'Poll results: 42% voted Manchester City to win', isRead: true },
  ];

  await prisma.$transaction(
    notificationsData.map((n, i) =>
      prisma.notification.upsert({
        where: { id: `notif-${david.id}-${i}` },
        update: {},
        create: { id: `notif-${david.id}-${i}`, ...n },
      })
    )
  );
  console.log(`✅ Created ${notificationsData.length} notifications`);

  // ─── Messages ─────────────────────────────────────────────────
  const messagesData = [
    { senderId: david.id, receiverId: sarah.id, content: 'Did you see that game?', isRead: true },
    { senderId: sarah.id, receiverId: david.id, content: 'YES! What a comeback by United', isRead: true },
    { senderId: david.id, receiverId: sarah.id, content: 'Rashford is back to his best', isRead: false },
    { senderId: sarah.id, receiverId: david.id, content: "Let's go to the match together!", isRead: false },
    { senderId: marcus.id, receiverId: david.id, content: 'Great prediction on the Arsenal game!', isRead: true },
    { senderId: david.id, receiverId: marcus.id, content: 'Thanks! The form was strong', isRead: true },
    { senderId: marcus.id, receiverId: david.id, content: 'Great prediction!', isRead: true },
    { senderId: sarah.id, receiverId: gooner.id, content: 'Match day thread is up for Saturday', isRead: true },
    { senderId: gooner.id, receiverId: sarah.id, content: 'Admin: Match day thread is up', isRead: false },
  ];

  await prisma.$transaction(
    messagesData.map((m, i) =>
      prisma.message.upsert({
        where: { id: `msg-${i}` },
        update: {},
        create: { id: `msg-${i}`, ...m },
      })
    )
  );
  console.log(`✅ Created ${messagesData.length} messages`);

  // ─── Predictions ──────────────────────────────────────────────
  const predictionsData = [
    { userId: david.id, matchId: 'match-mu-ars', homeTeam: 'Manchester United', awayTeam: 'Arsenal', predictedHome: 2, predictedAway: 1, result: 'correct', isCorrect: true, pointsEarned: 3 },
    { userId: marcus.id, matchId: 'match-mu-ars', homeTeam: 'Manchester United', awayTeam: 'Arsenal', predictedHome: 1, predictedAway: 1, result: 'partial', isCorrect: false, pointsEarned: 1 },
    { userId: sarah.id, matchId: 'match-mu-ars', homeTeam: 'Manchester United', awayTeam: 'Arsenal', predictedHome: 2, predictedAway: 1, result: 'correct', isCorrect: true, pointsEarned: 3 },
    { userId: david.id, matchId: 'match-rm-barca', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', predictedHome: 2, predictedAway: 1, result: 'pending', isCorrect: null, pointsEarned: 0 },
  ];

  await prisma.$transaction(
    predictionsData.map((p, i) =>
      prisma.prediction.upsert({
        where: { id: `pred-${i}` },
        update: {},
        create: { id: `pred-${i}`, ...p },
      })
    )
  );
  console.log(`✅ Created ${predictionsData.length} predictions`);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
