import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminGuard';
import { seedTeam, seedPlayer, seedCoach, ingestCompetition } from '@/lib/data-ingest';
import { logDeletion } from '@/lib/backup-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/football-data/seed
 *   Body: { competitionCode: string } OR { teamData: {...}, competitionName: string }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const result = { teamsCreated: 0, teamsSkipped: 0, playersCreated: 0, playersSkipped: 0, coachesCreated: 0, coachesSkipped: 0, errors: [] as string[], logs: [] as string[] };

    if (body.teamData) {
      // Seed single team
      await seedTeam(body.teamData, result);
      if (body.playerData) await seedPlayer(body.playerData, result);
      if (body.coachData) await seedCoach(body.coachData, result);
    } else if (body.competitionCode) {
      // Full competition ingest
      Object.assign(result, await ingestCompetition(body.competitionCode));
    } else {
      return NextResponse.json({ error: 'Provide competitionCode or teamData' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
