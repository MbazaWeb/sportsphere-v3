import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: { playerProfile: true },
    });

    if (!user || !user.playerProfile) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const p = user.playerProfile;
    const player = {
      id: user.id,
      full_name: user.name || user.handle,
      photo_url: user.avatarUrl,
      position: p.position,
      current_team: p.currentClub,
      ppi_score: p.rating ?? 0,
      date_of_birth: p.dateOfBirth,
      nationality: p.nationality,
      height_cm: p.height,
      weight_kg: p.weight,
      jersey_number: p.jerseyNumber,
      dominant_side: p.preferredFoot,
      goals_points: p.goals ?? 0,
      assists: p.assists ?? 0,
      matches_played: p.appearances ?? 0,
      efficiency_rate: p.savePct ?? p.passAccuracy ?? 0,
      global_rank: p.ranking ? parseInt(p.ranking) || 0 : 0,
      category_rank: 0,
      percentile_tier: p.form || 'Unranked',
      biography: p.playingStyle,
      coach_name: null,
      achievements: p.strengths ?? [],
      skills: p.strengths ?? [],
    };

    return NextResponse.json({ player });
  } catch (error) {
    console.error('Player fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
