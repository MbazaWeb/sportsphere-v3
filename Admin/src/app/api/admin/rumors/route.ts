import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/rumors — Fetch all rumors
export async function GET() {
  try {
    let rumors: any[] = [];
    try {
      rumors = await (db as any).rumor?.findMany({
        orderBy: { createdAt: 'desc' },
      }) || [];
    } catch {
      // Direct raw PostgreSQL fallback query
      rumors = await db.$queryRaw`
        SELECT id, player, "fromClub", "toClub", credibility, status, source, "createdAt"
        FROM "Rumor"
        ORDER BY "createdAt" DESC
      `.catch(() => []);
    }

    const formatted = (rumors || []).map((r: any) => ({
      id: r.id,
      player: r.player || 'Unknown Player',
      fromClub: r.fromClub || 'Current Club',
      toClub: r.toClub || 'Target Club',
      credibility: r.credibility ?? (r.source === 'AI-generated' ? 35 : 75),
      status: (r.status || 'draft').toLowerCase(),
      source: (r.source || 'manual').toLowerCase(),
      createdAt: r.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ ok: true, rumors: formatted });
  } catch (error: any) {
    console.error('Rumors GET error:', error);
    return NextResponse.json({ ok: true, rumors: [] });
  }
}

// POST /api/admin/rumors — Create a new rumor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { player, fromClub, toClub, credibility, status, isAiGenerated } = body;

    if (!player || !toClub) {
      return NextResponse.json({ error: 'Player name and Destination Club are required.' }, { status: 400 });
    }

    const source = isAiGenerated ? 'AI-generated' : 'Manual';
    const initialCredibility = credibility ?? (isAiGenerated ? 35 : 75);

    let created: any = null;
    try {
      created = await (db as any).rumor.create({
        data: {
          player,
          fromClub: fromClub || 'Free Agent',
          toClub,
          credibility: Number(initialCredibility),
          status: status || 'DRAFT',
          source,
        },
      });
    } catch {
      const id = crypto.randomUUID();
      await db.$executeRaw`
        INSERT INTO "Rumor" (id, player, "fromClub", "toClub", credibility, status, source, "createdAt")
        VALUES (${id}, ${player}, ${fromClub || 'Free Agent'}, ${toClub}, ${Number(initialCredibility)}, ${status || 'DRAFT'}, ${source}, NOW())
      `;
      created = { id, player, fromClub, toClub, credibility: initialCredibility, status, source };
    }

    return NextResponse.json({ ok: true, rumor: created });
  } catch (error: any) {
    console.error('Rumors POST error:', error);
    return NextResponse.json({ error: 'Failed to create rumor.' }, { status: 500 });
  }
}
