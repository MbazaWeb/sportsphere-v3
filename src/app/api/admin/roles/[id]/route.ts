// PATCH /api/admin/roles/[id] — Approve or reject a verification request
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  try {
    const { action } = await request.json(); // 'approve' | 'reject'
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const verReq = await db.verificationRequest.findUnique({
      where: { id },
    });
    if (!verReq) {
      return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
    }
    if (verReq.status !== "pending") {
      return NextResponse.json({ error: "Request is not pending" }, { status: 409 });
    }

    const newStatus = action === "approve" ? "verified" : "rejected";

    // Update the verification request
    await db.verificationRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: auth.user?.sub,
      },
    });

    // Update the user. On approval, any non-fan role becomes Pro.
    const targetRoleSlug = verReq.role;
    const becomesPro = newStatus === "verified" && targetRoleSlug !== "fan";

    await db.user.update({
      where: { id: verReq.userId },
      data: {
        verificationStatus: newStatus,
        isVerified: newStatus === "verified",
        isPro: becomesPro,
        proSince: becomesPro ? new Date() : null,
        // If rejecting, revert role back to fan
        ...(newStatus === "rejected"
          ? {
              role: "fan",
              verificationStatus: "rejected",
              isPro: false,
              proSince: null,
            }
          : {}),
      },
    });

    return NextResponse.json({ ok: true, status: newStatus, isPro: becomesPro });
  } catch (error) {
    console.error("Failed to update verification request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
