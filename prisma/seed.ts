// SportSphere — Database Seed Script
// Populates Role, RoleType, and Sport tables with spec-defined data.
// Run: npx prisma db seed
// Or:  npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── ROLES & TYPES ─────────────────────────────────────────────
// Spec: Phase 10 — "Use ALL 20 Roles. Use ALL Types. Do NOT omit any."
// Categories: individual, team_entity, organization, commercial, official, support, admin

const ROLES = [
  // ─── INDIVIDUAL ──────────────────────────────────────────────
  {
    name: 'Fan', slug: 'fan', icon: '⭐', category: 'individual', displayOrder: 1,
    description: 'The heart of SportSphere — passionate supporters who follow teams, players, and sports.',
    types: [
      { name: 'Casual Fan', slug: 'casual', description: 'Follows sports casually', displayOrder: 1, requirements: [] },
      { name: 'Die-hard Fan', slug: 'diehard', description: 'Devoted supporter of specific teams', displayOrder: 2, requirements: [{ key: 'favoriteTeam', label: 'Favorite Team', type: 'text' }] },
      { name: 'Ultra Fan', slug: 'ultra', description: 'Ultra supporter group member', displayOrder: 3, requirements: [{ key: 'group', label: 'Ultra Group', type: 'text' }] },
      { name: 'Super Fan', slug: 'super', description: 'Verified super fan with official recognition', displayOrder: 4, requirements: [{ key: 'proof', label: 'Proof of Super Fan Status', type: 'text' }] },
    ],
  },
  {
    name: 'Player', slug: 'player', icon: '⚽', category: 'individual', displayOrder: 2,
    description: 'Professional or amateur athletes who compete in sports.',
    types: [
      { name: 'Professional', slug: 'professional', description: 'Professional athlete', displayOrder: 1, requirements: [{ key: 'currentClub', label: 'Current Club', type: 'text' }, { key: 'position', label: 'Position', type: 'text' }, { key: 'transferStatus', label: 'Transfer Status', type: 'select', options: ['Free Agent', 'Under Contract', 'On Loan', 'Transfer Listed'] }] },
      { name: 'Amateur', slug: 'amateur', description: 'Amateur athlete', displayOrder: 2, requirements: [{ key: 'club', label: 'Club', type: 'text' }, { key: 'position', label: 'Position', type: 'text' }] },
      { name: 'Youth', slug: 'youth', description: 'Youth academy player', displayOrder: 3, requirements: [{ key: 'academy', label: 'Academy', type: 'text' }, { key: 'position', label: 'Position', type: 'text' }] },
      { name: 'Retired', slug: 'retired', description: 'Former professional athlete', displayOrder: 4, requirements: [{ key: 'lastClub', label: 'Last Club', type: 'text' }] },
    ],
  },
  {
    name: 'Coach', slug: 'coach', icon: '📋', category: 'individual', displayOrder: 3,
    description: 'Managers and coaches who lead teams and develop players.',
    types: [
      { name: 'Head Coach', slug: 'head-coach', description: 'Head coach / manager', displayOrder: 1, requirements: [{ key: 'license', label: 'License', type: 'text' }, { key: 'team', label: 'Team', type: 'text' }] },
      { name: 'Assistant Coach', slug: 'assistant-coach', description: 'Assistant coach', displayOrder: 2, requirements: [{ key: 'team', label: 'Team', type: 'text' }] },
      { name: 'Youth Coach', slug: 'youth-coach', description: 'Youth team coach', displayOrder: 3, requirements: [{ key: 'academy', label: 'Academy', type: 'text' }] },
      { name: 'Fitness Coach', slug: 'fitness-coach', description: 'Fitness and conditioning coach', displayOrder: 4, requirements: [{ key: 'certification', label: 'Certification', type: 'text' }] },
    ],
  },
  {
    name: 'Scout', slug: 'scout', icon: '🔍', category: 'individual', displayOrder: 4,
    description: 'Talent identification professionals who discover and evaluate players.',
    types: [
      { name: 'Chief Scout', slug: 'chief-scout', description: 'Head of scouting department', displayOrder: 1, requirements: [{ key: 'club', label: 'Club', type: 'text' }, { key: 'experience', label: 'Years of Experience', type: 'number' }] },
      { name: 'Talent Scout', slug: 'talent-scout', description: 'Identifies emerging talent', displayOrder: 2, requirements: [{ key: 'coverage', label: 'Coverage Area', type: 'text' }] },
      { name: 'Recruitment Manager', slug: 'recruitment-manager', description: 'Manages recruitment operations', displayOrder: 3, requirements: [{ key: 'club', label: 'Club', type: 'text' }] },
    ],
  },
  {
    name: 'Journalist', slug: 'journalist', icon: '📰', category: 'individual', displayOrder: 5,
    description: 'Sports media professionals who report, analyze, and comment on sports.',
    types: [
      { name: 'Reporter', slug: 'reporter', description: 'Sports news reporter', displayOrder: 1, requirements: [{ key: 'mediaHouse', label: 'Media House', type: 'text' }] },
      { name: 'Columnist', slug: 'columnist', description: 'Sports opinion columnist', displayOrder: 2, requirements: [{ key: 'publication', label: 'Publication', type: 'text' }] },
      { name: 'Commentator', slug: 'commentator', description: 'Live match commentator', displayOrder: 3, requirements: [{ key: 'broadcaster', label: 'Broadcaster', type: 'text' }] },
      { name: 'Podcaster', slug: 'podcaster', description: 'Sports podcast host', displayOrder: 4, requirements: [{ key: 'podcastName', label: 'Podcast Name', type: 'text' }] },
    ],
  },
  {
    name: 'Creator', slug: 'creator', icon: '🎬', category: 'individual', displayOrder: 6,
    description: 'Content creators who produce sports-related digital content.',
    types: [
      { name: 'YouTuber', slug: 'youtuber', description: 'Sports YouTube content creator', displayOrder: 1, requirements: [{ key: 'channel', label: 'Channel Name', type: 'text' }] },
      { name: 'Streamer', slug: 'streamer', description: 'Live sports streamer', displayOrder: 2, requirements: [{ key: 'platform', label: 'Platform', type: 'text' }] },
      { name: 'Influencer', slug: 'influencer', description: 'Sports social media influencer', displayOrder: 3, requirements: [{ key: 'platforms', label: 'Platforms', type: 'text' }] },
      { name: 'Graphic Designer', slug: 'graphic-designer', description: 'Sports graphic designer', displayOrder: 4, requirements: [{ key: 'portfolio', label: 'Portfolio URL', type: 'text' }] },
    ],
  },
  {
    name: 'Analyst', slug: 'analyst', icon: '📊', category: 'individual', displayOrder: 7,
    description: 'Data and performance analysts who provide sports insights.',
    types: [
      { name: 'Performance Analyst', slug: 'performance-analyst', description: 'Analyzes player/team performance', displayOrder: 1, requirements: [{ key: 'club', label: 'Club', type: 'text' }] },
      { name: 'Data Scientist', slug: 'data-scientist', description: 'Sports data scientist', displayOrder: 2, requirements: [{ key: 'specialization', label: 'Specialization', type: 'text' }] },
      { name: 'Tactical Analyst', slug: 'tactical-analyst', description: 'Tactical analysis specialist', displayOrder: 3, requirements: [{ key: 'experience', label: 'Experience', type: 'text' }] },
      { name: 'Video Analyst', slug: 'video-analyst', description: 'Video analysis specialist', displayOrder: 4, requirements: [{ key: 'club', label: 'Club', type: 'text' }] },
    ],
  },
  {
    name: 'Agent', slug: 'agent', icon: '🤝', category: 'individual', displayOrder: 8,
    description: 'Licensed agents who represent players and coaches in negotiations.',
    types: [
      { name: 'Player Agent', slug: 'player-agent', description: 'Represents players', displayOrder: 1, requirements: [{ key: 'license', label: 'License Number', type: 'text' }] },
      { name: 'Coach Agent', slug: 'coach-agent', description: 'Represents coaches', displayOrder: 2, requirements: [{ key: 'license', label: 'License Number', type: 'text' }] },
      { name: 'Licensed Agent', slug: 'licensed-agent', description: 'FIFA/FA licensed agent', displayOrder: 3, requirements: [{ key: 'license', label: 'License Number', type: 'text' }, { key: 'federation', label: 'Federation', type: 'text' }] },
    ],
  },
  // ─── OFFICIAL ────────────────────────────────────────────────
  {
    name: 'Official', slug: 'official', icon: '⚖️', category: 'official', displayOrder: 9,
    description: 'Match officials who govern and officiate competitions.',
    types: [
      { name: 'Referee', slug: 'referee', description: 'Match referee', displayOrder: 1, requirements: [{ key: 'license', label: 'License', type: 'text' }, { key: 'level', label: 'Level', type: 'text' }] },
      { name: 'Assistant Referee', slug: 'assistant-referee', description: 'Linesman / assistant referee', displayOrder: 2, requirements: [{ key: 'license', label: 'License', type: 'text' }] },
      { name: 'VAR Official', slug: 'var-official', description: 'Video Assistant Referee', displayOrder: 3, requirements: [{ key: 'license', label: 'License', type: 'text' }] },
      { name: 'Judge', slug: 'judge', description: 'Competition judge', displayOrder: 4, requirements: [{ key: 'sport', label: 'Sport', type: 'text' }] },
      { name: 'Umpire', slug: 'umpire', description: 'Cricket/baseball umpire', displayOrder: 5, requirements: [{ key: 'certification', label: 'Certification', type: 'text' }] },
    ],
  },
  // ─── SUPPORT ────────────────────────────────────────────────
  {
    name: 'Medical', slug: 'medical', icon: '🏥', category: 'support', displayOrder: 10,
    description: 'Medical professionals who support athlete health and performance.',
    types: [
      { name: 'Physician', slug: 'physician', description: 'Team physician', displayOrder: 1, requirements: [{ key: 'license', label: 'Medical License', type: 'text' }] },
      { name: 'Physiotherapist', slug: 'physiotherapist', description: 'Sports physiotherapist', displayOrder: 2, requirements: [{ key: 'license', label: 'License', type: 'text' }] },
      { name: 'Nutritionist', slug: 'nutritionist', description: 'Sports nutritionist', displayOrder: 3, requirements: [{ key: 'certification', label: 'Certification', type: 'text' }] },
      { name: 'Psychologist', slug: 'psychologist', description: 'Sports psychologist', displayOrder: 4, requirements: [{ key: 'license', label: 'License', type: 'text' }] },
    ],
  },
  // ─── TEAM / ENTITY ──────────────────────────────────────────
  {
    name: 'Team', slug: 'team', icon: '🏟️', category: 'team_entity', displayOrder: 11,
    description: 'Sports teams and clubs competing in leagues and competitions.',
    types: [
      { name: 'Professional Club', slug: 'professional-club', description: 'Professional sports club', displayOrder: 1, requirements: [{ key: 'league', label: 'League', type: 'text' }, { key: 'founded', label: 'Founded Year', type: 'number' }] },
      { name: 'National Team', slug: 'national-team', description: 'National sports team', displayOrder: 2, requirements: [{ key: 'country', label: 'Country', type: 'text' }] },
      { name: 'Youth Team', slug: 'youth-team', description: 'Youth team / reserves', displayOrder: 3, requirements: [{ key: 'parentClub', label: 'Parent Club', type: 'text' }] },
      { name: 'Esports Team', slug: 'esports-team', description: 'Esports organization', displayOrder: 4, requirements: [{ key: 'game', label: 'Game', type: 'text' }] },
    ],
  },
  {
    name: 'Academy', slug: 'academy', icon: '🎓', category: 'team_entity', displayOrder: 12,
    description: 'Sports academies and training centers that develop young talent.',
    types: [
      { name: 'Football Academy', slug: 'football-academy', description: 'Football/soccer academy', displayOrder: 1, requirements: [{ key: 'affiliation', label: 'Club Affiliation', type: 'text' }] },
      { name: 'Training Center', slug: 'training-center', description: 'Multi-sport training center', displayOrder: 2, requirements: [{ key: 'sports', label: 'Sports Offered', type: 'text' }] },
      { name: 'School', slug: 'school', description: 'Sports school', displayOrder: 3, requirements: [{ key: 'schoolName', label: 'School Name', type: 'text' }] },
    ],
  },
  // ─── ORGANIZATION ───────────────────────────────────────────
  {
    name: 'Organization', slug: 'organization', icon: '🏛️', category: 'organization', displayOrder: 13,
    description: 'Sports governing bodies, federations, and associations.',
    types: [
      { name: 'Sports Federation', slug: 'sports-federation', description: 'National or international federation', displayOrder: 1, requirements: [{ key: 'name', label: 'Federation Name', type: 'text' }] },
      { name: 'Olympic Committee', slug: 'olympic-committee', description: 'National Olympic committee', displayOrder: 2, requirements: [{ key: 'country', label: 'Country', type: 'text' }] },
      { name: 'National Association', slug: 'national-association', description: 'National sports association', displayOrder: 3, requirements: [{ key: 'sport', label: 'Sport', type: 'text' }] },
      { name: 'NGO', slug: 'ngo', description: 'Sports non-governmental organization', displayOrder: 4, requirements: [{ key: 'mission', label: 'Mission', type: 'text' }] },
    ],
  },
  {
    name: 'Competition', slug: 'competition', icon: '🏆', category: 'organization', displayOrder: 14,
    description: 'Leagues, tournaments, and competitive events.',
    types: [
      { name: 'League', slug: 'league', description: 'Sports league', displayOrder: 1, requirements: [{ key: 'country', label: 'Country', type: 'text' }, { key: 'division', label: 'Division', type: 'text' }] },
      { name: 'Tournament', slug: 'tournament', description: 'Knockout tournament', displayOrder: 2, requirements: [{ key: 'format', label: 'Format', type: 'text' }] },
      { name: 'Cup', slug: 'cup', description: 'Cup competition', displayOrder: 3, requirements: [{ key: 'organizer', label: 'Organizer', type: 'text' }] },
    ],
  },
  // ─── COMMERCIAL ─────────────────────────────────────────────
  {
    name: 'Business', slug: 'business', icon: '💼', category: 'commercial', displayOrder: 15,
    description: 'Sports-related businesses and commercial entities.',
    types: [
      { name: 'Sponsor', slug: 'sponsor', description: 'Sports sponsor', displayOrder: 1, requirements: [{ key: 'company', label: 'Company', type: 'text' }] },
      { name: 'Brand', slug: 'brand', description: 'Sports brand', displayOrder: 2, requirements: [{ key: 'brandName', label: 'Brand Name', type: 'text' }] },
      { name: 'Retailer', slug: 'retailer', description: 'Sports equipment retailer', displayOrder: 3, requirements: [{ key: 'company', label: 'Company', type: 'text' }] },
      { name: 'Broadcaster', slug: 'broadcaster', description: 'Sports broadcaster', displayOrder: 4, requirements: [{ key: 'network', label: 'Network', type: 'text' }] },
    ],
  },
  {
    name: 'Venue', slug: 'venue', icon: '🏟️', category: 'commercial', displayOrder: 16,
    description: 'Stadiums, arenas, and sports facilities.',
    types: [
      { name: 'Stadium', slug: 'stadium', description: 'Large sports stadium', displayOrder: 1, requirements: [{ key: 'capacity', label: 'Capacity', type: 'number' }, { key: 'city', label: 'City', type: 'text' }] },
      { name: 'Arena', slug: 'arena', description: 'Indoor arena', displayOrder: 2, requirements: [{ key: 'capacity', label: 'Capacity', type: 'number' }] },
      { name: 'Training Ground', slug: 'training-ground', description: 'Training facility', displayOrder: 3, requirements: [{ key: 'club', label: 'Club', type: 'text' }] },
    ],
  },
  // ─── MEDIA ──────────────────────────────────────────────────
  {
    name: 'Media', slug: 'media', icon: '📺', category: 'commercial', displayOrder: 17,
    description: 'Sports media outlets and broadcasting companies.',
    types: [
      { name: 'TV Network', slug: 'tv-network', description: 'Television network', displayOrder: 1, requirements: [{ key: 'name', label: 'Network Name', type: 'text' }] },
      { name: 'Streaming Platform', slug: 'streaming-platform', description: 'Streaming service', displayOrder: 2, requirements: [{ key: 'name', label: 'Platform Name', type: 'text' }] },
      { name: 'Radio Station', slug: 'radio-station', description: 'Sports radio', displayOrder: 3, requirements: [{ key: 'name', label: 'Station Name', type: 'text' }] },
    ],
  },
  // ─── ADMIN ──────────────────────────────────────────────────
  {
    name: 'Moderator', slug: 'moderator', icon: '🛡️', category: 'admin', displayOrder: 18,
    description: 'Platform moderators who maintain community standards.',
    types: [
      { name: 'Community Moderator', slug: 'community-mod', description: 'Community moderator', displayOrder: 1, requirements: [] },
      { name: 'Senior Moderator', slug: 'senior-mod', description: 'Senior moderator', displayOrder: 2, requirements: [] },
    ],
  },
  {
    name: 'Administrator', slug: 'administrator', icon: '👑', category: 'admin', displayOrder: 19,
    description: 'Platform administrators with full system access.',
    types: [
      { name: 'Admin', slug: 'admin', description: 'Platform administrator', displayOrder: 1, requirements: [] },
      { name: 'Super Admin', slug: 'super-admin', description: 'Super administrator', displayOrder: 2, requirements: [] },
    ],
  },
  {
    name: 'Developer', slug: 'developer', icon: '💻', category: 'admin', displayOrder: 20,
    description: 'Platform developers and API partners.',
    types: [
      { name: 'API Partner', slug: 'api-partner', description: 'API integration partner', displayOrder: 1, requirements: [{ key: 'company', label: 'Company', type: 'text' }] },
      { name: 'Data Provider', slug: 'data-provider', description: 'Sports data provider', displayOrder: 2, requirements: [{ key: 'service', label: 'Data Service', type: 'text' }] },
    ],
  },
];

