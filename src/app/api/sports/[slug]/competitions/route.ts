// GET /api/sports/[slug]/competitions — Get competitions for a sport
import { NextRequest, NextResponse } from 'next/server';
import { initializeProviders, providerRegistry } from '@/lib/sports-providers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    initializeProviders();
    const provider = providerRegistry.getForSport(slug);

    if (!provider) {
      return NextResponse.json({
        competitions: [],
        provider: null,
        message: 'No data provider available for this sport.',
      });
    }

    const competitions = await provider.getCompetitions(slug);

    return NextResponse.json({
      competitions,
      provider: { id: provider.config.id, name: provider.config.name },
    });
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
  }
}
