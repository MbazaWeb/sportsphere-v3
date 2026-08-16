import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TRANSFER_TYPES = new Set(["permanent", "loan", "free", "loan_return"]);

/**
 * GET /api/admin/players/[id]/transfer
 * List transfer history for a player (newest first).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const player = await db.player.findUnique({
      where: { id },
      select: { id: true, name: true, teamId: true },
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const transfers = await db.playerTransfer.findMany({
      where: { playerId: id },
      orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
      include: {
        FromTeam: { select: { id: true, name: true, logoUrl: true } },
        ToTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    return NextResponse.json({ player, transfers });
  } catch (error) {
    console.error("Failed to list transfers:", error);
    return NextResponse.json(
      { error: "Failed to list transfers", detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/players/[id]/transfer
 * Body: {
 *   toTeamId?: string | null,   // null = release / free agent
 *   transferType: permanent|loan|free|loan_return
 *   fee?, currency?, window?, season?, notes?,
 *   effectiveAt?, announcedAt?, loanUntil?, contractUntil?
 * }
 *
 * Logic:
 * - permanent / free: move player to toTeamId (or null), close any active_loan
 * - loan: move to toTeamId, status active_loan, keep fromTeam as parent club
 * - loan_return: must have active_loan; return player to fromTeam of that loan
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id: playerId } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const transferType = String(body.transferType || "permanent").toLowerCase();
    if (!TRANSFER_TYPES.has(transferType)) {
      return NextResponse.json(
        { error: "Invalid transferType. Use permanent, loan, free, or loan_return." },
        { status: 400 }
      );
    }

    const player = await db.player.findUnique({
      where: { id: playerId },
      include: {
        Team: { select: { id: true, name: true, leagueId: true, sportId: true } },
      },
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const fromTeamId = player.teamId;
    let toTeamId: string | null =
      body.toTeamId === null || body.toTeamId === ""
        ? null
        : body.toTeamId
          ? String(body.toTeamId)
          : null;

    // Active loan (if any)
    const activeLoan = await db.playerTransfer.findFirst({
      where: { playerId, status: "active_loan", transferType: "loan" },
      orderBy: { effectiveAt: "desc" },
    });

    if (transferType === "loan_return") {
      if (!activeLoan) {
        return NextResponse.json(
          { error: "No active loan found for this player." },
          { status: 400 }
        );
      }
      toTeamId = activeLoan.fromTeamId;
      if (!toTeamId) {
        return NextResponse.json(
          { error: "Active loan has no parent club to return to." },
          { status: 400 }
        );
      }
    }

    if (transferType === "loan" && !toTeamId) {
      return NextResponse.json(
        { error: "Loan requires a destination team (toTeamId)." },
        { status: 400 }
      );
    }

    if (toTeamId && toTeamId === fromTeamId) {
      return NextResponse.json(
        { error: "Destination team is the same as the current team." },
        { status: 400 }
      );
    }

    let toTeam: {
      id: string;
      name: string;
      leagueId: string | null;
      sportId: string | null;
    } | null = null;
    if (toTeamId) {
      toTeam = await db.team.findUnique({
        where: { id: toTeamId },
        select: { id: true, name: true, leagueId: true, sportId: true },
      });
      if (!toTeam) {
        return NextResponse.json({ error: "Destination team not found." }, { status: 404 });
      }
    }

    const fee = body.fee != null ? String(body.fee) : null;
    const currency = body.currency != null ? String(body.currency) : "EUR";
    const window = body.window != null ? String(body.window) : null;
    const season = body.season != null ? String(body.season) : null;
    const notes = body.notes != null ? String(body.notes) : null;
    const announcedAt = body.announcedAt
      ? new Date(String(body.announcedAt))
      : new Date();
    const effectiveAt = body.effectiveAt
      ? new Date(String(body.effectiveAt))
      : new Date();
    const loanUntil = body.loanUntil ? new Date(String(body.loanUntil)) : null;
    const contractUntil = body.contractUntil
      ? new Date(String(body.contractUntil))
      : null;

    const status =
      transferType === "loan"
        ? "active_loan"
        : transferType === "loan_return"
          ? "completed"
          : "completed";

    const result = await db.$transaction(async (tx) => {
      // Close active loan when permanent/free/loan_return completes
      if (activeLoan && transferType !== "loan") {
        await tx.playerTransfer.update({
          where: { id: activeLoan.id },
          data: {
            status: transferType === "loan_return" ? "completed" : "cancelled",
            notes:
              transferType === "loan_return"
                ? [activeLoan.notes, "Closed by loan return"].filter(Boolean).join(" | ")
                : [activeLoan.notes, `Superseded by ${transferType}`]
                    .filter(Boolean)
                    .join(" | "),
            updatedAt: new Date(),
          },
        });
      }

      const transfer = await tx.playerTransfer.create({
        data: {
          playerId,
          fromTeamId,
          toTeamId,
          transferType:
            transferType === "loan_return" ? "loan_return" : transferType,
          fee: transferType === "free" ? fee || "0" : fee,
          currency,
          announcedAt,
          effectiveAt,
          window,
          season,
          contractUntil,
          loanUntil: transferType === "loan" ? loanUntil : null,
          status,
          notes,
          createdById: auth.user.sub,
          metadata: {
            fromTeamName: player.Team?.name || null,
            toTeamName: toTeam?.name || null,
          },
        },
        include: {
          FromTeam: { select: { id: true, name: true, logoUrl: true } },
          ToTeam: { select: { id: true, name: true, logoUrl: true } },
        },
      });

      // Apply roster change
      const playerUpdate: Record<string, unknown> = {
        teamId: toTeamId,
        updatedAt: new Date(),
      };
      if (toTeam?.leagueId) playerUpdate.leagueId = toTeam.leagueId;
      if (toTeam?.sportId) playerUpdate.sportId = toTeam.sportId;

      // Append to metadata.transferHistory for fan profile compatibility
      const meta =
        player.metadata && typeof player.metadata === "object"
          ? { ...(player.metadata as Record<string, unknown>) }
          : {};
      const history = Array.isArray(meta.transferHistory)
        ? [...(meta.transferHistory as unknown[])]
        : [];
      history.unshift({
        id: transfer.id,
        year: effectiveAt.getFullYear(),
        from: player.Team?.name || "Free Agent",
        to: toTeam?.name || "Free Agent",
        fee: fee || (transferType === "free" ? "Free" : null),
        type: transferType,
        at: effectiveAt.toISOString(),
      });
      meta.transferHistory = history.slice(0, 50);
      playerUpdate.metadata = meta;

      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: playerUpdate,
        include: {
          Team: { select: { id: true, name: true, logoUrl: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.user.sub,
          action: "player.transfer",
          module: "sports-data",
          targetId: playerId,
          targetType: "Player",
          oldValue: {
            teamId: fromTeamId,
            teamName: player.Team?.name || null,
          } as any,
          newValue: {
            teamId: toTeamId,
            teamName: toTeam?.name || null,
            transferId: transfer.id,
            transferType,
            fee,
          } as any,
        },
      });

      return { transfer, player: updatedPlayer };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Player transfer failed:", error);
    return NextResponse.json(
      { error: "Player transfer failed", detail: String(error) },
      { status: 500 }
    );
  }
}
