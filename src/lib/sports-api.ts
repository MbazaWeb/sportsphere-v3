/**
 * sports-api.ts — Multi-provider sports data
 *
 * Primary:    football-data.org   (free tier — 10 req/s, rich PL data)
 * Secondary:  API-Sports          (set SPORTS_API_KEY env var — 100 req/day free)
 * Fallback:   TheSportsDB         (public test key "3" — no signup)
 *
 * Provider priority is automatic: if FOOTBALL_DATA_ORG_TOKEN is set it wins,
 * then API-SPORTS_KEY, then TheSportsDB.
 */

// ─── Normalised types ───────────────────────────────────────────

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'red_card' | 'yellow_card' | 'substitution' | 'var' | 'penalty';
  player: string;
  team: 'home' | 'away';
  detail?: string;
}

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
  kickoffAt: string;
  venue?: string;
  events?: MatchEvent[];
  continent?: string;
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
const FD_TOKEN = process.env.FOOTBALL_DATA_ORG_TOKEN;
const API_SPORTS_KEY = process.env.SPORTS_API_KEY;

// football-data.org competition IDs
export const FD_COMPETITIONS: Record<string, number> = {
  'English Premier League': 2021,
  'Spanish La Liga': 2014,
  'German Bundesliga': 2002,
  'Italian Serie A': 2019,
  'French Ligue 1': 2015,
  'UEFA Champions League': 2001,
  'UEFA Europa League': 2003,
  'English Championship': 2016,
  'Portuguese Primeira Liga': 2017,
  'Dutch Eredivisie': 2003,
  'Scottish Premiership': 2018,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FOOTBALL-DATA.ORG  (Primary — free tier)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FD_BASE = 'https://api.football-data.org/v4';

async function fdGet(path: string): Promise<any> {
  const res = await fetch(`${FD_BASE}${path}`, {
    headers: { 'X-Auth-Token': FD_TOKEN! },
    next: { revalidate: 60 },
  });
  if (res.status === 429) {
    console.warn('[FD] Rate limited — backing off');
    await new Promise(r => setTimeout(r, 1000));
    const retry = await fetch(`${FD_BASE}${path}`, {
      headers: { 'X-Auth-Token': FD_TOKEN! },
      next: { revalidate: 60 },
    });
    if (!retry.ok) throw new Error(`FD ${retry.status}`);
    return retry.json();
  }
  if (!res.ok) throw new Error(`FD ${res.status}`);
  return res.json();
}

function fdStatus(status: string, minute?: number | null): SportsMatch['status'] {
  if (status === 'IN_PLAY') return 'live';
  if (status === 'PAUSED' || status === 'HALFTIME') return 'ht';
  if (status === 'FINISHED') return 'ft';
  if (status === 'POSTPONED' || status === 'SUSPENDED') return 'postponed';
  if (status === 'CANCELLED') return 'cancelled';
  return 'upcoming';
}

function fdEvents(match: any): MatchEvent[] {
  const evts: MatchEvent[] = [];
  (match.events || []).forEach((e: any) => {
    if (e.type === 'Goal') {
      evts.push({
        minute: e.minute || 0,
        type: 'goal',
        player: e.player?.name || 'Unknown',
        team: e.team?.name === (match.homeTeam?.name || match.homeTeam?.shortName) ? 'home' : 'away',
        detail: e.detail || undefined,
      });
    } else if (e.type === 'Card') {
      if (e.card?.color === 'RED' || e.card?.color === 'SECOND_YELLOW') {
        evts.push({
          minute: e.minute || 0,
          type: 'red_card',
          player: e.player?.name || 'Unknown',
          team: e.team?.name === (match.homeTeam?.name || match.homeTeam?.shortName) ? 'home' : 'away',
        });
      } else {
        evts.push({
          minute: e.minute || 0,
          type: 'yellow_card',
          player: e.player?.name || 'Unknown',
          team: e.team?.name === (match.homeTeam?.name || match.homeTeam?.shortName) ? 'home' : 'away',
        });
      }
    }
  });
  return evts;
}

function fdMatch(m: any): SportsMatch {
  return {
    id: String(m.id),
    league: m.competition?.name || '',
    leagueId: String(m.competition?.id || ''),
    leagueBadge: m.competition?.emblem || undefined,
    country: m.competition?.area?.name || '',
    homeTeam: m.homeTeam?.shortName || m.homeTeam?.name || '',
    awayTeam: m.awayTeam?.shortName || m.awayTeam?.name || '',
    homeBadge: m.homeTeam?.crest || undefined,
    awayBadge: m.awayTeam?.crest || undefined,
    homeScore: m.score?.fullTime?.home,
    awayScore: m.score?.fullTime?.away,
    status: fdStatus(m.status, m.minute),
    minute: m.minute || null,
    kickoffAt: m.utcDate || '',
    venue: m.venue?.name || undefined,
    events: [],
    continent: 'Europe',
  };
}

function fdStanding(t: any, pos: number): StandingRow {
  return {
    pos,
    team: t.team?.shortName || t.team?.name || t.name || '',
    badge: t.team?.crest || t.crest || undefined,
    played: t.playedGames || 0,
    won: t.won || 0,
    drawn: t.draw || 0,
    lost: t.lost || 0,
    gf: t.goalsFor || 0,
    ga: t.goalsAgainst || 0,
    gd: t.goalDifference || 0,
    pts: t.points || 0,
  };
}

// football-data.org specific fetchers
async function fdLiveMatches(): Promise<SportsMatch[]> {
  const d = await fdGet('/matches?status=IN_PLAY');
  return (d.matches || []).map(fdMatch);
}

async function fdMatchesByDate(dateStr: string): Promise<SportsMatch[]> {
  const d = await fdGet(`/matches?date=${dateStr}`);
  return (d.matches || []).map(fdMatch);
}

async function fdPastResults(compId: number, count: number = 15): Promise<SportsMatch[]> {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 7);
  const dateFrom = from.toISOString().slice(0, 10);
  const dateTo = today.toISOString().slice(0, 10);
  const d = await fdGet(`/competitions/${compId}/matches?status=FINISHED&dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${count}`);
  // Fetch events for finished matches (enrich with goals/cards)
  const matches = (d.matches || []).map(fdMatch);
  // Enrich top 8 results with events (goal scorers)
  const enriched = await Promise.all(
    matches.slice(0, 8).map(async (m: SportsMatch) => {
      try {
        const detail = await fdGet(`/matches/${m.id}`);
        return { ...m, events: fdEvents(detail) };
      } catch { return m; }
    })
  );
  return [...enriched, ...matches.slice(8)];
}

