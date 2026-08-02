// SportSphere Unified Profile Configuration System
// Every profile follows: Header → Overview → Content → Sports → Community → Commerce → About

import type { ProfileTypeId } from '@/types';

export type { ProfileTypeId };

export type TabCategory = 'overview' | 'content' | 'sports' | 'community' | 'commerce' | 'about';

export interface ProfileTab {
  id: string;
  label: string;
  category: TabCategory;
  icon?: string; // lucide icon name
}

export interface ProfileAction {
  id: string;
  label: string;
  primary?: boolean;
}

export interface ProfileTypeConfig {
  id: ProfileTypeId;
  label: string;
  emoji: string;
  tabs: ProfileTab[];
  primaryActions: ProfileAction[];
  // ⚠️ PLACEHOLDER: mockData is used as fallback when no real profile exists.
  // In Phase B, this will be replaced by database-backed profile data.
  mockData: ProfileMockData;
}

export interface ProfileMockData {
  name: string;
  handle?: string;
  role?: string;
  bio?: string;
  avatar: string;
  coverGradient: string;
  verified: boolean;
  stats: { label: string; value: string }[];
  location?: string;
  joined?: string;
}

// Tab definitions
const TABS = {
  overview: { id: 'overview', label: 'Overview', category: 'overview' as TabCategory },
  feed: { id: 'feed', label: 'Feed', category: 'content' as TabCategory },
  posts: { id: 'posts', label: 'Posts', category: 'content' as TabCategory },
  articles: { id: 'articles', label: 'Articles', category: 'content' as TabCategory },
  videos: { id: 'videos', label: 'Videos', category: 'content' as TabCategory },
  spotlight: { id: 'spotlight', label: 'Spotlight', category: 'content' as TabCategory },
  analysis: { id: 'analysis', label: 'Analysis', category: 'content' as TabCategory },
  predictions: { id: 'predictions', label: 'Predictions', category: 'content' as TabCategory },
  news: { id: 'news', label: 'News', category: 'content' as TabCategory },
  podcasts: { id: 'podcasts', label: 'Podcasts', category: 'content' as TabCategory },
  reports: { id: 'reports', label: 'Reports', category: 'content' as TabCategory },
  tactical_boards: { id: 'tactical-boards', label: 'Tactical Boards', category: 'content' as TabCategory },
  watchlist: { id: 'watchlist', label: 'Watchlist', category: 'content' as TabCategory },
  career: { id: 'career', label: 'Career', category: 'sports' as TabCategory },
  statistics: { id: 'statistics', label: 'Statistics', category: 'sports' as TabCategory },
  matches: { id: 'matches', label: 'Matches', category: 'sports' as TabCategory },
  squad: { id: 'squad', label: 'Squad', category: 'sports' as TabCategory },
  fixtures: { id: 'fixtures', label: 'Fixtures', category: 'sports' as TabCategory },
  results: { id: 'results', label: 'Results', category: 'sports' as TabCategory },
  standings: { id: 'standings', label: 'Standings', category: 'sports' as TabCategory },
  transfers: { id: 'transfers', label: 'Transfers', category: 'sports' as TabCategory },
  teams: { id: 'teams', label: 'Teams', category: 'sports' as TabCategory },
  players: { id: 'players', label: 'Players', category: 'sports' as TabCategory },
  coaches: { id: 'coaches', label: 'Coaches', category: 'sports' as TabCategory },
  competitions: { id: 'competitions', label: 'Competitions', category: 'sports' as TabCategory },
  rankings: { id: 'rankings', label: 'Rankings', category: 'sports' as TabCategory },
  officials: { id: 'officials', label: 'Officials', category: 'sports' as TabCategory },
  awards: { id: 'awards', label: 'Awards', category: 'sports' as TabCategory },
  tactics: { id: 'tactics', label: 'Tactics', category: 'sports' as TabCategory },
  timeline: { id: 'timeline', label: 'Timeline', category: 'sports' as TabCategory },
  commentary: { id: 'commentary', label: 'Commentary', category: 'sports' as TabCategory },
  lineups: { id: 'lineups', label: 'Lineups', category: 'sports' as TabCategory },
  highlights: { id: 'highlights', label: 'Highlights', category: 'sports' as TabCategory },
  polls: { id: 'polls', label: 'Polls', category: 'sports' as TabCategory },
  fan_chat: { id: 'fan-chat', label: 'Fan Chat', category: 'community' as TabCategory },
  events: { id: 'events', label: 'Events', category: 'community' as TabCategory },
  gallery: { id: 'gallery', label: 'Gallery', category: 'community' as TabCategory },
  fans: { id: 'fans', label: 'Fans', category: 'community' as TabCategory },
  followers: { id: 'followers', label: 'Followers', category: 'community' as TabCategory },
  members: { id: 'members', label: 'Members', category: 'community' as TabCategory },
  media: { id: 'media', label: 'Media', category: 'community' as TabCategory },
  reviews: { id: 'reviews', label: 'Reviews', category: 'community' as TabCategory },
  map: { id: 'map', label: 'Map', category: 'community' as TabCategory },
  facilities: { id: 'facilities', label: 'Facilities', category: 'community' as TabCategory },
  programs: { id: 'programs', label: 'Programs', category: 'community' as TabCategory },
  documents: { id: 'documents', label: 'Documents', category: 'community' as TabCategory },
  products: { id: 'products', label: 'Products', category: 'commerce' as TabCategory },
  services: { id: 'services', label: 'Services', category: 'commerce' as TabCategory },
  offers: { id: 'offers', label: 'Offers', category: 'commerce' as TabCategory },
  shop: { id: 'shop', label: 'Shop', category: 'commerce' as TabCategory },
  tickets: { id: 'tickets', label: 'Tickets', category: 'commerce' as TabCategory },
  registration: { id: 'registration', label: 'Registration', category: 'commerce' as TabCategory },
  about: { id: 'about', label: 'About', category: 'about' as TabCategory },
  live: { id: 'live', label: 'Live', category: 'content' as TabCategory },
  recommendations: { id: 'recommendations', label: 'Recommendations', category: 'content' as TabCategory },
  performance: { id: 'performance', label: 'Performance', category: 'sports' as TabCategory },
  history: { id: 'history', label: 'History', category: 'sports' as TabCategory },
  achievements: { id: 'achievements', label: 'Achievements', category: 'sports' as TabCategory },
  communities: { id: 'communities', label: 'Communities', category: 'community' as TabCategory },
};

