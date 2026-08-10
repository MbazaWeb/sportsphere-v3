/**
 * GET /api/locations/search?q=da&limit=10
 *
 * Location autocomplete API.
 * Searches by prefix on name (case-insensitive) across countries, regions, and cities.
 * Returns hierarchical display labels like "Dar es Salaam, Tanzania".
 *
 * Query params:
 *   q      — search query (min 1 char)
 *   limit  — max results (default 10, max 50)
 *   type   — filter by type: country | region | city (optional)
 *   country — filter by countryCode (e.g. "TZ") (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get('q')?.trim() ?? '';
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 10, 1), 50);
    const type = searchParams.get('type');
    const country = searchParams.get('country');

    if (!q) {
      // No query — return popular locations as suggestions
      const popular = await db.location.findMany({
        where: { isPopular: true, ...(country ? { countryCode: country } : {}) },
        select: { id: true, name: true, type: true, displayLabel: true, countryCode: true, latitude: true, longitude: true, population: true },
        orderBy: [{ population: 'desc' }],
        take: limit,
      });
      return NextResponse.json(popular);
    }

    const qLower = q.toLowerCase();

    // Build where clause
    const where: Record<string, unknown> = {
      nameLower: { startsWith: qLower },
      ...(type ? { type } : {}),
      ...(country ? { countryCode: country } : {}),
    };

    const locations = await db.location.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        displayLabel: true,
        countryCode: true,
        latitude: true,
        longitude: true,
        population: true,
      },
      orderBy: [
        { isPopular: 'desc' },
        { population: 'desc' },
      ],
      take: limit,
    });

    // If few results, also try contains search
    if (locations.length < 3) {
      const whereContains: Record<string, unknown> = {
        nameLower: { contains: qLower },
        ...(type ? { type } : {}),
        ...(country ? { countryCode: country } : {}),
      };
      const extra = await db.location.findMany({
        where: whereContains,
        select: {
          id: true, name: true, type: true, displayLabel: true, countryCode: true, latitude: true, longitude: true, population: true,
        },
        orderBy: [{ isPopular: 'desc' }, { population: 'desc' }],
        take: limit - locations.length,
      });
      // Deduplicate
      const existIds = new Set(locations.map(l => l.id));
      for (const e of extra) {
        if (!existIds.has(e.id)) {
          locations.push(e);
          existIds.add(e.id);
        }
      }
    }

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json({ error: 'Location search failed' }, { status: 500 });
  }
}
