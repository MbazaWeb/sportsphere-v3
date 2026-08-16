import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/providers
 * List all AI providers with model counts.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const providers = await db.aIProvider.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { models: true, usage: true } },
      },
    });

    // Mask API keys for response
    const masked = providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? `${p.apiKey.slice(0, 8)}...${p.apiKey.slice(-4)}` : '',
    }));

    return NextResponse.json({ data: masked });
  } catch (error) {
    console.error('Failed to fetch providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-workforce/providers
 * Create a new AI provider.
 * Body: { name, displayName, apiKey, baseUrl? }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const displayName = String(body.displayName || '').trim();
    const apiKey = String(body.apiKey || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!displayName) {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });
    }

    const provider = await db.aIProvider.create({
      data: {
        name,
        displayName,
        apiKey,
        baseUrl: body.baseUrl ? String(body.baseUrl).trim() : null,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ data: provider }, { status: 201 });
  } catch (error) {
    console.error('Failed to create provider:', error);
    return NextResponse.json(
      { error: 'Failed to create provider', detail: String(error) },
      { status: 500 }
    );
  }
}