async function fdUpcomingFixtures(compId: number, count: number = 15): Promise<SportsMatch[]> {
  const today = new Date();
  const to = new Date(today);
  to.setDate(to.getDate() + 7);
  const dateFrom = today.toISOString().slice(0, 10);
  const dateTo = to.toISOString().slice(0, 10);
  const d = await fdGet(`/competitions/${compId}/matches?status=SCHEDULED&dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${count}`);
  return (d.matches || []).map(fdMatch);
}

async function fdStandings(compId: number): Promise<StandingRow[]> {
  const d = await fdGet(`/competitions/${compId}/standings`);
  const total = d.standings?.[0];
  if (!total?.table) return [];
  return total.table.map((r: any, i: number) => fdStanding(r, i + 1));
}

async function fdLeagues(): Promise<LeagueInfo[]> {
  const d = await fdGet('/competitions');
  return (d.competitions || []).map((c: any) => ({
    id: String(c.id),
    name: c.name || '',
    country: c.area?.name || '',
    badge: c.emblem || undefined,
    sport: 'Football',
  }));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  API-SPORTS  (Secondary)
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

function asMatch(f: any, league: any): SportsMatch {
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
    events: [],
    continent: 'Europe',
  };
}

function asStanding(t: any, r: any): StandingRow {
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
//  THE SPORTS DB  (Fallback)
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
  if (strStatus && strStatus.toLowerCase().includes('1st half')) return 45;
  if (strStatus && strStatus.toLowerCase().includes('2nd half')) return 90;
  return null;
}

