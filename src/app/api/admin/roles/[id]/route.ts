// PATCH /api/admin/roles/[id] — Approve or reject a verification request
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";
import { logAdminAction } from "@/lib/audit";

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

    // Update the user.
    const targetRoleSlug = verReq.role;
    const becomesPro = newStatus === "verified" && targetRoleSlug !== "fan";

    // FIX: On approval, update user.role to the requested role slug
    // (previously this was only done on rejection, causing approved users
    // to stay as "fan" despite being verified)
    const userData: Record<string, unknown> = {
      verificationStatus: newStatus,
      isVerified: newStatus === "verified",
      isPro: becomesPro,
      proSince: becomesPro ? new Date() : null,
    };

    if (newStatus === "rejected") {
      userData.role = "fan";
      userData.isPro = false;
      userData.proSince = null;
    } else {
      // On approval, set the user's role to the verified role
      userData.role = targetRoleSlug;
    }

    await db.user.update({
      where: { id: verReq.userId },
      data: userData,
    });

    // ── Audit log ────────────────────────────────────────────────
    await logAdminAction({
      request,
      actorId: auth.user!.sub,
      action: `verification.${action}`,
      module: "verifications",
      targetId: id,
      targetType: "VerificationRequest",
      oldValue: { status: "pending", role: targetRoleSlug, userId: verReq.userId },
      newValue: { status: newStatus, isPro: becomesPro, role: userData.role },
    }).catch(() => {});

    return NextResponse.json({ ok: true, status: newStatus, isPro: becomesPro });
  } catch (error) {
    console.error("Failed to update verification request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
