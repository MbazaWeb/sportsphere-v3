import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const [usersCount, postsCount, sportsCount] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.sport.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      users: usersCount,
      posts: postsCount,
      sports: sportsCount,
      pendingRoles: 0,
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
