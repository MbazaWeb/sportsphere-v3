import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminGuard";
import si from "systeminformation";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function dayStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function labelDay(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * GET /api/admin/overview-stats
 * Live telemetry + engagement series for the animated control-center dashboard.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const now = new Date();
    const onlineCutoff = new Date(now.getTime() - 5 * 60 * 1000); // 5 min
    const activeCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const days = 14;
    const seriesStart = dayStart(new Date(now.getTime() - (days - 1) * 86400000));

    const [
      users,
      posts,
      sports,
      pendingRoles,
      news,
      rumors,
      claims,
      teams,
      players,
      comments,
      likes,
      follows,
      polls,
      onlineUsers,
      activeUsers24h,
      signupsToday,
      postsToday,
      load,
      mem,
      net,
      recentUsers,
      postsByType,
      sportsList,
      recentPosts,
      likesRecent,
      commentsRecent,
      followsRecent,
      usersSeriesRaw,
      postsSeriesRaw,
    ] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.sport.count({ where: { isActive: true } }),
      db.verificationRequest.count({ where: { status: "pending" } }).catch(() => 0),
      db.newsItem.count().catch(() => 0),
      db.rumor.count().catch(() => 0),
      db.claimRequest.count({ where: { status: "pending" } }).catch(() => 0),
      db.team.count().catch(() => 0),
      db.player.count().catch(() => 0),
      db.comment.count().catch(() => 0),
      db.postLike.count().catch(() => 0),
      db.follow.count().catch(() => 0),
      db.poll.count().catch(() => 0),
      db.user.count({ where: { lastSeenAt: { gte: onlineCutoff } } }).catch(() => 0),
      db.user.count({ where: { lastSeenAt: { gte: activeCutoff } } }).catch(() => 0),
      db.user.count({ where: { registeredAt: { gte: dayStart(now) } } }).catch(() => 0),
      db.post.count({ where: { createdAt: { gte: dayStart(now) } } }).catch(() => 0),
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
      db.user.findMany({
        where: { registeredAt: { gte: seriesStart } },
        select: { registeredAt: true },
        take: 5000,
      }),
      db.post.groupBy({
        by: ["postType"],
        _count: { _all: true },
      }).catch(() => [] as { postType: string; _count: { _all: number } }[]),
      db.sport.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          icon: true,
          _count: { select: { Team: true, Player: true } },
        },
        orderBy: { name: "asc" },
        take: 20,
      }).catch(() => []),
      db.post.findMany({
        where: { createdAt: { gte: seriesStart } },
        select: { createdAt: true, postType: true, mediaUrls: true },
        take: 8000,
      }),
      db.postLike.findMany({
        where: { createdAt: { gte: seriesStart } },
        select: { createdAt: true },
        take: 8000,
      }).catch(() => []),
      db.comment.findMany({
        where: { createdAt: { gte: seriesStart } },
        select: { createdAt: true },
        take: 8000,
      }).catch(() => []),
      db.follow.findMany({
        where: { createdAt: { gte: seriesStart } },
        select: { createdAt: true },
        take: 8000,
      }).catch(() => []),
      db.user.findMany({
        where: { registeredAt: { gte: seriesStart } },
        select: { registeredAt: true },
        orderBy: { registeredAt: "asc" },
        take: 5000,
      }),
      db.post.findMany({
        where: { createdAt: { gte: seriesStart } },
        select: { createdAt: true, postType: true, mediaUrls: true },
        orderBy: { createdAt: "asc" },
        take: 8000,
      }),
    ]);

    // Build daily series buckets
    const buckets: {
      day: string;
      key: string;
      signups: number;
      posts: number;
      likes: number;
      comments: number;
      follows: number;
      images: number;
      videos: number;
      polls: number;
    }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(seriesStart.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets.push({
        day: labelDay(d),
        key,
        signups: 0,
        posts: 0,
        likes: 0,
        comments: 0,
        follows: 0,
        images: 0,
        videos: 0,
        polls: 0,
      });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));

    const bump = (date: Date, field: keyof (typeof buckets)[0], n = 1) => {
      const key = date.toISOString().slice(0, 10);
      const b = byKey.get(key);
      if (b && typeof b[field] === "number") {
        (b as any)[field] += n;
      }
    };

    for (const u of usersSeriesRaw) bump(new Date(u.registeredAt), "signups");
    for (const p of postsSeriesRaw) {
      bump(new Date(p.createdAt), "posts");
      const type = (p.postType || "post").toLowerCase();
      if (type.includes("poll")) bump(new Date(p.createdAt), "polls");
      if (type.includes("video")) bump(new Date(p.createdAt), "videos");
      if (type.includes("photo") || type.includes("image") || type.includes("highlight")) {
        bump(new Date(p.createdAt), "images");
      } else {
        // mediaUrls array length
        try {
          const media = Array.isArray(p.mediaUrls)
            ? p.mediaUrls
            : typeof p.mediaUrls === "string"
              ? JSON.parse(p.mediaUrls)
              : [];
          if (Array.isArray(media) && media.length > 0) {
            const isVid = media.some(
              (m: any) =>
                typeof m === "string" &&
                (m.includes(".mp4") || m.includes("video") || m.includes(".webm"))
            );
            if (isVid) bump(new Date(p.createdAt), "videos");
            else bump(new Date(p.createdAt), "images");
          }
        } catch {
          /* ignore */
        }
      }
    }
    for (const l of likesRecent) bump(new Date(l.createdAt), "likes");
    for (const c of commentsRecent) bump(new Date(c.createdAt), "comments");
    for (const f of followsRecent) bump(new Date(f.createdAt), "follows");

    // Content type pie
    const typeMap: Record<string, number> = {};
    for (const row of postsByType as any[]) {
      const k = row.postType || "post";
      typeMap[k] = (typeMap[k] || 0) + (row._count?._all ?? row._count ?? 0);
    }
    // ensure image/video/poll labels from recent posts if groupBy sparse
    let imagePosts = 0;
    let videoPosts = 0;
    let pollPosts = typeMap["poll"] || 0;
    for (const p of recentPosts) {
      const type = (p.postType || "").toLowerCase();
      if (type.includes("poll")) pollPosts++;
      if (type.includes("video")) videoPosts++;
      if (type.includes("photo") || type.includes("image") || type.includes("highlight"))
        imagePosts++;
    }

    const eth0 = net?.[0] || { rx_sec: 0, tx_sec: 0 };

    // Flow chart nodes (for animated app flow)
    const flow = {
      nodes: [
        { id: "signups", label: "Sign-ins", value: signupsToday },
        { id: "online", label: "Online", value: onlineUsers },
        { id: "posts", label: "Posts", value: postsToday },
        { id: "likes", label: "Likes", value: likes },
        { id: "comments", label: "Comments", value: comments },
        { id: "follows", label: "Follows", value: follows },
      ],
      edges: [
        { from: "signups", to: "online" },
        { from: "online", to: "posts" },
        { from: "posts", to: "likes" },
        { from: "posts", to: "comments" },
        { from: "online", to: "follows" },
      ],
    };

    return NextResponse.json({
      ok: true,
      db: {
        users,
        posts,
        sports,
        pendingRoles,
        news,
        rumors,
        pendingClaims: claims,
        teams,
        players,
        comments,
        likes,
        follows,
        polls,
        onlineUsers,
        activeUsers24h,
        signupsToday,
        postsToday,
        imagePosts,
        videoPosts,
        pollPosts,
      },
      series: buckets,
      postTypes: Object.entries(typeMap).map(([name, value]) => ({ name, value })),
      sports: (sportsList as any[]).map((s) => ({
        name: s.name,
        icon: s.icon,
        teams: s._count?.Team ?? 0,
        players: s._count?.Player ?? 0,
      })),
      flow,
      system: {
        cpu: Math.round(load.currentLoad * 10) / 10,
        ram: Math.round((mem.active / mem.total) * 1000) / 10,
        eth0: {
          rx: Math.round((eth0.rx_sec || 0) / 1024),
          tx: Math.round((eth0.tx_sec || 0) / 1024),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("overview-stats failed:", error);
    return NextResponse.json(
      { error: "Failed to load overview stats", detail: String(error) },
      { status: 500 }
    );
  }
}
