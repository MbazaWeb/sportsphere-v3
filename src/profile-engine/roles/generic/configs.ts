// ─── Generic role configs for the other 19 roles ──────────────
//
// Each of these roles gets a real per-role field schema (so the edit
// form is genuinely different per role), but uses the generic tab
// renderer (which shows the roleProfile fields as a typed grid instead
// of the old regex-matched RoleContentTab).
//
// In priority order for future per-role upgrades:
//   1. Scout      → Scouting Board with Watching/Shortlisted/Recommended/Signed
//   2. Journalist → Article portfolio with engagement metrics
//   3. Creator    → Media kit (audience, engagement, top content)
//   4. Analyst    → Prediction record with accuracy %
//   5. Commentator→ Broadcast career stats
//   6. Agent      → Client roster + transfer history
//   7. Organization/Competition/League/Academy/Venue/Business/Commercial-Partner/Community
//   8. Official/Support-Staff/Moderator/Administrator
//
// For now they all use the generic renderer with role-specific fields.

import {
  Search, Newspaper, Camera, BarChart3, Mic, Handshake,
  Building2, Trophy, Medal, GraduationCap, Users as UsersIcon,
  Building, Briefcase, Scale, ShieldCheck, Crown,
} from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

// ─── Helper: build a tabs array from a list of tab IDs ─────────
function tabs(...ids: Array<TabId>): Array<{ id: TabId; label: string }> {
  const LABELS: Record<string, string> = {
    overview: 'Overview', feeds: 'Feeds', about: 'About', shop: 'Shop',
    stats: 'Stats', career: 'Career', achievements: 'Trophies',
    scouting: 'Scouting', squad: 'Squad', performance: 'Performance',
    tactical: 'Tactical', reports: 'Reports', articles: 'Articles',
    spotlight: 'Spotlight', tools: 'Tools', portfolio: 'Portfolio',
    services: 'Services', programs: 'Programs', clients: 'Clients',
    members: 'Members', facilities: 'Facilities', fixtures: 'Fixtures',
    standings: 'Standings', console: 'Console',
  };
  return ids.map(id => ({ id, label: LABELS[id] || id }));
}

// ─── Scout ─────────────────────────────────────────────────────
export const scoutConfig: RoleConfig = {
  role: 'scout',
  label: 'Scout',
  icon: Search,
  accent: '#34D399',
  tagline: 'Talent intelligence: discover, track, and recommend players.',
  tabs: tabs('overview', 'feeds', 'reports', 'career', 'about'),
  fields: [
    { key: 'scoutType',        label: 'Scout Type',        type: 'select', section: 'identity', group: 'Identity', required: true,
      options: ['Chief Scout', 'Talent Scout', 'Recruitment Manager', 'Opposition Scout', 'Data Scout'] },
    { key: 'organization',     label: 'Organization',      type: 'text',   section: 'identity', group: 'Identity', required: true },
    { key: 'geographicCoverage', label: 'Geographic Coverage', type: 'text', section: 'identity', group: 'Identity', placeholder: 'East Africa' },
    { key: 'sportsCovered',    label: 'Sports Covered',    type: 'chips',  section: 'identity', group: 'Identity' },
    { key: 'yearsExperience',  label: 'Years Experience',  type: 'number', section: 'identity', group: 'Identity' },
    { key: 'specialization',   label: 'Specialization',    type: 'select', section: 'identity', group: 'Identity',
      options: ['Youth Scouting', 'First-Team Scouting', 'Opposition Scouting', 'Data Scouting', 'Recruitment'] },
    { key: 'playersDiscovered',  label: 'Players Discovered',   type: 'number', section: 'performance', group: 'Activity' },
    { key: 'playersRecommended', label: 'Players Recommended',  type: 'number', section: 'performance', group: 'Activity' },
    { key: 'successfulSignings', label: 'Successful Signings',  type: 'number', section: 'performance', group: 'Activity' },
    { key: 'countriesCovered',   label: 'Countries Covered',    type: 'number', section: 'performance', group: 'Activity' },
    { key: 'competitionsMonitored', label: 'Competitions Monitored', type: 'number', section: 'performance', group: 'Activity' },
    { key: 'scoutingReport',   label: 'Scouting Report',    type: 'textarea', section: 'performance', group: 'Activity' },
  ],
};

