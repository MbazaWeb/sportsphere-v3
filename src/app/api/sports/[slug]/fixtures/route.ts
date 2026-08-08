// GET /api/sports/[slug]/fixtures — Get fixtures for a sport
// Query params: ?date=YYYY-MM-DD&league=39&live=true&season=2024
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
    const date = searchParams.get('date');
    const league = searchParams.get('league');
    const team = searchParams.get('team');
    const live = searchParams.get('live') === 'true';

    initializeProviders();
    const provider = providerRegistry.getForSport(slug);

    if (!provider) {
      return NextResponse.json({
        fixtures: [],
        provider: null,
        message: 'No data provider available for this sport.',
      });
    }

    const fixtures = await provider.getFixtures(slug, {
      date: date || undefined,
      league: league || undefined,
      team: team || undefined,
      live,
    });

    return NextResponse.json({
      fixtures,
      provider: { id: provider.config.id, name: provider.config.name },
    });
  } catch (error) {
    console.error('Failed to fetch fixtures:', error);
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
