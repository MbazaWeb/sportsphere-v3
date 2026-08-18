/**
 * migrate-to-supabase.ts
 * 
 * Copies all data from existing PostgreSQL (via Prisma) to Supabase.
 * Run ONCE after setting up Supabase project.
 * 
 * Usage:
 *   npx ts-node scripts/migrate-to-supabase.ts
 * 
 * Environment:
 *   DATABASE_URL=postgresql://... (existing Postgres)
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function migrate<T>(
  label: string,
  fetchFn: () => Promise<T[]>,
  table: string,
  transformFn?: (row: T) => any,
) {
  try {
    console.log(`\n⏳ Migrating ${label}...`);
    const rows = await fetchFn();
    if (!rows.length) { console.log(`   ✓ No rows to migrate`); return; }

    const data = transformFn ? rows.map(transformFn) : rows;

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { error } = await supabase.from(table).upsert(batch, { ignoreDuplicates: true });
      if (error) { console.error(`   ❌ Error: ${error.message}`); break; }
      inserted += batch.length;
    }
    console.log(`   ✅ ${inserted}/${rows.length} rows migrated`);
  } catch (e: any) {
    console.error(`   ❌ Failed: ${e.message}`);
  }
}

// Helper: strip Prisma Date objects → ISO strings
const dt = (d: any) => d instanceof Date ? d.toISOString() : d;
const sanitize = (obj: any) => {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
};

async function main() {
  console.log('🚀 SportSphere → Supabase Migration');
  console.log('=====================================\n');

  // 1. Roles
  await migrate('roles', () => prisma.role.findMany(), 'role', sanitize);
  await migrate('role_types', () => prisma.roleType.findMany(), 'role_type', sanitize);
  await migrate('sports', () => prisma.sport.findMany(), 'sport', sanitize);

  // 2. Users (core)
  await migrate('users', () => prisma.user.findMany({
    select: {
      id: true, name: true, handle: true, email: true, passwordHash: true,
      role: true, avatarUrl: true, coverUrl: true, coverGradient: true,
      bio: true, location: true, nationality: true, isVerified: true, isPro: true,
      isActive: true, verificationStatus: true, followerCount: true,
      followingCount: true, fanCount: true, postCount: true,
      registeredAt: true, createdAt: true, updatedAt: true,
    }
  }), 'user', sanitize);

  // 3. Social
  await migrate('follows', () => prisma.follow.findMany(), 'follow', sanitize);
  await migrate('posts', () => prisma.post.findMany({
    select: {
      id: true, userId: true, content: true, postType: true, mediaUrls: true,
      communityId: true, likeCount: true, commentCount: true, shareCount: true,
      isBreaking: true, sportTag: true, locationTag: true,
      createdAt: true, updatedAt: true,
    }
  }), 'post', (p: any) => ({
    ...sanitize(p),
    mediaUrls: JSON.stringify(p.mediaUrls ?? []),
  }));
  await migrate('post_likes', () => prisma.postLike.findMany(), 'post_like', sanitize);
  await migrate('comments', () => prisma.comment.findMany(), 'comment', sanitize);
  await migrate('polls', () => prisma.poll.findMany(), 'poll', sanitize);
  await migrate('poll_votes', () => prisma.pollVote.findMany(), 'poll_vote', sanitize);
  await migrate('predictions', () => prisma.prediction.findMany(), 'prediction', sanitize);

  // 4. Communities
  await migrate('communities', () => prisma.community.findMany(), 'community', sanitize);
  await migrate('community_members', () => prisma.communityMember.findMany(), 'community_member', sanitize);

  // 5. Messages & Notifications
  await migrate('messages', () => prisma.message.findMany(), 'message', sanitize);
  await migrate('notifications', () => prisma.notification.findMany(), 'notification', sanitize);

  // 6. Sports data
  await migrate('teams', () => prisma.team.findMany(), 'team', sanitize);
  await migrate('leagues', () => prisma.league.findMany(), 'league', sanitize);
  await migrate('players', () => prisma.player.findMany(), 'player', sanitize);
  await migrate('matches', () => prisma.match.findMany(), 'match', sanitize);
  await migrate('news_items', () => prisma.newsItem.findMany(), 'news_item', sanitize);

  // 7. Performance
  await migrate('leaderboard_entries', () => prisma.leaderboardEntry.findMany(), 'leaderboard_entry', sanitize);
  await migrate('performance_profiles', () => prisma.performanceProfile.findMany(), 'performance_profile', sanitize);
  await migrate('performance_events', () => prisma.performanceEvent.findMany(), 'performance_event', sanitize);

  // 8. Profiles
  await migrate('player_profiles', () => prisma.playerProfile.findMany(), 'player_profile', sanitize);
  await migrate('coach_profiles', () => prisma.coachProfile.findMany(), 'coach_profile', sanitize);
  await migrate('team_profiles', () => prisma.teamProfile.findMany(), 'team_profile', sanitize);

  // 9. Push tokens
  await migrate('push_tokens', () => prisma.pushToken.findMany(), 'push_token', sanitize);

  console.log('\n\n🎉 Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Enable RLS in Supabase dashboard');
  console.log('2. Add RLS policies (see supabase/rls-policies.sql)');
  console.log('3. Test all API routes');
  console.log('4. Update .env to point to Supabase');
  console.log('5. Remove Prisma: npm uninstall @prisma/client prisma');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
