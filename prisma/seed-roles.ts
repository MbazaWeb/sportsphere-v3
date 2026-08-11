// SportSphere — Role / RoleType / Sport Seed
// Run: npx tsx prisma/seed-roles.ts
// Seeds normalized Role, RoleType, and Sport tables from the spec.
// Idempotent — uses upsert so it's safe to re-run.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── 20 Core Roles ────────────────────────────────────────────────
const ROLES = [
  {
    slug: 'fan', name: 'Fan', icon: '👤', category: 'individual',
    description: 'Sports enthusiast who follows teams, players, and communities',
    displayOrder: 1,
    types: [
      { slug: 'casual', name: 'Casual Fan', description: 'Follows sports casually for entertainment', displayOrder: 1 },
      { slug: 'diehard', name: 'Diehard Fan', description: 'Passionate supporter deeply invested in their teams', displayOrder: 2 },
      { slug: 'ultra', name: 'Ultra Fan', description: 'Most dedicated supporter — attends every match, leads chants', displayOrder: 3 },
    ],
  },
  {
    slug: 'player', name: 'Player', icon: '⚽', category: 'individual',
    description: 'Professional or amateur athlete who competes in sports',
    displayOrder: 2,
    types: [
      { slug: 'professional', name: 'Professional Player', description: 'Competes at the professional level', displayOrder: 1 },
      { slug: 'semi-pro', name: 'Semi-Professional', description: 'Competes at semi-professional level', displayOrder: 2 },
      { slug: 'amateur', name: 'Amateur Player', description: 'Competes at amateur or recreational level', displayOrder: 3 },
      { slug: 'youth', name: 'Youth Player', description: 'Young player in a development or academy system', displayOrder: 4 },
      { slug: 'retired', name: 'Retired Player', description: 'Former professional player', displayOrder: 5 },
    ],
  },
  {
    slug: 'coach', name: 'Coach', icon: '🧑‍🏫', category: 'individual',
    description: 'Manages team tactics, training, and player development',
    displayOrder: 3,
    types: [
      { slug: 'head-coach', name: 'Head Coach', description: 'Lead coach responsible for the team', displayOrder: 1 },
      { slug: 'assistant-coach', name: 'Assistant Coach', description: 'Supports the head coach in training and tactics', displayOrder: 2 },
      { slug: 'gk-coach', name: 'Goalkeeping Coach', description: 'Specialized coach for goalkeepers', displayOrder: 3 },
      { slug: 'fitness-coach', name: 'Fitness Coach', description: 'Manages physical conditioning and fitness programs', displayOrder: 4 },
      { slug: 'youth-coach', name: 'Youth Coach', description: 'Coaches youth or academy teams', displayOrder: 5 },
    ],
  },
  {
    slug: 'team', name: 'Team', icon: '👥', category: 'team_entity',
    description: 'A sports team or club competing in leagues and competitions',
    displayOrder: 4,
    types: [
      { slug: 'professional-club', name: 'Professional Club', description: 'Top-tier professional sports club', displayOrder: 1 },
      { slug: 'semi-pro-club', name: 'Semi-Professional Club', description: 'Club competing at semi-professional level', displayOrder: 2 },
      { slug: 'amateur-club', name: 'Amateur Club', description: 'Community or recreational sports club', displayOrder: 3 },
      { slug: 'national-team', name: 'National Team', description: 'Representative team for a country', displayOrder: 4 },
      { slug: 'youth-team', name: 'Youth Team', description: 'Development team for young athletes', displayOrder: 5 },
    ],
  },
  {
    slug: 'scout', name: 'Scout', icon: '🔍', category: 'individual',
    description: 'Identifies and evaluates talent for clubs and agencies',
    displayOrder: 5,
    types: [
      { slug: 'chief-scout', name: 'Chief Scout', description: 'Leads the scouting department', displayOrder: 1 },
      { slug: 'talent-scout', name: 'Talent Scout', description: 'Identifies promising young players', displayOrder: 2 },
      { slug: 'recruitment-manager', name: 'Recruitment Manager', description: 'Manages the recruitment pipeline', displayOrder: 3 },
      { slug: 'opposition-scout', name: 'Opposition Scout', description: 'Analyzes upcoming opponents', displayOrder: 4 },
    ],
  },
  {
    slug: 'official', name: 'Official', icon: '⚖️', category: 'official',
    description: 'Governs and officiates sports competitions',
    displayOrder: 6,
    types: [
      { slug: 'referee', name: 'Referee', description: 'Main match official who enforces the rules', displayOrder: 1 },
      { slug: 'assistant-referee', name: 'Assistant Referee', description: 'Supports the referee with sideline decisions', displayOrder: 2 },
      { slug: 'fourth-official', name: 'Fourth Official', description: 'Manages substitutions and technical area', displayOrder: 3 },
      { slug: 'var-official', name: 'VAR Official', description: 'Video Assistant Referee for review decisions', displayOrder: 4 },
      { slug: 'match-commissioner', name: 'Match Commissioner', description: 'Oversees match organization and compliance', displayOrder: 5 },
      { slug: 'technical-delegate', name: 'Technical Delegate', description: 'Ensures technical compliance of events', displayOrder: 6 },
      { slug: 'judge', name: 'Judge', description: 'Scores or adjudicates in judged sports', displayOrder: 7 },
      { slug: 'umpire', name: 'Umpire', description: 'Official in cricket, tennis, baseball and similar sports', displayOrder: 8 },
      { slug: 'timekeeper', name: 'Timekeeper', description: 'Manages timing for events and matches', displayOrder: 9 },
      { slug: 'competition-official', name: 'Competition Official', description: 'General competition administration official', displayOrder: 10 },
    ],
  },
  {
    slug: 'support-staff', name: 'Support Staff', icon: '🏥', category: 'support',
    description: 'Essential staff supporting teams and athletes',
    displayOrder: 7,
    types: [
      { slug: 'team-manager', name: 'Team Manager', description: 'Manages team logistics and operations', displayOrder: 1 },
      { slug: 'general-manager', name: 'General Manager', description: 'Oversees all team operations and strategy', displayOrder: 2 },
      { slug: 'sporting-director', name: 'Sporting Director', description: 'Directs sporting strategy and player acquisition', displayOrder: 3 },
      { slug: 'technical-director', name: 'Technical Director', description: 'Oversees technical development and coaching', displayOrder: 4 },
      { slug: 'physiotherapist', name: 'Physiotherapist', description: 'Treats injuries and manages rehabilitation', displayOrder: 5 },
      { slug: 'athletic-trainer', name: 'Athletic Trainer', description: 'Prevents and treats sports injuries', displayOrder: 6 },
      { slug: 'strength-coach', name: 'Strength & Conditioning Coach', description: 'Manages strength and conditioning programs', displayOrder: 7 },
      { slug: 'nutritionist', name: 'Nutritionist', description: 'Manages dietary plans for athletes', displayOrder: 8 },
      { slug: 'psychologist', name: 'Sports Psychologist', description: 'Supports mental health and performance', displayOrder: 9 },
      { slug: 'performance-analyst', name: 'Performance Analyst', description: 'Analyzes performance data and metrics', displayOrder: 10 },
      { slug: 'video-analyst', name: 'Video Analyst', description: 'Analyzes match footage for tactical insights', displayOrder: 11 },
      { slug: 'data-scientist', name: 'Data Scientist', description: 'Applies data science to sports performance', displayOrder: 12 },
      { slug: 'team-doctor', name: 'Team Doctor', description: 'Provides medical care to the team', displayOrder: 13 },
      { slug: 'equipment-manager', name: 'Equipment Manager', description: 'Manages team equipment and kit', displayOrder: 14 },
    ],
  },
  {
    slug: 'journalist', name: 'Journalist', icon: '📰', category: 'individual',
    description: 'Reports on sports news, transfers, and analysis',
    displayOrder: 8,
    types: [
      { slug: 'reporter', name: 'Reporter', description: 'Covers breaking sports news and events', displayOrder: 1 },
      { slug: 'editor', name: 'Editor', description: 'Edits and curates sports content', displayOrder: 2 },
      { slug: 'correspondent', name: 'Correspondent', description: 'Specialist reporter covering specific beats', displayOrder: 3 },
      { slug: 'investigative', name: 'Investigative Journalist', description: 'In-depth investigative sports reporting', displayOrder: 4 },
    ],
  },
  {
    slug: 'creator', name: 'Creator', icon: '🎥', category: 'individual',
    description: 'Produces sports content across media platforms',
    displayOrder: 9,
    types: [
      { slug: 'podcaster', name: 'Podcaster', description: 'Creates audio content and podcasts', displayOrder: 1 },
      { slug: 'streamer', name: 'Streamer', description: 'Live streams sports content and commentary', displayOrder: 2 },
      { slug: 'influencer', name: 'Influencer', description: 'Creates engaging sports content with large following', displayOrder: 3 },
      { slug: 'youtuber', name: 'YouTuber', description: 'Creates video content on YouTube', displayOrder: 4 },
      { slug: 'graphic-designer', name: 'Graphic Designer', description: 'Creates visual sports content and graphics', displayOrder: 5 },
      { slug: 'photographer', name: 'Photographer', description: 'Captures sports events through photography', displayOrder: 6 },
      { slug: 'videographer', name: 'Videographer', description: 'Produces professional sports video content', displayOrder: 7 },
    ],
  },
  {
    slug: 'analyst', name: 'Analyst', icon: '📊', category: 'individual',
    description: 'Provides data-driven sports analysis and insights',
    displayOrder: 10,
    types: [
      { slug: 'data-analyst', name: 'Data Analyst', description: 'Analyzes sports data and statistics', displayOrder: 1 },
      { slug: 'tactical-analyst', name: 'Tactical Analyst', description: 'Breaks down tactics and strategies', displayOrder: 2 },
      { slug: 'statistician', name: 'Statistician', description: 'Builds statistical models for sports', displayOrder: 3 },
      { slug: 'predictive-analyst', name: 'Predictive Analyst', description: 'Builds predictive models for outcomes', displayOrder: 4 },
    ],
  },
  {
    slug: 'commentator', name: 'Commentator', icon: '🎙️', category: 'individual',
    description: 'Provides live commentary and analysis for broadcasts',
    displayOrder: 11,
    types: [
      { slug: 'tv-commentator', name: 'TV Commentator', description: 'Live match commentary on television', displayOrder: 1 },
      { slug: 'radio-commentator', name: 'Radio Commentator', description: 'Live match commentary on radio', displayOrder: 2 },
      { slug: 'tv-presenter', name: 'TV Presenter', description: 'Hosts sports shows and analysis programs', displayOrder: 3 },
      { slug: 'radio-presenter', name: 'Radio Presenter', description: 'Hosts sports radio shows', displayOrder: 4 },
    ],
  },
  {
    slug: 'agent', name: 'Agent', icon: '🤝', category: 'individual',
    description: 'Represents players, coaches, and other sports professionals',
    displayOrder: 12,
    types: [
      { slug: 'player-agent', name: 'Player Agent', description: 'Represents professional players', displayOrder: 1 },
      { slug: 'coach-agent', name: 'Coach Agent', description: 'Represents coaches and managers', displayOrder: 2 },
      { slug: 'licensed-agent', name: 'Licensed Agent', description: 'FIFA or federation-licensed agent', displayOrder: 3 },
    ],
  },
  {
    slug: 'academy', name: 'Academy', icon: '🎓', category: 'organization',
    description: 'Develops young athletes through training programs',
    displayOrder: 13,
    types: [
      { slug: 'training-center', name: 'Training Center', description: 'Professional training facility', displayOrder: 1 },
      { slug: 'youth-academy', name: 'Youth Academy', description: 'Club-affiliated youth development program', displayOrder: 2 },
      { slug: 'school', name: 'Sports School', description: 'Educational institution with sports programs', displayOrder: 3 },
      { slug: 'college', name: 'College', description: 'College or university sports program', displayOrder: 4 },
    ],
  },
  {
    slug: 'organization', name: 'Organization', icon: '🏢', category: 'organization',
    description: 'Governing bodies, federations, and associations',
    displayOrder: 14,
    types: [
      { slug: 'federation', name: 'Sports Federation', description: 'National or international governing body', displayOrder: 1 },
      { slug: 'olympic-committee', name: 'Olympic Committee', description: 'National Olympic governing body', displayOrder: 2 },
      { slug: 'national-association', name: 'National Association', description: 'National sports association', displayOrder: 3 },
      { slug: 'regional-association', name: 'Regional Association', description: 'Regional or local sports association', displayOrder: 4 },
      { slug: 'ngo', name: 'NGO / Charity', description: 'Non-profit sports organization', displayOrder: 5 },
      { slug: 'government-org', name: 'Government Organization', description: 'Government sports body', displayOrder: 6 },
    ],
  },
  {
    slug: 'competition', name: 'Competition', icon: '🏆', category: 'organization',
    description: 'Sports competitions, tournaments, and cups',
    displayOrder: 15,
    types: [
      { slug: 'domestic-cup', name: 'Domestic Cup', description: 'National knockout cup competition', displayOrder: 1 },
      { slug: 'domestic-league', name: 'Domestic League', description: 'National league competition', displayOrder: 2 },
      { slug: 'continental', name: 'Continental Competition', description: 'Multi-nation continental competition', displayOrder: 3 },
      { slug: 'international-cup', name: 'International Cup', description: 'Worldwide cup competition', displayOrder: 4 },
      { slug: 'youth-competition', name: 'Youth Competition', description: 'Competition for youth teams', displayOrder: 5 },
      { slug: 'women-competition', name: 'Women Competition', description: 'Competition for women teams', displayOrder: 6 },
      { slug: 'tournament', name: 'Tournament', description: 'Single-event tournament format', displayOrder: 7 },
    ],
  },
  {
    slug: 'league', name: 'League', icon: '🎖️', category: 'organization',
    description: 'Sports leagues managing regular-season competitions',
    displayOrder: 16,
    types: [
      { slug: 'top-flight', name: 'Top-Flight League', description: 'Highest division league in a country', displayOrder: 1 },
      { slug: 'second-tier', name: 'Second Tier League', description: 'Second division league', displayOrder: 2 },
      { slug: 'lower-division', name: 'Lower Division League', description: 'Third division and below', displayOrder: 3 },
      { slug: 'semi-pro-league', name: 'Semi-Pro League', description: 'Semi-professional league', displayOrder: 4 },
      { slug: 'amateur-league', name: 'Amateur League', description: 'Amateur or recreational league', displayOrder: 5 },
      { slug: 'youth-league', name: 'Youth League', description: 'League for youth teams', displayOrder: 6 },
    ],
  },
  {
    slug: 'venue', name: 'Venue', icon: '🏟️', category: 'team_entity',
    description: 'Sports venues, stadiums, and facilities',
    displayOrder: 17,
    types: [
      { slug: 'stadium', name: 'Stadium', description: 'Large sports venue with spectator capacity', displayOrder: 1 },
      { slug: 'arena', name: 'Arena', description: 'Indoor sports venue', displayOrder: 2 },
      { slug: 'training-ground', name: 'Training Ground', description: 'Training facility for teams', displayOrder: 3 },
      { slug: 'sports-complex', name: 'Sports Complex', description: 'Multi-purpose sports facility', displayOrder: 4 },
    ],
  },
  {
    slug: 'business', name: 'Business', icon: '💼', category: 'commercial',
    description: 'Sports-related businesses and commercial entities',
    displayOrder: 18,
    types: [
      { slug: 'sportswear', name: 'Sportswear Brand', description: 'Manufactures sports apparel and equipment', displayOrder: 1 },
      { slug: 'sports-media', name: 'Sports Media', description: 'Media company focused on sports content', displayOrder: 2 },
      { slug: 'sports-agency', name: 'Sports Agency', description: 'Manages sports talent and deals', displayOrder: 3 },
      { slug: 'sports-tech', name: 'Sports Technology', description: 'Technology company for sports solutions', displayOrder: 4 },
      { slug: 'sports-nutrition', name: 'Sports Nutrition', description: 'Nutrition and supplement company', displayOrder: 5 },
      { slug: 'sports-retailer', name: 'Sports Retailer', description: 'Retailer of sports equipment and merchandise', displayOrder: 6 },
    ],
  },
  {
    slug: 'commercial-partner', name: 'Commercial Partner', icon: '🤝', category: 'commercial',
    description: 'Sponsors, broadcasters, and commercial partners in sports',
    displayOrder: 19,
    types: [
      { slug: 'sponsor', name: 'Sponsor', description: 'Provides financial support to teams or events', displayOrder: 1 },
      { slug: 'title-sponsor', name: 'Title Sponsor', description: 'Primary sponsor with naming rights', displayOrder: 2 },
      { slug: 'broadcaster', name: 'Broadcaster', description: 'Broadcasts sports content on TV or streaming', displayOrder: 3 },
      { slug: 'streaming-platform', name: 'Streaming Platform', description: 'Digital streaming service for sports', displayOrder: 4 },
      { slug: 'ticketing-provider', name: 'Ticketing Provider', description: 'Manages ticket sales for events', displayOrder: 5 },
      { slug: 'travel-partner', name: 'Travel Partner', description: 'Provides travel services for sports events', displayOrder: 6 },
      { slug: 'data-provider', name: 'Data Provider', description: 'Supplies sports data and statistics', displayOrder: 7 },
      { slug: 'event-organizer', name: 'Event Organizer', description: 'Organizes sports events and tournaments', displayOrder: 8 },
    ],
  },
  {
    slug: 'community', name: 'Community', icon: '👥', category: 'team_entity',
    description: 'Fan communities, supporter groups, and discussion forums',
    displayOrder: 20,
    types: [
      { slug: 'fan-club', name: 'Fan Club', description: 'Official or unofficial fan club', displayOrder: 1 },
      { slug: 'supporters-group', name: 'Supporters Group', description: 'Organized supporters group', displayOrder: 2 },
      { slug: 'discussion-forum', name: 'Discussion Forum', description: 'Online sports discussion community', displayOrder: 3 },
      { slug: 'community-club', name: 'Community Club', description: 'Local community sports club', displayOrder: 4 },
    ],
  },
  {
    slug: 'media-broadcast', name: 'Media Broadcast', icon: '📺', category: 'individual',
    description: 'Media broadcast organizations like BBC Sports, ESPN, Sky Sports etc.',
    displayOrder: 21,
    types: [
      { slug: 'tv-network', name: 'TV Network', description: 'Television sports broadcasting network', displayOrder: 1 },
      { slug: 'radio-network', name: 'Radio Network', description: 'Radio sports broadcasting network', displayOrder: 2 },
      { slug: 'digital-platform', name: 'Digital Platform', description: 'Digital/streaming sports media platform', displayOrder: 3 },
      { slug: 'news-agency', name: 'News Agency', description: 'Sports news agency wire service', displayOrder: 4 },
    ],
  },
  {
    slug: 'moderator', name: 'Moderator', icon: '🛡️', category: 'admin',
    description: 'Moderates content and community interactions',
    displayOrder: 22,
    types: [
      { slug: 'content-moderator', name: 'Content Moderator', description: 'Reviews and moderates user-generated content', displayOrder: 1 },
      { slug: 'community-moderator', name: 'Community Moderator', description: 'Moderates community discussions', displayOrder: 2 },
    ],
  },
  {
    slug: 'administrator', name: 'Administrator', icon: '👑', category: 'admin',
    description: 'Platform administrators with management privileges',
    displayOrder: 23,
    types: [
      { slug: 'super-admin', name: 'Super Administrator', description: 'Full platform access and control', displayOrder: 1 },
      { slug: 'platform-admin', name: 'Platform Administrator', description: 'Manages platform configuration', displayOrder: 2 },
      { slug: 'sports-admin', name: 'Sports Administrator', description: 'Manages sports data and content', displayOrder: 3 },
      { slug: 'verification-admin', name: 'Verification Administrator', description: 'Reviews and processes verification requests', displayOrder: 4 },
      { slug: 'user-admin', name: 'User Administrator', description: 'Manages user accounts and support', displayOrder: 5 },
      { slug: 'media-admin', name: 'Media Administrator', description: 'Manages media content and publishing', displayOrder: 6 },
      { slug: 'developer-admin', name: 'Developer Administrator', description: 'Manages API and technical integrations', displayOrder: 7 },
      { slug: 'read-only-auditor', name: 'Read Only Auditor', description: 'Read-only access for auditing purposes', displayOrder: 8 },
    ],
  },
];

