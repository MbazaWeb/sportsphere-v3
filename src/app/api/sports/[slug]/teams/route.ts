// GET /api/sports/[slug]/teams — Get teams for a sport
// Query params: ?league=39&search=Arsenal
import { NextRequest, NextResponse } from 'next/server';
import { initializeProviders, providerRegistry } from '@/lib/sports-providers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;
    const league = searchParams.get('league');
    const search = searchParams.get('search');

    initializeProviders();
    const provider = providerRegistry.getForSport(slug);

    if (!provider) {
      return NextResponse.json({
        teams: [],
        provider: null,
        message: 'No data provider available for this sport.',
      });
    }

    const teams = await provider.getTeams(slug, {
      league: league || undefined,
      search: search || undefined,
    });

    return NextResponse.json({
      teams,
      provider: { id: provider.config.id, name: provider.config.name },
    });
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}
