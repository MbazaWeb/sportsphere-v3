import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH || '/sportsphere'}/seed`;

const ACCOUNTS = [
  { id: 'ss-official-sportsphere', name: 'SportSphere', handle: '@sportsphere', role: 'official', initials: 'SS' },
  { id: 'ftz-simba', name: 'Simba SC', handle: '@simba', role: 'team', initials: 'SC' },
  { id: 'media-supersport', name: 'SuperSport', handle: '@supersport', role: 'media', initials: 'SS' },
  { id: 'media-azamsport', name: 'AzamSport', handle: '@azamsport', role: 'media', initials: 'AZ' },
  { id: 'org-tff', name: 'Tanzania Football Federation', handle: '@tff', role: 'official', initials: 'TF' },
  { id: 'biz-justfit', name: 'Just Fit', handle: '@justfit', role: 'business', initials: 'JF' },
  { id: 'an-ali-kingu', name: 'Ali Kingu', handle: '@alikingu', role: 'analyst', initials: 'AK' },
];

const POSTS = [
  {
    id: 'seed-ss-simba',
    user_id: 'ss-official-sportsphere',
    content: 'Nguvu Moja. We are Simba.',
    post_type: 'photo',
    media: [`${BASE}/ss-official-simba.jpg`],
    team_tag: 'Simba SC',
  },
  {
    id: 'seed-supersport-live',
    user_id: 'media-supersport',
    content: 'Every game. Every moment. LIVE — only on SuperSport.',
    post_type: 'media',
    media: [`${BASE}/supersport-live.jpg`],
  },
  {
    id: 'seed-azamsport-live',
    user_id: 'media-azamsport',
    content: 'Live the game. Love the passion. Bila ukomo, popote ulipo!',
    post_type: 'media',
    media: [`${BASE}/azamsport-live.jpg`],
  },
  {
    id: 'seed-simba-jersey',
    user_id: 'ftz-simba',
    content: 'New Simba jersey 2026/27. Buy gear.',
    post_type: 'shop',
    media: [`${BASE}/simba-jersey.jpg`],
    team_tag: 'Simba SC',
  },
  {
    id: 'seed-tff-match',
    user_id: 'org-tff',
    content: 'Match card: Tanzania vs Kenya — 25 May, Benjamin Mkapa Stadium. Tickets TZS 5000.',
    post_type: 'official',
    media: [`${BASE}/tff-match.jpg`],
  },
  {
    id: 'seed-justfit',
    user_id: 'biz-justfit',
    content: 'Shouted for sport. Buy now — TZS 200000.',
    post_type: 'shop',
    media: [`${BASE}/justfit-shoe.jpg`],
  },
  {
    id: 'seed-ali-derby',
    user_id: 'an-ali-kingu',
    content: 'Match analysis: Simba vs Young Africans. Prediction 1-1.',
    post_type: 'prediction',
    media: [`${BASE}/ali-kingu-derby.jpg`],
    team_tag: 'Simba SC',
    player_tag: 'Ali Kingu',
  },
];

export async function POST() {
  for (const a of ACCOUNTS) {
    await supabaseAdmin.from('ss_user').upsert({
      id: a.id,
      name: a.name,
      handle: a.handle,
      role: a.role,
      avatar_initials: a.initials,
      is_verified: true,
      is_active: true,
      is_claimed: a.role === 'official' && a.id.startsWith('ss-'),
      bio: a.name,
    }, { onConflict: 'id' });
  }

  let created = 0;
  for (const p of POSTS) {
    const { error } = await supabaseAdmin.from('ss_post').upsert({
      id: p.id,
      user_id: p.user_id,
      content: p.content,
      post_type: p.post_type,
      media_urls: JSON.stringify(p.media),
      team_tag: p.team_tag || null,
      player_tag: p.player_tag || null,
      like_count: 0,
      comment_count: 0,
    }, { onConflict: 'id' });
    if (!error) created += 1;
    else console.error('seed post', p.id, error.message);
  }

  return NextResponse.json({ ok: true, accounts: ACCOUNTS.length, posts: created });
}

export async function GET() {
  return POST();
}
