// GET /api/sports/[slug]/top-scorers — Get top scorers for a sport/league
// Query params: ?league=39&season=2024
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
    const season = searchParams.get('season');

    if (!league) {
      return NextResponse.json({ error: 'league parameter is required.' }, { status: 400 });
    }

    initializeProviders();
    const provider = providerRegistry.getForSport(slug);

    if (!provider) {
      return NextResponse.json({
        topScorers: [],
        provider: null,
        message: 'No data provider available for this sport.',
      });
    }

    const topScorers = await provider.getTopScorers(slug, league, season || undefined);

    return NextResponse.json({
      topScorers,
      provider: { id: provider.config.id, name: provider.config.name },
    });
  } catch (error) {
    console.error('Failed to fetch top scorers:', error);
    return NextResponse.json({ error: 'Failed to fetch top scorers' }, { status: 500 });
  }
}
