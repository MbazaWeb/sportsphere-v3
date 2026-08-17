import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/workflows
 * List workflows.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const workflows = await db.aIAgentWorkflow.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: workflows });
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows', detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-workforce/workflows
 * Create a workflow.
 * Body: { name, description, steps?, status?, triggerType?, triggerConfig? }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const allowedStatuses = new Set(['DRAFT', 'ACTIVE', 'PAUSED']);
    const status = allowedStatuses.has(body.status) ? body.status : 'DRAFT';

    const allowedTriggers = new Set(['MANUAL', 'SCHEDULED', 'EVENT']);
    const triggerType = allowedTriggers.has(body.triggerType) ? body.triggerType : 'MANUAL';

    const workflow = await db.aIAgentWorkflow.create({
      data: {
        name,
        description,
        steps: body.steps || [],
        status,
        triggerType,
        triggerConfig: body.triggerConfig || {},
        createdById: auth.user.sub,
      },
    });

    return NextResponse.json({ data: workflow }, { status: 201 });
  } catch (error) {
    console.error('Failed to create workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', detail: String(error) },
      { status: 500 }
    );
  }
}
