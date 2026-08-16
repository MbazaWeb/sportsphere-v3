import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { runAIJob } from '@/lib/ai-agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/ai/generate
 *   Body: { type: 'generate_news' | 'generate_rumors' | 'tag_images' | 'verify_profiles' }
 *   Calls runAIJob(type) from @/lib/ai-agent. Returns the AIJobResult.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      type?: 'generate_news' | 'generate_rumors' | 'tag_images' | 'verify_profiles';
    };

    const type = body.type;
    if (!type || !['generate_news', 'generate_rumors', 'tag_images', 'verify_profiles'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'generate_news', 'generate_rumors', 'tag_images', or 'verify_profiles'." },
        { status: 400 }
      );
    }

    const result = await runAIJob(type, { triggeredBy: 'manual' });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: `ai.${type}`,
        module: 'ai',
        targetId: result.jobId,
        targetType: 'AIJobLog',
        newValue: {
          itemsCreated: result.itemsCreated,
          itemsUpdated: result.itemsUpdated,
          errors: result.errors.length,
        } as any,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI generate failed:', error);
    return NextResponse.json(
      { error: 'AI generate failed', detail: String(error) },
      { status: 500 }
    );
  }
}
