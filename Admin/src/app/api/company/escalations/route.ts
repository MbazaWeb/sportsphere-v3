import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get('admin_session')?.value);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const escalations = await db.coEscalation.findMany({ include: { fromAgent: true }, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ escalations });
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get('admin_session')?.value);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { escalationId, decision, note } = await req.json();
  if (!escalationId || !decision) return NextResponse.json({ error: 'escalationId and decision required' }, { status: 400 });
  const updated = await db.coEscalation.update({ where: { escalationId }, data: { status: 'RESOLVED', davidDecision: decision, davidNote: note ?? null, resolvedAt: new Date() } });
  await db.auditLog.create({ data: { actorId: session.sub, action: 'ESCALATION_DECIDED', module: 'company_os', targetId: escalationId, targetType: 'CoEscalation', newValue: { decision, note } } });
  return NextResponse.json({ success: true, escalation: updated });
}
