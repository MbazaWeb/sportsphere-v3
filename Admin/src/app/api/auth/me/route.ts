import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { data: admin, error } = await supabaseAdmin
      .from('ss_user')
      .select('id,name,email,handle,role,role_id,role_type_id,avatar_url,avatar_initials,is_verified,email_verified,verification_status,last_seen_at')
      .eq('id', auth.user.sub)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 });
    }

    const lastSeen = admin.last_seen_at
      ? new Date(admin.last_seen_at).toISOString()
      : null;

    return NextResponse.json({
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        handle: admin.handle,
        role: admin.role,
        roleId: admin.role_id,
        roleTypeId: admin.role_type_id,
        avatarUrl: admin.avatar_url,
        avatarInitials: admin.avatar_initials,
        isVerified: admin.is_verified,
        emailVerified: admin.email_verified,
        verificationStatus: admin.verification_status,
        lastSeenAt: lastSeen,
      },
    });
  } catch (error) {
    console.error('Admin /me error:', error);
    return NextResponse.json(
      { error: 'Failed to load admin profile.' },
      { status: 500 }
    );
  }
}
