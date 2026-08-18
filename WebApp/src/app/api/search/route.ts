import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';
import { isAdminRole, publicUserView } from '@/lib/official-account';
import { safeJsonParse } from '@/lib/json';


async function searchSportsDb(q: string) {
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'SportSphere/1.0' }, next: { revalidate: 3600 } as any },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.teams || []).slice(0, 8).map((t: any) => ({
      id: `tsdb-${t.idTeam}`,
      name: t.strTeam,
      type: 'TEAM',
      logoUrl: t.strBadge || t.strLogo || t.strTeamBadge || null,
      extra: [t.strStadium, t.strCountry].filter(Boolean).join(' · '),
    }));
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  if (q.length < 1) return NextResponse.json({ users: [], posts: [], entities: [] });

  const like = `%${q}%`;

  const [usersRes, postsRes, teamsRes, playersRes, leaguesRes] = await Promise.all([
    supabaseAdmin.from('ss_user').select('id,name,handle,role,avatar_url,avatar_initials,is_verified,bio,location,follower_count,following_count,post_count').or(`name.ilike.${JSON.stringify(like).slice(1,-1)},handle.ilike.${JSON.stringify(like).slice(1,-1)}`).limit(12),
    supabaseAdmin.from('ss_post').select('id,user_id,content,post_type,created_at,like_count,comment_count').ilike('content', like).limit(8),
    supabaseAdmin.from('ss_team').select('id,name,slug,logo_url,city,country').or(`name.ilike.${JSON.stringify(like).slice(1,-1)},slug.ilike.${JSON.stringify(like).slice(1,-1)}`).limit(10),
    supabaseAdmin.from('ss_player').select('id,name,slug,photo_url,position').ilike('name', like).limit(8),
    supabaseAdmin.from('ss_league').select('id,name,slug,country').ilike('name', like).limit(6),
  ]);

  const users = ((usersRes.data || []) as any[])
    .filter((u) => !isAdminRole(u.role))
    .map((u) => publicUserView({
      id: u.id,
      name: u.name,
      handle: u.handle,
      role: u.role,
      avatarUrl: u.avatar_url,
      avatarInitials: u.avatar_initials || (u.name || 'U').slice(0, 2).toUpperCase(),
      isVerified: !!u.is_verified,
      bio: u.bio,
      location: u.location,
      followerCount: u.follower_count ?? 0,
      followingCount: u.following_count ?? 0,
      postCount: u.post_count ?? 0,
    }));

  const posts = (postsRes.error && isMissingTable(postsRes.error) ? [] : postsRes.data || []).map((p: any) => ({
    id: p.id,
    content: p.content,
    postType: p.post_type,
    createdAt: p.created_at,
    likeCount: p.like_count ?? 0,
    commentCount: p.comment_count ?? 0,
    user: { name: 'User', handle: '', role: 'fan', isVerified: false },
  }));

  const entities = [
    ...((teamsRes.data || []) as any[]).map((t) => ({
      id: t.id, name: t.name, type: 'TEAM', logoUrl: t.logo_url, extra: [t.city, t.country].filter(Boolean).join(', '),
    })),
    ...((playersRes.data || []) as any[]).map((p) => ({
      id: p.id, name: p.name, type: 'PLAYER', logoUrl: p.photo_url, extra: p.position || '',
    })),
    ...((leaguesRes.data || []) as any[]).map((l) => ({
      id: l.id, name: l.name, type: 'LEAGUE', extra: l.country || '',
    })),
  ];

  const remote = entities.length < 8 ? await searchSportsDb(q) : [];
  const seen = new Set(entities.map((e) => e.name.toLowerCase()));
  for (const e of remote) {
    if (!seen.has(String(e.name).toLowerCase())) entities.push(e);
  }

  return NextResponse.json({ users, posts, entities });
}
