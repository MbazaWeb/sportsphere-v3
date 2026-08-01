import { PrismaClient, UserRole, MatchStatus, PostType, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SportSphere database...');

  // ─── Users ─────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { handle: '@sportsphere' },
      update: {},
      create: {
        name: 'SportSphere Official', handle: '@sportsphere', email: 'official@sportsphere.com',
        avatarInitials: 'SS', role: UserRole.organization, isVerified: true,
        verificationStatus: 'verified', bio: 'The official SportSphere account.',
        location: 'London, UK', followerCount: 4580000, postCount: 2340,
        coverGradient: 'from-emerald-600 via-green-500 to-emerald-900',
        sportsFollowing: ['Football', 'Basketball', 'Tennis'],
      },
    }),
    prisma.user.upsert({
      where: { handle: '@sarahchen' },
      update: {},
      create: {
        name: 'Sarah Chen', handle: '@sarahchen', email: 'sarah@example.com',
        avatarInitials: 'SC', role: UserRole.creator, isVerified: true,
        verificationStatus: 'verified', bio: 'Arsenal season ticket holder. Football photographer.',
        location: 'London, UK', followerCount: 34500, postCount: 189,
        coverGradient: 'from-pink-600 via-violet-500 to-purple-900',
        sportsFollowing: ['Football'],
      },
    }),
    prisma.user.upsert({
      where: { handle: '@footballdaily' },
      update: {},
      create: {
        name: 'Football Daily', handle: '@footballdaily', email: 'news@footballdaily.com',
        avatarInitials: 'FD', role: UserRole.journalist, isVerified: true,
        verificationStatus: 'verified', bio: 'Your daily dose of football news, transfers, and analysis.',
        location: 'Manchester, UK', followerCount: 1200000, postCount: 3450,
        coverGradient: 'from-teal-600 via-cyan-500 to-teal-900',
        sportsFollowing: ['Football'],
      },
    }),
    prisma.user.upsert({
      where: { handle: '@marcusj' },
      update: {},
      create: {
        name: 'Marcus Johnson', handle: '@marcusj', email: 'marcus@example.com',
        avatarInitials: 'MJ', role: UserRole.fan, isVerified: false,
        bio: 'Premier League obsessed. Stats nerd. Occasional hot takes.',
        location: 'Lagos, Nigeria', followerCount: 8900, postCount: 234,
        coverGradient: 'from-blue-600 via-indigo-500 to-blue-900',
        sportsFollowing: ['Football', 'Basketball'],
      },
    }),
    prisma.user.upsert({
      where: { handle: '@goalsdaily' },
      update: {},
      create: {
        name: 'Goal Highlights HD', handle: '@goalsdaily', email: 'goals@highlightshd.com',
        avatarInitials: 'GH', role: UserRole.creator, isVerified: true,
        verificationStatus: 'verified', bio: 'Every goal, every game, every highlight. 4K quality.',
        location: 'Dubai, UAE', followerCount: 2100000, postCount: 3800,
        coverGradient: 'from-yellow-600 via-amber-500 to-orange-800',
        sportsFollowing: ['Football'],
      },
    }),
    prisma.user.upsert({
      where: { handle: '@gkunion' },
      update: {},
      create: {
        name: 'GK Union', handle: '@gkunion', email: 'gk@union.com',
        avatarInitials: 'GU', role: UserRole.community, isVerified: true,
        verificationStatus: 'verified', bio: 'The goalkeeper community. Saves, tips, and training drills.',
        location: 'Global', followerCount: 67800, postCount: 890,
        coverGradient: 'from-lime-600 via-green-500 to-emerald-800',
        sportsFollowing: ['Football'],
      },
    }),
    prisma.user.upsert({
      where: { handle: '@davidmbaza' },
      update: {},
      create: {
        name: 'David Mbaza', handle: '@davidmbaza', email: 'david@sportsphere.com',
        avatarInitials: 'DM', role: UserRole.fan, isVerified: false,
        bio: 'Football is life. Man Utd till I die. Predictions guru.',
        location: 'Dar es Salaam, Tanzania', followerCount: 1200, postCount: 52,
        coverGradient: 'from-red-600 via-red-500 to-red-800',
        sportsFollowing: ['Football', 'Basketball'],
      },
    }),
  ]);

  const [ss, sarah, fd, marcus, goals, gku, david] = users;
  console.log(`✅ Created ${users.length} users`);

  // ─── Matches ───────────────────────────────────────────────
  const now = new Date();
  const matches = await Promise.all([
    // LIVE matches
    prisma.match.upsert({
      where: { id: 'match-mu-ars' },
      update: { minute: 78, homeScore: 2, awayScore: 1 },
      create: {
        id: 'match-mu-ars', league: 'Premier League',
        homeTeam: 'Manchester United', awayTeam: 'Arsenal',
        homeScore: 2, awayScore: 1, status: MatchStatus.live, minute: 78,
        venue: 'Old Trafford',
        kickoffAt: new Date(now.getTime() - 78 * 60000),
        events: [
          { minute: 23, type: 'goal', player: 'Rashford', team: 'home' },
          { minute: 34, type: 'goal', player: 'Saka', team: 'away' },
          { minute: 56, type: 'goal', player: 'Rashford', team: 'home' },
        ],
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-rm-barca' },
      update: {},
      create: {
        id: 'match-rm-barca', league: 'La Liga',
        homeTeam: 'Real Madrid', awayTeam: 'Barcelona',
        homeScore: 1, awayScore: 1, status: MatchStatus.ht, minute: 45,
        venue: 'Santiago Bernabeu',
        kickoffAt: new Date(now.getTime() - 45 * 60000),
        events: [
          { minute: 18, type: 'goal', player: 'Vinicius Jr', team: 'home' },
          { minute: 38, type: 'goal', player: 'Lewandowski', team: 'away' },
        ],
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-inter-milan' },
      update: {},
      create: {
        id: 'match-inter-milan', league: 'Serie A',
        homeTeam: 'Inter Milan', awayTeam: 'AC Milan',
        homeScore: 0, awayScore: 0, status: MatchStatus.live, minute: 34,
        venue: 'San Siro',
        kickoffAt: new Date(now.getTime() - 34 * 60000),
        events: [],
      },
    }),
    // Upcoming
    prisma.match.upsert({
      where: { id: 'match-liv-che' },
      update: {},
      create: {
        id: 'match-liv-che', league: 'Premier League',
        homeTeam: 'Liverpool', awayTeam: 'Chelsea',
        status: MatchStatus.upcoming, venue: 'Anfield',
        kickoffAt: new Date(now.getTime() + 3 * 3600000),
        events: [],
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-bay-dor' },
      update: {},
      create: {
        id: 'match-bay-dor', league: 'Bundesliga',
        homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund',
        status: MatchStatus.upcoming, venue: 'Allianz Arena',
        kickoffAt: new Date(now.getTime() + 4 * 3600000),
        events: [],
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-psg-lyon' },
      update: {},
      create: {
        id: 'match-psg-lyon', league: 'Ligue 1',
        homeTeam: 'PSG', awayTeam: 'Lyon',
        status: MatchStatus.upcoming, venue: 'Parc des Princes',
        kickoffAt: new Date(now.getTime() + 6 * 3600000),
        events: [],
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-mci-nap' },
      update: {},
      create: {
        id: 'match-mci-nap', league: 'Champions League',
        homeTeam: 'Manchester City', awayTeam: 'Napoli',
        status: MatchStatus.upcoming, venue: 'Etihad Stadium',
        kickoffAt: new Date(now.getTime() + 28 * 3600000),
        events: [],
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-tot-new' },
      update: {},
      create: {
        id: 'match-tot-new', league: 'Premier League',
        homeTeam: 'Tottenham', awayTeam: 'Newcastle',
        status: MatchStatus.upcoming, venue: 'Tottenham Stadium',
        kickoffAt: new Date(now.getTime() + 5 * 3600000),
        events: [],
      },
    }),
    // Finished
    prisma.match.upsert({
      where: { id: 'match-che-mci-ft' },
      update: {},
      create: {
        id: 'match-che-mci-ft', league: 'Premier League',
        homeTeam: 'Chelsea', awayTeam: 'Manchester City',
        homeScore: 1, awayScore: 3, status: MatchStatus.ft,
        venue: 'Stamford Bridge',
        kickoffAt: new Date(now.getTime() - 3 * 3600000),
        events: [],
      },
    }),
    prisma.match.upsert({
      where: { id: 'match-juve-rom-ft' },
      update: {},
      create: {
        id: 'match-juve-rom-ft', league: 'Serie A',
        homeTeam: 'Juventus', awayTeam: 'Roma',
        homeScore: 2, awayScore: 0, status: MatchStatus.ft,
        venue: 'Allianz Stadium',
        kickoffAt: new Date(now.getTime() - 4 * 3600000),
        events: [],
      },
    }),
  ]);
  console.log(`✅ Created ${matches.length} matches`);

  // ─── Posts (matching screenshots) ──────────────────────────
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        userId: ss.id, postType: PostType.post, isBreaking: true,
        content: "BREAKING: Manchester United confirm the signing of Leny Yoro from Lille for £58.9M. The 18-year-old defender becomes one of the most expensive teenage transfers in history. 🔴",
        likeCount: 2847, commentCount: 342, shareCount: 156, viewCount: 45000,
      },
    }),
    prisma.post.create({
      data: {
        userId: sarah.id, postType: PostType.spotlight,
        content: "The atmosphere at the Emirates last night was absolutely electric. Arsenal fans were incredible from start to finish. This team is going places. 📸",
        likeCount: 1234, commentCount: 89, shareCount: 45, viewCount: 18000,
      },
    }),
    prisma.post.create({
      data: {
        userId: fd.id, postType: PostType.post, isBreaking: true,
        content: "OFFICIAL: Real Madrid have activated the release clause of Kylian Mbappé. The French superstar signs a 5-year deal at the Bernabeu. Transfer fee: £178M.",
        likeCount: 15670, commentCount: 2341, shareCount: 3456, viewCount: 234000,
      },
    }),
    prisma.post.create({
      data: {
        userId: marcus.id, postType: PostType.post,
        content: "Hot take: Haaland's goal-per-game ratio makes him the most efficient striker in Premier League history. The stats don't lie. Change my mind.",
        likeCount: 567, commentCount: 234, shareCount: 23, viewCount: 8900,
      },
    }),
    prisma.post.create({
      data: {
        userId: goals.id, postType: PostType.video,
        content: "Every Rashford goal this season 🔥 What a player when he's in form. Vol. 1 — 12 goals in one video.",
        mediaUrls: ['https://example.com/video/rashford-goals.mp4'],
        likeCount: 8934, commentCount: 456, shareCount: 1234, viewCount: 450000,
      },
    }),
    prisma.post.create({
      data: {
        userId: gku.id, postType: PostType.post,
        content: "Today's training tip: The 1-2 save drill. Set up two shooters, one at each post. Make the first save then immediately reset for the second. Reaction time is everything.",
        likeCount: 2341, commentCount: 123, shareCount: 234, viewCount: 34000,
      },
    }),
    prisma.post.create({
      data: {
        userId: fd.id, postType: PostType.post,
        content: "TRANSFER UPDATE: Chelsea in advanced talks to sign Sandro Tonali from Newcastle for £65M. The Italian midfielder is keen on a return to top European football.",
        likeCount: 4521, commentCount: 678, shareCount: 890, viewCount: 89000,
      },
    }),
    prisma.post.create({
      data: {
        userId: sarah.id, postType: PostType.photo,
        content: "Match day vibes at the Emirates. Nothing beats this.",
        mediaUrls: ['https://example.com/photo/emirates-matchday.jpg'],
        likeCount: 3456, commentCount: 234, shareCount: 123, viewCount: 45000,
      },
    }),
  ]);
  console.log(`✅ Created ${posts.length} posts`);

  // ─── Communities ───────────────────────────────────────────
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
  ]);
  console.log(`✅ Created ${communities.length} communities`);

  // ─── Notifications ─────────────────────────────────────────
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      { userId: david.id, type: NotificationType.follow, title: 'Sarah Chen followed you', actorId: sarah.id, isRead: false },
      { userId: david.id, type: NotificationType.like, title: 'Marcus Johnson liked your post', actorId: marcus.id, isRead: false },
      { userId: david.id, type: NotificationType.match_goal, title: 'GOAL! Rashford 78\' — Man Utd 2-1 Arsenal', referenceId: 'match-mu-ars', isRead: false },
      { userId: david.id, type: NotificationType.system, title: 'Welcome to SportSphere!', body: 'Start by following your favourite teams and players.', isRead: true },
    ],
  });
  console.log('✅ Created notifications');

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
