import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SHOP_SEED = [
  { name: 'Home Kit 24/25', price: '$89.99', category: 'Kit', role: 'Official' },
  { name: 'Away Kit 24/25', price: '$89.99', category: 'Kit', role: 'Official' },
  { name: 'Training Top', price: '$54.99', category: 'Training', role: 'Training' },
  { name: 'Scarf', price: '$24.99', category: 'Accessories', role: 'Fan' },
  { name: 'Cap', price: '$29.99', category: 'Accessories', role: 'Fan' },
];

const TICKETS_SEED = [
  { name: 'Home vs City — Lower Tier', price: 'From $65', category: 'Matchday', role: 'General' },
  { name: 'Home vs City — Upper Tier', price: 'From $45', category: 'Matchday', role: 'General' },
  { name: 'Season Ticket (Adult)', price: 'From $890', category: 'Season', role: 'Membership' },
  { name: 'Family Pack (4)', price: 'From $180', category: 'Matchday', role: 'Family' },
];

const MEDIA_SEED = [
  { title: 'Matchday highlights', type: 'video', date: '2025-01-12' },
  { title: 'Training gallery', type: 'gallery', date: '2025-01-10' },
  { title: 'Press conference', type: 'video', date: '2025-01-08' },
  { title: 'Behind the scenes', type: 'gallery', date: '2025-01-05' },
];

const FEED_SEED = [
  { content: 'Full-time reaction — big three points at home.', type: 'post', createdAt: '2025-01-12T18:00:00Z' },
  { content: 'Training complete. Ready for the next fixture.', type: 'post', createdAt: '2025-01-11T11:00:00Z' },
  { content: 'Thanks to the fans for the support this week.', type: 'post', createdAt: '2025-01-09T16:30:00Z' },
];

const FIXTURES_SEED = [
  { home: 'Home', away: 'City', date: '2025-01-18 17:30', competition: 'League', score: null },
  { home: 'Away', away: 'Arsenal', date: '2025-01-25 15:00', competition: 'League', score: null },
  { home: 'Home', away: 'Liverpool', date: '2025-02-01 20:00', competition: 'Cup', score: null },
  { home: 'Home', away: 'Chelsea', date: '2024-12-28 16:30', competition: 'League', score: '2-1' },
];

const PLAYER_DATA: Record<string, Record<string, unknown>> = {
  rashford: {
    name: 'Marcus Rashford', position: 'Forward', number: 10,
    nationality: 'England', age: 26, height: '180 cm', weight: '70 kg',
    dateOfBirth: '31 October 1997',
    currentTeam: 'Manchester United', teamHandle: '@manchesterunited',
    marketValue: '€65M', worldRank: 28, nationalRank: 4,
    foot: 'Right', dominantSide: 'Right', contractUntil: '2028', agentName: 'CAA Stellar',
    injuryStatus: 'Fit',
    skills: ['Pace & Acceleration', 'Clinical Finishing', 'Dribbling', 'Left Wing Play', 'Counter-Attacking', 'Philanthropy & Leadership'],
    sponsors: [
      { name: 'Nike', role: 'Kit & Boots' },
      { name: 'EA Sports', role: 'Brand Ambassador' },
      { name: 'Cadbury', role: 'Partner' },
    ],
    seasonStats: {
      season: '2024/25', goals: 12, assists: 5, appearances: 18,
      minutesPlayed: 1450, yellowCards: 2, redCards: 0,
      passAccuracy: 84, dribbleSuccess: 68, shotAccuracy: 52,
      rating: 7.4, xG: 10.2, xA: 4.1,
    },
    careerStats: { totalGoals: 132, totalAssists: 67, totalApps: 340, internationalGoals: 17, internationalCaps: 58 },
    careerTimeline: [
      { season: '2015–16', team: 'Manchester United', apps: 18, goals: 5, assists: 3, honours: ['PL Debut'] },
      { season: '2016–17', team: 'Manchester United', apps: 32, goals: 11, assists: 5, honours: ['Europa League', 'EFL Cup'] },
      { season: '2022–23', team: 'Manchester United', apps: 56, goals: 30, assists: 10, honours: ['League Cup'] },
      { season: '2023–24', team: 'Manchester United', apps: 43, goals: 7, assists: 5, honours: ['FA Cup'] },
      { season: '2024–25', team: 'Manchester United', apps: 18, goals: 12, assists: 5, honours: [] },
    ],
    honours: [
      { title: 'Europa League', year: '2017', team: 'Man Utd' },
      { title: 'EFL Cup', year: '2017', team: 'Man Utd' },
      { title: 'League Cup', year: '2023', team: 'Man Utd' },
      { title: 'FA Cup', year: '2024', team: 'Man Utd' },
    ],
    international: {
      team: 'England', caps: 58, goals: 17, assists: 9,
      tournaments: ['Euro 2020 (Final)', 'World Cup 2022 (QF)', 'Euro 2024'],
    },
    shop: SHOP_SEED,
    tickets: TICKETS_SEED,
    media: MEDIA_SEED,
    feed: FEED_SEED,
    fixtures: FIXTURES_SEED,
    about: 'England international forward known for pace, finishing, and community leadership.',
  },
};

