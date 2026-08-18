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
  { id: 'seed-ss-simba', user_id: 'ss-official-sportsphere', content: 'Nguvu Moja. We are Simba.', post_type: 'official', media: [`${BASE}/ss-official-simba.jpg`] },
  { id: 'seed-supersport-live', user_id: 'media-supersport', content: 'Every game. Every moment. LIVE — only on SuperSport.', post_type: 'media', media: [`${BASE}/supersport-live.jpg`] },
  { id: 'seed-azamsport-live', user_id: 'media-azamsport', content: 'Live the game. Love the passion.', post_type: 'media', media: [`${BASE}/azamsport-live.jpg`] },
  { id: 'seed-simba-jersey', user_id: 'ftz-simba', content: 'New Simba jersey 2026/27.', post_type: 'shop', media: [`${BASE}/simba-jersey.jpg`] },
  { id: 'seed-tff-match', user_id: 'org-tff', content: 'Tanzania vs Kenya — Benjamin Mkapa Stadium.', post_type: 'official', media: [`${BASE}/tff-match.jpg`] },
  { id: 'seed-justfit', user_id: 'biz-justfit', content: 'Shouted for sport.', post_type: 'shop', media: [`${BASE}/justfit-shoe.jpg`] },
  { id: 'seed-ali-derby', user_id: 'an-ali-kingu', content: 'Simba vs Young Africans. Prediction 1-1.', post_type: 'prediction', media: [`${BASE}/ali-kingu-derby.jpg`] },
];

async function upsertUser(a: typeof ACCOUNTS[0]) {
  const attempts = [
    { id: a.id, name: a.name, handle: a.handle, role: a.role, avatar_initials: a.initials, is_verified: true, is_active: true, bio: a.name },
    { id: a.id, name: a.name, handle: a.handle, role: a.role, avatar_initials: a.initials },
    { id: a.id, name: a.name, handle: a.handle, role: a.role },
  ];
  for (const row of attempts) {
    const { error } = await supabaseAdmin.from('ss_user').upsert(row, { onConflict: 'id' });
    if (!error) return null;
    if (!String(error.message).includes('schema cache') && !String(error.code).includes('PGRST204')) return error.message;
  }
  return 'user upsert failed';
}

async function upsertPost(p: typeof POSTS[0]) {
  const attempts = [
    { id: p.id, user_id: p.user_id, content: p.content, post_type: p.post_type, media_urls: JSON.stringify(p.media) },
    { id: p.id, user_id: p.user_id, content: p.content, media_urls: JSON.stringify(p.media) },
    { id: p.id, user_id: p.user_id, content: p.content, media_urls: p.media },
  ];
  for (const row of attempts) {
    const { error } = await supabaseAdmin.from('ss_post').upsert(row as any, { onConflict: 'id' });
    if (!error) return null;
    const { error: ins } = await supabaseAdmin.from('ss_post').insert(row as any);
    if (!ins) return null;
  }
  const last = await supabaseAdmin.from('ss_post').insert({
    user_id: p.user_id,
    content: p.content,
    media_urls: JSON.stringify(p.media),
  });
  return last.error?.message || null;
}

export async function GET() {
  const errors: string[] = [];
  for (const a of ACCOUNTS) {
    const e = await upsertUser(a);
    if (e) errors.push(`user ${a.id}: ${e}`);
  }
  let created = 0;
  for (const p of POSTS) {
    const e = await upsertPost(p);
    if (e) errors.push(`post ${p.id}: ${e}`);
    else created += 1;
  }
  const { count } = await supabaseAdmin.from('ss_post').select('*', { count: 'exact', head: true });
  return NextResponse.json({ ok: errors.length === 0, created, postCount: count ?? 0, errors });
}

export async function POST() {
  return GET();
}
