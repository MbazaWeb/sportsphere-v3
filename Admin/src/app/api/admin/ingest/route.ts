import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { slugify } from '@/lib/sports-sync';

export const dynamic = 'force-dynamic';

// ─── POST /api/admin/ingest ─────────────────────────────────
// Accepts a JSON URL, fetches it, detects format, extracts
// sports data, and upserts into the database.
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { url, format } = body as { url?: string; format?: 'auto' | 'json' | 'csv' | 'xml' | 'rss' };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP/HTTPS URLs are allowed.');
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format. Use http:// or https://.' }, { status: 400 });
    }

    const startTime = Date.now();
    const ingestionId = `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Log ingestion start
    await db.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'ingest.start',
        module: 'ingestion',
        targetType: 'Ingestion',
        targetId: ingestionId,
        newValue: { url, format: format || 'auto' },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // Fetch the URL
    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'SportSphere-Admin/1.0',
          'Accept': 'application/json, text/csv, application/xml, application/rss+xml, text/plain, */*',
        },
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
    } catch (err) {
      const msg = `Failed to fetch URL: ${err}`;
      await logIngestionError(admin.id, ingestionId, url, msg, request);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (!response.ok) {
      const msg = `URL returned HTTP ${response.status} ${response.statusText}`;
      await logIngestionError(admin.id, ingestionId, url, msg, request);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    const elapsed = Date.now() - startTime;

    // Detect format
    const detectedFormat = format !== 'auto' ? format : detectFormat(rawText, contentType, url);

    // Parse based on format
    let result: IngestionResult;
    try {
      switch (detectedFormat) {
        case 'json':
          result = await ingestJSON(rawText, url, admin.id, ingestionId, request);
          break;
        case 'csv':
          result = await ingestCSV(rawText, url, admin.id, ingestionId, request);
          break;
        default:
          // Try JSON as fallback
          try {
            result = await ingestJSON(rawText, url, admin.id, ingestionId, request);
          } catch {
            result = {
              format: detectedFormat,
              url,
              recordsParsed: 0,
              recordsIngested: 0,
              matchesCreated: 0,
              teamsCreated: 0,
              playersCreated: 0,
              errors: [`Unsupported format: ${detectedFormat}. Supported: JSON, CSV. Raw response: ${rawText.slice(0, 200)}...`],
              elapsedMs: elapsed,
              ingestionId,
            };
          }
      }
    } catch (err) {
      const msg = `Parse error: ${err}`;
      await logIngestionError(admin.id, ingestionId, url, msg, request);
      result = {
        format: detectedFormat,
        url,
        recordsParsed: 0,
        recordsIngested: 0,
        matchesCreated: 0,
        teamsCreated: 0,
        playersCreated: 0,
        errors: [msg],
        elapsedMs: Date.now() - startTime,
        ingestionId,
      };
    }

    // Log successful ingestion
    await db.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'ingest.complete',
        module: 'ingestion',
        targetType: 'Ingestion',
        targetId: ingestionId,
        newValue: {
          url,
          format: result.format,
          recordsParsed: result.recordsParsed,
          recordsIngested: result.recordsIngested,
          matchesCreated: result.matchesCreated,
          teamsCreated: result.teamsCreated,
          playersCreated: result.playersCreated,
          elapsedMs: result.elapsedMs,
          errors: result.errors,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[ingest] Unexpected error:', err);
    return NextResponse.json({ error: 'Ingestion failed unexpectedly.' }, { status: 500 });
  }
}

// ─── GET /api/admin/ingest?limit=&offset= ─────────────────────
// Returns ingestion history from audit logs.
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 50));
  const offset = Math.max(0, Number(request.nextUrl.searchParams.get('offset')) || 0);

  const where = {
    module: 'ingestion',
    action: { in: ['ingest.complete', 'ingest.start', 'ingest.error'] },
  };

  const [entries, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({ entries, total, limit, offset });
}

// ─── Helpers ──────────────────────────────────────────────────

interface IngestionResult {
  format: string;
  url: string;
  recordsParsed: number;
  recordsIngested: number;
  matchesCreated: number;
  teamsCreated: number;
  playersCreated: number;
  errors: string[];
  elapsedMs: number;
  ingestionId: string;
}

function detectFormat(raw: string, contentType: string, url: string): string {
  if (contentType.includes('json') || raw.trim().startsWith('{') || raw.trim().startsWith('[')) return 'json';
  if (contentType.includes('csv') || (raw.includes(',') && raw.includes('\n') && !raw.trim().startsWith('<'))) return 'csv';
  if (contentType.includes('xml') || contentType.includes('rss') || raw.trim().startsWith('<')) return 'xml';
  // Guess from URL
  if (url.endsWith('.json')) return 'json';
  if (url.endsWith('.csv')) return 'csv';
  return 'json'; // default attempt
}

async function logIngestionError(
  actorId: string, ingestionId: string, url: string, error: string, request: NextRequest
) {
  await db.auditLog.create({
    data: {
      actorId,
      action: 'ingest.error',
      module: 'ingestion',
      targetType: 'Ingestion',
      targetId: ingestionId,
      newValue: { url, error },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent') || null,
    },
  }).catch(() => {});
}

async function ingestJSON(
  raw: string, url: string, adminId: string, ingestionId: string, request: NextRequest
): Promise<IngestionResult> {
  const data = JSON.parse(raw);
  const result: IngestionResult = {
    format: 'json', url,
    recordsParsed: 0, recordsIngested: 0,
    matchesCreated: 0, teamsCreated: 0, playersCreated: 0,
    errors: [], elapsedMs: 0, ingestionId,
  };

  const startTime = Date.now();
  const items = Array.isArray(data) ? data : (data.data || data.results || data.matches || data.teams || data.players || [data]);
  result.recordsParsed = items.length;

  for (const item of items) {
    try {
      // ── Detect item type and route to correct handler ──
      if (isMatchLike(item)) {
        const created = await upsertMatchFromJSON(item);
        if (created) result.matchesCreated++;
        result.recordsIngested++;
      } else if (isTeamLike(item)) {
        const created = await upsertTeamFromJSON(item);
        if (created) result.teamsCreated++;
        result.recordsIngested++;
      } else if (isPlayerLike(item)) {
        const created = await upsertPlayerFromJSON(item);
        if (created) result.playersCreated++;
        result.recordsIngested++;
      } else {
        // Try as generic match
        const created = await upsertMatchFromJSON(item);
        if (created) result.matchesCreated++;
        result.recordsIngested++;
      }
    } catch (err) {
      result.errors.push(`Record error: ${err}`);
    }
  }

  result.elapsedMs = Date.now() - startTime;
  return result;
}

async function ingestCSV(
  raw: string, url: string, adminId: string, ingestionId: string, request: NextRequest
): Promise<IngestionResult> {
  const result: IngestionResult = {
    format: 'csv', url,
    recordsParsed: 0, recordsIngested: 0,
    matchesCreated: 0, teamsCreated: 0, playersCreated: 0,
    errors: [], elapsedMs: 0, ingestionId,
  };

  const startTime = Date.now();
  const lines = raw.trim().split('\n');
  if (lines.length < 2) {
    result.errors.push('CSV has no data rows (need header + at least 1 row).');
    result.elapsedMs = Date.now() - startTime;
    return result;
  }

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
  result.recordsParsed = lines.length - 1;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0].trim() === '')) continue;

    const item: Record<string, string> = {};
    headers.forEach((h, idx) => {
      item[h] = (values[idx] || '').trim();
    });

    try {
      // Detect type from headers
      const hasHomeAway = item.home_team || item.hometeam || item.home || item.home_team_name;
      const hasPlayerName = item.player_name || item.player || item.name;
      const hasTeamName = item.team_name || item.team || item.club;

      if (hasHomeAway) {
        const created = await upsertMatchFromJSON({
          homeTeam: item.home_team || item.hometeam || item.home || item.home_team_name,
          awayTeam: item.away_team || item.awayteam || item.away || item.away_team_name,
          homeScore: item.home_score || item.homescore || null,
          awayScore: item.away_score || item.awayscore || null,
          status: item.status || 'upcoming',
          league: item.league || item.competition || '',
          kickoffAt: item.date || item.kickoff || item.kickoff_at || item.datetime || '',
          venue: item.venue || item.stadium || '',
        });
        if (created) result.matchesCreated++;
      } else if (hasPlayerName && !hasTeamName) {
        const created = await upsertPlayerFromJSON({
          name: item.player_name || item.player || item.name,
          team: item.team || item.club || '',
          position: item.position || '',
          nationality: item.nationality || item.country || '',
        });
        if (created) result.playersCreated++;
      } else {
        const created = await upsertTeamFromJSON({
          name: item.team_name || item.team || item.club || item.name || '',
          country: item.country || '',
          venue: item.venue || item.stadium || '',
        });
        if (created) result.teamsCreated++;
      }
      result.recordsIngested++;
    } catch (err) {
      result.errors.push(`Row ${i + 1}: ${err}`);
    }
  }

  result.elapsedMs = Date.now() - startTime;
  return result;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { result.push(current); current = ''; continue; }
    current += char;
  }
  result.push(current);
  return result;
}

// ─── Type Detection ──────────────────────────────────────────
function isMatchLike(item: any): boolean {
  const keys = Object.keys(item).map(k => k.toLowerCase());
  return keys.some(k => k.includes('hometeam') || k.includes('home_team') || k === 'home')
    || keys.some(k => k.includes('awayteam') || k.includes('away_team') || k === 'away');
}

function isTeamLike(item: any): boolean {
  const keys = Object.keys(item).map(k => k.toLowerCase());
  return keys.some(k => k.includes('team') && !isMatchLike(item))
    || keys.some(k => k.includes('club'));
}

function isPlayerLike(item: any): boolean {
  const keys = Object.keys(item).map(k => k.toLowerCase());
  return keys.some(k => k.includes('player'))
    || (keys.includes('position') && keys.includes('name'));
}

// ─── Database Upsert Functions ───────────────────────────────
async function upsertMatchFromJSON(item: any): Promise<boolean> {
  const homeTeam = item.homeTeam || item.home_team || item.homeTeamName || item.home_team_name || item.home || '';
  const awayTeam = item.awayTeam || item.away_team || item.awayTeamName || item.away_team_name || item.away || '';

  if (!homeTeam || !awayTeam) return false;

  const kickoffStr = item.kickoffAt || item.kickoff_at || item.date || item.datetime || item.match_date || '';
  const kickoffDate = kickoffStr ? new Date(kickoffStr) : new Date();
  if (isNaN(kickoffDate.getTime())) return false;

  const existing = await db.match.findFirst({
    where: {
      homeTeam,
      awayTeam,
      kickoffAt: {
        gte: new Date(kickoffDate.getTime() - 12 * 3600 * 1000),
        lte: new Date(kickoffDate.getTime() + 12 * 3600 * 1000),
      },
    },
  });

  if (existing) {
    await db.match.update({
      where: { id: existing.id },
      data: {
        homeScore: item.homeScore ?? item.home_score ?? existing.homeScore,
        awayScore: item.awayScore ?? item.away_score ?? existing.awayScore,
        status: item.status || existing.status,
        minute: item.minute ?? existing.minute,
        venue: item.venue || item.stadium || existing.venue,
        league: item.league || item.competition || existing.league,
      },
    });
    return false; // updated, not created
  }

  await db.match.create({
    data: {
      league: item.league || item.competition || 'External Feed',
      homeTeam,
      awayTeam,
      homeScore: item.homeScore ?? item.home_score ?? null,
      awayScore: item.awayScore ?? item.away_score ?? null,
      status: item.status || 'upcoming',
      minute: item.minute ?? null,
      venue: item.venue || item.stadium || null,
      kickoffAt: kickoffDate,
      continent: item.continent || 'Unknown',
      country: item.country || 'Unknown',
      events: JSON.stringify(item.events || []),
    },
  });
  return true;
}

async function upsertTeamFromJSON(item: any): Promise<boolean> {
  const name = item.name || item.team || item.teamName || item.team_name || '';
  if (!name) return false;

  // Check if a Match already references this team
  const existingMatch = await db.match.findFirst({
    where: { OR: [{ homeTeam: name }, { awayTeam: name }] },
  });
  if (existingMatch) return false; // already tracked via matches

  // We don't have a standalone Team table in this schema,
  // but we do have Sport and Match. Log it.
  console.log(`[ingest] Team found: ${name} (country: ${item.country || 'N/A'})`);
  return false;
}

async function upsertPlayerFromJSON(item: any): Promise<boolean> {
  const name = item.name || item.player || item.playerName || item.player_name || '';
  if (!name) return false;
  console.log(`[ingest] Player found: ${name} (team: ${item.team || 'N/A'}, pos: ${item.position || 'N/A'})`);
  return false;
}