// ─── Journalist ────────────────────────────────────────────────
export const journalistConfig: RoleConfig = {
  role: 'journalist',
  label: 'Journalist',
  icon: Newspaper,
  accent: '#F5C518',
  tagline: 'Professional media profile: articles, exclusives, interviews.',
  tabs: tabs('overview', 'feeds', 'articles', 'career', 'about'),
  fields: [
    { key: 'publication',  label: 'Publication',   type: 'text', section: 'identity', group: 'Identity', required: true },
    { key: 'beat',         label: 'Beat',           type: 'text', section: 'identity', group: 'Identity', placeholder: 'Transfers, National team...' },
    { key: 'location',     label: 'Location',       type: 'text', section: 'identity', group: 'Identity' },
    { key: 'yearsActive',  label: 'Years Active',   type: 'number', section: 'identity', group: 'Identity' },
    { key: 'languages',    label: 'Languages',      type: 'chips', section: 'identity', group: 'Identity' },
    { key: 'coverage',     label: 'Coverage Areas', type: 'chips', section: 'performance', group: 'Coverage', hint: 'Football, Basketball, Transfers...' },
    { key: 'articleCount', label: 'Articles Published', type: 'number', section: 'performance', group: 'Metrics' },
    { key: 'exclusives',   label: 'Exclusive Stories',  type: 'number', section: 'performance', group: 'Metrics' },
    { key: 'interviews',   label: 'Interviews',         type: 'number', section: 'performance', group: 'Metrics' },
    { key: 'breakingNews', label: 'Breaking News',      type: 'number', section: 'performance', group: 'Metrics' },
    { key: 'totalViews',   label: 'Total Views',        type: 'text', section: 'performance', group: 'Metrics', placeholder: '2.4M' },
    { key: 'pressCredentials', label: 'Press Credentials', type: 'textarea', section: 'performance', group: 'Credibility' },
  ],
};

// ─── Creator ───────────────────────────────────────────────────
export const creatorConfig: RoleConfig = {
  role: 'creator',
  label: 'Creator',
  icon: Camera,
  accent: '#FF6B35',
  tagline: 'Creator portfolio: content, analytics, media kit.',
  tabs: tabs('overview', 'feeds', 'spotlight', 'career', 'about'),
  fields: [
    { key: 'creatorType',    label: 'Creator Type',   type: 'select', section: 'identity', group: 'Identity', required: true,
      options: ['Podcaster', 'Streamer', 'Influencer', 'YouTuber', 'Graphic Designer', 'Photographer', 'Videographer'] },
    { key: 'platforms',      label: 'Platforms',      type: 'chips', section: 'identity', group: 'Identity', hint: 'YouTube, TikTok, Instagram...' },
    { key: 'niche',          label: 'Niche',          type: 'text', section: 'identity', group: 'Identity', placeholder: 'Match analysis, highlights, comedy...' },
    { key: 'audienceLocation', label: 'Audience Location', type: 'text', section: 'identity', group: 'Identity', placeholder: 'Tanzania, Kenya...' },
    { key: 'languages',      label: 'Languages',      type: 'chips', section: 'identity', group: 'Identity' },
    { key: 'followers',      label: 'Total Followers', type: 'text', section: 'performance', group: 'Analytics', placeholder: '450K' },
    { key: 'engagementRate', label: 'Engagement Rate %', type: 'number', section: 'performance', group: 'Analytics', placeholder: '8.4' },
    { key: 'avgViews',       label: 'Average Views',  type: 'text', section: 'performance', group: 'Analytics', placeholder: '120K' },
    { key: 'reach',          label: 'Monthly Reach',  type: 'text', section: 'performance', group: 'Analytics' },
    { key: 'topContent',     label: 'Top Content',    type: 'textarea', section: 'performance', group: 'Portfolio' },
    { key: 'brandCollabs',   label: 'Brand Collaborations', type: 'textarea', section: 'performance', group: 'Monetization' },
  ],
};

