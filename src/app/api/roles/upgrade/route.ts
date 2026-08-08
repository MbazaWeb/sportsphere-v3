// POST /api/roles/upgrade — Submit a role upgrade request (Pro Upgrade)
// Individual category roles (player, coach, scout, etc.) → auto-approved instantly
// All other categories (team_entity, organization, official, admin, etc.) → pending review
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';

// Roles that auto-approve instantly when a fan goes Pro
const AUTO_APPROVE_CATEGORIES = ['individual', 'support'];

export async function POST(request: NextRequest) {
  try {
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

    const user = await db.user.findUnique({
      where: { id: session.sub },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verified roles are locked
    if (user.verificationStatus === 'verified') {
      return NextResponse.json(
        { error: 'Verified roles are locked. Contact support to change.' },
        { status: 403 }
      );
    }

    // Determine if this role auto-approves
    const autoApprove = AUTO_APPROVE_CATEGORIES.includes(role.category);
    const newStatus = autoApprove ? 'verified' : 'pending';

    // Create verification request record
    const verificationRequest = await db.verificationRequest.create({
      data: {
        userId: user.id,
        role: role.slug,
        roleId: role.id,
        roleTypeId: roleType.id,
        roleData: roleData || {},
        status: newStatus,
      },
    });

    // Update user role and verification status.
    // "Pro" is the umbrella term for any non-fan verified role. A fan who
    // upgrades to Player / Team / Coach / Business / Sponsor / Competition /
    // League / etc. becomes Pro the moment the upgrade is approved.
    // For pending upgrades we still flip isPro=false (will be set true on
    // admin approval). For auto-approved individual/support roles, isPro
    // becomes true immediately.
    const becomesPro = autoApprove && role.slug !== 'fan';
    await db.user.update({
      where: { id: user.id },
      data: {
        roleId: role.id,
        roleTypeId: roleType.id,
        role: role.slug,
        verificationStatus: newStatus,
        isVerified: autoApprove,
        isPro: becomesPro,
        proSince: becomesPro ? new Date() : null,
        roleData: roleData || {},
      },
    });

    return NextResponse.json({
      ok: true,
      autoApproved: autoApprove,
      isPro: becomesPro,
      status: newStatus,
      verificationRequest,
      message: autoApprove
        ? (becomesPro ? 'Pro activated! Your verified role is live.' : 'Role activated!')
        : 'Role upgrade submitted for admin review. You will be Pro once approved.',
    });
  } catch (error) {
    console.error('Role upgrade failed:', error);
    return NextResponse.json({ error: 'Role upgrade failed' }, { status: 500 });
  }
}
