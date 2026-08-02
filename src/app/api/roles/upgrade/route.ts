// POST /api/roles/upgrade — Submit a role upgrade request (Pro Upgrade)
// Only allowed when verificationStatus is none, pending, or rejected
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Get session from cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionCookie = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('ss_session='));
    const token = sessionCookie?.split('=')[1];
    const session = await verifySession(token);

    if (!session?.sub) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { roleId, roleTypeId, roleData } = body;

    if (!roleId || !roleTypeId) {
      return NextResponse.json(
        { error: 'roleId and roleTypeId are required' },
        { status: 400 }
      );
    }

    // Verify role and type exist and are active
    const role = await db.role.findUnique({
      where: { id: roleId, isActive: true },
    });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const roleType = await db.roleType.findUnique({
      where: { id: roleTypeId, isActive: true },
    });
    if (!roleType || roleType.roleId !== roleId) {
      return NextResponse.json(
        { error: 'Invalid role type for this role' },
        { status: 400 }
      );
    }

    // Check if user is allowed to upgrade
    const user = await db.user.findUnique({
      where: { id: session.sub },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verified roles are locked — cannot change
    if (user.verificationStatus === 'verified') {
      return NextResponse.json(
        { error: 'Verified roles are locked. Contact support to change.' },
        { status: 403 }
      );
    }

    // Create verification request
    const verificationRequest = await db.verificationRequest.create({
      data: {
        userId: user.id,
        role: role.slug,
        roleId: role.id,
        roleTypeId: roleType.id,
        roleData: roleData || {},
        status: 'pending',
      },
    });

    // Update user's role and verification status
    await db.user.update({
      where: { id: user.id },
      data: {
        roleId: role.id,
        roleTypeId: roleType.id,
        role: role.slug, // keep legacy slug in sync
        verificationStatus: 'pending',
        roleData: roleData || {},
      },
    });

    return NextResponse.json({
      ok: true,
      verificationRequest,
      message: 'Role upgrade submitted for verification',
    });
  } catch (error) {
    console.error('Role upgrade failed:', error);
    return NextResponse.json({ error: 'Role upgrade failed' }, { status: 500 });
  }
}
