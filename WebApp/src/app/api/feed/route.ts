import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { safeJsonParse } from '@/lib/json';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type    = searchParams.get('type') || 'for-you';
    const userId  = searchParams.get('userId');
    const q       = searchParams.get('q')?.trim();
    const limit   = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
    const offset  = parseInt(searchParams.get('offset') || '0');

    const me = await getUserIdFromRequest(request).catch(() => null);

    // ── Fetch posts ──────────────────────────────────────────────────────────
    let query = supabaseAdmin
      .from('ss_post')
      .select('*')
      .range(offset, offset + limit - 1);

    if (userId)  query = query.eq('user_id', userId);
    if (q)       query = query.ilike('content', `%${q}%`);
    if (type === 'spotlight') query = query.in('post_type', ['video','spotlight']);
    if (type === 'trending' || type === 'spotlight')
      query = query.order('like_count', { ascending: false });
    else
      query = query.order('created_at', { ascending: false });

    const { data: posts, error } = await query;
    if (error) throw new Error(error.message);
    const rows = posts ?? [];

    // ── Fetch users ──────────────────────────────────────────────────────────
    const userIds = [...new Set(rows.map((p: any) => p.user_id).filter(Boolean))];
    const usersById: Record<string, any> = {};
    if (userIds.length) {
      const { data: users } = await supabaseAdmin
        .from('ss_user')
        .select('id,name,handle,avatar_url,avatar_initials,role,is_verified,is_pro')
        .in('id', userIds);
      for (const u of users ?? []) usersById[u.id] = u;
    }

    // ── Fetch polls ──────────────────────────────────────────────────────────
    const postIds = rows.map((p: any) => p.id);
    const pollsByPostId: Record<string, any> = {};
    const predByPostId: Record<string, any> = {};

    if (postIds.length) {
      const { data: polls } = await supabaseAdmin
        .from('ss_poll')
        .select('*')
        .in('post_id', postIds);
      for (const poll of polls ?? []) pollsByPostId[poll.post_id] = poll;

      const { data: preds } = await supabaseAdmin
        .from('ss_prediction')
        .select('*')
        .in('post_id', postIds);
      for (const pred of preds ?? []) predByPostId[pred.post_id] = pred;
    }

    // ── Fetch liked by me ────────────────────────────────────────────────────
    const likedSet = new Set<string>();
    if (me && postIds.length) {
      const { data: likes } = await supabaseAdmin
        .from('ss_post_like')
        .select('post_id')
        .eq('user_id', me)
        .in('post_id', postIds);
      for (const l of likes ?? []) likedSet.add(l.post_id);
    }

    // ── Fetch poll votes ─────────────────────────────────────────────────────
    const myVotes: Record<string, number> = {};
    if (me) {
      const pollIds = Object.values(pollsByPostId).map((p: any) => p.id);
      if (pollIds.length) {
        const { data: votes } = await supabaseAdmin
          .from('ss_poll_vote')
          .select('poll_id,option_idx')
          .eq('user_id', me)
          .in('poll_id', pollIds);
        for (const v of votes ?? []) myVotes[v.poll_id] = v.option_idx;
      }
    }

    // ── Serialize ────────────────────────────────────────────────────────────
    const serialized = rows.map((post: any) => {
      const u = usersById[post.user_id] || {};
      const poll = pollsByPostId[post.id];
      const pred = predByPostId[post.id];

      return {
        id:           post.id,
        userId:       post.user_id,
        content:      post.content || '',
        postType:     post.post_type || 'post',
        mediaUrls:    safeJsonParse(post.media_urls, []),
        teamTag:      post.team_tag || null,
        playerTag:    post.player_tag || null,
        isBreaking:   post.is_breaking || false,
        hashtags:     safeJsonParse(post.hashtags, []),
        likeCount:    post.like_count ?? 0,
        commentCount: post.comment_count ?? 0,
        shareCount:   post.share_count ?? 0,
        viewCount:    post.view_count ?? 0,
        likedByMe:    likedSet.has(post.id),
        createdAt:    post.created_at,
        updatedAt:    post.updated_at,

        // Match badges (for match-type posts)
        homeBadge:    post.home_badge || null,
        awayBadge:    post.away_badge || null,
        homeLogo:     post.home_badge || null,
        awayLogo:     post.away_badge || null,

        // Nested user object — matches Flutter PostUser
        user: {
          id:         u.id || post.user_id,
          name:       u.name || 'SportSphere User',
          handle:     u.handle || '@user',
          avatarUrl:  u.avatar_url || null,
          avatar:     u.avatar_initials || (u.name || 'U').slice(0, 2).toUpperCase(),
          isVerified: u.is_verified || false,
          isPro:      u.is_pro || false,
          role:       u.role || 'fan',
        },

        // Poll — matches Flutter PollData
        poll: poll ? {
          id:              poll.id,
          question:        poll.question || '',
          options:         safeJsonParse(poll.options, []),
          endsAt:          poll.ends_at,
          userVotedOption: myVotes[poll.id] ?? null,
          optionCounts:    safeJsonParse(poll.option_counts, []),
          totalVotes:      poll.total_votes ?? 0,
        } : null,

        // Prediction — matches Flutter PredictionData
        prediction: pred ? {
          id:             pred.id,
          homeTeam:       pred.home_team || '',
          awayTeam:       pred.away_team || '',
          predictedHome:  pred.predicted_home,
          predictedAway:  pred.predicted_away,
          confidence:     pred.confidence,
          result:         pred.result,
          isCorrect:      pred.result === 'correct',
        } : null,
      };
    });

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error('feed GET', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