function tsdMatch(e: any): SportsMatch {
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
    events: [],
    continent: 'Europe',
  };
}

function tsdStanding(r: any): StandingRow {
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
    gf, ga, gd: gf - ga,
    pts: parseInt(r.intPoints, 10) || 0,
  };
}

async function tsdGet(path: string): Promise<any> {
  try {
    const res = await fetch(`${TSD_BASE}/${path}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`TSD ${res.status}`);
    const text = await res.text();
    if (!text || text.trim().length === 0) return {};
    return JSON.parse(text);
  } catch (err) {
    console.warn(`[TSD] Request failed:`, err instanceof Error ? err.message : err);
    return {};
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PUBLIC API  (provider-agnostic)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Fetch currently live matches */
export async function getLiveMatches(): Promise<SportsMatch[]> {
  // Try football-data.org first
  if (FD_TOKEN) {
    try {
      return await cached('fd:live', 30, fdLiveMatches);
    } catch (e) {
      console.warn('[FD] Live matches failed, falling back:', e);
    }
  }
  // Then API-Sports
  if (API_SPORTS_KEY) {
    try {
      return await cached('as:live', 30, async () => {
        const d = await asGet('/fixtures?live=all');
        return (d.response || []).map((r: any) => asMatch(r.fixture || r, r.league || {}));
      });
    } catch (e) {
      console.warn('[AS] Live matches failed, falling back:', e);
    }
  }
  // Fallback to TheSportsDB
  return cached('tsd:live', 30, async () => {
    const d = await tsdGet('livescore.php');
    return (d.events || []).map(tsdMatch).filter((m: SportsMatch) => m.status === 'live');
  });
}

/** Fetch matches for a given date */
export async function getMatchesByDate(dateStr?: string): Promise<SportsMatch[]> {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  if (FD_TOKEN) {
    try { return await cached(`fd:day:${date}`, 300, () => fdMatchesByDate(date)); }
    catch (e) { console.warn('[FD] Date matches failed, falling back:', e); }
  }
  if (API_SPORTS_KEY) {
    try {
      return await cached(`as:day:${date}`, 300, async () => {
        const d = await asGet(`/fixtures?date=${date}`);
        return (d.response || []).map((r: any) => asMatch(r.fixture || r, r.league || {}));
      });
    } catch (e) { console.warn('[AS] Date matches failed, falling back:', e); }
  }
  return cached(`tsd:day:${date}`, 300, async () => {
    const d = await tsdGet(`eventsday.php?d=${date}&s=Soccer`);
    return (d.events || []).map(tsdMatch);
  });
}

/** Fetch past results for a league */
export async function getPastResults(leagueId: string): Promise<SportsMatch[]> {
  // If it's a football-data.org competition ID (numeric)
  if (FD_TOKEN && /^\d+$/.test(leagueId)) {
    try { return await cached(`fd:past:${leagueId}`, 300, () => fdPastResults(parseInt(leagueId, 10))); }
    catch (e) { console.warn('[FD] Past results failed, falling back:', e); }
  }
  if (API_SPORTS_KEY) {
    try {
      return await cached(`as:past:${leagueId}`, 300, async () => {
        const d = await asGet(`/fixtures?league=${leagueId}&last=15`);
        return (d.response || []).map((r: any) => asMatch(r.fixture || r, r.league || {}));
      });
    } catch (e) { console.warn('[AS] Past results failed, falling back:', e); }
  }
  return cached(`tsd:past:${leagueId}`, 300, async () => {
    const d = await tsdGet(`eventspastleague.php?id=${leagueId}`);
    return (d.events || []).map(tsdMatch);
  });
}

/** Fetch upcoming fixtures for a league */
export async function getUpcomingFixtures(leagueId: string): Promise<SportsMatch[]> {
  if (FD_TOKEN && /^\d+$/.test(leagueId)) {
    try { return await cached(`fd:upcoming:${leagueId}`, 300, () => fdUpcomingFixtures(parseInt(leagueId, 10))); }
    catch (e) { console.warn('[FD] Upcoming failed, falling back:', e); }
  }
  if (API_SPORTS_KEY) {
    try {
      return await cached(`as:upcoming:${leagueId}`, 300, async () => {
        const d = await asGet(`/fixtures?league=${leagueId}&next=15`);
        return (d.response || []).map((r: any) => asMatch(r.fixture || r, r.league || {}));
      });
    } catch (e) { console.warn('[AS] Upcoming failed, falling back:', e); }
  }
  return cached(`tsd:upcoming:${leagueId}`, 300, async () => {
    const d = await tsdGet(`eventsnextleague.php?id=${leagueId}`);
    return (d.events || []).map(tsdMatch);
  });
}

/** Fetch league standings */
/** Map football-data.org competition IDs → TheSportsDB league IDs */
const FD_TO_TSD_LEAGUE: Record<string, string> = {
  '2021': '4328', // Premier League
  '2014': '4335', // La Liga
  '2002': '4331', // Bundesliga
  '2019': '4332', // Serie A
  '2015': '4334', // Ligue 1
  '2001': '4480', // Champions League
  '2003': '4481', // Europa League (note: also Eredivisie on FD — prefer name map)
  '2016': '4396', // Championship
  '2017': '4344', // Primeira Liga
  '2018': '4330', // Scottish Premiership
  '4347': '4346', // MLS (if passed as TSD-ish)
};

const TSD_LEAGUE_BY_NAME: Record<string, string> = {
  'English Premier League': '4328',
  'Premier League': '4328',
  'Spanish La Liga': '4335',
  'La Liga': '4335',
  'German Bundesliga': '4331',
  'Bundesliga': '4331',
  'Italian Serie A': '4332',
  'Serie A': '4332',
  'French Ligue 1': '4334',
  'Ligue 1': '4334',
  'UEFA Champions League': '4480',
  'UEFA Europa League': '4481',
  'English Championship': '4396',
  'Portuguese Primeira Liga': '4344',
  'Dutch Eredivisie': '4337',
  'Scottish Premiership': '4330',
  'Major League Soccer': '4346',
};

function currentSoccerSeason(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-12
  // European season starts ~Aug
  if (m >= 8) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

function resolveTsdLeagueId(leagueId: string, leagueName?: string): string {
  if (leagueName && TSD_LEAGUE_BY_NAME[leagueName]) return TSD_LEAGUE_BY_NAME[leagueName];
  if (FD_TO_TSD_LEAGUE[leagueId]) return FD_TO_TSD_LEAGUE[leagueId];
  // already a TSD id (4xxx)
  if (/^4\d{3}$/.test(leagueId)) return leagueId;
  return leagueId;
}

export async function getStandings(leagueId: string, leagueName?: string): Promise<StandingRow[]> {
  if (FD_TOKEN && /^\d+$/.test(leagueId) && leagueId.length <= 4 && !leagueId.startsWith('4')) {
    try {
      const rows = await cached(`fd:standings:${leagueId}`, 600, () => fdStandings(parseInt(leagueId, 10)));
      if (rows.length) return rows;
    } catch (e) { console.warn('[FD] Standings failed, falling back:', e); }
  }
  if (API_SPORTS_KEY) {
    try {
      const season = new Date().getFullYear();
      const rows = await cached(`as:standings:${leagueId}:${season}`, 600, async () => {
        const d = await asGet(`/standings?league=${leagueId}&season=${season}`);
        const league = d.response?.[0];
        const table = league?.league?.standings?.[0] || league?.standings?.[0] || league?.standings || [];
        const list = Array.isArray(table) ? table : [];
        return list.map((r: any) => asStanding(r.team || {}, r));
      });
      if (rows.length) return rows;
    } catch (e) { console.warn('[AS] Standings failed, falling back:', e); }
  }

  const tsdId = resolveTsdLeagueId(leagueId, leagueName);
  const season = currentSoccerSeason();
  return cached(`tsd:standings:${tsdId}:${season}:v2`, 300, async () => {
    const seasonsToTry: string[] = [season];
    const parts = season.split('-').map((x) => parseInt(x, 10));
    if (parts.length === 2 && !Number.isNaN(parts[0])) {
      seasonsToTry.push(`${parts[0] - 1}-${parts[1] - 1}`);
      seasonsToTry.push(`${parts[0] - 2}-${parts[1] - 2}`);
    }

    let best: any[] = [];
    for (const s of seasonsToTry) {
      const d = await tsdGet(`lookuptable.php?l=${tsdId}&s=${s}`);
      const table = d.table || [];
      if (!table.length) continue;
      const totalPlayed = table.reduce(
        (sum: number, r: any) => sum + (parseInt(r.intPlayed, 10) || 0),
        0
      );
      // Prefer a table that has actual match data
      if (totalPlayed > 0) return table.map(tsdStanding);
      if (!best.length) best = table;
    }
    if (!best.length) {
      const d = await tsdGet(`lookuptable.php?l=${tsdId}`);
      best = d.table || [];
    }
    return best.map(tsdStanding);
  });
}

/** Fetch all available leagues */
export async function getLeagues(): Promise<LeagueInfo[]> {
  if (FD_TOKEN) {
    try { return await cached('fd:leagues', 3600, fdLeagues); }
    catch (e) { console.warn('[FD] Leagues failed, falling back:', e); }
  }
  if (API_SPORTS_KEY) {
    try {
      return await cached('as:leagues', 3600, async () => {
        const d = await asGet('/leagues');
        return (d.response || []).map((l: any) => ({
          id: String(l.league.id), name: l.league.name,
          country: l.country?.name || l.country || '',
          badge: l.league.logo || undefined, sport: 'Soccer',
        }));
      });
    } catch (e) { console.warn('[AS] Leagues failed, falling back:', e); }
  }
  return cached('tsd:leagues', 3600, async () => {
    const d = await tsdGet('all_leagues.php?s=Soccer');
    return (d.leagues || []).map((l: any) => ({
      id: l.idLeague || '', name: l.strLeague || '',
      country: l.strCountry || '', badge: l.strBadge || undefined,
      sport: l.strSport || 'Soccer',
    }));
  });
}

/** Default popular league IDs — Tanzania leagues from local DB */
export const POPULAR_LEAGUE_IDS: Record<string, string> = {
  // Tanzania — Football
  'Vodacom Premier League': 'comp-vpl',
  'NBC Premier League': 'comp-nbc-premier',
  'Azam Sports Federation Cup': 'comp-federation-cup',
  'Community Shield': 'comp-community-shield',
  'Mapinduzi Cup': 'comp-mapinduzi-cup',
  'Union Cup': 'comp-union-cup',
  'Zanzibar Premier League': 'comp-zanzibar-premier',
  'Kagame Interclub Cup': 'comp-kagame-interclub',
  'Seria A Women\'s League': 'comp-womens-league',
  'Taifa Stars': 'comp-taifa-stars',
  // Tanzania — Basketball
  'National Basketball League': 'comp-nbl',
  // Tanzania — Rugby
  'National Rugby League': 'comp-rugby-league',
  'National Rugby Sevens Series': 'comp-rugby-sevens-series',
  // Tanzania — Volleyball
  'National Volleyball League': 'comp-volleyball-league',
  'Women\'s Volleyball League': 'comp-womens-volleyball-league',
  // Tanzania — Netball
  'National Netball League': 'comp-netball-league',
  // Tanzania — Athletics
  'Kilimanjaro Marathon': 'comp-kilimanjaro-marathon',
  'Dar es Salaam Marathon': 'comp-dsm-marathon',
  // Tanzania — Boxing
  'Tanzania National Boxing Championships': 'comp-national-boxing-champs',
};