// ─── Analyst ───────────────────────────────────────────────────
export const analystConfig: RoleConfig = {
  role: 'analyst',
  label: 'Analyst',
  icon: BarChart3,
  accent: '#3B82F6',
  tagline: 'Sports intelligence: data, tactics, predictions.',
  tabs: tabs('overview', 'feeds', 'tools', 'articles', 'about'),
  fields: [
    { key: 'analystType',     label: 'Analyst Type',     type: 'select', section: 'identity', group: 'Identity', required: true,
      options: ['Data Analyst', 'Tactical Analyst', 'Statistician', 'Predictive Analyst'] },
    { key: 'organization',    label: 'Organization',     type: 'text', section: 'identity', group: 'Identity' },
    { key: 'expertise',       label: 'Areas of Expertise', type: 'chips', section: 'identity', group: 'Identity' },
    { key: 'reportsPublished',label: 'Reports Published', type: 'number', section: 'performance', group: 'Analytics' },
    { key: 'modelsCreated',   label: 'Models Created',   type: 'number', section: 'performance', group: 'Analytics' },
    { key: 'predictions',     label: 'Predictions Made', type: 'number', section: 'performance', group: 'Analytics' },
    { key: 'predictionAccuracy', label: 'Prediction Accuracy %', type: 'number', section: 'performance', group: 'Analytics', placeholder: '72' },
    { key: 'teamsAnalyzed',   label: 'Teams Analyzed',   type: 'number', section: 'performance', group: 'Analytics' },
    { key: 'playersAnalyzed', label: 'Players Analyzed', type: 'number', section: 'performance', group: 'Analytics' },
    { key: 'topModels',       label: 'Top Models',       type: 'textarea', section: 'performance', group: 'Portfolio' },
  ],
};

// ─── Commentator ───────────────────────────────────────────────
export const commentatorConfig: RoleConfig = {
  role: 'commentator',
  label: 'Commentator',
  icon: Mic,
  accent: '#A855F7',
  tagline: 'Broadcast career: matches covered, competitions, networks.',
  tabs: tabs('overview', 'feeds', 'spotlight', 'career', 'about'),
  fields: [
    { key: 'commentatorType', label: 'Commentator Type', type: 'select', section: 'identity', group: 'Identity', required: true,
      options: ['TV Commentator', 'Radio Commentator', 'TV Presenter', 'Radio Presenter'] },
    { key: 'broadcaster',     label: 'Broadcaster',      type: 'text', section: 'identity', group: 'Identity', required: true },
    { key: 'languages',       label: 'Languages',        type: 'chips', section: 'identity', group: 'Identity' },
    { key: 'sports',          label: 'Sports',           type: 'chips', section: 'identity', group: 'Identity' },
    { key: 'yearsActive',     label: 'Years Active',     type: 'number', section: 'identity', group: 'Identity' },
    { key: 'matchesCovered',  label: 'Matches Covered',  type: 'number', section: 'performance', group: 'Career' },
    { key: 'competitions',    label: 'Competitions',     type: 'number', section: 'performance', group: 'Career' },
    { key: 'countries',       label: 'Countries',        type: 'number', section: 'performance', group: 'Career' },
    { key: 'majorEvents',     label: 'Major Events',     type: 'textarea', section: 'performance', group: 'Portfolio' },
  ],
};

// ─── Agent ─────────────────────────────────────────────────────
export const agentConfig: RoleConfig = {
  role: 'agent',
  label: 'Agent',
  icon: Handshake,
  accent: '#F5C518',
  tagline: 'Representation: clients, transfers, contracts.',
  tabs: tabs('overview', 'feeds', 'clients', 'career', 'about'),
  fields: [
    { key: 'agentType',       label: 'Agent Type',       type: 'select', section: 'identity', group: 'Identity', required: true,
      options: ['Player Agent', 'Coach Agent', 'Licensed Agent'] },
    { key: 'agency',          label: 'Agency',           type: 'text', section: 'identity', group: 'Identity' },
    { key: 'license',         label: 'License Number',   type: 'text', section: 'identity', group: 'Identity' },
    { key: 'federation',      label: 'Federation',       type: 'text', section: 'identity', group: 'Identity', placeholder: 'FIFA' },
    { key: 'countries',       label: 'Operating Countries', type: 'chips', section: 'identity', group: 'Identity' },
    { key: 'playersRepresented', label: 'Players Represented', type: 'number', section: 'performance', group: 'Business' },
    { key: 'coachesRepresented', label: 'Coaches Represented', type: 'number', section: 'performance', group: 'Business' },
    { key: 'transfersCompleted', label: 'Transfers Completed', type: 'number', section: 'performance', group: 'Business' },
    { key: 'totalTransferValue', label: 'Total Transfer Value', type: 'text', section: 'performance', group: 'Business', placeholder: '€8.2M' },
    { key: 'activeNegotiations', label: 'Active Negotiations', type: 'number', section: 'performance', group: 'Business' },
    { key: 'contractsManaged',  label: 'Contracts Managed',   type: 'number', section: 'performance', group: 'Business' },
    { key: 'notableClients',    label: 'Notable Clients',     type: 'textarea', section: 'performance', group: 'Portfolio' },
  ],
};

