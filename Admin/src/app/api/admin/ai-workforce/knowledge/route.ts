import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/knowledge
 * List knowledge sources.
 * Query params: ?type=&department=
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const department = searchParams.get('department') || undefined;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (department) where.department = department;

    const sources = await db.aIKnowledgeSource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: sources });
  } catch (error) {
    console.error('Failed to fetch knowledge sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge sources', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-workforce/knowledge
 * Create a knowledge source.
 * Body: { title, type, content, sourceUrl?, department?, isActive? }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const title = String(body.title || '').trim();
    const type = String(body.type || '').trim();
    const content = String(body.content || '').trim();

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const allowedTypes = new Set(['POLICY', 'SOP', 'MANUAL', 'CONTRACT', 'FAQ', 'STRATEGY']);
    if (!allowedTypes.has(type)) {
      return NextResponse.json({ error: `type must be one of: ${Array.from(allowedTypes).join(', ')}` }, { status: 400 });
    }

    const source = await db.aIKnowledgeSource.create({
      data: {
        title,
        type,
        content,
        sourceUrl: body.sourceUrl ? String(body.sourceUrl).trim() : null,
        department: body.department ? String(body.department).trim() : null,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ data: source }, { status: 201 });
  } catch (error) {
    console.error('Failed to create knowledge source:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge source', detail: String(error) },
      { status: 500 }
    );
  }
}
