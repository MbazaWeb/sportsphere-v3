const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const SUPABASE_URL = 'https://vqyfybuloyqahgoagmzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZ5YnVsb3lxYWhnb2FnbXpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyMTc5OCwiZXhwIjoyMTAyNTk3Nzk4fQ.svhWtQfe7DM0y2vTD9cwVeuYyJkXSDBZfluIX4AT6Ts';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const prisma = new PrismaClient();

const dt = (d) => d instanceof Date ? d.toISOString() : d;
const clean = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
};

async function migrate(label, fetchFn, table, transformFn) {
  try {
    process.stdout.write(`\n⏳ ${label}...`);
    const rows = await fetchFn();
    if (!rows.length) { console.log(' (empty)'); return; }
    const data = transformFn ? rows.map(transformFn) : rows.map(clean);
    let inserted = 0;
    for (let i = 0; i < data.length; i += 200) {
      const batch = data.slice(i, i + 200);
      const { error } = await sb.from(table).upsert(batch, { ignoreDuplicates: true });
      if (error) { console.log(`\n   ❌ ${error.message}`); return; }
      inserted += batch.length;
    }
    console.log(` ✅ ${inserted} rows`);
  } catch(e) { console.log(`\n   ❌ ${e.message}`); }
}

async function main() {
  console.log('🚀 SportSphere → Supabase Migration\n');

  await migrate('users', () => prisma.user.findMany({
    select: {
      id:true, name:true, handle:true, email:true, passwordHash:true,
      role:true, avatarUrl:true, coverUrl:true, coverGradient:true,
      bio:true, location:true, nationality:true, isVerified:true, isPro:true,
      isActive:true, verificationStatus:true, followerCount:true,
      followingCount:true, fanCount:true, postCount:true,
      registeredAt:true, createdAt:true, updatedAt:true,
    }
  }), 'ss_user', (u) => ({
    id: u.id, name: u.name, handle: u.handle, email: u.email,
    password_hash: u.passwordHash, role: u.role,
    avatar_url: u.avatarUrl, cover_url: u.coverUrl, cover_gradient: u.coverGradient,
    bio: u.bio, location: u.location, nationality: u.nationality,
    is_verified: u.isVerified, is_pro: u.isPro, is_active: u.isActive,
    verification_status: u.verificationStatus,
    follower_count: u.followerCount, following_count: u.followingCount,
    fan_count: u.fanCount, post_count: u.postCount,
    registered_at: dt(u.registeredAt), created_at: dt(u.createdAt), updated_at: dt(u.updatedAt),
  }));

  await migrate('follows', () => prisma.follow.findMany(), 'ss_follow', (f) => ({
    id: f.id || `${f.followerId}-${f.followingId}`,
    follower_id: f.followerId, following_id: f.followingId,
    kind: f.kind, created_at: dt(f.createdAt),
  }));

  await migrate('posts', () => prisma.post.findMany({
    select: {
      id:true, userId:true, content:true, postType:true, mediaUrls:true,
      likeCount:true, commentCount:true, shareCount:true,
      isBreaking:true, sportTag:true, teamTag:true, playerTag:true,
      createdAt:true, updatedAt:true,
    }
  }), 'ss_post', (p) => ({
    id: p.id, user_id: p.userId, content: p.content || '',
    post_type: p.postType, media_urls: JSON.stringify(p.mediaUrls || []),
    like_count: p.likeCount,
    comment_count: p.commentCount, share_count: p.shareCount,
    is_breaking: p.isBreaking, sport_tag: p.sportTag,
    team_tag: p.teamTag, player_tag: p.playerTag,
    created_at: dt(p.createdAt), updated_at: dt(p.updatedAt),
  }));

  await migrate('post_likes', () => prisma.postLike.findMany(), 'ss_post_like', (l) => ({
    id: `${l.postId}-${l.userId}`,
    post_id: l.postId, user_id: l.userId, created_at: dt(l.createdAt),
  }));

  await migrate('comments', () => prisma.comment.findMany(), 'ss_comment', (c) => ({
    id: c.id, post_id: c.postId, user_id: c.userId, content: c.content || '',
    parent_id: c.parentId, like_count: c.likeCount || 0,
    created_at: dt(c.createdAt), updated_at: dt(c.updatedAt),
  }));

  await migrate('polls', () => prisma.poll.findMany(), 'ss_poll', (p) => ({
    id: p.id, post_id: p.postId, question: p.question || '',
    options: JSON.stringify(p.options || []), ends_at: dt(p.endsAt),
    created_at: dt(p.createdAt),
  }));

  await migrate('poll_votes', () => prisma.pollVote.findMany(), 'ss_poll_vote', (v) => ({
    id: v.id, poll_id: v.pollId, user_id: v.userId,
    option_idx: v.optionIdx, created_at: dt(v.createdAt),
  }));

  await migrate('predictions', () => prisma.prediction.findMany(), 'ss_prediction', (p) => ({
    id: p.id, user_id: p.userId, home_team: p.homeTeam || '',
    away_team: p.awayTeam || '', predicted_home: p.predictedHome,
    predicted_away: p.predictedAway, confidence: p.confidence,
    result: p.result, points_earned: p.pointsEarned || 0,
    created_at: dt(p.createdAt), updated_at: dt(p.updatedAt),
  }));

  await migrate('communities', () => prisma.community.findMany(), 'ss_community', (c) => ({
    id: c.id, name: c.name, description: c.description, topic: c.topic,
    member_count: c.memberCount || 0, created_by_id: c.createdById,
    created_at: dt(c.createdAt), updated_at: dt(c.updatedAt),
  }));

  await migrate('community_members', () => prisma.communityMember.findMany(), 'ss_community_member', (m) => ({
    id: m.id, community_id: m.communityId, user_id: m.userId,
    role: m.role, joined_at: dt(m.joinedAt || m.createdAt),
  }));

  await migrate('messages', () => prisma.message.findMany(), 'ss_message', (m) => ({
    id: m.id, sender_id: m.senderId, receiver_id: m.receiverId,
    content: m.content || '', is_read: m.isRead || false,
    created_at: dt(m.createdAt),
  }));

  await migrate('notifications', () => prisma.notification.findMany(), 'ss_notification', (n) => ({
    id: n.id, user_id: n.userId, title: n.title || '',
    body: n.body, notif_type: n.type || 'info', actor_id: n.actorId,
    is_read: n.isRead || false, created_at: dt(n.createdAt),
  }));

  await migrate('teams', () => prisma.team.findMany(), 'ss_team', (t) => ({
    id: t.id, name: t.name, short_name: t.shortName, slug: t.slug,
    league_id: t.leagueId, country: t.country, logo_url: t.logoUrl,
    founded_year: t.foundedYear, description: t.description,
    created_at: dt(t.createdAt), updated_at: dt(t.updatedAt),
  }));

  await migrate('leagues', () => prisma.league.findMany(), 'ss_league', (l) => ({
    id: l.id, name: l.name, slug: l.slug, sport_id: l.sportId,
    country: l.country, logo_url: l.logoUrl, description: l.description,
    created_at: dt(l.createdAt), updated_at: dt(l.updatedAt),
  }));

  await migrate('players', () => prisma.player.findMany(), 'ss_player', (p) => ({
    id: p.id, team_id: p.teamId, sport_id: p.sportId,
    name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
    slug: p.slug, player_position: p.position,
    country_code: p.countryCode, photo_url: p.photoUrl,
    external_id: p.externalId, verified: p.verified || false,
    created_at: dt(p.createdAt), updated_at: dt(p.updatedAt),
  }));

  await migrate('matches', () => prisma.matchProfile.findMany(), 'ss_match', (m) => ({
    id: m.id, league: m.leagueId, home_team: m.homeTeamName || '',
    away_team: m.awayTeamName || '', home_score: m.homeScore,
    away_score: m.awayScore, status: m.status || 'upcoming',
    minute: m.minute, venue: m.venue,
    events: JSON.stringify(m.events || []),
    created_at: dt(m.createdAt), updated_at: dt(m.updatedAt),
  }));

  await migrate('leaderboard', () => prisma.leaderboardEntry.findMany(), 'ss_leaderboard_entry', (e) => ({
    id: e.id, user_id: e.userId, period: e.period || 'monthly',
    correct_predictions: e.correctPredictions || 0,
    total_predictions: e.totalPredictions || 0,
    points: e.points || 0, rank: e.rank || 0,
    updated_at: dt(e.updatedAt),
  }));

  await migrate('push_tokens', () => prisma.pushToken.findMany(), 'ss_push_token', (t) => ({
    id: t.id, user_id: t.userId, token: t.token,
    platform: t.platform || 'android',
    created_at: dt(t.createdAt), updated_at: dt(t.updatedAt),
  }));

  console.log('\n\n🎉 Migration complete!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('\n❌ Fatal:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