// ─── Academy ───────────────────────────────────────────────────
export const academyConfig: RoleConfig = {
  role: 'academy',
  label: 'Academy',
  icon: GraduationCap,
  accent: '#34D399',
  tagline: 'Develop young athletes through training programs.',
  tabs: tabs('overview', 'feeds', 'squad', 'programs', 'about'),
  fields: [
    { key: 'academyName',     label: 'Academy Name',     type: 'text', section: 'identity', group: 'Identity', required: true },
    { key: 'parentOrg',       label: 'Parent Organization', type: 'text', section: 'identity', group: 'Identity' },
    { key: 'location',        label: 'Location',         type: 'text', section: 'identity', group: 'Identity' },
    { key: 'foundedYear',     label: 'Founded Year',     type: 'text', section: 'identity', group: 'Identity' },
    { key: 'director',        label: 'Director',         type: 'text', section: 'identity', group: 'Identity' },
    { key: 'programs',        label: 'Programs (age groups)', type: 'chips', section: 'performance', group: 'Programs', hint: 'U8, U10, U12, U15, U17, U20' },
    { key: 'playersDeveloped',label: 'Players Developed', type: 'number', section: 'performance', group: 'Outcomes' },
    { key: 'playersPromoted', label: 'Players Promoted to First Team', type: 'number', section: 'performance', group: 'Outcomes' },
    { key: 'proGraduates',    label: 'Professional Graduates', type: 'number', section: 'performance', group: 'Outcomes' },
    { key: 'scholarships',    label: 'Scholarships Available', type: 'number', section: 'performance', group: 'Outcomes' },
  ],
};

// ─── Organization ──────────────────────────────────────────────
export const organizationConfig: RoleConfig = {
  role: 'organization',
  label: 'Organization',
  icon: Building2,
  accent: '#3B82F6',
  tagline: 'Governing bodies, federations, associations.',
  tabs: tabs('overview', 'feeds', 'programs', 'about'),
  fields: [
    { key: 'orgType',         label: 'Organization Type', type: 'select', section: 'identity', group: 'Identity', required: true,
      options: ['Federation', 'Olympic Committee', 'National Association', 'Regional Association', 'NGO / Charity', 'Government Organization'] },
    { key: 'country',         label: 'Country',         type: 'text', section: 'identity', group: 'Identity' },
    { key: 'headquarters',    label: 'Headquarters',    type: 'text', section: 'identity', group: 'Identity' },
    { key: 'foundedYear',     label: 'Founded Year',    type: 'text', section: 'identity', group: 'Identity' },
    { key: 'leadership',      label: 'Leadership',      type: 'textarea', section: 'identity', group: 'Identity' },
    { key: 'departments',     label: 'Departments',     type: 'textarea', section: 'performance', group: 'Structure' },
    { key: 'regions',         label: 'Regions',         type: 'textarea', section: 'performance', group: 'Structure' },
    { key: 'affiliates',      label: 'Affiliates',      type: 'textarea', section: 'performance', group: 'Structure' },
    { key: 'competitions',    label: 'Competitions Organized', type: 'textarea', section: 'performance', group: 'Activities' },
    { key: 'programs',        label: 'Development Programs', type: 'textarea', section: 'performance', group: 'Activities' },
  ],
};