const TEAM_DATA: Record<string, Record<string, unknown>> = {
  manchesterunited: {
    name: 'Manchester United', founded: 1878,
    stadium: 'Old Trafford', stadiumCapacity: '74,310',
    manager: 'Erik ten Hag', league: 'Premier League', country: 'England',
    trophies: { leagueTitles: 20, championsLeague: 3, faCups: 12, leagueCups: 6 },
    currentSeason: { played: 15, won: 8, drawn: 3, lost: 4, gf: 28, ga: 22, pts: 27, position: 6, form: ['W', 'W', 'D', 'L', 'W'] },
    sponsors: [
      { name: 'TeamViewer', role: 'Principal Partner' },
      { name: 'Adidas', role: 'Kit Manufacturer' },
      { name: 'Kohler', role: 'Training Kit' },
      { name: 'Tezos', role: 'Training Partner' },
    ],
    topScorers: [
      { name: 'Marcus Rashford', goals: 12, pos: 'FW' },
      { name: 'Bruno Fernandes', goals: 7, pos: 'CM' },
      { name: 'Rasmus Hojlund', goals: 6, pos: 'ST' },
    ],
    squad: [
      { name: 'André Onana', number: 24, pos: 'GK', nat: 'CMR' },
      { name: 'Harry Maguire', number: 5, pos: 'CB', nat: 'ENG' },
      { name: 'Luke Shaw', number: 23, pos: 'LB', nat: 'ENG' },
      { name: 'Diogo Dalot', number: 20, pos: 'RB', nat: 'POR' },
      { name: 'Kobbie Mainoo', number: 37, pos: 'CM', nat: 'ENG' },
      { name: 'Bruno Fernandes', number: 8, pos: 'CM', nat: 'POR' },
      { name: 'Alejandro Garnacho', number: 17, pos: 'LW', nat: 'ARG' },
      { name: 'Marcus Rashford', number: 10, pos: 'FW', nat: 'ENG' },
      { name: 'Rasmus Hojlund', number: 11, pos: 'ST', nat: 'DEN' },
    ],
    coaches: [
      { name: 'Erik ten Hag', role: 'Head Coach', nat: 'NED' },
      { name: 'Mitchell van der Gaag', role: 'Assistant Coach', nat: 'NED' },
      { name: 'Richard Hartis', role: 'Goalkeeping Coach', nat: 'ENG' },
      { name: 'Benni McCarthy', role: 'Attacking Coach', nat: 'RSA' },
    ],
    shop: SHOP_SEED,
    tickets: TICKETS_SEED,
    media: MEDIA_SEED,
    feed: FEED_SEED,
    fixtures: FIXTURES_SEED,
    results: [
      { home: 'Man Utd', away: 'Chelsea', date: '2024-12-28', competition: 'League', score: '2-1' },
      { home: 'Everton', away: 'Man Utd', date: '2024-12-21', competition: 'League', score: '1-1' },
      { home: 'Man Utd', away: 'City', date: '2024-12-15', competition: 'League', score: '0-2' },
    ],
    standings: [
      { team: 'Liverpool', played: 15, pts: 36, gd: 18, position: 1 },
      { team: 'Arsenal', played: 15, pts: 33, gd: 14, position: 2 },
      { team: 'Man City', played: 15, pts: 31, gd: 12, position: 3 },
      { team: 'Chelsea', played: 15, pts: 28, gd: 8, position: 4 },
      { team: 'Man Utd', played: 15, pts: 27, gd: 6, position: 6 },
    ],
    about: 'Founded in 1878. One of the most decorated clubs in English football, based at Old Trafford.',
  },
};

