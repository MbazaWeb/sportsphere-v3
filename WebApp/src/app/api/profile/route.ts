import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

function mapUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    handle: row.handle,
    role: row.role || 'fan',
    avatarUrl: row.avatar_url || null,
    avatarInitials: row.avatar_initials || (row.name || 'U').slice(0, 2).toUpperCase(),
    coverUrl: row.cover_url || null,
    bio: row.bio || null,
    location: row.location || null,
    website: row.website || null,
    phone: row.phone || null,
    isVerified: !!row.is_verified,
    emailVerified: !!row.email_verified,
    roleName: row.role || 'Fan',
    roleSlug: String(row.role || 'fan').toLowerCase(),
    sports: [],
    sportsFollowing: [],
    roleProfile: {},
    typedProfile: {},
  };
}

export async function GET(request: NextRequest) {
  try {
    const handle = request.nextUrl.searchParams.get('handle');
    const currentUserId = await getUserIdFromRequest(request);

    let q = supabaseAdmin
      .from('ss_user')
      .select('id,name,email,handle,role,avatar_url,avatar_initials,cover_url,bio,location,website,phone,is_verified,email_verified')
      .limit(1);

    if (handle) {
      const h = handle.startsWith('@') ? handle : `@${handle}`;
      q = q.or(`handle.eq."${h}",handle.ilike."${h}"`);
    } else if (currentUserId) {
      q = q.eq('id', currentUserId);
    } else {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { data, error } = await q;
    if (error && !isMissingTable(error)) throw new Error(error.message);
    const user = mapUser(data?.[0]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error('profile GET', error);
    return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.handle !== undefined) {
      const h = String(body.handle).trim();
      update.handle = h.startsWith('@') ? h : `@${h}`;
    }
    if (body.bio !== undefined) update.bio = String(body.bio).trim() || null;
    if (body.location !== undefined) update.location = String(body.location).trim() || null;
    if (body.website !== undefined) update.website = String(body.website).trim() || null;
    if (body.phone !== undefined) update.phone = String(body.phone).trim() || null;
    if (body.avatarUrl !== undefined) update.avatar_url = body.avatarUrl;
    if (body.coverUrl !== undefined) update.cover_url = body.coverUrl;
    if (body.coverGradient !== undefined) update.cover_gradient = body.coverGradient;

    if (update.handle) {
      const { data: taken } = await supabaseAdmin
        .from('ss_user')
        .select('id')
        .eq('handle', update.handle as string)
        .neq('id', userId)
        .limit(1);
      if (taken?.length) {
        return NextResponse.json({ error: 'This handle is already taken.' }, { status: 409 });
      }
    }

    if (Object.keys(update).length === 0) {
      const { data } = await supabaseAdmin.from('ss_user').select('*').eq('id', userId).limit(1);
      return NextResponse.json(mapUser(data?.[0]));
    }

    const { data, error } = await supabaseAdmin
      .from('ss_user')
      .update(update)
      .eq('id', userId)
      .select('id,name,email,handle,role,avatar_url,avatar_initials,cover_url,bio,location,website,phone,is_verified,email_verified')
      .maybeSingle();

    if (error) {
      console.error('profile PATCH', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(mapUser(data));
  } catch (error) {
    console.error('profile PATCH', error);
    return NextResponse.json({ error: 'Failed to save profile.' }, { status: 500 });
  }
}

export const PUT = PATCH;