// ─── Competition ───────────────────────────────────────────────
export const competitionConfig: RoleConfig = {
  role: 'competition',
  label: 'Competition',
  icon: Trophy,
  accent: '#F5C518',
  tagline: 'Sports competitions, tournaments, cups.',
  tabs: tabs('overview', 'feeds', 'standings', 'fixtures', 'trophies', 'about'),
  fields: [
    { key: 'competitionName', label: 'Competition Name', type: 'text', section: 'identity', group: 'Identity', required: true },
    { key: 'season',          label: 'Current Season',   type: 'text', section: 'identity', group: 'Identity', placeholder: '2026/27' },
    { key: 'organizer',       label: 'Organizer',        type: 'text', section: 'identity', group: 'Identity' },
    { key: 'country',         label: 'Country',          type: 'text', section: 'identity', group: 'Identity' },
    { key: 'level',           label: 'Level',            type: 'select', section: 'identity', group: 'Identity',
      options: ['Domestic', 'Continental', 'International', 'Youth', 'Women', 'Amateur'] },
    { key: 'format',          label: 'Format',           type: 'select', section: 'identity', group: 'Identity',
      options: ['League', 'Knockout', 'Group + Knockout', 'Round Robin', 'Tournament'] },
    { key: 'participants',    label: 'Number of Teams',  type: 'number', section: 'performance', group: 'Season' },
    { key: 'topScorer',       label: 'Top Scorer',       type: 'text', section: 'performance', group: 'Season' },
    { key: 'topAssists',      label: 'Top Assists',      type: 'text', section: 'performance', group: 'Season' },
    { key: 'previousWinners', label: 'Previous Winners', type: 'textarea', section: 'performance', group: 'History' },
    { key: 'records',         label: 'Competition Records', type: 'textarea', section: 'performance', group: 'History' },
  ],
};

// ─── League ────────────────────────────────────────────────────
export const leagueConfig: RoleConfig = {
  role: 'league',
  label: 'League',
  icon: Medal,
  accent: '#A855F7',
  tagline: 'Permanent sports leagues with divisions and seasons.',
  tabs: tabs('overview', 'feeds', 'standings', 'fixtures', 'trophies', 'about'),
  fields: [
    { key: 'leagueName',      label: 'League Name',      type: 'text', section: 'identity', group: 'Identity', required: true },
    { key: 'country',         label: 'Country',          type: 'text', section: 'identity', group: 'Identity' },
    { key: 'division',        label: 'Division',         type: 'text', section: 'identity', group: 'Identity', placeholder: '1st, 2nd...' },
    { key: 'organizer',       label: 'Organizer',        type: 'text', section: 'identity', group: 'Identity' },
    { key: 'foundedYear',     label: 'Founded Year',     type: 'text', section: 'identity', group: 'Identity' },
    { key: 'teams',           label: 'Number of Teams',  type: 'number', section: 'performance', group: 'Current Season' },
    { key: 'avgGoals',        label: 'Average Goals/Match', type: 'number', section: 'performance', group: 'Intelligence' },
    { key: 'avgAttendance',   label: 'Average Attendance', type: 'number', section: 'performance', group: 'Intelligence' },
    { key: 'topScorer',       label: 'All-time Top Scorer', type: 'text', section: 'performance', group: 'Intelligence' },
    { key: 'champions',       label: 'Reigning Champions', type: 'text', section: 'performance', group: 'History' },
    { key: 'previousChampions', label: 'Previous Champions', type: 'textarea', section: 'performance', group: 'History' },
  ],
};

// ─── Venue ─────────────────────────────────────────────────────
export const venueConfig: RoleConfig = {
  role: 'venue',
  label: 'Venue',
  icon: Building2,
  accent: '#34D399',
  tagline: 'Sports venues, stadiums, training facilities.',
  tabs: tabs('overview', 'feeds', 'facilities', 'about'),
  fields: [
    { key: 'venueName',       label: 'Venue Name',       type: 'text', section: 'identity', group: 'Identity', required: true },
    { key: 'venueType',       label: 'Venue Type',       type: 'select', section: 'identity', group: 'Identity',
      options: ['Stadium', 'Arena', 'Training Ground', 'Sports Complex'] },
    { key: 'location',        label: 'Location',         type: 'text', section: 'identity', group: 'Identity' },
    { key: 'capacity',        label: 'Capacity',         type: 'number', section: 'identity', group: 'Identity' },
    { key: 'surface',         label: 'Surface',          type: 'text', section: 'identity', group: 'Identity', placeholder: 'Natural grass / Artificial' },
    { key: 'opened',          label: 'Year Opened',      type: 'text', section: 'identity', group: 'Identity' },
    { key: 'owner',           label: 'Owner',            type: 'text', section: 'identity', group: 'Identity' },
    { key: 'operator',        label: 'Operator',         type: 'text', section: 'identity', group: 'Identity' },
    { key: 'facilities',      label: 'Facilities',       type: 'chips', section: 'performance', group: 'Facilities', hint: 'VIP, Media, Parking, Accessibility...' },
    { key: 'tenants',         label: 'Tenant Teams',     type: 'textarea', section: 'performance', group: 'Tenants' },
    { key: 'upcomingEvents',  label: 'Upcoming Events',  type: 'textarea', section: 'performance', group: 'Calendar' },
  ],
};

