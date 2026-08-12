import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let claims: any[] = [];
    try {
      claims = await (db as any).profileClaim?.findMany({
        orderBy: { createdAt: 'desc' },
      }) || [];
    } catch {
      claims = await db.$queryRaw`
        SELECT id, "profileType", "profileName", status, "submittedBy", "createdAt"
        FROM "ProfileClaim"
        ORDER BY "createdAt" DESC
      `.catch(() => []);
    }

    const formatted = (claims || []).map((c: any) => ({
      id: c.id,
      profileType: (c.profileType || 'player').toLowerCase(),
      profileName: c.profileName || 'Unnamed Entity',
      submittedBy: c.submittedBy || 'Anonymous',
      status: (c.status || 'pending').toLowerCase(),
      createdAt: c.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ ok: true, claims: formatted });
  } catch (error) {
    console.error('Claims GET error:', error);
    return NextResponse.json({ ok: true, claims: [] });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    try {
      await (db as any).profileClaim.update({
        where: { id },
        data: { status: status.toUpperCase() },
      });
    } catch {
      await db.$executeRaw`UPDATE "ProfileClaim" SET status = ${status.toUpperCase()} WHERE id = ${id}`;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update claim status' }, { status: 500 });
  }
}
