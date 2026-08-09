// PUT /api/admin/users/[id] — Update user role or ban status (admin only)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";
import { logAdminAction } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { role, isBanned, bannedReason } = body;

    // ── Input validation ──────────────────────────────────────────
    const allowedRoles = [
      "fan", "player", "coach", "team", "scout", "journalist",
      "creator", "analyst", "commentator", "agent", "organization",
      "competition", "league", "academy", "venue", "business",
      "commercial-partner", "community", "moderator", "administrator",
    ];

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) {
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updateData.role = role;
    }
    if (isBanned !== undefined) {
      updateData.isBanned = Boolean(isBanned);
      updateData.bannedAt = isBanned ? new Date() : null;
      if (isBanned && bannedReason) updateData.bannedReason = String(bannedReason).slice(0, 500);
      if (!isBanned) { updateData.bannedReason = null; }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // ── Fetch current user for audit trail ───────────────────────
    const before = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isBanned: true },
    });

    if (!before) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Prevent admin from demoting themselves ───────────────────
    if (role !== undefined && before.id === auth.user?.sub && before.role === "administrator" && role !== "administrator") {
      return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    // ── Audit log ────────────────────────────────────────────────
    await logAdminAction({
      request,
      actorId: auth.user!.sub,
      action: role ? "user.role_change" : "user.ban_toggle",
      module: "users",
      targetId: id,
      targetType: "User",
      oldValue: { role: before.role, isBanned: before.isBanned ?? false },
      newValue: { role: updatedUser.role, isBanned: updatedUser.isBanned ?? false },
    }).catch(() => {});

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
