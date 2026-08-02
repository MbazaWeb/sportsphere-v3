import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SportSphere database...');

  // Default password for all test accounts: SportSphere2024!
  const DEFAULT_PASSWORD = 'SportSphere2024!';
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  console.log(`🔐 Password for all test accounts: ${DEFAULT_PASSWORD}`);

  // ─── USERS — one per role for testing ─────────────────────
  const userDefs = [
    // Official
    { handle: '@sportsphere', name: 'SportSphere Official', email: 'official@sportsphere.com',
      avatarInitials: 'SS', role: 'organization', isVerified: true, verificationStatus: 'verified',
      bio: 'The official SportSphere account. Breaking sports news worldwide.',
      location: 'London, UK', followerCount: 4580000, followingCount: 120, postCount: 2340,
      coverGradient: 'from-emerald-600 via-green-500 to-emerald-900' },

    // Fan (quick registration)
    { handle: '@davidmbaza', name: 'David Mbaza', email: 'david@example.com',
      avatarInitials: 'DM', role: 'fan', isVerified: false, verificationStatus: 'none',
      bio: 'Football is life. Man Utd till I die. Predictions guru.',
      location: 'Dar es Salaam, Tanzania', followerCount: 1200, followingCount: 345, postCount: 52,
      coverGradient: 'from-red-600 via-red-500 to-red-800' },
    { handle: '@marcusj', name: 'Marcus Johnson', email: 'marcus@example.com',
      avatarInitials: 'MJ', role: 'fan', isVerified: false, verificationStatus: 'none',
      bio: 'Premier League obsessed. Stats nerd. Occasional hot takes.',
      location: 'Lagos, Nigeria', followerCount: 8900, followingCount: 567, postCount: 234,
      coverGradient: 'from-blue-600 via-indigo-500 to-blue-900' },

    // Player
    { handle: '@rashford10', name: 'Marcus Rashford', email: 'rashford@mufc.com',
      avatarInitials: 'MR', role: 'player', isVerified: true, verificationStatus: 'verified',
      bio: 'Forward @ManUtd | England international | Academy graduate.',
      location: 'Manchester, UK', followerCount: 3200000, followingCount: 89, postCount: 145,
      coverGradient: 'from-red-700 via-red-600 to-red-900' },
    { handle: '@salah11', name: 'Mohamed Salah', email: 'salah@lfc.com',
      avatarInitials: 'MS', role: 'player', isVerified: true, verificationStatus: 'verified',
      bio: 'Winger @LFC | Egypt Captain | Golden Boot holder.',
      location: 'Liverpool, UK', followerCount: 5100000, followingCount: 45, postCount: 210,
      coverGradient: 'from-red-500 via-red-400 to-orange-600' },

    // Team
    { handle: '@manchesterunited', name: 'Manchester United', email: 'info@manutd.com',
      avatarInitials: 'MU', role: 'team', isVerified: true, verificationStatus: 'verified',
      bio: 'Official Manchester United FC. 20x Premier League champions. Theatre of Dreams.',
      location: 'Manchester, UK', followerCount: 8900000, followingCount: 12, postCount: 1240,
      coverGradient: 'from-red-800 via-red-700 to-red-900' },
    { handle: '@arsenal', name: 'Arsenal FC', email: 'info@arsenal.com',
      avatarInitials: 'AR', role: 'team', isVerified: true, verificationStatus: 'verified',
      bio: 'Official Arsenal FC. North London is Red. Est. 1886.',
      location: 'London, UK', followerCount: 7200000, followingCount: 8, postCount: 980,
      coverGradient: 'from-red-600 via-red-500 to-red-700' },

    // Coach
    { handle: '@pepguardiola', name: 'Pep Guardiola', email: 'pep@mancity.com',
      avatarInitials: 'PG', role: 'coach', isVerified: true, verificationStatus: 'verified',
      bio: 'Head Coach @ManCity | 37 major trophies | Football philosopher.',
      location: 'Manchester, UK', followerCount: 5100000, followingCount: 23, postCount: 89,
      coverGradient: 'from-sky-600 via-cyan-500 to-blue-900' },

    // Referee
    { handle: '@michaeloliver', name: 'Michael Oliver', email: 'oliver@pgmol.com',
      avatarInitials: 'MO', role: 'referee', isVerified: true, verificationStatus: 'verified',
      bio: 'FIFA & Premier League Referee. 520+ top-flight matches officiated.',
      location: 'London, UK', followerCount: 45000, followingCount: 12, postCount: 34,
      coverGradient: 'from-lime-600 via-green-500 to-emerald-800' },

    // Journalist
    { handle: '@fabrizioromano', name: 'Fabrizio Romano', email: 'fabrizio@transfer.com',
      avatarInitials: 'FR', role: 'journalist', isVerified: true, verificationStatus: 'verified',
      bio: '"Here we go!" Transfer journalist. Guardian / CBS Sports.',
      location: 'London, UK', followerCount: 12000000, followingCount: 890, postCount: 2400,
      coverGradient: 'from-teal-600 via-cyan-500 to-teal-900' },
    { handle: '@footballdaily', name: 'Football Daily', email: 'news@footballdaily.com',
      avatarInitials: 'FD', role: 'journalist', isVerified: true, verificationStatus: 'verified',
      bio: 'Your daily dose of football news, transfers, and analysis.',
      location: 'Manchester, UK', followerCount: 1200000, followingCount: 89, postCount: 3450,
      coverGradient: 'from-teal-600 via-cyan-500 to-teal-900' },

    // Analyst
    { handle: '@statsperform', name: 'Stats Perform', email: 'data@statsperform.com',
      avatarInitials: 'SP', role: 'analyst', isVerified: true, verificationStatus: 'verified',
      bio: 'AI-powered sports data & analytics. 80+ leagues. 5B+ data points.',
      location: 'Chicago, USA', followerCount: 450000, followingCount: 45, postCount: 1200,
      coverGradient: 'from-emerald-600 via-green-500 to-emerald-900' },

    // Creator
    { handle: '@goalsdaily', name: 'Goal Highlights HD', email: 'goals@highlightshd.com',
      avatarInitials: 'GH', role: 'creator', isVerified: true, verificationStatus: 'verified',
      bio: 'Every goal, every game. 4K quality. 2.1M subscribers.',
      location: 'Dubai, UAE', followerCount: 2100000, followingCount: 45, postCount: 3800,
      coverGradient: 'from-yellow-600 via-amber-500 to-orange-800' },
    { handle: '@sarahchen', name: 'Sarah Chen', email: 'sarah@example.com',
      avatarInitials: 'SC', role: 'creator', isVerified: true, verificationStatus: 'verified',
      bio: 'Arsenal season ticket holder. Football photographer. Match day vlogs.',
      location: 'London, UK', followerCount: 34500, followingCount: 412, postCount: 189,
      coverGradient: 'from-pink-600 via-violet-500 to-purple-900' },

    // Scout
    { handle: '@scoutafrica', name: 'James Tshiani', email: 'scout@africatalent.com',
      avatarInitials: 'JT', role: 'scout', isVerified: false, verificationStatus: 'pending',
      bio: 'Talent scout across East & West Africa. Finding the next generation.',
      location: 'Nairobi, Kenya', followerCount: 12000, followingCount: 234, postCount: 89,
      coverGradient: 'from-yellow-600 via-amber-500 to-orange-800' },

    // Stadium
    { handle: '@oldtrafford', name: 'Old Trafford', email: 'info@oldtrafford.com',
      avatarInitials: 'OT', role: 'stadium', isVerified: true, verificationStatus: 'verified',
      bio: 'The Theatre of Dreams. Home of Manchester United. Capacity 74,310.',
      location: 'Manchester, UK', followerCount: 890000, followingCount: 5, postCount: 345,
      coverGradient: 'from-amber-600 via-orange-500 to-red-800' },

    // Academy
    { handle: '@lamasia', name: 'La Masia', email: 'academy@fcbarcelona.cat',
      avatarInitials: 'LM', role: 'academy', isVerified: true, verificationStatus: 'verified',
      bio: 'FC Barcelona youth academy. Produced Messi, Xavi, Iniesta. Est. 1979.',
      location: 'Barcelona, Spain', followerCount: 780000, followingCount: 23, postCount: 456,
      coverGradient: 'from-blue-600 via-red-500 to-blue-900' },

    // Community
    { handle: '@gooners', name: 'Gooners', email: 'community@gooners.com',
      avatarInitials: 'GO', role: 'community', isVerified: false, verificationStatus: 'none',
      bio: 'The biggest Arsenal fan community on SportSphere. 125K members.',
      location: 'London, UK', followerCount: 125000, followingCount: 12, postCount: 890,
      coverGradient: 'from-red-600 via-red-500 to-rose-800' },
    { handle: '@gkunion', name: 'GK Union', email: 'gku@goalkeepers.com',
      avatarInitials: 'GU', role: 'community', isVerified: true, verificationStatus: 'verified',
      bio: 'Goalkeeper community. Saves, tips, training drills. 67K members.',
      location: 'Global', followerCount: 67800, followingCount: 234, postCount: 890,
      coverGradient: 'from-lime-600 via-green-500 to-emerald-800' },

    // Organization
    { handle: '@fifaofficial', name: 'FIFA', email: 'contact@fifa.com',
      avatarInitials: 'FI', role: 'organization', isVerified: true, verificationStatus: 'verified',
      bio: 'Fédération Internationale de Football Association. Governing body of world football.',
      location: 'Zurich, Switzerland', followerCount: 18000000, followingCount: 45, postCount: 1800,
      coverGradient: 'from-blue-700 via-indigo-500 to-blue-900' },

    // Business
    { handle: '@nikefootball', name: 'Nike Football', email: 'football@nike.com',
      avatarInitials: 'NK', role: 'business', isVerified: true, verificationStatus: 'verified',
      bio: 'Official Nike Football. Kit supplier to 45+ top clubs worldwide.',
      location: 'Beaverton, USA', followerCount: 8500000, followingCount: 67, postCount: 2100,
      coverGradient: 'from-gray-700 via-gray-600 to-black' },

    // Venue
    { handle: '@wembley', name: 'Wembley Stadium', email: 'info@wembley.com',
      avatarInitials: 'WS', role: 'venue', isVerified: true, verificationStatus: 'verified',
      bio: 'Home of English football. 90,000 capacity. FA Cup finals & England home.',
      location: 'London, UK', followerCount: 1800000, followingCount: 8, postCount: 234,
      coverGradient: 'from-stone-500 via-stone-600 to-stone-800' },
  ];

  const users = await Promise.all(
    userDefs.map(def =>
      prisma.user.upsert({
        where: { handle: def.handle },
        update: {
          // Re-hash on every seed run so the test password always works.
          passwordHash,
          // Clear any leftover reset tokens.
          resetToken: null,
          resetTokenExpiry: null,
        },
        create: {
          ...def,
          passwordHash,
          sportsFollowing: JSON.stringify(['Football']),
          roleData: JSON.stringify({}),
        },
      })
    )
  );

  const userMap = Object.fromEntries(users.map(u => [u.handle, u]));
  console.log(`✅ Created ${users.length} users (all roles covered)`);

  // ─── POSTS ─────────────────────────────────────────────────
  const postDefs = [
    { userId: userMap['@sportsphere'].id, postType: 'post', isBreaking: true,
      content: 'BREAKING: Leny Yoro completes move to Manchester United for £58.9M. The 18-year-old centre-back signs a 5-year deal at Old Trafford.',
      likeCount: 12430, commentCount: 1890, shareCount: 3456, viewCount: 234000 },
    { userId: userMap['@manchesterunited'].id, postType: 'post', isBreaking: false,
      content: 'What a performance from the lads tonight. Rashford with the brace — absolute class. Old Trafford was rocking. #MUFC',
      teamTag: 'Manchester United', likeCount: 4521, commentCount: 678, shareCount: 234, viewCount: 89000 },
    { userId: userMap['@sarahchen'].id, postType: 'photo', isBreaking: false,
      content: 'Match day at the Emirates. The atmosphere was electric tonight. Gooners never stop believing. ❤️',
      likeCount: 3456, commentCount: 234, shareCount: 89, viewCount: 45000 },
    { userId: userMap['@footballdaily'].id, postType: 'post', isBreaking: true,
      content: 'TRANSFER UPDATE: Chelsea in advanced talks to sign Sandro Tonali from Newcastle. Fee expected around £65M. Medical scheduled for next week.',
      likeCount: 4521, commentCount: 678, shareCount: 890, viewCount: 89000 },
    { userId: userMap['@marcusj'].id, postType: 'post', isBreaking: false,
      content: 'Haaland breaking records again. 30 goals before January is insane. The guy is on another level entirely. Best striker in the world right now.',
      playerTag: 'Erling Haaland', likeCount: 890, commentCount: 123, shareCount: 67, viewCount: 8900 },
    { userId: userMap['@goalsdaily'].id, postType: 'video', isBreaking: false,
      content: 'Every Rashford goal this season. Vol.1 — 12 goals, one video. The return of the king. 🔥',
      likeCount: 8934, commentCount: 456, shareCount: 1234, viewCount: 450000 },
    { userId: userMap['@gkunion'].id, postType: 'post', isBreaking: false,
      content: 'Today\'s training tip: The 1-2 save drill. Set up two shooters at each post. Make the first save then immediately reset for the second. Reaction time is everything.',
      likeCount: 2341, commentCount: 123, shareCount: 234, viewCount: 34000 },
    { userId: userMap['@fabrizioromano'].id, postType: 'post', isBreaking: true,
      content: 'Kylian Mbappé to Real Madrid, here we go! Contract signed until June 2029. Medical completed yesterday. Official announcement imminent. ✅',
      likeCount: 89000, commentCount: 12400, shareCount: 34000, viewCount: 2300000 },
    { userId: userMap['@rashford10'].id, postType: 'post', isBreaking: false,
      content: 'Buzzing to be back scoring. The hard work in training always pays off. Thanks to the fans — your support means everything. On to the next one. 🔴',
      likeCount: 45000, commentCount: 3400, shareCount: 1200, viewCount: 890000 },
    { userId: userMap['@arsenal'].id, postType: 'post', isBreaking: false,
      content: 'North London is Red. Matchday preview: Bukayo Saka returns to training ahead of Sunday\'s clash. We go again. 💪 #AFC',
      teamTag: 'Arsenal', likeCount: 6700, commentCount: 890, shareCount: 456, viewCount: 123000 },
  ];

  // Delete posts (and cascaded comments/polls) before re-seeding so
  // we don't accumulate duplicates on every seed run.
  await prisma.post.deleteMany({});
  const posts = await Promise.all(
    postDefs.map(def =>
      prisma.post.create({
        data: {
          ...def,
          mediaUrls: JSON.stringify([]),
        },
      })
    )
  );
  console.log(`✅ Created ${postDefs.length} posts`);

  // ─── COMMENTS ───────────────────────────────────────────────
  // Delete old comments first so re-seeding doesn't pile up duplicates
  await prisma.comment.deleteMany({});
  const commentDefs = [
    { postId: posts[0].id, userId: userMap['@davidmbaza'].id, content: 'Massive signing! Been waiting for this all summer.' },
    { postId: posts[0].id, userId: userMap['@marcusj'].id, content: 'Great signing. The future is bright.' },
    { postId: posts[0].id, userId: userMap['@footballdaily'].id, content: 'Official announcement expected today.' },
    { postId: posts[1].id, userId: userMap['@sarahchen'].id, content: 'What a night! Old Trafford was electric.' },
    { postId: posts[1].id, userId: userMap['@davidmbaza'].id, content: 'Rashford is BACK. Different player this season.' },
    { postId: posts[3].id, userId: userMap['@pepguardiola'].id, content: 'Smart business. Tonali is a class midfielder.' },
    { postId: posts[7].id, userId: userMap['@davidmbaza'].id, content: 'HERE WE GO! The transfer of the summer.' },
    { postId: posts[7].id, userId: userMap['@sarahchen'].id, content: 'Finally! Been waiting for this for months.' },
    { postId: posts[7].id, userId: userMap['@marcusj'].id, content: 'Deserves the move. Best player in the world right now.' },
  ];
  await prisma.comment.createMany({ data: commentDefs });
  // Update commentCount on the posts we added comments to
  for (const postId of [...new Set(commentDefs.map((c) => c.postId))]) {
    const count = commentDefs.filter((c) => c.postId === postId).length;
    await prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: count } } });
  }
  console.log(`✅ Created ${commentDefs.length} comments`);

  // ─── POLLS ──────────────────────────────────────────────────
  await prisma.poll.deleteMany({});
  const pollDefs = [
    {
      postId: posts[2].id,
      question: 'Who wins the Premier League this season?',
      options: JSON.stringify(['Manchester City', 'Arsenal', 'Manchester United', 'Liverpool']),
      totalVotes: 4521,
    },
    {
      postId: posts[8].id,
      question: 'Is Rashford back to his best?',
      options: JSON.stringify(['Yes, world-class again', 'Almost there', 'Needs more time', "No, he's done"]),
      totalVotes: 8930,
    },
  ];
  await prisma.poll.createMany({ data: pollDefs });
  console.log(`✅ Created ${pollDefs.length} polls`);

  // ─── MATCHES ────────────────────────────────────────────────
  const now = new Date();
  const matchDefs = [
    { league: 'Premier League', continent: 'Europe', country: 'England',
      homeTeam: 'Manchester United', awayTeam: 'Arsenal',
      homeScore: 2, awayScore: 1, status: 'live', minute: 78, venue: 'Old Trafford',
      kickoffAt: new Date(now.getTime() - 78 * 60000),
      events: JSON.stringify([
        { minute: 23, type: 'goal', player: 'Rashford', team: 'home' },
        { minute: 34, type: 'goal', player: 'Saka', team: 'away' },
        { minute: 56, type: 'goal', player: 'Rashford', team: 'home' },
      ]) },
    { league: 'La Liga', continent: 'Europe', country: 'Spain',
      homeTeam: 'Real Madrid', awayTeam: 'Barcelona',
      homeScore: 1, awayScore: 1, status: 'ht', minute: 45, venue: 'Santiago Bernabeu',
      kickoffAt: new Date(now.getTime() - 45 * 60000),
      events: JSON.stringify([
        { minute: 18, type: 'goal', player: 'Vinicius Jr', team: 'home' },
        { minute: 38, type: 'goal', player: 'Lewandowski', team: 'away' },
      ]) },
    { league: 'Serie A', continent: 'Europe', country: 'Italy',
      homeTeam: 'Inter Milan', awayTeam: 'AC Milan',
      homeScore: 0, awayScore: 0, status: 'live', minute: 34, venue: 'San Siro',
      kickoffAt: new Date(now.getTime() - 34 * 60000),
      events: JSON.stringify([]) },
    { league: 'AFCON', continent: 'Africa', country: 'Africa',
      homeTeam: 'Nigeria', awayTeam: 'Cameroon',
      homeScore: 1, awayScore: 0, status: 'live', minute: 62, venue: 'Cairo Stadium',
      kickoffAt: new Date(now.getTime() - 62 * 60000),
      events: JSON.stringify([{ minute: 45, type: 'goal', player: 'Osimhen', team: 'home' }]) },
    { league: 'Premier League', continent: 'Europe', country: 'England',
      homeTeam: 'Liverpool', awayTeam: 'Chelsea',
      homeScore: null, awayScore: null, status: 'upcoming', minute: null, venue: 'Anfield',
      kickoffAt: new Date(now.getTime() + 3 * 3600000), events: JSON.stringify([]) },
    { league: 'Premier League', continent: 'Europe', country: 'England',
      homeTeam: 'Tottenham', awayTeam: 'Newcastle',
      homeScore: null, awayScore: null, status: 'upcoming', minute: null, venue: 'Tottenham Stadium',
      kickoffAt: new Date(now.getTime() + 5 * 3600000), events: JSON.stringify([]) },
    { league: 'Bundesliga', continent: 'Europe', country: 'Germany',
      homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund',
      homeScore: null, awayScore: null, status: 'upcoming', minute: null, venue: 'Allianz Arena',
      kickoffAt: new Date(now.getTime() + 4 * 3600000), events: JSON.stringify([]) },
    { league: 'Ligue 1', continent: 'Europe', country: 'France',
      homeTeam: 'PSG', awayTeam: 'Lyon',
      homeScore: null, awayScore: null, status: 'upcoming', minute: null, venue: 'Parc des Princes',
      kickoffAt: new Date(now.getTime() + 6 * 3600000), events: JSON.stringify([]) },
    { league: 'Champions League', continent: 'Europe', country: 'England',
      homeTeam: 'Manchester City', awayTeam: 'Napoli',
      homeScore: null, awayScore: null, status: 'upcoming', minute: null, venue: 'Etihad Stadium',
      kickoffAt: new Date(now.getTime() + 28 * 3600000), events: JSON.stringify([]) },
    { league: 'AFCON', continent: 'Africa', country: 'Africa',
      homeTeam: 'Senegal', awayTeam: 'Ghana',
      homeScore: null, awayScore: null, status: 'upcoming', minute: null, venue: 'Cairo Stadium',
      kickoffAt: new Date(now.getTime() + 48 * 3600000), events: JSON.stringify([]) },
    { league: 'Premier League', continent: 'Europe', country: 'England',
      homeTeam: 'Chelsea', awayTeam: 'Manchester City',
      homeScore: 1, awayScore: 3, status: 'ft', minute: null, venue: 'Stamford Bridge',
      kickoffAt: new Date(now.getTime() - 3 * 3600000), events: JSON.stringify([]) },
    { league: 'Serie A', continent: 'Europe', country: 'Italy',
      homeTeam: 'Juventus', awayTeam: 'Roma',
      homeScore: 2, awayScore: 0, status: 'ft', minute: null, venue: 'Allianz Stadium',
      kickoffAt: new Date(now.getTime() - 4 * 3600000), events: JSON.stringify([]) },
    { league: 'La Liga', continent: 'Europe', country: 'Spain',
      homeTeam: 'Atletico Madrid', awayTeam: 'Sevilla',
      homeScore: 1, awayScore: 0, status: 'ft', minute: null, venue: 'Metropolitano',
      kickoffAt: new Date(now.getTime() - 5 * 3600000), events: JSON.stringify([]) },
  ];

  await Promise.all(matchDefs.map(def => prisma.match.create({ data: def })));
  console.log(`✅ Created ${matchDefs.length} matches`);

  // ─── COMMUNITIES ────────────────────────────────────────────
  const communityDefs = [
    { name: 'Gooners', description: 'The official Arsenal fan community on SportSphere', topic: 'Arsenal', memberCount: 125000, createdById: userMap['@gooners'].id },
    { name: 'Red Devils', description: 'Manchester United fans worldwide', topic: 'Manchester United', memberCount: 98000, createdById: userMap['@manchesterunited'].id },
    { name: 'GK Union', description: 'Goalkeeper community — saves, tips, drills', topic: 'Goalkeeping', memberCount: 67800, createdById: userMap['@gkunion'].id },
    { name: 'Culer Nation', description: 'FC Barcelona supporters worldwide', topic: 'FC Barcelona', memberCount: 87000, createdById: userMap['@fifaofficial'].id },
    { name: 'AFCON Watch Party', description: 'Following the African Cup of Nations together', topic: 'AFCON', memberCount: 45000, createdById: userMap['@sportsphere'].id },
  ];

  await Promise.all(communityDefs.map(def => prisma.community.upsert({
    where: { id: def.name.toLowerCase().replace(/\s/g, '-') },
    update: {},
    create: { id: def.name.toLowerCase().replace(/\s/g, '-'), ...def },
  })));
  console.log(`✅ Created ${communityDefs.length} communities`);

  // ─── NOTIFICATIONS (for davidmbaza) ────────────────────────
  const david = userMap['@davidmbaza'];
  await prisma.notification.deleteMany({ where: { userId: david.id } });
  await prisma.notification.createMany({
    data: [
      { userId: david.id, type: 'follow', title: 'Sarah Chen started following you', actorId: userMap['@sarahchen'].id, isRead: false },
      { userId: david.id, type: 'like', title: 'Marcus Johnson liked your post', actorId: userMap['@marcusj'].id, isRead: false },
      { userId: david.id, type: 'match_goal', title: "GOAL! Rashford 78' — Man Utd 2-1 Arsenal", isRead: false },
      { userId: david.id, type: 'follow', title: 'Fabrizio Romano started following you', actorId: userMap['@fabrizioromano'].id, isRead: false },
      { userId: david.id, type: 'comment', title: 'GK Union commented on your post: "Great take!"', actorId: userMap['@gkunion'].id, isRead: true },
      { userId: david.id, type: 'system', title: 'Welcome to SportSphere!', body: 'Start by following your favourite teams and players.', isRead: true },
    ],
  });

  // ─── MESSAGES (for davidmbaza) ──────────────────────────────
  await prisma.message.deleteMany({ where: { OR: [{ senderId: david.id }, { receiverId: david.id }] } });
  await prisma.message.createMany({
    data: [
      { senderId: userMap['@sarahchen'].id, receiverId: david.id, content: 'Did you see that game?! Unbelievable result 🔥', isRead: false },
      { senderId: david.id, receiverId: userMap['@marcusj'].id, content: 'Great prediction man! You called it exactly', isRead: true },
      { senderId: userMap['@gkunion'].id, receiverId: david.id, content: 'Match day thread is live! Join us 🧤', isRead: false },
    ],
  });
  console.log('✅ Created notifications and messages');

  // ─── FOLLOWS (so Followers/Following lists aren't empty) ────
  await prisma.follow.deleteMany({ where: { OR: [{ followerId: david.id }, { followingId: david.id }] } });
  const followDefs = [
    // David follows these (so his "Following" list isn't empty)
    { followerId: david.id, followingId: userMap['@manchesterunited'].id },
    { followerId: david.id, followingId: userMap['@arsenal'].id },
    { followerId: david.id, followingId: userMap['@rashford10'].id },
    { followerId: david.id, followingId: userMap['@salah11'].id },
    { followerId: david.id, followingId: userMap['@pepguardiola'].id },
    { followerId: david.id, followingId: userMap['@fabrizioromano'].id },
    { followerId: david.id, followingId: userMap['@sarahchen'].id },
    // These follow David (so his "Followers" list isn't empty)
    { followerId: userMap['@sarahchen'].id, followingId: david.id },
    { followerId: userMap['@marcusj'].id, followingId: david.id },
    { followerId: userMap['@goalsdaily'].id, followingId: david.id },
    { followerId: userMap['@gkunion'].id, followingId: david.id },
  ];
  await prisma.follow.createMany({ data: followDefs });
  console.log(`✅ Created ${followDefs.length} follows`);

  console.log('\n🎉 Seed complete!');
  console.log(`\n📋 Test accounts created:`);
  userDefs.forEach(u => console.log(`   ${u.role.padEnd(14)} → ${u.handle}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
