-- SportSphere Supabase Schema
-- Generated from Prisma schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "role" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '👤',
  category TEXT DEFAULT 'individual',
  displayOrder INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_type (
  id TEXT PRIMARY KEY,
  roleId TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  requirements JSONB DEFAULT '[]',
  displayOrder INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sport (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  icon TEXT,
  sportType TEXT,
  contactType TEXT,
  description TEXT DEFAULT '[]',
  isActive BOOLEAN DEFAULT TRUE,
  displayOrder INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sport (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  handle TEXT NOT NULL DEFAULT '',
  passwordHash TEXT,
  resetTokenExpiry TIMESTAMPTZ,
  avatarInitials TEXT DEFAULT 'fan',
  verificationStatus TEXT DEFAULT 'none',
  isVerified BOOLEAN DEFAULT FALSE,
  bio TEXT,
  coverGradient TEXT DEFAULT 'from-emerald-600 to-emerald-900',
  followerCount INTEGER DEFAULT 0,
  fanCount INTEGER DEFAULT 0,
  followingCount INTEGER DEFAULT 0,
  postCount INTEGER DEFAULT 0,
  registeredAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW(),
  lastSeenAt TIMESTAMPTZ DEFAULT NOW(),
  aboutMe TEXT,
  countryOfOrigin TEXT,
  currentCountry TEXT,
  emailVerified BOOLEAN DEFAULT FALSE,
  emailVerifyExpiry TIMESTAMPTZ,
  fontSize TEXT DEFAULT 'medium',
  gender TEXT DEFAULT FALSE,
  interests JSONB DEFAULT '[]',
  isPro BOOLEAN DEFAULT FALSE,
  nationality TEXT
);

CREATE TABLE IF NOT EXISTS follow (
  followerId TEXT NOT NULL DEFAULT '',
  kind TEXT DEFAULT 'fan',
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  postType TEXT DEFAULT 'post',
  teamTag TEXT,
  isBreaking BOOLEAN DEFAULT FALSE,
  likeCount INTEGER DEFAULT 0,
  commentCount INTEGER DEFAULT 0,
  shareCount INTEGER DEFAULT 0,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW(),
  hashtags JSONB DEFAULT '[]',
  location TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS post_like (
  postId TEXT NOT NULL DEFAULT '',
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "comment" (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  parentId TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS comment_like (
  commentId TEXT NOT NULL DEFAULT '',
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL DEFAULT '',
  question TEXT DEFAULT 0,
  endsAt TIMESTAMPTZ DEFAULT NOW(),
  options JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS poll_vote (
  id TEXT PRIMARY KEY,
  pollId TEXT NOT NULL DEFAULT '',
  optionIdx INTEGER DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "match" (
  id TEXT PRIMARY KEY,
  league TEXT NOT NULL DEFAULT '',
  awayTeam TEXT NOT NULL DEFAULT '',
  awayScore INTEGER DEFAULT 'upcoming',
  minute INTEGER,
  kickoffAt TIMESTAMPTZ DEFAULT 'Europe',
  country TEXT DEFAULT 'England',
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW(),
  events JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS prediction (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  homeTeam TEXT NOT NULL DEFAULT '',
  predictedHome INTEGER,
  result TEXT,
  pointsEarned INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  confidence TEXT
);

CREATE TABLE IF NOT EXISTS community (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  topic TEXT DEFAULT 0,
  createdById TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_member (
  communityId TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT 'member',
  joinedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  isRead BOOLEAN DEFAULT FALSE,
  actorId TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message (
  id TEXT PRIMARY KEY,
  senderId TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT FALSE,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_request (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'pending',
  adminNotes TEXT,
  submittedAt TIMESTAMPTZ DEFAULT NOW(),
  reviewedAt TIMESTAMPTZ,
  roleTypeId TEXT
);

CREATE TABLE IF NOT EXISTS leaderboard_entry (
  id TEXT PRIMARY KEY,
  userId TEXT DEFAULT 'monthly',
  correctPredictions INTEGER DEFAULT 0,
  totalPredictions INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_favorite (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  targetId TEXT NOT NULL DEFAULT '',
  targetHandle TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_profile (
  userId TEXT PRIMARY KEY,
  position TEXT,
  preferredFoot TEXT,
  height DOUBLE PRECISION,
  dateOfBirth TIMESTAMPTZ,
  playerType TEXT,
  appearances DOUBLE PRECISION,
  minutes DOUBLE PRECISION,
  assists DOUBLE PRECISION,
  redCards DOUBLE PRECISION,
  motm DOUBLE PRECISION,
  chancesCreated DOUBLE PRECISION,
  shotsOnTarget DOUBLE PRECISION,
  interceptions DOUBLE PRECISION,
  aerialDuels DOUBLE PRECISION,
  saves DOUBLE PRECISION,
  goalsConceded DOUBLE PRECISION,
  currentClub TEXT,
  contractStatus TEXT,
  debutYear TEXT,
  internationalCaps DOUBLE PRECISION,
  transferHistory TEXT,
  playingStyle TEXT,
  weaknesses TEXT NOT NULL DEFAULT '',
  injuryHistory TEXT,
  ranking TEXT DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_profile (
  userId TEXT PRIMARY KEY,
  coachingRole TEXT,
  license TEXT,
  nationality TEXT,
  yearsCoaching DOUBLE PRECISION,
  wins DOUBLE PRECISION,
  losses DOUBLE PRECISION,
  goalsAgainst DOUBLE PRECISION,
  pointsPerGame DOUBLE PRECISION,
  preferredFormation TEXT,
  playingPhilosophy TEXT,
  possessionStyle TEXT,
  buildUpStyle TEXT,
  nationalTeams TEXT,
  playingCareer TEXT DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_profile (
  userId TEXT PRIMARY KEY,
  nickname TEXT,
  country TEXT,
  stadium TEXT,
  league TEXT,
  coach TEXT,
  colors TEXT,
  wins DOUBLE PRECISION,
  losses DOUBLE PRECISION,
  goalsAgainst DOUBLE PRECISION,
  position TEXT,
  squad TEXT,
  historicPlayers TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scout_profile (
  userId TEXT PRIMARY KEY,
  scoutType TEXT,
  geographicCoverage TEXT,
  yearsExperience DOUBLE PRECISION,
  playersDiscovered DOUBLE PRECISION,
  successfulSignings DOUBLE PRECISION,
  competitionsMonitored DOUBLE PRECISION,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journalist_profile (
  userId TEXT PRIMARY KEY,
  publication TEXT,
  location TEXT,
  languages TEXT NOT NULL DEFAULT '',
  coverage TEXT NOT NULL DEFAULT '',
  articleCount DOUBLE PRECISION,
  interviews DOUBLE PRECISION,
  totalViews TEXT,
  articles TEXT DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_profile (
  userId TEXT PRIMARY KEY,
  creatorType TEXT,
  niche TEXT,
  audienceAgeRange TEXT,
  languages TEXT NOT NULL DEFAULT '',
  followers TEXT,
  avgViews TEXT,
  postsPerWeek DOUBLE PRECISION,
  brandCollabs TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyst_profile (
  userId TEXT PRIMARY KEY,
  analystType TEXT,
  expertise TEXT NOT NULL DEFAULT '',
  reportsPublished DOUBLE PRECISION,
  teamsAnalyzed DOUBLE PRECISION,
  topModels TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commentator_profile (
  userId TEXT PRIMARY KEY,
  commentatorType TEXT,
  languages TEXT NOT NULL DEFAULT '',
  sports TEXT NOT NULL DEFAULT '',
  yearsActive DOUBLE PRECISION,
  competitions DOUBLE PRECISION,
  majorEvents TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_profile (
  userId TEXT PRIMARY KEY,
  agentType TEXT,
  license TEXT,
  countries TEXT NOT NULL DEFAULT '',
  playersRepresented DOUBLE PRECISION,
  transfersCompleted DOUBLE PRECISION,
  activeNegotiations DOUBLE PRECISION,
  clientRoster TEXT DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_profile (
  userId TEXT PRIMARY KEY,
  orgType TEXT,
  headquarters TEXT,
  leadership TEXT,
  affiliates TEXT,
  programs TEXT DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competition_profile (
  userId TEXT PRIMARY KEY,
  competitionName TEXT,
  organizer TEXT,
  level TEXT,
  participants DOUBLE PRECISION,
  topAssists TEXT,
  fixtures TEXT,
  records TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS league_profile (
  userId TEXT PRIMARY KEY,
  leagueName TEXT,
  division TEXT,
  foundedYear TEXT,
  teams DOUBLE PRECISION,
  topScorer TEXT,
  avgGoals DOUBLE PRECISION,
  allTimeTopScorer TEXT,
  standings TEXT,
  champions TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academy_profile (
  userId TEXT PRIMARY KEY,
  academyName TEXT,
  location TEXT,
  director TEXT,
  curriculum TEXT,
  playersPromoted DOUBLE PRECISION,
  scholarships DOUBLE PRECISION,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venue_profile (
  userId TEXT PRIMARY KEY,
  venueName TEXT,
  location TEXT,
  surface TEXT,
  owner TEXT,
  facilities TEXT NOT NULL DEFAULT '',
  tenants TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_profile (
  userId TEXT PRIMARY KEY,
  companyName TEXT,
  foundedYear TEXT,
  website TEXT,
  products TEXT,
  partnerAthletes TEXT,
  campaigns TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_partner_profile (
  userId TEXT PRIMARY KEY,
  partnerType TEXT,
  sportsCategory TEXT,
  foundedYear TEXT,
  website TEXT,
  sponsoredPlayers TEXT,
  sponsoredEvents TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_profile (
  userId TEXT PRIMARY KEY,
  communityName TEXT,
  foundedYear TEXT,
  supportedTeam TEXT,
  memberCount DOUBLE PRECISION,
  eventCount DOUBLE PRECISION,
  events TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_profile (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  performanceScore DOUBLE PRECISION DEFAULT 0,
  totalPoints INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'D',
  formScore DOUBLE PRECISION DEFAULT 0,
  consistencyScore DOUBLE PRECISION DEFAULT 0,
  trendDirection TEXT DEFAULT 'stable',
  trendDelta DOUBLE PRECISION DEFAULT 0,
  improvementScore DOUBLE PRECISION DEFAULT 0,
  rankGlobal INTEGER DEFAULT 0,
  rankCountry INTEGER DEFAULT 0,
  rankRegion INTEGER DEFAULT 0,
  rankCategory INTEGER DEFAULT 0,
  rankPosition INTEGER DEFAULT 0,
  rankCompetition INTEGER DEFAULT 0,
  rankForm INTEGER DEFAULT 0,
  rankSeason INTEGER DEFAULT 0,
  rankCareer INTEGER DEFAULT 0,
  rankImprovement INTEGER DEFAULT 0,
  rankConsistency INTEGER DEFAULT 0,
  rankMovement INTEGER DEFAULT 0,
  categoryBucket TEXT NOT NULL DEFAULT '',
  position TEXT,
  competitionTier TEXT,
  nextMilestonePoints INTEGER DEFAULT 0,
  nextMilestoneRank INTEGER DEFAULT 0,
  pointsAheadOfNext INTEGER DEFAULT 0,
  pointsBehindNext INTEGER DEFAULT 0,
  dataConfidence DOUBLE PRECISION DEFAULT 0,
  decayStatus TEXT DEFAULT 'active',
  decayPauseReason TEXT,
  lastEventAt TIMESTAMPTZ,
  lastRankComputedAt TIMESTAMPTZ DEFAULT '[]',
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_event (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  eventType TEXT DEFAULT 1,
  matchId TEXT,
  competition TEXT,
  season TEXT,
  opponentStrength DOUBLE PRECISION,
  matchDate TIMESTAMPTZ DEFAULT 'manual',
  sourceUserId TEXT DEFAULT 'pending',
  verifiedBy TEXT,
  rejectionReason TEXT DEFAULT 0,
  notes TEXT DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  type TEXT DEFAULT 'city',
  parentId TEXT,
  latitude DOUBLE PRECISION,
  displayLabel TEXT NOT NULL DEFAULT '',
  population INTEGER DEFAULT FALSE,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach (
  id TEXT PRIMARY KEY,
  teamId TEXT,
  sportId TEXT,
  slug TEXT NOT NULL DEFAULT '',
  firstName TEXT,
  nationality TEXT,
  photoUrl TEXT,
  role TEXT DEFAULT 'head_coach',
  externalId TEXT,
  verified BOOLEAN DEFAULT FALSE,
  createdByAI BOOLEAN DEFAULT FALSE,
  claimedById TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS league (
  id TEXT PRIMARY KEY,
  sportId TEXT,
  slug TEXT NOT NULL DEFAULT '',
  country TEXT,
  logoUrl TEXT DEFAULT 'league',
  season TEXT,
  source TEXT DEFAULT FALSE,
  createdByAI BOOLEAN DEFAULT FALSE,
  claimedById TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS match_profile (
  id TEXT PRIMARY KEY,
  leagueId TEXT,
  homeTeamId TEXT,
  homeTeamName TEXT NOT NULL DEFAULT '',
  homeScore INTEGER,
  status TEXT DEFAULT 'upcoming',
  minute INTEGER,
  venue TEXT,
  events JSONB DEFAULT '[]',
  externalId TEXT,
  createdByAI BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS news_item (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  imageUrl TEXT,
  imageOwnerUrl TEXT DEFAULT 'general',
  tags JSONB DEFAULT '[]',
  sportId TEXT,
  teamId TEXT,
  coachId TEXT DEFAULT 'manual',
  externalUrl TEXT DEFAULT FALSE,
  aiJobId TEXT DEFAULT 'draft',
  publishedAt TIMESTAMPTZ,
  viewCount INTEGER DEFAULT 0,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS player (
  id TEXT PRIMARY KEY,
  teamId TEXT,
  sportId TEXT,
  slug TEXT NOT NULL DEFAULT '',
  firstName TEXT,
  position TEXT,
  countryCode TEXT,
  dateOfBirth TIMESTAMPTZ,
  weightKg INTEGER,
  externalId TEXT,
  verified BOOLEAN DEFAULT FALSE,
  createdByAI BOOLEAN DEFAULT FALSE,
  claimedById TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS rumor (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body TEXT DEFAULT 'ai',
  externalUrl TEXT DEFAULT 50,
  tags JSONB DEFAULT '[]',
  sportId TEXT,
  teamId TEXT,
  coachId TEXT DEFAULT FALSE,
  aiJobId TEXT DEFAULT 'draft',
  publishedAt TIMESTAMPTZ,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS team (
  id TEXT PRIMARY KEY,
  leagueId TEXT,
  name TEXT NOT NULL DEFAULT '',
  shortName TEXT,
  country TEXT,
  logoUrl TEXT,
  foundedYear INTEGER,
  source TEXT DEFAULT FALSE,
  createdByAI BOOLEAN DEFAULT FALSE,
  claimedById TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS player_transfer (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  playerId TEXT NOT NULL DEFAULT '',
  toTeamId TEXT DEFAULT 'permanent',
  fee TEXT DEFAULT 'EUR',
  announcedAt TIMESTAMPTZ DEFAULT NOW(),
  effectiveAt TIMESTAMPTZ DEFAULT NOW(),
  window TEXT,
  season TEXT,
  loanUntil TIMESTAMPTZ DEFAULT 'completed',
  notes TEXT,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS push_token (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  platform TEXT DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  type TEXT DEFAULT 'brand',
  website TEXT,
  country TEXT,
  source TEXT DEFAULT 'admin',
  verified BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS business_team (
  id TEXT PRIMARY KEY,
  businessId TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT 'sponsor',
  notes TEXT DEFAULT TRUE,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS business_player (
  id TEXT PRIMARY KEY,
  businessId TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT 'endorsement',
  notes TEXT DEFAULT TRUE,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS business_coach (
  id TEXT PRIMARY KEY,
  businessId TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT 'partner',
  notes TEXT DEFAULT TRUE,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS commercial_partner (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  partnerType TEXT DEFAULT 'brand',
  industry TEXT,
  website TEXT,
  coverUrl TEXT,
  city TEXT,
  contactName TEXT,
  contactEmail TEXT,
  contractStart TIMESTAMPTZ,
  contractEnd TIMESTAMPTZ,
  contractValue DOUBLE PRECISION,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  tier TEXT DEFAULT 'bronze',
  isActive BOOLEAN DEFAULT TRUE,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS partner_sponsorship (
  id TEXT PRIMARY KEY,
  partnerId TEXT NOT NULL DEFAULT '',
  entityId TEXT NOT NULL DEFAULT '',
  sponsorshipType TEXT DEFAULT 'sponsor',
  startDate TIMESTAMPTZ,
  value DOUBLE PRECISION,
  currency TEXT DEFAULT 'USD',
  isVisible BOOLEAN DEFAULT TRUE,
  displayLabel TEXT,
  notes TEXT DEFAULT TRUE,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Storage Buckets ──────────────────────────────────────────────────────────
-- Run in Supabase SQL Editor or via Dashboard > Storage

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('covers',  'covers',  true),
  ('posts',   'posts',   true),
  ('media',   'media',   true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "posts_public_read"   ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "posts_auth_upload"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.uid() IS NOT NULL);
CREATE POLICY "covers_public_read"  ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "covers_auth_upload"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid() IS NOT NULL);
CREATE POLICY "media_public_read"   ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media_auth_upload"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);
