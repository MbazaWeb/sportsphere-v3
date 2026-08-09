import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    if (role && role !== "ALL") {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBanned: true,
          bannedAt: true,
          bannedReason: true,
          registeredAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { registeredAt: 'desc' },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
