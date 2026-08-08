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
      data: { status: newStatus },
    });

    // Update the user
    await db.user.update({
      where: { id: verReq.userId },
      data: {
        verificationStatus: newStatus,
        isVerified: newStatus === "verified",
        // If rejecting, revert role back to fan
        ...(newStatus === "rejected"
          ? {
              role: "fan",
              roleId: undefined, // leave current roleId — don't force fan role ID
              verificationStatus: "rejected",
            }
          : {}),
      },
    });

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (error) {
    console.error("Failed to update verification request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
