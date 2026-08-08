import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLAYER_DATA = {
  rashford: {
    name: 'Marcus Rashford', position: 'Forward', number: 10,
    nationality: 'England', age: 26, height: '180 cm', weight: '70 kg',
    dateOfBirth: '31 October 1997',
    currentTeam: 'Manchester United', teamHandle: '@manchesterunited',
    marketValue: '\u20ac65M', worldRank: 28, nationalRank: 4,
    foot: 'Right', dominantSide: 'Right', contractUntil: '2028', agentName: 'CAA Stellar',
    injuryStatus: 'Fit' as 'Fit' | 'Injured' | 'Doubtful',
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
      { season: '2015\u201316', team: 'Manchester United', apps: 18, goals: 5,  assists: 3,  honours: ['PL Debut'] },
      { season: '2016\u201317', team: 'Manchester United', apps: 32, goals: 11, assists: 5, honours: ['Europa League','EFL Cup'] },
      { season: '2019\u201320', team: 'Manchester United', apps: 45, goals: 22, assists: 12, honours: [] },
      { season: '2022\u201323', team: 'Manchester United', apps: 56, goals: 30, assists: 10, honours: ['League Cup'] },
      { season: '2023\u201324', team: 'Manchester United', apps: 43, goals: 7,  assists: 5,  honours: ['FA Cup'] },
      { season: '2024\u201325', team: 'Manchester United', apps: 18, goals: 12, assists: 5,  honours: [] },
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
  },
};

const TEAM_DATA = {
  manchesterunited: {
    name: 'Manchester United', founded: 1878,
    stadium: 'Old Trafford', stadiumCapacity: '74,310',
    manager: 'Erik ten Hag', league: 'Premier League', country: 'England',
    trophies: { leagueTitles: 20, championsLeague: 3, faCups: 12, leagueCups: 6 },
    currentSeason: { played: 15, won: 8, drawn: 3, lost: 4, gf: 28, ga: 22, pts: 27, position: 6, form: ['W','W','D','L','W'] },
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
      { name: 'Andr\u00e9 Onana', number: 24, pos: 'GK', nat: 'CMR' },
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
  },
};

const COMPETITION_DATA = {
  premierLeague: {
    name: 'Premier League', season: '2024/25', country: 'England',
    teams: 20, currentMatchday: 15,
    topScorers: [
      { name: 'Erling Haaland', team: 'Man City', goals: 18, apps: 15 },
      { name: 'Cole Palmer', team: 'Chelsea', goals: 14, apps: 15 },
      { name: 'Marcus Rashford', team: 'Man Utd', goals: 12, apps: 15 },
      { name: 'Mohamed Salah', team: 'Liverpool', goals: 11, apps: 15 },
      { name: 'Bukayo Saka', team: 'Arsenal', goals: 10, apps: 14 },
    ],
    topAssists: [
      { name: 'Mohamed Salah', team: 'Liverpool', assists: 10, apps: 15 },
      { name: 'Bukayo Saka', team: 'Arsenal', assists: 9, apps: 14 },
      { name: 'Bruno Fernandes', team: 'Man Utd', assists: 8, apps: 15 },
      { name: 'Phil Foden', team: 'Man City', assists: 7, apps: 14 },
    ],
    cleanSheets: [
      { team: 'Arsenal', cs: 8, apps: 15 },
      { team: 'Manchester City', cs: 7, apps: 15 },
      { team: 'Liverpool', cs: 6, apps: 15 },
    ],
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'player';
    const key = searchParams.get('key') || 'rashford';

    let data: unknown = null;

    switch (type) {
      case 'player':
        data = (PLAYER_DATA as Record<string, unknown>)[key] || null;
        break;
      case 'team':
        data = (TEAM_DATA as Record<string, unknown>)[key] || null;
        break;
      case 'competition':
        data = (COMPETITION_DATA as Record<string, unknown>)[key] || null;
        break;
    }

    if (!data) {
      return NextResponse.json({ error: 'Profile data not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Profile data API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}