// ─── Business ──────────────────────────────────────────────────
export const businessConfig: RoleConfig = {
  role: 'business',
  label: 'Business',
  icon: Briefcase,
  accent: '#F5C518',
  tagline: 'Sports-related businesses and commercial entities.',
  tabs: tabs('overview', 'feeds', 'shop', 'services', 'about'),
  fields: [
    { key: 'companyName',     label: 'Company Name',     type: 'text', section: 'identity', group: 'Identity', required: true },
    { key: 'industry',        label: 'Industry',         type: 'select', section: 'identity', group: 'Identity',
      options: ['Sportswear', 'Sports Media', 'Sports Agency', 'Sports Technology', 'Sports Nutrition', 'Sports Retail'] },
    { key: 'foundedYear',     label: 'Founded Year',     type: 'text', section: 'identity', group: 'Identity' },
    { key: 'headquarters',    label: 'Headquarters',     type: 'text', section: 'identity', group: 'Identity' },
    { key: 'website',         label: 'Website',          type: 'url', section: 'identity', group: 'Identity' },
    { key: 'products',        label: 'Products / Services', type: 'textarea', section: 'performance', group: 'Offerings' },
    { key: 'partnerTeams',    label: 'Partner Teams',    type: 'textarea', section: 'performance', group: 'Partnerships' },
    { key: 'partnerAthletes', label: 'Partner Athletes', type: 'textarea', section: 'performance', group: 'Partnerships' },
    { key: 'sponsorships',    label: 'Sponsorships',     type: 'textarea', section: 'performance', group: 'Partnerships' },
    { key: 'campaigns',       label: 'Active Campaigns', type: 'textarea', section: 'performance', group: 'Marketing' },
  ],
};

// ─── Commercial Partner ────────────────────────────────────────
export const commercialPartnerConfig: RoleConfig = {
  role: 'commercial-partner',
  label: 'Commercial Partner',
  icon: Handshake,
  accent: '#A855F7',
  tagline: 'Sponsors, broadcasters, and commercial partners.',
  tabs: tabs('overview', 'feeds', 'portfolio', 'about'),
  fields: [
    { key: 'partnerType',     label: 'Partner Type',     type: 'select', section: 'identity', group: 'Identity', required: true,
      options: ['Sponsor', 'Title Sponsor', 'Broadcaster', 'Streaming Platform', 'Ticketing Provider', 'Travel Partner', 'Data Provider', 'Event Organizer'] },
    { key: 'brand',           label: 'Brand',            type: 'text', section: 'identity', group: 'Identity', required: true },
    { key: 'sportsCategory',  label: 'Sports Category',  type: 'text', section: 'identity', group: 'Identity' },
    { key: 'partnershipStatus', label: 'Partnership Status', type: 'select', section: 'identity', group: 'Identity',
      options: ['Active', 'Ended', 'Pending'] },
    { key: 'sponsoredTeams',    label: 'Sponsored Teams',     type: 'textarea', section: 'performance', group: 'Portfolio' },
    { key: 'sponsoredPlayers',  label: 'Sponsored Players',   type: 'textarea', section: 'performance', group: 'Portfolio' },
    { key: 'sponsoredCompetitions', label: 'Sponsored Competitions', type: 'textarea', section: 'performance', group: 'Portfolio' },
    { key: 'sponsoredEvents',   label: 'Sponsored Events',    type: 'textarea', section: 'performance', group: 'Portfolio' },
    { key: 'activeCampaigns',   label: 'Active Campaigns',    type: 'textarea', section: 'performance', group: 'Marketing' },
  ],
};

