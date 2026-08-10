/**
 * sports-api.ts — Free sports data provider
 *
 * Primary:  TheSportsDB  (test key "3" — no signup required)
 * Secondary: API-Sports   (set SPORTS_API_KEY env var — 100 req/day free)
 *
 * All functions return normalised shapes so the rest of the app
 * doesn't care which provider is active.
 */

// ─── Normalised types ───────────────────────────────────────────

export interface SportsMatch {
  id: string;
  league: string;
  leagueId: string;
  leagueBadge?: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  homeBadge?: string;
  awayBadge?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'live' | 'ht' | 'ft' | 'upcoming' | 'postponed' | 'cancelled';
  minute: number | null;
  kickoffAt: string;       // ISO string
  venue?: string;
}

export interface StandingRow {
  pos: number;
  team: string;
  badge?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface LeagueInfo {
  id: string;
  name: string;
  country: string;
  badge?: string;
  sport: string;
}

// ─── Simple in-memory cache (seconds TTL) ───────────────────────
const cache = new Map<string, { data: unknown; ts: number }>();
function cached<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttlSec * 1000) return Promise.resolve(hit.data as T);
  return fn().then((data) => { cache.set(key, { data, ts: Date.now() }); return data; });
}

// ─── Provider selection ──────────────────────────────────────────
const API_SPORTS_KEY = process.env.SPORTS_API_KEY;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  THE SPORTS DB  (works with public test key "3")
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TSD_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

function tsdStatus(s: string | null | undefined): SportsMatch['status'] {
  if (!s) return 'upcoming';
  const lower = s.toLowerCase();
  if (lower.includes('live') || lower.includes('in progress') || lower.includes('1st half') || lower.includes('2nd half') || lower.includes('halftime') || lower.includes('half time') || lower.includes('penalties') || lower.includes('extra time')) return 'live';
  if (lower === 'ht' || lower.includes('half time')) return 'ht';
  if (lower.includes('finished') || lower.includes('full time') || lower.includes('ft') || lower.includes('after et') || lower.includes('after penalties') || lower.includes('award')) return 'ft';
  if (lower.includes('postponed') || lower.includes('delayed')) return 'postponed';
  if (lower.includes('cancelled') || lower.includes('abandoned')) return 'cancelled';
  return 'upcoming';
}

function tsdMinute(strProgress: string | null | undefined, strStatus: string | null | undefined): number | null {
  if (strProgress) {
    const m = strProgress.match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
  }
  // Some events have strMinute
  if (strStatus && (strStatus.toLowerCase().includes('1st half'))) return 45;
  if (strStatus && (strStatus.toLowerCase().includes('2nd half'))) return 90;
  return null;
}

function tsdMatch(e: Record<string, any>): SportsMatch {
  return {
    id: e.idEvent || String(e.id),
    league: e.strLeague || '',
    leagueId: e.idLeague || '',
    leagueBadge: e.strBadge || e.strLeagueBadge || undefined,
    country: e.strCountry || '',
    homeTeam: e.strHomeTeam || '',
    awayTeam: e.strAwayTeam || '',
    homeBadge: e.strHomeTeamBadge || e.strBadgeHome || undefined,
    awayBadge: e.strAwayTeamBadge || e.strBadgeAway || undefined,
    homeScore: e.intHomeScore != null ? parseInt(e.intHomeScore, 10) : null,
    awayScore: e.intAwayScore != null ? parseInt(e.intAwayScore, 10) : null,
    status: tsdStatus(e.strStatus),
    minute: tsdMinute(e.strProgress, e.strStatus),
    kickoffAt: e.strTimestamp || e.dateEvent || '',
    venue: e.strVenue || undefined,
  };
}

function tsdStanding(r: Record<string, any>): StandingRow {
  const gf = parseInt(r.intGoalsFor, 10) || 0;
  const ga = parseInt(r.intGoalsAgainst, 10) || 0;
  return {
    pos: parseInt(r.intRank, 10) || 0,
    team: r.strTeam || '',
    badge: r.strTeamBadge || r.strBadge || undefined,
    played: parseInt(r.intPlayed, 10) || 0,
    won: parseInt(r.intWin, 10) || 0,
    drawn: parseInt(r.intDraw, 10) || 0,
    lost: parseInt(r.intLoss, 10) || 0,
    gf,
    ga,
    gd: gf - ga,
    pts: parseInt(r.intPoints, 10) || 0,
  };
}

