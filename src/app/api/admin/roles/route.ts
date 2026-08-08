// GET /api/admin/roles — List verification requests
// PATCH /api/admin/roles — Not here; per-request actions at /api/admin/roles/[id]
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const requests = await db.verificationRequest.findMany({
      where: status === "ALL" ? {} : { status },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            handle: true,
            avatarUrl: true,
            role: true,
            verificationStatus: true,
          },
        },
      },
      take: 100,
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch role requests:", error);
    return NextResponse.json({ error: "Failed to fetch role requests" }, { status: 500 });
  }
}