// ─── Sports ────────────────────────────────────────────────────────
const SPORTS = [
  { name: 'Football', slug: 'football', icon: '⚽', category: 'team_sport', displayOrder: 1 },
  { name: 'Basketball', slug: 'basketball', icon: '🏀', category: 'team_sport', displayOrder: 2 },
  { name: 'Tennis', slug: 'tennis', icon: '🎾', category: 'racquet', displayOrder: 3 },
  { name: 'Cricket', slug: 'cricket', icon: '🏏', category: 'team_sport', displayOrder: 4 },
  { name: 'Rugby', slug: 'rugby', icon: '🏉', category: 'team_sport', displayOrder: 5 },
  { name: 'Boxing', slug: 'boxing', icon: '🥊', category: 'combat', displayOrder: 6 },
  { name: 'MMA', slug: 'mma', icon: '🥋', category: 'combat', displayOrder: 7 },
  { name: 'Formula 1', slug: 'f1', icon: '🏎️', category: 'motorsport', displayOrder: 8 },
  { name: 'Athletics', slug: 'athletics', icon: '🏃', category: 'individual', displayOrder: 9 },
  { name: 'Swimming', slug: 'swimming', icon: '🏊', category: 'water', displayOrder: 10 },
  { name: 'Golf', slug: 'golf', icon: '⛳', category: 'individual', displayOrder: 11 },
  { name: 'Baseball', slug: 'baseball', icon: '⚾', category: 'team_sport', displayOrder: 12 },
  { name: 'Volleyball', slug: 'volleyball', icon: '🏐', category: 'team_sport', displayOrder: 13 },
  { name: 'Handball', slug: 'handball', icon: '🤾', category: 'team_sport', displayOrder: 14 },
  { name: 'Cycling', slug: 'cycling', icon: '🚴', category: 'individual', displayOrder: 15 },
  { name: 'Esports', slug: 'esports', icon: '🎮', category: 'team_sport', displayOrder: 16 },
  { name: 'Hockey', slug: 'hockey', icon: '🏑', category: 'team_sport', displayOrder: 17 },
  { name: 'Wrestling', slug: 'wrestling', icon: '🤼', category: 'combat', displayOrder: 18 },
  { name: 'Table Tennis', slug: 'table-tennis', icon: '🏓', category: 'racquet', displayOrder: 19 },
  { name: 'Badminton', slug: 'badminton', icon: '🏸', category: 'racquet', displayOrder: 20 },
];