const COACH_DATA: Record<string, Record<string, unknown>> = {
  default: {
    name: 'Head Coach',
    position: 'Coach',
    currentTeam: 'Club',
    nationality: '—',
    about: 'Coaching profile with tactics, results and media.',
    seasonStats: { matches: 20, wins: 11, draws: 4, losses: 5, pointsPerGame: 1.85 },
    careerStats: { totalMatches: 320, winPct: 52 },
    squad: TEAM_DATA.manchesterunited.squad,
    fixtures: FIXTURES_SEED,
    media: MEDIA_SEED,
    feed: FEED_SEED,
    shop: SHOP_SEED,
    tickets: TICKETS_SEED,
    honours: [{ title: 'League Cup', year: '2023', team: 'Man Utd' }],
  },
};

const COMPETITION_DATA: Record<string, Record<string, unknown>> = {
  premierLeague: {
    name: 'Premier League', season: '2024/25', country: 'England',
    teams: 20, currentMatchday: 15,
    topScorers: [
      { name: 'Erling Haaland', team: 'Man City', goals: 18, apps: 15 },
      { name: 'Cole Palmer', team: 'Chelsea', goals: 14, apps: 15 },
      { name: 'Marcus Rashford', team: 'Man Utd', goals: 12, apps: 15 },
    ],
    standings: TEAM_DATA.manchesterunited.standings,
    fixtures: FIXTURES_SEED,
    media: MEDIA_SEED,
    shop: SHOP_SEED,
    tickets: TICKETS_SEED,
    about: 'Top division of the English football league system.',
  },
};

function withDefaults(base: Record<string, unknown> | null, label: string): Record<string, unknown> {
  const data = { ...(base || {}) };
  if (!Array.isArray(data.shop) || (data.shop as unknown[]).length === 0) data.shop = SHOP_SEED;
  if (!Array.isArray(data.tickets) || (data.tickets as unknown[]).length === 0) data.tickets = TICKETS_SEED;
  if (!Array.isArray(data.media) || (data.media as unknown[]).length === 0) data.media = MEDIA_SEED;
  if (!Array.isArray(data.feed) || (data.feed as unknown[]).length === 0) data.feed = FEED_SEED;
  if (!Array.isArray(data.fixtures) || (data.fixtures as unknown[]).length === 0) data.fixtures = FIXTURES_SEED;
  if (!data.about) data.about = `${label} profile on SportSphere — stats, media, shop and tickets.`;
  if (!data.name) data.name = label;
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = (searchParams.get('type') || 'player').toLowerCase();
    const key = (searchParams.get('key') || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    let data: Record<string, unknown> | null = null;

    switch (type) {
      case 'player':
        data = (key && PLAYER_DATA[key]) || PLAYER_DATA.rashford;
        data = withDefaults(data, key || 'Player');
        break;
      case 'team':
        data = (key && TEAM_DATA[key]) || TEAM_DATA.manchesterunited;
        data = withDefaults(data, key || 'Team');
        break;
      case 'coach':
        data = (key && COACH_DATA[key]) || COACH_DATA.default;
        data = withDefaults(data, key || 'Coach');
        break;
      case 'competition':
      case 'league':
        data = (key && COMPETITION_DATA[key]) || COMPETITION_DATA.premierLeague;
        data = withDefaults(data, key || 'Competition');
        break;
      default:
        // Fan / generic roles still get interactive sections
        data = withDefaults(
          {
            name: key || 'Profile',
            feed: FEED_SEED,
            media: MEDIA_SEED,
            shop: SHOP_SEED,
            tickets: TICKETS_SEED,
          },
          key || 'Profile',
        );
        break;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Profile data API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}