// ─── Community ─────────────────────────────────────────────────
export const communityConfig: RoleConfig = {
  role: 'community',
  label: 'Community',
  icon: UsersIcon,
  accent: '#FF6B35',
  tagline: 'Fan communities, supporter groups, discussion forums.',
  tabs: tabs('overview', 'feeds', 'members', 'about'),
  fields: [
    { key: 'communityName',   label: 'Community Name',   type: 'text', section: 'identity', group: 'Identity', required: true },
    { key: 'communityType',   label: 'Community Type',   type: 'select', section: 'identity', group: 'Identity',
      options: ['Fan Club', 'Supporters Group', 'Discussion Forum', 'Community Club'] },
    { key: 'foundedYear',     label: 'Founded Year',     type: 'text', section: 'identity', group: 'Identity' },
    { key: 'location',        label: 'Location',         type: 'text', section: 'identity', group: 'Identity' },
    { key: 'supportedTeam',   label: 'Supported Team',   type: 'text', section: 'identity', group: 'Identity' },
    { key: 'memberCount',     label: 'Total Members',    type: 'number', section: 'performance', group: 'Stats' },
    { key: 'activeMembers',   label: 'Active Members',   type: 'number', section: 'performance', group: 'Stats' },
    { key: 'eventCount',      label: 'Events Held',      type: 'number', section: 'performance', group: 'Stats' },
    { key: 'postCount',       label: 'Posts',            type: 'number', section: 'performance', group: 'Stats' },
    { key: 'rules',           label: 'Community Rules',  type: 'textarea', section: 'performance', group: 'About' },
  ],
};

// ─── Official ──────────────────────────────────────────────────
export const officialConfig: RoleConfig = {
  role: 'official',
  label: 'Official',
  icon: Scale,
  accent: '#A855F7',
  tagline: 'Match officials: referees, assistant referees, VAR.',
  tabs: tabs('overview', 'feeds', 'career', 'stats', 'about'),
  fields: [
    { key: 'officialType',    label: 'Official Type',    type: 'select', section: 'identity', group: 'Identity', required: true,
      options: ['Referee', 'Assistant Referee', 'Fourth Official', 'VAR Official', 'Match Commissioner', 'Technical Delegate', 'Judge', 'Umpire', 'Timekeeper', 'Competition Official'] },
    { key: 'federation',      label: 'Federation',       type: 'text', section: 'identity', group: 'Identity' },
    { key: 'license',         label: 'License Level',    type: 'select', section: 'identity', group: 'Identity',
      options: ['FIFA', 'Continental', 'National', 'Regional', 'Local'] },
    { key: 'yearsActive',     label: 'Years Active',     type: 'number', section: 'identity', group: 'Identity' },
    { key: 'country',         label: 'Country',          type: 'text', section: 'identity', group: 'Identity' },
    { key: 'matchesOfficiated', label: 'Matches Officiated', type: 'number', section: 'performance', group: 'Record' },
    { key: 'yellowCards',     label: 'Yellow Cards Issued', type: 'number', section: 'performance', group: 'Record' },
    { key: 'redCards',        label: 'Red Cards Issued',    type: 'number', section: 'performance', group: 'Record' },
    { key: 'penalties',       label: 'Penalties Awarded',   type: 'number', section: 'performance', group: 'Record' },
    { key: 'varInterventions',label: 'VAR Interventions',   type: 'number', section: 'performance', group: 'Record' },
    { key: 'avgRating',       label: 'Average Match Rating', type: 'number', section: 'performance', group: 'Record', placeholder: '8.2' },
    { key: 'internationalAppointments', label: 'International Appointments', type: 'textarea', section: 'performance', group: 'Career' },
  ],
};

// ─── Support Staff ─────────────────────────────────────────────
export const supportStaffConfig: RoleConfig = {
  role: 'support-staff',
  label: 'Support Staff',
  icon: ShieldCheck,
  accent: '#34D399',
  tagline: 'Medical, fitness, performance, and operational staff.',
  tabs: tabs('overview', 'feeds', 'career', 'about'),
  fields: [
    { key: 'profession',      label: 'Profession',       type: 'select', section: 'identity', group: 'Identity', required: true,
      options: ['Team Manager', 'General Manager', 'Sporting Director', 'Technical Director', 'Physiotherapist', 'Athletic Trainer', 'Strength & Conditioning Coach', 'Nutritionist', 'Sports Psychologist', 'Performance Analyst', 'Video Analyst', 'Data Scientist', 'Team Doctor', 'Equipment Manager'] },
    { key: 'currentTeam',     label: 'Current Team',     type: 'text', section: 'identity', group: 'Identity' },
    { key: 'qualification',   label: 'Qualification',    type: 'text', section: 'identity', group: 'Identity' },
    { key: 'yearsExperience', label: 'Years Experience', type: 'number', section: 'identity', group: 'Identity' },
    { key: 'specializations', label: 'Specializations',  type: 'chips', section: 'performance', group: 'Professional' },
    { key: 'certifications',  label: 'Certifications',   type: 'textarea', section: 'performance', group: 'Professional' },
    { key: 'previousTeams',   label: 'Previous Teams',   type: 'textarea', section: 'performance', group: 'Career' },
    { key: 'areasOfExpertise', label: 'Areas of Expertise', type: 'textarea', section: 'performance', group: 'Professional' },
  ],
};

