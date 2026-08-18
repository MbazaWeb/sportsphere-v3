import { supabaseAdmin } from '@/lib/supabase';

export async function recountUser(userId: string) {
  const [{ count: followingCount }, { count: followerCount }, { count: fanCount }] = await Promise.all([
    supabaseAdmin.from('ss_follow').select('*', { count: 'exact', head: true }).eq('follower_id', userId).eq('kind', 'follow'),
    supabaseAdmin.from('ss_follow').select('*', { count: 'exact', head: true }).eq('following_id', userId).eq('kind', 'follow'),
    supabaseAdmin.from('ss_follow').select('*', { count: 'exact', head: true }).eq('following_id', userId).eq('kind', 'fan'),
  ]);
  const counts = {
    following_count: followingCount ?? 0,
    follower_count: followerCount ?? 0,
    fan_count: fanCount ?? 0,
  };
  await supabaseAdmin.from('ss_user').update(counts).eq('id', userId);
  return {
    followingCount: counts.following_count,
    followerCount: counts.follower_count,
    fanCount: counts.fan_count,
  };
}
