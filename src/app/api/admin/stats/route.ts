import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
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
