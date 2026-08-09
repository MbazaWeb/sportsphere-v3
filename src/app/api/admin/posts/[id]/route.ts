// DELETE /api/admin/posts/[id] — Delete a post (admin only)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/adminGuard";
import { logAdminAction } from "@/lib/audit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    // Fetch post for audit before deletion
    const post = await db.post.findUnique({
      where: { id },
      select: { id: true, content: true, userId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await db.post.delete({
      where: { id },
    });

    // ── Audit log ────────────────────────────────────────────────
    await logAdminAction({
      request,
      actorId: auth.user!.sub,
      action: "post.delete",
      module: "content",
      targetId: id,
      targetType: "Post",
      oldValue: { content: post.content?.slice(0, 200), userId: post.userId },
      newValue: null,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Failed to delete post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