async function main() {
  console.log('Seeding Roles, RoleTypes, and Sports...\n');

  // ── Seed Roles + RoleTypes ────────────────────────────────────
  for (const role of ROLES) {
    const created = await prisma.role.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        icon: role.icon,
        category: role.category,
        description: role.description,
        displayOrder: role.displayOrder,
        isActive: true,
      },
      create: {
        slug: role.slug,
        name: role.name,
        icon: role.icon,
        category: role.category,
        description: role.description,
        displayOrder: role.displayOrder,
        isActive: true,
      },
    });

    console.log(`  Role: ${created.name} (${created.slug}) [${created.id}]`);

    for (const type of role.types) {
      const createdType = await prisma.roleType.upsert({
        where: {
          roleId_slug: { roleId: created.id, slug: type.slug },
        },
        update: {
          name: type.name,
          description: type.description,
          displayOrder: type.displayOrder,
          isActive: true,
        },
        create: {
          roleId: created.id,
          slug: type.slug,
          name: type.name,
          description: type.description,
          displayOrder: type.displayOrder,
          isActive: true,
        },
      });
      console.log(`    Type: ${createdType.name} (${createdType.slug})`);
    }
  }

  // ── Seed Sports ───────────────────────────────────────────────
  console.log('\nSeeding Sports...');
  for (const sport of SPORTS) {
    const created = await prisma.sport.upsert({
      where: { slug: sport.slug },
      update: {
        name: sport.name,
        icon: sport.icon,
        category: sport.category,
        displayOrder: sport.displayOrder,
        isActive: true,
      },
      create: {
        slug: sport.slug,
        name: sport.name,
        icon: sport.icon,
        category: sport.category,
        displayOrder: sport.displayOrder,
        isActive: true,
      },
    });
    console.log(`  Sport: ${created.name} (${created.slug})`);
  }

  // ── Migrate existing users to normalized Role/Type ────────────
  console.log('\nMigrating existing users to normalized Role/Type...');

  // Find the Fan role and Casual Fan type
  const fanRole = await prisma.role.findUnique({ where: { slug: 'fan' } });
  const casualType = fanRole
    ? await prisma.roleType.findFirst({ where: { roleId: fanRole.id, slug: 'casual' } })
    : null;

  if (fanRole && casualType) {
    // Update all users that still have the default placeholder IDs
    const result = await prisma.user.updateMany({
      where: {
        roleId: 'fan-default-role',
      },
      data: {
        roleId: fanRole.id,
        roleTypeId: casualType.id,
      },
    });
    console.log(`  Updated ${result.count} users to Fan/Casual Fan`);

    // Also update users whose role field is 'fan' but roleId might be wrong
    const fanResult = await prisma.user.updateMany({
      where: {
        role: 'fan',
        roleId: 'fan-default-role',
      },
      data: {
        roleId: fanRole.id,
        roleTypeId: casualType.id,
      },
    });
    console.log(`  Updated ${fanResult.count} additional fan users`);
  }

  // ── Stats ─────────────────────────────────────────────────────
  const roleCount = await prisma.role.count();
  const typeCount = await prisma.roleType.count();
  const sportCount = await prisma.sport.count();
  console.log(`\n✅ Done! ${roleCount} roles, ${typeCount} types, ${sportCount} sports`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