// ─── Moderator (internal — minimal public profile) ────────────
export const moderatorConfig: RoleConfig = {
  role: 'moderator',
  label: 'Moderator',
  icon: ShieldCheck,
  accent: '#3B82F6',
  tagline: 'Community moderator.',
  tabs: tabs('overview', 'feeds', 'about'),
  fields: [
    { key: 'modType',         label: 'Moderator Type',   type: 'select', section: 'identity', group: 'Identity',
      options: ['Content Moderator', 'Community Moderator'] },
    { key: 'specialization',  label: 'Specialization',   type: 'text', section: 'identity', group: 'Identity' },
    { key: 'sinceYear',       label: 'Moderator Since',  type: 'text', section: 'identity', group: 'Identity' },
  ],
};

// ─── Administrator (internal — minimal public profile) ────────
export const administratorConfig: RoleConfig = {
  role: 'administrator',
  label: 'Administrator',
  icon: Crown,
  accent: '#F5C518',
  tagline: 'Platform administrator.',
  tabs: tabs('overview', 'feeds', 'about'),
  fields: [
    { key: 'adminType',       label: 'Admin Type',       type: 'select', section: 'identity', group: 'Identity',
      options: ['Super Administrator', 'Platform Administrator', 'Sports Administrator', 'Verification Administrator', 'User Administrator', 'Media Administrator', 'Developer Administrator', 'Read Only Auditor'] },
    { key: 'sinceYear',       label: 'Admin Since',      type: 'text', section: 'identity', group: 'Identity' },
  ],
};

// ─── Fan (default — keeps existing fanTypes selector) ─────────
// Fan fields are handled separately in EditProfileModal because of
// the legacy fanTypes nested object. We declare a minimal config so
// the engine knows fan's tabs.
export const fanConfig: RoleConfig = {
  role: 'fan',
  label: 'Fan',
  icon: UsersIcon,
  accent: '#FF6B35',
  tagline: 'Sports enthusiast following teams, players, and communities.',
  tabs: tabs('overview', 'feeds', 'about'),
  fields: [
    { key: 'supporterSince',  label: 'Supporter Since',  type: 'text', section: 'identity', group: 'Identity' },
    { key: 'favoriteTeam',    label: 'Favorite Team',    type: 'text', section: 'identity', group: 'Identity' },
    { key: 'favoritePlayer',  label: 'Favorite Player',  type: 'text', section: 'identity', group: 'Identity' },
    { key: 'favoriteSport',   label: 'Favorite Sport',   type: 'text', section: 'identity', group: 'Identity' },
  ],
};

// Legacy aliases — point to the closest real config
export const refereeConfig: RoleConfig = { ...officialConfig, role: 'referee' };
export const stadiumConfig: RoleConfig = { ...venueConfig, role: 'stadium' };
export const medicalConfig: RoleConfig = { ...supportStaffConfig, role: 'medical' };
export const developerConfig: RoleConfig = { ...administratorConfig, role: 'developer' };

// ─── Exports list ──────────────────────────────────────────────
//
// NOTE: scout / journalist / creator / analyst / commentator / agent
// had generic configs here in Phase 1, but Phase 2 promoted them to
// full custom renderers under roles/<name>/. Their old generic config
// definitions remain above for reference, but are intentionally NOT
// included in this array — the registry's custom modules take over.
// (The `if (!REGISTRY.has(cfg.role))` guard in registry.tsx would
//  silently skip them anyway, but excluding them here is cleaner.)
//
// Phase 3 likewise promoted: organization, competition, league,
// academy, venue, business, commercial-partner, community.
// Remaining in this array: fan, official, support-staff, moderator,
// administrator (and their 4 legacy aliases).
export const genericConfigs: RoleConfig[] = [
  fanConfig,
  officialConfig,
  supportStaffConfig,
  moderatorConfig,
  administratorConfig,
  // legacy aliases
  refereeConfig,
  stadiumConfig,
  medicalConfig,
  developerConfig,
];
