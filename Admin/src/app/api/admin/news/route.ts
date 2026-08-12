import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/news — List news articles
export async function GET(request: NextRequest) {
  try {
    let articles: any[] = [];
    try {
      articles = await (db as any).newsArticle?.findMany({
        orderBy: { createdAt: 'desc' },
      }) || [];
    } catch {
      // Direct raw fallback query if table name matches 'NewsArticle' or 'Post'
      articles = await db.$queryRaw`
        SELECT id, title, category, status, source, "createdAt", "publishedAt"
        FROM "NewsArticle"
        ORDER BY "createdAt" DESC
      `.catch(() => []);
    }

    const formatted = (articles || []).map((a: any) => ({
      id: a.id,
      title: a.title || 'Untitled Article',
      category: a.category || 'general',
      status: (a.status || 'draft').toLowerCase(),
      source: (a.source || 'manual').toLowerCase(),
      createdAt: a.createdAt || new Date().toISOString(),
      publishedAt: a.publishedAt || null,
    }));

    return NextResponse.json({ ok: true, articles: formatted });
  } catch (error: any) {
    console.error('News GET error:', error);
    return NextResponse.json({ ok: true, articles: [] }); // Safe fallback to avoid UI break
  }
}

// POST /api/admin/news — Create new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, isAiGenerated, status } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and Content are required.' }, { status: 400 });
    }

    let created: any = null;
    try {
      created = await (db as any).newsArticle.create({
        data: {
          title,
          content,
          category: category || 'general',
          status: status || 'DRAFT',
          source: isAiGenerated ? 'AI-generated' : 'Manual',
        },
      });
    } catch {
      // Direct raw insertion fallback
      const id = crypto.randomUUID();
      await db.$executeRaw`
        INSERT INTO "NewsArticle" (id, title, content, category, status, source, "createdAt")
        VALUES (${id}, ${title}, ${content}, ${category || 'general'}, ${status || 'DRAFT'}, ${isAiGenerated ? 'AI-generated' : 'Manual'}, NOW())
      `;
      created = { id, title, category, status, source: isAiGenerated ? 'AI-generated' : 'Manual' };
    }

    return NextResponse.json({ ok: true, article: created });
  } catch (error: any) {
    console.error('News POST error:', error);
    return NextResponse.json({ error: 'Failed to create article.' }, { status: 500 });
  }
}
