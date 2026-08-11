// ─── SportSphere Admin — football-data.org Provider ──────────
// Free tier: 10 requests/minute. Uses X-Auth-Token header.

const BASE_URL = 'https://api.football-data.org/v4';
const TOKEN = process.env.FOOTBALL_DATA_ORG_TOKEN || '1f6cb32383874d8c84e3faa811f1b525';

interface Team {
  id: number; name: string; shortName?: string; tla?: string; crest?: string;
  address?: string; website?: string; founded?: number; clubColors?: string;
  venue?: string; seatCapacity?: number; runningCompetitions?: any[];
  coach?: any; squad?: any[]; lastUpdated?: string;
}

interface SquadPlayer {
  id: number; name: string; position: string; dateOfBirth: string;
  nationality: string; section: string; shirtNumber?: number;
  currentTeam?: any; marketValue?: number;
}

interface SquadCoach {
  id: number; name: string; firstName?: string; lastName?: string;
  dateOfBirth?: string; nationality?: string; contract?: {
    start?: string; until?: string;
  };
}

interface Competition {
  id: string; name: string; code?: string; emblem?: string;
  type?: string; numberOfAvailableSeasons?: number;
}

interface Match {
  id: number; utcDate: string; status: string; matchday?: number;
  stage?: string; group?: string; lastUpdated?: string;
  homeTeam: { id: number; shortName?: string; crest?: string; name: string; tla?: string };
  awayTeam: { id: number; shortName?: string; crest?: string; name: string; tla?: string };
  score: { winner?: string; duration?: string; fullTime: { home: number | null; away: number | null }; halfTime: { home: number | null; away: number | null } };
  competition: { id: number; name: string; code: string; emblem?: string };
}

export class FootballDataOrgProvider {
  private headers() {
    return { 'X-Auth-Token': TOKEN };
  }

  async request(path: string): Promise<any> {
    const res = await fetch(`${BASE_URL}${path}`, { headers: this.headers(), signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`football-data.org ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  async getCompetitions(_sport?: string, _opts?: any): Promise<Competition[]> {
    const data = await this.request('/competitions');
    return (data.competitions || []).map((c: any) => ({
      id: String(c.id), name: c.name, code: c.code,
      logo: c.emblem, type: c.type, country: c.area?.name,
    }));
  }

  async getTeams(_sport?: string, opts?: any): Promise<Team[]> {
    const league = opts?.league || 'PL';
    const data = await this.request(`/competitions/${league}/teams`);
    return (data.teams || []).map((t: any) => ({
      id: String(t.id), name: t.name, shortName: t.shortName || t.tla,
      logo: t.crest, country: t.address ? t.address.split('\n').pop()?.trim() : '',
      venue: t.venue, founded: t.founded,
    }));
  }

  async getSquad(teamId: string): Promise<{ players: SquadPlayer[]; coach: (SquadCoach & { photo?: string }) | null }> {
    const data = await this.request(`/teams/${teamId}`);
    const team = data as any;
    const coach = team.coach ? { ...team.coach, photo: null } : null;
    const players = (team.squad || []).filter((p: any) => p.position !== 'COACH').map((p: any) => ({
      id: String(p.id), name: p.name, position: p.position,
      nationality: p.nationality, dateOfBirth: p.dateOfBirth,
      photo: null,
    }));
    return { players, coach };
  }

  async getFixtures(_sport?: string, opts?: any): Promise<Match[]> {
    const league = opts?.league || 'PL';
    const data = await this.request(`/competitions/${league}/matches?status=SCHEDULED&limit=10`);
    return (data.matches || []).map((m: any) => ({
      id: String(m.id), league: m.competition?.name || '',
      homeTeam: m.homeTeam?.name || '', awayTeam: m.awayTeam?.name || '',
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
      status: m.status === 'SCHEDULED' ? 'upcoming' : m.status?.toLowerCase() || 'unknown',
      minute: null, venue: null,
      kickoffAt: m.utcDate,
      events: [],
    }));
  }
}
