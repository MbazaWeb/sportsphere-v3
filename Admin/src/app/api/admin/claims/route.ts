import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  try {
    const claims = await db.claimRequest.findMany({
      orderBy: { submittedAt: "desc" },
      take: 200,
    });

    // Resolve submitter names
    const userIds = [...new Set(claims.map((c) => c.userId).filter(Boolean))];
    const users =
      userIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, handle: true, email: true },
          })
        : [];
    const userMap = Object.fromEntries(
      users.map((u) => [u.id, u.name || u.handle || u.email || u.id])
    );

    const formatted = claims.map((c) => ({
      id: c.id,
      profileType: (c.profileType || "player").toLowerCase(),
      profileName: c.profileName || "Unnamed Entity",
      submittedBy: userMap[c.userId] || c.userId || "Anonymous",
      status: (c.status || "pending").toLowerCase(),
      createdAt: c.submittedAt?.toISOString() ?? new Date().toISOString(),
      reviewNotes: c.reviewNotes,
    }));

    return NextResponse.json({ ok: true, claims: formatted });
  } catch (error) {
    console.error("Claims GET error:", error);
    return NextResponse.json({ ok: true, claims: [] });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  try {
    const { id, status, reviewNotes } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await db.claimRequest.update({
      where: { id },
      data: {
        status: String(status).toLowerCase(),
        reviewedAt: new Date(),
        ...(reviewNotes != null ? { reviewNotes: String(reviewNotes) } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Claims PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update claim status" },
      { status: 500 }
    );
  }
}