// TheSportsDB fetches
async function tsdGet(path: string): Promise<any> {
  try {
    const res = await fetch(`${TSD_BASE}/${path}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`TSD ${res.status}`);
    const text = await res.text();
    if (!text || text.trim().length === 0) return {};
    return JSON.parse(text);
  } catch (err) {
    console.warn(`[TSD] Request failed for ${path}:`, err instanceof Error ? err.message : err);
    return {};
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  API-SPORTS  (optional — set SPORTS_API_KEY)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AS_BASE = 'https://v3.football.api-sports.io';

function asStatus(s: number): SportsMatch['status'] {
  if (s === 97 || s === 98 || s === 99) return 'live';
  if (s === 30 || s === 31) return 'ht';
  if (s >= 34 && s <= 40) return 'ft';
  if (s === 6 || s === 7) return 'upcoming';
  if (s === 8 || s === 9) return 'postponed';
  if (s === 10 || s === 11) return 'cancelled';
  return 'upcoming';
}

async function asGet(path: string): Promise<any> {
  const res = await fetch(`${AS_BASE}${path}`, {
    headers: { 'x-apisports-key': API_SPORTS_KEY! },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`AS ${res.status}`);
  return res.json();
}

function asMatch(f: Record<string, any>, league: Record<string, any>): SportsMatch {
  return {
    id: String(f.fixture.id),
    league: league.name || '',
    leagueId: String(league.id),
    leagueBadge: league.logo || undefined,
    country: league.country || '',
    homeTeam: f.teams.home.name || '',
    awayTeam: f.teams.away.name || '',
    homeBadge: f.teams.home.logo || undefined,
    awayBadge: f.teams.away.logo || undefined,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    status: asStatus(f.fixture.status.short === 'HT' ? 30 : f.fixture.status.id),
    minute: f.fixture.status.elapsed || null,
    kickoffAt: f.fixture.date || '',
    venue: f.fixture.venue?.name,
  };
}

function asStanding(t: Record<string, any>, r: Record<string, any>): StandingRow {
  return {
    pos: r.rank,
    team: t.name || '',
    badge: t.logo || undefined,
    played: r.all.played,
    won: r.all.win,
    drawn: r.all.draw,
    lost: r.all.lose,
    gf: r.all.goals.for,
    ga: r.all.goals.against,
    gd: r.goalsDiff,
    pts: r.points,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PUBLIC API  (provider-agnostic)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Fetch currently live matches */
export async function getLiveMatches(): Promise<SportsMatch[]> {
  if (API_SPORTS_KEY) {
    return cached('as:live', 30, async () => {
      const d = await asGet('/fixtures?live=all');
      return (d.response || []).map((r: any) => asMatch(r.fixture || r, r.league || {}));
    });
  }
  return cached('tsd:live', 30, async () => {
    const d = await tsdGet('livescore.php');
    return (d.events || []).map(tsdMatch).filter((m: SportsMatch) => m.status === 'live');
  });
}

/** Fetch matches for a given date (YYYY-MM-DD). Falls back to today. */
export async function getMatchesByDate(dateStr?: string): Promise<SportsMatch[]> {
  const date = dateStr || new Date().toISOString().slice(0, 10);

  if (API_SPORTS_KEY) {
    return cached(`as:day:${date}`, 300, async () => {
      const d = await asGet(`/fixtures?date=${date}`);
      return (d.response || []).map((r: any) => asMatch(r.fixture || r, r.league || {}));
    });
  }
  return cached(`tsd:day:${date}`, 300, async () => {
    const d = await tsdGet(`eventsday.php?d=${date}&s=Soccer`);
    return (d.events || []).map(tsdMatch);
  });
}

/** Fetch past results for a league */
export async function getPastResults(leagueId: string): Promise<SportsMatch[]> {
  if (API_SPORTS_KEY) {
    return cached(`as:past:${leagueId}`, 300, async () => {
      const d = await asGet(`/fixtures?league=${leagueId}&last=15`);
      return (d.response || []).map((r: any) => asMatch(r.fixture || r, r.league || {}));
    });
  }
  return cached(`tsd:past:${leagueId}`, 300, async () => {
    const d = await tsdGet(`eventspastleague.php?id=${leagueId}`);
    return (d.events || []).map(tsdMatch);
  });
}

/** Fetch upcoming fixtures for a league */
export async function getUpcomingFixtures(leagueId: string): Promise<SportsMatch[]> {
  if (API_SPORTS_KEY) {
    return cached(`as:upcoming:${leagueId}`, 300, async () => {
      const d = await asGet(`/fixtures?league=${leagueId}&next=15`);
      return (d.response || []).map((r: any) => asMatch(r.fixture || r, r.league || {}));
    });
  }
  return cached(`tsd:upcoming:${leagueId}`, 300, async () => {
    const d = await tsdGet(`eventsnextleague.php?id=${leagueId}`);
    return (d.events || []).map(tsdMatch);
  });
}

/** Fetch league standings */
export async function getStandings(leagueId: string): Promise<StandingRow[]> {
  if (API_SPORTS_KEY) {
    return cached(`as:standings:${leagueId}`, 600, async () => {
      const season = new Date().getFullYear();
      const d = await asGet(`/standings?league=${leagueId}&season=${season}`);
      const league = d.response?.[0];
      return (league?.standings || []).map((r: any) => asStanding(r.team || {}, r));
    });
  }
  return cached(`tsd:standings:${leagueId}`, 600, async () => {
    const d = await tsdGet(`lookuptable.php?l=${leagueId}&s=Soccer`);
    return (d.table || []).map(tsdStanding);
  });
}

/** Fetch all available leagues (for filter dropdowns) */
export async function getLeagues(): Promise<LeagueInfo[]> {
  if (API_SPORTS_KEY) {
    return cached('as:leagues', 3600, async () => {
      const d = await asGet('/leagues');
      return (d.response || []).map((l: any) => ({
        id: String(l.league.id),
        name: l.league.name,
        country: l.country?.name || l.country || '',
        badge: l.league.logo || undefined,
        sport: 'Soccer',
      }));
    });
  }
  return cached('tsd:leagues', 3600, async () => {
    const d = await tsdGet('all_leagues.php?s=Soccer');
    return (d.leagues || []).map((l: any) => ({
      id: l.idLeague || '',
      name: l.strLeague || '',
      country: l.strCountry || '',
      badge: l.strBadge || undefined,
      sport: l.strSport || 'Soccer',
    }));
  });
}

/** Default popular league IDs for TheSportsDB */
export const POPULAR_LEAGUE_IDS: Record<string, string> = {
  'English Premier League': '4328',
  'Spanish La Liga': '4335',
  'German Bundesliga': '4331',
  'Italian Serie A': '4332',
  'French Ligue 1': '4334',
  'UEFA Champions League': '4480',
  'UEFA Europa League': '4481',
  'English Championship': '4330',
  'Portuguese Primeira Liga': '4344',
  'Dutch Eredivisie': '4337',
  'Scottish Premiership': '4346',
  'Major League Soccer': '4347',
  'NBA': '4387',
  'NFL': '4391',
};
