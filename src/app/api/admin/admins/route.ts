import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";
import { hashPassword } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export const ADMIN_PERMISSIONS = [
  'users',
  'posts',
  'sports',
  'roles',
  'verification',
  'performance',
  'admins',
  'settings',
] as const;

// GET /api/admin/admins — List all admin users with permissions
export async function GET(request: NextRequest) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const admins = await db.user.findMany({
      where: {
        OR: [
          { role: 'administrator' },
          { role: 'admin' },
          { role: 'moderator' },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        handle: true,
        role: true,
        avatarUrl: true,
        isBanned: true,
        preferences: true,
        registeredAt: true,
        lastSeenAt: true,
      },
      orderBy: { registeredAt: 'asc' },
    });

    const enriched = admins.map(a => {
      const prefs = (a.preferences as Record<string, unknown>) || {};
      const adminPerms = (prefs.adminPermissions as string[]) || [];
      const isSuperAdmin = a.role === 'administrator' && (
        adminPerms.includes('admins') || admins.length <= 1 || adminPerms.length === 0
      );
      return {
        ...a,
        adminPermissions: isSuperAdmin ? [...ADMIN_PERMISSIONS] : adminPerms,
        isSuperAdmin,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Failed to fetch admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

// POST /api/admin/admins — Create a new admin or update permissions
export async function POST(request: NextRequest) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { userId, email, name, password, permissions, makeAdmin } = body as {
      userId?: string;
      email?: string;
      name?: string;
      password?: string;
      permissions?: string[];
      makeAdmin?: boolean;
    };

    if (userId) {
      const existing = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, preferences: true } });
      if (!existing) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const prefs = (existing.preferences as Record<string, unknown>) || {};
      if (permissions) {
        prefs.adminPermissions = permissions;
      }

      const updateData: Record<string, unknown> = { preferences: prefs };

      if (makeAdmin) {
        updateData.role = 'administrator';
        updateData.isVerified = true;
        updateData.verificationStatus = 'verified';
      } else if (makeAdmin === false) {
        updateData.role = 'fan';
        updateData.isVerified = false;
        updateData.verificationStatus = 'none';
        prefs.adminPermissions = [];
        updateData.preferences = prefs;
      }

      await db.user.update({ where: { id: userId }, data: updateData });
      return NextResponse.json({ success: true, message: 'Admin updated successfully' });
    }

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required to create a new admin.' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    const baseHandle = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    let handle = baseHandle;
    let suffix = 1;
    while (await db.user.findUnique({ where: { handle } })) {
      handle = `${baseHandle}${suffix++}`;
    }

    const passwordHash = await hashPassword(password);
    const validPerms = (permissions || []).filter((p: string) => (ADMIN_PERMISSIONS as readonly string[]).includes(p));

    const newAdmin = await db.user.create({
      data: {
        name,
        email,
        handle,
        passwordHash,
        role: 'administrator',
        isVerified: true,
        verificationStatus: 'verified',
        isPro: false,
        preferences: { adminPermissions: validPerms },
        avatarInitials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email },
    }, { status: 201 });
  } catch (error) {
    console.error('Admin create/update error:', error);
    return NextResponse.json({ error: 'Failed to create/update admin' }, { status: 500 });
  }
}
