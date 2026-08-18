import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const SELECT = 'id,name,email,handle,role,avatar_url,avatar_initials,bio,location';

function mapUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    handle: row.handle,
    role: row.role || 'fan',
    avatarUrl: row.avatar_url || row.avatarUrl || null,
    avatarInitials: row.avatar_initials || (row.name || 'U').slice(0, 2).toUpperCase(),
    coverUrl: row.cover_url || row.coverUrl || null,
    bio: row.bio || null,
    location: row.location || null,
    website: row.website || null,
    phone: row.phone || null,
    followerCount: row.follower_count ?? 0,
    followingCount: row.following_count ?? 0,
    fanCount: row.fan_count ?? 0,
    isVerified: !!(row.is_verified ?? row.isVerified),
    emailVerified: !!(row.email_verified ?? row.emailVerified),
    roleName: row.role || 'Fan',
    roleSlug: String(row.role || 'fan').toLowerCase(),
    sports: [],
    sportsFollowing: [],
    roleProfile: {},
    typedProfile: {},
  };
}


async function loadFromCatalog(id?: string, handle?: string) {
  const slug = handle ? handle.replace(/^@/, '') : '';
  if (id || slug) {
    let tq = supabaseAdmin.from('ss_team').select('*').limit(1);
    if (id) tq = tq.eq('id', id);
    else tq = tq.or(`slug.eq.${slug},name.ilike.${slug}`);
    const { data: teams } = await tq;
    const team = teams?.[0];
    if (team) {
      return mapUser({
        id: team.id,
        name: team.name,
        handle: '@' + (team.slug || team.name || 'team').toString().toLowerCase().replace(/\s+/g, ''),
        role: 'team',
        avatar_url: team.logo_url,
        avatar_initials: String(team.name || 'T').slice(0, 2).toUpperCase(),
        is_verified: true,
        location: [team.city, team.country].filter(Boolean).join(', '),
        bio: team.name,
      });
    }
    let pq = supabaseAdmin.from('ss_player').select('*').limit(1);
    if (id) pq = pq.eq('id', id);
    else pq = pq.or(`slug.eq.${slug},name.ilike.${slug}`);
    const { data: players } = await pq;
    const player = players?.[0];
    if (player) {
      return mapUser({
        id: player.id,
        name: player.name,
        handle: '@' + (player.slug || player.name || 'player').toString().toLowerCase().replace(/\s+/g, ''),
        role: 'player',
        avatar_url: player.photo_url,
        avatar_initials: String(player.name || 'P').slice(0, 2).toUpperCase(),
        is_verified: true,
        location: player.country || '',
        bio: player.position || '',
      });
    }
  }
  return null;
}

async function loadUser(filter: { id?: string; handle?: string }) {
  let q = supabaseAdmin.from('ss_user').select('*').limit(1);
  if (filter.id) q = q.eq('id', filter.id);
  if (filter.handle) {
    const h = filter.handle.startsWith('@') ? filter.handle : `@${filter.handle}`;
    q = q.eq('handle', h);
  }
  const { data, error } = await q;
  if (error) {
    console.error('profile load', error);
    return { user: null, error };
  }
  return { user: mapUser(data?.[0]), error: null };
}

export async function GET(request: NextRequest) {
  try {
    const handle = request.nextUrl.searchParams.get('handle');
    const id = request.nextUrl.searchParams.get('id');
    const currentUserId = await getUserIdFromRequest(request);
    if (id) {
      const { user } = await loadUser({ id });
      if (user) return NextResponse.json(user);
      const catalog = await loadFromCatalog(id);
      if (catalog) return NextResponse.json(catalog);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (handle) {
      const { user } = await loadUser({ handle });
      if (user) return NextResponse.json(user);
      const catalog = await loadFromCatalog(undefined, handle);
      if (catalog) return NextResponse.json(catalog);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!currentUserId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const { user } = await loadUser({ id: currentUserId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error('profile GET', error);
    return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 });
  }
}

async function save(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Authentication required. Please log in again.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const candidates: Record<string, unknown> = {};
  if (body.name !== undefined) candidates.name = String(body.name).trim();
  if (body.handle !== undefined) {
    const h = String(body.handle).trim();
    candidates.handle = h.startsWith('@') ? h : `@${h}`;
  }
  if (body.bio !== undefined) candidates.bio = String(body.bio).trim() || null;
  if (body.location !== undefined) candidates.location = String(body.location).trim() || null;
  if (body.website !== undefined) candidates.website = String(body.website).trim() || null;
  if (body.phone !== undefined) candidates.phone = String(body.phone).trim() || null;
  if (body.avatarUrl) candidates.avatar_url = body.avatarUrl;
  if (body.coverUrl) candidates.cover_url = body.coverUrl;

  if (candidates.handle) {
    const { data: taken } = await supabaseAdmin
      .from('ss_user')
      .select('id')
      .eq('handle', candidates.handle as string)
      .neq('id', userId)
      .limit(1);
    if (taken?.length) {
      return NextResponse.json({ error: 'This handle is already taken.' }, { status: 409 });
    }
  }

  let payload = { ...candidates };
  let lastError: string | null = null;

  for (let i = 0; i < 8; i++) {
    if (Object.keys(payload).length === 0) break;
    const { data, error } = await supabaseAdmin
      .from('ss_user')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (!error) {
      return NextResponse.json(mapUser(data) || { ok: true, id: userId, ...candidates });
    }

    lastError = error.message;
    // Drop unknown column (PGRST204) and retry
    const m = error.message.match(/Could not find the '([^']+)' column/i)
      || error.message.match(/column "([^"]+)"/i);
    if (m && payload[m[1]] !== undefined) {
      delete payload[m[1]];
      continue;
    }
    console.error('profile save', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { user } = await loadUser({ id: userId });
  if (user) return NextResponse.json(user);
  return NextResponse.json({ error: lastError || 'Failed to save profile.' }, { status: 400 });
}

export const PUT = save;
export const PATCH = save;