// ─── SPORTS ────────────────────────────────────────────────────
// Spec: Phase 17 — "Architecture must allow unlimited sports."
// Every sport has rich metadata: sportType (indoor/outdoor), format (team/individual),
// contactType, olympicStatus, description, and tags for filtering.
const SPORTS = [
  { name: 'Football', slug: 'football', icon: '⚽', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'contact', olympicStatus: 'olympic', description: 'The world\'s most popular sport — 11v11 on a pitch with goals at each end.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 1 },
  { name: 'Basketball', slug: 'basketball', icon: '🏀', category: 'team_sport', sportType: 'indoor', format: 'team', contactType: 'limited-contact', olympicStatus: 'olympic', description: 'Fast-paced 5v5 court sport — shoot hoops and score points.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 2 },
  { name: 'Tennis', slug: 'tennis', icon: '🎾', category: 'racquet', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Racquet sport played on a court — singles or doubles.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 3 },
  { name: 'Cricket', slug: 'cricket', icon: '🏏', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Bat-and-ball game with Test, ODI, and T20 formats.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 4 },
  { name: 'Rugby Union', slug: 'rugby-union', icon: '🏉', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'contact', olympicStatus: 'olympic', description: '15-a-side full-contact sport with lineouts, scrums, and tries.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 5 },
  { name: 'Rugby League', slug: 'rugby-league', icon: '🏉', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'contact', olympicStatus: 'none', description: '13-a-side full-contact sport with faster pace and six-tackle rule.', tags: ['professional', 'amateur', 'youth'], displayOrder: 6 },
  { name: 'Volleyball', slug: 'volleyball', icon: '🏐', category: 'team_sport', sportType: 'indoor', format: 'team', contactType: 'non-contact', olympicStatus: 'olympic', description: '6v6 court sport — keep the ball off the ground and spike to score.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 7 },
  { name: 'Baseball', slug: 'baseball', icon: '⚾', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Bat-and-ball game — 9 innings, 9 players, hits and home runs.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 8 },
  { name: 'Ice Hockey', slug: 'ice-hockey', icon: '🏒', category: 'team_sport', sportType: 'indoor', format: 'team', contactType: 'contact', olympicStatus: 'olympic', description: '6v5 fast-paced sport on ice — slap shots, checks, and goals.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 9 },
  { name: 'Field Hockey', slug: 'field-hockey', icon: '🏑', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'limited-contact', olympicStatus: 'olympic', description: '11v11 stick-and-ball sport played on turf or grass.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 10 },
  { name: 'Handball', slug: 'handball', icon: '🤾', category: 'team_sport', sportType: 'indoor', format: 'team', contactType: 'contact', olympicStatus: 'olympic', description: '7v7 court sport — throw the ball into the opponent\'s goal.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 11 },
  { name: 'Athletics', slug: 'athletics', icon: '🏃', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Track and field — sprints, jumps, throws, and distance events.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 12 },
  { name: 'Swimming', slug: 'swimming', icon: '🏊', category: 'individual', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Competitive pool swimming — freestyle, backstroke, breaststroke, butterfly.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 13 },
  { name: 'Boxing', slug: 'boxing', icon: '🥊', category: 'combat', sportType: 'indoor', format: 'individual', contactType: 'contact', olympicStatus: 'olympic', description: 'Combat sport — punch, block, and outpoint your opponent in the ring.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 14 },
  { name: 'MMA', slug: 'mma', icon: '🥋', category: 'combat', sportType: 'indoor', format: 'individual', contactType: 'contact', olympicStatus: 'none', description: 'Mixed martial arts — striking and grappling combined in the cage.', tags: ['professional', 'amateur'], displayOrder: 15 },
  { name: 'Formula 1', slug: 'formula-1', icon: '🏎️', category: 'motorsport', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'none', description: 'The pinnacle of motorsport — single-seater racing at 350 km/h.', tags: ['professional'], displayOrder: 16 },
  { name: 'MotoGP', slug: 'motogp', icon: '🏍️', category: 'motorsport', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'none', description: 'Premier motorcycle road racing — prototype bikes at breakneck speed.', tags: ['professional'], displayOrder: 17 },
  { name: 'Cycling', slug: 'cycling', icon: '🚴', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Road, track, and mountain bike racing — endurance and speed on two wheels.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 18 },
  { name: 'Golf', slug: 'golf', icon: '⛳', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Precision club-and-ball sport — stroke play, match play, and majors.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 19 },
  { name: 'Gymnastics', slug: 'gymnastics', icon: '🤸', category: 'individual', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Artistic and rhythmic — floor, vault, bars, beam, and rings.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 20 },
  { name: 'Wrestling', slug: 'wrestling', icon: '🤼', category: 'combat', sportType: 'indoor', format: 'individual', contactType: 'contact', olympicStatus: 'olympic', description: 'Oldest combat sport — freestyle and Greco-Roman grappling.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 21 },
  { name: 'Judo', slug: 'judo', icon: '🥋', category: 'combat', sportType: 'indoor', format: 'individual', contactType: 'contact', olympicStatus: 'olympic', description: 'Japanese martial art — throws, holds, and ippon wins.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 22 },
  { name: 'Taekwondo', slug: 'taekwondo', icon: '🥋', category: 'combat', sportType: 'indoor', format: 'individual', contactType: 'contact', olympicStatus: 'olympic', description: 'Korean martial art — high kicks, spinning kicks, and head kicks score big.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 23 },
  { name: 'Karate', slug: 'karate', icon: '🥋', category: 'combat', sportType: 'indoor', format: 'individual', contactType: 'contact', olympicStatus: 'olympic', description: 'Okinawan martial art — kata and kumite disciplines.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 24 },
  { name: 'Fencing', slug: 'fencing', icon: '🤺', category: 'combat', sportType: 'indoor', format: 'individual', contactType: 'contact', olympicStatus: 'olympic', description: 'Olympic sword sport — foil, epee, and sabre disciplines.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 25 },
  { name: 'Table Tennis', slug: 'table-tennis', icon: '🏓', category: 'racquet', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Fast-paced indoor racquet sport — ping-pong at the highest level.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 26 },
  { name: 'Badminton', slug: 'badminton', icon: '🏸', category: 'racquet', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Racquet sport with a shuttlecock — singles and doubles on a court.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 27 },
  { name: 'Squash', slug: 'squash', icon: '🎾', category: 'racquet', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'none', description: 'Racquet sport in an enclosed court — fast rallies and tight angles.', tags: ['professional', 'amateur', 'youth'], displayOrder: 28 },
  { name: 'Netball', slug: 'netball', icon: '🏐', category: 'team_sport', sportType: 'indoor', format: 'team', contactType: 'non-contact', olympicStatus: 'none', description: '7v7 court sport — passing and shooting without dribbling.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 29 },
  { name: 'Esports', slug: 'esports', icon: '🎮', category: 'individual', sportType: 'indoor', format: 'team', contactType: 'non-contact', olympicStatus: 'none', description: 'Competitive video gaming — leagues, tournaments, and global stages.', tags: ['professional', 'amateur', 'youth'], displayOrder: 30 },
  { name: 'American Football', slug: 'american-football', icon: '🏈', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'contact', olympicStatus: 'none', description: '11v11 gridiron sport — touchdowns, field goals, and the Super Bowl.', tags: ['professional', 'amateur', 'youth'], displayOrder: 31 },
  { name: 'Weightlifting', slug: 'weightlifting', icon: '🏋️', category: 'individual', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Olympic strength sport — snatch and clean-and-jerk.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 32 },
  { name: 'Archery', slug: 'archery', icon: '🏹', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Precision target sport — bow and arrow, steady aim, bullseye.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 33 },
  { name: 'Shooting', slug: 'shooting', icon: '🎯', category: 'individual', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Precision marksmanship — rifle, pistol, and shotgun disciplines.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 34 },
  { name: 'Rowing', slug: 'rowing', icon: '🚣', category: 'water', sportType: 'outdoor', format: 'team', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Water sport — sweep and scull racing on rivers and lakes.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 35 },
  { name: 'Surfing', slug: 'surfing', icon: '🏄', category: 'water', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Ride ocean waves on a board — barrels, cutbacks, and aerials.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 36 },
  { name: 'Skateboarding', slug: 'skateboarding', icon: '🛹', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Board sport — street and park disciplines with tricks and flips.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 37 },
  { name: 'Snowboarding', slug: 'snowboarding', icon: '🏂', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Winter board sport — halfpipe, slopestyle, and giant slalom.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 38 },
  { name: 'Skiing', slug: 'skiing', icon: '⛷️', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Winter sport — alpine, cross-country, freestyle, and ski jumping.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 39 },
  { name: 'Diving', slug: 'diving', icon: '🤿', category: 'water', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Aquatic sport — springboard and platform with acrobatic twists.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 40 },
  { name: 'Water Polo', slug: 'water-polo', icon: '🤽', category: 'water', sportType: 'indoor', format: 'team', contactType: 'contact', olympicStatus: 'olympic', description: '7v7 aquatic team sport — swim, pass, and shoot in deep water.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 41 },
  { name: 'Triathlon', slug: 'triathlon', icon: '🏃', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Endurance multisport — swim, bike, and run in one race.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 42 },
  { name: 'Horse Racing', slug: 'horse-racing', icon: '🏇', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'none', description: 'Flat and jump racing — thoroughbreds, jockeys, and the furlong.', tags: ['professional'], displayOrder: 43 },
  { name: 'Equestrian', slug: 'equestrian', icon: '🐴', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Olympic sport — dressage, eventing, and show jumping.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 44 },
  { name: 'Polo', slug: 'polo', icon: '🐴', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'contact', olympicStatus: 'none', description: 'Team sport on horseback — hit the ball through the goal with a mallet.', tags: ['professional', 'amateur'], displayOrder: 45 },
  { name: 'Lacrosse', slug: 'lacrosse', icon: '🥍', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'contact', olympicStatus: 'none', description: 'Team sport with a stick and ball — cradle, pass, and shoot.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 46 },
  { name: 'Climbing', slug: 'climbing', icon: '🧗', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Sport climbing — boulder, lead, and speed disciplines.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 47 },
  { name: 'Chess', slug: 'chess', icon: '♟️', category: 'individual', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'none', description: 'The royal game — strategy, tactics, and checkmate on 64 squares.', tags: ['professional', 'amateur', 'youth', 'women'], displayOrder: 48 },
  { name: 'Darts', slug: 'darts', icon: '🎯', category: 'individual', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'none', description: 'Precision pub sport — 501, 301, and the elusive nine-darter.', tags: ['professional', 'amateur'], displayOrder: 49 },
  { name: 'Billiards', slug: 'billiards', icon: '🎱', category: 'individual', sportType: 'indoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'none', description: 'Cue sports — pool, snooker, and carom on the green baize.', tags: ['professional', 'amateur'], displayOrder: 50 },
];

async function main() {
  console.log('🌱 Seeding SportSphere database...\n');

  // ─── Seed Roles & Types ──────────────────────────────────────
  console.log('📋 Seeding Roles & Types...');
  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: roleData.slug },
      update: {
        name: roleData.name,
        icon: roleData.icon,
        category: roleData.category,
        description: roleData.description,
        displayOrder: roleData.displayOrder,
        isActive: true,
      },
      create: {
        name: roleData.name,
        slug: roleData.slug,
        icon: roleData.icon,
        category: roleData.category,
        description: roleData.description,
        displayOrder: roleData.displayOrder,
        isActive: true,
      },
    });

    for (const typeData of roleData.types) {
      await prisma.roleType.upsert({
        where: {
          roleId_slug: { roleId: role.id, slug: typeData.slug },
        },
        update: {
          name: typeData.name,
          description: typeData.description,
          displayOrder: typeData.displayOrder,
          isActive: true,
          requirements: typeData.requirements,
        },
        create: {
          roleId: role.id,
          name: typeData.name,
          slug: typeData.slug,
          description: typeData.description,
          displayOrder: typeData.displayOrder,
          isActive: true,
          requirements: typeData.requirements,
        },
      });
    }
    console.log(`  ✅ ${roleData.name} (${roleData.types.length} types)`);
  }

  // ─── Seed Sports ─────────────────────────────────────────────
  console.log('\n⚽ Seeding Sports...');
  for (const sportData of SPORTS) {
    // Try upsert by slug first, fall back to update by name
    try {
      await prisma.sport.upsert({
        where: { slug: sportData.slug },
        update: {
          name: sportData.name,
          icon: sportData.icon,
          category: sportData.category,
          sportType: sportData.sportType,
          format: sportData.format,
          contactType: sportData.contactType,
          olympicStatus: sportData.olympicStatus,
          description: sportData.description,
          tags: sportData.tags,
          displayOrder: sportData.displayOrder,
          isActive: true,
        },
        create: {
          name: sportData.name,
          slug: sportData.slug,
          icon: sportData.icon,
          category: sportData.category,
          sportType: sportData.sportType,
          format: sportData.format,
          contactType: sportData.contactType,
          olympicStatus: sportData.olympicStatus,
          description: sportData.description,
          tags: sportData.tags,
          displayOrder: sportData.displayOrder,
          isActive: true,
        },
      });
    } catch (e: unknown) {
      // Handle unique constraint on name — update existing sport with same name but different slug
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
        const existing = await prisma.sport.findFirst({ where: { name: sportData.name } });
        if (existing) {
          await prisma.sport.update({
            where: { id: existing.id },
            data: {
              slug: sportData.slug,
              icon: sportData.icon,
              category: sportData.category,
              sportType: sportData.sportType,
              format: sportData.format,
              contactType: sportData.contactType,
              olympicStatus: sportData.olympicStatus,
              description: sportData.description,
              tags: sportData.tags,
              displayOrder: sportData.displayOrder,
              isActive: true,
            },
          });
        }
      } else {
        throw e;
      }
    }
  }
  console.log(`  ✅ ${SPORTS.length} sports seeded`);

  // ─── Update existing users with default Fan role ─────────────
  console.log('\n👤 Updating existing users with Fan role...');
  const fanRole = await prisma.role.findUnique({ where: { slug: 'fan' } });
  const casualType = fanRole
    ? await prisma.roleType.findFirst({ where: { roleId: fanRole.id, slug: 'casual' } })
    : null;

  if (fanRole && casualType) {
    const result = await prisma.user.updateMany({
      where: { roleId: 'fan-default-role' },
      data: { roleId: fanRole.id, roleTypeId: casualType.id },
    });
    console.log(`  ✅ Updated ${result.count} users with Fan/Casual role`);
  }

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