// Profile type configurations
export const PROFILE_TYPES: Record<ProfileTypeId, ProfileTypeConfig> = {
  team: {
    id: 'team',
    label: 'Team',
    emoji: '👥',
    tabs: [
      TABS.overview, TABS.feed, TABS.squad, TABS.fixtures, TABS.results,
      TABS.standings, TABS.statistics, TABS.transfers, TABS.media,
      TABS.fans, TABS.shop, TABS.tickets, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'fixtures', label: 'Fixtures' },
      { id: 'squad', label: 'Squad' },
    ],
    mockData: {
      name: 'Manchester United',
      handle: '@manutd',
      role: 'Premier League Club',
      bio: 'One of the most successful football clubs in history. 20x League Champions, 3x Champions League winners. Based in Manchester, England.',
      avatar: 'MU',
      coverGradient: 'from-gold via-orange-500 to-red-800',
      verified: true,
      stats: [
        { label: 'Trophies', value: '66' },
        { label: 'Fans', value: '12.4M' },
        { label: 'Founded', value: '1878' },
        { label: 'League', value: 'PL' },
      ],
      location: 'Manchester, England',
    },
  },

  competition: {
    id: 'competition',
    label: 'Competition',
    emoji: '🏆',
    tabs: [
      TABS.overview, TABS.feed, TABS.fixtures, TABS.results, TABS.standings,
      TABS.statistics, TABS.teams, TABS.players, TABS.awards, TABS.media,
      TABS.fans, TABS.shop, TABS.tickets, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'standings', label: 'Standings' },
      { id: 'fixtures', label: 'Fixtures' },
    ],
    mockData: {
      name: 'Premier League',
      handle: '@premierleague',
      role: 'Top Division of English Football',
      bio: 'The most-watched football league in the world. 20 teams compete from August to May for the championship title.',
      avatar: 'PL',
      coverGradient: 'from-gold via-yellow-500 to-orange-600',
      verified: true,
      stats: [
        { label: 'Season', value: '24/25' },
        { label: 'Teams', value: '20' },
        { label: 'Fans', value: '8.2M' },
        { label: 'Matchday', value: '15' },
      ],
    },
  },

  match: {
    id: 'match',
    label: 'Match',
    emoji: '⚽',
    tabs: [
      TABS.overview, TABS.timeline, TABS.commentary, TABS.lineups,
      TABS.statistics, TABS.highlights, TABS.polls, TABS.predictions,
      TABS.fan_chat, TABS.media, TABS.tickets, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'chat', label: 'Chat' },
      { id: 'predict', label: 'Predict' },
    ],
    mockData: {
      name: 'Man Utd vs Arsenal',
      role: 'Premier League - Matchday 15',
      bio: 'Old Trafford, Manchester. Kick-off 17:30 BST.',
      avatar: 'VS',
      coverGradient: 'from-gold via-yellow-500 to-emerald-700',
      verified: false,
      stats: [
        { label: 'Score', value: '2 - 1' },
        { label: 'Minute', value: "78'" },
        { label: 'Attendance', value: '74K' },
        { label: 'Status', value: 'LIVE' },
      ],
    },
  },

  player: {
    id: 'player',
    label: 'Player',
    emoji: '👤',
    tabs: [
      TABS.overview, TABS.feed, TABS.career, TABS.statistics, TABS.matches,
      TABS.achievements, TABS.media, TABS.fans, TABS.shop, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'stats', label: 'Stats' },
      { id: 'career', label: 'Career' },
    ],
    mockData: {
      name: 'Marcus Rashford',
      handle: '@marcusrashford',
      role: 'Forward - Manchester United',
      bio: 'Academy graduate. England international. Known for pace, dribbling and philanthropy.',
      avatar: 'MR',
      coverGradient: 'from-gold via-orange-500 to-red-800',
      verified: true,
      stats: [
        { label: 'Goals', value: '132' },
        { label: 'Assists', value: '67' },
        { label: 'Caps', value: '58' },
        { label: 'Fans', value: '3.2M' },
      ],
      location: 'Manchester, England',
    },
  },

  coach: {
    id: 'coach',
    label: 'Coach',
    emoji: '👨‍🏫',
    tabs: [
      TABS.overview, TABS.feed, TABS.career, TABS.teams, TABS.statistics,
      TABS.tactics, TABS.media, TABS.fans, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'tactics', label: 'Tactics' },
    ],
    mockData: {
      name: 'Pep Guardiola',
      handle: '@pepguardiola',
      role: 'Manager - Manchester City',
      bio: 'One of the greatest managers of all time. Pioneer of tactical innovation.',
      avatar: 'PG',
      coverGradient: 'from-gold via-cyan-400 to-blue-800',
      verified: true,
      stats: [
        { label: 'Trophies', value: '37' },
        { label: 'Win Rate', value: '73%' },
        { label: 'Teams', value: '3' },
        { label: 'Fans', value: '5.1M' },
      ],
    },
  },

  stadium: {
    id: 'stadium',
    label: 'Stadium',
    emoji: '🏟',
    tabs: [
      TABS.overview, TABS.events, TABS.matches, TABS.gallery, TABS.map,
      TABS.facilities, TABS.reviews, TABS.shop, TABS.tickets, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'tickets', label: 'Tickets' },
    ],
    mockData: {
      name: 'Old Trafford',
      handle: '@oldtrafford',
      role: 'Home of Manchester United',
      bio: 'The Theatre of Dreams. Capacity 74,310. One of the most iconic stadiums in world football.',
      avatar: 'OT',
      coverGradient: 'from-gold via-orange-500 to-red-800',
      verified: true,
      stats: [
        { label: 'Capacity', value: '74K' },
        { label: 'Built', value: '1910' },
        { label: 'Events', value: '45' },
        { label: 'Rating', value: '4.8' },
      ],
      location: 'Manchester, England',
    },
  },

  venue: {
    id: 'venue',
    label: 'Venue',
    emoji: '📍',
    tabs: [
      TABS.overview, TABS.events, TABS.gallery, TABS.map,
      TABS.reviews, TABS.shop, TABS.tickets, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'tickets', label: 'Tickets' },
    ],
    mockData: {
      name: 'Wembley Stadium',
      handle: '@wembley',
      role: 'Multi-Purpose Venue',
      bio: 'The home of English football. Hosts FA Cup finals, England internationals, and major concerts.',
      avatar: 'WS',
      coverGradient: 'from-gold via-stone-500 to-stone-800',
      verified: true,
      stats: [
        { label: 'Capacity', value: '90K' },
        { label: 'Events/Yr', value: '32' },
        { label: 'Rating', value: '4.7' },
        { label: 'Fans', value: '1.8M' },
      ],
      location: 'London, England',
    },
  },

  academy: {
    id: 'academy',
    label: 'Academy',
    emoji: '🧒',
    tabs: [
      TABS.overview, TABS.feed, TABS.players, TABS.coaches, TABS.fixtures,
      TABS.results, TABS.statistics, TABS.programs, TABS.gallery,
      TABS.media, TABS.shop, TABS.registration, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'register', label: 'Register', primary: false },
    ],
    mockData: {
      name: 'La Masia',
      handle: '@lamasia',
      role: 'FC Barcelona Academy',
      bio: 'The legendary Barcelona youth academy that produced Messi, Xavi, Iniesta and many more.',
      avatar: 'LM',
      coverGradient: 'from-gold via-red-500 to-blue-800',
      verified: true,
      stats: [
        { label: 'Players', value: '240' },
        { label: 'Graduates', value: '500+' },
        { label: 'Teams', value: '12' },
        { label: 'Founded', value: '1979' },
      ],
      location: 'Barcelona, Spain',
    },
  },

  community: {
    id: 'community',
    label: 'Community',
    emoji: '👥',
    tabs: [
      TABS.overview, TABS.feed, TABS.members, TABS.events,
      TABS.polls, TABS.media, TABS.shop, TABS.about,
    ],
    primaryActions: [
      { id: 'join', label: 'Join', primary: true },
      { id: 'members', label: 'Members' },
    ],
    mockData: {
      name: 'Gooners',
      handle: '@gooners',
      role: 'Arsenal Supporters Community',
      bio: 'The largest Arsenal fan community on SportSphere. Match discussions, news, and banter.',
      avatar: 'GO',
      coverGradient: 'from-gold via-red-500 to-rose-800',
      verified: false,
      stats: [
        { label: 'Members', value: '125K' },
        { label: 'Posts/Day', value: '340' },
        { label: 'Online', value: '2.4K' },
        { label: 'Created', value: '2023' },
      ],
    },
  },

  organization: {
    id: 'organization',
    label: 'Organization',
    emoji: '🏢',
    tabs: [
      TABS.overview, TABS.feed, TABS.competitions, TABS.rankings, TABS.officials,
      TABS.news, TABS.documents, TABS.events, TABS.media,
      TABS.shop, TABS.tickets, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
    ],
    mockData: {
      name: 'FIFA',
      handle: '@fifa',
      role: 'International Football Federation',
      bio: 'The governing body of world football. Organizing the FIFA World Cup and governing the laws of the game.',
      avatar: 'FI',
      coverGradient: 'from-gold via-indigo-500 to-blue-800',
      verified: true,
      stats: [
        { label: 'Members', value: '211' },
        { label: 'Tournaments', value: '15' },
        { label: 'Fans', value: '18M' },
        { label: 'Founded', value: '1904' },
      ],
      location: 'Zurich, Switzerland',
    },
  },

  business: {
    id: 'business',
    label: 'Business',
    emoji: '💼',
    tabs: [
      TABS.overview, TABS.feed, TABS.products, TABS.services,
      TABS.offers, TABS.reviews, TABS.events, TABS.media, TABS.shop, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'shop', label: 'Shop' },
    ],
    mockData: {
      name: 'Nike Football',
      handle: '@nikefootball',
      role: 'Sportswear & Equipment',
      bio: 'Official partner of top football clubs and national teams worldwide.',
      avatar: 'NK',
      coverGradient: 'from-gold via-gray-600 to-black',
      verified: true,
      stats: [
        { label: 'Products', value: '450+' },
        { label: 'Followers', value: '8.5M' },
        { label: 'Rating', value: '4.6' },
        { label: 'Teams', value: '45' },
      ],
    },
  },

  journalist: {
    id: 'journalist',
    label: 'Journalist',
    emoji: '📰',
    tabs: [
      TABS.overview, TABS.articles, TABS.news, TABS.videos,
      TABS.podcasts, TABS.media, TABS.followers, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'articles', label: 'Articles' },
    ],
    mockData: {
      name: 'Fabrizio Romano',
      handle: '@fabrizioromano',
      role: 'Transfer Journalist',
      bio: 'The most trusted football transfer journalist. "Here we go!"',
      avatar: 'FR',
      coverGradient: 'from-gold via-cyan-400 to-teal-800',
      verified: true,
      stats: [
        { label: 'Articles', value: '2.4K' },
        { label: 'Followers', value: '12M' },
        { label: 'Breaking', value: '890' },
        { label: 'Accuracy', value: '99%' },
      ],
    },
  },

  analyst: {
    id: 'analyst',
    label: 'Analyst',
    emoji: '📊',
    tabs: [
      TABS.overview, TABS.analysis, TABS.predictions, TABS.statistics,
      TABS.tactical_boards, TABS.videos, TABS.media, TABS.followers, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'analysis', label: 'Analysis' },
    ],
    mockData: {
      name: 'Stats Perform',
      handle: '@statsperform',
      role: 'Data & Analytics Provider',
      bio: 'Industry-leading sports data, AI-powered analytics and performance insights.',
      avatar: 'SP',
      coverGradient: 'from-gold via-emerald-500 to-emerald-800',
      verified: true,
      stats: [
        { label: 'Reports', value: '1.2K' },
        { label: 'Followers', value: '450K' },
        { label: 'Data Points', value: '5B+' },
        { label: 'Leagues', value: '80' },
      ],
    },
  },

  creator: {
    id: 'creator',
    label: 'Creator',
    emoji: '🎥',
    tabs: [
      TABS.overview, TABS.feed, TABS.videos, TABS.spotlight,
      TABS.live, TABS.media, TABS.followers, TABS.shop, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'subscribe', label: 'Subscribe' },
    ],
    mockData: {
      name: 'Goal Highlights HD',
      handle: '@goalshd',
      role: 'Content Creator',
      bio: 'Every goal, every game, every highlight. Bringing you the best football content in 4K.',
      avatar: 'GH',
      coverGradient: 'from-gold via-violet-400 to-purple-800',
      verified: true,
      stats: [
        { label: 'Videos', value: '3.8K' },
        { label: 'Subscribers', value: '2.1M' },
        { label: 'Views', value: '450M' },
        { label: 'Spotlight', value: '890' },
      ],
    },
  },

  scout: {
    id: 'scout',
    label: 'Scout',
    emoji: '🔍',
    tabs: [
      TABS.overview, TABS.reports, TABS.watchlist, TABS.players,
      TABS.recommendations, TABS.media, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'reports', label: 'Reports' },
    ],
    mockData: {
      name: 'David Tshiani',
      handle: '@davidtshiani',
      role: 'Football Scout',
      bio: 'Identifying the next generation of football talent across Africa and Europe.',
      avatar: 'DT',
      coverGradient: 'from-gold via-amber-400 to-orange-800',
      verified: false,
      stats: [
        { label: 'Reports', value: '340' },
        { label: 'Watchlist', value: '89' },
        { label: 'Recommendations', value: '56' },
        { label: 'Followers', value: '12K' },
      ],
    },
  },

  referee: {
    id: 'referee',
    label: 'Referee',
    emoji: '⚖️',
    tabs: [
      TABS.overview, TABS.matches, TABS.statistics, TABS.performance,
      TABS.history, TABS.media, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
    ],
    mockData: {
      name: 'Michael Oliver',
      handle: '@michaeloliver',
      role: 'FIFA Referee',
      bio: 'One of the most respected referees in world football. Premier League and FIFA listed.',
      avatar: 'MO',
      coverGradient: 'from-gold via-lime-400 to-emerald-800',
      verified: true,
      stats: [
        { label: 'Matches', value: '520' },
        { label: 'Yellow', value: '1.8K' },
        { label: 'Red', value: '42' },
        { label: 'Rating', value: '8.4' },
      ],
    },
  },

  fan: {
    id: 'fan',
    label: 'Fan',
    emoji: '👤',
    tabs: [
      TABS.overview, TABS.feed, TABS.posts, TABS.media, TABS.spotlight,
      TABS.predictions, TABS.achievements, TABS.communities, TABS.shop, TABS.about,
    ],
    primaryActions: [
      { id: 'follow', label: 'Follow', primary: true },
      { id: 'message', label: 'Message' },
    ],
    mockData: {
      name: 'David Mbaza',
      handle: '@davidmbaza',
      role: 'Sports Fan',
      bio: 'Football is life. Man Utd till I die. Predictions guru.',
      avatar: 'DM',
      coverGradient: 'from-gold via-red-500 to-red-800',
      verified: false,
      stats: [
        { label: 'Posts', value: '52' },
        { label: 'Followers', value: '1.2K' },
        { label: 'Predictions', value: '89%' },
        { label: 'Badges', value: '14' },
      ],
      location: 'Kampala, Uganda',
      joined: 'January 2024',
    },
  },
};

// Helper to get all profile types as array
export const ALL_PROFILE_TYPES: ProfileTypeConfig[] = Object.values(PROFILE_TYPES);
