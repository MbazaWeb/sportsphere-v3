import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// GET /api/admin/news — List news articles
export async function GET() {
  try {
    const articles = await db.newsItem.findMany({
      orderBy: { publishedAt: "desc" },
      take: 200,
    });

    const formatted = articles.map((a) => ({
      id: a.id,
      title: a.title || "Untitled Article",
      category: a.category || "general",
      status: (a.status || "draft").toLowerCase(),
      source: (a.source || "manual").toLowerCase(),
      createdAt: a.publishedAt?.toISOString() ?? new Date().toISOString(),
      publishedAt: a.publishedAt?.toISOString() ?? null,
      slug: a.slug,
      createdByAI: a.createdByAI,
    }));

    return NextResponse.json({ ok: true, articles: formatted });
  } catch (error: unknown) {
    console.error("News GET error:", error);
    return NextResponse.json({ ok: true, articles: [] });
  }
}

// POST /api/admin/news — Create new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, isAiGenerated, status } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and Content are required." },
        { status: 400 }
      );
    }

    const slugBase = String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const created = await db.newsItem.create({
      data: {
        id: randomUUID(),
        title,
        slug,
        body: content,
        summary: String(content).slice(0, 240),
        category: category || "general",
        status: (status || "draft").toLowerCase(),
        source: isAiGenerated ? "ai" : "manual",
        createdByAI: Boolean(isAiGenerated),
        publishedAt:
          String(status || "").toLowerCase() === "published"
            ? new Date()
            : null,
      },
    });

    return NextResponse.json({ ok: true, article: created });
  } catch (error: unknown) {
    console.error("News POST error:", error);
    return NextResponse.json(
      { error: "Failed to create article." },
      { status: 500 }
    );
  }
}
